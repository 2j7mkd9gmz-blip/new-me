// Petits utilitaires : dates locales, formatage, échappement.
export const pad = (n) => String(n).padStart(2, '0');
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const today = () => ymd(new Date());
export const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return ymd(d); };
export const dow = (s) => parse(s).getDay(); // 0 = dimanche
export const monday = (s) => addDays(s, -((dow(s) + 6) % 7));
export const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
export const dayIndex = (s) => diffDays('2026-01-05', s); // pour faire tourner les repas

export const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
export const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
export const fmtDate = (s) => { const d = parse(s); return `${d.getDate()} ${MOIS[d.getMonth()]}`; };
export const fmtDay = (s) => `${cap(JOURS[dow(s)])} ${fmtDate(s)}`;
export const fmtKg = (n) => (n == null || isNaN(n) ? '–' : Number(n).toFixed(1).replace('.', ','));
export const num = (v) => { const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? null : n; };
export const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
export const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
export const fmtDur = (min) => `${Math.floor(min / 60)}h${pad(min % 60)}`;
export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);

// Durée de sommeil en minutes entre coucher et lever (passe minuit).
export const sleepMinutes = (bed, wake) => {
  if (!bed || !wake) return null;
  let d = toMin(wake) - toMin(bed);
  if (d <= 0) d += 1440;
  return d;
};
