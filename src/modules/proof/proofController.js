const Proof = require('../../models/Proof');
const Track = require('../../models/Track');
const fs = require('fs');
const path = require('path');
const proofUtils = require('../../utils/proofUtils');
const { accountService } = require('../../account-abstraction');

// Importer le service de preuve - ajustez ce chemin selon votre structure
// Note: Comme TypeScript est utilisé pour les services, nous devons importer le code compilé
let ProofService, HashService;
try {
  const timestampProof = require('../../../dist/timestamp-proof/services');
  ProofService = timestampProof.ProofService;
  HashService = timestampProof.HashService;
} catch (error) {
  console.error('Erreur lors du chargement des services de preuve:', error);
  // Définir des stubs pour éviter les erreurs
  ProofService = class {};
  HashService = { generateContentHash: () => '' };
}

// Initialiser le service de preuve avec le service Solana existant
const proofService = new ProofService(accountService.solanaService);

// @desc    Créer une nouvelle preuve de création
// @route   POST /api/proofs
// @access  Private (Artistes uniquement)
exports.createProof = async (req, res) => {
  try {
    // Vérifier si l'utilisateur est authentifié et est un artiste
    if (!req.user || !req.user.isArtist) {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux artistes'
      });
    }

    // Vérifier si un fichier a été téléchargé
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier audio fourni'
      });
    }

    const { trackId, title } = req.body;

    // Vérifier si la piste existe et appartient à l'utilisateur
    let track;
    if (trackId) {
      track = await Track.findById(trackId);
      if (!track) {
        return res.status(404).json({
          success: false,
          message: 'Piste audio non trouvée'
        });
      }

      // Vérifier si l'utilisateur est bien le propriétaire de la piste
      if (track.artist.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Vous n\'êtes pas autorisé à créer une preuve pour cette piste'
        });
      }
    }

    // Lire le fichier audio
    const audioFilePath = req.file.path;
    const audioBuffer = fs.readFileSync(audioFilePath);

    // Vérifier le nombre de preuves existantes pour cette piste
    const existingProofCount = await Proof.countDocuments({
      track: trackId
    });

    // Créer la preuve en mémoire d'abord via le service
    try {
      const artistPublicKey = req.user.solanaAddress || accountService.solanaService.getAdminKeypair().publicKey.toString();

      const memoryProof = await proofService.createProof({
        trackId: trackId || 'unregistered_track',
        artistId: req.user.id,
        artistPublicKey,
        title: title || (track ? track.title : 'Untitled'),
        audioBuffer
      });

      // Enregistrer dans MongoDB
      const proof = new Proof({
        proofId: memoryProof.id,
        track: trackId,
        artist: req.user.id,
        artistPublicKey,
        title: memoryProof.metadata.title,
        contentHash: memoryProof.metadata.contentHash,
        transactionId: memoryProof.transactionId,
        pdaAddress: memoryProof.pdaAddress,
        status: memoryProof.status,
        cost: memoryProof.cost,
        isPaid: memoryProof.isPaid,
        version: memoryProof.version
      });

      await proof.save();

      res.status(201).json({
        success: true,
        data: {
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
        }
      });
    } catch (proofError) {
      console.error('Erreur du service de preuve:', proofError);
      
      // Fallback: créer une preuve basique si le service échoue
      const contentHash = proofUtils.generateContentHash(audioBuffer);
      
      const proof = new Proof({
        proofId: `manual_proof_${Date.now()}`,
        track: trackId,
        artist: req.user.id,
        artistPublicKey: req.user.solanaAddress || 'unknown',
        title: title || (track ? track.title : 'Untitled'),
        contentHash,
        status: 'PENDING',
        cost: existingProofCount === 0 ? 0 : 10,
        isPaid: existingProofCount === 0,
        version: existingProofCount + 1
      });
      
      await proof.save();
      
      res.status(201).json({
        success: true,
        data: {
          id: proof._id,
          proofId: proof.proofId,
          title: proof.title,
          contentHash: proof.contentHash,
          status: proof.status,
          isPaid: proof.isPaid,
          cost: proof.cost,
          createdAt: proof.createdAt,
          warning: 'Service de preuve blockchain indisponible, preuve locale uniquement'
        }
      });
    }
  } catch (error) {
    console.error('Erreur lors de la création de la preuve:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création de la preuve'
    });
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
      return res.status(404).json({
        success: false,
        message: 'Preuve non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      data: proof
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la preuve:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération de la preuve'
    });
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

    res.status(200).json({
      success: true,
      count: proofs.length,
      data: proofs
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des preuves:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des preuves'
    });
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

    res.status(200).json({
      success: true,
      count: proofs.length,
      data: proofs
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des preuves:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des preuves'
    });
  }
};

// @desc    Vérifier une preuve
// @route   POST /api/proofs/verify/:id
// @access  Public
exports.verifyProof = async (req, res) => {
  try {
    // Vérifier si un fichier a été téléchargé
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier audio fourni pour la vérification'
      });
    }

    // Récupérer la preuve
    const proof = await Proof.findById(req.params.id);

    if (!proof) {
      return res.status(404).json({
        success: false,
        message: 'Preuve non trouvée'
      });
    }

    // Lire le fichier audio
    const audioFilePath = req.file.path;
    const audioBuffer = fs.readFileSync(audioFilePath);

    // Vérifier le hash du contenu
    const contentHash = proofUtils.generateContentHash(audioBuffer);
    const hashMatches = contentHash === proof.contentHash;

    // Nettoyer le fichier téléchargé
    fs.unlinkSync(audioFilePath);

    // Si le service Solana est disponible, vérifier sur la blockchain
    let blockchainResult = { onChain: false, chainVerified: false };
    
    try {
      if (hashMatches && proof.pdaAddress && proof.status === 'CONFIRMED') {
        const result = await proofService.verifyTrack(proof.track.toString(), audioBuffer);
        blockchainResult = {
          onChain: result.onChain,
          chainVerified: result.isValid && result.onChain
        };
      }
    } catch (blockchainError) {
      console.error('Erreur lors de la vérification blockchain:', blockchainError);
    }

    res.status(200).json({
      success: true,
      data: {
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
    }
  });
} catch (error) {
  console.error('Erreur lors de la vérification de la preuve:', error);
  res.status(500).json({
    success: false,
    message: 'Erreur serveur lors de la vérification de la preuve'
  });
}
};

