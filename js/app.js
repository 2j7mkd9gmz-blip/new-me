// New Me : l'app. Rendu en HTML simple + délégation d'événements.
import * as U from './util.js';
import { state, load, save, day, peekDay, exportJSON, importJSON, resetAll } from './store.js';
import * as D from './data.js';
import { icon, ring, TASK_STYLE } from './icons.js';

const CHECK = icon('check');
const XI = icon('x');

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

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Encore debout ?' : h < 12 ? 'Salut' : h < 18 ? 'Bon aprèm' : 'Bonsoir';
}
const SUBS = {
  today: () => U.cap(U.JOURS[U.dow(U.today())]) + ' ' + U.fmtDate(U.today()),
  poids: () => 'Objectif 65 kg fin février',
  muscu: () => (state.active ? 'Une série à la fois' : 'Séances A, B et bonus'),
  food: () => (D.dayPlan(foodDate, state).basket ? 'Jour de basket · 2200 kcal' : 'Jour sans basket · 2000 kcal'),
  plus: () => 'Le reste du programme',
};

function render() {
  const { name, params } = parseHash();
  const VIEWS = { today: vToday, poids: vPoids, muscu: vMuscu, food: vFood, plus: vPlus, courses: vCourses, sommeil: vSommeil, pas: vPas, mollet: vMollet, rappels: vRappels, reglages: vReglages };
  if (name === 'mollet' && params.ctx && lastRoute !== location.hash) calfCtx = params.ctx;
  const changed = lastRoute !== location.hash;
  const v = $('#view');
  v.innerHTML = VIEWS[name](params);
  if (changed) { v.classList.remove('anim'); void v.offsetWidth; v.classList.add('anim'); }
  $('#title').textContent = name === 'today' ? greeting() : name === 'muscu' && state.active ? 'Séance en cours' : TITLES[name];
  $('#subtitle').textContent = (SUBS[name] || (() => 'New Me'))();
  $('#topright').innerHTML = `<a href="#/mollet" class="chip ${state.calf.stage >= 4 ? 'good' : 'acc'}">${icon('leg')}${state.calf.stage >= 4 ? 'Mollet OK' : 'Mollet · ét. ' + state.calf.stage}</a>`;
  const tab = TAB[name] || name;
  document.querySelectorAll('#tabbar a').forEach((a) => a.classList.toggle('on', a.dataset.tab === tab));
  if (changed) window.scrollTo(0, 0);
  lastRoute = location.hash;
}
// Icônes de la barre d'onglets
const TAB_ICON = { today: 'today', poids: 'scale', muscu: 'dumbbell', food: 'food', plus: 'grid' };
document.querySelectorAll('#tabbar a').forEach((a) => a.insertAdjacentHTML('afterbegin', icon(TAB_ICON[a.dataset.tab])));
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
const gradDef = (id, a = '#ffb14a', b = '#ff3d71') => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
const tileHtml = (name, color) => `<span class="tile c-${color}">${icon(name)}</span>`;

function headline(p) {
  if (p.isMatchDay) return 'Jour de match';
  const parts = [];
  if (p.isWork) parts.push('boulot');
  if (p.session) parts.push(p.session === 'S' ? 'séance bonus' : 'muscu ' + p.session);
  if (p.basket) parts.push('basket');
  if (parts.length === 0 || (parts.length === 1 && p.isWork)) parts.push(p.afterMatch ? 'repos actif' : 'repos');
  return U.cap(parts.join(' + '));
}

