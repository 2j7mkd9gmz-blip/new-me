import { html, useState } from '../../vendor/preact-htm.js';
import { db } from '../db.js';
import { Icon, MultiRing, CheckRow, Sheet, toast, celebrate, fmt0, fmt1 } from '../ui.js';
import { todayKey, dayPlan, weekPlan, fmtDate, dow, addDays, mondayOf, calfState } from '../engine.js';
import { SESSIONS, PROFILE } from '../data/program.js';
import { MEAL_SLOTS } from '../data/meals.js';
import { plannedMeals, logsFor, totalsFor, targets, logPlannedMeal, nutritionAlert, sum, mealItems } from '../nutrition.js';
import { QUOTES, quoteIndexFor } from '../data/quotes.js';
import { go } from '../nav.js';

const LETTER = { A: 'A', A_light: 'A', B: 'B', C: 'C' };

function headline(p) {
  const parts = [];
  if (p.session) parts.push(SESSIONS[p.session].name);
  if (p.basket?.kind === 'match') parts.push(`Match${p.basket.time ? ' ' + p.basket.time : ''}`);
  else if (p.basket) parts.push(`Basket ${p.basket.time}`);
  if (!parts.length) return p.afterMatch ? ['Repos actif', null] : ['Repos', null];
  return [parts[0], parts[1] ? '+ ' + parts[1].toLowerCase().replace(/^match/, 'match') : null];
}

