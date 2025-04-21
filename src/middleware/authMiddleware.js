const jwt = require('jsonwebtoken');
const User = require('../modules/user/userModel');

// Middleware to protect routes
const protect = async (req, res, next) => {
  let token;

  // Check if token is present in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Add user to request
      req.user = await User.findById(decoded.id);

      next();
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(401).json({
        success: false,
        message: 'Unauthorized, invalid token'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized, no token'
    });
  }
};

// Middleware to check if user is an artist
const artistOnly = (req, res, next) => {
  if (req.user && req.user.isArtist) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access restricted to artists only'
    });
  }
};

module.exports = {
  protect,
  artistOnly
};