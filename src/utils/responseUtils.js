/**
 * Standard success response format
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Success message
 * @param {Object|Array} data - Response data
 * @param {Object} meta - Metadata like pagination
 */
exports.successResponse = (res, statusCode = 200, message = 'Success', data = null, meta = null) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString()
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  if (meta !== null) {
    response.meta = meta;
  }
  
  return res.status(statusCode).json(response);
};

/**
 * Standard error response format
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Error message
 * @param {Object} errors - Detailed validation errors
 */
exports.errorResponse = (res, statusCode = 500, message = 'Server error', errors = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };
  
  if (errors !== null) {
    response.errors = errors;
  }
  
  return res.status(statusCode).json(response);
};

/**
 * Token JWT
 * @param {Object} user - User object
 * @param {Number} statusCode - HTTP response code
 * @param {Object} res - Express response Object
 */
exports.sendTokenResponse = (user, statusCode, res) => {
  // Create a token
  const token = user.getSignedJwtToken();
  
  return exports.successResponse(res, statusCode, 'Authentication successful', {
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      bio: user.bio,
      isArtist: user.isArtist,
      solanaAddress: user.solanaAddress
    }
  });
};