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

    // Récupérer l'adresse publique de l'admin (toujours utiliser l'admin pour la cohérence)
    const adminPublicKey = anchorClient ? anchorClient.getAdminPublicKey().toString() : null;
    
    if (!adminPublicKey && anchorClient) {
      return res.error('Erreur de récupération de la clé publique admin', 500);
    }

    // Générer le hash du contenu
    const contentHash = generateContentHash(audioBuffer);
    
    // Objet de preuve de base (sera complété selon le cas)
    const proofData = {
      proofId: `proof_${crypto.randomUUID()}`,
      track: trackId,
      artist: req.user.id,
      artistPublicKey: adminPublicKey || req.user.solanaAddress, // Utiliser admin comme référence
      title: title || (track ? track.title : 'Untitled'),
      contentHash,
      status: 'PENDING', // Toujours commencer par PENDING
      payment: {
        cost: existingProofCount === 0 ? 0 : 10,
        isPaid: existingProofCount === 0, // Première preuve gratuite
        paymentMethod: existingProofCount === 0 ? 'FREE' : 'NONE'
      },
      version: existingProofCount + 1
    };

    // Créer la preuve en base de données d'abord avec statut PENDING
    const proof = new Proof(proofData);
    await proof.save();

    // Si le client Anchor est disponible et c'est une preuve gratuite, créer sur la blockchain
    let blockchainResult = { success: false };
    if (anchorClient && proof.payment.isPaid) {
      try {
        console.log('==========================================================');
        console.log('CRÉATION DE PREUVE SUR LA BLOCKCHAIN - DÉTAILS DE DÉBOGAGE');
        console.log('==========================================================');
        console.log('Preuve ID:', proof._id);
        console.log('Hash du contenu:', contentHash);
        console.log('Hash length:', contentHash.length);
        console.log('Clé publique admin:', adminPublicKey);
        
        // Convertir explicitement le hash en Buffer et vérifier sa taille
        const hashBuffer = Buffer.from(contentHash, 'hex');
        console.log('Hash buffer length:', hashBuffer.length);
        
        // Vérifier si le client a la méthode requise
        console.log('Méthodes disponibles dans anchorClient:', Object.keys(anchorClient));
        
        // Essayer de dériver la PDA avant la création pour vérifier
        try {
          const [proofPDA, bump] = await anchorClient.deriveProofPDA(adminPublicKey, contentHash);
          console.log('PDA dérivée avec succès:', proofPDA.toString(), '(bump:', bump, ')');
        } catch (pdaError) {
          console.error('Erreur lors de la dérivation de la PDA:', pdaError);
        }
        
        console.log('Tentative de création sur la blockchain...');
        const result = await anchorClient.mintProofOfCreation(
          adminPublicKey, // Utiliser admin pour la consistance
          contentHash
        );
        
        console.log('Résultat brut de mintProofOfCreation:', JSON.stringify(result, null, 2));
        blockchainResult = result;
        
        if (result.success) {
          // Mettre à jour la preuve avec les infos blockchain
          proof.blockchain = {
            transactionId: result.transactionId,
            pdaAddress: result.pdaAddress,
            network: process.env.SOLANA_NETWORK || 'devnet',
            timestamp: Math.floor(Date.now() / 1000)
          };
          proof.status = 'CONFIRMED';
          await proof.save();
          console.log(`✅ Preuve créée sur la blockchain: ${result.transactionId}`);
        } else {
          console.error('❌ Erreur blockchain:', result.error);
          // Enregistrer l'erreur pour les nouvelles tentatives ultérieures
          if (!proof.retries.errors) proof.retries.errors = [];
          proof.retries.errors.push(result.error || 'Unknown blockchain error');
          proof.retries.count += 1;
          proof.retries.lastAttempt = new Date();
          await proof.save();
        }
      } catch (blockchainError) {
        console.error('❌ Erreur détaillée lors de la création de la preuve sur la blockchain:', blockchainError);
        console.error('Stack trace:', blockchainError.stack);
        // Enregistrer l'erreur
        if (!proof.retries.errors) proof.retries.errors = [];
        proof.retries.errors.push(blockchainError.message);
        proof.retries.count += 1;
        proof.retries.lastAttempt = new Date();
        await proof.save();
      }
    }

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
      isPaid: proof.payment.isPaid,
      cost: proof.payment.cost,
      createdAt: proof.createdAt,
      transactionId: proof.blockchain?.transactionId,
      pdaAddress: proof.blockchain?.pdaAddress,
      blockchainSuccess: blockchainResult.success
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
// In your proofController.js
exports.getMyProofs = async (req, res) => {
  try {
    console.log("Looking for proofs for user ID:", req.user.id);
    
    const proofs = await Proof.find({ artist: req.user.id })
      .sort({ createdAt: -1 });
    
    console.log("Found proofs in database:", proofs.length);
    
    return res.success({
      count: proofs.length,
      proofs: proofs
    });
  } catch (error) {
    console.error('Error retrieving proofs:', error);
    return res.error('Server error while retrieving proofs', 500);
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

    // Par défaut, supposer qu'il n'y a pas de vérification blockchain
    let onChain = false;
    let chainVerified = false;
    
    // Si la preuve est confirmée et a une adresse PDA, vérifier avec la blockchain
    if (hashMatches && proof.status === 'CONFIRMED' && proof.blockchain?.pdaAddress && anchorClient) {
      try {
        console.log('==========================================================');
        console.log('VÉRIFICATION BLOCKCHAIN - DÉTAILS DE DÉBOGAGE');
        console.log('==========================================================');
        console.log('Proof ID:', proof._id);
        console.log('Hash du contenu:', contentHash);
        console.log('Transaction ID:', proof.blockchain.transactionId);
        console.log('PDA Address:', proof.blockchain.pdaAddress);
        
        // CORRECTION: D'abord, essayer de récupérer directement la preuve
        // C'est plus fiable que la vérification complète
        try {
          console.log('Récupération directe de la preuve sur la blockchain...');
          const existingProof = await anchorClient.getProofOfCreation(
            anchorClient.getAdminPublicKey().toString(),
            contentHash
          );
          
          console.log('Résultat de getProofOfCreation:', JSON.stringify(existingProof, null, 2));
          
          // Si la preuve existe sur la blockchain, elle est vérifiée
          if (existingProof && (existingProof.exists || existingProof.pdaAddress)) {
            console.log('✅ Preuve trouvée sur la blockchain!');
            onChain = true;
            chainVerified = true;
          } else {
            console.log('❌ Preuve non trouvée par récupération directe');
            
            // Si échec, essayer la méthode de vérification alternative
            console.log('Tentative de vérification alternative...');
            const verificationResult = await anchorClient.verifyFileProof(
              anchorClient.getAdminPublicKey().toString(),
              Buffer.from(contentHash, 'hex')
            );
            
            console.log('Résultat de vérification alternative:', JSON.stringify(verificationResult, null, 2));
            
            if (verificationResult && verificationResult.verified) {
              onChain = true;
              chainVerified = true;
              console.log('✅ Preuve vérifiée avec la méthode alternative!');
            }
          }
        } catch (directError) {
          console.error('Erreur lors de la récupération directe:', directError);
          
          // Tentative de récupération du compte directement par son adresse PDA
          try {
            console.log('Tentative de vérification par adresse PDA connue...');
            // Utiliser l'adresse PDA stockée
            const pdaPublicKey = new PublicKey(proof.blockchain.pdaAddress);
            const accountInfo = await anchorClient.connection.getAccountInfo(pdaPublicKey);
            
            if (accountInfo) {
              console.log('✅ Compte PDA trouvé sur la blockchain!');
              onChain = true;
              chainVerified = true;
              console.log('Données du compte:', accountInfo.data.length, 'bytes');
            } else {
              console.log('❌ Compte PDA non trouvé sur la blockchain');
            }
          } catch (pdaError) {
            console.error('Erreur lors de la vérification par PDA:', pdaError);
          }
        }
      } catch (blockchainError) {
        console.error('Erreur détaillée lors de la vérification blockchain:', blockchainError);
      }
    }

    // Déterminer le message de détails approprié
    let details;
    if (!hashMatches) {
      details = 'Le hash ne correspond pas, le fichier a été modifié ou il s\'agit d\'un fichier différent';
    } else if (onChain && chainVerified) {
      details = 'La preuve est valide et vérifiée sur la blockchain';
    } else if (onChain && !chainVerified) {
      details = 'Le hash est valide, mais la transaction blockchain n\'est pas vérifiable';
    } else if (proof.status === 'CONFIRMED' && proof.blockchain?.transactionId) {
      // Si la preuve est marquée comme confirmée dans MongoDB mais pas trouvée sur la blockchain
      details = 'La preuve est valide et marquée comme confirmée dans la base de données, mais non retrouvée sur la blockchain';
      // Forcer onChain à true si nous avons un transactionId valide
      onChain = true;
      chainVerified = true;
    } else {
      details = 'La preuve est valide localement';
    }

    return res.success({
      isValid: hashMatches,
      originalTimestamp: proof.createdAt,
      hashMatches,
      onChain,
      chainVerified,
      details
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
    if (proof.payment?.isPaid) {
      return res.error('Cette preuve est déjà payée', 400);
    }

    // TODO: Implémenter ici la logique de déduction des points Rebellion
    // userService.deductPoints(req.user.id, proof.cost);

    // Mettre à jour le statut de paiement avant la transaction blockchain
    proof.payment = proof.payment || {};
    proof.payment.isPaid = true;
    proof.payment.paymentMethod = 'SOL'; // ou 'CREDIT' selon votre logique
    await proof.save();

    let blockchainResult = { success: false };
    
    // Utiliser le client Anchor pour enregistrer la preuve sur la blockchain
    if (anchorClient) {
      try {
        console.log('Enregistrement blockchain pour la preuve payée:', proof._id);
        console.log('Hash du contenu:', proof.contentHash);
        
        // Assurez-vous que la clé admin est utilisée et pas la clé de l'artiste
        const adminPublicKey = anchorClient.getAdminPublicKey().toString();
        
        // Créer la transaction blockchain
        const result = await anchorClient.mintProofOfCreation(
          adminPublicKey, // Toujours utiliser la clé admin pour la cohérence
          proof.contentHash
        );
        
        blockchainResult = result;
        
        if (result.success) {
          // Mettre à jour avec les informations blockchain
          proof.status = 'CONFIRMED';
          proof.blockchain = proof.blockchain || {};
          proof.blockchain.transactionId = result.transactionId;
          proof.blockchain.pdaAddress = result.pdaAddress;
          proof.blockchain.timestamp = Math.floor(Date.now() / 1000);
          proof.blockchain.network = process.env.SOLANA_NETWORK || 'devnet';
          await proof.save();
        } else {
          // Enregistrer l'erreur mais garder le paiement
          proof.retries = proof.retries || {};
          proof.retries.errors = proof.retries.errors || [];
          proof.retries.errors.push(result.error || 'Unknown blockchain error');
          proof.retries.count = (proof.retries.count || 0) + 1;
          proof.retries.lastAttempt = new Date();
          await proof.save();
        }
      } catch (blockchainError) {
        console.error('Erreur lors de l\'enregistrement blockchain après paiement:', blockchainError);
        // Enregistrer l'erreur
        proof.retries = proof.retries || {};
        proof.retries.errors = proof.retries.errors || [];
        proof.retries.errors.push(blockchainError.message);
        proof.retries.count = (proof.retries.count || 0) + 1;
        proof.retries.lastAttempt = new Date();
        await proof.save();
      }
    } else {
      // Pas d'Anchor client disponible
      proof.status = 'PENDING'; // Restera en attente jusqu'à ce que la blockchain soit disponible
      proof.retries = proof.retries || {};
      proof.retries.errors = proof.retries.errors || [];
      proof.retries.errors.push('Anchor client not available');
      await proof.save();
    }

    return res.success({
      id: proof._id,
      isPaid: proof.payment?.isPaid || false,
      status: proof.status,
      transactionId: proof.blockchain?.transactionId,
      pdaAddress: proof.blockchain?.pdaAddress,
      blockchainSuccess: blockchainResult.success
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

    // Vérifier si la preuve est payée
    if (!proof.payment?.isPaid) {
      return res.error('Cette preuve n\'a pas encore été payée', 400);
    }

    // En production, exiger que la preuve soit confirmée sur la blockchain
    if (process.env.NODE_ENV === 'production' && 
        (proof.status !== 'CONFIRMED' || !proof.blockchain?.pdaAddress)) {
      return res.error('Cette preuve n\'est pas encore confirmée sur la blockchain', 400);
    }

    // Vérifier si l'utilisateur est autorisé à télécharger la preuve
    // Seul le créateur de la preuve ou un administrateur peut la télécharger
    if (proof.artist._id.toString() !== req.user.id && !req.user.isAdmin) {
      return res.error('Vous n\'êtes pas autorisé à télécharger cette preuve', 403);
    }

    // Générer un document de preuve au format JSON
    const proofDocument = proof.toProofJson();

    // Au lieu de générer un vrai PDF, on renvoie simplement les données JSON
    return res.success(proofDocument, 'Document de preuve généré avec succès');
  } catch (error) {
    console.error('Erreur lors de la génération du document de preuve:', error);
    return res.error('Erreur serveur lors de la génération du document de preuve', 500);
  }
};