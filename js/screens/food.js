import { html, useState, useEffect, useRef } from '../../vendor/preact-htm.js';
import { db, uid } from '../db.js';
import { Icon, Bar, Sheet, toast, celebrate, Empty, CheckRow, fmt0, fmt1 } from '../ui.js';
import { todayKey, fmtDate, addDays, mondayOf } from '../engine.js';
import { MEAL_SLOTS, MEAL_INDEX, MEALS, GROCERIES } from '../data/meals.js';
import { searchFoods, macrosFor } from '../data/foods.js';
import { plannedMeals, logsFor, totalsFor, targets, logPlannedMeal, logEntry, nutritionAlert, recentMeals, favorites, customFoods, sum, mealItems, fastFoodThisWeek } from '../nutrition.js';
import { estimateMeal, hasApiKey } from '../ai.js';
import { go, back } from '../nav.js';

export function Food({ sub }) {
  const [kind, arg] = (sub || '').split('/');
  if (kind === 'add') return html`<${AddFood} slotParam=${arg} />`;
  if (kind === 'groceries') return html`<${Groceries} />`;
  return html`<${FoodDay} />`;
}

const slotLabel = id => MEAL_SLOTS.find(s => s.id === id)?.label || 'Extra';
function currentSlot() {
  const h = new Date().getHours();
  return h < 10 ? 'breakfast' : h < 15 ? 'lunch' : h < 18 ? 'snack' : 'dinner';
}

