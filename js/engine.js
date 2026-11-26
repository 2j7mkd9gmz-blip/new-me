// Moteur du programme : planning de la semaine, cycles, reprise du mollet, progression.
import { PROFILE, SESSIONS, EXERCISES } from './data/program.js';
import { db } from './db.js';

// ---------- dates (toujours en heure locale) ----------
export const pad = n => String(n).padStart(2, '0');
export const keyOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d, 12); };
export const todayKey = () => keyOf(new Date());
export const addDays = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return keyOf(d); };
export const dow = k => { const g = parseKey(k).getDay(); return g === 0 ? 7 : g; }; // 1 = lundi
export const mondayOf = k => addDays(k, 1 - dow(k));
export const daysBetween = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 86400000);

const DAYS = ['', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
export const dayName = k => DAYS[dow(k)];
const MONTHS_S = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
export const fmtDate = (k, opts = {}) => {
  const d = parseKey(k);
  const m = (opts.short ? MONTHS_S : MONTHS)[d.getMonth()];
  return `${opts.noDay ? '' : DAYS[dow(k)] + ' '}${d.getDate()} ${m}`.trim();
};

// ---------- cycles de 4 semaines ----------
export function cycleInfo(k) {
  const diff = daysBetween(PROFILE.programStart, k);
  if (diff < 0) return { started: false, weekIndex: -1, cycle: 0, week: 0, deload: false };
  const weekIndex = Math.floor(diff / 7);
  const week = (weekIndex % 4) + 1;
  return {
    started: true, weekIndex, cycle: Math.floor(weekIndex / 4) + 1, week,
    deload: week === 4,
    cycleStart: addDays(PROFILE.programStart, Math.floor(weekIndex / 4) * 28),
    cycleEnd: addDays(PROFILE.programStart, Math.floor(weekIndex / 4) * 28 + 27),
  };
}

// ---------- mollet ----------
export function calfState(k = todayKey()) {
  const s = db.get('calf', 'state') || { phase: 4, since: PROFILE.calfRehabStart };
  const logs = db.all('calfLog').sort((a, b) => (a.date < b.date ? 1 : -1));
  const weekAgo = addDays(k, -7);
  const recentPain = logs.filter(l => l.date > weekAgo && l.date <= k && ((l.pain ?? 0) >= 1 || l.tight));
  const last = logs[0];
  const alert = last && last.date >= addDays(k, -1) && ((last.pain ?? 0) >= 3 || last.tight);
  return { phase: s.phase, since: s.since, zeroPainWeek: recentPain.length === 0, alert, last, logs };
}
export const gateOk = (gate, phase) => !gate || phase >= gate;

// ---------- semaine type ----------
const TEMPLATE = {
  1: { work: { start: '7h45' }, basket: { kind: 'training', time: '19h00', end: '20h30' } },
  2: { work: { start: '6h30-7h' } },
  3: { work: { start: '6h30-7h' } },
  4: { basket: { kind: 'training', time: '20h20', end: '22h00' } },
  5: { basket: { kind: 'training', time: '20h00', end: '22h00' } },
  6: {},
  7: {},
};

function basketOf(k) {
  const m = db.get('matches', k);
  if (m && !m.deleted) return { kind: 'match', time: m.time || '', opponent: m.opponent || '', home: m.home };
  const off = db.get('trainingOff', k);
  if (off) return null;
  const t = TEMPLATE[dow(k)].basket;
  return t ? { ...t } : null;
}

export function weekPlan(anyKey) {
  const mon = mondayOf(anyKey);
  const days = Array.from({ length: 7 }, (_, i) => addDays(mon, i));
  const calf = calfState(anyKey);
  const b = {};
  [addDays(mon, -1), ...days, addDays(mon, 7)].forEach(k => { b[k] = basketOf(k); });
  const isMatch = k => b[k]?.kind === 'match';
  const canLegs = k => !b[k] && !b[addDays(k, 1)] && !isMatch(addDays(k, -1));

  const plan = Object.fromEntries(days.map(k => [k, {
    key: k, dow: dow(k), work: TEMPLATE[dow(k)].work || null, basket: b[k],
    afterMatch: isMatch(addDays(k, -1)), session: null, sauna: false, notes: [],
  }]));

  // Séance A (jambes) : mardi par défaut, déplacée si besoin
  let aDay = null;
  for (const d of [2, 3, 6, 7]) { const k = days[d - 1]; if (canLegs(k)) { aDay = k; break; } }
  if (aDay) {
    plan[aDay].session = 'A'; plan[aDay].sauna = true;
    if (dow(aDay) !== 2) plan[aDay].notes.push('Séance A déplacée ici : jamais de jambes la veille d’un basket.');
  } else {
    const fallback = [days[1], days[2]].find(k => !isMatch(k));
    if (fallback) { plan[fallback].session = 'A_light'; plan[fallback].notes.push('Basket ou match le lendemain : version sans jambes.'); }
  }

  // Séance B (haut du corps) : jeudi matin par défaut
  const bDay = [days[3], days[4], days[2]].find(k => !isMatch(k) && !plan[k].session && !plan[k].afterMatch);
  if (bDay) {
    plan[bDay].session = 'B';
    if (dow(bDay) !== 4) plan[bDay].notes.push('Séance B déplacée à cause du match.');
    if (calf.phase < 3 && b[bDay]) plan[bDay].notes.push('Pendant la reprise, tu peux sauter la muscu du matin si la journée est trop chargée.');
  }

  // Séance C (terrain) : samedi sans match le week-end
  const sat = days[5];
  const weekendMatch = isMatch(days[5]) || isMatch(days[6]);
  const legsOnWeekend = ['A'].includes(plan[days[5]].session) || ['A'].includes(plan[days[6]].session);
  if (!weekendMatch && !legsOnWeekend && canLegs(sat)) {
    if (calf.phase >= 3 && calf.zeroPainWeek) plan[sat].session = 'C';
    else plan[sat].notes.push('Séance C bloquée : il faut la phase 3 de reprise et zéro douleur sur 7 jours.');
  }

  days.forEach(k => {
    const p = plan[k];
    if (p.afterMatch) p.notes.push('Lendemain de match : repos actif, balade tranquille. Pas toute la journée sous la couette.');
    if (dow(k) === 3 && !p.session) p.saunaOptional = true;
    if (isMatch(k) && calf.phase < 3) p.notes.push('Phase de reprise : pas de match avant la semaine 3 et le feu vert du physio.');
    if (isMatch(k) && calf.phase === 3 && !calf.zeroPainWeek) p.notes.push('Douleur cette semaine : pas de match tant que ce n’est pas zéro.');
  });
  return plan;
}

export function dayPlan(k = todayKey()) {
  const p = weekPlan(k)[k];
  const d = dow(k);
  const basketDay = !!p.basket;
  const work = !!p.work;
  return {
    ...p,
    cycle: cycleInfo(k),
    kcal: basketDay ? PROFILE.kcalBasket : PROFILE.kcalRest,
    basketDay,
    stepsGoal: work ? null : PROFILE.stepsGoal,
    bedTime: [7, 1, 2].includes(d) ? '21h30' : [3].includes(d) ? '21h30' : null,
    bedLimit: [7, 1, 2, 3].includes(d) ? '22h30' : null,
    wake: [1, 2, 3].includes(d) ? '5h00' : null,
    mealPrep: d === 7 || d === 3,
    weighIn: [1, 3, 5].includes(d),
  };
}

// ---------- logs de séances ----------
export function sessionLogs() {
  return db.all('workouts').filter(w => !w.deleted).sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function exerciseHistory(exId) {
  const out = [];
  for (const w of sessionLogs()) {
    const e = w.exercises?.[exId];
    if (e && e.sets?.some(s => s.done)) out.push({ date: w.date, session: w.session, sets: e.sets.filter(s => s.done) });
  }
  return out;
}

const round25 = x => Math.round(x / 0.5) * 0.5;

// Double progression : la consigne du préparateur pour la prochaine fois.
export function suggestion(exId, k = todayKey()) {
  const ex = EXERCISES[exId];
  const cyc = cycleInfo(k);
  const sets = cyc.deload ? Math.max(1, Math.ceil(ex.sets / 2)) : ex.sets;
  const [lo, hi] = ex.reps;
  const hist = exerciseHistory(exId);
  const base = { sets, lo, hi, deload: cyc.deload };

  if (ex.type === 'explosive' || ex.type === 'cardio') {
    return { ...base, mode: 'quality', weight: null, text: cyc.deload
      ? 'Semaine allégée : moitié des séries, même intensité.'
      : 'Qualité maximale. Récup complète. Tu t’arrêtes dès que la vitesse baisse.' };
  }
  if (!hist.length) {
    return { ...base, mode: 'test', weight: null, text: ex.bodyweight
      ? 'Semaine test : fais tes séries au poids du corps et note les reps à RPE 7 (3 en réserve).'
      : 'Semaine test : monte par paliers, garde la charge où il te reste 3 reps propres (RPE 7). Note-la.' };
  }
  const last = hist[0].sets;
  const weights = last.map(s => Number(s.kg) || 0);
  const w = Math.max(...weights);
  const reps = last.map(s => Number(s.reps) || 0);
  const rpes = last.map(s => Number(s.rpe) || 0).filter(Boolean);
  const maxRpe = rpes.length ? Math.max(...rpes) : 8;
  const allTop = reps.length >= Math.min(ex.sets, 2) && reps.every(r => r >= hi) && maxRpe <= 8;
  const tooHard = reps.some(r => r < lo) || maxRpe >= 9.5;
  const inc = ex.increment || 2.5;
  const unit = ex.unit === 's' ? 's' : ex.unit === 'm' ? 'm' : 'reps';

  if (cyc.deload) return { ...base, mode: 'deload', weight: w || null, text: `Semaine allégée : ${sets} séries au lieu de ${ex.sets}, même charge${w ? ` (${w} kg)` : ''}. On recharge les batteries.` };

  if (ex.type === 'hold') {
    if (allTop) return { ...base, mode: 'up', weight: null, text: `Tenu ${hi} s partout : passe à la version plus dure (jambe tendue sur le banc) ou ajoute 5 s.` };
    return { ...base, mode: 'keep', weight: null, text: `Vise +5 s par série jusqu’à ${hi} s.` };
  }
  if (ex.bodyweight && !w) {
    if (allTop) return { ...base, mode: 'up', weight: inc, text: `${hi} reps propres partout : ajoute un lest de ${inc} kg.` };
    if (tooHard) return { ...base, mode: 'down', weight: null, text: ex.alt ? `Trop dur : passe sur ${ex.alt}.` : 'Trop dur : réduis l’amplitude ou utilise un élastique d’assistance.' };
    return { ...base, mode: 'keep', weight: null, text: `Même version, ajoute 1 ${unit === 'reps' ? 'rep' : unit} par série (objectif ${hi}).` };
  }
  if (allTop) return { ...base, mode: 'up', weight: round25(w + inc), text: `Haut de fourchette validé à RPE ≤ 8 : passe à ${round25(w + inc)} kg (+${inc}).` };
  if (tooHard) {
    const nw = round25(Math.max(0, w - inc));
    return { ...base, mode: 'down', weight: nw, text: `Trop lourd la dernière fois (RPE ${maxRpe}). On allège à ${nw} kg et on reconstruit proprement.` };
  }
  if (maxRpe >= 9) return { ...base, mode: 'keep', weight: w, text: `Même charge (${w} kg). Vise les mêmes reps mais plus propres, RPE 8.` };
  return { ...base, mode: 'keep', weight: w, text: `Même charge (${w} kg). Ajoute 1 rep par série jusqu’à ${hi}.` };
}

// ---------- résolution de séance ----------
export function resolveSession(id, k = todayKey()) {
  const s = SESSIONS[id];
  const calf = calfState(k);
  const blocks = s.blocks.map(b => {
    if (b.choose) {
      const unlocked = b.choose.unlocked.every(e => gateOk(EXERCISES[e].gate, calf.phase));
      return { label: b.label, items: unlocked ? b.choose.unlocked : b.choose.locked, note: unlocked ? null : 'Sauts bloqués pendant la reprise du mollet : lancer de médecine-ball à la place.' };
    }
    return { label: b.label, items: b.items, locked: b.items.filter(e => !gateOk(EXERCISES[e].gate, calf.phase)) };
  });
  return { ...s, blocks, calf };
}

// ---------- poids ----------
export function weightEntries() {
  return db.all('weight').filter(w => !w.deleted && w.kg).sort((a, b) => (a.date < b.date ? -1 : 1));
}
export function weeklyAverages() {
  const by = {};
  weightEntries().forEach(w => { const m = mondayOf(w.date); (by[m] ||= []).push(Number(w.kg)); });
  return Object.entries(by).sort().map(([monday, arr]) => ({ monday, avg: arr.reduce((a, b) => a + b, 0) / arr.length, n: arr.length }));
}
export function targetWeight(k) {
  const pts = [[PROFILE.startDate, PROFILE.startWeight], [PROFILE.milestone.date, PROFILE.milestone.weight], [PROFILE.goalDate, PROFILE.goalWeight]];
  if (k <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (k <= pts[i][0]) {
      const t = daysBetween(pts[i - 1][0], k) / daysBetween(pts[i - 1][0], pts[i][0]);
      return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t;
    }
  }
  return PROFILE.goalWeight;
}

// ---------- sommeil ----------
export function sleepMinutes(bed, wake) {
  if (!bed || !wake) return null;
  const [bh, bm] = bed.split(':').map(Number); const [wh, wm] = wake.split(':').map(Number);
  let m = (wh * 60 + wm) - (bh * 60 + bm);
  if (m <= 0) m += 1440;
  return m;
}
export const fmtDuration = m => m == null ? '—' : `${Math.floor(m / 60)}h${pad(Math.round(m % 60))}`;