function vToday() {
  const d = viewDate;
  const isToday = d === U.today();
  const p = D.dayPlan(d, state);
  const dd = peekDay(d);
  const mon = U.monday(d);
  const calfDay = p.basket || p.session || p.isMatchDay;
  const tasks = [...p.tasks];
  if (calfDay) tasks.splice(tasks.length - 1, 0, { id: 'calf', text: 'Note ton mollet (0-10)', sub: 'Après la séance, 5 secondes', link: '#/mollet' });
  const done = tasks.filter((t) => dd.checks[t.id]).length;
  let h = '';

  // Héros
  h += `<section class="hero"><div class="row between"><div class="grow">
      <div class="day">${isToday ? 'Aujourd’hui · ' + U.fmtDate(d) : U.fmtDay(d)}</div>
      <div class="title">${headline(p)}</div>
    </div>
    ${ring(tasks.length ? done / tasks.length : 0, { size: 96, stroke: 10, color: 'url(#gHero)', grad: gradDef('gHero'), track: 'rgba(255,255,255,.12)', inner: `<b>${done}<span style="font-size:15px;opacity:.55">/${tasks.length}</span></b><small>fait</small>` })}
    </div>
      <div class="tags" style="margin-top:12px;position:relative;z-index:1">${p.tags.filter((t) => /Basket|Muscu/.test(t)).map((t) => `<span class="chip solid">${icon(/Basket/.test(t) ? 'ball' : 'dumbbell')}${t}</span>`).join('')}
        <span class="chip">${icon('flame')}${p.kcal} kcal</span><span class="chip">${icon('moon')}Lit ${p.bed.replace(':00', 'h').replace(':', 'h')}</span>${p.stepsGoal ? `<span class="chip">${icon('steps')}8000 pas</span>` : ''}</div>
    <div class="nav"><button data-act="dayNav" data-n="-1" aria-label="Jour précédent">${icon('left')}</button>${isToday ? '' : `<button class="today" data-act="dayNav" data-n="0">Aujourd’hui</button>`}<button data-act="dayNav" data-n="1" aria-label="Jour suivant">${icon('right')}</button></div>
  </section>`;

  if (isToday) h += banners(p, dd);
  for (const n of p.notes) h += `<div class="card warn banner">${tileHtml('alert', 'yellow')}<div class="grow">${n}</div></div>`;

  // Anneaux du jour
  const kcal = kcalOf(dd), prot = protOf(dd);
  const over = kcal > p.kcal + 150;
  const steps = dd.steps || 0;
  h += `<div class="rings">
    <a class="card mini" href="#/food">${ring(kcal / p.kcal, { size: 64, stroke: 7, color: over ? 'var(--bad)' : 'url(#gK)', grad: gradDef('gK', '#ffb14a', '#ff6a1f'), inner: `<span style="color:#ff9a3c">${icon('flame')}</span>` })}
      <div class="val">${kcal}<small> / ${p.kcal}</small></div><div class="lab">Calories</div></a>
    <a class="card mini" href="#/food">${ring(prot / 135, { size: 64, stroke: 7, color: 'url(#gP)', grad: gradDef('gP', '#b5a8ff', '#6f5bff'), inner: `<span style="color:#a996ff">${icon('zap')}</span>` })}
      <div class="val">${prot}<small> / 130 g</small></div><div class="lab">Protéines</div></a>
    <div class="card mini">${ring(p.stepsGoal ? steps / p.stepsGoal : Math.min(1, steps / 8000), { size: 64, stroke: 7, color: 'url(#gS)', grad: gradDef('gS', '#6ff0dd', '#0fa6a0'), inner: `<span style="color:#4be3cf">${icon('steps')}</span>` })}
      <input type="number" inputmode="numeric" placeholder="pas" value="${dd.steps ?? ''}" data-change="steps" data-date="${d}" aria-label="Nombre de pas">
      <div class="lab">${p.stepsGoal ? 'Pas · 8000' : 'Pas'}</div></div>
  </div>`;

  // Match du week-end (de jeudi à dimanche)
  if ([4, 5, 6, 0].includes(p.w)) {
    const m = state.matches[mon] || 'none';
    h += `<div class="card"><div class="row between"><div class="row">${tileHtml('trophy', 'orange')}<b>Match ce week-end ?</b></div>${m !== 'none' && !D.matchAllowed(state, m === 'sat' ? U.addDays(mon, 5) : U.addDays(mon, 6)) ? '<span class="chip bad">Pas pour toi</span>' : ''}</div>
      <div class="seg" style="margin-top:12px">${[['sat', 'Samedi'], ['sun', 'Dimanche'], ['none', 'Pas de match']].map(([v, l]) => `<button class="${m === v ? 'on' : ''}" data-act="setMatch" data-mon="${mon}" data-v="${v}">${l}</button>`).join('')}</div></div>`;
  }

  // Programme
  h += `<h2>Programme <span class="count">${done}/${tasks.length}</span></h2><div class="card tight">`;
  for (const t of tasks) {
    const on = !!dd.checks[t.id];
    const [ic, col] = TASK_STYLE[t.id] || ['check', 'gray'];
    h += `<div class="item ${on ? 'done' : ''}">${tileHtml(ic, col)}<div class="txt"><b>${t.text}</b>${t.sub ? `<div class="sub">${t.sub}</div>` : ''}</div>
      ${t.link ? `<a class="go" href="${t.link}" aria-label="Ouvrir">${icon('right', 20)}</a>` : ''}<button class="check ${on ? 'on' : ''}" data-act="check" data-date="${d}" data-id="${t.id}" aria-label="Cocher">${CHECK}</button></div>`;
  }
  h += `</div>`;

  // Repas
  const MEAL_COL = { m_b: 'yellow', m_l: 'green', m_s: 'orange', m_d: 'indigo' };
  const eaten = p.meals.filter((m) => dd.checks[m.id]).length;
  h += `<h2>Repas prévus <span class="count">${eaten}/4</span></h2><div class="card tight">`;
  for (const m of p.meals) {
    const key = (dd.swap && dd.swap[m.id]) || m.key;
    const f = D.FOOD[key];
    const on = !!dd.checks[m.id];
    h += `<div class="item ${on ? 'done' : ''}">${tileHtml('food', MEAL_COL[m.id])}
      <div class="txt"><div class="kick">${m.label}</div><b>${f.name}</b><div class="sub num">${f.kcal} kcal · ${f.prot} g prot${m.extra ? ' · ' + m.extra : ''}</div></div>
      ${on ? '' : `<button class="x" data-act="swapMeal" data-date="${d}" data-id="${m.id}" data-key="${key}" aria-label="Changer de repas">${icon('swap')}</button>`}
      <button class="check ${on ? 'on' : ''}" data-act="meal" data-date="${d}" data-id="${m.id}" data-key="${key}" aria-label="Mangé">${CHECK}</button></div>`;
  }
  h += `</div>`;

  // Sommeil + pesée
  const lastNight = dd.sleep && U.sleepMinutes(dd.sleep.bed, dd.sleep.wake);
  const wToday = state.weights.find((w) => w.date === d);
  const nW = weekWeights(d).length;
  h += `<h2>Corps</h2><div class="grid2">
    <a class="stat" href="#/sommeil"><div class="k">Nuit dernière</div><div class="v ${lastNight == null ? '' : lastNight < 420 ? 'bad' : ''}">${lastNight == null ? '–' : U.fmtDur(lastNight)}</div>
      <div class="bar ${lastNight != null && lastNight < 420 ? 'bad' : 'indigo'}"><i style="width:${lastNight ? pct(lastNight, 480) : 0}%"></i></div><div class="s">${lastNight == null ? 'Toucher pour saisir' : lastNight < 420 ? 'Moins de 7h. Ce soir tôt.' : 'Propre, 7h+'}</div></a>
    <div class="stat"><div class="k">Pesée · ${nW}/3</div>${wToday
      ? `<a href="#/poids" style="color:inherit"><div class="v">${U.fmtKg(wToday.kg)}<span class="small muted"> kg</span></div><div class="s">Pesé ce matin</div></a>`
      : `<div class="row" style="gap:6px;margin-top:6px"><input id="qw" type="text" inputmode="decimal" placeholder="kg" style="min-height:40px;padding:6px 10px"><button class="primary sm" data-act="quickWeight" style="min-height:40px">OK</button></div><div class="s">À jeun, le matin</div>`}</div>
  </div>`;

  h += `<p class="quote">« ${PUNCH[((U.dayIndex(d) % PUNCH.length) + PUNCH.length) % PUNCH.length]} »</p>`;
  return h;
}

