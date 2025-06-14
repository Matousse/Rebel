// src/app.js
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
const proofRoutes = require('./modules/proof/proofRoutes');
const trackRoutes = require('./modules/tracks/trackRoutes')
const responseMiddleware = require('./middleware/responseMiddleware');
// Load environment variables
dotenv.config();

// Import Track model to ensure it's registered with Mongoose
const Track = require('./models/Track');
const Proof = require('./models/Proof');

// Import response utilities
const { successResponse, errorResponse } = require('./utils/responseUtils');

// Import module routes
const userRoutes = require('./modules/user/userRoutes');
const magicRoutes = require('./modules/magic/magicRoutes'); // Ajout des routes Magic

// Initialize Express application
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(helmet()); // HTTP Security
app.use(responseMiddleware);

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Sert explicitement le fichier sonicMapData.json à la racine
app.use('/sonicMapData.json', express.static(path.join(__dirname, '../public/sonicMapData.json')));

// Serve Play module static files
app.use('/play', express.static(path.join(__dirname, 'modules/play')));

// Autoriser l'affichage de /sonic-map en iframe depuis localhost:3000
app.use('/sonic-map', (req, res, next) => {
  res.setHeader('X-Frame-Options', 'ALLOW-FROM http://localhost:3000');
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Content-Security-Policy',
    "frame-ancestors 'self' http://localhost:3000;"
  );
  next();
});
// Helmet CSP spécifique pour la Sonic-map
app.use('/sonic-map', require('helmet')({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://cdn.babylonjs.com'
      ],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://assets.babylonjs.com"],
      connectSrc: ["'self'", 'https://cdn.babylonjs.com'],
      fontSrc: ["'self'", "https://cdn.babylonjs.com"],
      objectSrc: ["'none'"],
      frameAncestors: ["'self'", 'http://localhost:3000']
    }
  }
}));
// Serve Sonic-map static files
app.use('/sonic-map', express.static(path.join(__dirname, '../public/sonic-map')));

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/magic', magicRoutes); // Utilisation des routes Magic
app.use('/api/tracks', trackRoutes); 
// Root route
app.get('/', (req, res) => {
  res.success({ name: 'Rebellion Music API', version: '1.0.0' }, 'Welcome to the Rebellion music platform API');
});

// API Status route
app.get('/api/status', (req, res) => {
  res.success({
    status: 'ok',
    time: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Ajouter les routes API pour proofs
app.use('/api/proofs', proofRoutes);


// Account Abstraction Status route
app.get('/api/aa-status', (req, res) => {
  try {
    const { accountService } = require('../dist/account-abstraction');
    res.success({
      status: 'ok',
      solanaNetwork: process.env.SOLANA_NETWORK || 'devnet',
      adminPublicKey: accountService.solanaService.getAdminKeypair().publicKey.toString()
    });
  } catch (error) {
    console.error('Error in AA status check:', error);
    res.error('Account Abstraction service unavailable', 500);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`[ERROR ${req.id}]:`, err);
  
  // Format the error response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Server error';
  const errors = err.errors || null;
  
  return errorResponse(res, statusCode, message, errors);
});

// Middleware for routes not found
app.use((req, res) => {
  return errorResponse(res, 404, 'Route not found');
});

module.exports = app;