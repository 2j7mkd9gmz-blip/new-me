// Base d'aliments embarquée (fonctionne hors ligne).
// Valeurs pour 100 g : [kcal, protéines, glucides, lipides].
// Valeurs moyennes arrondies, cohérentes avec la base suisse des valeurs nutritives
// et la table CIQUAL. Indicatives : les étiquettes des produits font foi.
// portions : [libellé, grammes]

const F = (id, name, cat, v, portions = [], aliases = '') => ({ id, name, cat, kcal: v[0], p: v[1], c: v[2], f: v[3], portions, aliases });

export const FOODS = [
  // Protéines
  F('egg', 'Œuf entier', 'Protéines', [140, 12.5, 0.7, 9.6], [['1 œuf', 50]], 'oeuf oeufs'),
  F('egg_white', 'Blanc d’œuf', 'Protéines', [48, 10.5, 0.7, 0.2], [['1 blanc', 33]], 'oeuf blanc'),
  F('chicken_raw', 'Poulet, blanc cru', 'Protéines', [110, 23, 0, 1.5], [['1 paume', 130]], 'poulet filet'),
  F('chicken_cooked', 'Poulet, blanc cuit', 'Protéines', [150, 31, 0, 2.5], [['1 paume', 120]], 'poulet filet grillé'),
  F('turkey_raw', 'Dinde, escalope crue', 'Protéines', [105, 23, 0, 1.2], [['1 paume', 130]], 'dinde'),
  F('turkey_cooked', 'Dinde, escalope cuite', 'Protéines', [145, 30, 0, 2], [['1 paume', 120]], 'dinde'),
  F('beef_5', 'Bœuf haché 5 %', 'Protéines', [125, 21, 0, 5], [['1 portion', 150]], 'boeuf hache steak'),
  F('beef_steak', 'Steak de bœuf', 'Protéines', [130, 22, 0, 4.5], [['1 steak', 160]], 'boeuf'),
  F('pork_chop', 'Côtelette de porc', 'Protéines', [170, 20, 0, 10], [['1 côtelette', 150]], 'porc'),
  F('ham', 'Jambon cuit', 'Protéines', [115, 20, 1, 3.5], [['1 tranche', 30]], 'jambon'),
  F('tuna', 'Thon au naturel, égoutté', 'Protéines', [110, 25, 0, 1], [['1 boîte', 120]], 'thon'),
  F('cod', 'Cabillaud', 'Protéines', [80, 18, 0, 0.7], [['1 filet', 150]], 'poisson colin'),
  F('shrimp', 'Crevettes', 'Protéines', [90, 20, 0, 1], [['1 portion', 100]], 'crevette'),
  F('tofu', 'Tofu nature', 'Protéines', [120, 13, 1.5, 7], [['1 portion', 125]], 'tofu'),
  F('sausage_veal', 'Saucisse de veau', 'Protéines', [240, 12, 1, 21], [['1 saucisse', 130]], 'bratwurst st-gall'),
  F('cervelas', 'Cervelas', 'Protéines', [270, 12, 1, 24], [['1 cervelas', 100]], 'cervelas'),
  F('bacon', 'Lardons / bacon', 'Protéines', [300, 15, 0.5, 27], [['1 portion', 40]], 'lard'),
  F('whey', 'Whey protéine', 'Protéines', [380, 78, 7, 6], [['1 dose', 30]], 'proteine shake'),
  F('protein_bar', 'Barre protéinée', 'Protéines', [350, 33, 35, 10], [['1 barre', 55]], 'barre'),

  // Laitiers
  F('quark', 'Séré maigre', 'Laitiers', [66, 12, 4, 0.2], [['1 pot', 250], ['1 c. à soupe', 30]], 'sere quark magerquark'),
  F('skyr', 'Skyr nature', 'Laitiers', [63, 11, 4, 0.2], [['1 pot', 150]], 'skyr'),
  F('cottage', 'Cottage cheese', 'Laitiers', [100, 12, 3, 4.5], [['1 pot', 200]], 'huttenkase cottage'),
  F('yogurt', 'Yogourt nature', 'Laitiers', [65, 4, 5, 3.5], [['1 pot', 180]], 'yaourt yogurt'),
  F('milk', 'Lait demi-écrémé', 'Laitiers', [50, 3.3, 4.8, 2], [['1 verre', 200]], 'lait'),
  F('cream_cheese_light', 'Fromage frais léger', 'Laitiers', [160, 8, 5, 12], [['1 tartine', 30]], 'philadelphia cantadou'),
  F('gruyere', 'Gruyère', 'Laitiers', [410, 29, 0, 33], [['1 tranche', 25], ['1 poignée râpé', 30]], 'fromage emmental'),
  F('mozzarella', 'Mozzarella', 'Laitiers', [250, 18, 1, 19], [['1 boule', 125]], 'mozza'),
  F('feta', 'Feta', 'Laitiers', [265, 14, 1, 21], [['1 portion', 50]], 'feta'),
  F('raclette', 'Fromage à raclette', 'Laitiers', [350, 23, 0, 28], [['1 tranche', 30]], 'raclette'),
  F('butter', 'Beurre', 'Laitiers', [740, 0.7, 0.6, 82], [['1 noisette', 10]], 'beurre'),

  // Féculents
  F('bread_whole', 'Pain complet', 'Féculents', [240, 9, 42, 3], [['1 tranche', 35]], 'pain'),
  F('bread_white', 'Pain blanc / baguette', 'Féculents', [270, 9, 55, 1.5], [['1 tranche', 30], ['1/4 baguette', 60]], 'pain baguette'),
  F('oats', 'Flocons d’avoine', 'Féculents', [370, 13, 59, 7], [['1 portion', 40]], 'avoine flocons porridge'),
  F('granola', 'Granola / müesli croustillant', 'Féculents', [450, 9, 60, 18], [['1 bol', 50]], 'muesli cereales'),
  F('rice_cooked', 'Riz cuit', 'Féculents', [130, 2.7, 28, 0.3], [['1 poing', 150]], 'riz'),
  F('rice_brown_cooked', 'Riz complet cuit', 'Féculents', [120, 2.7, 24, 1], [['1 poing', 150]], 'riz complet'),
  F('pasta_whole_cooked', 'Pâtes complètes cuites', 'Féculents', [150, 5.5, 28, 1.2], [['1 poing', 150]], 'pates spaghetti'),
  F('pasta_cooked', 'Pâtes cuites', 'Féculents', [155, 5.5, 30, 0.9], [['1 poing', 150]], 'pates spaghetti'),
  F('potato', 'Pommes de terre cuites', 'Féculents', [80, 2, 17, 0.1], [['1 poing', 150]], 'patates pomme de terre'),
  F('sweet_potato', 'Patate douce cuite', 'Féculents', [90, 2, 20, 0.2], [['1 poing', 150]], 'patate douce'),
  F('quinoa_cooked', 'Quinoa cuit', 'Féculents', [120, 4.4, 20, 1.9], [['1 poing', 150]], 'quinoa'),
  F('couscous_cooked', 'Couscous cuit', 'Féculents', [112, 3.8, 23, 0.2], [['1 poing', 150]], 'semoule'),
  F('wrap', 'Tortilla / wrap', 'Féculents', [300, 8, 50, 7], [['1 wrap', 60]], 'tortilla'),
  F('rosti', 'Rösti', 'Féculents', [160, 2.5, 18, 8], [['1 portion', 200]], 'rosti'),
  F('croissant', 'Croissant / gipfeli', 'Féculents', [410, 8, 45, 21], [['1 croissant', 55]], 'gipfeli'),
  F('lentils', 'Lentilles cuites', 'Féculents', [115, 9, 17, 0.4], [['1 poing', 150]], 'lentilles'),
  F('kidney_beans', 'Haricots rouges cuits', 'Féculents', [115, 8, 16, 0.5], [['1 portion', 100]], 'haricots rouges'),
  F('chickpeas', 'Pois chiches cuits', 'Féculents', [140, 8, 18, 2.6], [['1 portion', 100]], 'pois chiches'),
  F('corn', 'Maïs', 'Féculents', [100, 3, 19, 1.4], [['1 portion', 80]], 'mais'),

  // Légumes
  F('zucchini', 'Courgette', 'Légumes', [17, 1.3, 2.3, 0.3], [['1 courgette', 200]], 'courgettes'),
  F('broccoli', 'Brocoli', 'Légumes', [35, 2.8, 4, 0.4], [['1 portion', 150]], 'brocolis'),
  F('green_beans', 'Haricots verts', 'Légumes', [30, 2, 4.5, 0.2], [['1 portion', 150]], 'haricots'),
  F('salad', 'Salade verte', 'Légumes', [15, 1.3, 1.5, 0.2], [['1 bol', 80]], 'laitue'),
  F('tomato', 'Tomate', 'Légumes', [19, 0.9, 3, 0.2], [['1 tomate', 120]], 'tomates'),
  F('pepper', 'Poivron', 'Légumes', [27, 1, 5, 0.3], [['1 poivron', 150]], 'poivrons'),
  F('onion', 'Oignon', 'Légumes', [40, 1.1, 8, 0.1], [['1 oignon', 100]], 'oignons'),
  F('carrot', 'Carotte', 'Légumes', [36, 0.8, 7, 0.3], [['1 carotte', 100]], 'carottes'),
  F('cucumber', 'Concombre', 'Légumes', [13, 0.7, 2, 0.1], [['1/2 concombre', 150]], 'concombre'),
  F('spinach', 'Épinards', 'Légumes', [25, 3, 1.5, 0.4], [['1 portion', 150]], 'epinards'),
  F('mushrooms', 'Champignons', 'Légumes', [22, 3, 0.5, 0.3], [['1 portion', 100]], 'champignons'),
  F('tomato_sauce', 'Sauce tomate', 'Légumes', [40, 1.5, 6, 1], [['1 portion', 100]], 'sauce passata'),
  F('avocado', 'Avocat', 'Légumes', [160, 2, 2, 15], [['1/2 avocat', 70]], 'avocat'),

  // Fruits
  F('banana', 'Banane', 'Fruits', [90, 1.1, 20, 0.3], [['1 banane', 120]], 'banane'),
  F('apple', 'Pomme', 'Fruits', [54, 0.3, 12, 0.2], [['1 pomme', 150]], 'pomme'),
  F('orange', 'Orange', 'Fruits', [47, 0.9, 9, 0.1], [['1 orange', 150]], 'orange'),
  F('kiwi', 'Kiwi', 'Fruits', [60, 1, 11, 0.5], [['1 kiwi', 75]], 'kiwi'),
  F('berries', 'Baies surgelées', 'Fruits', [45, 1, 8, 0.4], [['1 poignée', 80]], 'myrtilles framboises fruits rouges'),
  F('strawberries', 'Fraises', 'Fruits', [33, 0.7, 6, 0.3], [['1 bol', 150]], 'fraises'),
  F('grapes', 'Raisin', 'Fruits', [70, 0.7, 16, 0.2], [['1 grappe', 120]], 'raisins'),
  F('mango', 'Mangue', 'Fruits', [65, 0.8, 14, 0.4], [['1/2 mangue', 150]], 'mangue'),
  F('dates', 'Dattes', 'Fruits', [280, 2.5, 66, 0.4], [['1 datte', 8]], 'datte'),

  // Matières grasses, sucré, sauces
  F('olive_oil', 'Huile d’olive', 'Autres', [900, 0, 0, 100], [['1 c. à soupe', 10], ['1 c. à café', 5]], 'huile'),
  F('almonds', 'Amandes', 'Autres', [610, 22, 6, 52], [['1 poignée', 25]], 'amande noix'),
  F('peanut_butter', 'Beurre de cacahuète', 'Autres', [600, 25, 15, 50], [['1 c. à soupe', 15]], 'cacahuete'),
  F('dark_choc', 'Chocolat noir 70 %', 'Autres', [570, 8, 34, 42], [['1 carré', 10], ['1 rangée', 25]], 'chocolat'),
  F('milk_choc', 'Chocolat au lait', 'Autres', [540, 7, 57, 31], [['1 carré', 10], ['1 rangée', 25]], 'chocolat'),
  F('honey', 'Miel', 'Autres', [320, 0.4, 80, 0], [['1 c. à soupe', 20]], 'miel'),
  F('jam', 'Confiture', 'Autres', [250, 0.4, 60, 0.1], [['1 c. à café', 15]], 'confiture'),
  F('hummus', 'Houmous', 'Autres', [275, 7, 14, 20], [['1 c. à soupe', 30]], 'hummus'),
  F('ketchup', 'Ketchup', 'Autres', [110, 1.2, 25, 0.2], [['1 c. à soupe', 15]], 'ketchup'),
  F('mayo', 'Mayonnaise', 'Autres', [700, 1, 1, 77], [['1 c. à soupe', 15]], 'mayo'),
  F('vinaigrette', 'Vinaigrette', 'Autres', [450, 0, 5, 47], [['1 c. à soupe', 15]], 'sauce salade'),
  F('chips', 'Chips', 'Autres', [540, 6, 50, 34], [['1 poignée', 30], ['1 paquet', 90]], 'chips'),
  F('ice_cream', 'Glace', 'Autres', [210, 3.5, 25, 11], [['1 boule', 60]], 'glace'),

  // Boissons
  F('coffee', 'Café noir', 'Boissons', [2, 0.1, 0, 0], [['1 tasse', 150]], 'cafe espresso'),
  F('coke_zero', 'Boisson zéro', 'Boissons', [0.3, 0, 0, 0], [['1 canette', 330], ['1 bouteille', 500]], 'coca zero cola light pepsi max'),
  F('coke', 'Soda sucré', 'Boissons', [42, 0, 10.6, 0], [['1 canette', 330], ['1 bouteille', 500]], 'coca cola fanta sprite'),
  F('orange_juice', 'Jus d’orange', 'Boissons', [45, 0.7, 10, 0.2], [['1 verre', 200]], 'jus'),
  F('beer', 'Bière', 'Boissons', [43, 0.4, 3.5, 0], [['1 chope', 330], ['1 demi', 500]], 'biere'),
  F('energy_zero', 'Energy drink sans sucre', 'Boissons', [3, 0, 0.5, 0], [['1 canette', 250]], 'red bull'),

  // Fast-food
  F('kebab', 'Kebab pita', 'Fast-food', [215, 11, 22, 9], [['1 kebab', 350]], 'doner durum'),
  F('fries', 'Frites', 'Fast-food', [300, 3.4, 36, 15], [['1 portion moyenne', 120], ['1 grande portion', 150]], 'frites'),
  F('big_burger', 'Burger double fast-food', 'Fast-food', [257, 12, 21, 13], [['1 burger', 215]], 'big mac burger'),
  F('cheeseburger', 'Cheeseburger', 'Fast-food', [254, 13, 28, 10], [['1 burger', 118]], 'burger'),
  F('nuggets', 'Nuggets de poulet', 'Fast-food', [260, 15, 16, 15], [['6 nuggets', 100], ['9 nuggets', 150]], 'nuggets'),
  F('pizza', 'Pizza margherita', 'Fast-food', [250, 10, 32, 9], [['1 pizza', 350], ['1 part', 90]], 'pizza'),
];

export const FOOD_INDEX = Object.fromEntries(FOODS.map(f => [f.id, f]));

export function macrosFor(food, grams) {
  const k = grams / 100;
  return { kcal: food.kcal * k, p: food.p * k, c: food.c * k, f: food.f * k };
}

export function normalize(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, ' ');
}

export function searchFoods(q, extra = []) {
  const n = normalize(q).trim();
  const all = [...extra, ...FOODS];
  if (!n) return [];
  const words = n.split(/\s+/);
  return all
    .map(f => {
      const hay = normalize(f.name + ' ' + (f.aliases || '') + ' ' + (f.brand || ''));
      if (!words.every(w => hay.includes(w))) return null;
      const score = normalize(f.name).startsWith(words[0]) ? 0 : 1;
      return { f, score };
    })
    .filter(Boolean)
    .sort((a, b) => a.score - b.score || a.f.name.length - b.f.name.length)
    .slice(0, 30)
    .map(x => x.f);
}
