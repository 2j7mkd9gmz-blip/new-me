import { html, useState, useEffect, useRef } from '../../vendor/preact-htm.js';
import { db } from '../db.js';
import { Icon, Ring, Bar, toast, celebrate, Empty, fmt0, fmt1 } from '../ui.js';
import { todayKey, addDays, fmtDate, daysBetween, mondayOf, weightEntries, weeklyAverages, targetWeight, sleepMinutes, fmtDuration, dayPlan, parseKey } from '../engine.js';
import { PROFILE } from '../data/program.js';
import { go } from '../nav.js';

export function Track({ sub }) {
  const tab = ['weight', 'sleep', 'steps'].includes(sub) ? sub : 'weight';
  return html`<div class="screen stack gap-24">
    <header class="stack gap-16">
      <div class="eyebrow">Suivi</div>
      <div class="seg">
        <button class=${tab === 'weight' ? 'on' : ''} onClick=${() => go('track', 'weight')}>Poids</button>
        <button class=${tab === 'sleep' ? 'on' : ''} onClick=${() => go('track', 'sleep')}>Sommeil</button>
        <button class=${tab === 'steps' ? 'on' : ''} onClick=${() => go('track', 'steps')}>Pas</button>
      </div>
    </header>
    ${tab === 'weight' && html`<${Weight} />`}
    ${tab === 'sleep' && html`<${Sleep} />`}
    ${tab === 'steps' && html`<${Steps} />`}
    <button class="card tight pressable row gap-12" style="text-align:left" onClick=${() => go('train', 'calf')}>
      <${Icon} name="heart" size=${20} style="color:var(--muted)" />
      <div class="grow"><div class="h3">Mollet</div><div class="tiny muted">Phase de reprise et note de douleur</div></div>
      <${Icon} name="right" size=${18} style="color:var(--faint)" />
    </button>
  </div>`;
}

