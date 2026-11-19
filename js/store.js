// Sauvegarde locale sur le téléphone (localStorage).
import { DEFAULT_SHOPPING, PROFILE } from './data.js';
import { uid } from './util.js';

const KEY = 'newme-v1';

const defaults = () => ({
  version: 1,
  days: {},        // 'YYYY-MM-DD' -> { checks:{}, food:[], steps, sleep:{bed,wake} }
  weights: [],     // { date, kg }
  workouts: [],    // { id, date, session, sets:{ exId:[{kg,reps,done}] } }
  active: null,    // séance en cours
  matches: {},     // lundi de la semaine -> 'sat' | 'sun' | 'none'
  fastfood: {},    // lundi de la semaine -> true
  shopping: DEFAULT_SHOPPING.map(([cat, name]) => ({ id: uid(), cat, name, done: false })),
  calf: { stage: 1, stageStart: PROFILE.rehabStart, physioOK: false, logs: [], history: [] },
  prefs: { rest: 90 },
});

export let state = defaults();

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw);
      const d = defaults();
      state = { ...d, ...data, calf: { ...d.calf, ...data.calf }, prefs: { ...d.prefs, ...data.prefs } };
    }
  } catch (e) {
    state = defaults();
  }
  try { navigator.storage?.persist?.(); } catch (e) { /* rien */ }
  return state;
}

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* stockage plein ou bloqué */ }
}

export function day(date) {
  if (!state.days[date]) state.days[date] = { checks: {}, food: [], steps: null, sleep: null };
  return state.days[date];
}
export const peekDay = (date) => state.days[date] || { checks: {}, food: [], steps: null, sleep: null };

export function exportJSON() { return JSON.stringify(state, null, 2); }

export function importJSON(text) {
  const data = JSON.parse(text);
  if (!data || typeof data !== 'object' || !data.days) throw new Error('Fichier invalide');
  localStorage.setItem(KEY, JSON.stringify(data));
  load();
}

export function resetAll() {
  state = defaults();
  save();
}
