const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Import controllers
const {
  uploadTrack,
  createTimestamp,
  verifyTimestamp
  // ... autres méthodes
} = require('./trackController');

// Import middleware
const { protect, artistOnly } = require('../../middleware/authMiddleware');

// Configure multer for track uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../../public/uploads/tracks'));
  },
  filename: (req, file, cb) => {
    cb(null, `track-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept audio files
  const allowedMimeTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File must be an audio file (MP3, WAV, OGG)'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 30 * 1024 * 1024 } // 30MB max
});

// Routes
router.post('/', protect, artistOnly, upload.single('audioFile'), uploadTrack);
router.post('/:id/timestamp', protect, artistOnly, createTimestamp);
router.get('/:id/verify', verifyTimestamp);

// ... autres routes

module.exports = router;