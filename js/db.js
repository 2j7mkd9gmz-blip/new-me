// Stockage local d'abord : tout est lu depuis la mémoire, écrit dans IndexedDB,
// puis marqué « à synchroniser » pour Supabase.

const DB_NAME = 'newme';
const STORE = 'records';
let idb = null;
const cache = new Map(); // "col/id" -> record
const listeners = new Set();
let notifyQueued = false;

function openIdb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const s = req.result.createObjectStore(STORE, { keyPath: 'k' });
      s.createIndex('dirty', 'dirty');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(mode = 'readonly') { return idb.transaction(STORE, mode).objectStore(STORE); }

function persist(rec) {
  if (!idb) return;
  try { tx('readwrite').put(rec); } catch (e) { console.warn('persist', e); }
}

function notify() {
  if (notifyQueued) return;
  notifyQueued = true;
  queueMicrotask(() => { notifyQueued = false; listeners.forEach(fn => fn()); });
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const db = {
  version: 0,
  async init() {
    try {
      idb = await openIdb();
      const all = await new Promise((res, rej) => { const r = tx().getAll(); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
      all.forEach(r => cache.set(r.k, r));
    } catch (e) {
      console.warn('IndexedDB indisponible, données en mémoire seulement', e);
    }
  },
  get(col, id) {
    const r = cache.get(`${col}/${id}`);
    return r && !r.deleted ? r.data : null;
  },
  all(col) {
    const out = [];
    for (const r of cache.values()) if (r.col === col && !r.deleted) out.push({ id: r.id, ...r.data });
    return out;
  },
  put(col, id, data) {
    const rec = { k: `${col}/${id}`, col, id, data, updated_at: new Date().toISOString(), dirty: 1, deleted: false };
    cache.set(rec.k, rec); persist(rec); db.version++; notify();
    return data;
  },
  patch(col, id, partial) {
    return db.put(col, id, { ...(db.get(col, id) || {}), ...partial });
  },
  del(col, id) {
    const k = `${col}/${id}`;
    const prev = cache.get(k);
    if (!prev) return;
    const rec = { ...prev, deleted: true, dirty: 1, updated_at: new Date().toISOString() };
    cache.set(k, rec); persist(rec); db.version++; notify();
  },
  // --- utilisé par la synchro ---
  dirtyRecords() { return [...cache.values()].filter(r => r.dirty); },
  markClean(keys) {
    keys.forEach(k => { const r = cache.get(k); if (r) { r.dirty = 0; persist(r); } });
  },
  applyRemote(rows) {
    let changed = false;
    for (const row of rows) {
      const k = `${row.col}/${row.id}`;
      const local = cache.get(k);
      if (local && local.dirty && local.updated_at > row.updated_at) continue;
      if (local && !local.dirty && local.updated_at >= row.updated_at) continue;
      const rec = { k, col: row.col, id: row.id, data: row.data, updated_at: row.updated_at, dirty: 0, deleted: !!row.deleted };
      cache.set(k, rec); persist(rec); changed = true;
    }
    if (changed) { db.version++; notify(); }
  },
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  exportAll() { return [...cache.values()]; },
};

// Réglages strictement locaux (jamais synchronisés) : clé API Claude, session, config.
export const local = {
  get(k, d = null) { try { const v = localStorage.getItem('nm-' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('nm-' + k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem('nm-' + k); } catch {} },
};
