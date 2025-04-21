const User = require('../../models/User');
const { sendTokenResponse } = require('../../utils/responseUtils');

// Ce code temporaire fonctionne sans l'AA pour démarrer
exports.magicAuth = async (req, res) => {
  try {
    const { email, username } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email required'
      });
    }
    
    // Pour le test, on crée simplement un utilisateur
    let user = await User.findOne({ email });
    
    if (!user) {
      user = new User({
        username: username || email.split('@')[0],
        email,
        password: require('crypto').randomBytes(16).toString('hex')
      });
      await user.save();
    }
    
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Magic auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};