export function Today() {
  const k = todayKey();
  const p = dayPlan(k);
  const checks = db.get('checks', k) || {};
  const toggle = id => {
    const next = { ...checks, [id]: !checks[id] };
    db.put('checks', k, next);
    if (next[id]) maybeCelebrate(next);
  };
  const maybeCelebrate = next => {
    const ids = items.map(i => i.id);
    if (ids.length && ids.every(i => next[i])) { celebrate(); toast('Journée bouclée. Respect.'); }
  };

  const [h1, h2] = headline(p);
  const t = totalsFor(k);
  const g = targets(k);
  const steps = db.get('steps', k)?.steps || 0;
  const sleep = db.get('sleep', k);
  const weight = db.get('weight', k);
  const q = QUOTES[quoteIndexFor(k)];
  const alert = nutritionAlert(k);
  const calf = calfState(k);
  const [dayOpen, setDayOpen] = useState(null);
  const [wInput, setWInput] = useState('');

  // ---- checklist du programme ----
  const items = [];
  if (p.session) items.push({ id: 'session', label: `${SESSIONS[p.session].name} · ${SESSIONS[p.session].duration} min`, meta: SESSIONS[p.session].subtitle, open: () => go('train', `session/${p.session}`) });
  if (p.sauna) items.push({ id: 'sauna', label: 'Sauna après la séance', meta: 'Bois bien après. Le poids perdu, c’est de l’eau.' });
  if (p.basket) {
    items.push({ id: 'bwarm', label: 'Échauffement 10-15 min avant le basket', meta: 'Mollet compris, pour toujours.' });
    items.push({ id: 'basket', label: p.basket.kind === 'match' ? `Match ${p.basket.time}${p.basket.opponent ? ' · ' + p.basket.opponent : ''}` : `Basket ${p.basket.time}-${p.basket.end}`, meta: p.basket.kind === 'match' ? 'Joue ton jeu. Drive and kick.' : 'Défense basse, pieds jamais croisés.' });
    if (p.basket.kind !== 'match') items.push({ id: 'finish', label: 'Finitions au cercle · 10 min', meta: 'Mikan, lay-ups pied gauche et droit, contact au pad, reverse.' });
  }
  if (p.work) items.push({ id: 'walk', label: 'Marche 15-20 min après midi', meta: 'Et lève-toi 2-3 min toutes les 45 min.' });
  else items.push({ id: 'walk', label: 'Marche après le repas de midi', meta: `Objectif ${fmt0(PROFILE.stepsGoal)} pas aujourd’hui.` });
  if (p.mealPrep) items.push({ id: 'prep', label: 'Meal prep · 1h', meta: 'Les midis des prochains jours. Le toi de demain te remercie.' });
  items.push({ id: 'mobility', label: 'Mobilité du soir · 10 min', meta: 'Élastiques, à la maison.', open: () => go('train', 'mobility') });
  if (p.bedLimit || p.bedTime) items.push({ id: 'bed', label: `Au lit ${p.bedTime ? 'vers ' + p.bedTime : ''}${p.bedLimit ? ' · avant ' + p.bedLimit : ''}`, meta: 'Pas d’ordi dans le lit.' });
  else items.push({ id: 'bed', label: 'Au lit, 7h de sommeil minimum', meta: 'Pas d’ordi dans le lit.' });

  const done = items.filter(i => checks[i.id]).length;
  const meals = plannedMeals(k);
  const logs = logsFor(k);

  const saveWeight = () => {
    const v = parseFloat(String(wInput).replace(',', '.'));
    if (!(v > 40 && v < 150)) { toast('Entre un poids valide, genre 71,4'); return; }
    db.put('weight', k, { date: k, kg: v, source: 'manual' });
    setWInput(''); toast(`${fmt1(v)} kg noté. On regarde la moyenne, pas le chiffre.`);
  };

  return html`<div class="screen stack gap-24">
    <header class="stack gap-12">
      <div class="row between">
        <div class="eyebrow">${fmtDate(k)}${p.cycle.started ? ` · Cycle ${p.cycle.cycle} · Sem. ${p.cycle.week}${p.cycle.deload ? ' allégée' : ''}` : ''}</div>
        <button class="icon-btn" style="margin-right:-10px" aria-label="Réglages" onClick=${() => go('settings')}><${Icon} name="settings" size=${20} /></button>
      </div>
      <h1 class="title-xl">${h1}${h2 && html`<br /><span class="accent">${h2}</span>`}</h1>
      ${p.work && html`<div class="row gap-8 small muted"><${Icon} name="briefcase" size=${16} /> Boulot · début ${p.work.start}${p.wake ? ` · lever ${p.wake}` : ''}</div>`}
      ${p.notes.map(n => html`<div class="row gap-8 small" style="color:var(--muted)"><${Icon} name="info" size=${16} style="flex:none" />${n}</div>`)}
    </header>

    <${WeekStrip} k=${k} onOpen=${setDayOpen} />

    <button class="card pressable" style="text-align:left" onClick=${() => go('quote')}>
      <div class="quote">« ${q.t} »</div>
      <div class="row between mt-16"><span class="tiny muted">${q.a}</span><${Icon} name="right" size=${16} style="color:var(--faint)" /></div>
    </button>

    ${calf.alert && html`<div class="card flat" style="background:var(--danger-soft)">
      <div class="row gap-8"><${Icon} name="warning" size=${18} style="color:var(--danger)" /><b class="h3" style="color:var(--danger)">Mollet : on recule d’une étape</b></div>
      <p class="small" style="margin:8px 0 0">Tu as noté de la douleur ou un mollet qui tire. Pas de sprint ni de saut aujourd’hui. On ne négocie pas avec une déchirure.</p>
    </div>`}

    <section class="card">
      <div class="row gap-16">
        <${MultiRing} size=${118} rings=${[
          { value: t.kcal, max: g.kcal, color: 'var(--accent)' },
          { value: t.p, max: g.pMin, color: 'var(--muted)' },
          { value: steps, max: p.stepsGoal || PROFILE.stepsGoal, color: 'var(--text)' },
        ]} />
        <div class="stack gap-8 grow">
          <div><span class="num-m">${fmt0(t.kcal)}</span> <span class="small muted">/ ${fmt0(g.kcal)} kcal</span></div>
          <div><span class="num-m">${fmt0(t.p)}</span> <span class="small muted">/ ${g.pMin}-${g.pMax} g prot.</span></div>
          <div><span class="num-m">${fmt0(steps)}</span> <span class="small muted">${p.stepsGoal ? `/ ${fmt0(p.stepsGoal)} pas` : 'pas · jour de boulot'}</span></div>
        </div>
      </div>
      ${alert && html`<div class="small mt-16" style=${`color:${alert.level === 'danger' ? 'var(--danger)' : 'var(--accent)'}`}>${alert.text}</div>`}
    </section>

    ${p.weighIn && !weight && html`<section class="card tight">
      <div class="row between gap-12">
        <div><div class="h3">Pesée du matin</div><div class="tiny muted">À jeun, après les toilettes.</div></div>
        <div class="row gap-8">
          <input class="input num-input" style="width:86px" inputmode="decimal" placeholder="71,4" value=${wInput} onInput=${e => setWInput(e.target.value)} onKeyDown=${e => e.key === 'Enter' && saveWeight()} />
          <button class="btn accent sm" style="height:48px" onClick=${saveWeight}>OK</button>
        </div>
      </div>
    </section>`}

    <section>
      <div class="section-head"><h2 class="h2">Programme</h2><span class="small muted">${done}/${items.length}</span></div>
      <div class="card" style="padding:4px 18px">
        ${items.map(i => html`<${CheckRow} key=${i.id} on=${!!checks[i.id]} onToggle=${() => toggle(i.id)} label=${i.label} meta=${i.meta}
          right=${i.open && html`<span class="icon-btn" role="button" aria-label="Ouvrir" onClick=${e => { e.stopPropagation(); i.open(); }}><${Icon} name="right" size=${18} /></span>`} />`)}
      </div>
    </section>

    <section>
      <div class="section-head"><h2 class="h2">Repas</h2><button class="small accent" onClick=${() => go('food')}>Tout voir</button></div>
      <div class="card" style="padding:4px 18px">
        ${MEAL_SLOTS.map(s => {
          const m = meals[s.id];
          const logged = logs.filter(l => l.slot === s.id);
          if (!m && !logged.length) return null;
          const on = logged.length > 0;
          return html`<${CheckRow} key=${s.id} on=${on}
            onToggle=${() => {
              if (on) { logged.forEach(l => db.del('foodlog', l.id)); toast('Repas retiré'); }
              else if (m) { logPlannedMeal(k, s.id, m); toast(`${s.label} validé`); }
            }}
            label=${on ? logged.map(l => l.name).join(' + ') : m.name}
            meta=${on ? `${s.label} · ${fmt0(logged.reduce((a, l) => a + l.kcal, 0))} kcal · ${fmt0(logged.reduce((a, l) => a + l.p, 0))} g prot.` : `${s.label} · prévu ${fmt0(sum(mealItems(m, p.basketDay)).kcal)} kcal`} />`;
        })}
      </div>
      <button class="btn ghost block mt-8" onClick=${() => go('food', 'add')}><${Icon} name="plus" size=${18} /> J’ai mangé autre chose</button>
    </section>

    ${sleep && html`<section class="card tight row between">
      <div class="row gap-12"><${Icon} name="moon" size=${20} style="color:var(--muted)" /><div><div class="h3">Nuit dernière</div><div class="tiny muted">${sleep.bed || '—'} → ${sleep.wake || '—'}</div></div></div>
      <div class=${`num-m ${sleep.minutes < PROFILE.sleepMinHours * 60 ? 'danger' : ''}`}>${Math.floor(sleep.minutes / 60)}h${String(sleep.minutes % 60).padStart(2, '0')}</div>
    </section>`}

    <${DaySheet} k=${dayOpen} onClose=${() => setDayOpen(null)} />
  </div>`;
}

