const jwt = require('jsonwebtoken');
const User = require('../modules/user/userModel');
const { errorResponse } = require('../utils/responseUtils');

/**
 * Middleware to protect routes with JWT authentication
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const protect = async (req, res, next) => {
  let token;

  // Check if token is present in headers
  if (req.headers.authorization?.startsWith('Bearer')) {
    try {
      // Extract token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user and exclude password field
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return errorResponse(res, 401, 'User not found or deactivated');
      }
      
      // Update last active timestamp
      if (req.user.lastActive) {
        // Only update if more than 5 minutes have passed since last update
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (!req.user.lastActive || req.user.lastActive < fiveMinutesAgo) {
          try {
            // Update without awaiting to avoid slowing down requests
            User.findByIdAndUpdate(req.user._id, 
              { lastActive: new Date() }, 
              { new: false }
            ).exec();
          } catch (updateError) {
            // Just log the error, don't disrupt the request
            console.error('Error updating lastActive:', updateError);
          }
        }
      }
      
      return next();
    } catch (error) {
      console.error('JWT Authentication error:', error);
      
      if (error.name === 'TokenExpiredError') {
        return errorResponse(res, 401, 'Token expired, please login again');
      }
      
      return errorResponse(res, 401, 'Invalid authentication token');
    }
  }

  if (!token) {
    // Allow next middleware to try Magic Auth
    return next('no-token');
  }
};

/**
 * Middleware to check if user is an artist
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const artistOnly = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 401, 'Authentication required');
  }
  
  if (req.user.isArtist) {
    return next();
  } 
  
  return errorResponse(res, 403, 'Access restricted to artists only');
};

/**
 * Middleware to check if user has a Solana wallet
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireWallet = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 401, 'Authentication required');
  }
  
  if (req.user.solanaAddress) {
    return next();
  }
  
  return errorResponse(
    res, 
    403, 
    'This operation requires a Solana wallet. Please connect your wallet first.'
  );
};

module.exports = {
  protect,
  artistOnly,
  requireWallet
};