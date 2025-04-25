const mongoose = require('mongoose');

const ProofSchema = new mongoose.Schema({
  proofId: {
    type: String,
    required: [true, 'ID de preuve est requis'],
    unique: true,
    trim: true
  },
  track: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Track',
    required: [true, 'Référence à la piste est requise']
  },
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Référence à l\'artiste est requise']
  },
  artistPublicKey: {
    type: String,
    required: [true, 'Clé publique de l\'artiste est requise']
  },
  title: {
    type: String,
    required: [true, 'Titre est requis'],
    trim: true,
    maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères']
  },
  contentHash: {
    type: String,
    required: [true, 'Hash du contenu est requis']
  },
  pdaAddress: {
    type: String,
    default: null
  },
  transactionId: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'FAILED'],
    default: 'PENDING'
  },
  cost: {
    type: Number,
    default: 0
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true // Ajoute automatiquement createdAt et updatedAt
});

// Indexer pour les recherches fréquentes
ProofSchema.index({ track: 1 });
ProofSchema.index({ artist: 1 });
ProofSchema.index({ contentHash: 1 });
ProofSchema.index({ status: 1 });

// Méthode pour formater la preuve en JSON pour téléchargement
ProofSchema.methods.toProofJson = function() {
  return {
    artist_id: this.artistPublicKey,
    track_hash: this.contentHash,
    track_id: this.track.toString(), // Convertir l'ObjectId en string
    track_title: this.title,
    timestamp: {
      unix: Math.floor(this.createdAt.getTime() / 1000), // Convertir ms en secondes
      iso: this.createdAt.toISOString()
    },
    nft_id: this.pdaAddress,
    transaction_id: this.transactionId
  };
};

module.exports = mongoose.model('Proof', ProofSchema);