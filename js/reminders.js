// Rappels : un fichier calendrier (.ics) avec des événements récurrents + alertes,
// que l'iPhone ajoute à l'app Calendrier. Fiable, gratuit, sans serveur.
// En plus, quand l'app est ouverte, de petits rappels in-app.
import { toast } from './ui.js';
import { db, local } from './db.js';
import { todayKey, dayPlan } from './engine.js';

const pad = n => String(n).padStart(2, '0');

function vevent({ uid, title, desc, start, rrule, alarmMin = 0, durMin = 15 }) {
  const [y, m, d, hh, mm] = start;
  const dt = `${y}${pad(m)}${pad(d)}T${pad(hh)}${pad(mm)}00`;
  const endD = new Date(y, m - 1, d, hh, mm + durMin);
  const de = `${endD.getFullYear()}${pad(endD.getMonth() + 1)}${pad(endD.getDate())}T${pad(endD.getHours())}${pad(endD.getMinutes())}00`;
  return [
    'BEGIN:VEVENT', `UID:${uid}@newme`, `DTSTAMP:20261126T000000Z`,
    `DTSTART;TZID=Europe/Zurich:${dt}`, `DTEND;TZID=Europe/Zurich:${de}`,
    `RRULE:${rrule}`, `SUMMARY:${title}`, `DESCRIPTION:${desc}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${title}`, `TRIGGER:-PT${alarmMin}M`, 'END:VALARM',
    'END:VEVENT',
  ].join('\r\n');
}

export function buildIcs({ standUp = false } = {}) {
  const S = [2026, 11, 29]; // dimanche 29 nov. 2026
  const ev = [
    vevent({ uid: 'bed-sun-wed', title: 'Au lit. Pas d’écran.', desc: 'Objectif 21h30, au lit avant 22h30 du dimanche au mercredi.', start: [...S, 21, 15], rrule: 'FREQ=WEEKLY;BYDAY=SU,MO,TU,WE' }),
    vevent({ uid: 'bed-thu-sat', title: 'Prépare-toi à dormir', desc: '7h de sommeil minimum.', start: [2026, 11, 26, 22, 45], rrule: 'FREQ=WEEKLY;BYDAY=TH,FR,SA' }),
    vevent({ uid: 'walk', title: 'Marche 15-20 min', desc: 'Après le repas de midi.', start: [2026, 11, 26, 12, 40], rrule: 'FREQ=DAILY' }),
    vevent({ uid: 'mobility', title: 'Mobilité du soir · 10 min', desc: 'Couch stretch, 90/90, chevilles, ischios, squat profond.', start: [2026, 11, 26, 21, 0], rrule: 'FREQ=DAILY' }),
    vevent({ uid: 'prep-sun', title: 'Meal prep · 1h', desc: 'Les midis jusqu’à mercredi.', start: [...S, 17, 0], rrule: 'FREQ=WEEKLY;BYDAY=SU', durMin: 60 }),
    vevent({ uid: 'prep-wed', title: 'Meal prep · 1h', desc: 'Les midis jusqu’à dimanche.', start: [2026, 12, 2, 18, 30], rrule: 'FREQ=WEEKLY;BYDAY=WE', durMin: 60 }),
    vevent({ uid: 'weigh', title: 'Pesée à jeun', desc: 'Lundi, mercredi, vendredi. On regarde la moyenne.', start: [2026, 11, 27, 6, 0], rrule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR', durMin: 5 }),
  ];
  if (standUp) {
    [[9, 0], [9, 45], [10, 30], [11, 15], [14, 0], [14, 45], [15, 30], [16, 15]].forEach(([h, m], i) =>
      ev.push(vevent({ uid: `stand-${i}`, title: 'Lève-toi 2-3 min', desc: 'Toutes les 45 min devant l’ordi.', start: [2026, 11, 30, h, m], rrule: 'FREQ=WEEKLY;BYDAY=MO,TU,WE', durMin: 3 })));
  }
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//New Me//FR', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:New Me', ...ev, 'END:VCALENDAR'].join('\r\n');
}

export function downloadIcs(opts) {
  const blob = new Blob([buildIcs(opts)], { type: 'text/calendar' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'new-me-rappels.ics'; a.click();
}

// Petits rappels quand l'app est ouverte
export function startReminders() {
  const check = () => {
    const k = todayKey(); const now = new Date(); const h = now.getHours() + now.getMinutes() / 60;
    const shown = local.get('nudges-' + k, {});
    const p = dayPlan(k);
    const checks = db.get('checks', k) || {};
    const nudge = (id, cond, msg) => { if (cond && !shown[id]) { shown[id] = 1; local.set('nudges-' + k, shown); toast(msg); } };
    nudge('bed', p.bedLimit && h >= 21.25 && h < 23 && !checks.bed, 'Il est l’heure. Ordi fermé, au lit.');
    nudge('walk', h >= 12.5 && h < 14 && !checks.walk, 'Petite marche de 15 min après manger ?');
    nudge('mob', h >= 20.5 && h < 23 && !checks.mobility, '10 min de mobilité avant de dormir.');
  };
  setTimeout(check, 4000);
  setInterval(check, 5 * 60 * 1000);
}