// @desc    Payer pour une preuve (après la première gratuite)
// @route   POST /api/proofs/pay/:id
// @access  Private
exports.payForProof = async (req, res) => {
try {
  const proof = await Proof.findById(req.params.id);

  if (!proof) {
    return res.status(404).json({
      success: false,
      message: 'Preuve non trouvée'
    });
  }

  // Vérifier si l'utilisateur est le propriétaire de la preuve
  if (proof.artist.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Vous n\'êtes pas autorisé à payer pour cette preuve'
    });
  }

  // Vérifier si la preuve n'est pas déjà payée
  if (proof.isPaid) {
    return res.status(400).json({
      success: false,
      message: 'Cette preuve est déjà payée'
    });
  }

  // TODO: Implémenter ici la logique de déduction des points Rebellion
  // userService.deductPoints(req.user.id, proof.cost);

  // Tenter d'utiliser le service pour payer
  try {
    const updatedMemoryProof = await proofService.payForProof(proof.proofId);
    
    // Mettre à jour dans MongoDB
    proof.isPaid = true;
    proof.status = updatedMemoryProof.status;
    proof.transactionId = updatedMemoryProof.transactionId;
    proof.pdaAddress = updatedMemoryProof.pdaAddress;
    
    await proof.save();
  } catch (paymentError) {
    console.error('Erreur lors du paiement via le service:', paymentError);
    
    // Fallback: mettre à jour localement si le service échoue
    proof.isPaid = true;
    proof.status = 'PENDING'; // Nous ne pouvons pas confirmer sans le service
    
    await proof.save();
  }

  res.status(200).json({
    success: true,
    data: {
      id: proof._id,
      isPaid: proof.isPaid,
      status: proof.status,
      transactionId: proof.transactionId,
      pdaAddress: proof.pdaAddress
    }
  });
} catch (error) {
  console.error('Erreur lors du paiement pour la preuve:', error);
  res.status(500).json({
    success: false,
    message: 'Erreur serveur lors du paiement pour la preuve'
  });
}
};

// @desc    Télécharger le document de preuve
// @route   GET /api/proofs/download/:id
// @access  Private
exports.downloadProof = async (req, res) => {
try {
  const proof = await Proof.findById(req.params.id);

  if (!proof) {
    return res.status(404).json({
      success: false,
      message: 'Preuve non trouvée'
    });
  }

  // Vérifier si la preuve est confirmée
  if (proof.status !== 'CONFIRMED' || !proof.pdaAddress) {
    return res.status(400).json({
      success: false,
      message: 'La preuve n\'est pas encore confirmée sur la blockchain'
    });
  }

  // Vérifier si l'utilisateur a le droit de télécharger cette preuve
  // Le propriétaire ou tout utilisateur si la piste est publique
  const isOwner = req.user && req.user.id === proof.artist.toString();
  
  if (!isOwner) {
    const track = await Track.findById(proof.track);
    if (!track || !track.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à télécharger cette preuve'
      });
    }
  }

  // Générer le JSON
  const proofJson = proof.toProofJson();
  
  // Option 1: Retourner directement le JSON
  if (req.query.format === 'json') {
    return res.status(200).json(proofJson);
  }
  
  // Option 2: Créer un fichier à télécharger
  const tempDir = proofUtils.ensureProofTempDir();
  const filename = proofUtils.generateProofFilename(proof.track, proof.artist);
  const filePath = path.join(tempDir, filename);
  
  // Écrire le fichier
  fs.writeFileSync(filePath, JSON.stringify(proofJson, null, 2));
  
  // Envoyer le fichier
  res.download(filePath, filename, (err) => {
    if (err) {
      console.error('Erreur lors du téléchargement du fichier:', err);
    }
    
    // Nettoyer le fichier après l'envoi (ou en cas d'erreur)
    fs.unlink(filePath, (unlinkErr) => {
      if (unlinkErr) {
        console.error('Erreur lors de la suppression du fichier temporaire:', unlinkErr);
      }
    });
  });
} catch (error) {
  console.error('Erreur lors du téléchargement de la preuve:', error);
  res.status(500).json({
    success: false,
    message: 'Erreur serveur lors du téléchargement de la preuve'
  });
}
};

// @desc    Obtenir toutes les preuves pour l'utilisateur connecté
// @route   GET /api/proofs/me
// @access  Private
exports.getMyProofs = async (req, res) => {
try {
  const proofs = await Proof.find({ artist: req.user.id })
    .sort({ createdAt: -1 })
    .populate('track', 'title duration');

  res.status(200).json({
    success: true,
    count: proofs.length,
    data: proofs
  });
} catch (error) {
  console.error('Erreur lors de la récupération des preuves:', error);
  res.status(500).json({
    success: false,
    message: 'Erreur serveur lors de la récupération des preuves'
  });
}
};