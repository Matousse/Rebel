// src/modules/tracks/trackRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, artistOnly } = require('../../middleware/authMiddleware');
const {
  uploadTrack,
  createProof,
  getProof
} = require('./trackController');

// Configuration multer pour les uploads audio
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../../public/uploads/tracks'));
  },
  filename: (req, file, cb) => {
    cb(null, `track-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accepter uniquement les fichiers audio
  const allowedTypes = [
    'audio/mpeg', 'audio/mp3', 'audio/wav', 
    'audio/ogg', 'audio/flac', 'audio/aac'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File must be an audio file'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 30 * 1024 * 1024 } // 30MB max
});

// Routes
router.post('/', protect, artistOnly, upload.single('audioFile'), uploadTrack);
router.post('/:id/proof', protect, createProof);
router.get('/:id/proof', protect, getProof);

module.exports = router;