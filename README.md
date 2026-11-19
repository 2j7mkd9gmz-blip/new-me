# New Me

Mon app de suivi : perte de poids (73 → 65 kg), muscu, basket, bouffe, sommeil, pas et reprise du mollet.
PWA en français, installable sur iPhone, qui marche hors ligne. Les données restent sur le téléphone.

## Mettre l'app en ligne avec GitHub Pages (une seule fois, ≈ 5 min)

1. Crée un compte sur https://github.com si tu n'en as pas.
2. En haut à droite, **+ → New repository**. Nom : `new-me`. Laisse **Public** coché (GitHub Pages gratuit l'exige), puis **Create repository**.
3. Sur la page du dépôt vide, clique **uploading an existing file**.
4. Ouvre le dossier `new-me` dans le Finder, sélectionne **tout son contenu** (`Cmd + A`) et glisse-le dans la page. Il faut que `index.html` soit à la racine, pas dans un sous-dossier.
   - Le fichier caché `.nojekyll` : dans le Finder, `Cmd + Maj + .` pour l'afficher et l'inclure.
5. Clique **Commit changes**.
6. Va dans **Settings → Pages**. Sous *Build and deployment* : Source = **Deploy from a branch**, Branch = **main**, dossier **/ (root)**, puis **Save**.
7. Attends 1-2 minutes. L'adresse s'affiche en haut de la page : `https://TON-PSEUDO.github.io/new-me/`.

Le dépôt est public : le code se voit, **mais pas tes données** (poids, séances…), qui restent uniquement sur ton iPhone.

## L'installer sur l'iPhone

1. Ouvre l'adresse dans **Safari** (pas Chrome).
2. Bouton **Partager** → **Sur l'écran d'accueil** → **Ajouter**.
3. Lance l'app depuis l'icône. Elle marche ensuite hors ligne.

## Activer les rappels (vraies notifications)

Dans l'app : **Plus → Rappels → Ajouter les rappels au Calendrier**. L'app Calendrier s'ouvre :
touche **S'abonner**, puis **désactive « Supprimer les alarmes »** (sinon rien ne sonne) et touche **OK**.

- `rappels.ics` : coucher (dim-mer), marche après le midi, meal prep (dim + mer), pesée (lun, mer, ven)
- `rappels-ordi.ics` : « lève-toi » toutes les 45 min, lun-mer de 8h30 à 17h (optionnel)

Pour les enlever : Calendrier → Calendriers → « New Me » → ⓘ → Se désabonner.

## Mettre à jour l'app

1. Remplace les fichiers modifiés dans le dépôt GitHub (**Add file → Upload files**).
2. Dans `sw.js`, change `VERSION` (par ex. `newme-v2`) pour que l'iPhone recharge tout.
3. Ouvre l'app une ou deux fois : la nouvelle version s'affiche. Tes données sont conservées.

## Sauvegarde

**Plus → Sauvegarde & réglages → Exporter** crée un fichier `.json` (à mettre dans Fichiers / iCloud).
Si tu changes de téléphone : **Importer une sauvegarde**.

## Structure

```
index.html            page unique + barre d'onglets
style.css             thème sombre, mobile d'abord
manifest.webmanifest  nom, icône, mode plein écran
sw.js                 cache hors ligne
js/data.js            ton programme (repas, séances, planning, reprise mollet, courbe cible)
js/store.js           sauvegarde locale (localStorage)
js/app.js             les écrans et les actions
js/util.js            dates et formatage
rappels*.ics          rappels pour le Calendrier iPhone
icons/                icônes de l'app
```

Pour changer le programme (repas, exercices, horaires), tout est dans `js/data.js`.

## Tester sur le Mac

```bash
cd new-me && python3 -m http.server 8000
```
Puis http://localhost:8000.
