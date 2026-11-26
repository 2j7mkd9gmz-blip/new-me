// Tout le programme « New Me » : profil, repas, séances, reprise du mollet.
import { dow, monday, addDays, dayIndex, diffDays } from './util.js';

export const PROFILE = {
  startDate: '2026-11-16',
  startWeight: 73,
  milestoneDate: '2027-01-01',
  milestoneWeight: 68.5,
  goalDate: '2027-02-28',
  goalWeight: 65,
  rehabStart: '2026-11-19',
};

// ---------- Nourriture ----------
// Estimations simples (kcal, g de protéines) pour une saisie en 1 tap.
export const FOOD = {
  oeufs: { name: '3 œufs + 2 pains complets + fruit', kcal: 450, prot: 26, cat: 'Petit-déj' },
  skyr_avoine: { name: 'Skyr 250 g + avoine 40 g + banane', kcal: 410, prot: 33, cat: 'Petit-déj' },
  poulet_riz: { name: 'Poulet + riz + légumes poêlés', kcal: 550, prot: 45, cat: 'Midi' },
  boeuf_pates: { name: 'Bœuf 5 % + pâtes complètes + courgettes', kcal: 580, prot: 44, cat: 'Midi' },
  dinde_patates: { name: 'Dinde + patates + haricots verts', kcal: 450, prot: 42, cat: 'Midi' },
  tartine: { name: 'Tartine jambon/fromage frais + fruit', kcal: 220, prot: 13, cat: 'Collation' },
  skyr_fruit: { name: 'Skyr + fruit', kcal: 170, prot: 16, cat: 'Collation' },
  amandes: { name: 'Poignée d’amandes (30 g)', kcal: 175, prot: 6, cat: 'Collation' },
  chocolat: { name: 'Chocolat prévu (20 g)', kcal: 110, prot: 1, cat: 'Collation' },
  omelette: { name: 'Omelette + légumes + 1 poing de féculents', kcal: 520, prot: 30, cat: 'Soir' },
  poulet_salade: { name: 'Poulet + salade + patates', kcal: 550, prot: 48, cat: 'Soir' },
  chili: { name: 'Chili con carne', kcal: 600, prot: 42, cat: 'Soir' },
  poing: { name: '+1 poing de féculents', kcal: 150, prot: 4, cat: 'Extra' },
  thon: { name: 'Boîte de thon', kcal: 120, prot: 26, cat: 'Extra' },
  fastfood: { name: 'Fast-food de la semaine', kcal: 1100, prot: 45, cat: 'Extra' },
};

const BREAKFASTS = ['oeufs', 'skyr_avoine'];
const LUNCHES = ['poulet_riz', 'boeuf_pates', 'dinde_patates'];
const SNACKS = ['tartine', 'skyr_fruit', 'amandes'];
const DINNERS = ['omelette', 'poulet_salade', 'chili'];
export const MEAL_OPTIONS = { m_b: BREAKFASTS, m_l: LUNCHES, m_s: [...SNACKS, 'chocolat'], m_d: DINNERS };

export const PLATE_RULES = [
  'Midi : ½ assiette de légumes, ¼ protéines, ¼ féculents (150-200 g cuits).',
  'Soir : beaucoup de protéines + légumes. 1 poing de féculents sans basket, 2 poings avec basket.',
  '3 vrais repas + 1 collation prévue. Pas de jeûne, pas de grignotage improvisé.',
  'Boissons : eau, café sans sucre, zéro. Fast-food : 1×/semaine, assumé.',
];

