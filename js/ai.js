// Fonctions IA (API Claude). La clé est saisie dans les réglages, stockée seulement sur ce téléphone.
// SDK officiel Anthropic chargé à la demande (nécessite du réseau, comme toutes les fonctions IA).
import { db, local } from './db.js';
import { EXERCISES, PROFILE, SESSIONS } from './data/program.js';
import { sessionLogs, weeklyAverages, calfState, addDays } from './engine.js';

const MODEL = 'claude-opus-5-5';
const SDK_URL = 'https://esm.sh/@anthropic-ai/sdk@1.7.0';

export const hasApiKey = () => !!local.get('claudeKey');

let clientPromise = null;
async function client() {
  const apiKey = local.get('claudeKey');
  if (!apiKey) throw new Error('Ajoute ta clé API Claude dans les réglages.');
  if (!navigator.onLine) throw new Error('Pas de réseau. L’IA a besoin d’internet.');
  if (!clientPromise || clientPromise.key !== apiKey) {
    const p = import(SDK_URL).then(m => new m.default({ apiKey, dangerouslyAllowBrowser: true }));
    p.key = apiKey;
    clientPromise = p;
  }
  return clientPromise;
}

async function ask({ system, user, maxTokens = 16000, effort = 'medium', schema = null }) {
  const c = await client();
  const output_config = { effort };
  if (schema) output_config.format = { type: 'json_schema', schema };
  let res;
  try {
    res = await c.beta.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config,
      system,
      messages: [{ role: 'user', content: user }],
    });
  } catch (e) {
    const s = e?.status;
    if (s === 401) throw new Error('Clé API refusée. Vérifie-la dans les réglages.');
    if (s === 429) throw new Error('Trop de requêtes. Réessaie dans une minute.');
    if (s === 400 && /credit|billing/i.test(e.message)) throw new Error('Crédit API épuisé sur ton compte Anthropic.');
    if (s >= 500) throw new Error('Le service Claude est indisponible. Réessaie plus tard.');
    throw new Error(e?.message || 'Erreur réseau');
  }
  if (res.stop_reason === 'refusal') throw new Error('Claude n’a pas pu répondre à cette demande.');
  if (res.stop_reason === 'max_tokens') throw new Error('Réponse coupée, réessaie.');
  const text = res.content.filter(b => b.type === 'text').map(b => b.text).join('');
  return schema ? JSON.parse(text) : text;
}

// ---------------------------------------------------------------- estimation d’un repas
const MEAL_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['items', 'comment'],
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['name', 'grams', 'kcal', 'p', 'c', 'f'],
        properties: {
          name: { type: 'string' }, grams: { type: 'number' },
          kcal: { type: 'number' }, p: { type: 'number' }, c: { type: 'number' }, f: { type: 'number' },
        },
      },
    },
    comment: { type: 'string' },
  },
};

export async function estimateMeal(sentence) {
  return ask({
    system: `Tu es nutritionniste du sport en Suisse romande. On te décrit un repas en une phrase.
Découpe-le en aliments avec une quantité réaliste en grammes (portions suisses standard en restaurant ou fast-food si non précisé),
puis donne pour chaque aliment kcal, protéines (p), glucides (c) et lipides (f) en grammes, pour la quantité indiquée.
Base-toi sur des valeurs de référence (base suisse des valeurs nutritives, CIQUAL). Boissons zéro = 0 kcal.
Dans "comment", une phrase courte en français, ton direct de pote coach : ce qu'il faut retenir pour un objectif de perte de poids à 130-140 g de protéines par jour.`,
    user: sentence,
    effort: 'low',
    maxTokens: 4000,
    schema: MEAL_SCHEMA,
  });
}

