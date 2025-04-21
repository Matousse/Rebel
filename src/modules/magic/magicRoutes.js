const express = require('express');
const router = express.Router();
const magicController = require('./magicController');

// Routes
router.post('/auth', magicController.magicAuth);

module.exports = router;