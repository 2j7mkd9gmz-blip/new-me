import { html, useState } from '../../vendor/preact-htm.js';
import { db } from '../db.js';
import { Icon, toast, Empty, haptic } from '../ui.js';
import { todayKey, addDays, fmtDate, daysBetween } from '../engine.js';
import { QUOTES, quoteIndexFor } from '../data/quotes.js';
import { go, back } from '../nav.js';

const KIND = { bible: 'Verset', sport: 'Sport', art: 'Art' };

export function Motivation({ sub }) {
  if (sub === 'history') return html`<${History} />`;
  const k = todayKey();
  const idx = quoteIndexFor(k);
  const q = QUOTES[idx];
  const fav = !!db.get('favQuotes', String(idx));
  const toggleFav = () => { haptic(); fav ? db.del('favQuotes', String(idx)) : db.put('favQuotes', String(idx), { at: k }); toast(fav ? 'Retirée des favoris' : 'Gardée en favori'); };
  return html`<div class="screen" style="padding-bottom:calc(var(--tabbar-h) + var(--safe-b) + 20px)">
    <div class="mot">
      <div class="row between">
        <div class="eyebrow">${fmtDate(k)} · ${KIND[q.kind]}</div>
        <button class="icon-btn" style="margin-right:-10px" aria-label="Historique" onClick=${() => go('quote', 'history')}><${Icon} name="history" size=${20} /></button>
      </div>
      <div style="padding:6vh 0 4vh">
        <p class="mot-quote">${q.t}</p>
        <div class="mot-rule"></div>
        <div class="h3">${q.a}</div>
        <div class="tiny muted" style="margin-top:2px">${q.ctx}</div>
      </div>
      <div class="stack gap-16">
        <p class="small" style="margin:0;color:var(--muted);line-height:1.5;max-width:34ch">${q.why}</p>
        <div class="row gap-8">
          <button class=${`btn ${fav ? 'accent' : 'ghost'} grow`} onClick=${toggleFav}><${Icon} name="star" size=${18} /> ${fav ? 'Favori' : 'Garder'}</button>
          <button class="btn ghost grow" onClick=${() => shareQuote(q)}><${Icon} name="share" size=${18} /> Story</button>
        </div>
      </div>
    </div>
  </div>`;
}

function History() {
  const k = todayKey();
  const [tab, setTab] = useState('past');
  const start = '2026-11-23';
  const n = Math.max(0, Math.min(365, daysBetween(start, k)));
  const past = Array.from({ length: n + 1 }, (_, i) => addDays(k, -i)).map(d => ({ d, i: quoteIndexFor(d) }));
  const favs = db.all('favQuotes').map(f => ({ d: f.at, i: Number(f.id) })).sort((a, b) => (a.d < b.d ? 1 : -1));
  const list = tab === 'past' ? past : favs;
  return html`<div class="screen stack gap-24">
    <header class="stack gap-12">
      <button class="row gap-4 small muted" onClick=${back}><${Icon} name="left" size=${16} /> Phrase du jour</button>
      <h1 class="title-xl">Phrases</h1>
      <div class="seg"><button class=${tab === 'past' ? 'on' : ''} onClick=${() => setTab('past')}>Historique</button><button class=${tab === 'fav' ? 'on' : ''} onClick=${() => setTab('fav')}>Favoris</button></div>
    </header>
    ${list.length ? html`<div class="stack gap-12">${list.map(({ d, i }) => {
      const q = QUOTES[i]; if (!q) return null;
      return html`<article class="card">
        <div class="tiny muted">${fmtDate(d)}</div>
        <div class="quote mt-8" style="font-size:20px">« ${q.t} »</div>
        <div class="row between mt-16"><span class="tiny muted">${q.a}</span><button class="icon-btn" aria-label="Partager" onClick=${() => shareQuote(q)}><${Icon} name="share" size=${17} /></button></div>
      </article>`;
    })}</div>` : html`<${Empty} icon="star" title="Pas encore de favori" text="Garde les phrases qui te parlent. Tu les retrouveras ici." />`}
  </div>`;
}

// ------------------------------------------------------------------ image story 1080 × 1920
function wrap(ctx, text, maxW) {
  const words = text.split(' '); const lines = []; let line = '';
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

export async function shareQuote(q) {
  try {
    await document.fonts.ready;
    await Promise.all([document.fonts.load('italic 80px "Instrument Serif"'), document.fonts.load('500 40px "Inter Tight"'), document.fonts.load('600 40px "Barlow Condensed"')]).catch(() => {});
    const c = document.createElement('canvas'); c.width = 1080; c.height = 1920;
    const x = c.getContext('2d');
    x.fillStyle = '#0C0B0A'; x.fillRect(0, 0, 1080, 1920);
    const pad = 110;
    x.fillStyle = '#B5835A'; x.font = '600 44px "Barlow Condensed", sans-serif'; x.textBaseline = 'alphabetic';
    x.fillText('NEW ME', pad, 220);
    let size = 92; let lines;
    do { x.font = `italic ${size}px "Instrument Serif", Georgia, serif`; lines = wrap(x, `« ${q.t} »`, 1080 - pad * 2); size -= 4; } while (lines.length * size * 1.12 > 1050 && size > 48);
    size += 4; const lh = size * 1.12;
    let y = 960 - (lines.length * lh) / 2 + size;
    x.fillStyle = '#EEEAE4';
    lines.forEach(l => { x.fillText(l, pad, y); y += lh; });
    x.fillStyle = '#B5835A'; x.fillRect(pad, y + 10, 70, 3);
    x.fillStyle = '#EEEAE4'; x.font = '500 40px "Inter Tight", sans-serif'; x.fillText(q.a, pad, y + 90);
    x.fillStyle = '#8E8780'; x.font = '400 32px "Inter Tight", sans-serif'; x.fillText(q.ctx, pad, y + 140);
    x.fillStyle = '#5C5650'; x.font = '400 30px "Inter Tight", sans-serif'; x.fillText('Une phrase par jour. Un objectif.', pad, 1780);
    const blob = await new Promise(r => c.toBlob(r, 'image/png'));
    const file = new File([blob], 'new-me-phrase.png', { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file] });
    else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; a.click(); toast('Image enregistrée'); }
  } catch (e) { if (e?.name !== 'AbortError') toast('Partage impossible sur cet appareil'); }
}