// ---------------------------------------------------------------- bilan de cycle
function cycleDigest(cyc) {
  const inCycle = sessionLogs().filter(w => w.date >= cyc.cycleStart && w.date <= cyc.cycleEnd);
  const sessions = inCycle.map(w => ({
    date: w.date, seance: SESSIONS[w.session]?.name, sensations_1a5: w.feel, douleur_mollet: w.calfPain, note: w.note || undefined,
    exercices: Object.entries(w.exercises || {}).map(([id, e]) => ({
      nom: EXERCISES[id]?.name || id,
      series: (e.sets || []).filter(s => s.done).map(s => ({ kg: s.kg || null, reps: s.reps || null, rpe: s.rpe || null })),
    })).filter(e => e.series.length),
  }));
  const calf = calfState();
  const weights = weeklyAverages().filter(w => w.monday >= addDays(cyc.cycleStart, -7)).map(w => ({ semaine: w.monday, moyenne_kg: +w.avg.toFixed(1) }));
  const matches = db.all('matches').filter(m => m.date >= cyc.cycleStart && m.date <= cyc.cycleEnd).map(m => m.date);
  return { cycle: cyc.cycle, du: cyc.cycleStart, au: cyc.cycleEnd, seances: sessions, mollet: { phase: calf.phase, notes: calf.logs.slice(0, 15) }, poids: weights, matchs: matches };
}

export async function analyzeCycle(cyc) {
  const program = Object.values(SESSIONS).map(s => ({
    seance: s.name, objectif: s.subtitle,
    exercices: s.blocks.flatMap(b => b.items || [...(b.choose?.unlocked || []), ...(b.choose?.locked || [])]).map(id => `${EXERCISES[id].name} ${EXERCISES[id].sets}×${EXERCISES[id].reps.join('-')}`),
  }));
  return ask({
    system: `Tu es préparateur physique professionnel de basket (pas un coach de salle). Ton athlète : homme, ${PROFILE.age} ans, ${PROFILE.heightCm} cm, meneur playmaker-shooteur en 3e division suisse, pied d'appel gauche, en pleine saison (match chaque week-end, parfois en semaine).
Objectifs : perdre du poids (${PROFILE.startWeight} → ${PROFILE.goalWeight} kg d'ici fin février), vitesse, détente, endurance pour tenir 40 minutes, finir au cercle (force unilatérale, saut pied gauche, gainage au contact), défense (latéral, adducteurs, position basse), mobilité hanches-chevilles-ischios.
Antécédent : déchirure au mollet en fin de rééducation. Mollets et tendons d'Achille renforcés à chaque séance, jamais de jambes la veille d'un basket, jamais courbaturé à un match, pas de 3e séance de muscu en semaine.
Règles d'intensité : RPE 7-8, double progression, cycles de 4 semaines (3 de progression + 1 allégée). Exos explosifs en qualité maximale, récup complète.
Matériel : salle de fitness complète, élastiques, piste d'athlétisme.

Analyse le cycle qui se termine à partir des données réelles, puis propose le cycle suivant.
Réponds en français, ton direct de pote qui ne le ménage pas, sans markdown lourd (pas de tableaux, titres simples en majuscules suivis d'un retour à la ligne, listes avec des tirets).
Structure :
CE QUE JE VOIS : 4-6 constats chiffrés (progression des charges, RPE, régularité, mollet, poids).
CE QUI CHANGE : pour le cycle suivant, séance par séance (A, B, C), les exercices gardés, remplacés ou modifiés avec séries × reps et la raison liée à son jeu. Aucun exercice générique de salle : chaque choix doit servir le basket.
CHARGES DE DÉPART : les charges conseillées pour la semaine 1 du cycle suivant.
LE POINT FAIBLE À ATTAQUER : un seul, et comment.
Si les données sont trop maigres, dis-le franchement et propose quand même un cycle prudent.`,
    user: `Programme actuel :\n${JSON.stringify(program)}\n\nDonnées du cycle :\n${JSON.stringify(cycleDigest(cyc))}`,
    effort: 'high',
    maxTokens: 16000,
  });
}
