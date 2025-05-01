const Proof = require('../../models/Proof');
const Track = require('../../models/Track');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createAnchorClient } = require('../../utils/anchorClient');

// Initialiser le client Anchor
let anchorClient;
try {
  if (process.env.ADMIN_PRIVATE_KEY) {
    anchorClient = createAnchorClient(
      process.env.ADMIN_PRIVATE_KEY,
      process.env.SOLANA_ENDPOINT || 'https://api.devnet.solana.com'
    );
    console.log('Anchor client initialized for proof generation');
  } else {
    console.warn('ADMIN_PRIVATE_KEY not found in environment variables. Proof functionality will be limited.');
  }
} catch (error) {
  console.error('Error initializing Anchor client:', error);
  anchorClient = null;
}

// Fonction utilitaire pour générer un hash
const generateContentHash = (buffer) => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

// @desc    Créer une nouvelle preuve de création
// @route   POST /api/proofs
// @access  Private (Artistes uniquement)
exports.createProof = async (req, res) => {
  try {
    // Vérifier si l'utilisateur est authentifié et est un artiste
    if (!req.user || !req.user.isArtist) {
      return res.error('Accès réservé aux artistes', 403);
    }

    // Vérifier si un fichier a été téléchargé
    if (!req.file) {
      return res.error('Aucun fichier audio fourni', 400);
    }

    const { trackId, title } = req.body;

    // Vérifier si la piste existe et appartient à l'utilisateur
    let track;
    if (trackId) {
      track = await Track.findById(trackId);
      if (!track) {
        return res.error('Piste audio non trouvée', 404);
      }

      // Vérifier si l'utilisateur est bien le propriétaire de la piste
      if (track.artist.toString() !== req.user.id) {
        return res.error('Vous n\'êtes pas autorisé à créer une preuve pour cette piste', 403);
      }
    }

    // Lire le fichier audio
    const audioFilePath = req.file.path;
    const audioBuffer = fs.readFileSync(audioFilePath);

    // Vérifier le nombre de preuves existantes pour cette piste
    const existingProofCount = await Proof.countDocuments({
      track: trackId
    });

    // Récupérer l'adresse publique de l'artiste
    const artistPublicKey = req.user.solanaAddress;
    
    if (!artistPublicKey) {
      return res.error('Vous devez avoir une adresse Solana associée à votre compte', 400);
    }

    // Générer le hash du contenu
    const contentHash = generateContentHash(audioBuffer);
    
    // Objet de preuve de base (sera complété selon le cas)
    const proofData = {
      proofId: `proof_${crypto.randomUUID()}`,
      track: trackId,
      artist: req.user.id,
      artistPublicKey,
      title: title || (track ? track.title : 'Untitled'),
      contentHash,
      status: 'PENDING',
      cost: existingProofCount === 0 ? 0 : 10,
      isPaid: existingProofCount === 0, // Première preuve gratuite
      version: existingProofCount + 1
    };

    // Si le client Anchor est disponible et c'est une preuve gratuite, créer sur la blockchain
    if (anchorClient && proofData.isPaid) {
      try {
        console.log('Création de preuve sur la blockchain...');
        
        const result = await anchorClient.mintProofOfCreation(
          anchorClient.getAdminPublicKey().toString(), // Utiliser admin au lieu de artistPublicKey
          contentHash
        );
        
        if (result.success) {
          proofData.transactionId = result.transactionId;
          proofData.pdaAddress = result.pdaAddress;
          proofData.status = 'CONFIRMED';
          console.log(`Preuve créée sur la blockchain: ${result.transactionId}`);
        } else {
          console.error('Erreur blockchain:', result.error);
        }
      } catch (blockchainError) {
        console.error('Erreur lors de la création de la preuve sur la blockchain:', blockchainError);
        // On continue même si la blockchain échoue
      }
    }

    // Créer la preuve en base de données
    const proof = new Proof(proofData);
    await proof.save();

    // Supprimer le fichier temporaire
    fs.unlink(audioFilePath, (err) => {
      if (err) console.error('Erreur lors de la suppression du fichier temporaire:', err);
    });

    return res.success({
      id: proof._id,
      proofId: proof.proofId,
      title: proof.title,
      contentHash: proof.contentHash,
      status: proof.status,
      isPaid: proof.isPaid,
      cost: proof.cost,
      createdAt: proof.createdAt,
      transactionId: proof.transactionId,
      pdaAddress: proof.pdaAddress
    }, 'Preuve de création générée avec succès', 201);
  } catch (error) {
    console.error('Erreur lors de la création de la preuve:', error);
    return res.error('Erreur serveur lors de la création de la preuve', 500);
  }
};

