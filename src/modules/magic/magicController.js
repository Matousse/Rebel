const User = require('../../modules/user/userModel');
const { accountService } = require('../../../dist/account-abstraction');
const { sendTokenResponse } = require('../../utils/responseUtils');

exports.magicAuth = async (req, res) => {
  try {
    const { didToken, username } = req.body;
    
    if (!didToken) {
      return res.status(400).json({
        success: false,
        message: 'Magic token missing'
      });
    }
    
    // Utiliser l'AA pour authentifier
    const { user: aaUser, isNewUser } = await accountService.authenticateUser(didToken, username);
    
    // Vérifier si l'utilisateur existe dans la BD
    let dbUser = await User.findOne({ email: aaUser.email });
    
    if (!dbUser) {
      // Créer nouvel utilisateur
      dbUser = new User({
        username: aaUser.username,
        email: aaUser.email,
        password: require('crypto').randomBytes(16).toString('hex'), // Password requis par le modèle
        solanaAddress: aaUser.publicKey,
        magicIssuerId: aaUser.magicIssuer
      });
      await dbUser.save();
    } else {
      // Mettre à jour infos Solana
      dbUser.solanaAddress = aaUser.publicKey;
      dbUser.magicIssuerId = aaUser.magicIssuer;
      await dbUser.save();
    }
    
    // Créer et retourner le token JWT
    sendTokenResponse(dbUser, isNewUser ? 201 : 200, res);
  } catch (error) {
    console.error('Error in Magic authentication:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication',
      error: error.message
    });
  }
};

// Ajouter un endpoint pour récupérer l'adresse wallet
exports.getWalletAddress = async (req, res) => {
  try {
    // Récupérer l'utilisateur depuis req.user (ajouté par middleware)
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
        solanaAddress: user.solanaAddress || 'Not available',
        // Récupérer le solde si disponible
        balance: user.solanaAddress 
          ? await accountService.getUserSolBalance(user.solanaAddress) 
          : 0
      }
    });
  } catch (error) {
    console.error('Error retrieving wallet address:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving wallet info'
    });
  }
};