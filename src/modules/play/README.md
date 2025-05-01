# Module Play - SoundCloud Widget

Ce module permet d'intégrer facilement un widget SoundCloud dans votre application, avec la possibilité de lire des morceaux aléatoires.

Pour y accéder et tester lorsque le server run : http://localhost:5001/play/test-widget.html





## Structure du module

- `playController.js` - Contrôleur qui gère la logique côté serveur
- `playRoutes.js` - Routes API pour le module
- `playWidget.js` - Script client pour l'intégration du widget dans le frontend
- `demo.html` - Page de démonstration montrant comment utiliser le widget

## Installation

1. Intégrez les routes dans votre application en modifiant `src/app.js` :

```javascript
// Importer les routes du module Play
const playRoutes = require('./modules/play/playRoutes');

// ...

// Ajouter les routes à l'application
app.use('/api/play', playRoutes);
```

2. Copiez le fichier `playWidget.js` dans votre dossier d'assets frontend ou servez-le statiquement.

## Utilisation dans le frontend

### 1. Inclure le script

```html
<script src="/path/to/playWidget.js"></script>
```

### 2. Ajouter un conteneur pour le widget

```html
<div id="soundcloud-player"></div>
```

### 3. Initialiser le widget

```javascript
const player = new SoundCloudPlayer({
  container: '#soundcloud-player',
  autoPlay: true,
  visual: true,
  apiBaseUrl: '/api/play'
});

// Initialiser le widget
document.addEventListener('DOMContentLoaded', () => {
  player.init();
});
```

### 4. Contrôler le lecteur (optionnel)

```javascript
// Lecture
player.play();

// Pause
player.pause();

// Charger un nouveau morceau aléatoire
player.playRandom();
```

## Options de configuration

Vous pouvez personnaliser le widget en passant différentes options lors de l'initialisation :

```javascript
const player = new SoundCloudPlayer({
  container: '#soundcloud-player',       // Sélecteur CSS du conteneur
  color: '#ff5500',                      // Couleur principale du widget
  autoPlay: false,                       // Lecture automatique
  hideRelated: false,                    // Masquer les morceaux liés
  showComments: false,                   // Afficher les commentaires
  showUser: true,                        // Afficher l'utilisateur
  showReposts: false,                    // Afficher les reposts
  showTeaser: false,                     // Afficher les teasers
  visual: true,                          // Afficher la forme d'onde visuelle
  apiBaseUrl: '/api/play'                // URL de base de l'API
});
```

## Personnalisation des morceaux

Pour modifier la liste des morceaux disponibles, éditez le tableau `sampleTracks` dans `playController.js`. Vous pouvez également connecter ce module à votre base de données pour récupérer des morceaux dynamiquement.
