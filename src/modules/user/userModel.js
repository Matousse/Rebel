const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
    trim: true,
    minlength: [3, "Username must be at least 3 characters"],
    maxlength: [30, "Username cannot exceed 30 characters"]
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  profilePicture: {
    type: String,
    default: 'default-avatar.jpg'
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likedTracks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Track'
  }],
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true
});

// Middleware to hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and return a JWT
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Method to add a track to favorites
UserSchema.methods.likeTrack = async function(trackId) {
  if (!this.likedTracks.includes(trackId)) {
    this.likedTracks.push(trackId);
    await this.save();
  }
  return this.likedTracks;
};

// Method to remove a track from favorites
UserSchema.methods.unlikeTrack = async function(trackId) {
  if (this.likedTracks.includes(trackId)) {
    this.likedTracks = this.likedTracks.filter(id => id.toString() !== trackId.toString());
    await this.save();
  }
  return this.likedTracks;
};

// Method to follow a user
UserSchema.methods.followUser = async function(userId) {
  if (userId.toString() === this._id.toString()) {
    throw new Error('A user cannot follow themselves');
  }
  
  if (!this.following.includes(userId)) {
    this.following.push(userId);
    await this.save();
    
    // Add current user to followers of the followed user
    const userToFollow = await this.model('User').findById(userId);
    if (userToFollow && !userToFollow.followers.includes(this._id)) {
      userToFollow.followers.push(this._id);
      await userToFollow.save();
    }
  }
  return this.following;
};

// Method to unfollow a user
UserSchema.methods.unfollowUser = async function(userId) {
  if (this.following.includes(userId)) {
    this.following = this.following.filter(id => id.toString() !== userId.toString());
    await this.save();
    
    // Remove current user from followers of the unfollowed user
    const userToUnfollow = await this.model('User').findById(userId);
    if (userToUnfollow) {
      userToUnfollow.followers = userToUnfollow.followers.filter(
        id => id.toString() !== this._id.toString()
      );
      await userToUnfollow.save();
    }
  }
  return this.following;
};

module.exports = mongoose.model('User', UserSchema);