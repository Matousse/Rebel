/**
 * Générateur de données factices pour une Sonic Map
 * Crée 10 000 points représentant des morceaux de musique avec des clusters,
 * des zones denses et des zones éparses dans un espace 3D
 */

// Configuration

import fs from 'fs';
const totalSongs = 10000;
const universeSize = 1000; // Taille de l'univers 3D (-universeSize/2 à +universeSize/2)
const clusters = {
  // Grands clusters thématiques (genres principaux)
  electronic: { center: [250, 100, -150], radius: 200, population: 2000, density: 0.8 },
  rock: { center: [-300, 50, 200], radius: 250, population: 2500, density: 0.7 },
  classical: { center: [50, -200, -300], radius: 180, population: 1500, density: 0.9 },
  jazz: { center: [-150, -50, -200], radius: 150, population: 1000, density: 0.6 },
  hiphop: { center: [200, 300, 100], radius: 220, population: 1800, density: 0.75 },
  // Petits clusters (sous-genres)
  ambient: { center: [200, 50, -100], radius: 70, population: 300, density: 0.95, parent: 'electronic' },
  techno: { center: [300, 150, -180], radius: 60, population: 250, density: 0.9, parent: 'electronic' },
  metal: { center: [-350, 100, 250], radius: 80, population: 400, density: 0.85, parent: 'rock' },
  baroque: { center: [20, -250, -280], radius: 50, population: 200, density: 0.9, parent: 'classical' },
  bebop: { center: [-120, -30, -180], radius: 40, population: 150, density: 0.8, parent: 'jazz' },
  trap: { center: [230, 350, 120], radius: 60, population: 300, density: 0.9, parent: 'hiphop' },
};

// Quelques artistes populaires pour chaque genre (pour rendre les données plus réalistes)
const artists = {
  electronic: ["Aphex Twin", "Daft Punk", "Burial", "Four Tet", "Boards of Canada", "Autechre"],
  rock: ["Radiohead", "The Strokes", "Arctic Monkeys", "Tame Impala", "Queens of the Stone Age"],
  classical: ["Mozart", "Beethoven", "Bach", "Chopin", "Debussy", "Vivaldi", "Tchaikovsky"],
  jazz: ["Miles Davis", "John Coltrane", "Thelonious Monk", "Charles Mingus", "Bill Evans"],
  hiphop: ["Kendrick Lamar", "J Dilla", "MF DOOM", "Madlib", "Tyler, The Creator"],
  ambient: ["Brian Eno", "Tim Hecker", "William Basinski", "Stars of the Lid"],
  techno: ["Jeff Mills", "Ricardo Villalobos", "Nina Kraviz", "Richie Hawtin"],
  metal: ["Metallica", "Tool", "Opeth", "Meshuggah", "Gojira"],
  baroque: ["Johann Sebastian Bach", "Handel", "Vivaldi", "Telemann"],
  bebop: ["Charlie Parker", "Dizzy Gillespie", "Bud Powell", "Max Roach"],
  trap: ["Travis Scott", "Future", "Young Thug", "Migos", "Playboi Carti"]
};

// Caractéristiques musicales par genre (pour générer des titres cohérents)
const songFeatures = {
  electronic: ["Synth", "Beat", "Wave", "Pulse", "Digital", "Circuit", "Echo", "Flow"],
  rock: ["Riff", "Distortion", "Anthem", "Feedback", "Chord", "Sound", "Noise"],
  classical: ["Symphony", "Sonata", "Concerto", "Nocturne", "Étude", "Prelude", "Fugue"],
  jazz: ["Blues", "Swing", "Standard", "Solo", "Improvisation", "Tune", "Groove"],
  hiphop: ["Flow", "Beat", "Rhyme", "Bass", "Bars", "Verse", "Track"],
  ambient: ["Texture", "Drone", "Atmosphere", "Field", "Space", "Endless", "Drift"],
  techno: ["Kick", "Loop", "Acid", "Drop", "Warehouse", "4/4", "Machine"],
  metal: ["Riff", "Breakdown", "Headbang", "Scream", "Thrash", "Heavy", "Brutal"],
  baroque: ["Suite", "Partita", "Cantata", "Invention", "Chorale", "Toccata"],
  bebop: ["Changes", "Session", "Take", "Lick", "Progression", "Standard"],
  trap: ["Drip", "808", "Banger", "Flex", "Swag", "Bounce", "Hype"]
};

