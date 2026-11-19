// New Me : l'app. Rendu en HTML simple + délégation d'événements.
import * as U from './util.js';
import { state, load, save, day, peekDay, exportJSON, importJSON, resetAll } from './store.js';
import * as D from './data.js';

load();

const $ = (s, r = document) => r.querySelector(s);
let viewDate = U.today();
let foodDate = U.today();
let calfCtx = 'basket';
let lastRoute = '';

// ================= Routeur =================
const TITLES = {
  today: 'New Me', poids: 'Poids', muscu: 'Muscu', food: 'Bouffe', plus: 'Plus',
  courses: 'Courses', sommeil: 'Sommeil', pas: 'Pas', mollet: 'Mollet', rappels: 'Rappels', reglages: 'Réglages',
};
const TAB = { courses: 'plus', sommeil: 'plus', pas: 'plus', mollet: 'plus', rappels: 'plus', reglages: 'plus' };

function parseHash() {
  const h = location.hash.replace(/^#\/?/, '') || 'today';
  const [name, q] = h.split('?');
  return { name: TITLES[name] ? name : 'today', params: Object.fromEntries(new URLSearchParams(q || '')) };
}

function render() {
  const { name, params } = parseHash();
  const VIEWS = { today: vToday, poids: vPoids, muscu: vMuscu, food: vFood, plus: vPlus, courses: vCourses, sommeil: vSommeil, pas: vPas, mollet: vMollet, rappels: vRappels, reglages: vReglages };
  if (name === 'mollet' && params.ctx && lastRoute !== location.hash) calfCtx = params.ctx;
  $('#view').innerHTML = VIEWS[name](params);
  $('#title').textContent = name === 'muscu' && state.active ? 'Séance en cours' : TITLES[name];
  $('#topright').innerHTML = `<span class="chip ${state.calf.stage >= 4 ? 'good' : 'acc'}">${state.calf.stage >= 4 ? 'Mollet OK' : 'Mollet · ét. ' + state.calf.stage}</span>`;
  const tab = TAB[name] || name;
  document.querySelectorAll('#tabbar a').forEach((a) => a.classList.toggle('on', a.dataset.tab === tab));
  if (lastRoute !== location.hash) window.scrollTo(0, 0);
  lastRoute = location.hash;
}
window.addEventListener('hashchange', render);

function toast(msg, ms = 2600) {
  const t = $('#toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { t.hidden = true; }, ms);
}
const commit = () => { save(); render(); };

// ================= Helpers =================
const kcalOf = (dd) => dd.food.reduce((s, f) => s + (f.kcal || 0), 0);
const protOf = (dd) => dd.food.reduce((s, f) => s + (f.prot || 0), 0);
const pct = (v, max) => Math.max(0, Math.min(100, Math.round((v / max) * 100)));
const weekWeights = (date) => state.weights.filter((w) => U.monday(w.date) === U.monday(date));
const sortedWeights = () => [...state.weights].sort((a, b) => a.date.localeCompare(b.date));
const jumpsOK = () => state.calf.stage >= 3 && D.calfPainFree(state, 7, U.today());

function weeklyAverages() {
  const m = {};
  for (const w of state.weights) (m[U.monday(w.date)] ||= []).push(w.kg);
  return Object.keys(m).sort().map((k) => ({ mon: k, avg: U.avg(m[k]), n: m[k].length }));
}

function weekComment(loss, first) {
  if (loss == null) return '';
  if (first && loss > 0 && loss <= 2.2) return 'Normal la 1re semaine, c’est surtout de l’eau. Ne t’emballe pas.';
  if (loss > 1.0) return 'Trop vite. Mange un peu plus, sinon tu vas craquer comme avec le jeûne.';
  if (loss >= 0.5) return 'Pile dans le rythme. Continue exactement comme ça.';
  if (loss >= 0.2) return 'Ça descend, mais mollo. Surveille les portions et le grignotage.';
  if (loss > -0.2) return 'Ça stagne. Sois honnête sur ce que tu manges vraiment.';
  return 'Ça remonte. Pas de panique, on se reprend cette semaine.';
}

const PUNCH = [
  'Pas de magie : 3 repas, une collation, au lit à l’heure.',
  'Le chiffre d’un jour, on s’en fout. La moyenne de la semaine, non.',
  'T’as pas besoin de motivation, t’as besoin de faire la case suivante.',
  'Le lit c’est pour dormir. L’ordi, c’est sur la table.',
  'Un fast-food par semaine. Un. Pas trois « petits ».',
  'Tu veux sauter plus haut ? Commence par te coucher plus tôt.',
  'Mollet qui tire = on recule. L’ego reste au vestiaire.',
];

// ================= Aujourd'hui =================
function vToday() {
  const d = viewDate;
  const isToday = d === U.today();
  const p = D.dayPlan(d, state);
  const dd = peekDay(d);
  const mon = U.monday(d);
  let h = '';

  h += `<div class="datenav"><button data-act="dayNav" data-n="-1" aria-label="Jour précédent">‹</button>
    <div style="text-align:center"><b>${isToday ? 'Aujourd’hui' : U.fmtDay(d)}</b><div class="small muted">${isToday ? U.fmtDay(d) : `<a href="#/today" data-act="dayNav" data-n="0">Revenir à aujourd’hui</a>`}</div></div>
    <button data-act="dayNav" data-n="1" aria-label="Jour suivant">›</button></div>`;
  h += `<div class="row wrap" style="justify-content:center;gap:6px;margin:8px 0">${(p.tags.length ? p.tags : ['Off']).map((t) => `<span class="chip ${/Basket|Muscu/.test(t) ? 'acc' : ''}">${t}</span>`).join('')}<span class="chip">${p.kcal} kcal</span></div>`;

  if (isToday) h += banners(p, dd);
  for (const n of p.notes) h += `<div class="card warn small">⚠️ ${n}</div>`;

  // Match du week-end (de jeudi à dimanche)
  if ([4, 5, 6, 0].includes(p.w)) {
    const m = state.matches[mon] || 'none';
    h += `<div class="card"><div class="row between"><b>Match ce week-end ?</b>${m !== 'none' && !D.matchAllowed(state, m === 'sat' ? U.addDays(mon, 5) : U.addDays(mon, 6)) ? '<span class="chip bad">Pas pour toi</span>' : ''}</div>
      <div class="seg" style="margin-top:8px">${[['sat', 'Samedi'], ['sun', 'Dimanche'], ['none', 'Pas de match']].map(([v, l]) => `<button class="${m === v ? 'on' : ''}" data-act="setMatch" data-mon="${mon}" data-v="${v}">${l}</button>`).join('')}</div></div>`;
  }

  // Tâches
  const calfDay = p.basket || p.session || p.isMatchDay;
  const tasks = [...p.tasks];
  if (calfDay) tasks.splice(tasks.length - 1, 0, { id: 'calf', icon: '🦵', text: 'Note ton mollet (0-10)', sub: 'Après la séance, 5 secondes', link: '#/mollet' });
  const done = tasks.filter((t) => dd.checks[t.id]).length;
  h += `<h2>Programme · ${done}/${tasks.length}</h2><div class="card tight">`;
  for (const t of tasks) {
    const on = !!dd.checks[t.id];
    h += `<div class="item ${on ? 'done' : ''}"><button class="check ${on ? 'on' : ''}" data-act="check" data-date="${d}" data-id="${t.id}" aria-label="Cocher">✓</button>
      <span class="ico">${t.icon}</span><div class="txt"><b>${t.text}</b>${t.sub ? `<div class="sub">${t.sub}</div>` : ''}</div>${t.link ? `<a class="go" href="${t.link}">›</a>` : ''}</div>`;
  }
  h += `</div>`;

  // Repas
  const kcal = kcalOf(dd), prot = protOf(dd);
  h += `<h2>Repas prévus</h2><div class="card tight">`;
  for (const m of p.meals) {
    const key = (dd.swap && dd.swap[m.id]) || m.key;
    const f = D.FOOD[key];
    const on = !!dd.checks[m.id];
    h += `<div class="item ${on ? 'done' : ''}"><button class="check ${on ? 'on' : ''}" data-act="meal" data-date="${d}" data-id="${m.id}" data-key="${key}" aria-label="Mangé">✓</button>
      <div class="txt"><div class="sub">${m.label}</div><b>${f.name}</b><div class="sub">≈ ${f.kcal} kcal · ${f.prot} g prot${m.extra ? ' · ' + m.extra : ''}</div></div>
      ${on ? '' : `<button class="x" data-act="swapMeal" data-date="${d}" data-id="${m.id}" data-key="${key}" aria-label="Changer">↻</button>`}</div>`;
  }
  h += `</div>`;

  // Chiffres du jour
  const goalSteps = p.stepsGoal;
  const lastNight = dd.sleep && U.sleepMinutes(dd.sleep.bed, dd.sleep.wake);
  h += `<h2>Chiffres du jour</h2><div class="grid2">
    <a class="stat" href="#/food"><div class="k">Calories</div><div class="v ${kcal > p.kcal + 150 ? 'bad' : ''}">${kcal}<span class="small muted"> / ${p.kcal}</span></div><div class="bar ${kcal > p.kcal + 150 ? 'bad' : ''}"><i style="width:${pct(kcal, p.kcal)}%"></i></div></a>
    <a class="stat" href="#/food"><div class="k">Protéines</div><div class="v ${prot >= 130 ? 'good' : ''}">${prot} g<span class="small muted"> / 130-140</span></div><div class="bar ${prot >= 130 ? 'good' : ''}"><i style="width:${pct(prot, 135)}%"></i></div></a>
    <div class="stat"><div class="k">Pas ${goalSteps ? '· obj. 8000' : '· jour de boulot'}</div>
      <input type="number" inputmode="numeric" placeholder="ex. 8500" value="${dd.steps ?? ''}" data-change="steps" data-date="${d}" style="margin-top:6px">
      ${goalSteps ? `<div class="bar ${dd.steps >= goalSteps ? 'good' : ''}"><i style="width:${pct(dd.steps || 0, goalSteps)}%"></i></div>` : ''}</div>
    <a class="stat" href="#/sommeil"><div class="k">Nuit dernière</div><div class="v ${lastNight == null ? '' : lastNight < 420 ? 'bad' : 'good'}">${lastNight == null ? '–' : U.fmtDur(lastNight)}</div><div class="s">${lastNight == null ? 'Toucher pour saisir' : lastNight < 420 ? 'Moins de 7h. Ce soir tôt.' : 'OK, 7h+'}</div></a>
  </div>`;

  // Pesée rapide
  if (isToday) {
    const wToday = state.weights.find((w) => w.date === d);
    const n = weekWeights(d).length;
    h += `<h2>Pesée (à jeun) · ${n}/3 cette semaine</h2><div class="card">${wToday
      ? `<div class="row between"><span>Pesé ce matin : <b>${U.fmtKg(wToday.kg)} kg</b></span><a href="#/poids">Courbe ›</a></div>`
      : `<div class="row"><input id="qw" type="text" inputmode="decimal" placeholder="kg, ex. 72,4" class="grow"><button class="primary" data-act="quickWeight">OK</button></div>`}</div>`;
  }

  h += `<p class="small muted" style="text-align:center;margin-top:20px">${PUNCH[((U.dayIndex(d) % PUNCH.length) + PUNCH.length) % PUNCH.length]}</p>`;
  return h;
}

function banners(p, dd) {
  const m = U.nowMin();
  const out = [];
  const add = (cls, html) => out.push(`<div class="card ${cls}">${html}</div>`);

  // Mollet : douleur depuis le début de l'étape
  const pain = state.calf.logs.filter((l) => l.date >= state.calf.stageStart && l.pain > 0 && !l.ack).pop();
  if (pain) add('bad', `🦵 <b>Mollet : ${pain.pain}/10 le ${U.fmtDate(pain.date)}.</b> Tu recules d’une étape. Pas de négo. <a href="#/mollet">Voir ›</a>`);

  const n = weekWeights(p.date).length;
  if (m < 11 * 60 && n < 3 && !state.weights.some((w) => w.date === p.date)) add('acc', `⚖️ Pesée à jeun ce matin ? T’en es à ${n}/3 cette semaine.`);
  if (m >= 12 * 60 && m < 15 * 60 && !dd.checks.walk) add('acc', '🚶 Repas avalé ? 15-20 min de marche. Maintenant, pas « tout à l’heure ».');
  if (p.isWork && m >= 7 * 60 + 30 && m < 18 * 60) {
    add('', `<div class="row between"><span>🧍 Devant l’ordi : debout 2-3 min toutes les 45 min.</span><button class="sm ${timers.ordi ? 'on' : ''}" data-act="${timers.ordi ? 'ordiStop' : 'ordiStart'}">${timers.ordi ? 'Stop' : '45 min'}</button></div>`);
  }
  if ((p.w === 0 || p.w === 3) && m >= 14 * 60 && !dd.checks.prep) add('warn', '🥡 Meal prep aujourd’hui. 1h. Sinon c’est fast-food mardi, on le sait.');
  const bed = U.toMin(p.bed);
  if (!dd.checks.bed && m >= bed - 60 && m < bed + 180) {
    const left = bed - m;
    add(left < 0 ? 'bad' : 'warn', left > 0 ? `🛏️ Au lit dans ${left} min. Écran off, ordi sur la table.` : `🛏️ T’as ${-left} min de retard pour dormir. Pose ce téléphone.`);
  }
  const ff = state.fastfood[U.monday(p.date)];
  if (p.w === 0 && !ff) { /* rien : pas de rappel inutile */ }
  return out.join('');
}

// ================= Poids =================
function vPoids() {
  const ws = sortedWeights();
  const weeks = weeklyAverages();
  const t = U.today();
  const cur = weeks.find((w) => w.mon === U.monday(t));
  const prevWeeks = weeks.filter((w) => w.mon < U.monday(t));
  const prev = prevWeeks[prevWeeks.length - 1];
  const target = D.targetWeight(t);
  const last = ws[ws.length - 1];
  const ref = cur?.avg ?? prev?.avg ?? D.PROFILE.startWeight;
  let h = '';

  h += `<div class="card"><div class="row"><input id="w-kg" type="text" inputmode="decimal" placeholder="Poids (kg)" class="grow" style="font-size:22px">
    <input id="w-date" type="date" value="${t}" style="width:150px"></div>
    <button class="primary full" style="margin-top:10px" data-act="addWeight">Enregistrer</button>
    <p class="small muted">3 matins par semaine, à jeun. Le poids du sauna, c’est de l’eau : on ne pèse pas après.</p></div>`;

  h += `<div class="grid3">
    <div class="stat"><div class="k">Moy. semaine</div><div class="v">${U.fmtKg(cur?.avg)}</div><div class="s">${cur ? cur.n : 0}/3 pesées</div></div>
    <div class="stat"><div class="k">Cible auj.</div><div class="v">${U.fmtKg(target)}</div><div class="s ${ref <= target + 0.3 ? 'good' : 'bad'}">${ref <= target + 0.3 ? 'Dans les clous' : `+${U.fmtKg(ref - target)} kg`}</div></div>
    <div class="stat"><div class="k">Reste</div><div class="v">${U.fmtKg(Math.max(0, ref - D.PROFILE.goalWeight))}</div><div class="s">jusqu’à 65 kg</div></div>
  </div>`;

  h += `<h2>Évolution</h2><div class="card">${chart(ws, weeks)}
    <div class="row wrap small muted" style="gap:14px;margin-top:6px"><span><b class="acc">●</b> pesées</span><span><b style="color:var(--blue)">━</b> moyenne semaine</span><span><b class="muted">┅</b> courbe cible</span></div></div>`;

  if (weeks.length) {
    h += `<h2>Moyennes par semaine</h2><div class="card tight">`;
    const rows = [];
    weeks.forEach((w, i) => {
      const before = i === 0 ? D.PROFILE.startWeight : weeks[i - 1].avg;
      const loss = before - w.avg;
      rows.push(`<div class="item"><div class="txt"><b>Sem. du ${U.fmtDate(w.mon)} · ${U.fmtKg(w.avg)} kg</b><div class="sub">${w.n} pesée${w.n > 1 ? 's' : ''} · ${loss >= 0 ? '−' : '+'}${U.fmtKg(Math.abs(loss))} kg · ${weekComment(loss, i === 0)}</div></div></div>`);
    });
    h += rows.reverse().join('') + `</div>`;
  }

  h += `<h2>Pesées</h2><div class="card tight">${ws.length ? [...ws].reverse().slice(0, 20).map((w) =>
    `<div class="item"><div class="txt"><b>${U.fmtKg(w.kg)} kg</b><div class="sub">${U.fmtDay(w.date)}</div></div><button class="x" data-act="delWeight" data-date="${w.date}" aria-label="Supprimer">×</button></div>`).join('')
    : '<div class="empty">Aucune pesée. Départ : 73 kg mi-novembre.</div>'}</div>`;
  void last; void prev;
  return h;
}

function chart(ws, weeks) {
  const P = D.PROFILE;
  const W = 340, H = 210, L = 30, R = 8, T = 10, B = 22;
  const lastDate = ws.length ? ws[ws.length - 1].date : P.startDate;
  const x0 = P.startDate, x1 = lastDate > P.goalDate ? U.addDays(lastDate, 7) : U.addDays(P.goalDate, 7);
  const vals = ws.map((w) => w.kg).concat([P.startWeight, P.goalWeight]);
  const y0 = Math.floor(Math.min(...vals) - 1), y1 = Math.ceil(Math.max(...vals) + 1);
  const span = U.diffDays(x0, x1);
  const X = (d) => L + (U.diffDays(x0, d) / span) * (W - L - R);
  const Y = (v) => T + ((y1 - v) / (y1 - y0)) * (H - T - B);
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Courbe de poids">`;
  for (let v = y0; v <= y1; v++) {
    if (v % 2) continue;
    s += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)" stroke-width="1"/><text x="${L - 4}" y="${Y(v) + 3}" text-anchor="end">${v}</text>`;
  }
  // mois
  for (const [d, lab] of [['2026-12-01', 'déc.'], ['2027-01-01', 'janv.'], ['2027-02-01', 'févr.'], ['2027-03-01', 'mars']]) {
    if (d > x0 && d < x1) s += `<text x="${X(d)}" y="${H - 6}" text-anchor="middle">${lab}</text>`;
  }
  // jalon 1er janvier
  s += `<line x1="${X(P.milestoneDate)}" x2="${X(P.milestoneDate)}" y1="${T}" y2="${H - B}" stroke="var(--warn)" stroke-dasharray="2 3" stroke-width="1"/>
    <text x="${X(P.milestoneDate) + 3}" y="${T + 9}" style="fill:var(--warn)">1er janv. ≈ 68,5</text>`;
  // objectif
  s += `<line x1="${L}" x2="${W - R}" y1="${Y(P.goalWeight)}" y2="${Y(P.goalWeight)}" stroke="var(--good)" stroke-width="1" stroke-dasharray="4 3"/>
    <text x="${W - R}" y="${Y(P.goalWeight) - 4}" text-anchor="end" style="fill:var(--good)">objectif 65</text>`;
  // courbe cible
  s += `<polyline fill="none" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="5 4" points="${[[P.startDate, P.startWeight], [P.milestoneDate, P.milestoneWeight], [P.goalDate, P.goalWeight]].map(([d, v]) => `${X(d)},${Y(v)}`).join(' ')}"/>`;
  // moyennes
  if (weeks.length) {
    const pts = [[P.startDate, P.startWeight], ...weeks.map((w) => [U.addDays(w.mon, 3), w.avg])];
    s += `<polyline fill="none" stroke="var(--blue)" stroke-width="2.5" stroke-linejoin="round" points="${pts.map(([d, v]) => `${X(d)},${Y(v)}`).join(' ')}"/>`;
  }
  s += `<circle cx="${X(P.startDate)}" cy="${Y(P.startWeight)}" r="4" fill="var(--bg)" stroke="var(--text)" stroke-width="1.5"/>`;
  for (const w of ws) s += `<circle cx="${X(w.date)}" cy="${Y(w.kg)}" r="3" fill="var(--accent)"/>`;
  return s + `</svg>`;
}

// ================= Muscu =================
function lastPerf(exId) {
  for (let i = state.workouts.length - 1; i >= 0; i--) {
    const w = state.workouts[i];
    if (w.sets[exId] && w.sets[exId].some((s) => s.done)) return { date: w.date, sets: w.sets[exId] };
  }
  return null;
}

function suggestion(ex) {
  const lp = lastPerf(ex.id);
  if (!lp) return null;
  const ok = lp.sets.length >= ex.sets && lp.sets.every((s) => s.done && (s.reps ?? 0) >= ex.reps);
  const kg = Math.max(...lp.sets.map((s) => s.kg || 0));
  const recap = lp.sets.map((s) => (ex.weighted ? `${U.fmtKg(s.kg || 0).replace(',0', '')}×${s.reps ?? '–'}` : `${s.reps ?? '–'}`)).join(' · ');
  if (ok && ex.weighted) return { up: true, kg: kg + ex.inc, text: `Tout validé la dernière fois (${recap}). → passe à ${U.fmtKg(kg + ex.inc).replace(',0', '')} kg.` };
  if (ok) return { up: true, text: `Tout validé la dernière fois. → vise ${ex.unit === 'sec' ? '+5 s' : '+1 rep'} par série.` };
  return { up: false, text: `Dernière fois : ${recap}. Même charge, valide toutes les reps d’abord.` };
}

function startSession(key) {
  const S = D.SESSIONS[key];
  const sets = {};
  for (const ex of S.exercises) {
    if (ex.cond === 'jumps' && !jumpsOK()) continue;
    const lp = lastPerf(ex.id);
    const kg = ex.weighted ? (lp ? Math.max(...lp.sets.map((s) => s.kg || 0)) : null) : null;
    sets[ex.id] = Array.from({ length: ex.sets }, () => ({ kg, reps: ex.reps, done: false }));
  }
  state.active = { id: U.uid(), date: U.today(), session: key, sets };
  save();
}

function vMuscu(params) {
  if (state.active) return vWorkout();
  const plan = D.dayPlan(U.today(), state);
  const rec = params.s || plan.session;
  let h = `<div class="card"><div class="row between"><b>Repos entre séries</b>
    <div class="seg" style="width:170px">${[90, 120].map((r) => `<button class="${state.prefs.rest === r ? 'on' : ''}" data-act="setRest" data-v="${r}">${r === 90 ? '1:30' : '2:00'}</button>`).join('')}</div></div>
    <ul class="rules small muted">${D.MUSCU_RULES.map((r) => `<li>${r}</li>`).join('')}</ul></div>`;
  for (const key of ['A', 'B', 'S']) {
    const S = D.SESSIONS[key];
    const exs = S.exercises.filter((e) => e.cond !== 'jumps' || jumpsOK());
    h += `<div class="card ${rec === key ? 'acc' : ''}"><div class="row between"><h3>${S.name}</h3>${rec === key ? '<span class="chip acc">Aujourd’hui</span>' : ''}</div>
      <p class="small muted">${S.duration} · Échauffement : ${S.warmup}</p>
      <p class="small">${exs.map((e) => `${e.name} <span class="muted">${e.sets}×${e.reps}${e.unit === 'sec' ? ' s' : ''}</span>`).join(' · ')}</p>
      ${key === 'A' && !jumpsOK() ? '<p class="small muted">Sauts sur box : débloqués en étape 3 de reprise, si zéro douleur.</p>' : ''}
      <button class="${rec === key ? 'primary' : ''} full" data-act="startSession" data-s="${key}">Commencer</button></div>`;
  }
  const hist = [...state.workouts].reverse().slice(0, 15);
  h += `<h2>Historique</h2><div class="card tight">${hist.length ? hist.map((w) => {
    const S = D.SESSIONS[w.session];
    const lines = S.exercises.filter((e) => w.sets[e.id]).map((e) => `<div class="small"><b>${e.name}</b> <span class="muted">${w.sets[e.id].filter((s) => s.done).map((s) => (e.weighted ? `${U.fmtKg(s.kg || 0).replace(',0', '')}×${s.reps}` : `${s.reps}${e.unit === 'sec' ? 's' : ''}`)).join(' · ') || 'non faite'}</span></div>`).join('');
    const nb = Object.values(w.sets).flat().filter((s) => s.done).length;
    return `<details class="item" style="display:block"><summary class="row between"><span><b>${U.fmtDay(w.date)}</b> <span class="muted small">· Séance ${w.session} · ${nb} séries</span></span><span class="muted">›</span></summary>
      <div style="margin-top:8px">${lines}<button class="sm danger ghost" style="margin-top:8px" data-act="delWorkout" data-id="${w.id}">Supprimer</button></div></details>`;
  }).join('') : '<div class="empty">Pas encore de séance. Ça commence mardi.</div>'}</div>`;
  return h;
}

function vWorkout() {
  const a = state.active;
  const S = D.SESSIONS[a.session];
  const total = Object.values(a.sets).flat();
  const nDone = total.filter((s) => s.done).length;
  let h = `<div class="card acc"><div class="row between"><h3>${S.name}</h3><span class="chip">${nDone}/${total.length}</span></div>
    <p class="small">🔥 Échauffement : ${S.warmup}</p><p class="small muted">${S.after}</p>
    <div class="seg" style="margin-top:8px">${[90, 120].map((r) => `<button class="${state.prefs.rest === r ? 'on' : ''}" data-act="setRest" data-v="${r}">Repos ${r === 90 ? '1:30' : '2:00'}</button>`).join('')}</div></div>`;
  h += `<div class="card tight">`;
  for (const ex of S.exercises) {
    const sets = a.sets[ex.id];
    if (!sets) continue;
    const sug = suggestion(ex);
    h += `<div class="ex"><div class="row between"><b>${ex.name}</b><span class="chip">${ex.sets} × ${ex.reps}${ex.unit === 'sec' ? ' s' : ''}</span></div>
      ${ex.note ? `<div class="small muted">${ex.note}</div>` : ''}
      ${sug ? `<div class="hint ${sug.up ? 'up' : ''}">${sug.text}${sug.up && sug.kg != null && sets.some((s) => !s.done && (s.kg ?? 0) < sug.kg) ? ` <button class="sm" data-act="applyInc" data-ex="${ex.id}" data-kg="${sug.kg}">Appliquer</button>` : ''}</div>` : ''}`;
    sets.forEach((s, i) => {
      h += `<div class="setrow ${ex.weighted ? '' : 'nokg'} ${s.done ? 'done' : ''}"><span class="n">${i + 1}</span>
        ${ex.weighted ? `<div class="unit"><input type="text" inputmode="decimal" value="${s.kg ?? ''}" data-change="setKg" data-ex="${ex.id}" data-i="${i}"><span>kg</span></div>` : ''}
        <div class="unit"><input type="number" inputmode="numeric" value="${s.reps ?? ''}" data-change="setReps" data-ex="${ex.id}" data-i="${i}"><span>${ex.unit === 'sec' ? 's' : 'reps'}</span></div>
        <button class="check ${s.done ? 'on' : ''}" data-act="setDone" data-ex="${ex.id}" data-i="${i}" aria-label="Série faite">✓</button></div>`;
    });
    h += `</div>`;
  }
  h += `</div><div class="grid2"><button class="danger" data-act="cancelSession">Annuler</button><button class="primary" data-act="finishSession">Terminer</button></div>`;
  return h;
}

// ================= Bouffe =================
function vFood() {
  const d = foodDate;
  const p = D.dayPlan(d, state);
  const dd = peekDay(d);
  const kcal = kcalOf(dd), prot = protOf(dd);
  const mon = U.monday(d);
  const ff = !!state.fastfood[mon];
  const left = p.kcal - kcal;
  let h = `<div class="datenav"><button data-act="foodNav" data-n="-1">‹</button><div style="text-align:center"><b>${d === U.today() ? 'Aujourd’hui' : U.fmtDay(d)}</b><div class="small muted">${p.basket ? 'Jour de basket · 2200 kcal' : 'Jour sans basket · 2000 kcal'}</div></div><button data-act="foodNav" data-n="1">›</button></div>`;
  h += `<div class="grid2">
    <div class="stat"><div class="k">Calories</div><div class="v ${left < -150 ? 'bad' : ''}">${kcal} <span class="small muted">/ ${p.kcal}</span></div><div class="bar ${left < -150 ? 'bad' : ''}"><i style="width:${pct(kcal, p.kcal)}%"></i></div><div class="s">${left >= 0 ? `Reste ${left} kcal` : `${-left} kcal au-dessus`}</div></div>
    <div class="stat"><div class="k">Protéines</div><div class="v ${prot >= 130 ? 'good' : ''}">${prot} g <span class="small muted">/ 130-140</span></div><div class="bar ${prot >= 130 ? 'good' : ''}"><i style="width:${pct(prot, 135)}%"></i></div><div class="s">${prot >= 130 ? 'Objectif atteint' : `Manque ${130 - prot} g`}</div></div>
  </div>`;
  h += `<div class="card ${ff ? 'warn' : ''}"><div class="item" style="padding:0;border:0;min-height:0"><button class="check ${ff ? 'on' : ''}" data-act="fastfood" data-mon="${mon}">✓</button><div class="txt"><b>Fast-food de la semaine</b><div class="sub">${ff ? 'Fait. Le prochain, c’est la semaine prochaine.' : '1 par semaine, assumé. Pas encore utilisé.'}</div></div></div></div>`;

  h += `<h2>Ajout rapide</h2><div class="card">`;
  for (const cat of ['Petit-déj', 'Midi', 'Collation', 'Soir', 'Extra']) {
    h += `<div class="small muted" style="margin:${cat === 'Petit-déj' ? 0 : 12}px 0 6px">${cat}</div><div class="foodchips">${Object.entries(D.FOOD).filter(([, f]) => f.cat === cat).map(([k, f]) => `<button data-act="addFood" data-key="${k}">${f.name}<small>${f.kcal} · ${f.prot}g</small></button>`).join('')}</div>`;
  }
  h += `<div class="small muted" style="margin:14px 0 6px">Autre chose</div><div class="row"><input id="f-kcal" type="number" inputmode="numeric" placeholder="kcal"><input id="f-prot" type="number" inputmode="numeric" placeholder="prot (g)"><button class="primary" data-act="addManual">+</button></div></div>`;

  h += `<h2>Mangé</h2><div class="card tight">${dd.food.length ? dd.food.map((f) => `<div class="item"><div class="txt"><b>${U.esc(f.name)}</b><div class="sub">${f.kcal} kcal · ${f.prot} g</div></div><button class="x" data-act="delFood" data-id="${f.id}" aria-label="Supprimer">×</button></div>`).join('') : '<div class="empty">Rien noté pour ce jour.</div>'}</div>`;
  h += `<h2>L’assiette</h2><div class="card"><ul class="rules small">${D.PLATE_RULES.map((r) => `<li>${r}</li>`).join('')}</ul><p class="small muted">Pas de saumon. Meal prep le dimanche et le mercredi, 1h.</p></div>`;
  return h;
}

// ================= Plus =================
function vPlus() {
  const items = [
    ['courses', '🛒', 'Courses', `${state.shopping.filter((s) => s.done).length}/${state.shopping.length} dans le caddie`],
    ['sommeil', '🛏️', 'Sommeil', '7h minimum, alerte sinon'],
    ['pas', '👟', 'Pas', '8000 les jours sans boulot'],
    ['mollet', '🦵', 'Mollet', `Reprise : ${D.CALF_STAGES[state.calf.stage].title}`],
    ['rappels', '⏰', 'Rappels', 'Coucher, marche, ordi, meal prep'],
    ['reglages', '⚙️', 'Sauvegarde & réglages', 'Exporter / importer tes données'],
  ];
  return `<div class="card tight menu">${items.map(([r, i, t, s]) => `<a href="#/${r}"><span class="ico">${i}</span><span class="txt">${t}<div class="sub">${s}</div></span><span class="muted">›</span></a>`).join('')}</div>`;
}
const back = '<a class="back" href="#/plus">‹ Plus</a>';

// ================= Courses =================
function vCourses() {
  const n = state.shopping.filter((s) => s.done).length;
  let h = back + `<div class="card"><div class="row between"><b>${n}/${state.shopping.length} dans le caddie</b><button class="sm" data-act="shopReset">Nouvelle semaine</button></div><p class="small muted">Budget max 250 CHF. Cette liste ≈ 120-150 CHF.</p></div>`;
  for (const cat of D.SHOP_CATS) {
    const items = state.shopping.filter((s) => s.cat === cat);
    if (!items.length) continue;
    h += `<h2>${cat}</h2><div class="card tight">${items.map((s) => `<div class="item ${s.done ? 'done' : ''}"><button class="check ${s.done ? 'on' : ''}" data-act="shopToggle" data-id="${s.id}">✓</button><div class="txt"><b>${U.esc(s.name)}</b></div><button class="x" data-act="shopDel" data-id="${s.id}" aria-label="Supprimer">×</button></div>`).join('')}</div>`;
  }
  h += `<h2>Ajouter</h2><div class="card"><input id="s-name" placeholder="ex. Fromage frais"><div class="row" style="margin-top:8px"><select id="s-cat">${D.SHOP_CATS.map((c) => `<option>${c}</option>`).join('')}</select><button class="primary" data-act="shopAdd">Ajouter</button></div></div>
    <button class="ghost full small muted" data-act="shopRestore">Remettre la liste d’origine</button>`;
  return h;
}

// ================= Sommeil =================
function vSommeil() {
  const t = U.today();
  const yesterday = U.addDays(t, -1);
  const plan = D.dayPlan(yesterday, state);
  const dd = peekDay(t);
  const nights = [];
  for (let i = 0; i < 14; i++) {
    const d = U.addDays(t, -i);
    const s = peekDay(d).sleep;
    if (s) nights.push({ d, ...s, min: U.sleepMinutes(s.bed, s.wake) });
  }
  const last7 = nights.filter((n) => n.d > U.addDays(t, -7));
  const a7 = U.avg(last7.map((n) => n.min));
  const short = last7.filter((n) => n.min < 420).length;
  let h = back + `<div class="card"><b>Nuit dernière</b> <span class="small muted">(objectif : coucher ${plan.bed.replace(':', 'h')})</span>
    <div class="grid2" style="margin-top:8px"><label class="fld">Couché à<input id="sl-bed" type="time" value="${dd.sleep?.bed || plan.bed}"></label>
    <label class="fld">Levé à<input id="sl-wake" type="time" value="${dd.sleep?.wake || (D.dayPlan(t, state).isWork ? '05:00' : '07:30')}"></label></div>
    <button class="primary full" style="margin-top:10px" data-act="saveSleep">Enregistrer</button></div>`;
  if (dd.sleep) {
    const m = U.sleepMinutes(dd.sleep.bed, dd.sleep.wake);
    h += m < 420
      ? `<div class="card bad">⚠️ <b>${U.fmtDur(m)} de sommeil.</b> En dessous de 7h. Ce soir, au lit à ${D.dayPlan(t, state).bed.replace(':', 'h')}, point.</div>`
      : `<div class="card good">✅ <b>${U.fmtDur(m)}.</b> Propre.</div>`;
  }
  h += `<div class="grid2"><div class="stat"><div class="k">Moyenne 7 nuits</div><div class="v ${a7 != null && a7 < 420 ? 'bad' : ''}">${a7 == null ? '–' : U.fmtDur(Math.round(a7))}</div></div>
    <div class="stat"><div class="k">Nuits &lt; 7h</div><div class="v ${short ? 'bad' : 'good'}">${short}</div><div class="s">sur les 7 derniers jours</div></div></div>`;
  h += `<h2>Historique</h2><div class="card">${nights.length ? nights.map((n) => `<div class="hbar"><span>${U.cap(U.JOURS[U.dow(n.d)]).slice(0, 3)} ${U.fmtDate(n.d)}</span><div class="bar ${n.min < 420 ? 'bad' : 'good'}"><i style="width:${pct(n.min, 540)}%"></i></div><b class="${n.min < 420 ? 'bad' : ''}">${U.fmtDur(n.min)}</b></div>`).join('') : '<div class="empty">Rien encore. Note ta nuit chaque matin.</div>'}</div>`;
  h += `<h2>Les règles</h2><div class="card"><ul class="rules small">
    <li>7h minimum, chaque nuit.</li><li>Lun-mer : lever vers 5h, coucher vers 21h30. Le lundi tu commences à 7h45.</li>
    <li>Du dimanche au mercredi : au lit avant 22h30, dans tous les cas.</li><li>Pas d’ordi ni de boulot dans le lit. Le lit, c’est pour dormir.</li></ul></div>`;
  return h;
}

// ================= Pas =================
function vPas() {
  const t = U.today();
  const p = D.dayPlan(t, state);
  const dd = peekDay(t);
  let h = back + `<div class="card"><b>Aujourd’hui</b> <span class="small muted">${p.stepsGoal ? 'objectif 8000' : 'jour de boulot : pas d’objectif, la marche du midi suffit'}</span>
    <div class="row" style="margin-top:8px"><input id="p-steps" type="number" inputmode="numeric" placeholder="Nombre de pas" value="${dd.steps ?? ''}" style="font-size:22px"><button class="primary" data-act="saveSteps">OK</button></div>
    ${p.stepsGoal ? `<div class="bar ${dd.steps >= 8000 ? 'good' : ''}" style="margin-top:10px"><i style="width:${pct(dd.steps || 0, 8000)}%"></i></div><p class="small ${dd.steps >= 8000 ? 'good' : 'muted'}">${dd.steps >= 8000 ? 'Objectif fait.' : `Encore ${8000 - (dd.steps || 0)} pas. Va marcher.`}</p>` : ''}
    <p class="small muted">Le chiffre est dans l’app Santé de l’iPhone.</p></div>`;
  h += `<h2>14 derniers jours</h2><div class="card">`;
  for (let i = 0; i < 14; i++) {
    const d = U.addDays(t, -i);
    const s = peekDay(d).steps;
    const goal = D.dayPlan(d, state).stepsGoal;
    h += `<div class="hbar"><span>${U.cap(U.JOURS[U.dow(d)]).slice(0, 3)} ${U.fmtDate(d)}</span><div class="bar ${goal && s >= goal ? 'good' : ''}"><i style="width:${pct(s || 0, 12000)}%"></i></div><b>${s == null ? '–' : (s / 1000).toFixed(1).replace('.', ',') + 'k'}${goal ? '' : '<span class="muted">*</span>'}</b></div>`;
  }
  h += `<p class="small muted">* jour de boulot</p></div>`;
  h += `<div class="card"><ul class="rules small"><li>8000 pas minimum les jours sans boulot.</li><li>Marche 15-20 min après le repas de midi.</li><li>Devant l’ordi : debout 2-3 min toutes les 45 min.</li><li>Lendemain de match : repos actif, balade tranquille.</li></ul></div>`;
  return h;
}

// ================= Mollet =================
function vMollet() {
  const c = state.calf;
  const t = U.today();
  const st = D.CALF_STAGES[c.stage];
  const daysIn = U.diffDays(c.stageStart, t) + 1;
  const pains = c.logs.filter((l) => l.date >= c.stageStart && l.pain > 0 && !l.ack);
  const lastPain = pains[pains.length - 1];
  const canNext = c.stage < 4 && daysIn >= 7 && !pains.length;
  let h = back;
  h += `<div class="card acc"><div class="row between"><h3>${c.stage < 4 ? `Étape ${c.stage}/3 · ${st.title}` : st.title}</h3><span class="chip">jour ${daysIn}</span></div>
    <ul class="rules">${st.rules.map((r) => `<li>${r}</li>`).join('')}</ul></div>`;

  if (lastPain) {
    h += `<div class="card bad"><b>T’as eu mal : ${lastPain.pain}/10 (${lastPain.ctx}, ${U.fmtDate(lastPain.date)}).</b>
      <p>${c.stage > 1 ? `Retour à l’étape ${c.stage - 1}. Pas de négo, l’ego reste au vestiaire.` : 'T’es déjà à l’étape 1 : tu y restes et tu en parles à ton physio.'}</p>
      ${c.stage > 1 ? `<button class="full" data-act="calfBack">Revenir à l’étape ${c.stage - 1}</button>` : `<button class="full" data-act="calfRestart">Recommencer l’étape 1 à zéro</button>`}</div>`;
  } else if (canNext) {
    h += `<div class="card good"><b>${daysIn} jours sans douleur.</b> ${c.stage < 3 ? `Tu peux passer à l’étape ${c.stage + 1}.` : 'Reprise terminée si le physio est OK.'}
      <button class="primary full" style="margin-top:8px" data-act="calfNext">${c.stage < 3 ? `Passer à l’étape ${c.stage + 1}` : 'Valider la fin de la reprise'}</button></div>`;
  } else if (c.stage < 4) {
    h += `<p class="small muted">Étape suivante possible dans ${Math.max(0, 7 - daysIn + 1)} jour(s), si zéro douleur.</p>`;
  }

  h += `<h2>Note après la séance</h2><div class="card"><div class="seg">${[['basket', 'Basket'], ['muscu', 'Muscu'], ['cardio', 'Vélo/footing'], ['réveil', 'Réveil']].map(([v, l]) => `<button class="${calfCtx === v ? 'on' : ''}" data-act="calfCtx" data-v="${v}">${l}</button>`).join('')}</div>
    <p class="small muted">${calfCtx === 'réveil' ? 'Ça tire ce matin ? 0 = rien du tout.' : 'Douleur pendant l’effort ? 0 = rien du tout.'}</p>
    <div class="painrow">${Array.from({ length: 11 }, (_, i) => `<button class="${i === 0 ? 'p0' : i >= 4 ? 'p-hi' : ''}" data-act="calfLog" data-v="${i}">${i}</button>`).join('')}</div></div>`;

  h += `<div class="card"><div class="item" style="padding:0;border:0;min-height:0"><button class="check ${c.physioOK ? 'on' : ''}" data-act="calfPhysio">✓</button><div class="txt"><b>Feu vert du physio pour les matchs</b><div class="sub">Obligatoire avant de rejouer un match.</div></div></div></div>`;
  h += `<h2>Pour toujours</h2><div class="card"><ul class="rules small">${D.CALF_FOREVER.map((r) => `<li>${r}</li>`).join('')}<li>Pendant la reprise, tu peux sauter la muscu du jeudi matin.</li></ul></div>`;
  h += `<h2>Historique</h2><div class="card tight">${c.logs.length ? [...c.logs].reverse().slice(0, 30).map((l) => `<div class="item"><span class="chip ${l.pain ? 'bad' : 'good'}">${l.pain}/10</span><div class="txt"><b>${U.cap(l.ctx)}</b><div class="sub">${U.fmtDay(l.date)} · étape ${l.stage}</div></div><button class="x" data-act="calfDel" data-id="${l.id}">×</button></div>`).join('') : '<div class="empty">Aucune note encore.</div>'}</div>`;
  return h;
}

// ================= Rappels =================
function vRappels() {
  return back + `<div class="card acc"><b>Vraies notifications sur l’iPhone</b>
    <p class="small">Une app web ne peut pas programmer de notifs toute seule. L’astuce : les rappels passent par ton Calendrier, avec des alarmes qui sonnent même app fermée.</p>
    <a class="btn primary full" href="rappels.ics" target="_blank" rel="noopener">📅 Ajouter les rappels au Calendrier</a>
    <p class="small muted">Coucher (dim-mer), marche après le midi (tous les jours), meal prep (dim + mer), pesée (lun, mer, ven).</p>
    <a class="btn full" href="rappels-ordi.ics" target="_blank" rel="noopener" style="margin-top:6px">🧍 Ajouter « lève-toi » (lun-mer, toutes les 45 min)</a>
    <p class="small muted">Si rien ne se passe depuis l’app installée : ouvre la même page dans Safari et touche le bouton. iPhone → « Tout ajouter ».</p></div>
  <h2>Dans l’app</h2><div class="card"><div class="row between"><span>🧍 Minuteur « lève-toi » 45 min</span><button class="sm ${timers.ordi ? 'on' : ''}" data-act="${timers.ordi ? 'ordiStop' : 'ordiStart'}">${timers.ordi ? 'Arrêter' : 'Lancer'}</button></div>
    <p class="small muted">Sonne seulement si l’app est ouverte. Sur l’écran « Aujourd’hui », les bandeaux te rappellent : pesée, marche, meal prep, heure de coucher.</p></div>
  <h2>Les horaires</h2><div class="card tight">
    ${[['🛏️', 'Coucher', 'Dim, lun, mer : alarme 21h30 (au lit 22h). Mar : alarme 21h (au lit 21h30).'], ['🚶', 'Marche après le midi', 'Tous les jours à 13h'], ['🧍', 'Lève-toi', 'Lun-mer, de 8h30 à 17h, toutes les 45 min'], ['🥡', 'Meal prep', 'Dimanche 17h, mercredi 18h30'], ['⚖️', 'Pesée à jeun', 'Lundi 5h50, mercredi 5h05, vendredi 8h30']].map(([i, t, s]) => `<div class="item"><span class="ico">${i}</span><div class="txt"><b>${t}</b><div class="sub">${s}</div></div></div>`).join('')}</div>`;
}

// ================= Réglages =================
function vReglages() {
  const P = D.PROFILE;
  return back + `<div class="card"><b>Ton profil</b><ul class="rules small"><li>23 ans, 165 cm</li><li>Départ ${P.startWeight} kg (${U.fmtDate(P.startDate)}) → ${P.milestoneWeight.toString().replace('.', ',')} kg au 1er janvier → ${P.goalWeight} kg fin février</li><li>Rythme : 0,5-0,7 kg par semaine</li><li>Reprise mollet depuis le ${U.fmtDate(P.rehabStart)}</li></ul></div>
  <h2>Sauvegarde</h2><div class="card"><p class="small">Tout est stocké sur ce téléphone, rien sur internet. Exporte de temps en temps (Fichiers iCloud, par ex.).</p>
    <button class="full" data-act="exportData">⬇️ Exporter mes données</button>
    <label class="btn full" style="margin-top:8px">⬆️ Importer une sauvegarde<input type="file" accept="application/json,.json" data-change="importData" hidden></label></div>
  <h2>Zone rouge</h2><div class="card"><button class="danger full" data-act="resetData">Tout effacer</button></div>
  <p class="small muted" style="text-align:center">New Me · v1</p>`;
}

// ================= Minuteurs (repos + ordi) =================
const TKEY = 'newme-timers';
let timers = { rest: null, ordi: null };
try { timers = { ...timers, ...JSON.parse(localStorage.getItem(TKEY) || '{}') }; } catch (e) { /* rien */ }
let tick = null, shownKeys = '';
let actx = null;

function unlockAudio() {
  try {
    actx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
  } catch (e) { /* pas de son */ }
}
function beep() {
  try {
    if (!actx) return;
    const t = actx.currentTime;
    for (let i = 0; i < 3; i++) {
      const o = actx.createOscillator(), g = actx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(actx.destination);
      g.gain.setValueAtTime(0.0001, t + i * 0.3);
      g.gain.exponentialRampToValueAtTime(0.4, t + i * 0.3 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.3 + 0.22);
      o.start(t + i * 0.3); o.stop(t + i * 0.3 + 0.25);
    }
  } catch (e) { /* rien */ }
  try { navigator.vibrate?.([200, 100, 200]); } catch (e) { /* rien */ }
}
function saveTimers() { try { localStorage.setItem(TKEY, JSON.stringify(timers)); } catch (e) { /* rien */ } }
function startTimer(kind, sec) { timers[kind] = Date.now() + sec * 1000; saveTimers(); drawTimer(); if (!tick) tick = setInterval(drawTimer, 250); }
function stopTimer(kind) { timers[kind] = null; saveTimers(); drawTimer(); }

function drawTimer() {
  const el = $('#timer');
  const now = Date.now();
  for (const k of ['rest', 'ordi']) {
    if (timers[k] != null && timers[k] <= now) {
      timers[k] = null; saveTimers(); beep();
      if (k === 'rest') toast('Repos fini. Série suivante, go.');
      else { toast('Debout ! 2-3 min. Le prochain dans 45 min.', 5000); startTimer('ordi', 45 * 60); return; }
    }
  }
  const keys = ['rest', 'ordi'].filter((k) => timers[k] != null);
  if (!keys.length) { el.hidden = true; shownKeys = ''; clearInterval(tick); tick = null; return; }
  if (keys.join() !== shownKeys) {
    shownKeys = keys.join();
    el.innerHTML = keys.map((k) => `<div class="tline"><span class="tv" id="tv-${k}"></span><span class="tl">${k === 'rest' ? 'Repos' : 'Avant de te lever'}</span>
      ${k === 'rest' ? '<button class="sm" data-act="timerAdd">+15 s</button>' : ''}<button class="sm" data-act="timerStop" data-k="${k}">Stop</button></div>`).join('');
  }
  el.hidden = false;
  for (const k of keys) {
    const left = Math.max(0, Math.ceil((timers[k] - now) / 1000));
    const node = document.getElementById('tv-' + k);
    if (node) node.textContent = `${Math.floor(left / 60)}:${U.pad(left % 60)}`;
  }
}

// ================= Actions =================
const num = U.num;
const ACT = {
  dayNav: (el) => { const n = +el.dataset.n; viewDate = n === 0 ? U.today() : U.addDays(viewDate, n); render(); },
  check: (el) => { const dd = day(el.dataset.date); dd.checks[el.dataset.id] = !dd.checks[el.dataset.id]; commit(); },
  meal: (el) => {
    const dd = day(el.dataset.date); const id = el.dataset.id;
    if (dd.checks[id]) { dd.checks[id] = false; dd.food = dd.food.filter((f) => f.src !== id); }
    else { const f = D.FOOD[el.dataset.key]; dd.checks[id] = true; dd.food.push({ id: U.uid(), name: f.name, kcal: f.kcal, prot: f.prot, src: id }); }
    commit();
  },
  swapMeal: (el) => {
    const dd = day(el.dataset.date); const opts = D.MEAL_OPTIONS[el.dataset.id];
    dd.swap ||= {}; dd.swap[el.dataset.id] = opts[(opts.indexOf(el.dataset.key) + 1) % opts.length]; commit();
  },
  setMatch: (el) => {
    state.matches[el.dataset.mon] = el.dataset.v; commit();
    if (el.dataset.v !== 'none') {
      const d = el.dataset.v === 'sat' ? U.addDays(el.dataset.mon, 5) : U.addDays(el.dataset.mon, 6);
      if (!D.matchAllowed(state, d)) toast(D.matchBlockReason(state, d), 4000);
    }
  },
  quickWeight: () => addWeight($('#qw').value, U.today()),
  addWeight: () => addWeight($('#w-kg').value, $('#w-date').value || U.today()),
  delWeight: (el) => { state.weights = state.weights.filter((w) => w.date !== el.dataset.date); commit(); },

  setRest: (el) => { state.prefs.rest = +el.dataset.v; commit(); },
  startSession: (el) => { startSession(el.dataset.s); render(); },
  setDone: (el) => {
    const a = state.active; const s = a.sets[el.dataset.ex][+el.dataset.i];
    s.done = !s.done;
    if (s.done) {
      const ex = D.SESSIONS[a.session].exercises.find((e) => e.id === el.dataset.ex);
      if (s.reps == null) s.reps = ex.reps;
      const rest = ex.rest ?? state.prefs.rest;
      const isLast = Object.values(a.sets).flat().every((x) => x.done);
      if (rest > 0 && !isLast) startTimer('rest', rest);
    }
    commit();
  },
  applyInc: (el) => { for (const s of state.active.sets[el.dataset.ex]) if (!s.done) s.kg = +el.dataset.kg; commit(); },
  cancelSession: () => { if (confirm('Annuler la séance ? Rien ne sera enregistré.')) { state.active = null; stopTimer('rest'); commit(); } },
  finishSession: () => {
    const a = state.active;
    const nDone = Object.values(a.sets).flat().filter((s) => s.done).length;
    if (!nDone && !confirm('Aucune série cochée. Terminer quand même ?')) return;
    state.workouts.push(a); day(a.date).checks.muscu = true; state.active = null; stopTimer('rest'); save();
    toast('Séance enregistrée. Maintenant, note ton mollet.');
    location.hash = '#/mollet?ctx=muscu';
  },
  delWorkout: (el) => { if (confirm('Supprimer cette séance ?')) { state.workouts = state.workouts.filter((w) => w.id !== el.dataset.id); commit(); } },
  timerAdd: () => { if (timers.rest) { timers.rest += 15000; saveTimers(); drawTimer(); } },
  timerStop: (el) => stopTimer(el.dataset.k),
  ordiStart: () => { startTimer('ordi', 45 * 60); toast('OK. Je te dis de te lever dans 45 min (app ouverte).'); render(); },
  ordiStop: () => { stopTimer('ordi'); render(); },

  foodNav: (el) => { foodDate = U.addDays(foodDate, +el.dataset.n); render(); },
  addFood: (el) => {
    const f = D.FOOD[el.dataset.key];
    day(foodDate).food.push({ id: U.uid(), name: f.name, kcal: f.kcal, prot: f.prot });
    if (el.dataset.key === 'fastfood') {
      const mon = U.monday(foodDate);
      if (state.fastfood[mon]) toast('Deuxième fast-food de la semaine. Noté… mais t’as compris.', 4000);
      state.fastfood[mon] = true;
    }
    commit(); toast(`+${f.kcal} kcal · +${f.prot} g`);
  },
  addManual: () => {
    const k = Math.round(num($('#f-kcal').value) || 0), p = Math.round(num($('#f-prot').value) || 0);
    if (!k && !p) return toast('Mets au moins les kcal.');
    day(foodDate).food.push({ id: U.uid(), name: 'Autre', kcal: k, prot: p }); commit();
  },
  delFood: (el) => {
    const dd = day(foodDate); const f = dd.food.find((x) => x.id === el.dataset.id);
    if (f?.src) dd.checks[f.src] = false;
    dd.food = dd.food.filter((x) => x.id !== el.dataset.id); commit();
  },
  fastfood: (el) => { state.fastfood[el.dataset.mon] = !state.fastfood[el.dataset.mon]; commit(); },

  shopToggle: (el) => { const s = state.shopping.find((x) => x.id === el.dataset.id); s.done = !s.done; commit(); },
  shopDel: (el) => { state.shopping = state.shopping.filter((x) => x.id !== el.dataset.id); commit(); },
  shopAdd: () => { const n = $('#s-name').value.trim(); if (!n) return; state.shopping.push({ id: U.uid(), cat: $('#s-cat').value, name: n, done: false }); commit(); },
  shopReset: () => { state.shopping.forEach((s) => { s.done = false; }); commit(); toast('Nouvelle semaine. Liste remise à zéro.'); },
  shopRestore: () => { if (confirm('Remettre la liste d’origine ? Tes ajouts seront perdus.')) { state.shopping = D.DEFAULT_SHOPPING.map(([cat, name]) => ({ id: U.uid(), cat, name, done: false })); commit(); } },

  saveSleep: () => {
    const bed = $('#sl-bed').value, wake = $('#sl-wake').value;
    if (!bed || !wake) return;
    day(U.today()).sleep = { bed, wake }; commit();
    const m = U.sleepMinutes(bed, wake);
    toast(m < 420 ? `${U.fmtDur(m)}. Pas assez. Ce soir, tôt.` : `${U.fmtDur(m)}. Bien.`);
  },
  saveSteps: () => { const v = num($('#p-steps').value); day(U.today()).steps = v == null ? null : Math.round(v); commit(); },

  calfCtx: (el) => { calfCtx = el.dataset.v; render(); },
  calfLog: (el) => {
    const pain = +el.dataset.v; const t = U.today();
    state.calf.logs.push({ id: U.uid(), date: t, ctx: calfCtx, pain, stage: state.calf.stage });
    day(t).checks.calf = true; commit();
    toast(pain === 0 ? 'Zéro douleur. Parfait.' : `${pain}/10 noté. On recule d’une étape.`, 3500);
  },
  calfBack: () => { const c = state.calf; ackPain(); c.history.push({ date: U.today(), from: c.stage, to: c.stage - 1 }); c.stage = Math.max(1, c.stage - 1); c.stageStart = U.today(); commit(); toast(`Retour à l’étape ${c.stage}. Patience.`); },
  calfRestart: () => { ackPain(); state.calf.stageStart = U.today(); commit(); },
  calfNext: () => { const c = state.calf; c.history.push({ date: U.today(), from: c.stage, to: c.stage + 1 }); c.stage = Math.min(4, c.stage + 1); c.stageStart = U.today(); commit(); toast(c.stage === 4 ? 'Reprise terminée. Garde l’échauffement et le renfo.' : `Étape ${c.stage}. Progressif.`); },
  calfPhysio: () => { state.calf.physioOK = !state.calf.physioOK; commit(); },
  calfDel: (el) => { state.calf.logs = state.calf.logs.filter((l) => l.id !== el.dataset.id); commit(); },

  exportData: async () => {
    const name = `new-me-${U.today()}.json`;
    const file = new File([exportJSON()], name, { type: 'application/json' });
    try {
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: 'Sauvegarde New Me' }); return; }
    } catch (e) { if (e.name === 'AbortError') return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  },
  resetData: () => { if (confirm('Tout effacer ? Poids, séances, repas… tout. Pas de retour possible.')) { resetAll(); render(); toast('Tout est effacé.'); } },
};