function banners(p, dd) {
  const m = U.nowMin();
  const out = [];
  const add = (cls, ic, col, html) => out.push(`<div class="card banner ${cls}">${tileHtml(ic, col)}<div class="grow">${html}</div></div>`);

  const pain = state.calf.logs.filter((l) => l.date >= state.calf.stageStart && l.pain > 0 && !l.ack).pop();
  if (pain) add('bad', 'leg', 'pink', `<b>Mollet : ${pain.pain}/10 le ${U.fmtDate(pain.date)}.</b> Tu recules d’une étape. Pas de négo. <a href="#/mollet">Voir</a>`);

  const n = weekWeights(p.date).length;
  if (m < 11 * 60 && n < 3 && !state.weights.some((w) => w.date === p.date)) add('acc', 'scale', 'orange', `Pesée à jeun ce matin ? T’en es à <b>${n}/3</b> cette semaine.`);
  if (m >= 12 * 60 && m < 15 * 60 && !dd.checks.walk) add('acc', 'walk', 'teal', 'Repas avalé ? <b>15-20 min de marche.</b> Maintenant, pas « tout à l’heure ».');
  if (p.isWork && m >= 7 * 60 + 30 && m < 18 * 60) {
    add('', 'stand', 'teal', `<div class="row between"><span>Debout 2-3 min toutes les 45 min.</span><button class="sm ${timers.ordi ? 'on' : ''}" data-act="${timers.ordi ? 'ordiStop' : 'ordiStart'}">${timers.ordi ? 'Stop' : '45 min'}</button></div>`);
  }
  if ((p.w === 0 || p.w === 3) && m >= 14 * 60 && !dd.checks.prep) add('warn', 'box', 'green', '<b>Meal prep aujourd’hui.</b> 1h. Sinon c’est fast-food mardi, on le sait.');
  const bed = U.toMin(p.bed);
  if (!dd.checks.bed && m >= bed - 60 && m < bed + 180) {
    const left = bed - m;
    add(left < 0 ? 'bad' : 'warn', 'bed', 'indigo', left > 0 ? `<b>Au lit dans ${left} min.</b> Écran off, ordi sur la table.` : `<b>${-left} min de retard</b> pour dormir. Pose ce téléphone.`);
  }
  return out.join('');
}

