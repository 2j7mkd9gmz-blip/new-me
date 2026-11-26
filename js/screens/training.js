import { html, useState, useEffect, useRef } from '../../vendor/preact-htm.js';
import { db, local } from '../db.js';
import { Icon, Sheet, toast, celebrate, Ring, Empty, fmt1 } from '../ui.js';
import { todayKey, dayPlan, weekPlan, cycleInfo, calfState, suggestion, resolveSession, exerciseHistory, sessionLogs, fmtDate, gateOk, addDays } from '../engine.js';
import { SESSIONS, EXERCISES, WARMUP, MOBILITY, CALF_PHASES } from '../data/program.js';
import { go, back } from '../nav.js';
import { analyzeCycle, hasApiKey } from '../ai.js';

export function Training({ sub }) {
  const [kind, arg] = (sub || '').split('/');
  if (kind === 'session' && SESSIONS[arg]) return html`<${SessionView} id=${arg} />`;
  if (kind === 'mobility') return html`<${MobilityView} />`;
  if (kind === 'ex' && EXERCISES[arg]) return html`<${ExerciseHistory} id=${arg} />`;
  if (kind === 'calf') return html`<${CalfView} />`;
  if (kind === 'cycle') return html`<${CycleView} />`;
  return html`<${Overview} />`;
}

