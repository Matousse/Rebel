const User = require('./userModel');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const { sendTokenResponse } = require('../../utils/responseUtils');

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
exports.registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password, isArtist } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    // Check if username is taken
    user = await User.findOne({ username });

    if (user) {
      return res.status(400).json({
        success: false,
        message: 'This username is already taken'
      });
    }

    // Create user
    user = await User.create({
      username,
      email,
      password,
      isArtist: isArtist || false
    });

    // Generate token and respond
    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// @desc    Login a user
// @route   POST /api/users/login
// @access  Public
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  // Validate inputs
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide an email and password'
    });
  }

  try {
    // Check if user exists
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token and respond
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('following', 'username profilePicture')
      .populate('followers', 'username profilePicture');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error retrieving profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving profile'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
  try {
    const { username, email, bio, location, website, isArtist } = req.body;
    
    // Build update object
    const updateFields = {};
    if (username) updateFields.username = username;
    if (email) updateFields.email = email;
    if (bio !== undefined) updateFields.bio = bio;
    if (location !== undefined) updateFields.location = location;
    if (website !== undefined) updateFields.website = website;
    if (isArtist !== undefined) updateFields.isArtist = isArtist;

    // If a new file was uploaded, update profile picture
    if (req.file) {
      updateFields.profilePicture = req.file.filename;
      
      // Delete old picture if it exists and is not the default
      const user = await User.findById(req.user.id);
      if (user.profilePicture && user.profilePicture !== 'default-avatar.jpg') {
        const imagePath = path.join(__dirname, '../../../public/uploads/profiles', user.profilePicture);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Public
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('following', 'username profilePicture')
      .populate('followers', 'username profilePicture')
      .select('-__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error retrieving user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving user'
    });
  }
};

// @desc    Follow a user
// @route   POST /api/users/follow/:userId
// @access  Private
exports.followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.userId);
    
    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: 'User to follow not found'
      });
    }
    
    if (req.user.id === req.params.userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself'
      });
    }

    // Use model method to follow user
    await req.user.followUser(req.params.userId);

    res.status(200).json({
      success: true,
      message: 'User followed successfully'
    });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while following user'
    });
  }
};

// @desc    Unfollow a user
// @route   DELETE /api/users/follow/:userId
// @access  Private
exports.unfollowUser = async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.userId);
    
    if (!userToUnfollow) {
      return res.status(404).json({
        success: false,
        message: 'User to unfollow not found'
      });
    }

    // Use model method to unfollow user
    await req.user.unfollowUser(req.params.userId);

    res.status(200).json({
      success: true,
      message: 'You are no longer following this user'
    });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while unfollowing user'
    });
  }
};

// @desc    Like a track
// @route   POST /api/users/likes/:trackId
// @access  Private
exports.likeTrack = async (req, res) => {
  try {
    // Note: We're skipping track validation for now since the Track model might not be fully set up
    // In a production environment, you would want to verify the track exists first
    
    // Add track to user's favorites
    await req.user.likeTrack(req.params.trackId);

    res.status(200).json({
      success: true,
      message: 'Track added to favorites'
    });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding to favorites'
    });
  }
};

// @desc    Remove a track from favorites
// @route   DELETE /api/users/likes/:trackId
// @access  Private
exports.unlikeTrack = async (req, res) => {
  try {
    // Remove track from user's favorites
    await req.user.unlikeTrack(req.params.trackId);

    res.status(200).json({
      success: true,
      message: 'Track removed from favorites'
    });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing from favorites'
    });
  }
};

// @desc    Get tracks liked by the user
// @route   GET /api/users/:id/likes
// @access  Public
exports.getUserLikes = async (req, res) => {
  try {
    // First find the user without populating
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Try to populate tracks if possible
    try {
      const populatedUser = await User.findById(req.params.id).populate('likedTracks');
      
      return res.status(200).json({
        success: true,
        count: populatedUser.likedTracks.length,
        data: populatedUser.likedTracks
      });
    } catch (populateError) {
      // If population fails, just return the track IDs
      console.error('Error populating tracks:', populateError);
      return res.status(200).json({
        success: true,
        count: user.likedTracks.length,
        data: user.likedTracks,
        note: 'Only track IDs available, full track details could not be populated'
      });
    }
  } catch (error) {
    console.error('Error retrieving favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving favorites'
    });
  }
};