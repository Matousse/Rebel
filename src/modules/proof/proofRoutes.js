const express = require('express');
const router = express.Router();
const proofController = require('./proofController');
const { protect, artistOnly } = require('../../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configuration de multer pour le téléchargement de fichiers audio
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../../temp/uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `audio-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accepter uniquement les fichiers audio
  if (file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error('Le fichier doit être de type audio'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
});

// Assurer que le dossier temp existe
const fs = require('fs');
const tempUploadDir = path.join(__dirname, '../../../temp/uploads');
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

// Routes
// Création d'une preuve (protégée et limitée aux artistes)
router.post(
  '/',
  protect,
  artistOnly,
  upload.single('audioFile'),
  proofController.createProof
);
router.get('/user/me', protect, proofController.getMyProofs);
// Récupération d'une preuve par ID
router.get('/:id', proofController.getProofById);

// Récupération des preuves par piste
router.get('/track/:trackId', proofController.getProofsByTrackId);

// Récupération des preuves par artiste
router.get('/artist/:artistId', proofController.getProofsByArtistId);

// Vérification d'une preuve
router.post(
  '/verify/:id',
  upload.single('audioFile'),
  proofController.verifyProof
);

// Paiement pour une preuve
router.post(
  '/pay/:id',
  protect,
  proofController.payForProof
);

// Téléchargement d'un document de preuve
router.get(
  '/download/:id',
  protect,
  proofController.downloadProof
);

// Récupération des preuves de l'utilisateur connecté
router.get(
  '/user/me',
  protect,
  proofController.getMyProofs
);

module.exports = router;