/**
 * Play Routes
 * Routes pour le module de lecture SoundCloud
 */

const express = require('express');
const router = express.Router();
const playController = require('./playController');

// Route pour obtenir un morceau aléatoire
router.get('/random', (req, res) => {
  try {
    const track = playController.getRandomTrack();
    res.json({ success: true, data: track });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route pour obtenir tous les morceaux disponibles
router.get('/tracks', (req, res) => {
  try {
    const tracks = playController.getAllTracks();
    res.json({ success: true, data: tracks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route pour obtenir la configuration du widget
router.get('/config', (req, res) => {
  try {
    const config = playController.getWidgetConfig();
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