function WeekStrip({ k, onOpen }) {
  const wp = weekPlan(k);
  const days = Object.values(wp);
  const L = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  return html`<div class="row between" style="gap:6px">
    ${days.map((d, i) => {
      const isToday = d.key === k;
      const match = d.basket?.kind === 'match';
      return html`<button class="pressable" onClick=${() => onOpen(d.key)} style=${`flex:1;padding:9px 0 8px;border-radius:14px;display:flex;flex-direction:column;align-items:center;gap:5px;background:${isToday ? 'var(--card)' : 'transparent'};${isToday ? 'box-shadow:var(--shadow)' : ''}`}>
        <span class="tiny" style=${`color:${isToday ? 'var(--text)' : 'var(--faint)'};font-weight:500`}>${L[i]}</span>
        <span class="num" style=${`font-size:17px;color:${isToday ? 'var(--text)' : 'var(--muted)'}`}>${Number(d.key.slice(8))}</span>
        <span style="height:14px;display:flex;gap:2px;align-items:center">
          ${d.session && html`<span class="tiny" style="font-weight:600;color:var(--text)">${LETTER[d.session]}</span>`}
          ${d.basket && html`<span style=${`width:6px;height:6px;border-radius:50%;background:${match ? 'var(--accent)' : 'var(--faint)'}`}></span>`}
        </span>
      </button>`;
    })}
  </div>`;
}