// Années par genre pour plus de réalisme
const yearRanges = {
  electronic: [1990, 2023],
  rock: [1960, 2023],
  classical: [1700, 1950],
  jazz: [1920, 2023],
  hiphop: [1980, 2023],
  ambient: [1975, 2023],
  techno: [1988, 2023],
  metal: [1970, 2023],
  baroque: [1600, 1750],
  bebop: [1940, 1970],
  trap: [2010, 2023]
};

// Fonction utilitaire pour générer un nombre aléatoire dans une plage
function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

// Fonction utilitaire pour générer un entier aléatoire dans une plage
function randomInt(min, max) {
  return Math.floor(randomRange(min, max));
}

// Fonction utilitaire pour sélectionner un élément aléatoire d'un tableau
function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Fonction pour générer un point aléatoire dans un cluster
function generatePointInCluster(cluster, density) {
  // Plus la densité est élevée, plus les points se regroupent vers le centre
  const distanceFactor = Math.pow(Math.random(), 1/density);
  const distance = distanceFactor * cluster.radius;
  
  // Position aléatoire sur une sphère
  const theta = randomRange(0, 2 * Math.PI);
  const phi = randomRange(0, Math.PI);
  
  const x = cluster.center[0] + distance * Math.sin(phi) * Math.cos(theta);
  const y = cluster.center[1] + distance * Math.sin(phi) * Math.sin(theta);
  const z = cluster.center[2] + distance * Math.cos(phi);
  
  return [x, y, z];
}

// Fonction pour générer un point complètement aléatoire (éparse)
function generateRandomPoint() {
  return [
    randomRange(-universeSize/2, universeSize/2),
    randomRange(-universeSize/2, universeSize/2),
    randomRange(-universeSize/2, universeSize/2)
  ];
}

// Fonction pour générer un titre de chanson selon le genre
function generateSongTitle(genre) {
  const templates = [
    `The ${randomItem(songFeatures[genre])}`,
    `${randomItem(songFeatures[genre])} ${randomItem(songFeatures[genre])}`,
    `${randomItem(['A', 'My', 'Your', 'Our', 'The'])} ${randomItem(songFeatures[genre])} ${randomItem(['Dream', 'Love', 'Heart', 'Mind', 'Soul', 'Life'])}`,
    `${randomItem(songFeatures[genre])} ${randomItem(['in', 'of', 'under', 'beyond', 'through'])} ${randomItem(['Time', 'Space', 'Light', 'Dark', 'Night', 'Day'])}`,
    `${randomItem(['Lost', 'Hidden', 'Forgotten', 'Eternal', 'Silent', 'Distant'])} ${randomItem(songFeatures[genre])}`,
  ];
  return randomItem(templates);
}

// Fonction pour attribuer des caractéristiques audio cohérentes basées sur le genre et la position
function generateAudioFeatures(genre, position) {
  const genreFeatures = {
    electronic: { tempo: [120, 140], energy: [0.6, 0.9], danceability: [0.7, 0.9], acousticness: [0, 0.3] },
    rock: { tempo: [90, 130], energy: [0.7, 0.9], danceability: [0.4, 0.7], acousticness: [0.2, 0.5] },
    classical: { tempo: [60, 120], energy: [0.2, 0.6], danceability: [0.1, 0.4], acousticness: [0.7, 1.0] },
    jazz: { tempo: [80, 140], energy: [0.3, 0.7], danceability: [0.3, 0.6], acousticness: [0.5, 0.9] },
    hiphop: { tempo: [80, 110], energy: [0.6, 0.8], danceability: [0.6, 0.9], acousticness: [0.1, 0.4] },
    ambient: { tempo: [60, 90], energy: [0.1, 0.4], danceability: [0.1, 0.3], acousticness: [0.3, 0.7] },
    techno: { tempo: [125, 150], energy: [0.7, 1.0], danceability: [0.7, 0.9], acousticness: [0, 0.2] },
    metal: { tempo: [100, 160], energy: [0.8, 1.0], danceability: [0.3, 0.6], acousticness: [0.1, 0.3] },
    baroque: { tempo: [70, 120], energy: [0.3, 0.6], danceability: [0.2, 0.5], acousticness: [0.8, 1.0] },
    bebop: { tempo: [120, 180], energy: [0.5, 0.8], danceability: [0.4, 0.7], acousticness: [0.6, 0.9] },
    trap: { tempo: [70, 100], energy: [0.6, 0.8], danceability: [0.7, 0.9], acousticness: [0.1, 0.3] }
  };
  
  const features = genreFeatures[genre] || genreFeatures.rock;
  
  // Utilise la position pour influencer légèrement les caractéristiques
  // Plus on est loin du centre du cluster, plus on s'éloigne des caractéristiques typiques
  const normalizedPosition = [
    (position[0] / universeSize) + 0.5,
    (position[1] / universeSize) + 0.5,
    (position[2] / universeSize) + 0.5
  ];
  
  return {
    tempo: randomRange(features.tempo[0], features.tempo[1]),
    energy: randomRange(features.energy[0], features.energy[1]),
    danceability: randomRange(features.danceability[0], features.danceability[1]),
    acousticness: randomRange(features.acousticness[0], features.acousticness[1]),
    // Utilise les coordonnées pour influencer d'autres paramètres
    brightness: 0.3 + (normalizedPosition[1] * 0.7), // Y influence la brillance (plus haut = plus brillant)
    bass: 0.8 - (normalizedPosition[1] * 0.6),       // Y inverse influence les basses (plus bas = plus de basse)
    complexity: normalizedPosition[0] * 0.8 + 0.2,   // X influence la complexité
    aggression: (normalizedPosition[2] + 0.3) * 0.7  // Z influence l'agressivité
  };
}

