import { html, useState, useEffect } from '../../vendor/preact-htm.js';
import { db, local } from '../db.js';
import { Icon, toast } from '../ui.js';
import { isConfigured, isSignedIn, userEmail, signIn, signOut, sync, onSync, syncState, createShortcutToken, ingestUrl } from '../sync.js';
import { downloadIcs } from '../reminders.js';
import { back } from '../nav.js';

export function Settings() {
  const [theme, setTheme] = useState(local.get('theme-pref', 'auto'));
  const applyTheme = t => {
    setTheme(t); local.set('theme-pref', t);
    try { t === 'auto' ? localStorage.removeItem('nm-theme') : localStorage.setItem('nm-theme', t); } catch {}
    if (t === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
  };
  const [key, setKey] = useState(local.get('claudeKey', '') ? '••••••••••••' : '');
  const [standUp, setStandUp] = useState(false);

  return html`<div class="screen stack gap-24">
    <header class="stack gap-12">
      <button class="row gap-4 small muted" onClick=${back}><${Icon} name="left" size=${16} /> Retour</button>
      <h1 class="title-xl">Réglages</h1>
    </header>

    <section class="stack gap-8">
      <div class="section-head"><h2 class="h2">Apparence</h2></div>
      <div class="seg">${[['auto', 'Auto'], ['dark', 'Sombre'], ['light', 'Clair']].map(([v, l]) => html`<button class=${theme === v ? 'on' : ''} onClick=${() => applyTheme(v)}>${l}</button>`)}</div>
    </section>

    <${SyncSection} />

    <section class="stack gap-8">
      <div class="section-head"><h2 class="h2">Clé API Claude</h2></div>
      <div class="card stack gap-12">
        <p class="small muted" style="margin:0">Pour « décris ton repas » et le bilan de cycle. Payée à l’usage sur console.anthropic.com (quelques centimes par mois pour toi). Gardée seulement sur ce téléphone, jamais synchronisée.</p>
        <input class="input" type="password" autocomplete="off" placeholder="sk-ant-…" value=${key} onFocus=${() => key.startsWith('•') && setKey('')} onInput=${e => setKey(e.target.value)} />
        <div class="row gap-8">
          <button class="btn primary grow" onClick=${() => { if (!key.trim() || key.startsWith('•')) return; local.set('claudeKey', key.trim()); setKey('••••••••••••'); toast('Clé enregistrée sur ce téléphone'); }}>Enregistrer</button>
          ${local.get('claudeKey') && html`<button class="btn ghost" onClick=${() => { local.del('claudeKey'); setKey(''); toast('Clé supprimée'); }}>Supprimer</button>`}
        </div>
      </div>
    </section>

    <section class="stack gap-8">
      <div class="section-head"><h2 class="h2">Rappels</h2></div>
      <div class="card stack gap-12">
        <p class="small muted" style="margin:0">Coucher, marche après midi, mobilité, meal prep dimanche et mercredi, pesée. Un fichier s’ouvre : touche « Tout ajouter » et les rappels arrivent dans ton app Calendrier, avec alerte.</p>
        <button class="row gap-12" onClick=${() => setStandUp(!standUp)}><span class=${`check ${standUp ? 'on' : ''}`}><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span><span class="small">Inclure « lève-toi toutes les 45 min » (lun-mer)</span></button>
        <button class="btn primary block" onClick=${() => downloadIcs({ standUp })}><${Icon} name="calendar" size=${18} /> Ajouter les rappels au calendrier</button>
      </div>
    </section>

    <section class="stack gap-8">
      <div class="section-head"><h2 class="h2">Données</h2></div>
      <div class="card stack gap-12">
        <button class="btn ghost block" onClick=${() => {
          const blob = new Blob([JSON.stringify(db.exportAll(), null, 1)], { type: 'application/json' });
          const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `new-me-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`; a.click();
        }}>Exporter une sauvegarde</button>
      </div>
    </section>
    <p class="tiny faint center">New Me · tout est stocké sur ton téléphone d’abord.</p>
  </div>`;
}

function SyncSection() {
  const [, refresh] = useState(0);
  const [st, setSt] = useState({ ...syncState });
  useEffect(() => onSync(s => setSt(s)), []);
  const cfg = local.get('supabase', null);
  const [url, setUrl] = useState(cfg?.url || '');
  const [anon, setAnon] = useState(cfg?.anon || '');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [token, setToken] = useState(null);

  const run = async fn => { setBusy(true); setErr(null); try { await fn(); } catch (e) { setErr(e.message); } setBusy(false); refresh(x => x + 1); };

  if (!isConfigured()) return html`<section class="stack gap-8">
    <div class="section-head"><h2 class="h2">Synchronisation</h2></div>
    <div class="card stack gap-12">
      <p class="small muted" style="margin:0">Colle l’URL et la clé « anon » de ton projet Supabase (Settings → API). Voir le guide de mise en ligne.</p>
      <input class="input" placeholder="https://xxxx.supabase.co" value=${url} onInput=${e => setUrl(e.target.value.trim())} />
      <input class="input" placeholder="Clé anon (eyJ…)" value=${anon} onInput=${e => setAnon(e.target.value.trim())} />
      ${err && html`<div class="small danger">${err}</div>`}
      <button class="btn primary block" onClick=${() => { const u = url.trim().replace(/\/(rest|auth|functions)\/v1.*$/, '').replace(/\/+$/, ''); if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(u)) { setErr('URL attendue : https://xxxx.supabase.co'); return; } if (anon.trim().length < 20) { setErr('Colle la clé anon (ou publishable) en entier.'); return; } local.set('supabase', { url: u, anon: anon.trim() }); refresh(x => x + 1); }}>Enregistrer</button>
    </div>
  </section>`;

  if (!isSignedIn()) return html`<section class="stack gap-8">
    <div class="section-head"><h2 class="h2">Connexion</h2></div>
    <div class="card stack gap-12">
      <p class="small muted" style="margin:0">Choisis un mot de passe (8 caractères minimum). La première fois, ton compte est créé automatiquement. Ton iPhone peut l’enregistrer dans ton trousseau.</p>
      <input class="input" type="email" autocomplete="username" placeholder="ton@email.ch" value=${email} onInput=${e => { setEmail(e.target.value.trim()); setErr(null); }} />
      <input class="input" type="password" autocomplete="current-password" placeholder="Mot de passe" value=${pass} onInput=${e => { setPass(e.target.value); setErr(null); }} />
      ${err && html`<div class="small danger">${err}</div>`}
      <button class="btn primary block" disabled=${busy} onClick=${() => run(async () => {
        if (!email.includes('@')) throw new Error('E-mail invalide.');
        if (pass.length < 8) throw new Error('Mot de passe trop court : 8 caractères minimum.');
        const r = await signIn(email, pass);
        setPass('');
        toast(r === 'signup' ? 'Compte créé. Synchro en cours.' : 'Connecté. Synchro en cours.');
        sync();
      })}>${busy ? 'Connexion…' : 'Se connecter'}</button>
      <button class="small muted" onClick=${() => { local.del('supabase'); refresh(x => x + 1); }}>Modifier la configuration Supabase</button>
    </div>
  </section>`;

  return html`<section class="stack gap-8">
    <div class="section-head"><h2 class="h2">Synchronisation</h2><span class=${`tag ${st.status === 'error' ? 'danger' : 'accent'}`}>${st.status === 'syncing' ? 'En cours' : st.status === 'error' ? 'Erreur' : 'Active'}</span></div>
    <div class="card stack gap-12">
      <div class="small">${userEmail()}</div>
      <div class="tiny muted">${st.last ? `Dernière synchro : ${new Date(st.last).toLocaleString('fr-CH', { dateStyle: 'short', timeStyle: 'short' })}` : 'Pas encore synchronisé'}</div>
      ${st.error && html`<div class="small danger">${st.error}</div>`}
      <div class="row gap-8">
        <button class="btn ghost grow" onClick=${() => sync()}><${Icon} name="refresh" size=${17} /> Synchroniser</button>
        <button class="btn ghost" onClick=${() => { signOut(); refresh(x => x + 1); }}>Déconnexion</button>
      </div>
    </div>
    <div class="section-head mt-16"><h2 class="h2">Raccourci Santé</h2></div>
    <div class="card stack gap-12">
      <p class="small muted" style="margin:0">Génère ton jeton secret pour le Raccourci Apple. Il n’est montré qu’une fois. En regénérer un désactive l’ancien.</p>
      ${token ? html`<div class="stack gap-8 fade-in">
          <div class="tiny muted">Adresse</div>
          <code class="small" style="word-break:break-all;background:var(--card-2);padding:10px 12px;border-radius:var(--r-sm)">${ingestUrl()}</code>
          <div class="tiny muted">Jeton (à coller dans le Raccourci)</div>
          <code class="small" style="word-break:break-all;background:var(--card-2);padding:10px 12px;border-radius:var(--r-sm)">${token}</code>
          <button class="btn primary block" onClick=${async () => { try { await navigator.clipboard.writeText(token); toast('Jeton copié'); } catch { toast('Copie impossible, sélectionne-le à la main'); } }}>Copier le jeton</button>
        </div>`
        : html`<button class="btn primary block" disabled=${busy} onClick=${() => run(async () => setToken(await createShortcutToken()))}><${Icon} name="key" size=${17} /> Générer le jeton</button>`}
      ${err && html`<div class="small danger">${err}</div>`}
    </div>
  </section>`;
}
