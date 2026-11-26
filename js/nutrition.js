import { db, uid } from './db.js';
import { FOOD_INDEX, macrosFor } from './data/foods.js';
import { MEALS, MEAL_INDEX } from './data/meals.js';
import { PROFILE } from './data/program.js';
import { daysBetween, mondayOf, dayPlan } from './engine.js';

export function customFoods() { return db.all('customFoods').map(f => ({ ...f, custom: true })); }
export function findFood(id) { return FOOD_INDEX[id] || db.get('customFoods', id); }

export function mealItems(meal, basketDay) {
  return meal.items.map(([id, g, opt]) => {
    const f = findFood(id);
    const grams = opt?.starch && basketDay ? g * 2 : g;
    const m = macrosFor(f, grams);
    return { foodId: id, name: f.name, grams, ...m };
  });
}
export const sum = items => items.reduce((a, i) => ({ kcal: a.kcal + (i.kcal || 0), p: a.p + (i.p || 0), c: a.c + (i.c || 0), f: a.f + (i.f || 0) }), { kcal: 0, p: 0, c: 0, f: 0 });

export function plannedMeals(k) {
  const plan = dayPlan(k);
  const n = Math.max(0, daysBetween(PROFILE.programStart, k));
  const pick = (slot, i) => { const list = MEALS.filter(m => m.slot === slot); return list[i % list.length]; };
  const out = {
    breakfast: pick('breakfast', n),
    lunch: pick('lunch', n),
    snack: (plan.session || plan.basket) ? pick('snack', n) : null,
    dinner: pick('dinner', n),
  };
  const over = db.get('mealPlan', k) || {};
  Object.entries(over).forEach(([slot, id]) => { out[slot] = id ? MEAL_INDEX[id] : null; });
  return out;
}

export function logsFor(k) { return db.all('foodlog').filter(l => l.date === k).sort((a, b) => (a.at < b.at ? -1 : 1)); }
export function totalsFor(k) { return sum(logsFor(k)); }

export function logEntry(k, slot, name, items, extra = {}) {
  const id = uid();
  const t = sum(items);
  db.put('foodlog', id, { date: k, slot, name, items, ...t, at: new Date().toISOString(), ...extra });
  rememberRecent(name, slot, items);
  return id;
}

export function logPlannedMeal(k, slot, meal) {
  const items = mealItems(meal, dayPlan(k).basketDay);
  return logEntry(k, slot, meal.name, items, { mealId: meal.id });
}

export function rememberRecent(name, slot, items) {
  const key = name.toLowerCase().slice(0, 60);
  db.put('recentMeals', key.replace(/[^a-z0-9]+/g, '-'), { name, slot, items, at: new Date().toISOString() });
}
export function recentMeals() { return db.all('recentMeals').sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 12); }
export function favorites() { return db.all('favMeals').sort((a, b) => a.name.localeCompare(b.name)); }

export function targets(k) {
  const p = dayPlan(k);
  return { kcal: p.kcal, pMin: PROFILE.proteinMin, pMax: PROFILE.proteinMax, basketDay: p.basketDay };
}

// Alerte « pote qui ne te ménage pas »
export function nutritionAlert(k, now = new Date()) {
  const t = totalsFor(k); const g = targets(k);
  const h = now.getHours();
  if (t.kcal > g.kcal * 1.15) return { level: 'danger', text: `${Math.round(t.kcal - g.kcal)} kcal au-dessus. On ferme la cuisine pour aujourd’hui.` };
  if (h >= 20 && t.kcal > 0 && t.kcal < g.kcal * 0.7) return { level: 'warn', text: `Seulement ${Math.round(t.kcal)} kcal. Trop bas : c’est comme ça que tu finis par grignoter. Mange ton repas du soir.` };
  if (h >= 20 && t.kcal > 0 && t.p < g.pMin - 25) return { level: 'warn', text: `${Math.round(t.p)} g de protéines. Il manque du lourd : skyr, séré ou œufs.` };
  return null;
}

export function fastFoodThisWeek(k) { return db.get('fastfood', mondayOf(k)); }
