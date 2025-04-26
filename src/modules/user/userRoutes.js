const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const multer = require('multer');
const path = require('path');

// Import controllers
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUserById,
  followUser,
  unfollowUser,
  likeTrack,
  unlikeTrack,
  getUserLikes,
  becomeArtist
} = require('./userController');

// Import authentication middleware
const { protect } = require('../../middleware/authMiddleware');

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../../public/uploads/profiles'));
  },
  filename: (req, file, cb) => {
    cb(null, `user-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only images
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('File must be an image'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// Public routes
router.post(
  '/register',
  [
    check('username', 'Username is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
  ],
  registerUser
);

router.post('/login', loginUser);

// Private routes (require authentication)
// Note: Specific routes must come before parameterized routes
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, upload.single('profilePicture'), updateUserProfile);
router.put('/become-artist', protect, becomeArtist);

// Routes for following
router.post('/follow/:userId', protect, followUser);
router.delete('/follow/:userId', protect, unfollowUser);

// Routes for likes
router.post('/likes/:trackId', protect, likeTrack);
router.delete('/likes/:trackId', protect, unlikeTrack);

// Parameterized routes - these must come after specific routes to avoid conflicts
router.get('/:id', getUserById);
router.get('/:id/likes', getUserLikes);

module.exports = router;