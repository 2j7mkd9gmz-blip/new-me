import { html, useState, useEffect, useRef } from '../vendor/preact-htm.js';
import { db } from './db.js';

// ---------- icônes (traits fins, 24 × 24) ----------
const P = {
  today: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/>',
  train: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
  food: '<path d="M7 3v8a2 2 0 0 0 2 2v8M5 3v5a2 2 0 0 0 2 2M9 3v5a2 2 0 0 1-2 2M17 21V3c-2.2 1.2-3.5 3.6-3.5 7v3H17"/>',
  stats: '<path d="M3.5 19.5h17M6.5 16V11M11 16V6.5M15.5 16v-6M20 16V8.5"/>',
  quote: '<path d="M9.5 7.5C6.5 8.3 5 10.5 5 13.5V17h4.5v-4.5H6.8M19 7.5c-3 .8-4.5 3-4.5 6V17H19v-4.5h-2.7"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.8l1.6 2.3 2.7-.6.6 2.7 2.3 1.6-1.4 2.4 1.4 2.4-2.3 1.6-.6 2.7-2.7-.6L12 21.2l-1.6-2.3-2.7.6-.6-2.7-2.3-1.6 1.4-2.4-1.4-2.4 2.3-1.6.6-2.7 2.7.6z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  right: '<path d="M9.5 5.5L16 12l-6.5 6.5"/>',
  left: '<path d="M14.5 5.5L8 12l6.5 6.5"/>',
  down: '<path d="M5.5 9.5L12 16l6.5-6.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 2M9.5 2.5h5"/>',
  moon: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
  steps: '<path d="M8.5 3.5c1.8 0 2.8 2 2.8 4.6 0 2.4-1 3.6-1 5.4H6.6c0-1.8-1-3-1-5.4 0-2.6 1-4.6 2.9-4.6zM6.6 16.5h3.7v1.3a1.9 1.9 0 0 1-3.7 0zM15.5 7c1.9 0 2.9 2 2.9 4.6 0 2.4-1 3.6-1 5.4h-3.7c0-1.8-1-3-1-5.4C12.7 9 13.7 7 15.5 7zM13.7 20h3.7"/>',
  scale: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8.5 9a5 5 0 0 1 7 0l-2.2 2.6M12 11.6l1.3-1.6"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/>',
  share: '<path d="M12 3.5v11M8 7.5l4-4 4 4M5.5 12v6.5a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V12"/>',
  star: '<path d="M12 3.8l2.5 5.2 5.6.7-4.1 3.9 1 5.6L12 16.5l-5 2.7 1-5.6-4.1-3.9 5.6-.7z"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5l5 5"/>',
  barcode: '<path d="M4 6v12M7 6v12M10.5 6v12M13 6v12M16.5 6v12M20 6v12"/>',
  sparkle: '<path d="M12 3.5l1.8 5.2 5.2 1.8-5.2 1.8L12 17.5l-1.8-5.2L5 10.5l5.2-1.8zM18.5 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
  trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l.8 12.5a1.5 1.5 0 0 0 1.5 1.5h6.4a1.5 1.5 0 0 0 1.5-1.5L17.5 7"/>',
  cart: '<path d="M3 4h2.5l2.2 11h10.6l2-8H6.6"/><circle cx="9" cy="19.5" r="1.3"/><circle cx="17" cy="19.5" r="1.3"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.2"/>',
  play: '<path d="M8 5.5v13l10-6.5z"/>',
  pause: '<path d="M8.5 5.5v13M15.5 5.5v13"/>',
  refresh: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4v4h-4"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  ball: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5v17M6 6c2.5 2 3.5 4 3.5 6s-1 4-3.5 6M18 6c-2.5 2-3.5 4-3.5 6s1 4 3.5 6"/>',
  walk: '<circle cx="13" cy="4.5" r="1.8"/><path d="M10 21l2-6.5 2.5 2.5V21M9 11.5l1.5-4h3l2.5 3.5 2.5 1M10.5 7.5L7 9.5 6 13"/>',
  flame: '<path d="M12 21c3.6 0 6-2.5 6-6 0-4-3-6-4-10-1.5 2-2 3.5-2 5-1-1-1.5-2-1.5-3C8 9 6 11.5 6 15c0 3.5 2.4 6 6 6z"/>',
  bolt: '<path d="M13 3L5 13.5h6L10 21l8-10.5h-6z"/>',
  bed: '<path d="M3 18.5V7M3 14.5h18v4M21 14.5v-3a3 3 0 0 0-3-3h-7v6M6.5 11.5a1.5 1.5 0 1 0 0-.01"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/>',
  history: '<path d="M3.5 12a8.5 8.5 0 1 0 2.5-6M3.5 4v4h4M12 7.5V12l3 2"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l8.5-8.5M16.5 6.5l2 2M14 9l2 2"/>',
  cloud: '<path d="M7 18.5h10.5a4 4 0 0 0 .5-8 6 6 0 0 0-11.5 1.5A3.3 3.3 0 0 0 7 18.5z"/>',
  sauna: '<path d="M8 4c-1 1.5 1 2.5 0 4M12 4c-1 1.5 1 2.5 0 4M16 4c-1 1.5 1 2.5 0 4M4 12.5h16v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/>',
  briefcase: '<rect x="3.5" y="7" width="17" height="12.5" rx="2.5"/><path d="M9 7V5h6v2M3.5 12.5h17"/>',
  warning: '<path d="M12 4L2.8 19.5h18.4zM12 10v4.5M12 17v.2"/>',
  fork: '<path d="M5 12h14M13 6l6 6-6 6"/>',
};

