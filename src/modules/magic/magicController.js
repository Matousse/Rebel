const User = require('../user/userModel');
const { accountService } = require('../../../dist/account-abstraction');
const { sendTokenResponse } = require('../../utils/responseUtils');

exports.magicAuth = async (req, res) => {
    try {
      const { didToken, username, email } = req.body;
      
      if (!didToken) {
        return res.status(400).json({
          success: false,
          message: 'Magic token missing'
        });
      }
      
      // Utiliser l'AA pour authentifier
      try {
        const { user: aaUser, isNewUser } = await accountService.authenticateUser(didToken, username);
        
        // Utiliser directement User (pas UserModel)
        let dbUser = await User.findOne({ email: email || aaUser.email });
        
        if (!dbUser) {
          // Créer nouvel utilisateur avec User (pas UserModel)
          dbUser = new User({
            username: username || aaUser.username,
            email: email || aaUser.email,
            password: require('crypto').randomBytes(16).toString('hex'),
            solanaAddress: aaUser.publicKey,
            magicIssuerId: aaUser.magicIssuer
          });
          await dbUser.save();
        } else {
          // Mettre à jour infos Solana
          if (aaUser.publicKey && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(aaUser.publicKey)) {
            dbUser.solanaAddress = aaUser.publicKey;
          }
          if (aaUser.magicIssuer) {
            dbUser.magicIssuerId = aaUser.magicIssuer;
          }
          await dbUser.save();
        }
        
        if (dbUser && typeof dbUser.getSignedJwtToken === 'function') {
            sendTokenResponse(dbUser, isNewUser ? 201 : 200, res);
          } else {
            // Cas où dbUser n'a pas la méthode getSignedJwtToken
            res.status(isNewUser ? 201 : 200).json({
              success: true,
              message: 'Authentification réussie',
              user: {
                id: dbUser._id || dbUser.id,
                username: dbUser.username,
                email: dbUser.email,
                solanaAddress: dbUser.publicKey || dbUser.solanaAddress
              }
            });
          }
      } catch (aaError) {
        console.warn("Erreur AA, fallback vers création utilisateur simple:", aaError);
        
        // Utiliser User directement (pas de réimportation)
        let dbUser = await User.findOne({ email });
        
        if (!dbUser) {
          dbUser = new User({
            username,
            email,
            password: require('crypto').randomBytes(16).toString('hex')
          });
          await dbUser.save();
        }
        
        if (dbUser && typeof dbUser.getSignedJwtToken === 'function') {
            sendTokenResponse(dbUser, 201, res);
          } else {
            res.status(201).json({
              success: true,
              message: 'Authentification réussie (fallback)',
              user: {
                id: dbUser._id || dbUser.id,
                username: dbUser.username,
                email: dbUser.email
              }
            });
          }
      }
    } catch (error) {
      console.error('Error in Magic authentication:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during authentication',
        error: error.message
      });
    }
  };

// La fonction getWalletAddress doit être définie en dehors de magicAuth
exports.getWalletAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        solanaAddress: user.solanaAddress || 'Not available'
      }
    });
  } catch (error) {
    console.error('Error retrieving wallet address:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving wallet address'
    });
  }
};