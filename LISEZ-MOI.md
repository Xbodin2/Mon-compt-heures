# Mon compt'heures

Application web installable (PWA) pour suivre vos heures de travail cumulées, mois par mois.

## Mise à jour importante — si vous aviez déjà installé une version précédente

Deux problèmes distincts ont été corrigés dans cette version :

1. **Page blanche / non fonctionnelle (V3)** : une erreur dans `app.js` (une variable utilisée avant sa déclaration) arrêtait tout le script dès son démarrage — d'où l'absence totale de liste, de sélecteur de mois et de réglages. C'était une véritable erreur de code de ma part, corrigée et vérifiée en exécutant le script de bout en bout avant de vous le renvoyer.
2. **Mises à jour qui ne s'affichaient pas (V2)** : voir ci-dessous, déjà corrigé précédemment.

Une version antérieure gardait la page en cache **avant** de vérifier le réseau, ce qui empêchait les mises à jour de s'afficher. C'est corrigé : l'appli vérifie maintenant toujours le réseau en premier et ne se rabat sur le cache que si le téléphone est hors-ligne. Les mises à jour futures s'appliqueront **silencieusement**, dès la prochaine ouverture avec une connexion internet.

**Cette fois encore**, si l'icône est déjà installée sur votre écran d'accueil, purgez une fois la version bloquée :
1. Réglages Android → Applications → *Mon compt'heures* (elle apparaît comme une application à part, même si c'est une PWA).
2. Stockage → **Effacer le cache** puis **Effacer les données**.
3. Redéployez ces fichiers sur GitHub, puis rouvrez l'icône : la nouvelle version doit s'afficher normalement.

Si l'appli n'apparaît pas dans la liste des applications (installation via un simple raccourci Chrome plutôt qu'un « WebAPK »), ouvrez plutôt le site dans l'onglet Chrome normal, puis Menu (⋮) → Paramètres → Paramètres des sites → *Effacer et réinitialiser* pour ce site.

## Installer l'application sur votre téléphone Android

Une PWA doit être servie via une **adresse http(s)** pour pouvoir s'installer proprement sur l'écran d'accueil (le simple double-clic sur `index.html` fonctionne pour un usage ponctuel, mais Android refuse l'installation et le mode hors-ligne depuis un fichier local). Trois façons simples d'obtenir cette adresse, de la plus simple à la plus technique :

**Option A — GitHub Pages (gratuit, recommandé)**
1. Créez un compte GitHub si besoin, puis un nouveau dépôt (public).
2. Déposez-y tous les fichiers de ce dossier (`index.html`, `style.css`, `app.js`, `manifest.json`, `sw.js`, `icons/`).
3. Dans les paramètres du dépôt → *Pages*, activez GitHub Pages sur la branche principale.
4. Ouvrez l'adresse fournie (`https://votre-compte.github.io/votre-depot/`) avec Chrome sur votre téléphone.
5. Menu Chrome (⋮) → **Installer l'application** (ou « Ajouter à l'écran d'accueil »).

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

- **En-tête** : flèches ‹ › pour changer de mois, liste déroulante pour le mois, champ numérique (clavier du téléphone) pour l'année. Le compteur à digits affiche le total d'heures cumulées du mois affiché, mis à jour en temps réel. Si un objectif hebdomadaire est renseigné, une ligne sous le compteur indique l'objectif du mois et l'écart (« reste... » ou « dépassé de... »).
- **Liste des jours** : les 7 jours du mois sont affichés, avec le nom du jour, son numéro, une case pour le nombre d'heures et une case pour un commentaire libre. Les dimanches et le jour courant sont mis en évidence.
- **Réglages** (icône ⚙ en haut à droite) :
  - **Thème** : 5 choix — Auto (suit le réglage clair/sombre du téléphone), Carnet clair, Carnet sombre, Atelier (sombre, ambiance industrielle, accent ambre) et Papier quadrillé (clair, fond quadrillé façon feuille d'ingénieur, accent bleu). Chaque thème a son propre fond, ses couleurs et sa typographie de titre — ce ne sont pas de simples variantes de couleur.
  - **Mode de saisie** : « Nombre d'heures » (une case par jour, comme avant) ou **« Début - fin »** : deux champs d'heure (native, sans clavier à taper) + une pause en minutes à déduire ; la durée est calculée automatiquement et affichée à droite de la ligne. Si l'heure de fin est plus petite que l'heure de début (équipe de nuit), le calcul bascule automatiquement sur le jour suivant (ex. 22h00 → 06h00 = 8h).
  - **Affichage des heures** : décimal (`7,5`) ou heures:minutes (`7h30`) — s'applique au compteur, au CSV, au PDF, et en mode de saisie « Nombre d'heures », détermine aussi le type de champ (texte libre en décimal, sélecteur d'heure natif en heures:minutes — plus besoin de taper la lettre « h »).
  - **Objectif hebdomadaire** : nombre d'heures par semaine visé. Laissez le champ vide pour masquer l'indicateur.
  - Sauvegarde : export du mois affiché ou de toutes les données en CSV, import d'un fichier CSV, export du mois affiché en PDF (tableau jour/date/heures/commentaire + total).
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
- **Objectif hebdomadaire** : le total « visé » du mois est calculé au prorata (objectif hebdo ÷ 7 × nombre de jours du mois affiché), puisque les mois n'ont pas un nombre entier de semaines. C'est une estimation, pas un calcul par semaines calendaires.
- **Export PDF** : nécessite une connexion internet la première fois qu'on l'utilise (le module de génération PDF est chargé depuis un CDN, comme les polices). Une fois chargé, il reste disponible tant que l'onglet n'est pas rechargé hors-ligne. Si vous voulez un export PDF garanti sans connexion, dites-le moi : c'est possible en intégrant la bibliothèque directement dans les fichiers de l'appli plutôt que via un CDN.
- **Thèmes** : si vous aviez déjà installé la version précédente, vos anciens réglages clair/sombre sont automatiquement basculés vers Carnet clair/sombre ; le réglage de couleur d'accent (laiton/marine/etc.) a été retiré au profit des thèmes complets et sera réinitialisé au thème Auto par défaut.
- **Mode « Début - fin »** : la pause se saisit en minutes (pas en heure de début/fin de pause) pour rester simple — une seule pause par jour. Le CSV et le PDF exportent uniquement le total d'heures calculé, pas le détail des heures de début/fin/pause ; dites-moi si vous voulez aussi ces colonnes dans l'export. Si vous saisissez des heures de début/fin puis repassez en mode « Nombre d'heures », la valeur calculée reste affichée mais devient modifiable directement ; si vous la modifiez à la main, les heures de début/fin restées en mémoire ne sont plus mises à jour (elles réapparaîtront telles quelles si vous revenez au mode « Début - fin »).

N'hésitez pas à me dire si vous souhaitez ajuster un de ces points (par exemple : un calcul de l'objectif par semaines calendaires réelles plutôt qu'au prorata, une synchronisation entre appareils, le détail début/fin/pause inclus dans les exports, etc.) — je peux faire évoluer l'application.
