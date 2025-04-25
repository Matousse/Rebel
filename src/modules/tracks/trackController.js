const Track = require('../../models/Track');
const User = require('../../modules/user/userModel');
const { accountService } = require('../../../dist/account-abstraction');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// @desc    Upload a new track
// @route   POST /api/tracks
// @access  Private (artist only)
exports.uploadTrack = async (req, res) => {
  try {
    const { title, genre, description, tags } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an audio file'
      });
    }
    
    // Calculer la durée - en production, vous utiliseriez une bibliothèque comme musicmetadata
    const duration = 180; // Valeur factice de 3 minutes
    
    // Créer le track dans la DB
    const track = await Track.create({
      title,
      genre,
      description,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      artist: req.user.id,
      audioFile: req.file.path.replace('public/', ''),
      duration
    });
    
    res.status(201).json({
      success: true,
      data: track
    });
  } catch (error) {
    console.error('Error uploading track:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading track'
    });
  }
};

// @desc    Create timestamp for a track (Proof of Creation)
// @route   POST /api/tracks/:id/timestamp
// @access  Private (artist only)
exports.createTimestamp = async (req, res) => {
  try {
    const track = await Track.findById(req.params.id);
    
    if (!track) {
      return res.status(404).json({
        success: false,
        message: 'Track not found'
      });
    }
    
    // Vérifier que l'utilisateur est le propriétaire du morceau
    if (track.artist.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized - you are not the creator of this track'
      });
    }
    
    // Vérifier si un timestamp existe déjà
    if (track.proofOfCreation && track.proofOfCreation.signature) {
      return res.status(400).json({
        success: false,
        message: 'Timestamp already exists for this track'
      });
    }
    
    // Calculer le hash du fichier audio
    const audioFilePath = path.join(process.cwd(), 'public', track.audioFile);
    const fileBuffer = fs.readFileSync(audioFilePath);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    
    // Récupérer l'utilisateur Magic/Solana
    const magicUser = await accountService.getUserByEmail(req.user.email);
    if (!magicUser) {
      return res.status(404).json({
        success: false,
        message: 'No Solana account found for this user - please complete account setup first'
      });
    }
    
    // Créer la preuve de création via l'Account Abstraction
    const transaction = await accountService.createProofOfCreation(
      magicUser.id,
      {
        trackId: track._id.toString(),
        title: track.title,
        hash
      }
    );
    
    // Mettre à jour le document track
    track.proofOfCreation = {
      transactionId: transaction.id,
      signature: transaction.signature,
      timestamp: transaction.timestamp,
      hash: hash,
      network: transaction.metadata.network
    };
    
    await track.save();
    
    res.status(200).json({
      success: true,
      data: {
        trackId: track._id,
        title: track.title,
        timestamp: track.proofOfCreation.timestamp,
        signature: track.proofOfCreation.signature,
        network: track.proofOfCreation.network
      }
    });
  } catch (error) {
    console.error('Error creating timestamp:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating timestamp',
      error: error.message
    });
  }
};

// @desc    Verify timestamp for a track
// @route   GET /api/tracks/:id/verify
// @access  Public
exports.verifyTimestamp = async (req, res) => {
  try {
    const track = await Track.findById(req.params.id);
    
    if (!track) {
      return res.status(404).json({
        success: false,
        message: 'Track not found'
      });
    }
    
    if (!track.proofOfCreation || !track.proofOfCreation.signature) {
      return res.status(404).json({
        success: false,
        message: 'No timestamp found for this track'
      });
    }
    
    // Vérifier la signature via Account Abstraction
    const isValid = await accountService.verifyProofOfCreation(
      track.proofOfCreation.signature
    );
    
    res.status(200).json({
      success: true,
      data: {
        trackId: track._id,
        title: track.title,
        artist: track.artist,
        timestamp: track.proofOfCreation.timestamp,
        signature: track.proofOfCreation.signature,
        network: track.proofOfCreation.network,
        isValid
      }
    });
  } catch (error) {
    console.error('Error verifying timestamp:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while verifying timestamp'
    });
  }
};

// Ajoutez les autres méthodes CRUD selon vos besoins