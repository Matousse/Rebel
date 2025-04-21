// src/middleware/magicAuth.js
const { accountService, MagicAuthService } = require('../account-abstraction');
const magicService = new MagicAuthService();

// Vérifie le token Magic et ajoute l'utilisateur à la requête
exports.verifyMagicToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing'
      });
    }
    
    const isValid = await magicService.validateToken(token);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Magic token'
      });
    }
    
    const metadata = await magicService.getUserMetadata(token);
    if (!metadata.issuer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Magic user'
      });
    }
    
    const user = accountService.getUserByMagicIssuer(metadata.issuer);
    if (user) {
      req.magicUser = user;
    }
    
    next();
  } catch (error) {
    console.error('Magic middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};