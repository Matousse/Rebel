/**
 * Token JWT
 * @param {Object} user - User object
 * @param {Number} statusCode - HTTP response code
 * @param {Object} res - Express response Object
 */
exports.sendTokenResponse = (user, statusCode, res) => {
    // Create a token
    const token = user.getSignedJwtToken();
  
    res.status(statusCode).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        bio: user.bio,
        isArtist: user.isArtist
      }
    });
  };