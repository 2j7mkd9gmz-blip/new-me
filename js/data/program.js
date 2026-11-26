// Programme de préparation physique — meneur 1m65, 3e division suisse.
// type : 'explosive' (qualité max, récup complète, pas de progression de charge)
//        'strength'  (double progression)
//        'hold'      (durée en secondes)
//        'carry'     (distance, charge lourde)
//        'cardio'    (intervalles)
// gate : phase minimale de reprise du mollet (1..4, 4 = validé par le physio)

export const PROFILE = {
  heightCm: 165,
  age: 23,
  startWeight: 73,
  startDate: '2026-11-16',
  goalWeight: 65,
  goalDate: '2027-02-28',
  milestone: { date: '2027-01-01', weight: 68.5 },
  programStart: '2026-11-23', // lundi, semaine 1 du cycle 1
  calfRehabStart: '2026-11-19',
  kcalRest: 2000,
  kcalBasket: 2200,
  proteinMin: 130,
  proteinMax: 140,
  stepsGoal: 8000,
  sleepMinHours: 7,
};

export const EXERCISES = {
  // ---- Séance A ----
  mb_back_throw: {
    name: 'Lancer médecine-ball arrière', type: 'explosive', sets: 4, reps: [3, 3], rest: 120,
    tech: 'Ballon entre les jambes, demi-squat, puis extension violente hanches-genoux-chevilles et lancer par-dessus la tête vers l’arrière. Bras tendus, tout vient des hanches.',
    why: 'Même triple extension qu’un saut, sans impact sur le mollet. Construit la détente pendant la reprise.',
  },
  box_jump: {
    name: 'Box jump deux pieds', type: 'explosive', sets: 3, reps: [4, 4], rest: 120, gate: 4,
    tech: 'Contre-mouvement rapide, bras qui lancent, réception silencieuse genoux fléchis sur la box. Tu redescends en marchant, jamais en sautant.',
    why: 'Puissance verticale pure pour les rebonds et les contres. La réception douce protège tes tendons.',
  },
  jump_left: {
    name: 'Saut vertical appel gauche', type: 'explosive', sets: 3, reps: [3, 3], rest: 120, gate: 4,
    tech: '2-3 pas d’élan, dernier appui pied gauche, genou droit qui monte, bras qui tirent vers le haut. Touche une cible le plus haut possible.',
    why: 'C’est exactement ton geste de lay-up. On muscle la détente sur ton vrai pied d’appel.',
  },
  jump_right: {
    name: 'Saut vertical appel droit', type: 'explosive', sets: 2, reps: [3, 3], rest: 120, gate: 4,
    tech: 'Même chose, appel pied droit. Cherche la même hauteur que du gauche.',
    why: 'Finir des deux côtés rend tes drives imprévisibles. Le défenseur ne peut plus fermer un seul côté.',
  },
  trap_deadlift: {
    name: 'Soulevé de terre trap bar', type: 'strength', sets: 4, reps: [4, 6], rest: 150, increment: 2.5,
    tech: 'Pieds largeur de hanches, dos neutre, poitrine fière. Pousse le sol, montée explosive, descente contrôlée en 2 s. Pas de rebond au sol.',
    why: 'La base de ta force relative : plus de force par kilo, c’est un premier pas plus rapide et plus de détente.',
  },
  bulgarian: {
    name: 'Fente bulgare haltères', type: 'strength', sets: 3, reps: [6, 8], rest: 90, increment: 2, perSide: true,
    tech: 'Pied arrière sur le banc, buste légèrement penché. Descente en 3 s jusqu’à ce que le genou arrière frôle le sol, puis pousse fort dans le talon avant.',
    why: 'Force sur une jambe : tu finis au cercle sur un pied, au contact. Corrige aussi les déséquilibres gauche-droite.',
  },
  nordic: {
    name: 'Ischios nordiques', type: 'strength', sets: 3, reps: [4, 6], rest: 120, bodyweight: true, alt: 'Slider leg curl 3 × 8 si trop dur',
    tech: 'Genoux sur un tapis, pieds bloqués. Descends le plus lentement possible en gardant hanches et buste alignés. Rattrape-toi avec les mains, remonte en poussant.',
    why: 'Les ischios freinent chaque sprint et changement de direction. C’est l’exercice n°1 pour prévenir les blessures.',
  },
  pullup: {
    name: 'Tractions', type: 'strength', sets: 4, reps: [5, 8], rest: 120, increment: 2.5, bodyweight: true,
    tech: 'Prise pronation, départ bras tendus, épaules basses. Monte le menton au-dessus de la barre sans balancer. Lest dès que tu fais plus de 8 propres.',
    why: 'Dos fort = épaules solides au contact et meilleure posture en défense.',
  },
  copenhagen: {
    name: 'Planche Copenhague', type: 'hold', sets: 3, reps: [15, 25], rest: 60, perSide: true, unit: 's',
    tech: 'Sur le côté, avant-bras au sol, jambe du dessus posée sur un banc (genou pour débuter). Soulève les hanches, corps aligné. Tiens.',
    why: 'Les adducteurs tiennent ta position basse en défense et tes glissés latéraux. Protège aussi l’aine.',
  },
  calf_seated: {
    name: 'Mollets assis lourds (soléaire)', type: 'strength', sets: 3, reps: [10, 12], rest: 75, increment: 2.5,
    tech: 'Assis, genoux à 90°, charge sur les cuisses. Amplitude complète, 1 s en haut, descente lente.',
    why: 'Le soléaire encaisse jusqu’à 8 fois ton poids en course. C’est la clé pour que ta déchirure ne revienne jamais.',
  },
  calf_single: {
    name: 'Mollet debout une jambe', type: 'strength', sets: 3, reps: [8, 10], rest: 60, increment: 2, perSide: true,
    tech: 'Sur une marche, une jambe. Monte haut, descends en 3 s, 1 s de pause en bas, étirement complet. Haltère dans la main du même côté quand c’est trop facile.',
    why: 'Renforce le tendon d’Achille en excentrique : ressort plus raide, saut plus réactif, mollet blindé.',
  },
  tibialis: {
    name: 'Relevés de pointes dos au mur', type: 'strength', sets: 2, reps: [15, 15], rest: 45, bodyweight: true,
    tech: 'Dos au mur, talons à 30 cm du mur. Relève les pointes de pied au maximum, redescends lentement.',
    why: 'Le tibial antérieur équilibre le mollet et protège les tibias et chevilles sur les freinages.',
  },
  pallof: {
    name: 'Pallof press', type: 'strength', sets: 3, reps: [10, 10], rest: 60, increment: 1, perSide: true,
    tech: 'De côté à la poulie ou à l’élastique, mains au sternum. Pousse les bras devant toi sans laisser le buste tourner. 2 s bras tendus.',
    why: 'Gainage anti-rotation : tu restes droit quand on te touche en l’air pendant la finition.',
  },
  bike_finisher: {
    name: 'Finisher vélo 30/60', type: 'cardio', sets: 6, reps: [30, 30], rest: 60, unit: 's',
    tech: '30 s à fond, 60 s tranquille. Résistance assez haute pour ne pas mouliner dans le vide.',
    why: 'Répéter les efforts intenses sans impact : c’est ton moteur pour tenir 40 minutes.',
  },

  // ---- Séance B ----
  mb_rot_throw: {
    name: 'Lancer médecine-ball rotation', type: 'explosive', sets: 3, reps: [5, 5], rest: 90, perSide: true,
    tech: 'De profil au mur, ballon à la hanche. Le mouvement part des pieds et des hanches, puis le buste, puis les bras. Lance fort, rattrape, recommence.',
    why: 'Transfère la force du sol vers les mains : passes plus rapides, épaules plus puissantes sur le drive.',
  },
  landmine_press: {
    name: 'Développé landmine un bras en fente', type: 'strength', sets: 4, reps: [6, 6], rest: 90, increment: 2.5, perSide: true,
    tech: 'En fente, genou arrière au sol du côté du bras qui pousse. Pousse la barre en avant et vers le haut, buste gainé, pas de cambrure.',
    why: 'Pousser en déséquilibre, comme repousser un défenseur avec le bras libre en finition.',
  },
  pullup_neutral: {
    name: 'Tractions prise neutre / tirage vertical', type: 'strength', sets: 3, reps: [6, 8], rest: 90, increment: 2.5,
    tech: 'Prise neutre, poitrine vers la barre, coudes qui descendent vers les hanches. Au tirage : pas d’élan avec le buste.',
    why: 'Volume de dos sans fatiguer les jambes pour le basket du soir.',
  },
  row_1arm: {
    name: 'Rowing un bras avec appui', type: 'strength', sets: 3, reps: [8, 8], rest: 75, increment: 2, perSide: true,
    tech: 'Main et genou sur le banc, dos plat. Tire l’haltère vers la hanche, pas vers l’épaule. 1 s de pause en haut.',
    why: 'Équilibre les épaules face aux tirs et aux passes. Moins de douleurs, plus de contrôle.',
  },
  incline_db: {
    name: 'Développé incliné haltères', type: 'strength', sets: 3, reps: [8, 8], rest: 90, increment: 2,
    tech: 'Banc à 30°, omoplates serrées. Descends les haltères au niveau de la poitrine en 2 s, pousse en rapprochant légèrement.',
    why: 'Force de poussée utile au contact et pour protéger le ballon.',
  },
  suitcase: {
    name: 'Marche du fermier un côté', type: 'carry', sets: 3, reps: [20, 20], rest: 60, increment: 2, perSide: true, unit: 'm',
    tech: 'Un haltère lourd d’un seul côté. Marche droit, épaules à niveau, sans pencher. Le côté vide travaille.',
    why: 'Gainage latéral : tu encaisses le contact en finition et tu restes équilibré pour finir.',
  },
  dead_bug: {
    name: 'Dead bug élastique / roue', type: 'strength', sets: 3, reps: [8, 8], rest: 60, bodyweight: true,
    tech: 'Dos plaqué au sol, bras tendus qui tirent l’élastique. Allonge un bras et la jambe opposée sans décoller le bas du dos. Expire à fond.',
    why: 'Gainage du centre : transmission de force propre du sol au ballon.',
  },
  face_pull: {
    name: 'Face pull', type: 'strength', sets: 2, reps: [15, 15], rest: 45, increment: 1,
    tech: 'Corde à hauteur des yeux, tire vers le front en écartant les mains, coudes hauts. Pause 1 s.',
    why: 'Santé des épaules : compense des heures de tirs et de dribbles.',
  },

  // ---- Séance C ----
  sprint_drills: {
    name: 'Gammes de sprint', type: 'explosive', sets: 3, reps: [30, 30], rest: 60, gate: 4, unit: 'm',
    tech: 'A-skips, B-skips, puis 3 accélérations progressives sur 30 m (60 → 90 %). Pied actif sous la hanche.',
    why: 'Apprend au corps une foulée efficace avant de pousser à fond.',
  },
  accel_10: {
    name: 'Accélérations 10 m départ arrêté', type: 'explosive', sets: 6, reps: [1, 1], rest: 90, gate: 4,
    tech: 'Position de triple menace, premier pas croisé ou direct comme en drive. Buste penché, bras puissants. Marche pour revenir, récup complète.',
    why: 'Ton premier pas, c’est ton arme principale pour le drive and kick.',
  },
  def_shuffle: {
    name: 'Shuffle défensif 5-5-5', type: 'explosive', sets: 6, reps: [1, 1], rest: 45, gate: 4,
    tech: 'Position basse, pieds larges, jamais croisés. 5 m d’un côté, retour, 5 m, changement de direction en poussant sur le pied extérieur.',
    why: 'Défense = ton point faible. Tu apprends à rester devant ton joueur sans te relever.',
  },
  rsa_1515: {
    name: 'Intermittent 15/15', type: 'cardio', sets: 2, reps: [6, 8], rest: 180, gate: 4, unit: 'min',
    tech: '15 s de course rapide, 15 s de récup marchée ou trottinée. Commence 2 blocs de 6 min, monte jusqu’à 3 blocs de 8 min. 3 min entre les blocs.',
    why: 'Capacité à répéter les sprints : c’est ce qui fait la différence dans le 4e quart-temps.',
  },
  cooldown: {
    name: 'Retour au calme', type: 'hold', sets: 1, reps: [5, 5], rest: 0, unit: 'min',
    tech: '5 min de marche, puis la routine de mobilité.',
    why: 'Fait redescendre le système nerveux et accélère la récupération pour le match suivant.',
  },
};

