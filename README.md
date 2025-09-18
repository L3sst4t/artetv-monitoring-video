# Analyseur de vid\u00e9os Arte

Cette application Node.js d\u00e9marre un serveur web qui permet d'analyser une page vid\u00e9o Arte. Elle r\u00e9cup\u00e8re les informations suivantes :

- Dur\u00e9e de la vid\u00e9o (hh:mm:ss)
- Pistes audio disponibles
- Pistes de sous-titres
- Captures d'\u00e9cran \u00e0 trois positions : d\u00e9but, milieu, 30 secondes avant la fin

## Pr\u00e9requis

- Node.js 18 ou sup\u00e9rieur
- npm
- Playwright et les navigateurs support\u00e9s

## Installation

```bash
npm install
npx playwright install --with-deps
```

La commande `playwright install` t\u00e9l\u00e9charge le navigateur Chromium utilis\u00e9 pour les captures d'\u00e9cran. Sur certains syst\u00e8mes (Linux), l'option `--with-deps` installe aussi les biblioth\u00e8ques natives n\u00e9cessaires.

## Lancement

```bash
npm start
```

Le serveur est accessible sur [http://localhost:3000](http://localhost:3000).

## Utilisation

1. Ouvrir l'application dans un navigateur.
2. Renseigner l'URL de la page vid\u00e9o Arte (ex. `https://www.arte.tv/fr/videos/102284-000-A/mars-en-quete-de-vie/`).
3. Cliquer sur **Analyser**.
4. Attendre la fin du traitement : la dur\u00e9e, les pistes audio/sous-titres ainsi que les captures d'\u00e9cran s'affichent.

Chaque capture est g\u00e9n\u00e9r\u00e9e en positionnant le lecteur vid\u00e9o \u00e0 l'instant voulu puis en prenant une capture de l'\u00e9l\u00e9ment `<video>` directement.

## Limitations

- L'analyse d\u00e9pend de la pr\u00e9sence d'un \u00e9l\u00e9ment `<video>` directement accessible sur la page. Si le site utilise un lecteur tr\u00e8s personnalis\u00e9, le script peut devoir \u00eatre adapt\u00e9.
- Certaines pages bloquent le chargement dans un navigateur headless ou demandent une authentification.
- L'extraction des pistes audio repose sur l'API `HTMLMediaElement.audioTracks`, absente de certains navigateurs. Dans ce cas, la liste peut \u00eatre vide.

## D\u00e9veloppement

Le code principal de l'analyse est situ\u00e9 dans [`src/analyzer.js`](src/analyzer.js). L'interface web se trouve dans le dossier [`public`](public/).

N'h\u00e9sitez pas \u00e0 ajuster les s\u00e9lecteurs ou les d\u00e9lais si vous ciblez d'autres plateformes de streaming.