function DaySheet({ k, onClose }) {
  const [time, setTime] = useState('');
  const [opp, setOpp] = useState('');
  if (!k) return null;
  const p = dayPlan(k);
  const match = db.get('matches', k);
  const off = db.get('trainingOff', k);
  const addMatch = () => { db.put('matches', k, { date: k, time: time || '', opponent: opp.trim() }); toast('Match ajouté. Le planning de la semaine est recalculé.'); setTime(''); setOpp(''); };
  return html`<${Sheet} open=${!!k} onClose=${onClose} title=${fmtDate(k)}>
    <div class="stack gap-16">
      <div class="stack gap-8">
        ${p.work && html`<div class="row gap-8"><${Icon} name="briefcase" size=${18} /> Boulot, début ${p.work.start}</div>`}
        ${p.session && html`<div class="row gap-8"><${Icon} name="train" size=${18} /> ${SESSIONS[p.session].name} · ${SESSIONS[p.session].subtitle}</div>`}
        ${p.basket && html`<div class="row gap-8"><${Icon} name="ball" size=${18} /> ${p.basket.kind === 'match' ? 'Match' : 'Entraînement'} ${p.basket.time}</div>`}
        ${p.sauna && html`<div class="row gap-8"><${Icon} name="sauna" size=${18} /> Sauna après la séance</div>`}
        ${!p.session && !p.basket && html`<div class="row gap-8 muted"><${Icon} name="moon" size=${18} /> ${p.afterMatch ? 'Repos actif' : 'Repos'}</div>`}
        ${p.notes.map(n => html`<div class="small muted">${n}</div>`)}
      </div>
      <hr class="divider" />
      ${match ? html`<div class="row between">
          <div><div class="h3">Match ${match.time}</div><div class="small muted">${match.opponent || 'Adversaire non précisé'}</div></div>
          <button class="btn ghost sm" onClick=${() => { db.del('matches', k); toast('Match supprimé'); }}>Supprimer</button>
        </div>`
      : html`<div class="stack gap-12">
          <div class="h3">Ajouter un match ce jour-là</div>
          <div class="row gap-8">
            <input class="input" type="time" style="width:120px" value=${time} onInput=${e => setTime(e.target.value)} />
            <input class="input grow" placeholder="Adversaire (optionnel)" value=${opp} onInput=${e => setOpp(e.target.value)} />
          </div>
          <button class="btn primary block" onClick=${addMatch}>Ajouter le match</button>
        </div>`}
      ${!match && [1, 4, 5].includes(dow(k)) && html`<button class="btn ghost block" onClick=${() => { off ? db.del('trainingOff', k) : db.put('trainingOff', k, { date: k }); toast(off ? 'Entraînement rétabli' : 'Entraînement annulé, planning recalculé'); }}>
        ${off ? 'Rétablir l’entraînement de basket' : 'Pas d’entraînement de basket ce jour-là'}
      </button>`}
    </div>
  </${Sheet}>`;
}
