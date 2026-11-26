// Phrases du jour. kind : 'bible' | 'sport' | 'art'
// Bible : traduction Louis Segond 1910 (domaine public). « (extrait) » = verset cité en partie.
// Chaque entrée : t (texte), a (auteur ou référence), ctx (contexte / source), why (lien avec ton objectif).
// À FAIRE : compléter jusqu'à 366+ avec des citations de sportifs et d'artistes vérifiées (source + année),
// et relire chaque verset mot pour mot sur un texte Segond 1910 en ligne.

export const QUOTES = [
  { kind: 'bible', t: 'Je puis tout par celui qui me fortifie.', a: 'Philippiens 4.13', ctx: 'Louis Segond 1910', why: 'Pas tout seul et pas d’un coup. Une séance après l’autre.' },
  { kind: 'bible', t: 'Ne savez-vous pas que ceux qui courent dans le stade courent tous, mais qu’un seul remporte le prix ? Courez de manière à le remporter.', a: '1 Corinthiens 9.24', ctx: 'Louis Segond 1910', why: 'Tout le monde s’entraîne. Toi, tu t’entraînes pour gagner.' },
  { kind: 'bible', t: 'Tous ceux qui combattent s’imposent toute espèce d’abstinences, et ils le font pour obtenir une couronne corruptible.', a: '1 Corinthiens 9.25', ctx: 'Louis Segond 1910 (extrait)', why: 'Dire non au grignotage, c’est le prix normal du niveau que tu veux.' },
  { kind: 'bible', t: 'Mais je traite durement mon corps et je le tiens assujetti.', a: '1 Corinthiens 9.27', ctx: 'Louis Segond 1910 (extrait)', why: 'C’est toi qui commandes ton corps, pas tes envies de 22h.' },
  { kind: 'bible', t: 'Rejetons tout fardeau, et le péché qui nous enveloppe si facilement, et courons avec persévérance dans la carrière qui nous est ouverte.', a: 'Hébreux 12.1', ctx: 'Louis Segond 1910 (extrait)', why: 'Chaque kilo en moins, c’est un fardeau de moins pendant 40 minutes.' },
  { kind: 'bible', t: 'Il est vrai que tout châtiment semble d’abord un sujet de tristesse, et non de joie ; mais il produit plus tard pour ceux qui ont été ainsi exercés un fruit paisible de justice.', a: 'Hébreux 12.11', ctx: 'Louis Segond 1910', why: 'Les nordiques font mal aujourd’hui. Les ischios en béton, c’est pour février.' },
  { kind: 'bible', t: 'Ne nous lassons pas de faire le bien ; car nous moissonnerons au temps convenable, si nous ne nous relâchons pas.', a: 'Galates 6.9', ctx: 'Louis Segond 1910', why: 'La balance ne bouge pas cette semaine ? Continue. Le résultat arrive à son heure.' },
  { kind: 'bible', t: 'Mais ceux qui se confient en l’Éternel renouvellent leur force. Ils prennent le vol comme les aigles ; ils courent, et ne se lassent point, ils marchent, et ne se fatiguent point.', a: 'Ésaïe 40.31', ctx: 'Louis Segond 1910', why: 'Courir sans se lasser : c’est littéralement ton objectif des 40 minutes.' },
  { kind: 'bible', t: 'Va vers la fourmi, paresseux ; considère ses voies, et deviens sage.', a: 'Proverbes 6.6', ctx: 'Louis Segond 1910', why: 'Le meal prep du dimanche, c’est toi en mode fourmi.' },
  { kind: 'bible', t: 'L’âme du paresseux a des désirs qu’il ne peut satisfaire ; mais l’âme des hommes diligents sera rassasiée.', a: 'Proverbes 13.4', ctx: 'Louis Segond 1910', why: 'Vouloir 65 kg ne suffit pas. Le vouloir chaque jour, si.' },
  { kind: 'bible', t: 'Tout travail procure l’abondance, mais les paroles en l’air ne mènent qu’à la disette.', a: 'Proverbes 14.23', ctx: 'Louis Segond 1910', why: 'Moins en parler, plus le faire. Coche tes cases.' },
  { kind: 'bible', t: 'Recommande à l’Éternel tes œuvres, et tes projets réussiront.', a: 'Proverbes 16.3', ctx: 'Louis Segond 1910', why: 'Fais ta part à fond, et lâche ce que tu ne contrôles pas.' },
  { kind: 'bible', t: 'Celui qui est lent à la colère vaut mieux qu’un héros, et celui qui est maître de lui-même, que celui qui prend des villes.', a: 'Proverbes 16.32', ctx: 'Louis Segond 1910', why: 'Se maîtriser devant le frigo, c’est une vraie victoire.' },
  { kind: 'bible', t: 'Comme une ville forcée et sans murailles, ainsi est l’homme qui n’est pas maître de lui-même.', a: 'Proverbes 25.28', ctx: 'Louis Segond 1910', why: 'Ton plan de repas, c’est ta muraille contre le grignotage.' },
  { kind: 'bible', t: 'Les projets de l’homme diligent ne mènent qu’à l’abondance, mais celui qui agit avec précipitation n’arrive qu’à la disette.', a: 'Proverbes 21.5', ctx: 'Louis Segond 1910', why: '0,5 à 0,7 kg par semaine. Pas plus vite. C’est comme ça qu’on garde le résultat.' },
  { kind: 'bible', t: 'Car sept fois le juste tombe, et il se relève.', a: 'Proverbes 24.16', ctx: 'Louis Segond 1910 (extrait)', why: 'Un mauvais repas ne ruine rien. Le prochain repas, tu te relèves.' },
  { kind: 'bible', t: 'Tout ce que ta main trouve à faire avec ta force, fais-le.', a: 'Ecclésiaste 9.10', ctx: 'Louis Segond 1910 (extrait)', why: 'Chaque série, à fond. Pas de série pour rien.' },
  { kind: 'bible', t: 'Tout ce que vous faites, faites-le de bon cœur, comme pour le Seigneur et non pour des hommes.', a: 'Colossiens 3.23', ctx: 'Louis Segond 1910', why: 'Personne ne te regarde faire ta mobilité à 22h. Fais-la quand même, bien.' },
  { kind: 'bible', t: 'Fortifie-toi et prends courage ? Ne t’effraie point et ne t’épouvante point, car l’Éternel, ton Dieu, est avec toi dans tout ce que tu entreprendras.', a: 'Josué 1.9', ctx: 'Louis Segond 1910 (extrait)', why: 'Sortir de ta zone de confort, c’est exactement ça.' },
  { kind: 'bible', t: 'J’ai combattu le bon combat, j’ai achevé la course, j’ai gardé la foi.', a: '2 Timothée 4.7', ctx: 'Louis Segond 1910', why: 'Finir le programme compte plus que bien le commencer.' },
  { kind: 'bible', t: 'Car ce n’est pas un esprit de timidité que Dieu nous a donné, mais un esprit de force, d’amour et de sagesse.', a: '2 Timothée 1.7', ctx: 'Louis Segond 1910', why: 'Attaque le cercle. Pas de finition timide.' },
  { kind: 'bible', t: 'Nous nous glorifions même des afflictions, sachant que l’affliction produit la persévérance, la persévérance la victoire dans l’épreuve, et cette victoire l’espérance.', a: 'Romains 5.3-4', ctx: 'Louis Segond 1910 (extrait)', why: 'Ta blessure au mollet t’a appris la patience. Maintenant elle te rend plus solide.' },
  { kind: 'bible', t: 'Ne vous conformez pas au siècle présent, mais soyez transformés par le renouvellement de l’intelligence.', a: 'Romains 12.2', ctx: 'Louis Segond 1910 (extrait)', why: 'New Me commence dans la tête avant la balance.' },
  { kind: 'bible', t: 'Si quelqu’un est en Christ, il est une nouvelle créature. Les choses anciennes sont passées ; voici, toutes choses sont devenues nouvelles.', a: '2 Corinthiens 5.17', ctx: 'Louis Segond 1910', why: 'L’ancien toi grignotait sans plan. Le nouveau a un plan.' },
  { kind: 'bible', t: 'Ne savez-vous pas que votre corps est le temple du Saint-Esprit qui est en vous ?', a: '1 Corinthiens 6.19', ctx: 'Louis Segond 1910 (extrait)', why: 'Tu nourris un temple, pas une poubelle. Choisis en conséquence.' },
  { kind: 'bible', t: 'Mes frères, regardez comme un sujet de joie complète les diverses épreuves auxquelles vous pouvez être exposés, sachant que l’épreuve de votre foi produit la patience.', a: 'Jacques 1.2-3', ctx: 'Louis Segond 1910', why: 'Le 15/15 qui brûle ? C’est l’épreuve qui fabrique ton 4e quart-temps.' },
  { kind: 'bible', t: 'Heureux l’homme qui supporte patiemment la tentation ; car, après avoir été éprouvé, il recevra la couronne de vie.', a: 'Jacques 1.12', ctx: 'Louis Segond 1910 (extrait)', why: 'Résister au deuxième fast-food de la semaine, ça compte.' },
  { kind: 'bible', t: 'Oubliant ce qui est en arrière et me portant vers ce qui est en avant, je cours vers le but.', a: 'Philippiens 3.13-14', ctx: 'Louis Segond 1910 (extrait)', why: 'Hier est passé, même s’il était raté. Regarde le prochain repas, la prochaine séance.' },
  { kind: 'bible', t: 'Il rend mes pieds semblables à ceux des biches, et il me place sur mes lieux élevés.', a: 'Psaume 18.34', ctx: 'Louis Segond 1910', why: 'Des pieds de biche : vitesse, détente, appuis. C’est tout ton programme.' },
  { kind: 'bible', t: 'L’Éternel, le Seigneur, est ma force ; il rend mes pieds semblables à ceux des biches, et il me fait marcher sur mes lieux élevés.', a: 'Habacuc 3.19', ctx: 'Louis Segond 1910 (extrait)', why: 'Le pied gauche qui décolle vers le cercle. Travaille-le aujourd’hui.' },
  { kind: 'bible', t: 'Les bontés de l’Éternel ne sont pas épuisées, ses compassions ne sont pas à leur terme ; elles se renouvellent chaque matin.', a: 'Lamentations 3.22-23', ctx: 'Louis Segond 1910', why: 'Chaque matin, le compteur repart à zéro. Profites-en.' },
  { kind: 'bible', t: 'Ne crains rien, car je suis avec toi ; ne promène pas des regards inquiets, car je suis ton Dieu ; je te fortifie, je viens à ton secours.', a: 'Ésaïe 41.10', ctx: 'Louis Segond 1910 (extrait)', why: 'Le doute avant un match, c’est normal. Joue quand même ton jeu.' },
  { kind: 'bible', t: 'Car la joie de l’Éternel sera votre force.', a: 'Néhémie 8.10', ctx: 'Louis Segond 1910 (extrait)', why: 'Prends du plaisir à progresser, c’est ce qui fait tenir sur la durée.' },
  { kind: 'bible', t: 'Le fruit de l’Esprit, c’est l’amour, la joie, la paix, la patience, la bonté, la bénignité, la fidélité, la douceur, la tempérance.', a: 'Galates 5.22', ctx: 'Louis Segond 1910 (extrait, v. 22-23)', why: 'Patience et tempérance : les deux muscles qu’on travaille avec la nourriture.' },
  { kind: 'bible', t: 'Entrez par la porte étroite. Car large est la porte, spacieux est le chemin qui mènent à la perdition, et il y en a beaucoup qui entrent par là.', a: 'Matthieu 7.13', ctx: 'Louis Segond 1910', why: 'Le chemin facile, tout le monde le prend. Prends l’autre.' },
  { kind: 'bible', t: 'Celui qui est fidèle dans les moindres choses l’est aussi dans les grandes.', a: 'Luc 16.10', ctx: 'Louis Segond 1910 (extrait)', why: '10 minutes de mobilité chaque soir, c’est là que se joue ta souplesse.' },
  { kind: 'bible', t: 'Que tes yeux regardent en face, et que tes paupières se dirigent devant toi. Considère le chemin par où tu passes, et que toutes tes voies soient bien réglées.', a: 'Proverbes 4.25-26', ctx: 'Louis Segond 1910', why: 'Ton planning est réglé. Ton seul job : le suivre.' },
  { kind: 'bible', t: 'Dieu, qui est fidèle, ne permettra pas que vous soyez tentés au delà de vos forces.', a: '1 Corinthiens 10.13', ctx: 'Louis Segond 1910 (extrait)', why: 'L’envie de grignoter est plus faible que toi. Prends ta collation prévue.' },
  { kind: 'bible', t: 'Car vous avez besoin de persévérance, afin qu’après avoir accompli la volonté de Dieu, vous obteniez ce qui vous est promis.', a: 'Hébreux 10.36', ctx: 'Louis Segond 1910', why: 'Fin février, c’est loin. La persévérance, c’est ce qui t’y emmène.' },
  { kind: 'bible', t: 'Le soir arrivent les pleurs, et le matin l’allégresse.', a: 'Psaume 30.6', ctx: 'Louis Segond 1910 (extrait)', why: 'Défaite hier soir ? Nouvelle journée ce matin. On repart.' },
  { kind: 'bible', t: 'Mieux vaut la fin d’une chose que son commencement ; mieux vaut un esprit patient qu’un esprit hautain.', a: 'Ecclésiaste 7.8', ctx: 'Louis Segond 1910', why: 'Commencer un régime, tout le monde sait faire. Le finir, c’est rare.' },
  { kind: 'bible', t: 'La main des diligents dominera, mais la main lâche sera tributaire.', a: 'Proverbes 12.24', ctx: 'Louis Segond 1910', why: 'En défense aussi : celui qui bosse domine son joueur.' },
  { kind: 'bible', t: 'Faites tous vos efforts pour joindre à votre foi la vertu, à la vertu la science, à la science la tempérance, à la tempérance la patience.', a: '2 Pierre 1.5-6', ctx: 'Louis Segond 1910 (extrait)', why: 'La foi, puis le travail, puis le savoir, puis la patience. Dans cet ordre.' },
  { kind: 'bible', t: 'Car si je suis tombée, je me relèverai.', a: 'Michée 7.8', ctx: 'Louis Segond 1910 (extrait)', why: 'Tomber au cercle, c’est le métier. Se relever et y retourner, c’est le caractère.' },
  { kind: 'bible', t: 'En vain vous levez-vous matin, vous couchez-vous tard, et mangez-vous le pain de douleur ; il en donne autant à ses bien-aimés pendant leur sommeil.', a: 'Psaume 127.2', ctx: 'Louis Segond 1910', why: 'Le sommeil fait partie du programme. Au lit avant 22h30.' },
  { kind: 'bible', t: 'Je me couche et je m’endors en paix, car toi seul, ô Éternel ! tu me donnes la sécurité dans ma demeure.', a: 'Psaume 4.9', ctx: 'Louis Segond 1910', why: 'Pas d’ordi dans le lit. Le lit, c’est pour dormir.' },
];

// Ordre stable sur l'année : mélange déterministe, puis une phrase par jour.
function seeded(seed) { return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }
export function quoteOrder(year) {
  const idx = QUOTES.map((_, i) => i);
  const rnd = seeded(year * 7919);
  for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  return idx;
}
export function quoteIndexFor(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const doy = Math.round((new Date(y, m - 1, d) - new Date(y, 0, 1)) / 86400000);
  const order = quoteOrder(y);
  return order[doy % order.length];
}
