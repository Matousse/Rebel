const express = require('express');
const router = express.Router();
const authController = require('../modules/magicRoutes');
const { verifyMagicToken, requireRegisteredUser } = require('../../middleware/magic-auth');

// Route d'authentification Magic (publique)
router.post('/magic', authController.magicAuth);

// Routes protégées par Magic
router.post('/logout', verifyMagicToken, requireRegisteredUser, authController.logout);
router.get('/solana-balance', verifyMagicToken, requireRegisteredUser, authController.getSolanaBalance);
router.post('/participate', verifyMagicToken, requireRegisteredUser, authController.participateInChallenge);

module.exports = router;