// ------------------------------------------------------------------ vue d’ensemble
function Overview() {
  const k = todayKey();
  const cyc = cycleInfo(k);
  const wp = weekPlan(k);
  const calf = calfState(k);
  const today = wp[k];
  const logs = sessionLogs();
  const weekSessions = Object.values(wp).filter(d => d.session);

  return html`<div class="screen stack gap-24">
    <header class="stack gap-8">
      <div class="eyebrow">Préparation physique</div>
      <h1 class="title-xl">Cycle ${cyc.cycle || 1}<br /><span class="accent">${cyc.deload ? 'Semaine allégée' : `Semaine ${cyc.week || 1}${cyc.week === 1 && cyc.cycle === 1 ? ' · test' : ''}`}</span></h1>
      <p class="small muted" style="margin:0">${cyc.deload ? 'Volume divisé par deux, même intensité. On arrive frais aux matchs.' : 'RPE 7-8 : toujours 2-3 reps en réserve. Jamais courbaturé un jour de match.'}</p>
    </header>

    <div class="row gap-4">
      ${[1, 2, 3, 4].map(w => html`<div class="grow stack gap-4">
        <div style=${`height:3px;border-radius:3px;background:${w < cyc.week ? 'var(--text)' : w === cyc.week ? 'var(--accent)' : 'var(--line)'}`}></div>
        <span class="tiny" style=${`color:${w === cyc.week ? 'var(--text)' : 'var(--faint)'}`}>${w === 4 ? 'Allégée' : 'S' + w}</span>
      </div>`)}
    </div>

    ${today.session && html`<button class="card pressable" style="text-align:left;background:var(--text);color:var(--bg)" onClick=${() => go('train', `session/${today.session}`)}>
      <div class="eyebrow" style="color:inherit;opacity:.6">Aujourd’hui</div>
      <div class="title-l mt-8">${SESSIONS[today.session].name}</div>
      <div class="row between mt-8"><span class="small" style="opacity:.75">${SESSIONS[today.session].subtitle} · ${SESSIONS[today.session].duration} min</span><${Icon} name="play" size=${20} /></div>
    </button>`}

    <section>
      <div class="section-head"><h2 class="h2">Cette semaine</h2></div>
      <div class="card" style="padding:4px 18px">
        ${weekSessions.length ? weekSessions.map(d => {
          const done = logs.some(l => l.date === d.key && l.session === d.session && l.finished);
          return html`<button class="list-row" onClick=${() => go('train', `session/${d.session}`)}>
            <div class="num" style="font-size:26px;width:30px;color:${done ? 'var(--accent)' : 'var(--text)'}">${d.session === 'A_light' ? 'A' : d.session}</div>
            <div class="grow"><div class="h3">${SESSIONS[d.session].name}</div><div class="tiny muted">${fmtDate(d.key)} · ${SESSIONS[d.session].subtitle}</div></div>
            ${done ? html`<span class="tag accent">Fait</span>` : html`<${Icon} name="right" size=${18} style="color:var(--faint)" />`}
          </button>`;
        }) : html`<div class="small muted" style="padding:14px 0">Aucune séance prévue cette semaine.</div>`}
      </div>
    </section>

    <section class="stack gap-8">
      <div class="section-head"><h2 class="h2">Toutes les séances</h2></div>
      ${['A', 'B', 'C'].map(id => {
        const s = SESSIONS[id];
        const locked = s.gate && !(calf.phase >= 3 && calf.zeroPainWeek);
        return html`<button class=${`card tight pressable row gap-16 ${locked ? 'locked' : ''}`} style="text-align:left" onClick=${() => go('train', `session/${id}`)}>
          <div class="num-l" style="width:30px">${id}</div>
          <div class="grow"><div class="h3">${s.subtitle}</div><div class="tiny muted">${s.duration} min${locked ? ' · bloquée pendant la reprise' : ''}</div></div>
          <${Icon} name=${locked ? 'lock' : 'right'} size=${18} style="color:var(--faint)" />
        </button>`;
      })}
      <button class="card tight pressable row gap-16" style="text-align:left" onClick=${() => go('train', 'mobility')}>
        <div style="width:30px;color:var(--muted)"><${Icon} name="refresh" size=${24} /></div>
        <div class="grow"><div class="h3">Routine de mobilité du soir</div><div class="tiny muted">10 min · objectif : toucher tes pieds d’ici 8 semaines</div></div>
        <${Icon} name="right" size=${18} style="color:var(--faint)" />
      </button>
    </section>

    <section class="stack gap-8">
      <div class="section-head"><h2 class="h2">Mollet et cycle</h2></div>
      <button class="card tight pressable row gap-16" style="text-align:left" onClick=${() => go('train', 'calf')}>
        <${Ring} size=${44} stroke=${3} value=${calf.phase} max=${4}><span class="num" style="font-size:16px">${calf.phase}</span></${Ring}>
        <div class="grow"><div class="h3">${CALF_PHASES[calf.phase - 1].name}</div><div class="tiny muted">${calf.last ? `Dernière note : ${calf.last.pain}/10` : 'Note ta douleur après chaque séance'}</div></div>
        <${Icon} name="right" size=${18} style="color:var(--faint)" />
      </button>
      <button class="card tight pressable row gap-16" style="text-align:left" onClick=${() => go('train', 'cycle')}>
        <div style="width:44px;display:flex;justify-content:center;color:var(--accent)"><${Icon} name="sparkle" size=${24} /></div>
        <div class="grow"><div class="h3">Bilan de cycle</div><div class="tiny muted">${cyc.week === 4 ? 'C’est le moment : on prépare le cycle suivant.' : `Disponible en semaine 4 (dans ${Math.max(0, 4 - cyc.week)} sem.)`}</div></div>
        <${Icon} name="right" size=${18} style="color:var(--faint)" />
      </button>
    </section>
  </div>`;
}

// ------------------------------------------------------------------ minuteur de repos
let timerSet = null;
export function startRest(seconds, label) { timerSet?.({ end: Date.now() + seconds * 1000, total: seconds, label }); }

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.22, 0.44].forEach(t => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.value = 880; g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.18);
      o.connect(g).connect(ctx.destination); o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.2);
    });
  } catch {}
  try { navigator.vibrate?.([120, 80, 120]); } catch {}
}