export const WARMUP = [
  { id: 'w1', name: 'Vélo ou rameur', dose: '3 min', tech: 'Allure facile, on monte la température.' },
  { id: 'w2', name: '90/90 des hanches', dose: '5 par côté', tech: 'Assis, les deux genoux à 90°. Bascule d’un côté à l’autre sans les mains.' },
  { id: 'w3', name: 'Couch stretch', dose: '45 s par côté', tech: 'Genou contre le mur, pied en l’air. Serre les fessiers, buste droit.' },
  { id: 'w4', name: 'Cheville genou-au-mur', dose: '10 par côté', tech: 'Pied à 10 cm du mur, amène le genou au mur sans décoller le talon.' },
  { id: 'w5', name: 'Marche latérale élastique', dose: '2 × 10 pas', tech: 'Élastique aux genoux ou chevilles, position basse, pieds jamais collés.' },
  { id: 'w6', name: 'Pont fessier', dose: '2 × 10', tech: 'Pousse dans les talons, serre en haut 1 s.' },
  { id: 'w7', name: 'Gammes : genoux, talons-fesses', dose: '2 × 15 m', tech: 'Pied actif, bras coordonnés.' },
  { id: 'w8', name: 'Pogos', dose: '2 × 15', tech: 'Petits sauts sur place, genoux quasi tendus, contact sol ultra court.', gate: 2 },
];