// ---------- Courses ----------
export const DEFAULT_SHOPPING = [
  ['Protéines', '1,5 kg de poulet ou dinde'], ['Protéines', '500 g de bœuf haché 5 %'], ['Protéines', '18 œufs'],
  ['Protéines', '1,5 kg de séré ou skyr'], ['Protéines', 'Jambon'], ['Protéines', '2 boîtes de thon'],
  ['Féculents', 'Riz'], ['Féculents', 'Pâtes complètes'], ['Féculents', 'Pommes de terre'],
  ['Féculents', 'Flocons d’avoine'], ['Féculents', 'Pain complet'],
  ['Légumes', 'Courgettes'], ['Légumes', 'Brocolis'], ['Légumes', 'Haricots verts surgelés'],
  ['Légumes', 'Salade'], ['Légumes', 'Tomates'], ['Légumes', 'Poivrons'],
  ['Fruits', 'Bananes'], ['Fruits', 'Pommes'], ['Fruits', 'Baies surgelées'],
  ['Autres', 'Sauce tomate'], ['Autres', 'Huile d’olive'], ['Autres', 'Épices'], ['Autres', 'Amandes'],
];
export const SHOP_CATS = ['Protéines', 'Féculents', 'Légumes', 'Fruits', 'Autres'];

// ---------- Muscu ----------
// unit: 'reps' ou 'sec'. weighted: on saisit une charge. inc: saut de charge conseillé.
export const SESSIONS = {
  A: {
    name: 'Séance A · jambes + dos', short: 'A', duration: '≈ 60 min',
    warmup: '10 min de vélo + rotations de chevilles et de hanches',
    after: 'Sauna après (jamais avant le basket). Bois bien.',
    exercises: [
      { id: 'box', name: 'Sauts sur box', sets: 3, reps: 5, unit: 'reps', weighted: false, rest: 120, cond: 'jumps', note: 'Début de séance, récup complète entre les séries' },
      { id: 'squat', name: 'Squat goblet ou barre', sets: 4, reps: 8, unit: 'reps', weighted: true, inc: 2.5, note: 'Charge modérée' },
      { id: 'sdt', name: 'Soulevé de terre jambes tendues', sets: 3, reps: 10, unit: 'reps', weighted: true, inc: 2.5 },
      { id: 'bulgare', name: 'Fentes bulgares', sets: 3, reps: 8, unit: 'reps', weighted: true, inc: 2, note: 'Par jambe' },
      { id: 'tractionsA', name: 'Tractions ou tirage vertical', sets: 4, reps: 8, unit: 'reps', weighted: true, inc: 2.5, note: '0 kg = poids du corps' },
      { id: 'rowing_h', name: 'Rowing haltère', sets: 3, reps: 10, unit: 'reps', weighted: true, inc: 2, note: 'Par bras' },
      { id: 'mollets_debout', name: 'Mollets debout, jambes tendues', sets: 3, reps: 15, unit: 'reps', weighted: true, inc: 2, note: 'Descente lente sur 3 s' },
      { id: 'mollets_assis', name: 'Mollets assis', sets: 3, reps: 15, unit: 'reps', weighted: true, inc: 2 },
      { id: 'planche', name: 'Planche', sets: 3, reps: 40, unit: 'sec', weighted: false },
    ],
  },
  B: {
    name: 'Séance B · haut du corps', short: 'B', duration: '≈ 50 min',
    warmup: '5 min de rameur ou de vélo + rotations d’épaules',
    after: 'En reprise, tu peux sauter cette séance si ça fait trop avec le basket du soir.',
    exercises: [
      { id: 'dc', name: 'Développé couché (barre ou haltères)', sets: 4, reps: 8, unit: 'reps', weighted: true, inc: 2.5 },
      { id: 'tractionsB', name: 'Tractions ou tirage vertical', sets: 3, reps: 8, unit: 'reps', weighted: true, inc: 2.5, note: '0 kg = poids du corps' },
      { id: 'militaire', name: 'Développé militaire haltères', sets: 3, reps: 10, unit: 'reps', weighted: true, inc: 2 },
      { id: 'poulie', name: 'Rowing à la poulie', sets: 3, reps: 10, unit: 'reps', weighted: true, inc: 2.5 },
      { id: 'dips', name: 'Dips ou pompes', sets: 3, reps: 10, unit: 'reps', weighted: false, note: 'Stop 2 reps avant l’échec' },
      { id: 'curl', name: 'Curl biceps', sets: 3, reps: 12, unit: 'reps', weighted: true, inc: 1, rest: 0, note: 'Enchaîné direct avec les triceps' },
      { id: 'triceps', name: 'Extension triceps', sets: 3, reps: 12, unit: 'reps', weighted: true, inc: 1 },
      { id: 'lateral', name: 'Gainage latéral', sets: 3, reps: 30, unit: 'sec', weighted: false, note: 'Par côté' },
      { id: 'mollets_B', name: 'Renfo mollets debout', sets: 3, reps: 15, unit: 'reps', weighted: true, inc: 2, note: 'Renfo mollet à chaque séance' },
    ],
  },
  S: {
    name: 'Séance bonus · samedi léger', short: 'S', duration: '≈ 40 min',
    warmup: '5 min de vélo + rotations',
    after: 'Seulement les week-ends sans match. Léger, pas d’échec.',
    exercises: [
      { id: 'goblet_light', name: 'Squat goblet léger', sets: 3, reps: 10, unit: 'reps', weighted: true, inc: 2, note: 'Saute-le si basket ou match le lendemain' },
      { id: 'pompes', name: 'Pompes', sets: 3, reps: 12, unit: 'reps', weighted: false, note: 'Stop 2 reps avant l’échec' },
      { id: 'tirage_S', name: 'Tirage vertical', sets: 3, reps: 10, unit: 'reps', weighted: true, inc: 2.5 },
      { id: 'militaire_S', name: 'Développé militaire haltères', sets: 3, reps: 10, unit: 'reps', weighted: true, inc: 2 },
      { id: 'mollets_S', name: 'Renfo mollets debout', sets: 3, reps: 15, unit: 'reps', weighted: true, inc: 2 },
      { id: 'planche_S', name: 'Planche', sets: 3, reps: 40, unit: 'sec', weighted: false },
    ],
  },
};