// ------------------------------------------------------------------ journée
function FoodDay() {
  const [k, setK] = useState(todayKey());
  const t = totalsFor(k);
  const g = targets(k);
  const logs = logsFor(k);
  const planned = plannedMeals(k);
  const alert = nutritionAlert(k);
  const ff = fastFoodThisWeek(k);
  const [swap, setSwap] = useState(null);
  const isToday = k === todayKey();

  const left = g.kcal - t.kcal;
  return html`<div class="screen stack gap-24">
    <header class="stack gap-12">
      <div class="row between">
        <button class="icon-btn" style="margin-left:-10px" aria-label="Jour précédent" onClick=${() => setK(addDays(k, -1))}><${Icon} name="left" size=${20} /></button>
        <div class="eyebrow">${isToday ? 'Aujourd’hui' : fmtDate(k)}${g.basketDay ? ' · jour de basket' : ''}</div>
        <button class="icon-btn" style="margin-right:-10px" aria-label="Jour suivant" onClick=${() => setK(addDays(k, 1))}><${Icon} name="right" size=${20} /></button>
      </div>
      <div class="center">
        <div class="num-xl">${fmt0(Math.abs(left))}</div>
        <div class="small muted">${left >= 0 ? 'kcal restantes' : 'kcal de trop'} · objectif ${fmt0(g.kcal)}</div>
      </div>
    </header>

    <section class="card stack gap-16">
      <${Macro} label="Calories" v=${t.kcal} max=${g.kcal} unit="kcal" accent over=${t.kcal > g.kcal * 1.05} />
      <${Macro} label="Protéines" v=${t.p} max=${g.pMin} unit="g" hint=${`${g.pMin}-${g.pMax} g`} />
      <div class="row gap-16">
        <div class="grow"><${Macro} label="Glucides" v=${t.c} max=${g.basketDay ? 230 : 190} unit="g" small /></div>
        <div class="grow"><${Macro} label="Lipides" v=${t.f} max=${65} unit="g" small /></div>
      </div>
      ${alert && html`<div class="small" style=${`color:${alert.level === 'danger' ? 'var(--danger)' : 'var(--accent)'}`}>${alert.text}</div>`}
    </section>

    ${MEAL_SLOTS.map(s => {
      const items = logs.filter(l => l.slot === s.id);
      const plan = planned[s.id];
      return html`<section key=${s.id}>
        <div class="section-head"><h2 class="h2">${s.label}</h2><span class="small muted">${items.length ? fmt0(sum(items).kcal) + ' kcal' : ''}</span></div>
        <div class="card" style="padding:4px 18px">
          ${items.map(l => html`<${LogRow} key=${l.id} l=${l} />`)}
          ${!items.length && plan && html`<div class="list-row">
            <button class="row gap-12 grow" style="text-align:left" onClick=${() => { logPlannedMeal(k, s.id, plan); toast(`${s.label} validé`); }}>
              <span class="check"></span>
              <div class="grow"><div class="h3">${plan.name}</div><div class="tiny muted">Prévu · ${fmt0(sum(mealItems(plan, g.basketDay)).kcal)} kcal · ${fmt0(sum(mealItems(plan, g.basketDay)).p)} g prot.</div></div>
            </button>
            <button class="icon-btn" aria-label="Changer de repas" onClick=${() => setSwap(s.id)}><${Icon} name="refresh" size=${18} /></button>
          </div>`}
          ${!items.length && !plan && html`<div class="small muted" style="padding:14px 0">${s.id === 'snack' ? 'Pas de collation prévue aujourd’hui (pas d’entraînement).' : 'Rien de prévu.'}</div>`}
          <button class="list-row small muted" onClick=${() => go('food', `add/${s.id}`)}><${Icon} name="plus" size=${16} /> Ajouter</button>
        </div>
      </section>`;
    })}

    <section class="card tight row between">
      <div class="row gap-12"><${Icon} name="flame" size=${20} style="color:var(--muted)" /><div><div class="h3">Fast-food de la semaine</div><div class="tiny muted">${ff ? `Pris ${fmtDate(ff.date)}. Assumé, et c’est le seul.` : '1 par semaine, assumé. Pas plus.'}</div></div></div>
      <button class=${`chip ${ff ? 'on' : ''}`} onClick=${() => { ff ? db.del('fastfood', mondayOf(k)) : db.put('fastfood', mondayOf(k), { date: k }); toast(ff ? 'Fast-food retiré' : 'Fast-food de la semaine coché'); }}>${ff ? 'Pris' : 'Cocher'}</button>
    </section>

    <button class="card tight pressable row gap-12" style="text-align:left" onClick=${() => go('food', 'groceries')}>
      <${Icon} name="cart" size=${20} style="color:var(--muted)" />
      <div class="grow"><div class="h3">Liste de courses</div><div class="tiny muted">Budget 250 CHF max · environ 120-150 CHF</div></div>
      <${Icon} name="right" size=${18} style="color:var(--faint)" />
    </button>

    <${Sheet} open=${!!swap} onClose=${() => setSwap(null)} title=${swap ? `Changer : ${slotLabel(swap)}` : ''}>
      <div class="stack">
        ${MEALS.filter(m => m.slot === swap).map(m => html`<button class="list-row" onClick=${() => { db.patch('mealPlan', k, { [swap]: m.id }); setSwap(null); }}>
          <div class="grow"><div class="h3">${m.name}</div><div class="tiny muted">${fmt0(sum(mealItems(m, g.basketDay)).kcal)} kcal · ${fmt0(sum(mealItems(m, g.basketDay)).p)} g prot.${m.prep ? ' · meal prep' : ''}</div></div>
          ${planned[swap]?.id === m.id && html`<${Icon} name="check" size=${18} style="color:var(--accent)" />`}
        </button>`)}
      </div>
    </${Sheet}>
  </div>`;
}

function Macro({ label, v, max, unit, hint, accent, over, small }) {
  return html`<div class="stack gap-8">
    <div class="row between"><span class=${small ? 'tiny muted' : 'small'}>${label}</span><span class=${small ? 'tiny muted' : 'small muted'}><span class="num" style=${`font-size:${small ? 15 : 18}px;color:var(--text)`}>${fmt0(v)}</span> / ${hint || fmt0(max) + ' ' + unit}</span></div>
    <${Bar} value=${v} max=${max} accent=${accent} over=${over} />
  </div>`;
}