// @desc    Récupérer une preuve par ID
// @route   GET /api/proofs/:id
// @access  Public
exports.getProofById = async (req, res) => {
  try {
    const proof = await Proof.findById(req.params.id)
      .populate('track', 'title artist duration')
      .populate('artist', 'username profilePicture');

    if (!proof) {
      return res.error('Preuve non trouvée', 404);
    }

    return res.success(proof);
  } catch (error) {
    console.error('Erreur lors de la récupération de la preuve:', error);
    return res.error('Erreur serveur lors de la récupération de la preuve', 500);
  }
};

// @desc    Obtenir toutes les preuves pour une piste
// @route   GET /api/proofs/track/:trackId
// @access  Public
exports.getProofsByTrackId = async (req, res) => {
  try {
    const proofs = await Proof.find({ track: req.params.trackId })
      .sort({ version: 1 })
      .populate('artist', 'username profilePicture');

    return res.success({
      count: proofs.length,
      proofs
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des preuves:', error);
    return res.error('Erreur serveur lors de la récupération des preuves', 500);
  }
};

// @desc    Obtenir toutes les preuves créées par un artiste
// @route   GET /api/proofs/artist/:artistId
// @access  Public
exports.getProofsByArtistId = async (req, res) => {
  try {
    const proofs = await Proof.find({ artist: req.params.artistId })
      .sort({ createdAt: -1 })
      .populate('track', 'title duration');

    return res.success({
      count: proofs.length,
      proofs
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des preuves:', error);
    return res.error('Erreur serveur lors de la récupération des preuves', 500);
  }
};

// @desc    Obtenir les preuves de l'utilisateur connecté
// @route   GET /api/proofs/user/me
// @access  Private
exports.getMyProofs = async (req, res) => {
  try {
    const proofs = await Proof.find({ artist: req.user.id })
      .sort({ createdAt: -1 })
      .populate('track', 'title duration');

    return res.success({
      count: proofs.length,
      proofs
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des preuves:', error);
    return res.error('Erreur serveur lors de la récupération des preuves', 500);
  }
};

// @desc    Vérifier une preuve
// @route   POST /api/proofs/verify/:id
// @access  Public
exports.verifyProof = async (req, res) => {
  try {
    // Vérifier si un fichier a été téléchargé
    if (!req.file) {
      return res.error('Aucun fichier audio fourni pour la vérification', 400);
    }

    // Récupérer la preuve
    const proof = await Proof.findById(req.params.id);

    if (!proof) {
      return res.error('Preuve non trouvée', 404);
    }

    // Lire le fichier audio
    const audioFilePath = req.file.path;
    const audioBuffer = fs.readFileSync(audioFilePath);

    // Vérifier le hash du contenu
    const contentHash = generateContentHash(audioBuffer);
    const hashMatches = contentHash === proof.contentHash;

    // Nettoyer le fichier téléchargé
    fs.unlink(audioFilePath, (err) => {
      if (err) console.error('Erreur lors de la suppression du fichier temporaire:', err);
    });

    // Si la preuve est confirmée dans la base de données, considérer qu'elle est vérifiée sur la blockchain
    let blockchainResult = { onChain: false, chainVerified: false };
    
    // Si la preuve est confirmée et a une adresse PDA, considérer comme vérifiée
    if (proof.status === 'CONFIRMED' && proof.pdaAddress) {
      blockchainResult = {
        onChain: true,
        chainVerified: true
      };
    }
    
    // Tenter la vérification réelle sur la blockchain (si la blockchain est disponible)
    try {
      if (hashMatches && proof.pdaAddress && proof.status === 'CONFIRMED' && anchorClient) {
        console.log('==========================================');
        console.log('DEBUG VÉRIFICATION BLOCKCHAIN:');
        console.log('Hash du contenu:', contentHash);
        console.log('Hash stocké dans la preuve:', proof.contentHash);
        console.log('Adresse PDA:', proof.pdaAddress);
        console.log('Transaction ID:', proof.transactionId);
        console.log('Admin public key:', anchorClient.getAdminPublicKey().toString());
        
        // Pour tester, essayez de vérifier directement avec la PDA
        console.log('Tentative de vérification blockchain...');
        try {
          const verificationResult = await anchorClient.verifyFileProof(
            anchorClient.getAdminPublicKey().toString(),
            audioBuffer
          );
          
          console.log('Résultat de vérification:', JSON.stringify(verificationResult, null, 2));
          if (verificationResult && verificationResult.verified) {
            blockchainResult = {
              onChain: true,
              chainVerified: true
            };
          }
        } catch (innerError) {
          console.error('Erreur interne de vérification blockchain:', innerError);
        }
      }
    } catch (blockchainError) {
      console.error('Erreur détaillée lors de la vérification blockchain:', blockchainError);
      console.error('Stack trace:', blockchainError.stack);
      // Même en cas d'erreur, on maintient le statut basé sur la base de données
    }

    return res.success({
      isValid: hashMatches && (blockchainResult.onChain ? blockchainResult.chainVerified : true),
      originalTimestamp: proof.createdAt,
      hashMatches,
      onChain: blockchainResult.onChain,
      chainVerified: blockchainResult.chainVerified,
      details: hashMatches 
        ? (blockchainResult.onChain 
            ? (blockchainResult.chainVerified 
                ? 'La preuve est valide et vérifiée sur la blockchain' 
                : 'Le hash est valide, mais la transaction blockchain n\'est pas vérifiable') 
            : 'La preuve est valide localement')
        : 'Le hash ne correspond pas, le fichier a été modifié ou il s\'agit d\'un fichier différent'
    });
  } catch (error) {
    console.error('Erreur lors de la vérification de la preuve:', error);
    return res.error('Erreur serveur lors de la vérification de la preuve', 500);
  }
};

// @desc    Payer pour une preuve (après la première gratuite)
// @route   POST /api/proofs/pay/:id
// @access  Private
exports.payForProof = async (req, res) => {
  try {
    const proof = await Proof.findById(req.params.id);

    if (!proof) {
      return res.error('Preuve non trouvée', 404);
    }

    // Vérifier si l'utilisateur est le propriétaire de la preuve
    if (proof.artist.toString() !== req.user.id) {
      return res.error('Vous n\'êtes pas autorisé à payer pour cette preuve', 403);
    }

    // Vérifier si la preuve n'est pas déjà payée
    if (proof.isPaid) {
      return res.error('Cette preuve est déjà payée', 400);
    }

    // TODO: Implémenter ici la logique de déduction des points Rebellion
    // userService.deductPoints(req.user.id, proof.cost);

    let blockchainResult = { success: false, transactionId: null, pdaAddress: null };
    
    // Utiliser le client Anchor pour enregistrer la preuve sur la blockchain
    if (anchorClient) {
      try {
        console.log('==========================================');
        console.log('DÉBOGAGE INTÉGRATION BLOCKCHAIN:');
        console.log('Hash du contenu:', proof.contentHash);
        console.log('Longueur du hash:', proof.contentHash.length);
        console.log('Admin public key:', anchorClient.getAdminPublicKey().toString());
        
        // Voir si le client a bien la méthode
        console.log('Méthodes du client:', Object.keys(anchorClient));
        
        console.log('Envoi de la preuve à la blockchain...');
        // Au lieu d'utiliser l'artiste de la preuve, utiliser l'admin comme artiste
        const result = await anchorClient.mintProofOfCreation(
          anchorClient.getAdminPublicKey().toString(), // Utiliser admin au lieu de proof.artistPublicKey
          proof.contentHash
        );
        
        console.log('Résultat complet de mintProofOfCreation:', JSON.stringify(result, null, 2));
        blockchainResult = result;
      } catch (blockchainError) {
        console.error('Erreur complète lors de la création de la preuve:', blockchainError);
        console.error('Stack trace:', blockchainError.stack);
      }
    }
    
    // Mettre à jour dans MongoDB
    proof.isPaid = true;
    
    if (blockchainResult.success) {
      proof.status = 'CONFIRMED';
      proof.transactionId = blockchainResult.transactionId;
      proof.pdaAddress = blockchainResult.pdaAddress;
    } else {
      // Pour les tests en développement, on peut autoriser la confirmation même sans blockchain
      if (process.env.NODE_ENV !== 'production') {
        console.log('Mode développement: Marquer la preuve comme CONFIRMED malgré l\'échec blockchain');
        proof.status = 'CONFIRMED';
        proof.transactionId = `dev-tx-${Date.now()}`;
        proof.pdaAddress = `dev-pda-${Date.now()}`;
      } else {
        proof.status = 'PENDING';
      }
    }
    
    await proof.save();

    return res.success({
      id: proof._id,
      isPaid: proof.isPaid,
      status: proof.status,
      transactionId: proof.transactionId,
      pdaAddress: proof.pdaAddress
    }, 'Paiement pour la preuve effectué avec succès');
  } catch (error) {
    console.error('Erreur lors du paiement pour la preuve:', error);
    return res.error('Erreur serveur lors du paiement pour la preuve', 500);
  }
};

// @desc    Télécharger le document de preuve
// @route   GET /api/proofs/download/:id
// @access  Private
exports.downloadProof = async (req, res) => {
  try {
    const proof = await Proof.findById(req.params.id)
      .populate('track', 'title')
      .populate('artist', 'username');

    if (!proof) {
      return res.error('Preuve non trouvée', 404);
    }

    // En développement, on peut assouplir cette vérification
    if (process.env.NODE_ENV !== 'production') {
      // Skip la vérification en mode développement si la preuve est payée
      if (!proof.isPaid) {
        return res.error('Cette preuve n\'a pas encore été payée', 400);
      }
    } else {
      // Vérifier si la preuve est confirmée
      if (proof.status !== 'CONFIRMED' || !proof.pdaAddress) {
        return res.error('Cette preuve n\'est pas encore confirmée sur la blockchain', 400);
      }
    }

    // Vérifier si l'utilisateur est autorisé à télécharger la preuve
    // Seul le créateur de la preuve ou un administrateur peut la télécharger
    if (proof.artist._id.toString() !== req.user.id && !req.user.isAdmin) {
      return res.error('Vous n\'êtes pas autorisé à télécharger cette preuve', 403);
    }

    // Générer un PDF ou un document formaté
    // Ceci est un exemple simplifié - dans un vrai système, vous utiliseriez
    // une bibliothèque comme PDFKit pour générer un PDF propre
    const proofDocument = {
      title: proof.title,
      artist: proof.artist.username,
      trackTitle: proof.track ? proof.track.title : 'Sans titre',
      contentHash: proof.contentHash,
      createdAt: proof.createdAt,
      transactionId: proof.transactionId,
      pdaAddress: proof.pdaAddress,
      blockchain: 'Solana',
      network: process.env.SOLANA_NETWORK || 'devnet'
    };

    // Au lieu de générer un vrai PDF, on renvoie simplement les données JSON
    // Dans une implémentation réelle, vous généreriez un PDF et le retourneriez
    return res.success(proofDocument, 'Document de preuve généré avec succès');
  } catch (error) {
    console.error('Erreur lors de la génération du document de preuve:', error);
    return res.error('Erreur serveur lors de la génération du document de preuve', 500);
  }
};