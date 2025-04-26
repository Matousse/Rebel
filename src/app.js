// src/app.js
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
dotenv.config();

// Import Track model to ensure it's registered with Mongoose
const Track = require('./models/Track');
const Proof = require('./models/Proof');

// Import response utilities
const { successResponse, errorResponse } = require('./utils/responseUtils');

// Import module routes
const userRoutes = require('./modules/user/userRoutes');
const magicRoutes = require('./modules/magic/magicRoutes');
const trackRoutes = require('./modules/tracks/trackRoutes');
// Importer les routes de proof
const proofRoutes = require('./modules/proof/proofRoutes');



// Initialize Express application
const app = express();

// Base middleware
app.use(helmet()); // HTTP Security
app.use(cors());

// Request ID middleware for tracking
app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Logging middleware
app.use(morgan('dev'));

// Body parsers
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false, limit: '2mb' }));

// Add response helpers to all routes
app.use((req, res, next) => {
  // Success response helper
  res.success = function(data = null, message = 'Success', statusCode = 200, meta = null) {
    return successResponse(res, statusCode, message, data, meta);
  };
  
  // Error response helper
  res.error = function(message = 'Error', statusCode = 500, errors = null) {
    return errorResponse(res, statusCode, message, errors);
  };
  
  next();
});

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/magic', magicRoutes);
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