function LogRow({ l }) {
  const [open, setOpen] = useState(false);
  const isFav = !!db.get('favMeals', l.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
  return html`<div>
    <button class="list-row" onClick=${() => setOpen(!open)}>
      <span class="check on"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>
      <div class="grow"><div class="h3">${l.name}</div><div class="tiny muted">${fmt0(l.kcal)} kcal · P ${fmt0(l.p)} · G ${fmt0(l.c)} · L ${fmt0(l.f)}${l.source === 'ai' ? ' · estimé par IA' : ''}</div></div>
    </button>
    ${open && html`<div class="fade-in" style="padding:0 0 12px 38px">
      ${(l.items || []).map(i => html`<div class="tiny muted row between" style="padding:3px 0"><span>${i.name} · ${fmt0(i.grams)} g</span><span>${fmt0(i.kcal)} kcal</span></div>`)}
      <div class="row gap-8 mt-8">
        <button class="chip" onClick=${() => { const id = l.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'); isFav ? db.del('favMeals', id) : db.put('favMeals', id, { name: l.name, slot: l.slot, items: l.items }); toast(isFav ? 'Retiré des favoris' : 'Ajouté aux favoris'); }}><${Icon} name="star" size=${15} /> ${isFav ? 'Favori' : 'Favori ?'}</button>
        <button class="chip" onClick=${() => { db.del('foodlog', l.id); toast('Supprimé'); }}><${Icon} name="trash" size=${15} /> Supprimer</button>
      </div>
    </div>`}
  </div>`;
}

// ------------------------------------------------------------------ ajout
function AddFood({ slotParam }) {
  const k = todayKey();
  const [slot, setSlot] = useState(MEAL_SLOTS.some(s => s.id === slotParam) ? slotParam : currentSlot());
  const [mode, setMode] = useState('search');
  const [q, setQ] = useState('');
  const [cart, setCart] = useState([]); // items en cours
  const [pick, setPick] = useState(null); // aliment choisi → quantité
  const [scanOpen, setScanOpen] = useState(false);
  const extra = customFoods();
  const results = searchFoods(q, extra);
  const recents = recentMeals();
  const favs = favorites();

  const addItem = it => { setCart(c => [...c, it]); setPick(null); setQ(''); };
  const commit = (name, items, extraFields = {}) => {
    logEntry(k, slot, name, items, extraFields);
    celebrate(); toast(`${slotLabel(slot)} : ${fmt0(sum(items).kcal)} kcal ajoutées`); back();
  };

  return html`<div class="screen stack gap-16">
    <header class="stack gap-12">
      <button class="row gap-4 small muted" onClick=${back}><${Icon} name="left" size=${16} /> Nourriture</button>
      <h1 class="title-l">J’ai mangé</h1>
      <div class="hscroll">${MEAL_SLOTS.map(s => html`<button class=${`chip ${slot === s.id ? 'on' : ''}`} onClick=${() => setSlot(s.id)}>${s.label}</button>`)}</div>
      <div class="seg">
        <button class=${mode === 'search' ? 'on' : ''} onClick=${() => setMode('search')}>Rechercher</button>
        <button class=${mode === 'ai' ? 'on' : ''} onClick=${() => setMode('ai')}>Décrire</button>
        <button class=${mode === 'custom' ? 'on' : ''} onClick=${() => setMode('custom')}>Créer</button>
      </div>
    </header>

    ${mode === 'search' && html`<div class="stack gap-16">
      <div class="row gap-8">
        <div class="grow" style="position:relative">
          <span style="position:absolute;left:14px;top:14px;color:var(--faint)"><${Icon} name="search" size=${20} /></span>
          <input class="input" style="width:100%;padding-left:44px" placeholder="Poulet, riz, skyr…" value=${q} onInput=${e => setQ(e.target.value)} autofocus />
        </div>
        <button class="icon-btn" style="width:48px;height:48px;background:var(--card-2);border-radius:var(--r-md)" aria-label="Scanner un code-barres" onClick=${() => setScanOpen(true)}><${Icon} name="barcode" size=${22} /></button>
      </div>

      ${cart.length > 0 && html`<section class="card fade-in">
        <div class="section-head" style="margin:0 0 6px"><h2 class="h3">Ton repas</h2><span class="num" style="font-size:20px">${fmt0(sum(cart).kcal)} <span class="tiny muted">kcal</span></span></div>
        ${cart.map((i, idx) => html`<div class="list-row"><div class="grow"><div class="small">${i.name}</div><div class="tiny muted">${fmt0(i.grams)} g · ${fmt0(i.kcal)} kcal · ${fmt0(i.p)} g prot.</div></div><button class="icon-btn" aria-label="Retirer" onClick=${() => setCart(cart.filter((_, j) => j !== idx))}><${Icon} name="x" size=${16} /></button></div>`)}
        <button class="btn accent block mt-8" onClick=${() => commit(cart.length === 1 ? cart[0].name : cart.map(i => i.name.split(',')[0]).slice(0, 3).join(' + '), cart)}>Valider · ${fmt0(sum(cart).kcal)} kcal</button>
      </section>`}

      ${q ? html`<div class="card" style="padding:4px 18px">
          ${results.length ? results.map(f => html`<button class="list-row" onClick=${() => setPick(f)}>
            <div class="grow"><div class="h3">${f.name}${f.brand ? html` <span class="muted small">· ${f.brand}</span>` : ''}</div><div class="tiny muted">${fmt0(f.kcal)} kcal · ${fmt1(f.p)} g prot. / 100 g</div></div>
            <${Icon} name="plus" size=${18} style="color:var(--faint)" />
          </button>`) : html`<div class="small muted" style="padding:14px 0">Rien trouvé. Essaie « Décrire » ou crée l’aliment.</div>`}
        </div>`
      : html`<div class="stack gap-16">
          ${favs.length > 0 && html`<section><div class="section-head"><h2 class="eyebrow">Favoris</h2></div><div class="card" style="padding:4px 18px">${favs.map(m => html`<${QuickMeal} m=${m} onAdd=${() => commit(m.name, m.items)} />`)}</div></section>`}
          ${recents.length > 0 && html`<section><div class="section-head"><h2 class="eyebrow">Récents</h2></div><div class="card" style="padding:4px 18px">${recents.map(m => html`<${QuickMeal} m=${m} onAdd=${() => commit(m.name, m.items)} />`)}</div></section>`}
          <section><div class="section-head"><h2 class="eyebrow">Repas du programme</h2></div><div class="card" style="padding:4px 18px">
            ${MEALS.filter(m => m.slot === slot).map(m => html`<${QuickMeal} m=${{ name: m.name, items: mealItems(m, targets(k).basketDay) }} onAdd=${() => commit(m.name, mealItems(m, targets(k).basketDay), { mealId: m.id })} />`)}
          </div></section>
        </div>`}
    </div>`}

    ${mode === 'ai' && html`<${AiMeal} onCommit=${(name, items) => commit(name, items, { source: 'ai' })} />`}
    ${mode === 'custom' && html`<${CustomFood} onCreated=${f => { setMode('search'); setPick(f); }} />`}

    <${QtySheet} food=${pick} onClose=${() => setPick(null)} onAdd=${addItem} />
    ${scanOpen && html`<${Scanner} onClose=${() => setScanOpen(false)} onFood=${f => { setScanOpen(false); setPick(f); }} />`}
  </div>`;
}

function QuickMeal({ m, onAdd }) {
  const t = sum(m.items || []);
  return html`<button class="list-row" onClick=${onAdd}>
    <div class="grow"><div class="h3">${m.name}</div><div class="tiny muted">${fmt0(t.kcal)} kcal · ${fmt0(t.p)} g prot.</div></div>
    <span class="chip accent"><${Icon} name="plus" size=${15} /> 1 clic</span>
  </button>`;
}

function QtySheet({ food, onClose, onAdd }) {
  const portions = food ? [...(food.portions || []), ['100 g', 100]] : [];
  const [grams, setGrams] = useState(100);
  const [count, setCount] = useState(1);
  const [unit, setUnit] = useState(0);
  useEffect(() => { if (food) { setUnit(0); setCount(1); setGrams(portions[0]?.[1] || 100); } }, [food]);
  if (!food) return null;
  const g = unit === -1 ? grams : (portions[unit]?.[1] || 100) * count;
  const m = macrosFor(food, g);
  return html`<${Sheet} open=${!!food} onClose=${onClose} title=${food.name}>
    <div class="stack gap-16">
      <div class="hscroll">
        ${portions.map((p, i) => html`<button class=${`chip ${unit === i ? 'on' : ''}`} onClick=${() => { setUnit(i); setCount(1); }}>${p[0]}${p[0] !== '100 g' ? ` · ${p[1]} g` : ''}</button>`)}
        <button class=${`chip ${unit === -1 ? 'on' : ''}`} onClick=${() => { setUnit(-1); setGrams(g); }}>Grammes</button>
      </div>
      ${unit === -1
        ? html`<div class="row gap-8"><input class="input num-input grow" inputmode="decimal" value=${grams} onInput=${e => setGrams(parseFloat(e.target.value.replace(',', '.')) || 0)} /><span class="muted">g</span></div>`
        : html`<div class="row between"><span class="small muted">Quantité</span>
            <div class="row gap-8">
              <button class="icon-btn" style="background:var(--card-2)" aria-label="Moins" onClick=${() => setCount(Math.max(0.5, count - 0.5))}><${Icon} name="minus" size=${18} /></button>
              <span class="num-m" style="min-width:48px;text-align:center">${String(count).replace('.', ',')}</span>
              <button class="icon-btn" style="background:var(--card-2)" aria-label="Plus" onClick=${() => setCount(count + 0.5)}><${Icon} name="plus" size=${18} /></button>
            </div></div>`}
      <div class="kv">
        <div><span class="num">${fmt0(m.kcal)}</span><span class="tiny">kcal</span></div>
        <div><span class="num">${fmt0(m.p)}</span><span class="tiny">prot.</span></div>
        <div><span class="num">${fmt0(m.c)}</span><span class="tiny">gluc.</span></div>
        <div><span class="num">${fmt0(m.f)}</span><span class="tiny">lip.</span></div>
      </div>
      <button class="btn primary block" onClick=${() => onAdd({ foodId: food.id, name: food.name, grams: g, ...m })}>Ajouter · ${fmt0(g)} g</button>
    </div>
  </${Sheet}>`;
}

function AiMeal({ onCommit }) {
  const [text, setText] = useState('');
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  if (!hasApiKey()) return html`<${Empty} icon="sparkle" title="Clé API Claude requise" text="Décris ton repas en une phrase, Claude estime les valeurs. Ajoute ta clé dans les réglages pour l’activer."
    action=${html`<button class="btn primary" onClick=${() => go('settings')}>Ouvrir les réglages</button>`} />`;
  const run = async () => {
    if (!text.trim()) { setErr('Décris ton repas d’abord.'); return; }
    setLoading(true); setErr(null);
    try { setRes(await estimateMeal(text.trim())); } catch (e) { setErr(e.message); }
    setLoading(false);
  };
  const edit = (i, field, v) => {
    const items = res.items.map((it, j) => {
      if (j !== i) return it;
      if (field === 'grams') { const r = (v || 0) / (it.grams || 1); return { ...it, grams: v, kcal: it.kcal * r, p: it.p * r, c: it.c * r, f: it.f * r }; }
      return { ...it, [field]: v };
    });
    setRes({ ...res, items });
  };
  return html`<div class="stack gap-16">
    <textarea class="input" placeholder="kebab frites + coca zéro" value=${text} onInput=${e => { setText(e.target.value); setErr(null); }}></textarea>
    ${err && html`<div class="small danger">${err}</div>`}
    <button class="btn primary block" disabled=${loading} onClick=${run}><${Icon} name="sparkle" size=${18} /> ${loading ? 'Estimation…' : 'Estimer'}</button>
    ${res && html`<section class="card fade-in stack gap-12">
      <div class="small muted">Vérifie et corrige les quantités avant de valider.</div>
      ${res.items.map((it, i) => html`<div class="row gap-8">
        <div class="grow"><div class="small">${it.name}</div><div class="tiny muted">${fmt0(it.kcal)} kcal · ${fmt0(it.p)} g prot.</div></div>
        <input class="input num-input" style="width:78px;height:40px;font-size:17px" inputmode="decimal" value=${Math.round(it.grams)} onInput=${e => edit(i, 'grams', parseFloat(e.target.value) || 0)} /><span class="tiny muted">g</span>
        <button class="icon-btn" aria-label="Retirer" onClick=${() => setRes({ ...res, items: res.items.filter((_, j) => j !== i) })}><${Icon} name="x" size=${16} /></button>
      </div>`)}
      <div class="kv">
        <div><span class="num">${fmt0(sum(res.items).kcal)}</span><span class="tiny">kcal</span></div>
        <div><span class="num">${fmt0(sum(res.items).p)}</span><span class="tiny">prot.</span></div>
        <div><span class="num">${fmt0(sum(res.items).c)}</span><span class="tiny">gluc.</span></div>
        <div><span class="num">${fmt0(sum(res.items).f)}</span><span class="tiny">lip.</span></div>
      </div>
      ${res.comment && html`<div class="small accent">${res.comment}</div>`}
      <button class="btn accent block" onClick=${() => onCommit(text.trim(), res.items)}>Valider</button>
    </section>`}
  </div>`;
}

function CustomFood({ onCreated }) {
  const [f, setF] = useState({ name: '', kcal: '', p: '', c: '', f: '', portion: '', pg: '' });
  const [err, setErr] = useState(null);
  const n = v => parseFloat(String(v).replace(',', '.')) || 0;
  const save = () => {
    if (!f.name.trim() || !n(f.kcal)) { setErr('Il faut au moins un nom et les kcal pour 100 g.'); return; }
    const id = 'c_' + uid();
    const food = { id, name: f.name.trim(), cat: 'Perso', kcal: n(f.kcal), p: n(f.p), c: n(f.c), f: n(f.f), portions: f.portion && n(f.pg) ? [[f.portion, n(f.pg)]] : [], aliases: '' };
    db.put('customFoods', id, food); toast('Aliment créé'); onCreated({ ...food, custom: true });
  };
  const field = (key, label, ph, mode = 'decimal') => html`<div class="field grow"><label>${label}</label><input class="input" inputmode=${mode} placeholder=${ph} value=${f[key]} onInput=${e => { setF({ ...f, [key]: e.target.value }); setErr(null); }} /></div>`;
  return html`<div class="stack gap-12">
    ${field('name', 'Nom', 'Wrap maison', 'text')}
    <div class="tiny muted">Valeurs pour 100 g (regarde l’étiquette).</div>
    <div class="row gap-8">${field('kcal', 'kcal', '250')}${field('p', 'Prot.', '12')}</div>
    <div class="row gap-8">${field('c', 'Gluc.', '30')}${field('f', 'Lip.', '8')}</div>
    <div class="row gap-8">${field('portion', 'Portion (optionnel)', '1 wrap', 'text')}${field('pg', 'Grammes', '180')}</div>
    ${err && html`<div class="small danger">${err}</div>`}
    <button class="btn primary block" onClick=${save}>Créer l’aliment</button>
  </div>`;
}

// ------------------------------------------------------------------ code-barres + Open Food Facts
async function lookupBarcode(code) {
  const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,product_name_fr,brands,nutriments,serving_size,serving_quantity`);
  const j = await r.json();
  if (j.status !== 1 || !j.product) return null;
  const p = j.product; const n = p.nutriments || {};
  const kcal = n['energy-kcal_100g'] ?? (n['energy_100g'] ? n['energy_100g'] / 4.184 : null);
  if (kcal == null) return null;
  const id = 'off_' + code;
  const food = {
    id, name: p.product_name_fr || p.product_name || `Produit ${code}`, brand: (p.brands || '').split(',')[0], cat: 'Scanné',
    kcal: +kcal, p: +(n.proteins_100g || 0), c: +(n.carbohydrates_100g || 0), f: +(n.fat_100g || 0),
    portions: p.serving_quantity ? [[`1 portion${p.serving_size ? ' (' + p.serving_size + ')' : ''}`, +p.serving_quantity]] : [], aliases: code,
  };
  db.put('customFoods', id, food); // gardé pour la prochaine fois, même hors ligne
  return food;
}

function Scanner({ onClose, onFood }) {
  const video = useRef();
  const [status, setStatus] = useState('Démarrage de la caméra…');
  const [manual, setManual] = useState('');
  const stopRef = useRef(() => {});
  const found = async code => {
    stopRef.current();
    const known = db.get('customFoods', 'off_' + code);
    if (known) { onFood({ ...known, custom: true }); return; }
    if (!navigator.onLine) { setStatus('Pas de réseau : le scan a besoin d’internet.'); return; }
    setStatus(`Code ${code} : recherche…`);
    try { const f = await lookupBarcode(code); f ? onFood(f) : setStatus('Produit inconnu sur Open Food Facts. Crée-le à la main.'); }
    catch { setStatus('Open Food Facts ne répond pas. Réessaie.'); }
  };
  useEffect(() => {
    let cancelled = false; let stream; let raf;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (cancelled) return;
        video.current.srcObject = stream; await video.current.play();
        setStatus('Vise le code-barres');
        stopRef.current = () => { cancelled = true; cancelAnimationFrame(raf); stream?.getTracks().forEach(t => t.stop()); };
        if ('BarcodeDetector' in window) {
          const det = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
          const loop = async () => { if (cancelled) return; try { const c = await det.detect(video.current); if (c[0]) return found(c[0].rawValue); } catch {} raf = requestAnimationFrame(loop); };
          loop();
        } else {
          const { BrowserMultiFormatReader } = await import('https://esm.sh/@zxing/browser@0.1.5');
          const reader = new BrowserMultiFormatReader();
          const controls = await reader.decodeFromVideoElement(video.current, (result) => { if (result && !cancelled) { controls.stop(); found(result.getText()); } });
          const prev = stopRef.current; stopRef.current = () => { controls.stop(); prev(); };
        }
      } catch (e) {
        setStatus(navigator.onLine ? 'Caméra indisponible. Autorise l’accès ou tape le code.' : 'Pas de réseau : le scan a besoin d’internet.');
      }
    })();
    return () => stopRef.current();
  }, []);
  return html`<${Sheet} open=${true} onClose=${() => { stopRef.current(); onClose(); }} title="Scanner">
    <div class="stack gap-16">
      <div style="position:relative;border-radius:var(--r-lg);overflow:hidden;background:#000;aspect-ratio:4/3">
        <video ref=${video} playsinline muted style="width:100%;height:100%;object-fit:cover"></video>
        <div style="position:absolute;left:12%;right:12%;top:40%;bottom:40%;border:1.5px solid rgba(255,255,255,.7);border-radius:12px"></div>
      </div>
      <div class="small muted center">${status}</div>
      <div class="row gap-8"><input class="input grow" inputmode="numeric" placeholder="Ou tape le code (EAN)" value=${manual} onInput=${e => setManual(e.target.value)} /><button class="btn primary" onClick=${() => manual.trim() && found(manual.trim())}>OK</button></div>
    </div>
  </${Sheet}>`;
}

// ------------------------------------------------------------------ courses
function Groceries() {
  const week = mondayOf(todayKey());
  const custom = db.get('groceryList', 'items');
  const list = custom || GROCERIES.flatMap(g => g.items.map(i => ({ cat: g.cat, name: i })));
  const checked = db.get('groceryChecks', week) || {};
  const [adding, setAdding] = useState('');
  const [editing, setEditing] = useState(false);
  const save = l => db.put('groceryList', 'items', l);
  const cats = [...new Set(list.map(i => i.cat))];
  const done = list.filter(i => checked[i.name]).length;
  return html`<div class="screen stack gap-24">
    <header class="stack gap-12">
      <button class="row gap-4 small muted" onClick=${back}><${Icon} name="left" size=${16} /> Nourriture</button>
      <div class="row between"><h1 class="title-xl">Courses</h1><button class="chip" onClick=${() => setEditing(!editing)}>${editing ? 'Terminé' : 'Modifier'}</button></div>
      <div class="row between small muted"><span>Semaine du ${fmtDate(week, { noDay: true })}</span><span>${done}/${list.length}</span></div>
      <${Bar} value=${done} max=${list.length} accent />
    </header>
    ${cats.map(c => html`<section>
      <div class="section-head"><h2 class="eyebrow">${c}</h2></div>
      <div class="card" style="padding:4px 18px">
        ${list.filter(i => i.cat === c).map(i => editing
          ? html`<div class="list-row"><div class="grow small">${i.name}</div><button class="icon-btn" aria-label="Supprimer" onClick=${() => save(list.filter(x => x !== i))}><${Icon} name="trash" size=${17} /></button></div>`
          : html`<${CheckRow} on=${!!checked[i.name]} onToggle=${() => db.put('groceryChecks', week, { ...checked, [i.name]: !checked[i.name] })} label=${i.name} />`)}
      </div>
    </section>`)}
    <div class="row gap-8">
      <input class="input grow" placeholder="Ajouter un article" value=${adding} onInput=${e => setAdding(e.target.value)} onKeyDown=${e => { if (e.key === 'Enter' && adding.trim()) { save([...list, { cat: 'Autres', name: adding.trim() }]); setAdding(''); } }} />
      <button class="btn primary" onClick=${() => { if (adding.trim()) { save([...list, { cat: 'Autres', name: adding.trim() }]); setAdding(''); } }}>Ajouter</button>
    </div>
    <button class="small muted" onClick=${() => db.put('groceryChecks', week, {})}>Tout décocher</button>
  </div>`;
}
