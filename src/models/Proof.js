const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schéma pour la preuve de création d'un fichier audio
const ProofSchema = new Schema({
  // ID fonctionnel de la preuve (pour l'API externe)
  proofId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Piste audio associée (référence à Track)
  track: {
    type: Schema.Types.ObjectId,
    ref: 'Track',
    required: true
  },
  
  // Artiste qui a créé la preuve (référence à User)
  artist: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Clé publique Solana de l'artiste
  artistPublicKey: {
    type: String,
    required: true
  },
  
  // Titre de la preuve
  title: {
    type: String,
    required: true
  },
  
  // Hash SHA-256 du contenu du fichier
  contentHash: {
    type: String,
    required: true
  },
  
  // Statut de la preuve (PENDING, CONFIRMED, REJECTED)
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'REJECTED'],
    default: 'PENDING'
  },
  
  // Informations de la blockchain
  blockchain: {
    // Adresse PDA sur la blockchain
    pdaAddress: {
      type: String,
      default: null
    },
    
    // ID de la transaction sur la blockchain
    transactionId: {
      type: String,
      default: null
    },
    
    // Réseau de la blockchain (devnet, mainnet)
    network: {
      type: String,
      default: 'devnet'
    },
    
    // Timestamp de la transaction
    timestamp: {
      type: Number,
      default: null
    }
  },
  
  // Informations de paiement
  payment: {
    // Coût de la preuve (0 pour la première)
    cost: {
      type: Number,
      default: 0
    },
    
    // Si la preuve a été payée
    isPaid: {
      type: Boolean,
      default: false
    },
    
    // Méthode de paiement (FREE, SOL, CREDIT)
    paymentMethod: {
      type: String,
      enum: ['NONE', 'FREE', 'SOL', 'CREDIT'],
      default: 'NONE'
    }
  },
  
  // Informations de nouvelles tentatives (en cas d'échec)
  retries: {
    // Nombre de tentatives
    count: {
      type: Number,
      default: 0
    },
    
    // Dernière tentative
    lastAttempt: {
      type: Date,
      default: null
    },
    
    // Erreurs rencontrées
    errors: {
      type: [String],
      default: []
    }
  },
  
  // Numéro de version (pour les preuves multiples d'une même piste)
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Méthode pour convertir la preuve en JSON formaté pour le document de preuve
ProofSchema.methods.toProofJson = function() {
  return {
    proofId: this.proofId,
    title: this.title,
    contentHash: this.contentHash,
    createdAt: this.createdAt,
    version: this.version,
    artist: {
      id: this.artist._id || this.artist,
      username: this.artist.username || 'Artist',
      publicKey: this.artistPublicKey
    },
    track: {
      id: this.track._id || this.track,
      title: this.track.title || 'Track'
    },
    blockchain: {
      network: this.blockchain.network,
      transactionId: this.blockchain.transactionId,
      pdaAddress: this.blockchain.pdaAddress,
      timestamp: this.blockchain.timestamp
    },
    status: this.status,
    verified: this.status === 'CONFIRMED' && this.blockchain.pdaAddress !== null
  };
};

module.exports = mongoose.model('Proof', ProofSchema);