export const MOBILITY = [
  { id: 'm1', name: 'Couch stretch', dose: '2 × 45 s par côté', secs: 45, reps: 4, tech: 'Genou au mur, fessiers serrés. Ouvre l’avant de la hanche.' },
  { id: 'm2', name: '90/90 avec rotations', dose: '2 × 6 par côté', tech: 'Alterne les côtés, buste grand. Essaie sans les mains.' },
  { id: 'm3', name: 'Cheville genou-au-mur élastique', dose: '2 × 10 par côté', tech: 'Élastique qui tire la cheville vers l’arrière, genou vers le mur.' },
  { id: 'm4', name: 'Ischios couché élastique', dose: '2 × 45 s par jambe', secs: 45, reps: 4, tech: 'Jambe tendue en l’air, l’autre au sol. Respire et laisse descendre.' },
  { id: 'm5', name: 'Squat profond assisté', dose: '2 × 45 s', secs: 45, reps: 2, tech: 'Tiens un cadre de porte, descends au fond, talons au sol, poitrine haute.' },
];

export const SESSIONS = {
  A: {
    id: 'A', name: 'Séance A', subtitle: 'Force et puissance bas du corps + dos', duration: 65, legs: true,
    blocks: [
      { label: 'Puissance', choose: { locked: ['mb_back_throw'], unlocked: ['box_jump', 'jump_left', 'jump_right'] } },
      { label: 'Force', items: ['trap_deadlift', 'bulgarian', 'nordic', 'pullup'] },
      { label: 'Défense et mollets', items: ['copenhagen', 'calf_seated', 'calf_single', 'tibialis'] },
      { label: 'Gainage et moteur', items: ['pallof', 'bike_finisher'] },
    ],
    after: 'Sauna après la séance. Bois 500 ml d’eau en sortant.',
  },
  A_light: {
    id: 'A_light', name: 'Séance A allégée', subtitle: 'Dos + mollets, jambes épargnées', duration: 40, legs: false,
    blocks: [
      { label: 'Haut du corps', items: ['pullup', 'pallof'] },
      { label: 'Mollets (léger)', items: ['calf_seated', 'tibialis'] },
    ],
    after: 'Basket ou match demain : on ne touche pas aux jambes.',
  },
  B: {
    id: 'B', name: 'Séance B', subtitle: 'Haut du corps + stabilité', duration: 50, legs: false,
    blocks: [
      { label: 'Puissance', items: ['mb_rot_throw'] },
      { label: 'Force', items: ['landmine_press', 'pullup_neutral', 'row_1arm', 'incline_db'] },
      { label: 'Stabilité', items: ['suitcase', 'dead_bug', 'face_pull'] },
      { label: 'Mollets', items: ['calf_single'] },
    ],
    after: 'Basket ce soir : mange ta collation 1h30 avant.',
  },
  C: {
    id: 'C', name: 'Séance C', subtitle: 'Terrain ou piste', duration: 50, legs: true, gate: 4,
    blocks: [
      { label: 'Vitesse', items: ['sprint_drills', 'accel_10'] },
      { label: 'Défense', items: ['def_shuffle'] },
      { label: 'Tenir 40 minutes', items: ['rsa_1515'] },
      { label: 'Fin', items: ['calf_single', 'cooldown'] },
    ],
    after: 'Routine de mobilité complète en rentrant.',
  },
};

export const CALF_PHASES = [
  { n: 1, name: 'Semaine 1 de reprise', rules: 'Muscu normale, vélo ou footing léger 20-30 min. Basket : shoot et technique seulement. Pas de sprint, pas de gros saut, pas de match.' },
  { n: 2, name: 'Semaine 2 de reprise', rules: 'Accélérations progressives, petits sauts, entraînements sans contact. Pas de match.' },
  { n: 3, name: 'Semaine 3 de reprise', rules: 'Entraînement complet. Match seulement si zéro douleur la semaine d’avant.' },
  { n: 4, name: 'Validé par le physio', rules: 'Tout est débloqué. Échauffement 10-15 min avant chaque basket et mollets à chaque séance, pour toujours.' },
];

export const FINISHING_DRILLS = 'Avant ou après l’entraînement, 10 min de finitions : Mikan drill, lay-ups pied gauche et pied droit, finitions avec contact (un coéquipier pousse avec un pad), reverse lay-ups.';
