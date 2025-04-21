const express = require('express');
const router = express.Router();
const magicController = require('./magicController');
const { protect } = require('../../middleware/authMiddleware'); // Middleware existant

// Routes d'authentification
router.post('/auth', magicController.magicAuth);

// Route protégée pour obtenir l'adresse wallet
router.get('/wallet', protect, magicController.getWalletAddress);

module.exports = router;