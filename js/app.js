import { html, render, useState, useEffect } from '../vendor/preact-htm.js';
import { db } from './db.js';
import { Icon, Toaster, useStore } from './ui.js';
import { startAutoSync } from './sync.js';
import { Today } from './screens/today.js';
import { Training } from './screens/training.js';
import { Food } from './screens/food.js';
import { Track } from './screens/track.js';
import { Motivation } from './screens/motivation.js';
import { Settings } from './screens/settings.js';
import { startReminders } from './reminders.js';
import { go } from './nav.js';

const TABS = [
  { id: 'today', label: 'Aujourd’hui', icon: 'today' },
  { id: 'train', label: 'Prépa', icon: 'train' },
  { id: 'food', label: 'Nourriture', icon: 'food' },
  { id: 'track', label: 'Suivi', icon: 'stats' },
  { id: 'quote', label: 'Motivation', icon: 'quote' },
];

function readHash() {
  const [tab, ...rest] = location.hash.replace(/^#\/?/, '').split('/');
  return { tab: TABS.some(t => t.id === tab) || tab === 'settings' ? tab : 'today', sub: rest.join('/') };
}


function App() {
  useStore();
  const [route, setRoute] = useState(readHash());
  useEffect(() => {
    const on = () => { setRoute(readHash()); window.scrollTo({ top: 0 }); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  const { tab, sub } = route;
  let screen;
  if (tab === 'today') screen = html`<${Today} />`;
  else if (tab === 'train') screen = html`<${Training} sub=${sub} />`;
  else if (tab === 'food') screen = html`<${Food} sub=${sub} />`;
  else if (tab === 'track') screen = html`<${Track} sub=${sub} />`;
  else if (tab === 'quote') screen = html`<${Motivation} sub=${sub} />`;
  else screen = html`<${Settings} />`;

  return html`<div class="shell">
    <main key=${tab + '/' + sub.split('/')[0]}>${screen}</main>
    <nav class="tabbar" aria-label="Navigation">
      <div class="tabbar-inner">
        ${TABS.map(t => html`<button class=${`tab ${tab === t.id ? 'on' : ''}`} onClick=${() => go(t.id)} aria-current=${tab === t.id ? 'page' : null}>
          <${Icon} name=${t.icon} />
          <span>${t.label}</span>
        </button>`)}
      </div>
    </nav>
    <${Toaster} />
  </div>`;
}

await db.init();
render(html`<${App} />`, document.getElementById('app'));
startAutoSync();
startReminders();