function RestTimer() {
  const [t, setT] = useState(null);
  const [, tick] = useState(0);
  useEffect(() => { timerSet = setT; return () => { timerSet = null; }; }, []);
  useEffect(() => {
    if (!t) return;
    const i = setInterval(() => {
      tick(x => x + 1);
      if (Date.now() >= t.end) { beep(); setT(null); toast('Repos terminé. Série suivante.'); }
    }, 250);
    return () => clearInterval(i);
  }, [t]);
  if (!t) return null;
  const left = Math.max(0, Math.ceil((t.end - Date.now()) / 1000));
  return html`<div class="timer">
    <${Ring} size=${40} stroke=${3} value=${left} max=${t.total} color="var(--bg)" track=${false} />
    <div class="grow"><div class="num">${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}</div><div class="tiny" style="opacity:.6">${t.label}</div></div>
    <button class="btn" onClick=${() => setT({ ...t, end: t.end + 30000, total: t.total + 30 })}>+30 s</button>
    <button class="btn" onClick=${() => setT(null)}>Passer</button>
  </div>`;
}

// ------------------------------------------------------------------ séance en direct
function emptySets(n, kg) { return Array.from({ length: n }, () => ({ kg: kg ?? '', reps: '', rpe: '', done: false })); }

function SessionView({ id }) {
  const k = todayKey();
  const s = resolveSession(id, k);
  const logId = `${k}-${id}`;
  const log = db.get('workouts', logId) || { date: k, session: id, exercises: {}, started: new Date().toISOString() };
  const [warmOpen, setWarmOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const fresh = () => db.get('workouts', logId) || log;
  const save = next => db.put('workouts', logId, next);
  const saveSets = (exId, sets) => { const cur = fresh(); save({ ...cur, exercises: { ...cur.exercises, [exId]: { sets } } }); };

  const setFor = exId => {
    const sug = suggestion(exId, k);
    return fresh().exercises?.[exId]?.sets || emptySets(sug.sets, sug.weight);
  };
  const update = (exId, idx, field, value) => {
    saveSets(exId, setFor(exId).map((x, i) => (i === idx ? { ...x, [field]: value } : x)));
  };
  const toggleDone = (exId, idx) => {
    const ex = EXERCISES[exId];
    const sets = setFor(exId);
    const willBe = !sets[idx].done;
    const next = sets.map((x, i) => (i === idx ? { ...x, done: willBe } : x));
    // pré-remplir la série suivante avec la même charge
    if (willBe && next[idx + 1] && !next[idx + 1].kg && next[idx].kg) next[idx + 1] = { ...next[idx + 1], kg: next[idx].kg };
    saveSets(exId, next);
    if (willBe && ex.rest) startRest(ex.rest, ex.type === 'explosive' ? 'Récup complète : qualité max' : ex.name);
  };
  const addSet = exId => { const sets = setFor(exId); const last = sets[sets.length - 1]; saveSets(exId, [...sets, { kg: last?.kg || '', reps: '', rpe: '', done: false }]); };

  const allIds = s.blocks.flatMap(b => b.items);
  const doneSets = allIds.reduce((a, e) => a + (log.exercises[e]?.sets || []).filter(x => x.done).length, 0);
  const totalSets = allIds.reduce((a, e) => a + suggestion(e, k).sets, 0);
  const sessionLocked = s.gate && !(s.calf.phase >= 3 && s.calf.zeroPainWeek);

  return html`<div class="screen stack gap-24">
    <header class="stack gap-12">
      <button class="row gap-4 small muted" onClick=${back}><${Icon} name="left" size=${16} /> Prépa</button>
      <h1 class="title-xl">${s.name}</h1>
      <div class="row between"><span class="small muted">${s.subtitle} · ${s.duration} min</span><span class="num" style="font-size:20px">${doneSets}<span class="muted">/${totalSets}</span></span></div>
      <div class="bar accent"><i style=${`width:${totalSets ? (doneSets / totalSets) * 100 : 0}%`}></i></div>
    </header>

    ${sessionLocked && html`<div class="card flat" style="background:var(--danger-soft)"><div class="row gap-8"><${Icon} name="lock" size=${18} style="color:var(--danger)" /><b class="h3" style="color:var(--danger)">Séance bloquée</b></div><p class="small" style="margin:8px 0 0">Il faut la phase 3 de reprise et zéro douleur sur 7 jours. Fais du vélo et ta mobilité à la place.</p></div>`}

    <section class="card" style="padding:4px 18px">
      <button class="list-row" onClick=${() => setWarmOpen(!warmOpen)}>
        <div class="grow"><div class="h3">Échauffement · 10-12 min</div><div class="tiny muted">Vélo, mobilité, activation, gammes</div></div>
        <${Icon} name="down" size=${18} style=${`color:var(--faint);transition:transform .25s;transform:rotate(${warmOpen ? 180 : 0}deg)`} />
      </button>
      ${warmOpen && WARMUP.map(w => {
        const locked = !gateOk(w.gate, s.calf.phase);
        return html`<div class=${`list-row fade-in ${locked ? 'locked' : ''}`}><div class="grow"><div class="small">${w.name} <span class="muted">· ${w.dose}</span></div><div class="tiny muted">${locked ? 'Quand le mollet le permet (phase 2).' : w.tech}</div></div></div>`;
      })}
    </section>

    ${s.blocks.map(b => html`<section class="stack gap-12">
      <div class="section-head" style="margin-bottom:0"><h2 class="eyebrow">${b.label}</h2></div>
      ${b.note && html`<div class="small accent">${b.note}</div>`}
      ${b.items.map(exId => html`<${ExerciseCard} key=${exId} exId=${exId} k=${k} sets=${setFor(exId)} locked=${(b.locked || []).includes(exId)}
        onUpdate=${(i, f, v) => update(exId, i, f, v)} onDone=${i => toggleDone(exId, i)} onAdd=${() => addSet(exId)} />`)}
    </section>`)}

    <p class="small muted" style="margin:0">${s.after}</p>
    <button class="btn accent block" onClick=${() => setEndOpen(true)}>Terminer la séance</button>

    <${EndSheet} open=${endOpen} onClose=${() => setEndOpen(false)} log=${log} onSave=${extra => { save({ ...fresh(), ...extra, finished: true, ended: new Date().toISOString() }); setEndOpen(false); celebrate(); toast('Séance enregistrée. Bien joué.'); go('train'); }} />
    <${RestTimer} />
  </div>`;
}

function ExerciseCard({ exId, k, sets, locked, onUpdate, onDone, onAdd }) {
  const ex = EXERCISES[exId];
  const sug = suggestion(exId, k);
  const [info, setInfo] = useState(false);
  const unit = ex.unit === 's' ? 's' : ex.unit === 'm' ? 'm' : ex.unit === 'min' ? 'min' : 'reps';
  const repsLabel = sug.lo === sug.hi ? `${sug.lo}` : `${sug.lo}-${sug.hi}`;
  const showKg = !(ex.type === 'explosive' || ex.type === 'cardio' || ex.type === 'hold') || ex.type === 'carry';

  if (locked) return html`<div class="card tight locked row gap-12"><${Icon} name="lock" size=${18} /><div class="grow"><div class="h3">${ex.name}</div><div class="tiny muted">Bloqué tant que le mollet n’est pas validé.</div></div></div>`;

  return html`<div class="card" style="padding:16px">
    <div class="row between gap-12">
      <div class="grow">
        <div class="h3">${ex.name}</div>
        <div class="tiny muted">${sug.sets} × ${repsLabel} ${unit}${ex.perSide ? ' par côté' : ''} · repos ${ex.rest >= 120 ? Math.round(ex.rest / 60) + ' min' : ex.rest + ' s'}</div>
      </div>
      <button class="icon-btn" aria-label="Technique" onClick=${() => setInfo(!info)}><${Icon} name="info" size=${19} /></button>
    </div>
    <div class=${`small mt-8 ${sug.mode === 'up' ? 'accent' : sug.mode === 'down' ? 'danger' : 'muted'}`} style="line-height:1.4">${sug.text}</div>
    ${info && html`<div class="fade-in stack gap-8 mt-16" style="padding:12px 14px;background:var(--card-2);border-radius:var(--r-md)">
      <div class="small"><b style="font-weight:500">Technique.</b> ${ex.tech}</div>
      <div class="small"><b style="font-weight:500">Pour ton jeu.</b> ${ex.why}</div>
      ${ex.alt && html`<div class="small muted">Alternative : ${ex.alt}</div>`}
      <button class="small accent" style="text-align:left" onClick=${() => go('train', `ex/${exId}`)}>Voir l’historique</button>
    </div>`}
    <div class="stack gap-8 mt-16">
      <div class="set-grid tiny muted"><span></span><span class="center">${showKg ? 'kg' : ''}</span><span class="center">${unit}</span><span class="center">RPE</span><span></span></div>
      ${sets.map((st, i) => html`<div class="set-grid">
        <span class="set-idx">${i + 1}</span>
        ${showKg ? html`<input class="input num-input" inputmode="decimal" placeholder=${ex.bodyweight ? 'PDC' : '—'} value=${st.kg} onInput=${e => onUpdate(i, 'kg', e.target.value.replace(',', '.'))} />` : html`<span></span>`}
        <input class="input num-input" inputmode="numeric" placeholder=${String(sug.hi)} value=${st.reps} onInput=${e => onUpdate(i, 'reps', e.target.value)} />
        <input class="input num-input" inputmode="decimal" placeholder="7" value=${st.rpe} onInput=${e => onUpdate(i, 'rpe', e.target.value.replace(',', '.'))} />
        <button class=${`set-ok ${st.done ? 'on' : ''}`} aria-label="Série faite" onClick=${() => onDone(i)}><${Icon} name="check" size=${16} stroke=${2.2} /></button>
      </div>`)}
      <button class="small muted" style="align-self:flex-start;padding:4px 0" onClick=${onAdd}>+ Ajouter une série</button>
    </div>
  </div>`;
}

function EndSheet({ open, onClose, log, onSave }) {
  const [pain, setPain] = useState(0);
  const [feel, setFeel] = useState(3);
  const [note, setNote] = useState('');
  const save = () => {
    const k = todayKey();
    db.put('calfLog', `${k}-${log.session}`, { date: k, pain, context: `Séance ${log.session}` });
    if (pain >= 3) regressCalf(`Douleur ${pain}/10 pendant la séance ${log.session}`);
    onSave({ calfPain: pain, feel, note });
  };
  return html`<${Sheet} open=${open} onClose=${onClose} title="Fin de séance">
    <div class="stack gap-24">
      <div class="stack gap-12">
        <div class="row between"><span class="h3">Douleur au mollet</span><span class=${`num-m ${pain >= 3 ? 'danger' : ''}`}>${pain}/10</span></div>
        <input type="range" min="0" max="10" step="1" value=${pain} onInput=${e => setPain(+e.target.value)} style="width:100%;accent-color:var(--accent)" />
        ${pain >= 3 && html`<div class="small danger">À partir de 3/10, l’app te fait revenir à l’étape d’avant. Pas de négociation.</div>`}
      </div>
      <div class="stack gap-12">
        <span class="h3">Sensations</span>
        <div class="seg">${['Vidé', 'Lourd', 'Correct', 'Bien', 'Au top'].map((l, i) => html`<button class=${feel === i + 1 ? 'on' : ''} onClick=${() => setFeel(i + 1)}>${l}</button>`)}</div>
      </div>
      <textarea class="input" placeholder="Une note pour le bilan de cycle (optionnel)" value=${note} onInput=${e => setNote(e.target.value)}></textarea>
      <button class="btn accent block" onClick=${save}>Enregistrer</button>
    </div>
  </${Sheet}>`;
}

export function regressCalf(reason) {
  const s = db.get('calf', 'state') || { phase: 4 };
  const phase = Math.max(1, s.phase - 1);
  db.put('calf', 'state', { phase, since: todayKey(), reason });
  toast(`Mollet : retour en phase ${phase}. On ne force pas.`);
}

// ------------------------------------------------------------------ historique d’un exercice
function ExerciseHistory({ id }) {
  const ex = EXERCISES[id];
  const hist = exerciseHistory(id);
  return html`<div class="screen stack gap-24">
    <header class="stack gap-12">
      <button class="row gap-4 small muted" onClick=${back}><${Icon} name="left" size=${16} /> Retour</button>
      <h1 class="title-l">${ex.name}</h1>
      <p class="small muted" style="margin:0">${ex.why}</p>
    </header>
    ${hist.length ? html`<div class="card" style="padding:4px 18px">${hist.map(h => html`<div class="list-row">
      <div class="grow"><div class="h3">${fmtDate(h.date)}</div><div class="tiny muted">${h.sets.map(s => `${s.kg ? s.kg + ' kg × ' : ''}${s.reps || '—'}${s.rpe ? ' @' + s.rpe : ''}`).join('  ·  ')}</div></div>
      <span class="num" style="font-size:20px">${Math.max(...h.sets.map(s => +s.kg || 0)) || ''}</span>
    </div>`)}</div>` : html`<${Empty} icon="history" title="Pas encore d’historique" text="Ta première séance servira de test : tu trouves ta charge à RPE 7 et tu la notes." />`}
  </div>`;
}

// ------------------------------------------------------------------ mobilité guidée
function MobilityView() {
  const k = todayKey();
  const checks = db.get('checks', k) || {};
  const [doneIds, setDone] = useState({});
  const [run, setRun] = useState(null);
  const [, tick] = useState(0);
  useEffect(() => {
    if (!run) return;
    const i = setInterval(() => { tick(x => x + 1); if (Date.now() >= run.end) { beep(); setRun(null); } }, 250);
    return () => clearInterval(i);
  }, [run]);
  const all = MOBILITY.every(m => doneIds[m.id]);
  const finish = () => { db.put('checks', k, { ...checks, mobility: true }); celebrate(); toast('Mobilité faite. Tes hanches te remercient.'); back(); };
  return html`<div class="screen stack gap-24">
    <header class="stack gap-12">
      <button class="row gap-4 small muted" onClick=${back}><${Icon} name="left" size=${16} /> Retour</button>
      <h1 class="title-xl">Mobilité<br /><span class="accent">10 min</span></h1>
      <p class="small muted" style="margin:0">Objectif à 8 semaines : toucher tes pieds jambes tendues. Ça se gagne ici, chaque soir.</p>
    </header>
    <div class="card" style="padding:4px 18px">
      ${MOBILITY.map(m => {
        const running = run?.id === m.id;
        const left = running ? Math.max(0, Math.ceil((run.end - Date.now()) / 1000)) : null;
        return html`<div class="list-row">
          <button onClick=${() => setDone({ ...doneIds, [m.id]: !doneIds[m.id] })}><span class=${`check ${doneIds[m.id] ? 'on' : ''}`}><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span></button>
          <div class="grow"><div class="h3">${m.name}</div><div class="tiny muted">${m.dose} · ${m.tech}</div></div>
          ${m.secs && html`<button class="chip ${running ? 'on' : ''}" onClick=${() => setRun(running ? null : { id: m.id, end: Date.now() + m.secs * 1000 })}>${running ? `${left} s` : `${m.secs} s`}</button>`}
        </div>`;
      })}
    </div>
    <button class="btn accent block" disabled=${!all && false} onClick=${finish}>${all ? 'Valider la routine' : 'Valider quand même'}</button>
  </div>`;
}

// ------------------------------------------------------------------ mollet
function CalfView() {
  const k = todayKey();
  const calf = calfState(k);
  const [pain, setPain] = useState(0);
  const [tight, setTight] = useState(false);
  const setPhase = n => { db.put('calf', 'state', { phase: n, since: k }); toast(`Phase ${n} : ${CALF_PHASES[n - 1].name}`); };
  const log = () => {
    db.put('calfLog', `${k}-morning`, { date: k, pain, tight, context: 'Matin' });
    if (pain >= 3 || tight) regressCalf(tight ? 'Mollet qui tire le matin' : `Douleur ${pain}/10`);
    else toast('Noté. Zéro douleur, on avance.');
  };
  return html`<div class="screen stack gap-24">
    <header class="stack gap-12">
      <button class="row gap-4 small muted" onClick=${back}><${Icon} name="left" size=${16} /> Prépa</button>
      <h1 class="title-xl">Mollet</h1>
      <p class="small muted" style="margin:0">Règle : douleur pendant l’effort, ou mollet qui tire le lendemain matin, alors tu reviens à l’étape d’avant. Feu vert du physio avant de rejouer un match.</p>
    </header>
    <div class="stack gap-8">
      ${CALF_PHASES.map(ph => html`<button class=${`card tight pressable ${calf.phase === ph.n ? '' : 'flat'}`} style=${`text-align:left;${calf.phase === ph.n ? 'outline:1.5px solid var(--accent)' : 'background:transparent;border:1px solid var(--line)'}`} onClick=${() => setPhase(ph.n)}>
        <div class="row gap-12"><span class="num-m" style=${`color:${calf.phase >= ph.n ? 'var(--accent)' : 'var(--faint)'}`}>${ph.n}</span><div class="grow"><div class="h3">${ph.name}</div><div class="tiny muted">${ph.rules}</div></div></div>
      </button>`)}
    </div>
    <section class="card stack gap-16">
      <div class="h3">Check du matin</div>
      <div class="row between"><span class="small muted">Douleur</span><span class=${`num-m ${pain >= 3 ? 'danger' : ''}`}>${pain}/10</span></div>
      <input type="range" min="0" max="10" step="1" value=${pain} onInput=${e => setPain(+e.target.value)} style="width:100%;accent-color:var(--accent)" />
      <button class="row gap-12" onClick=${() => setTight(!tight)}><span class=${`check ${tight ? 'on' : ''}`}><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span><span class="small">Le mollet tire ce matin</span></button>
      <button class="btn primary block" onClick=${log}>Enregistrer</button>
    </section>
    ${calf.logs.length > 0 && html`<section>
      <div class="section-head"><h2 class="h2">Historique</h2></div>
      <div class="card" style="padding:4px 18px">${calf.logs.slice(0, 20).map(l => html`<div class="list-row"><div class="grow"><div class="small">${fmtDate(l.date)}</div><div class="tiny muted">${l.context || ''}${l.tight ? ' · tire' : ''}</div></div><span class=${`num-m ${l.pain >= 3 ? 'danger' : ''}`}>${l.pain}</span></div>`)}</div>
    </section>`}
  </div>`;
}

// ------------------------------------------------------------------ bilan de cycle (API Claude)
function CycleView() {
  const k = todayKey();
  const cyc = cycleInfo(k);
  const saved = db.get('cycleReviews', String(cyc.cycle));
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const run = async () => {
    setLoading(true); setErr(null);
    try {
      const r = await analyzeCycle(cyc);
      db.put('cycleReviews', String(cyc.cycle), { cycle: cyc.cycle, at: new Date().toISOString(), text: r });
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };
  return html`<div class="screen stack gap-24">
    <header class="stack gap-12">
      <button class="row gap-4 small muted" onClick=${back}><${Icon} name="left" size=${16} /> Prépa</button>
      <h1 class="title-xl">Bilan<br /><span class="accent">cycle ${cyc.cycle}</span></h1>
      <p class="small muted" style="margin:0">L’app envoie tes charges, tes RPE, tes sensations, ton mollet et ton poids à Claude, qui raisonne comme un préparateur physique de basket et te propose le cycle suivant.</p>
    </header>
    ${!hasApiKey() ? html`<${Empty} icon="key" title="Clé API Claude requise" text="Ajoute ta clé dans les réglages pour activer le bilan. Le reste de l’app marche sans."
        action=${html`<button class="btn primary" onClick=${() => go('settings')}>Ouvrir les réglages</button>`} />`
    : html`<button class="btn accent block" disabled=${loading} onClick=${run}>${loading ? 'Analyse en cours…' : saved ? 'Refaire l’analyse' : 'Analyser mon cycle'}</button>`}
    ${err && html`<div class="small danger">${err}</div>`}
    ${saved && html`<article class="card fade-in" style="white-space:pre-wrap;line-height:1.55">${saved.text}</article>`}
  </div>`;
}
