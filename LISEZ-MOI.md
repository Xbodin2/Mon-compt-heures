# Mon compt'heures

Application web installable (PWA) pour suivre vos heures de travail cumulées, mois par mois.

## Installer l'application sur votre téléphone Android

Une PWA doit être servie via une **adresse http(s)** pour pouvoir s'installer proprement sur l'écran d'accueil (le simple double-clic sur `index.html` fonctionne pour un usage ponctuel, mais Android refuse l'installation et le mode hors-ligne depuis un fichier local). Trois façons simples d'obtenir cette adresse, de la plus simple à la plus technique :

**Option A — GitHub Pages (gratuit, recommandé)**
1. Créez un compte GitHub si besoin, puis un nouveau dépôt (public).
2. Déposez-y tous les fichiers de ce dossier (`index.html`, `style.css`, `app.js`, `manifest.json`, `sw.js`, `icons/`).
3. Dans les paramètres du dépôt → *Pages*, activez GitHub Pages sur la branche principale.
4. Ouvrez l'adresse fournie (`https://votre-compte.github.io/votre-depot/`) avec Chrome sur votre téléphone.
5. Menu Chrome (⋮) → **Installer l'application** (ou « Ajouter à l'écran d'accueil »).

Si le menu installer l'application n'apparaît plus dans Chrome :

La raison peut être la désynchronisation du lanceur Android (Launcher).
Après une mise à jour d'Android ou de Chrome, le navigateur peut perdre le lien avec l'application d'accueil du téléphone. Pour corriger ce problème :
Ouvrez les Paramètres de votre téléphone.  
Allez dans Applications > Applications par défaut > Application d'accueil (ou Ecran d'accueil / Launcher).  
Sélectionnez à nouveau votre lanceur actuel (ex. One UI, Pixel Launcher, Nova Launcher) pour forcer la réinitialisation du lien.
Redémarrez Chrome.




**Option B — Netlify Drop**
1. Allez sur `app.netlify.com/drop` depuis un ordinateur.
2. Glissez-déposez le dossier entier de l'application.
3. Ouvrez l'adresse générée sur votre téléphone, puis installez comme ci-dessus.

**Option C — Réseau local (sans compte, temporaire)**
1. Sur votre ordinateur, dans le dossier de l'appli : `python3 -m http.server 8000`
2. Sur votre téléphone connecté au même Wi-Fi, ouvrez `http://ADRESSE-IP-DE-VOTRE-PC:8000`.
3. Installez comme ci-dessus. Cette adresse cesse de fonctionner dès que le serveur ou le PC s'éteint — pratique pour tester, pas pour un usage durable.

Une fois installée, l'icône « Mon compt'heures » apparaît sur l'écran d'accueil et l'application s'ouvre en plein écran, sans barre d'adresse, et fonctionne hors-ligne après le premier chargement.

## Utilisation

- **En-tête** : flèches ‹ › pour changer de mois, liste déroulante pour le mois, champ numérique (clavier du téléphone) pour l'année. Le compteur à digits affiche le total d'heures cumulées du mois affiché, mis à jour en temps réel.
- **Liste des jours** : les 7 jours du mois sont affichés, avec le nom du jour, son numéro, une case pour le nombre d'heures et une case pour un commentaire libre. Les dimanches et le jour courant sont mis en évidence.
- **Réglages** (icône ⚙ en haut à droite) :
  - Apparence : clair / sombre / automatique (suit le réglage du téléphone), et couleur d'accent (laiton, bleu marine, vert bouteille, bordeaux).
  - Saisie des heures : décimal (`7,5`) ou heures:minutes (`7h30`) — la case de saisie reste unique, seul le format d'affichage change.
  - Sauvegarde : export du mois affiché ou de toutes les données en CSV, import d'un fichier CSV.
  - Réinitialisation complète des données.

## Sauvegarde des données (CSV)

- Colonnes : `Date;Heures;Commentaire` (séparateur `;`, décimales avec une virgule — compatible Excel en français).
- « Exporter toutes les données » regroupe tous les mois déjà saisis dans un seul fichier ; « Exporter le mois affiché » n'exporte que le mois en cours de consultation.
- L'import **fusionne** : les jours présents dans le fichier remplacent les jours identiques déjà enregistrés, les autres jours/mois ne sont pas touchés. Vous pouvez donc importer un fichier d'un seul mois ou un fichier complet, peu importe.

## Où sont stockées les données ?

Tout est stocké **localement dans le navigateur** (`localStorage`), propre à l'appareil et à l'adresse d'hébergement choisie — il n'y a aucun envoi vers un serveur. Pensez à exporter régulièrement un CSV si vous changez de téléphone, videz le cache du navigateur, ou changez d'hébergement (une nouvelle adresse = un nouveau stockage vide).

## Hypothèses prises pour cette première version

- La case « heures » reste une case unique par jour, comme demandé ; le réglage décimal/heures-minutes ne change que la façon dont la valeur s'affiche et se saisit dans cette même case (ex. taper `7,5` ou `7h30` fonctionne dans les deux modes).
- Les 7 jours du mois sont affichés (aucune option pour masquer le week-end n'a été demandée).
- Le CSV utilise `;` comme séparateur et `,` comme séparateur décimal, format standard d'Excel en France.

N'hésitez pas à me dire si vous souhaitez ajuster un de ces points (par exemple : un objectif d'heures mensuel affiché à côté du total, un export PDF, une synchronisation entre appareils, etc.) — je peux faire évoluer l'application.