export const MUSCU_RULES = [
  '1-2 reps en réserve. Jamais d’échec.',
  'Repos 1 min 30 à 2 min entre les séries.',
  'Toutes les reps réussies proprement → tu ajoutes du poids la fois d’après.',
  'Jamais de jambes la veille d’un match ou d’un basket. Pas de 3e muscu en semaine.',
];

// ---------- Mollet ----------
export const CALF_STAGES = {
  1: { title: 'Semaine 1', rules: ['Muscu normale', 'Vélo ou footing léger 20-30 min', 'Basket : shoot + technique seulement', 'Pas de sprint, pas de gros saut, pas de match'] },
  2: { title: 'Semaine 2', rules: ['Accélérations progressives', 'Petits sauts', 'Entraînements sans contact', 'Pas de match'] },
  3: { title: 'Semaine 3', rules: ['Entraînement complet', 'Match seulement si zéro douleur la semaine d’avant', 'Et seulement avec le feu vert du physio'] },
  4: { title: 'Reprise terminée', rules: ['Tu joues normalement', 'Échauffement 10-15 min avant chaque basket', 'Renfo mollets à chaque séance'] },
};
export const CALF_FOREVER = [
  '10-15 min d’échauffement avant le basket.',
  'Renfo des mollets à chaque séance.',
  'Douleur pendant l’effort, ou mollet qui tire le lendemain matin → retour à l’étape d’avant.',
];

// ---------- Logique de la journée ----------
export function calfPainFree(st, days = 7, ref) {
  const from = addDays(ref, -days);
  return !st.calf.logs.some((l) => l.date > from && l.date <= ref && l.pain > 0);
}

export function matchAllowed(st, date) {
  return st.calf.physioOK && st.calf.stage >= 3 && calfPainFree(st, 7, addDays(date, -1));
}

function basketNote(stage) {
  if (stage === 1) return 'Shoot + technique only. Pas de sprint, pas de gros saut.';
  if (stage === 2) return 'Accélérations progressives, petits sauts, sans contact.';
  if (stage === 3) return 'Entraînement complet. Échauffement 10-15 min.';
  return 'Échauffement 10-15 min avant, comme toujours.';
}

