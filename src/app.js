const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');

// Load environment variables
dotenv.config();

// Import Track model to ensure it's registered with Mongoose
// Note: Don't import User model here as it's already imported elsewhere
const Track = require('./models/Track');

// Import module routes
const userRoutes = require('./modules/user/userRoutes');
const magicRoutes = require('./modules/magic/magicRoutes'); // Ajout des routes Magic
const playRoutes = require('./modules/play/playRoutes'); // Ajout des routes Play

// Initialize Express application
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// Configuration de Helmet avec des options personnalisées pour permettre les scripts externes
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://w.soundcloud.com", "https://*.sndcdn.com"],
      connectSrc: ["'self'", "https://api.soundcloud.com", "https://api-widget.soundcloud.com", "https://*.sndcdn.com"],
      frameSrc: ["'self'", "https://w.soundcloud.com", "https://*.sndcdn.com"],
      mediaSrc: ["'self'", "https://api.soundcloud.com", "https://api-widget.soundcloud.com", "https://*.sndcdn.com"],
      imgSrc: ["'self'", "https://w.soundcloud.com", "https://i1.sndcdn.com", "https://*.sndcdn.com", "data:"],
    },
  },
  // Désactiver les politiques qui bloquent les scripts externes
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false
})); // HTTP Security avec CSP personnalisée

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Serve Play module static files
app.use('/play', express.static(path.join(__dirname, 'modules/play')));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/magic', magicRoutes); // Utilisation des routes Magic
app.use('/api/play', playRoutes); // Utilisation des routes Play

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the music platform API' });
});

//Ajout d'une route de test pour l'AA
app.get('/api/aa-status', (req, res) => {
  const { accountService } = require('./account-abstraction');
  res.json({
    status: 'ok',
    solanaNetwork: process.env.SOLANA_NETWORK || 'devnet',
    adminPublicKey: accountService.solanaService.getAdminKeypair().publicKey.toString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Server error'
  });
});

// Middleware for routes not found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

module.exports = app;