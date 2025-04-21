const User = require('../../models/User'); // Ajustez selon votre chemin d'accès au modèle User
const { accountService } = require('../../account-abstraction');

/**
 * @desc    Authentifier via Magic.link et créer un utilisateur si nécessaire
 * @route   POST /api/auth/magic
 * @access  Public
 */
exports.magicAuth = async (req, res) => {
  try {
    // Récupérer le DID token et le nom d'utilisateur optionnel
    const { didToken, username } = req.body;
    
    if (!didToken) {
      return res.status(400).json({
        success: false,
        message: 'Token Magic manquant'
      });
    }
    
    // Authentifier avec Magic.link via notre service Account Abstraction
    const { user, isNewUser, transaction } = await accountService.authenticateUser(didToken, username);
    
    if (isNewUser) {
      // Vérifier si l'email existe déjà dans notre base de données (optionnel)
      if (user.email) {
        const existingUser = await User.findOne({ email: user.email });
        
        if (existingUser) {
          // Mise à jour avec les informations Magic
          existingUser.solanaPublicKey = user.publicKey;
          existingUser.magicIssuerId = user.magicIssuer;
          existingUser.aaUserId = user.id;
          await existingUser.save();
          
          return res.status(200).json({
            success: true,
            user: {
              id: existingUser._id,
              username: existingUser.username,
              email: existingUser.email,
              solanaAddress: user.publicKey,
              aaUserId: user.id
            },
            isNewUser: false
          });
        }
      }
      
      // Créer un nouvel utilisateur dans la base de données
      const newUser = new User({
        username: user.username,
        email: user.email,
        solanaPublicKey: user.publicKey,
        magicIssuerId: user.magicIssuer,
        aaUserId: user.id,
        // Pas besoin de mot de passe avec Magic.link, mais si le modèle l'exige,
        // vous pouvez générer un mot de passe aléatoire sécurisé
        password: require('crypto').randomBytes(16).toString('hex')
      });
      
      await newUser.save();
      
      return res.status(201).json({
        success: true,
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          solanaAddress: user.publicKey,
          aaUserId: user.id
        },
        isNewUser: true
      });
    } else {
      // Utilisateur existant dans le système AA, vérifier dans la base de données
      const dbUser = await User.findOne({ aaUserId: user.id });
      
      if (!dbUser && user.email) {
        // Essayer de trouver par email
        const emailUser = await User.findOne({ email: user.email });
        
        if (emailUser) {
          // Mettre à jour avec les informations AA
          emailUser.solanaPublicKey = user.publicKey;
          emailUser.magicIssuerId = user.magicIssuer;
          emailUser.aaUserId = user.id;
          await emailUser.save();
          
          return res.status(200).json({
            success: true,
            user: {
              id: emailUser._id,
              username: emailUser.username,
              email: emailUser.email,
              solanaAddress: user.publicKey,
              aaUserId: user.id
            },
            isNewUser: false
          });
        } else {
          // Créer un nouvel utilisateur dans la BD même si l'AA le connaît déjà
          const newUser = new User({
            username: user.username,
            email: user.email,
            solanaPublicKey: user.publicKey,
            magicIssuerId: user.magicIssuer,
            aaUserId: user.id,
            password: require('crypto').randomBytes(16).toString('hex')
          });
          
          await newUser.save();
          
          return res.status(201).json({
            success: true,
            user: {
              id: newUser._id,
              username: newUser.username,
              email: newUser.email,
              solanaAddress: user.publicKey,
              aaUserId: user.id
            },
            isNewUser: true
          });
        }
      }
      
      // Utilisateur existant aussi dans la BD
      if (dbUser) {
        return res.status(200).json({
          success: true,
          user: {
            id: dbUser._id,
            username: dbUser.username,
            email: dbUser.email,
            solanaAddress: user.publicKey,
            aaUserId: user.id
          },
          isNewUser: false
        });
      } else {
        // Cas rare: utilisateur dans l'AA mais pas dans la BD
        return res.status(400).json({
          success: false,
          message: 'Utilisateur inconsistant entre systèmes'
        });
      }
    }
  } catch (error) {
    console.error('Erreur lors de l\'authentification Magic:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur du serveur lors de l\'authentification',
      error: error.message
    });
  }
};

/**
 * @desc    Déconnecter un utilisateur
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = async (req, res) => {
  try {
    // L'utilisateur est identifié via le middleware verifyMagicToken
    if (!req.magicUser || !req.magicUser.isRegistered || !req.magicUser.userId) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }
    
    // Déconnecter avec l'AA
    const logoutSuccessful = await accountService.logoutUser(req.magicUser.userId);
    
    // Si besoin, effectuer d'autres opérations de déconnexion spécifiques à votre app
    
    return res.status(200).json({
      success: true,
      message: 'Déconnexion réussie'
    });
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la déconnexion',
      error: error.message
    });
  }
};

/**
 * @desc    Obtenir le solde Solana de l'utilisateur
 * @route   GET /api/auth/solana-balance
 * @access  Private
 */
exports.getSolanaBalance = async (req, res) => {
  try {
    // L'utilisateur est identifié via le middleware verifyMagicToken
    if (!req.magicUser || !req.magicUser.isRegistered || !req.magicUser.userId) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }
    
    // Récupérer le solde via l'AA
    const balance = await accountService.getUserSolBalance(req.magicUser.userId);
    
    return res.status(200).json({
      success: true,
      data: {
        balance,
        publicKey: req.magicUser.publicAddress
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du solde:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du solde',
      error: error.message
    });
  }
};

/**
 * @desc    Enregistrer la participation à un challenge
 * @route   POST /api/auth/participate
 * @access  Private
 */
exports.participateInChallenge = async (req, res) => {
  try {
    // L'utilisateur est identifié via le middleware verifyMagicToken
    if (!req.magicUser || !req.magicUser.isRegistered || !req.magicUser.userId) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }
    
    const { challengeId } = req.body;
    
    if (!challengeId) {
      return res.status(400).json({
        success: false,
        message: 'ID du challenge manquant'
      });
    }
    
    // Enregistrer la participation via l'AA
    const transaction = await accountService.participateInChallenge(
      req.magicUser.userId,
      challengeId
    );
    
    return res.status(200).json({
      success: true,
      data: {
        transactionId: transaction.id,
        timestamp: transaction.timestamp,
        status: transaction.status
      }
    });
  } catch (error) {
    console.error('Erreur lors de la participation au challenge:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la participation au challenge',
      error: error.message
    });
  }
};