// ================= Poids =================
function vPoids() {
  const ws = sortedWeights();
  const weeks = weeklyAverages();
  const t = U.today();
  const P = D.PROFILE;
  const cur = weeks.find((w) => w.mon === U.monday(t));
  const prevWeeks = weeks.filter((w) => w.mon < U.monday(t));
  const prev = prevWeeks[prevWeeks.length - 1];
  const target = D.targetWeight(t);
  const ref = cur?.avg ?? prev?.avg ?? P.startWeight;
  const before = prev?.avg ?? P.startWeight;
  const delta = cur ? cur.avg - before : null;
  const lost = Math.max(0, P.startWeight - ref);
  const prog = pct(P.startWeight - ref, P.startWeight - P.goalWeight);
  let h = '';

  h += `<section class="hero"><div class="day">${cur ? 'Moyenne de la semaine' : 'Dernière moyenne'}</div>
    <div class="wtop" style="margin-top:8px;position:relative;z-index:1"><div class="big">${U.fmtKg(ref)}<small>kg</small></div>
    ${delta != null ? `<span class="delta ${delta <= 0 ? 'down' : 'up'}">${delta <= 0 ? '▼' : '▲'} ${U.fmtKg(Math.abs(delta))} kg</span>` : ''}</div>
    <div class="goalbar" style="position:relative;z-index:1"><div class="bar"><i style="width:${prog}%"></i></div>
    <div class="lbl"><span>${P.startWeight} kg</span><span style="color:var(--text)">−${U.fmtKg(lost)} kg</span><span>${P.goalWeight} kg</span></div></div></section>`;

  h += `<div class="card"><div class="row"><input id="w-kg" type="text" inputmode="decimal" placeholder="Poids du matin (kg)" class="grow" style="font-size:20px;font-family:var(--num);font-weight:700">
    <button class="primary" data-act="addWeight" aria-label="Enregistrer" style="width:52px;padding:0">${icon('plus')}</button></div>
    <div class="row" style="margin-top:8px"><span class="small muted grow">3 matins par semaine, à jeun. Jamais après le sauna.</span><input id="w-date" type="date" value="${t}" style="width:150px;min-height:38px;font-size:14px;padding:6px 10px"></div></div>`;

  h += `<div class="grid3">
    <div class="stat"><div class="k">Pesées</div><div class="v">${cur ? cur.n : 0}<span class="small muted">/3</span></div><div class="s">cette semaine</div></div>
    <div class="stat"><div class="k">Cible</div><div class="v">${U.fmtKg(target)}</div><div class="s ${ref <= target + 0.3 ? 'good' : 'bad'}">${ref <= target + 0.3 ? 'Dans les clous' : `+${U.fmtKg(ref - target)} kg`}</div></div>
    <div class="stat"><div class="k">Reste</div><div class="v">${U.fmtKg(Math.max(0, ref - P.goalWeight))}</div><div class="s">jusqu’à 65</div></div>
  </div>`;

  h += `<h2>Évolution</h2><div class="card">${chart(ws, weeks)}
    <div class="row wrap small muted" style="gap:14px;margin-top:8px"><span><b class="acc">●</b> pesées</span><span><b style="color:#ff5a3c">━</b> moyenne semaine</span><span>┅ courbe cible</span></div></div>`;

  if (weeks.length) {
    h += `<h2>Semaine par semaine</h2><div class="card tight">`;
    const rows = [];
    weeks.forEach((w, i) => {
      const b = i === 0 ? P.startWeight : weeks[i - 1].avg;
      const loss = b - w.avg;
      rows.push(`<div class="item"><span class="delta ${loss >= 0 ? 'down' : 'up'}">${loss >= 0 ? '−' : '+'}${U.fmtKg(Math.abs(loss))}</span><div class="txt"><b class="num">${U.fmtKg(w.avg)} kg <span class="small muted">· sem. du ${U.fmtDate(w.mon)}</span></b><div class="sub">${weekComment(loss, i === 0)}</div></div></div>`);
    });
    h += rows.reverse().join('') + `</div>`;
  }

  h += `<h2>Pesées</h2><div class="card tight">${ws.length ? [...ws].reverse().slice(0, 20).map((w) =>
    `<div class="item"><div class="txt"><b class="num">${U.fmtKg(w.kg)} kg</b><div class="sub">${U.fmtDay(w.date)}</div></div><button class="x" data-act="delWeight" data-date="${w.date}" aria-label="Supprimer">${XI}</button></div>`).join('')
    : '<div class="empty">Aucune pesée. Départ : 73 kg mi-novembre.</div>'}</div>`;
  return h;
}