// ------------------------------------------------------------------ poids
function Weight() {
  const k = todayKey();
  const [v, setV] = useState('');
  const entries = weightEntries();
  const weeks = weeklyAverages();
  const thisWeek = weeks.find(w => w.monday === mondayOf(k));
  const prevWeek = weeks.find(w => w.monday === addDays(mondayOf(k), -7));
  const current = thisWeek?.avg ?? weeks[weeks.length - 1]?.avg ?? null;
  const delta = thisWeek && prevWeek ? thisWeek.avg - prevWeek.avg : null;
  const lost = current != null ? PROFILE.startWeight - current : 0;
  const toGo = current != null ? current - PROFILE.goalWeight : PROFILE.startWeight - PROFILE.goalWeight;
  const target = targetWeight(k);

  const save = () => {
    const n = parseFloat(String(v).replace(',', '.'));
    if (!(n > 40 && n < 150)) { toast('Entre un poids valide, genre 71,4'); return; }
    db.put('weight', k, { date: k, kg: n, source: 'manual' });
    setV('');
    if (n <= PROFILE.goalWeight) { celebrate(); toast('65 kg. Objectif atteint. Respect total.'); }
    else toast(`${fmt1(n)} kg noté.`);
  };

  let verdict = 'Pèse-toi 3 matins par semaine, à jeun. On juge la moyenne, pas un chiffre.';
  if (delta != null) {
    if (delta <= -1.2) verdict = 'Ça descend vite. Si c’est la 1re semaine, c’est surtout de l’eau. Sinon, mange un peu plus : tu dois garder du jus pour le basket.';
    else if (delta <= -0.4) verdict = 'Pile dans le rythme : 0,5 à 0,7 kg par semaine. Continue exactement comme ça.';
    else if (delta < 0) verdict = 'Ça bouge, mais lentement. Vérifie les extras et le grignotage du soir.';
    else verdict = 'Moyenne stable ou en hausse. Sois honnête : tout est noté ? Serre la vis sur les calories cette semaine.';
  }

  return html`<div class="stack gap-24">
    <section class="stack gap-8">
      <div class="row between" style="align-items:flex-end">
        <div>
          <div class="small muted">Moyenne de la semaine</div>
          <div class="num-xl">${current != null ? fmt1(current) : '—'}<span class="num" style="font-size:22px;color:var(--muted)"> kg</span></div>
        </div>
        ${delta != null && html`<div class="tag ${delta < 0 ? 'accent' : 'danger'}" style="margin-bottom:10px">${delta > 0 ? '+' : ''}${fmt1(delta)} kg vs sem. passée</div>`}
      </div>
      <div class="small muted">${verdict}</div>
    </section>

    <section class="card" style="padding:16px 12px 10px">
      ${entries.length ? html`<${WeightChart} entries=${entries} weeks=${weeks} />` : html`<${Empty} icon="scale" title="Ta courbe commence ici" text="Première pesée demain matin, à jeun. La ligne pointillée, c’est ta route vers 65 kg." />`}
    </section>

    <div class="kv" style="grid-template-columns:repeat(3,1fr)">
      <div><span class="num">${lost > 0 ? '-' + fmt1(lost) : '0'}</span><span class="tiny">kg perdus</span></div>
      <div><span class="num">${fmt1(Math.max(0, toGo))}</span><span class="tiny">kg restants</span></div>
      <div><span class="num">${fmt1(target)}</span><span class="tiny">cible du jour</span></div>
    </div>

    <section class="card tight">
      <div class="row between gap-12">
        <div><div class="h3">Pesée de ce matin</div><div class="tiny muted">${db.get('weight', k) ? `Déjà noté : ${fmt1(db.get('weight', k).kg)} kg` : 'À jeun, après les toilettes'}</div></div>
        <div class="row gap-8">
          <input class="input num-input" style="width:86px" inputmode="decimal" placeholder="71,4" value=${v} onInput=${e => setV(e.target.value)} onKeyDown=${e => e.key === 'Enter' && save()} />
          <button class="btn accent sm" style="height:48px" onClick=${save}>OK</button>
        </div>
      </div>
      <div class="tiny faint mt-8">Après le sauna, ne te pèse pas : c’est de l’eau, pas du gras.</div>
    </section>

    ${entries.length > 0 && html`<section>
      <div class="section-head"><h2 class="h2">Pesées</h2></div>
      <div class="card" style="padding:4px 18px">${[...entries].reverse().slice(0, 14).map(e => html`<div class="list-row">
        <div class="grow"><div class="small">${fmtDate(e.date)}</div><div class="tiny muted">${e.source === 'health' ? 'App Santé' : 'Saisie manuelle'}</div></div>
        <span class="num-m">${fmt1(e.kg)}</span>
        <button class="icon-btn" aria-label="Supprimer" onClick=${() => { db.del('weight', e.id); toast('Pesée supprimée'); }}><${Icon} name="trash" size=${16} /></button>
      </div>`)}</div>
    </section>`}
  </div>`;
}

