// Synchronisation avec Supabase, sans librairie : API REST + Auth par e-mail et mot de passe.
import { db, local } from './db.js';

const cfg = () => local.get('supabase', null); // { url, anon }
const session = () => local.get('session', null);
let syncing = false;
let listeners = new Set();
export const syncState = { status: 'idle', last: local.get('lastSync', null), error: null };
const emit = () => listeners.forEach(f => f({ ...syncState }));
export const onSync = fn => { listeners.add(fn); return () => listeners.delete(fn); };

export const isConfigured = () => !!cfg()?.url && !!cfg()?.anon;
export const isSignedIn = () => !!session()?.refresh_token;
export const userEmail = () => session()?.user?.email || null;

async function authFetch(path, body) {
  const c = cfg();
  const r = await fetch(`${c.url}/auth/v1/${path}`, {
    method: 'POST', headers: { apikey: c.anon, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.msg || j.error_description || j.message || `Erreur ${r.status}`);
  return j;
}

function saveSession(j) {
  local.set('session', { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Date.now() + (j.expires_in || 3600) * 1000, user: j.user });
}

// Connexion e-mail + mot de passe. Premier essai : compte créé automatiquement.
// Côté Supabase, « Confirm email » doit être désactivé (aucun e-mail n'est envoyé).
export async function signIn(email, password) {
  try {
    saveSession(await authFetch('token?grant_type=password', { email, password }));
    return 'login';
  } catch (e) {
    if (!/invalid login credentials/i.test(e.message)) throw e;
  }
  let j;
  try { j = await authFetch('signup', { email, password }); }
  catch (e) {
    if (/already registered|already exists/i.test(e.message)) throw new Error('Mot de passe incorrect pour ce compte.');
    if (/password/i.test(e.message)) throw new Error('Mot de passe trop faible : 8 caractères minimum, avec des lettres et des chiffres.');
    throw e;
  }
  if (!j.access_token) throw new Error('Compte créé mais pas activé : dans Supabase, désactive « Confirm email » (Authentication → Sign In / Providers → Email), puis reconnecte-toi.');
  saveSession(j);
  return 'signup';
}
export function signOut() { local.del('session'); local.del('lastPull'); emit(); }

async function token() {
  const s = session();
  if (!s) throw new Error('Pas connecté');
  if (Date.now() < s.expires_at - 60000) return s.access_token;
  const j = await authFetch('token?grant_type=refresh_token', { refresh_token: s.refresh_token });
  saveSession(j);
  return j.access_token;
}

async function rest(path, opts = {}) {
  const c = cfg();
  const t = await token();
  const r = await fetch(`${c.url}/rest/v1/${path}`, {
    ...opts,
    headers: { apikey: c.anon, Authorization: `Bearer ${t}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.message || `Erreur ${r.status}`); }
  return r.status === 204 ? null : r.json().catch(() => null);
}

export async function sync() {
  if (syncing || !isConfigured() || !isSignedIn() || !navigator.onLine) return;
  syncing = true; syncState.status = 'syncing'; syncState.error = null; emit();
  try {
    const uidv = session().user.id;
    // 1. envoyer
    const dirty = db.dirtyRecords();
    for (let i = 0; i < dirty.length; i += 200) {
      const chunk = dirty.slice(i, i + 200);
      await rest('records?on_conflict=user_id,col,id', {
        method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify(chunk.map(r => ({ user_id: uidv, col: r.col, id: r.id, data: r.data, updated_at: r.updated_at, deleted: r.deleted }))),
      });
      db.markClean(chunk.map(r => r.k));
    }
    // 2. recevoir (dont les données Santé envoyées par le Raccourci)
    const since = local.get('lastPull', '1970-01-01T00:00:00Z');
    const rows = await rest(`records?select=col,id,data,updated_at,deleted,server_ts&server_ts=gt.${encodeURIComponent(since)}&order=server_ts.asc&limit=5000`);
    if (rows?.length) {
      db.applyRemote(rows);
      local.set('lastPull', rows[rows.length - 1].server_ts);
    }
    syncState.status = 'ok'; syncState.last = new Date().toISOString(); local.set('lastSync', syncState.last);
  } catch (e) {
    syncState.status = 'error'; syncState.error = e.message;
  } finally { syncing = false; emit(); }
}

// Jeton du Raccourci : généré ici, montré une seule fois, stocké haché côté serveur.
export async function createShortcutToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const tokenStr = 'nm_' + [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(tokenStr)))].map(b => b.toString(16).padStart(2, '0')).join('');
  await rest(`ingest_tokens?user_id=eq.${session().user.id}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } }).catch(() => {});
  await rest('ingest_tokens', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ user_id: session().user.id, token_hash: hash }) });
  return tokenStr;
}
export const ingestUrl = () => cfg() ? `${cfg().url}/functions/v1/health-ingest` : '';

let timer = null;
export function startAutoSync() {
  sync();
  db.subscribe(() => { clearTimeout(timer); timer = setTimeout(sync, 2500); });
  window.addEventListener('online', sync);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') sync(); });
  setInterval(sync, 5 * 60 * 1000);
}