function chart(ws, weeks) {
  const P = D.PROFILE;
  const W = 340, H = 210, L = 30, R = 8, T = 12, B = 22;
  const lastDate = ws.length ? ws[ws.length - 1].date : P.startDate;
  const x0 = P.startDate, x1 = lastDate > P.goalDate ? U.addDays(lastDate, 7) : U.addDays(P.goalDate, 7);
  const vals = ws.map((w) => w.kg).concat([P.startWeight, P.goalWeight]);
  const y0 = Math.floor(Math.min(...vals) - 1), y1 = Math.ceil(Math.max(...vals) + 1);
  const span = U.diffDays(x0, x1);
  const X = (d) => L + (U.diffDays(x0, d) / span) * (W - L - R);
  const Y = (v) => T + ((y1 - v) / (y1 - y0)) * (H - T - B);
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Courbe de poids">
    <defs><linearGradient id="gLine" x1="0" x2="1"><stop offset="0" stop-color="#ffb14a"/><stop offset="1" stop-color="#ff3d71"/></linearGradient>
    <linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff5a3c" stop-opacity=".35"/><stop offset="1" stop-color="#ff5a3c" stop-opacity="0"/></linearGradient></defs>`;
  for (let v = y0; v <= y1; v++) {
    if (v % 2) continue;
    s += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="rgba(255,255,255,.06)" stroke-width="1"/><text x="${L - 6}" y="${Y(v) + 3}" text-anchor="end">${v}</text>`;
  }
  for (const [d, lab] of [['2026-12-01', 'déc.'], ['2027-01-01', 'janv.'], ['2027-02-01', 'févr.'], ['2027-03-01', 'mars']]) {
    if (d > x0 && d < x1) s += `<text x="${X(d)}" y="${H - 5}" text-anchor="middle">${lab}</text>`;
  }
  s += `<line x1="${X(P.milestoneDate)}" x2="${X(P.milestoneDate)}" y1="${T}" y2="${H - B}" stroke="var(--warn)" stroke-opacity=".6" stroke-dasharray="2 3"/>
    <text x="${X(P.milestoneDate) + 4}" y="${T + 8}" style="fill:var(--warn)">1er janv. ≈ 68,5</text>`;
  s += `<line x1="${L}" x2="${W - R}" y1="${Y(P.goalWeight)}" y2="${Y(P.goalWeight)}" stroke="var(--good)" stroke-opacity=".7" stroke-dasharray="4 3"/>
    <text x="${W - R}" y="${Y(P.goalWeight) - 5}" text-anchor="end" style="fill:var(--good)">objectif 65</text>`;
  s += `<polyline fill="none" stroke="rgba(255,255,255,.35)" stroke-width="1.5" stroke-dasharray="5 4" points="${[[P.startDate, P.startWeight], [P.milestoneDate, P.milestoneWeight], [P.goalDate, P.goalWeight]].map(([d, v]) => `${X(d)},${Y(v)}`).join(' ')}"/>`;
  if (weeks.length) {
    const pts = [[P.startDate, P.startWeight], ...weeks.map((w) => [U.addDays(w.mon, 3), w.avg])].map(([d, v]) => [X(d), Y(v)]);
    const line = pts.map(([x, y]) => `${x},${y}`).join(' ');
    s += `<polygon fill="url(#gArea)" points="${pts[0][0]},${H - B} ${line} ${pts[pts.length - 1][0]},${H - B}"/>`;
    s += `<polyline fill="none" stroke="url(#gLine)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" points="${line}"/>`;
  }
  s += `<circle cx="${X(P.startDate)}" cy="${Y(P.startWeight)}" r="4.5" fill="var(--bg)" stroke="#fff" stroke-width="2"/>`;
  for (const w of ws) s += `<circle cx="${X(w.date)}" cy="${Y(w.kg)}" r="3.5" fill="#ff8a1f" stroke="var(--bg)" stroke-width="1.5"/>`;
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
  if (ok && ex.weighted) return { up: true, kg: kg + ex.inc, text: `Tout validé la dernière fois (${recap}). Passe à <b>${U.fmtKg(kg + ex.inc).replace(',0', '')} kg</b>.` };
  if (ok) return { up: true, text: `Tout validé la dernière fois. Vise <b>${ex.unit === 'sec' ? '+5 s' : '+1 rep'}</b> par série.` };
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

const SESSION_COL = { A: 'violet', B: 'blue', S: 'teal' };

function vMuscu(params) {
  if (state.active) return vWorkout();
  const plan = D.dayPlan(U.today(), state);
  const rec = params.s || plan.session;
  let h = '';
  for (const key of ['A', 'B', 'S']) {
    const S = D.SESSIONS[key];
    const exs = S.exercises.filter((e) => e.cond !== 'jumps' || jumpsOK());
    const last = [...state.workouts].reverse().find((w) => w.session === key);
    const [kick, title] = S.name.split(' · ');
    h += `<section class="session s${key} ${rec === key ? 'rec' : ''}"><div class="letter">${key}</div>
      <div class="day" style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.6)">${kick}</div>
      <h3 style="font-size:24px;font-weight:800;margin-top:2px">${U.cap(title)}</h3>
      <div class="meta">${rec === key ? `<span class="chip solid">${icon('zap')}Aujourd’hui</span>` : ''}<span class="chip">${icon('clock')}${S.duration}</span><span class="chip">${exs.length} exos</span>${last ? `<span class="chip">Dernière : ${U.fmtDate(last.date)}</span>` : ''}</div>
      <ul class="exlist">${exs.map((e) => `<li><span>${e.name}</span><span>${e.sets}×${e.reps}${e.unit === 'sec' ? ' s' : ''}</span></li>`).join('')}</ul>
      ${key === 'A' && !jumpsOK() ? '<p class="small muted" style="margin-top:-6px">Sauts sur box : débloqués en étape 3, si zéro douleur.</p>' : ''}
      <button class="${rec === key ? 'primary' : ''} full" data-act="startSession" data-s="${key}">${icon('play')}Commencer</button></section>`;
  }
  h += `<h2>Les règles</h2><div class="card"><div class="row between"><b>Repos entre séries</b>
    <div class="seg" style="width:160px">${[90, 120].map((r) => `<button class="${state.prefs.rest === r ? 'on' : ''}" data-act="setRest" data-v="${r}">${r === 90 ? '1:30' : '2:00'}</button>`).join('')}</div></div>
    <ul class="rules small muted">${D.MUSCU_RULES.map((r) => `<li>${r}</li>`).join('')}</ul></div>`;
  const hist = [...state.workouts].reverse().slice(0, 15);
  h += `<h2>Historique</h2><div class="card tight">${hist.length ? hist.map((w) => {
    const S = D.SESSIONS[w.session];
    const lines = S.exercises.filter((e) => w.sets[e.id]).map((e) => `<div class="small" style="margin:4px 0"><b>${e.name}</b> <span class="muted num">${w.sets[e.id].filter((s) => s.done).map((s) => (e.weighted ? `${U.fmtKg(s.kg || 0).replace(',0', '')}×${s.reps}` : `${s.reps}${e.unit === 'sec' ? 's' : ''}`)).join(' · ') || 'non faite'}</span></div>`).join('');
    const nb = Object.values(w.sets).flat().filter((s) => s.done).length;
    return `<details class="item" style="display:block"><summary class="row"><span class="tile c-${SESSION_COL[w.session]}" style="font-family:var(--num);font-weight:800">${w.session}</span><span class="grow"><b>${U.fmtDay(w.date)}</b><div class="small muted">${nb} séries</div></span><span class="go">${icon('right', 20)}</span></summary>
      <div style="margin-top:10px">${lines}<button class="sm danger ghost" style="margin-top:8px;padding-left:0" data-act="delWorkout" data-id="${w.id}">Supprimer</button></div></details>`;
  }).join('') : '<div class="empty">Pas encore de séance. Ça commence mardi.</div>'}</div>`;
  return h;
}

function vWorkout() {
  const a = state.active;
  const S = D.SESSIONS[a.session];
  const total = Object.values(a.sets).flat();
  const nDone = total.filter((s) => s.done).length;
  const [kick, title] = S.name.split(' · ');
  let h = `<section class="session s${a.session}"><div class="letter">${a.session}</div>
    <div class="row between" style="position:relative"><div><div class="small" style="font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.6)">${kick}</div><h3 style="font-size:22px;font-weight:800">${U.cap(title)}</h3></div><span class="chip num">${nDone}/${total.length}</span></div>
    <div class="progress-top"><i style="width:${pct(nDone, total.length)}%"></i></div>
    <p class="small" style="margin-top:12px"><b>Échauffement :</b> ${S.warmup}</p><p class="small muted">${S.after}</p>
    <div class="seg" style="margin-top:10px">${[90, 120].map((r) => `<button class="${state.prefs.rest === r ? 'on' : ''}" data-act="setRest" data-v="${r}">Repos ${r === 90 ? '1:30' : '2:00'}</button>`).join('')}</div></section>`;
  h += `<div class="card tight">`;
  let n = 0;
  for (const ex of S.exercises) {
    const sets = a.sets[ex.id];
    if (!sets) continue;
    n++;
    const sug = suggestion(ex);
    const allDone = sets.every((s) => s.done);
    h += `<div class="ex"><div class="head"><span class="tile ${allDone ? 'c-green' : 'c-' + SESSION_COL[a.session]}">${allDone ? icon('check') : n}</span><div class="grow"><b>${ex.name}</b>${ex.note ? `<div class="small muted">${ex.note}</div>` : ''}</div><span class="chip num">${ex.sets}×${ex.reps}${ex.unit === 'sec' ? ' s' : ''}</span></div>
      ${sug ? `<div class="hint ${sug.up ? 'up' : ''}">${icon(sug.up ? 'trend' : 'clock')}<span class="grow">${sug.text}</span>${sug.up && sug.kg != null && sets.some((s) => !s.done && (s.kg ?? 0) < sug.kg) ? `<button class="sm" data-act="applyInc" data-ex="${ex.id}" data-kg="${sug.kg}">Appliquer</button>` : ''}</div>` : ''}`;
    sets.forEach((s, i) => {
      h += `<div class="setrow ${ex.weighted ? '' : 'nokg'} ${s.done ? 'done' : ''}"><span class="n">${i + 1}</span>
        ${ex.weighted ? `<div class="unit"><input type="text" inputmode="decimal" value="${s.kg ?? ''}" data-change="setKg" data-ex="${ex.id}" data-i="${i}" aria-label="Charge"><span>kg</span></div>` : ''}
        <div class="unit"><input type="number" inputmode="numeric" value="${s.reps ?? ''}" data-change="setReps" data-ex="${ex.id}" data-i="${i}" aria-label="Répétitions"><span>${ex.unit === 'sec' ? 's' : 'reps'}</span></div>
        <button class="check ${s.done ? 'on' : ''}" data-act="setDone" data-ex="${ex.id}" data-i="${i}" aria-label="Série faite">${CHECK}</button></div>`;
    });
    h += `</div>`;
  }
  h += `</div><div class="grid2"><button class="danger" data-act="cancelSession">Annuler</button><button class="primary" data-act="finishSession">${icon('check')}Terminer</button></div>`;
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
  const over = left < -150;
  let h = `<section class="hero"><div class="row between"><div class="grow">
      <div class="day">${d === U.today() ? 'Aujourd’hui' : U.fmtDay(d)}</div>
      <div class="title" style="margin-bottom:6px">${over ? `${-left} kcal de trop` : left >= 0 ? `Reste ${left} kcal` : 'Pile dans l’objectif'}</div>
      <div class="small" style="color:rgba(255,255,255,.7)">${p.basket ? 'Jour de basket' : 'Jour sans basket'} · objectif ${p.kcal}</div>
      <div style="margin-top:14px"><div class="row between small"><b>Protéines</b><span class="num"><b>${prot}</b> / 130-140 g</span></div><div class="bar ${prot >= 130 ? 'good' : ''}" style="background:rgba(255,255,255,.12)"><i style="width:${pct(prot, 135)}%"></i></div></div>
    </div>
    ${ring(kcal / p.kcal, { size: 104, stroke: 11, color: over ? 'var(--bad)' : 'url(#gF)', grad: gradDef('gF'), track: 'rgba(255,255,255,.12)', inner: `<b style="font-size:22px">${kcal}</b><small>kcal</small>` })}</div>
    <div class="nav"><button data-act="foodNav" data-n="-1" aria-label="Jour précédent">${icon('left')}</button><button data-act="foodNav" data-n="1" aria-label="Jour suivant">${icon('right')}</button></div></section>`;

  h += `<div class="card ${ff ? 'warn' : ''}" style="padding:12px 16px"><div class="row">${tileHtml('food', 'red')}<div class="grow"><b>Fast-food de la semaine</b><div class="small muted">${ff ? 'Fait. Le prochain, c’est la semaine prochaine.' : '1 par semaine, assumé. Pas encore utilisé.'}</div></div><button class="check ${ff ? 'on' : ''}" data-act="fastfood" data-mon="${mon}" aria-label="Fast-food fait">${CHECK}</button></div></div>`;

  const CAT_COL = { 'Petit-déj': '#ffd66b', Midi: '#5be4ad', Collation: '#ffa53b', Soir: '#8c9bff', Extra: '#ff8fb4' };
  h += `<h2>Ajout rapide</h2><div class="card">`;
  for (const cat of ['Petit-déj', 'Midi', 'Collation', 'Soir', 'Extra']) {
    h += `<div class="cat"><span class="dot" style="background:${CAT_COL[cat]}"></span>${cat}</div><div class="foodchips">${Object.entries(D.FOOD).filter(([, f]) => f.cat === cat).map(([k, f]) => `<button data-act="addFood" data-key="${k}">${f.name}<small>${f.kcal}</small></button>`).join('')}</div>`;
  }
  h += `<div class="cat"><span class="dot" style="background:var(--muted)"></span>Autre chose</div><div class="row"><input id="f-kcal" type="number" inputmode="numeric" placeholder="kcal"><input id="f-prot" type="number" inputmode="numeric" placeholder="prot (g)"><button class="primary" data-act="addManual" aria-label="Ajouter" style="width:52px;padding:0;flex:none">${icon('plus')}</button></div></div>`;

  h += `<h2>Mangé <span class="count">${dd.food.length}</span></h2><div class="card tight">${dd.food.length ? dd.food.map((f) => `<div class="item"><div class="txt"><b>${U.esc(f.name)}</b><div class="sub num">${f.kcal} kcal · ${f.prot} g prot</div></div><button class="x" data-act="delFood" data-id="${f.id}" aria-label="Supprimer">${XI}</button></div>`).join('') : '<div class="empty">Rien noté pour ce jour.</div>'}</div>`;
  h += `<h2>L’assiette</h2><div class="card"><ul class="rules small">${D.PLATE_RULES.map((r) => `<li>${r}</li>`).join('')}</ul><p class="small muted">Pas de saumon. Meal prep le dimanche et le mercredi, 1h.</p></div>`;
  return h;
}

// ================= Plus =================
function vPlus() {
  const items = [
    ['courses', 'cart', 'green', 'Courses', `${state.shopping.filter((s) => s.done).length}/${state.shopping.length} dans le caddie`],
    ['sommeil', 'bed', 'indigo', 'Sommeil', '7h minimum, alerte sinon'],
    ['pas', 'steps', 'teal', 'Pas', '8000 les jours sans boulot'],
    ['mollet', 'leg', 'pink', 'Mollet', `Reprise : ${D.CALF_STAGES[state.calf.stage].title}`],
    ['rappels', 'bell', 'yellow', 'Rappels', 'Coucher, marche, ordi, meal prep'],
    ['reglages', 'gear', 'gray', 'Sauvegarde & réglages', 'Exporter / importer tes données'],
  ];
  return `<div class="card tight menu">${items.map(([r, ic, col, t, s]) => `<a href="#/${r}">${tileHtml(ic, col)}<span class="txt">${t}<div class="sub">${s}</div></span><span class="go">${icon('right', 20)}</span></a>`).join('')}</div>`;
}
const back = `<a class="back" href="#/plus">${icon('left')}Plus</a>`;

// ================= Courses =================
function vCourses() {
  const n = state.shopping.filter((s) => s.done).length;
  let h = back + `<div class="card"><div class="row between"><b>${n}/${state.shopping.length} dans le caddie</b><button class="sm" data-act="shopReset">Nouvelle semaine</button></div><p class="small muted">Budget max 250 CHF. Cette liste ≈ 120-150 CHF.</p></div>`;
  for (const cat of D.SHOP_CATS) {
    const items = state.shopping.filter((s) => s.cat === cat);
    if (!items.length) continue;
    h += `<h2>${cat}</h2><div class="card tight">${items.map((s) => `<div class="item ${s.done ? 'done' : ''}"><button class="check ${s.done ? 'on' : ''}" data-act="shopToggle" data-id="${s.id}">${CHECK}</button><div class="txt"><b>${U.esc(s.name)}</b></div><button class="x" data-act="shopDel" data-id="${s.id}" aria-label="Supprimer">${XI}</button></div>`).join('')}</div>`;
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
      ? `<div class="card bad"><b>${U.fmtDur(m)} de sommeil.</b> En dessous de 7h. Ce soir, au lit à ${D.dayPlan(t, state).bed.replace(':', 'h')}, point.</div>`
      : `<div class="card good"><b>${U.fmtDur(m)}.</b> Propre.</div>`;
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

  h += `<div class="card"><div class="item" style="padding:0;border:0;min-height:0"><button class="check ${c.physioOK ? 'on' : ''}" data-act="calfPhysio">${CHECK}</button><div class="txt"><b>Feu vert du physio pour les matchs</b><div class="sub">Obligatoire avant de rejouer un match.</div></div></div></div>`;
  h += `<h2>Pour toujours</h2><div class="card"><ul class="rules small">${D.CALF_FOREVER.map((r) => `<li>${r}</li>`).join('')}<li>Pendant la reprise, tu peux sauter la muscu du jeudi matin.</li></ul></div>`;
  h += `<h2>Historique</h2><div class="card tight">${c.logs.length ? [...c.logs].reverse().slice(0, 30).map((l) => `<div class="item"><span class="chip ${l.pain ? 'bad' : 'good'}">${l.pain}/10</span><div class="txt"><b>${U.cap(l.ctx)}</b><div class="sub">${U.fmtDay(l.date)} · étape ${l.stage}</div></div><button class="x" data-act="calfDel" data-id="${l.id}">${XI}</button></div>`).join('') : '<div class="empty">Aucune note encore.</div>'}</div>`;
  return h;
}

// ================= Rappels =================
// webcal:// ouvre directement l’app Calendrier (abonnement), même depuis l’app installée.
const cal = (file) => (location.protocol === 'https:' ? `webcal://${location.host}${location.pathname.replace(/[^/]*$/, '')}${file}` : file);

function vRappels() {
  return back + `<div class="card acc"><b>Vraies notifications sur l’iPhone</b>
    <p class="small">Une app web ne peut pas programmer de notifs toute seule. L’astuce : les rappels passent par ton Calendrier, avec des alarmes qui sonnent même app fermée.</p>
    <a class="btn primary full" href="${cal('rappels.ics')}">${icon('calendar')}Ajouter les rappels au Calendrier</a>
    <p class="small muted">Coucher (dim-mer), marche après le midi (tous les jours), meal prep (dim + mer), pesée (lun, mer, ven).</p>
    <a class="btn full" href="${cal('rappels-ordi.ics')}" style="margin-top:6px">${icon('stand')}Ajouter « lève-toi » (lun-mer)</a>
    <p class="small"><b>Ensuite, sur l’iPhone :</b></p>
    <ol class="rules small"><li>Calendrier s’ouvre → touche <b>S’abonner</b>.</li><li>Sur l’écran suivant, <b>désactive « Supprimer les alarmes »</b>, sinon rien ne sonne.</li><li>Touche <b>OK</b> (ou Ajouter).</li></ol>
    <p class="small muted">Pour les enlever : Calendrier → Calendriers → « New Me » → ⓘ → Se désabonner.</p></div>
  <h2>Dans l’app</h2><div class="card"><div class="row between"><div class="row">${tileHtml('stand', 'teal')}<b>Minuteur « lève-toi » 45 min</b></div><button class="sm ${timers.ordi ? 'on' : ''}" data-act="${timers.ordi ? 'ordiStop' : 'ordiStart'}">${timers.ordi ? 'Arrêter' : 'Lancer'}</button></div>
    <p class="small muted">Sonne seulement si l’app est ouverte. Sur l’écran « Aujourd’hui », les bandeaux te rappellent : pesée, marche, meal prep, heure de coucher.</p></div>
  <h2>Les horaires</h2><div class="card tight">
    ${[['bed:indigo', 'Coucher', 'Dim, lun, mer : alarme 21h30 (au lit 22h). Mar : alarme 21h (au lit 21h30).'], ['walk:teal', 'Marche après le midi', 'Tous les jours à 13h'], ['stand:teal', 'Lève-toi', 'Lun-mer, de 8h30 à 17h, toutes les 45 min'], ['box:green', 'Meal prep', 'Dimanche 17h, mercredi 18h30'], ['scale:orange', 'Pesée à jeun', 'Lundi 5h50, mercredi 5h05, vendredi 8h30']].map(([i, t, s]) => `<div class="item">${tileHtml(...i.split(':'))}<div class="txt"><b>${t}</b><div class="sub">${s}</div></div></div>`).join('')}</div>`;
}

// ================= Réglages =================
function vReglages() {
  const P = D.PROFILE;
  return back + `<div class="card"><b>Ton profil</b><ul class="rules small"><li>23 ans, 165 cm</li><li>Départ ${P.startWeight} kg (${U.fmtDate(P.startDate)}) → ${P.milestoneWeight.toString().replace('.', ',')} kg au 1er janvier → ${P.goalWeight} kg fin février</li><li>Rythme : 0,5-0,7 kg par semaine</li><li>Reprise mollet depuis le ${U.fmtDate(P.rehabStart)}</li></ul></div>
  <h2>Sauvegarde</h2><div class="card"><p class="small">Tout est stocké sur ce téléphone, rien sur internet. Exporte de temps en temps (Fichiers iCloud, par ex.).</p>
    <button class="full" data-act="exportData">${icon('download')}Exporter mes données</button>
    <label class="btn full" style="margin-top:8px">${icon('upload')}Importer une sauvegarde<input type="file" accept="application/json,.json" data-change="importData" hidden></label></div>
  <h2>Zone rouge</h2><div class="card"><button class="danger full" data-act="resetData">Tout effacer</button></div>
  <p class="small muted" style="text-align:center">New Me · v4</p>`;
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
  const key = el.classList.contains('check') ? JSON.stringify(el.dataset) : null;
  ACT[el.dataset.act]?.(el, e);
  if (key) {
    const again = [...document.querySelectorAll('.check')].find((b) => JSON.stringify(b.dataset) === key);
    if (again && again.classList.contains('on')) again.classList.add('pop');
  }
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