export function Icon({ name, size = 22, stroke = 1.5, style = '' }) {
  return html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width=${stroke} stroke-linecap="round" stroke-linejoin="round" style=${style} aria-hidden="true" dangerouslySetInnerHTML=${{ __html: P[name] || '' }}></svg>`;
}

// ---------- abonnement au store ----------
export function useStore() {
  const [, set] = useState(0);
  useEffect(() => db.subscribe(() => set(v => v + 1)), []);
  return db;
}

// ---------- anneau de progression ----------
export function Ring({ size = 120, stroke = 4, value = 0, max = 1, color = 'var(--accent)', children, track = true }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, max ? value / max : 0));
  const [shown, setShown] = useState(0);
  useEffect(() => { const t = requestAnimationFrame(() => setShown(pct)); return () => cancelAnimationFrame(t); }, [pct]);
  return html`<div style="position:relative;width:${size}px;height:${size}px;flex:none">
    <svg width=${size} height=${size} style="transform:rotate(-90deg)">
      ${track && html`<circle class="ring-track" cx=${size / 2} cy=${size / 2} r=${r} fill="none" stroke-width=${stroke} />`}
      <circle class="ring-val" cx=${size / 2} cy=${size / 2} r=${r} fill="none" stroke=${color} stroke-width=${stroke} stroke-linecap="round" stroke-dasharray=${c} stroke-dashoffset=${c * (1 - shown)} />
    </svg>
    ${children && html`<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">${children}</div>`}
  </div>`;
}

export function MultiRing({ size = 132, rings }) {
  // rings: [{ value, max, color }], de l'extérieur vers l'intérieur
  const stroke = 4, gap = 5;
  return html`<div style="position:relative;width:${size}px;height:${size}px;flex:none">
    ${rings.map((r, i) => {
      const s = size - i * (stroke + gap) * 2;
      return html`<div style="position:absolute;left:${(size - s) / 2}px;top:${(size - s) / 2}px"><${Ring} size=${s} stroke=${stroke} value=${r.value} max=${r.max} color=${r.color} /></div>`;
    })}
  </div>`;
}

export function Bar({ value, max, accent = false, over = false }) {
  const pct = Math.max(0, Math.min(100, max ? (value / max) * 100 : 0));
  const [w, setW] = useState(0);
  useEffect(() => { const t = requestAnimationFrame(() => setW(pct)); return () => cancelAnimationFrame(t); }, [pct]);
  return html`<div class=${`bar ${accent ? 'accent' : ''} ${over ? 'over' : ''}`}><i style=${`width:${w}%`}></i></div>`;
}

export function Check({ on }) {
  return html`<span class=${`check ${on ? 'on' : ''}`}><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
}

