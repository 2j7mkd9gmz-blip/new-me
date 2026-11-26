// Repas types du programme. items : [foodId, grammes, { starch: true }]
// starch = féculent du soir : 1 poing sans basket, 2 poings les jours de basket.

export const MEAL_SLOTS = [
  { id: 'breakfast', label: 'Petit-déj', time: '6h00' },
  { id: 'lunch', label: 'Midi', time: '12h00' },
  { id: 'snack', label: 'Collation', time: '16h30' },
  { id: 'dinner', label: 'Soir', time: '19h30' },
];

export const MEALS = [
  { id: 'bk_eggs', slot: 'breakfast', name: '3 œufs, pain complet, fruit', items: [['egg', 150], ['bread_whole', 70], ['apple', 150]] },
  { id: 'bk_skyr', slot: 'breakfast', name: 'Skyr, avoine, banane', items: [['skyr', 250], ['oats', 40], ['banana', 120]] },

  { id: 'lu_chicken', slot: 'lunch', name: 'Poulet, riz, légumes poêlés', prep: true, items: [['chicken_cooked', 160], ['rice_cooked', 180], ['zucchini', 150], ['pepper', 100], ['olive_oil', 5]] },
  { id: 'lu_beef', slot: 'lunch', name: 'Bœuf 5 %, pâtes complètes, tomate, courgettes', prep: true, items: [['beef_5', 150], ['pasta_whole_cooked', 180], ['tomato_sauce', 100], ['zucchini', 150]] },
  { id: 'lu_turkey', slot: 'lunch', name: 'Dinde, pommes de terre, haricots verts', prep: true, items: [['turkey_cooked', 160], ['potato', 220], ['green_beans', 200], ['olive_oil', 5]] },

  { id: 'sn_ham', slot: 'snack', name: 'Tartine jambon + fruit', items: [['bread_whole', 35], ['ham', 60], ['apple', 150]] },
  { id: 'sn_cheese', slot: 'snack', name: 'Tartine fromage frais + banane', items: [['bread_whole', 35], ['cream_cheese_light', 30], ['banana', 120]] },
  { id: 'sn_skyr', slot: 'snack', name: 'Skyr + baies', items: [['skyr', 150], ['berries', 80]] },
  { id: 'sn_almonds', slot: 'snack', name: 'Poignée d’amandes', items: [['almonds', 25]] },

  { id: 'di_omelette', slot: 'dinner', name: 'Omelette et légumes', items: [['egg', 150], ['egg_white', 66], ['spinach', 100], ['mushrooms', 100], ['tomato', 120], ['olive_oil', 5], ['potato', 150, { starch: true }]] },
  { id: 'di_chicken', slot: 'dinner', name: 'Poulet, salade, patates', items: [['chicken_cooked', 160], ['salad', 80], ['tomato', 120], ['vinaigrette', 10], ['potato', 150, { starch: true }]] },
  { id: 'di_chili', slot: 'dinner', name: 'Chili con carne', items: [['beef_5', 150], ['kidney_beans', 100], ['tomato_sauce', 120], ['pepper', 80], ['onion', 50], ['rice_cooked', 150, { starch: true }]] },
];

export const MEAL_INDEX = Object.fromEntries(MEALS.map(m => [m.id, m]));

export const GROCERIES = [
  { cat: 'Protéines', items: ['1,5 kg de poulet ou dinde', '500 g de bœuf haché 5 %', '18 œufs', '1,5 kg de séré ou skyr', 'Jambon', '2 boîtes de thon'] },
  { cat: 'Féculents', items: ['Riz', 'Pâtes complètes', 'Pommes de terre', 'Flocons d’avoine', 'Pain complet'] },
  { cat: 'Légumes', items: ['Courgettes', 'Brocolis', 'Haricots verts surgelés', 'Salade', 'Tomates', 'Poivrons'] },
  { cat: 'Fruits', items: ['Bananes', 'Pommes', 'Baies surgelées'] },
  { cat: 'Autres', items: ['Sauce tomate', 'Huile d’olive', 'Épices', 'Amandes'] },
];