export function dayPlan(date, st) {
  const w = dow(date); // 0 dim … 6 sam
  const mon = monday(date);
  const match = st.matches[mon] || 'none';
  const prevMatch = st.matches[addDays(mon, -7)] || 'none';
  const stage = st.calf.stage;
  const isWork = w >= 1 && w <= 3;
  const isMatchDay = (match === 'sat' && w === 6) || (match === 'sun' && w === 0);
  const afterMatch = (match === 'sat' && w === 0) || (prevMatch === 'sun' && w === 1);
  const eveOfMatch = (match === 'sat' && w === 5) || (match === 'sun' && w === 6);
  const canPlayMatch = matchAllowed(st, date);
  const idx = dayIndex(date);

  const tasks = [];
  const tags = [];
  const notes = [];
  let basket = false;
  let session = null;

  if (isWork) {
    tags.push('Boulot');
    tasks.push({ id: 'work', icon: '💼', text: 'Boulot', sub: w === 1 ? 'Début 7h45 · 1h15 de trajet' : 'Début 6h30-7h · 1h15 de trajet' });
    tasks.push({ id: 'standup', icon: '🧍', text: 'Debout 2-3 min toutes les 45 min', sub: 'À une table, pas sur le lit' });
  }

  if (w === 1) {
    basket = true;
    tasks.push({ id: 'basket', icon: '🏀', text: 'Basket 19h-20h30', sub: basketNote(stage) });
    if (afterMatch) notes.push('Lendemain de match : écoute tes jambes au basket ce soir.');
  }
  if (w === 2) {
    session = 'A';
    tasks.push({ id: 'muscu', icon: '🏋️', text: 'Muscu A (jambes + dos)', sub: 'Fin d’après-midi · ≈ 60 min', link: '#/muscu?s=A' });
    tasks.push({ id: 'sauna', icon: '🔥', text: 'Sauna après la séance', sub: 'Bois bien. Le poids perdu = de l’eau.' });
  }
  if (w === 3) {
    tags.push('Repos');
    tasks.push({ id: 'rest', icon: '😴', text: 'Repos', sub: 'Sauna optionnel' });
  }
  if (w === 4) {
    session = 'B';
    basket = true;
    tasks.push({ id: 'muscu', icon: '🏋️', text: 'Muscu B (haut du corps) le matin', sub: stage <= 3 ? 'Reprise : tu peux la sauter si c’est trop avec le basket' : '≈ 50 min', link: '#/muscu?s=B' });
    tasks.push({ id: 'basket', icon: '🏀', text: 'Basket 20h20-22h', sub: basketNote(stage) });
  }
  if (w === 5) {
    basket = true;
    tasks.push({ id: 'basket', icon: '🏀', text: 'Basket 20h-22h', sub: basketNote(stage) });
  }
  if (eveOfMatch) notes.push('Veille de match : zéro jambes aujourd’hui.');

  if (w === 6) {
    if (isMatchDay) {
      basket = canPlayMatch;
      tasks.push(canPlayMatch
        ? { id: 'match', icon: '🏆', text: 'Match', sub: 'Échauffement 10-15 min. Fais-les mal.' }
        : { id: 'match', icon: '🪑', text: 'Match : pas pour toi', sub: matchBlockReason(st, date) });
    } else if (match === 'sun') {
      tags.push('Repos');
      tasks.push({ id: 'rest', icon: '😴', text: 'Repos, match demain', sub: 'Pas de jambes, pas de séance' });
    } else {
      session = 'S';
      tasks.push({ id: 'muscu', icon: '🏋️', text: 'Séance bonus (haut du corps / full body léger)', sub: 'Pas de match ce week-end', link: '#/muscu?s=S' });
    }
  }
  if (w === 0) {
    if (isMatchDay) {
      basket = canPlayMatch;
      tasks.push(canPlayMatch
        ? { id: 'match', icon: '🏆', text: 'Match', sub: 'Échauffement 10-15 min. Fais-les mal.' }
        : { id: 'match', icon: '🪑', text: 'Match : pas pour toi', sub: matchBlockReason(st, date) });
    } else if (afterMatch) {
      tags.push('Repos actif');
      tasks.push({ id: 'rest', icon: '🚶', text: 'Repos actif : balade tranquille', sub: 'Pas toute la journée sous la couette' });
    } else {
      tags.push('Repos');
      tasks.push({ id: 'rest', icon: '😴', text: 'Repos', sub: 'Une balade pour faire tes pas' });
    }
  }
  if (basket) tags.unshift('Basket');
  if (session) tags.unshift('Muscu ' + session);

  // Meal prep dimanche + mercredi
  if (w === 0 || w === 3) tasks.push({ id: 'prep', icon: '🥡', text: 'Meal prep (1h)', sub: 'Les midis des prochains jours' });

  // Marche, pas
  tasks.push({ id: 'walk', icon: '🚶', text: 'Marche 15-20 min après le midi' });
  const stepsGoal = isWork ? null : 8000;

  // Calories
  const kcal = basket ? 2200 : 2000;
  const poings = basket ? 2 : 1;

  // Repas (rotation)
  const meals = [
    { id: 'm_b', label: 'Petit-déj', key: BREAKFASTS[((idx % 2) + 2) % 2] },
    { id: 'm_l', label: 'Midi', key: LUNCHES[((idx % 3) + 3) % 3] },
    { id: 'm_s', label: basket || session ? 'Collation avant l’entraînement' : 'Collation prévue', key: SNACKS[((idx % 3) + 3) % 3] },
    { id: 'm_d', label: basket || session ? 'Soir après l’entraînement' : 'Soir', key: DINNERS[((idx % 3) + 3) % 3], extra: `${poings} poing${poings > 1 ? 's' : ''} de féculents` },
  ];

  // Sommeil : coucher ce soir, lever demain
  const BED = { 0: '22:00', 1: '22:00', 2: '21:30', 3: '22:00', 4: '23:00', 5: '23:00', 6: '23:00' };
  const WAKE = { 0: '05:45', 1: '05:00', 2: '05:00' }; // lever du lendemain (lun, mar, mer)
  const bed = BED[w];
  const bedNote = w === 0 || w === 3 ? 'Au lit avant 22h30, sans exception' : w <= 2 ? `Lever demain ${WAKE[w].replace(':', 'h')}` : '7h de sommeil minimum';
  tasks.push({ id: 'bed', icon: '🛏️', text: `Au lit à ${bed.replace(':00', 'h').replace(':', 'h')}`, sub: bedNote + ' · lit = dormir, pas d’ordi' });

  return { date, w, isWork, basket, session, isMatchDay, afterMatch, eveOfMatch, match, tags, tasks, notes, stepsGoal, kcal, prot: [130, 140], meals, bed, poings };
}

export function matchBlockReason(st, date) {
  if (st.calf.stage < 3) return `Reprise étape ${st.calf.stage} : pas de match. Tu encourages.`;
  if (!st.calf.physioOK) return 'Pas de feu vert du physio. Pas de match.';
  if (!calfPainFree(st, 7, addDays(date, -1))) return 'Douleur au mollet cette semaine. Pas de match.';
  return '';
}

// Courbe cible : départ → jalon du 1er janvier → objectif
export function targetWeight(date) {
  const p = PROFILE;
  const pts = [[p.startDate, p.startWeight], [p.milestoneDate, p.milestoneWeight], [p.goalDate, p.goalWeight]];
  if (date <= pts[0][0]) return pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const [d0, w0] = pts[i], [d1, w1] = pts[i + 1];
    if (date <= d1) return w0 + (w1 - w0) * (diffDays(d0, date) / diffDays(d0, d1));
  }
  return p.goalWeight;
}
