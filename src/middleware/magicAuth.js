/**
 * Magic Authentication Middleware for Account Abstraction
 */
const { accountService } = require('../../dist/account-abstraction');
const { MagicAuthService } = require('../../dist/account-abstraction/services/magic-auth-service');
const User = require('../modules/user/userModel');
const { errorResponse } = require('../utils/responseUtils');
const magicService = new MagicAuthService();

/**
 * Verifies Magic token and adds user to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.verifyMagicToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return errorResponse(res, 401, 'Authentication token missing');
    }
    
    // Validate Magic token
    const isValid = await magicService.validateToken(token);
    if (!isValid) {
      return errorResponse(res, 401, 'Invalid Magic token');
    }
    
    // Get user metadata from Magic
    const metadata = await magicService.getUserMetadata(token);
    if (!metadata.issuer) {
      return errorResponse(res, 401, 'Invalid Magic user');
    }
    
    // Find user in database by issuer ID
    let user = await User.findOne({ magicIssuerId: metadata.issuer });
    
    // If user not found by issuer ID, try by email
    if (!user && metadata.email) {
      user = await User.findOne({ email: metadata.email });
      
      if (user) {
        // Update user with Magic issuer ID
        user.magicIssuerId = metadata.issuer;
        
        // Add Solana address if user doesn't have one
        if (!user.solanaAddress && metadata.publicAddress) {
          user.solanaAddress = metadata.publicAddress;
        }
        
        await user.save();
      } else {
        // With Magic Login, we could auto-create users, but this requires a username
        return errorResponse(res, 401, 'User not found. Please register first.');
      }
    } else if (user) {
      // Update Solana address if it changed
      if (metadata.publicAddress && user.solanaAddress !== metadata.publicAddress) {
        user.solanaAddress = metadata.publicAddress;
        await user.save();
      }
    } else {
      return errorResponse(res, 401, 'User not found');
    }
    
    // Add user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Magic middleware error:', error);
    return errorResponse(res, 401, 'Authentication failed');
  }
};

/**
 * Combined authentication middleware that tries JWT first, then Magic
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.authenticateUser = async (req, res, next) => {
  // Try JWT first
  const jwtProtect = require('./authMiddleware').protect;
  
  try {
    // Use JWT authentication
    await new Promise((resolve) => {
      jwtProtect(req, res, (err) => {
        // This indicates JWT couldn't find a token, so we'll try Magic next
        if (err === 'no-token') resolve(false);
        // JWT worked and the next middleware was called
        else resolve(true);
      });
    });
    
    // If JWT succeeded and user is set
    if (req.user) {
      return next();
    }
    
    // Otherwise try Magic Auth
    return await exports.verifyMagicToken(req, res, next);
  } catch (error) {
    console.error('Authentication error:', error);
    return errorResponse(res, 401, 'Authentication failed');
  }
};

/**
 * Legacy combined auth method - preserved for backward compatibility
 */
exports.combinedAuth = exports.authenticateUser;

/**
 * Middleware for Magic Login only (no JWT)
 * Useful for endpoints that specifically require Magic auth
 */
exports.magicOnly = async (req, res, next) => {
  try {
    await exports.verifyMagicToken(req, res, next);
  } catch (error) {
    console.error('Magic authentication error:', error);
    return errorResponse(res, 401, 'Magic authentication required');
  }
};