// Fonction principale pour générer le dataset complet
function generateSonicMapData() {
  // Sélectionne aléatoirement 2% d'indices pour "liked: true"
  const likedCount = Math.floor(totalSongs * 0.02);
  const likedIndices = new Set();
  while (likedIndices.size < likedCount) {
    likedIndices.add(Math.floor(Math.random() * totalSongs));
  }
  const songs = [];
  let remainingSongs = totalSongs;
  
  // Génère les chansons pour chaque cluster principal
  for (const [genreName, cluster] of Object.entries(clusters)) {
    // Saute les sous-genres qui seront traités avec leurs parents
    if (cluster.parent) continue;
    
    const songsInCluster = Math.min(cluster.population, remainingSongs);
    remainingSongs -= songsInCluster;
    
    for (let i = 0; i < songsInCluster; i++) {
      const position = generatePointInCluster(cluster, cluster.density);
      const year = randomInt(yearRanges[genreName][0], yearRanges[genreName][1]);
      const artist = randomItem(artists[genreName]);
      const title = generateSongTitle(genreName);
      const audioFeatures = generateAudioFeatures(genreName, position);
      
      songs.push({
        id: `song_${songs.length + 1}`,
        title,
        artist,
        genre: genreName,
        year,
        position,
        audioFeatures,
        liked: false // valeur par défaut, sera mise à jour plus tard
      });
    }
  }
  
  // Ajoute les sous-genres
  for (const [genreName, cluster] of Object.entries(clusters)) {
    if (!cluster.parent) continue;
    
    const songsInCluster = Math.min(cluster.population, remainingSongs);
    remainingSongs -= songsInCluster;
    
    for (let i = 0; i < songsInCluster; i++) {
      const position = generatePointInCluster(cluster, cluster.density);
      const year = randomInt(yearRanges[genreName][0], yearRanges[genreName][1]);
      const artist = randomItem(artists[genreName] || artists[cluster.parent]);
      const title = generateSongTitle(genreName);
      const audioFeatures = generateAudioFeatures(genreName, position);
      
      songs.push({
        id: `song_${songs.length + 1}`,
        title,
        artist,
        genre: genreName,
        subgenreOf: cluster.parent,
        year,
        position,
        audioFeatures,
        liked: false // valeur par défaut, sera mise à jour plus tard
      });
    }
  }
  
  // Ajoute des chansons éparses pour remplir jusqu'à 10 000
  while (songs.length < totalSongs) {
    const position = generateRandomPoint();
    
    // Détermine le genre le plus proche basé sur la distance
    let nearestGenre = 'rock';
    let minDistance = Infinity;
    
    for (const [genreName, cluster] of Object.entries(clusters)) {
      if (cluster.parent) continue; // Considère seulement les genres principaux
      
      const dx = position[0] - cluster.center[0];
      const dy = position[1] - cluster.center[1];
      const dz = position[2] - cluster.center[2];
      const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestGenre = genreName;
      }
    }
    
    const year = randomInt(yearRanges[nearestGenre][0], yearRanges[nearestGenre][1]);
    const artist = randomItem(artists[nearestGenre]);
    const title = generateSongTitle(nearestGenre);
    const audioFeatures = generateAudioFeatures(nearestGenre, position);
    
    // Plus loin du centre, plus "expérimental"
    const experimentalFactor = Math.min(1, minDistance / (universeSize/2));
    
    songs.push({
      id: `song_${songs.length + 1}`,
      title,
      artist,
      genre: nearestGenre,
      experimental: experimentalFactor > 0.7, // Marque comme expérimental si très loin
      experimentalFactor: experimentalFactor.toFixed(2),
      year,
      position,
      audioFeatures,
      liked: false // valeur par défaut, sera mise à jour plus tard
    });
  }
  
  // Attribue liked:true à 2% des chansons (indices aléatoires)
  songs.forEach((song, idx) => {
    if (likedIndices.has(idx)) song.liked = true;
  });
  return songs;
}