function ackPain() { state.calf.logs.forEach((l) => { if (l.pain > 0) l.ack = true; }); }

function addWeight(raw, date) {
  const kg = num(raw);
  if (kg == null || kg < 40 || kg > 150) return toast('Mets un poids valable, ex. 72,4');
  state.weights = state.weights.filter((w) => w.date !== date);
  state.weights.push({ kg: Math.round(kg * 10) / 10, date });
  commit();
  const n = weekWeights(date).length;
  toast(n >= 3 ? `${U.fmtKg(kg)} kg. 3 pesées cette semaine, c’est bon.` : `${U.fmtKg(kg)} kg noté. ${n}/3 cette semaine.`);
}

const CHANGE = {
  steps: (el) => { const v = num(el.value); day(el.dataset.date).steps = v == null ? null : Math.round(v); commit(); },
  setKg: (el) => { state.active.sets[el.dataset.ex][+el.dataset.i].kg = num(el.value); save(); },
  setReps: (el) => { state.active.sets[el.dataset.ex][+el.dataset.i].reps = num(el.value); save(); },
  importData: (el) => {
    const f = el.files?.[0]; if (!f) return;
    f.text().then((txt) => { importJSON(txt); render(); toast('Sauvegarde importée.'); }).catch(() => toast('Fichier pas reconnu.'));
  },
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  e.preventDefault();
  unlockAudio();
  ACT[el.dataset.act]?.(el, e);
});
document.addEventListener('change', (e) => {
  const el = e.target.closest('[data-change]');
  if (el) CHANGE[el.dataset.change]?.(el, e);
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const id = e.target.id;
  const map = { qw: 'quickWeight', 'w-kg': 'addWeight', 's-name': 'shopAdd', 'p-steps': 'saveSteps', 'f-prot': 'addManual' };
  if (map[id]) { e.preventDefault(); ACT[map[id]](); }
});
// Revenir sur l'app après minuit : on recale la date du jour.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') { viewDate = U.today(); foodDate = U.today(); render(); drawTimer(); }
});

render();
if (timers.rest || timers.ordi) { drawTimer(); tick = setInterval(drawTimer, 250); }
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