function WeightChart({ entries, weeks }) {
  const W = 340, H = 200, padL = 30, padR = 8, padT = 10, padB = 22;
  const start = PROFILE.startDate, end = PROFILE.goalDate;
  const total = daysBetween(start, end);
  const vals = [...entries.map(e => +e.kg), PROFILE.startWeight, PROFILE.goalWeight];
  const yMax = Math.ceil(Math.max(...vals) + 0.5), yMin = Math.floor(Math.min(...vals) - 0.5);
  const x = k => padL + (daysBetween(start, k) / total) * (W - padL - padR);
  const y = v => padT + ((yMax - v) / (yMax - yMin)) * (H - padT - padB);
  const avgPts = weeks.map(w => [x(addDays(w.monday, 3)), y(w.avg)]);
  const path = pts => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const lineRef = useRef();
  useEffect(() => { if (lineRef.current) lineRef.current.style.setProperty('--len', Math.ceil(lineRef.current.getTotalLength?.() || 600)); }, [weeks.length]);
  const ticks = [];
  for (let v = yMax; v >= yMin; v -= Math.max(1, Math.round((yMax - yMin) / 4))) ticks.push(v);
  const ms = PROFILE.milestone;
  const months = ['2026-12-01', '2027-01-01', '2027-02-01'];
  const MN = { '12': 'déc.', '01': 'janv.', '02': 'févr.' };
  return html`<svg class="chart" viewBox=${`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Évolution du poids">
    ${ticks.map(t => html`<g><line class="grid" x1=${padL} x2=${W - padR} y1=${y(t)} y2=${y(t)} /><text x=${padL - 6} y=${y(t) + 3} text-anchor="end">${t}</text></g>`)}
    ${months.map(m => html`<text x=${x(m)} y=${H - 6} text-anchor="middle">${MN[m.slice(5, 7)]}</text>`)}
    <path class="target" d=${path([[x(start), y(PROFILE.startWeight)], [x(ms.date), y(ms.weight)], [x(end), y(PROFILE.goalWeight)]])} />
    <line x1=${x(ms.date)} x2=${x(ms.date)} y1=${padT} y2=${H - padB} stroke="var(--line-2)" stroke-dasharray="2 3" />
    <circle cx=${x(ms.date)} cy=${y(ms.weight)} r="3.5" fill="var(--bg)" stroke="var(--accent)" stroke-width="1.5" />
    <text x=${x(ms.date) + 6} y=${y(ms.weight) - 7}>1er janv. · ${String(ms.weight).replace('.', ',')}</text>
    <circle cx=${x(end)} cy=${y(PROFILE.goalWeight)} r="3.5" fill="var(--accent)" />
    ${entries.map(e => html`<circle class="dot" cx=${x(e.date)} cy=${y(+e.kg)} r="2" />`)}
    ${avgPts.length > 1 && html`<path ref=${lineRef} class="line" d=${path(avgPts)} />`}
    ${avgPts.length > 0 && html`<circle class="dot last" cx=${avgPts[avgPts.length - 1][0]} cy=${avgPts[avgPts.length - 1][1]} r="4" />`}
  </svg>`;
}

// ------------------------------------------------------------------ sommeil
function Sleep() {
  const k = todayKey();
  const existing = db.get('sleep', k);
  const [bed, setBed] = useState(existing?.bed || '22:00');
  const [wake, setWake] = useState(existing?.wake || '05:00');
  const mins = sleepMinutes(bed, wake);
  const days = Array.from({ length: 7 }, (_, i) => addDays(k, i - 6));
  const nights = days.map(d => ({ d, s: db.get('sleep', d) }));
  const withData = nights.filter(n => n.s?.minutes);
  const avg = withData.length ? withData.reduce((a, n) => a + n.s.minutes, 0) / withData.length : null;
  const short = withData.filter(n => n.s.minutes < PROFILE.sleepMinHours * 60).length;
  const save = () => {
    db.put('sleep', k, { date: k, bed, wake, minutes: mins, source: 'manual' });
    toast(mins < 420 ? `${fmtDuration(mins)}. Moins de 7h : ce soir, au lit plus tôt.` : `${fmtDuration(mins)}. Propre.`);
  };
  const p = dayPlan(k);
  return html`<div class="stack gap-24">
    <section class="row gap-16">
      <${Ring} size=${116} stroke=${4} value=${existing?.minutes || 0} max=${8 * 60} color=${existing && existing.minutes < 420 ? 'var(--danger)' : 'var(--accent)'}>
        <div class="num-m">${existing ? fmtDuration(existing.minutes) : '—'}</div><div class="tiny muted">cette nuit</div>
      </${Ring}>
      <div class="stack gap-8 grow">
        <div><span class="num-m">${avg ? fmtDuration(avg) : '—'}</span> <span class="small muted">moyenne 7 j</span></div>
        <div class=${`small ${short ? 'danger' : 'muted'}`}>${short ? `${short} nuit${short > 1 ? 's' : ''} sous 7h cette semaine.` : 'Aucune nuit sous 7h. Continue.'}</div>
        ${p.bedLimit && html`<div class="small muted">Ce soir : au lit avant ${p.bedLimit}.</div>`}
      </div>
    </section>

    <section class="card stack gap-16">
      <div class="h3">Nuit dernière ${existing?.source === 'health' ? html`<span class="tag">App Santé</span>` : ''}</div>
      <div class="row gap-12">
        <div class="field grow"><label>Coucher</label><input class="input" type="time" value=${bed} onInput=${e => setBed(e.target.value)} /></div>
        <div class="field grow"><label>Lever</label><input class="input" type="time" value=${wake} onInput=${e => setWake(e.target.value)} /></div>
      </div>
      <div class="row between"><span class="small muted">Durée</span><span class=${`num-m ${mins < 420 ? 'danger' : ''}`}>${fmtDuration(mins)}</span></div>
      ${mins < 420 && html`<div class="small danger">Moins de 7h. La récup, c’est là que tu progresses.</div>`}
      <button class="btn primary block" onClick=${save}>Enregistrer</button>
    </section>

    <section class="card">
      <div class="row between" style="align-items:flex-end;height:120px;gap:8px">
        ${nights.map(n => {
          const m = n.s?.minutes || 0;
          return html`<div class="grow stack gap-4" style="align-items:center">
            <div class="tiny muted">${m ? fmtDuration(m) : ''}</div>
            <div style=${`width:100%;max-width:26px;height:${Math.max(4, (m / 600) * 80)}px;border-radius:6px;background:${!m ? 'var(--line)' : m < 420 ? 'var(--danger)' : 'var(--text)'};transition:height .8s var(--ease)`}></div>
            <div class="tiny faint">${'LMMJVSD'[(parseKey(n.d).getDay() + 6) % 7]}</div>
          </div>`;
        })}
      </div>
      <div class="tiny faint mt-8">Ligne rouge : moins de 7h.</div>
    </section>
  </div>`;
}

// ------------------------------------------------------------------ pas
function Steps() {
  const k = todayKey();
  const p = dayPlan(k);
  const rec = db.get('steps', k);
  const [v, setV] = useState('');
  const steps = rec?.steps || 0;
  const goal = p.stepsGoal || PROFILE.stepsGoal;
  const days = Array.from({ length: 7 }, (_, i) => addDays(k, i - 6));
  const save = () => {
    const n = parseInt(String(v).replace(/\D/g, ''), 10);
    if (!(n >= 0 && n < 100000)) { toast('Entre un nombre de pas valide'); return; }
    db.put('steps', k, { date: k, steps: n, source: 'manual', at: new Date().toISOString() });
    setV('');
    if (p.stepsGoal && n >= p.stepsGoal && steps < p.stepsGoal) { celebrate(); toast('Objectif de pas atteint.'); } else toast('Pas notés');
  };
  return html`<div class="stack gap-24">
    <section class="center stack gap-12" style="align-items:center">
      <${Ring} size=${180} stroke=${5} value=${steps} max=${goal}>
        <div class="num-l">${fmt0(steps)}</div>
        <div class="tiny muted">${p.stepsGoal ? `/ ${fmt0(goal)} pas` : 'pas · jour de boulot'}</div>
      </${Ring}>
      <div class="small muted">${rec?.source === 'health' ? `Synchro App Santé · ${rec.at ? new Date(rec.at).toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' }) : ''}` : rec ? 'Saisie manuelle' : 'En attente du Raccourci (12h, 18h, 22h)'}</div>
      ${p.stepsGoal && steps < goal && html`<div class="small">${fmt0(goal - steps)} pas restants. Une balade de ${Math.ceil((goal - steps) / 110)} min et c’est réglé.</div>`}
    </section>

    <section class="card">
      <div class="row between" style="align-items:flex-end;height:110px;gap:8px">
        ${days.map(d => {
          const s = db.get('steps', d)?.steps || 0;
          const g = dayPlan(d).stepsGoal;
          return html`<div class="grow stack gap-4" style="align-items:center">
            <div class="tiny muted">${s ? (s / 1000).toFixed(1).replace('.', ',') + 'k' : ''}</div>
            <div style=${`width:100%;max-width:26px;height:${Math.max(4, Math.min(1, s / 12000) * 76)}px;border-radius:6px;background:${!s ? 'var(--line)' : g && s >= g ? 'var(--accent)' : 'var(--text)'}`}></div>
            <div class="tiny faint">${'LMMJVSD'[(parseKey(d).getDay() + 6) % 7]}</div>
          </div>`;
        })}
      </div>
      <div class="tiny faint mt-8">Accent : objectif de 8 000 atteint un jour sans boulot.</div>
    </section>

    <details class="card tight">
      <summary class="small muted" style="cursor:pointer">Saisie manuelle (secours)</summary>
      <div class="row gap-8 mt-16">
        <input class="input grow" inputmode="numeric" placeholder="6240" value=${v} onInput=${e => setV(e.target.value)} />
        <button class="btn primary" onClick=${save}>OK</button>
      </div>
    </details>
  </div>`;
}