// Génère les données
const sonicMapData = generateSonicMapData();

// Format de sortie simple (juste position et métadonnées minimales)
const simpleOutput = sonicMapData.map(song => ({
  id: song.id,
  title: song.title,
  artist: song.artist,
  genre: song.genre,
  subgenreOf: song.subgenreOf,
  year: song.year,
  position: song.position
}));

// Format pour Babylon.js directement utilisable
const babylonReadyData = sonicMapData.map(song => {
  // Attributs pour le rendu visuel basés sur le genre et les caractéristiques
  let color, size, emissiveIntensity;
  
  switch(song.genre) {
    case 'electronic':
      color = [0.2, 0.8, 1.0]; // Cyan
      break;
    case 'ambient':
      color = [0.0, 0.5, 0.8]; // Bleu clair
      break;
    case 'techno':
      color = [0.4, 0.9, 1.0]; // Cyan vif
      break;
    case 'rock':
      color = [1.0, 0.4, 0.2]; // Rouge-orange
      break;
    case 'metal':
      color = [0.8, 0.2, 0.0]; // Rouge foncé
      break;
    case 'classical':
      color = [0.9, 0.8, 0.2]; // Jaune doré
      break;
    case 'baroque':
      color = [1.0, 0.9, 0.5]; // Or clair
      break;
    case 'jazz':
      color = [0.8, 0.4, 0.9]; // Violet
      break;
    case 'bebop':
      color = [0.7, 0.2, 0.8]; // Violet foncé
      break;
    case 'hiphop':
      color = [0.2, 0.7, 0.2]; // Vert
      break;
    case 'trap':
      color = [0.0, 0.5, 0.3]; // Vert foncé
      break;
    default:
      color = [0.7, 0.7, 0.7]; // Gris
  }
  
  // Taille basée sur la popularité (simulée par une valeur aléatoire)
  const popularity = song.experimental ? 
    randomRange(0.1, 0.5) : // Expérimental = moins populaire généralement
    randomRange(0.3, 0.9);  // Standard
  
  size = 1 + (popularity * 2);
  
  // Luminosité basée sur l'énergie
  emissiveIntensity = song.audioFeatures.energy * 0.8;
  
  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    genre: song.genre,
    subgenreOf: song.subgenreOf,
    year: song.year,
    experimental: song.experimental || false,
    liked: song.liked || false,
    // Pour Babylon.js
    position: {
      x: song.position[0],
      y: song.position[1],
      z: song.position[2]
    },
    color: {
      r: color[0],
      g: color[1],
      b: color[2]
    },
    size: size,
    emissiveIntensity: emissiveIntensity,
    // Données audio
    audio: {
      tempo: song.audioFeatures.tempo,
      energy: song.audioFeatures.energy,
      danceability: song.audioFeatures.danceability,
      acousticness: song.audioFeatures.acousticness,
      brightness: song.audioFeatures.brightness,
      bass: song.audioFeatures.bass
    }
  };
});

// Exporter les différents formats
export const sonicMapRawData = sonicMapData;
export const sonicMapSimpleData = simpleOutput;
export const sonicMapBabylonData = babylonReadyData;

// Si vous avez besoin de l'écrire dans un fichier (en environnement Node.js)
// Ceci ne fonctionnera pas dans un navigateur
if (typeof process !== 'undefined') {
  fs.writeFileSync('sonicMapData.json', JSON.stringify(sonicMapBabylonData, null, 2));
  console.log('Données générées et écrites dans sonicMapData.json');
}

// Pour afficher un petit échantillon dans la console
console.log(`Générés ${sonicMapBabylonData.length} morceaux de musique en 3D`);
console.log('Exemple de 3 morceaux:');
console.log(sonicMapBabylonData.slice(0, 3));

// Pour usage dans le navigateur ou Node.js
export default babylonReadyData;