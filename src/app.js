const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const proofRoutes = require('./modules/proof/proofRoutes');

// Load environment variables
dotenv.config();

// Import Track model to ensure it's registered with Mongoose
// Note: Don't import User model here as it's already imported elsewhere
const Track = require('./models/Track');

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

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/magic', magicRoutes); // Utilisation des routes Magic

//timestamp proof of creation generation route 
app.use('/api/proofs', proofRoutes);
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

const fs = require('fs');
const path = require('path');

const tempDirs = [
  path.join(__dirname, '../temp'),
  path.join(__dirname, '../temp/uploads'),
  path.join(__dirname, '../temp/proofs')
];

tempDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

module.exports = app;