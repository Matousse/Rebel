/**
 * Play Controller
 * Gère la logique pour le widget SoundCloud et la lecture aléatoire de morceaux
 */

// Liste de morceaux SoundCloud pour la démonstration
// Ces URLs peuvent être remplacées par des morceaux de votre choix ou récupérées depuis une base de données
const sampleTracks = [
  'https://soundcloud.com/flume/say-it-feat-tove-lo',
  'https://soundcloud.com/majorlazer/major-lazer-dj-snake-lean-on-feat-mo',
  'https://soundcloud.com/theweeknd/the-weeknd-kendrick-lamar-pray-for-me',
  'https://soundcloud.com/tameimpala/the-less-i-know-the-better',
  'https://soundcloud.com/daftpunkofficialmusic/get-lucky-radio-edit-feat',
  'https://soundcloud.com/disclosure/latch-feat-sam-smith',
  'https://soundcloud.com/arcticmonkeys/do-i-wanna-know',
  'https://soundcloud.com/thexx/on-hold',
  'https://soundcloud.com/kaytranada/kaytranada-got-it-good-feat-craig-david',
  'https://soundcloud.com/gorillaz/feel-good-inc'
];

/**
 * Récupère un morceau aléatoire depuis la liste d'échantillons
 * @returns {Object} - Objet contenant l'URL du morceau
 */
const getRandomTrack = () => {
  const randomIndex = Math.floor(Math.random() * sampleTracks.length);
  return { trackUrl: sampleTracks[randomIndex] };
};

/**
 * Récupère tous les morceaux disponibles
 * @returns {Array} - Liste des URLs de morceaux
 */
const getAllTracks = () => {
  return { tracks: sampleTracks };
};

/**
 * Récupère les informations nécessaires pour initialiser le widget SoundCloud
 * @returns {Object} - Objet contenant les informations de configuration
 */
const getWidgetConfig = () => {
  return {
    color: "#ff5500", // Couleur par défaut de SoundCloud
    autoPlay: false,
    hideRelated: false,
    showComments: false,
    showUser: true,
    showReposts: false,
    showTeaser: false,
    visual: true, // Affiche la forme d'onde visuelle
    clientId: process.env.SOUNDCLOUD_CLIENT_ID || '' // Optionnel, si vous avez un client ID
  };
};

module.exports = {
  getRandomTrack,
  getAllTracks,
  getWidgetConfig
};
