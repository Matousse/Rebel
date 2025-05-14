// Serveur Node.js minimal pour tester Babylon.js en local
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Sert les fichiers statiques du dossier public
app.use(express.static(path.join(__dirname, 'public')));

// Sert le fichier sonicMapData.json à la racine
app.get('/sonicMapData.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'sonicMapData.json'));
});

app.listen(PORT, () => {
  console.log(`Babylon app server running: http://localhost:${PORT}`);
});