export function CheckRow({ on, onToggle, label, meta, right }) {
  return html`<button class=${`check-row ${on ? 'done' : ''}`} onClick=${() => { haptic(); onToggle?.(); }}>
    <${Check} on=${on} />
    <div class="grow"><div class="label">${label}</div>${meta && html`<div class="meta">${meta}</div>`}</div>
    ${right}
  </button>`;
}

// ---------- panneau (bottom sheet) ----------
export function Sheet({ open, onClose, children, title }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);
  if (!open) return null;
  return html`<div>
    <div class="scrim" onClick=${onClose}></div>
    <div class="sheet" role="dialog" aria-modal="true">
      <div class="sheet-grip"></div>
      ${title && html`<div class="row between" style="margin-bottom:16px"><h2 class="h2">${title}</h2><button class="icon-btn" aria-label="Fermer" onClick=${onClose}><${Icon} name="x" size=${20} /></button></div>`}
      ${children}
    </div>
  </div>`;
}

// ---------- toast + petite célébration ----------
let toastFn = null;
export function toast(msg) { toastFn?.(msg); }
export function Toaster() {
  const [msg, setMsg] = useState(null);
  const t = useRef();
  useEffect(() => { toastFn = m => { setMsg(m); clearTimeout(t.current); t.current = setTimeout(() => setMsg(null), 2600); }; }, []);
  return msg ? html`<div class="toast" key=${msg}>${msg}</div>` : null;
}

export function celebrate() {
  const el = document.createElement('div');
  el.className = 'burst';
  for (let i = 0; i < 14; i++) {
    const s = document.createElement('span');
    const a = (i / 14) * Math.PI * 2;
    const d = 70 + Math.random() * 50;
    s.style.setProperty('--dx', `${Math.cos(a) * d}px`);
    s.style.setProperty('--dy', `${Math.sin(a) * d}px`);
    el.appendChild(s);
  }
  document.body.appendChild(el);
  haptic();
  setTimeout(() => el.remove(), 1100);
}

export function haptic() { try { navigator.vibrate?.(8); } catch {} }

export function Empty({ icon = 'info', title, text, action }) {
  return html`<div class="empty fade-in">
    <${Icon} name=${icon} size=${34} stroke=${1.2} />
    <div class="h3" style="color:var(--text);margin-bottom:4px">${title}</div>
    ${text && html`<div class="small">${text}</div>`}
    ${action && html`<div class="mt-16">${action}</div>`}
  </div>`;
}

export function Stepper({ value, onChange, step = 1, min = 0, max = 9999, fmt = v => v }) {
  return html`<div class="row gap-8">
    <button class="icon-btn" style="background:var(--card-2)" aria-label="Moins" onClick=${() => onChange(Math.max(min, +(value - step).toFixed(2)))}><${Icon} name="minus" size=${18} /></button>
    <div class="num-m" style="min-width:64px;text-align:center">${fmt(value)}</div>
    <button class="icon-btn" style="background:var(--card-2)" aria-label="Plus" onClick=${() => onChange(Math.min(max, +(value + step).toFixed(2)))}><${Icon} name="plus" size=${18} /></button>
  </div>`;
}

export const fmt0 = n => Math.round(n || 0).toLocaleString('fr-CH').replace(/ |’/g, ' ');
export const fmt1 = n => (Math.round((n || 0) * 10) / 10).toLocaleString('fr-CH', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
