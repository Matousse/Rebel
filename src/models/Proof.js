const mongoose = require('mongoose');

const ProofSchema = new mongoose.Schema({
  proofId: {
    type: String,
    required: [true, 'Proof ID is required'],
    unique: true,
    trim: true,
    index: true
  },
  track: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Track',
    required: [true, 'Track reference is required'],
    index: true
  },
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Artist reference is required'],
    index: true
  },
  artistPublicKey: {
    type: String,
    required: [true, 'Artist public key is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  contentHash: {
    type: String,
    required: [true, 'Content hash is required'],
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  blockchain: {
    pdaAddress: {
      type: String,
      default: null
    },
    transactionId: {
      type: String,
      default: null,
      sparse: true,
      index: true
    },
    network: {
      type: String,
      default: 'devnet',
      enum: ['devnet', 'testnet', 'mainnet']
    },
    timestamp: {
      type: Number,
      default: null
    }
  },
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'FAILED', 'REVOKED'],
    default: 'PENDING',
    index: true
  },
  payment: {
    cost: {
      type: Number,
      default: 0
    },
    isPaid: {
      type: Boolean,
      default: false
    },
    paymentMethod: {
      type: String,
      enum: ['SOL', 'CREDIT', 'FREE', 'NONE'],
      default: 'NONE'
    }
  },
  version: {
    type: Number,
    default: 1
  },
  retries: {
    count: {
      type: Number,
      default: 0
    },
    lastAttempt: Date,
    errors: [String]
  }
}, {
  timestamps: true
});

// Format proof for download
ProofSchema.methods.toProofJson = function() {
  return {
    proof_id: this.proofId,
    artist_id: this.artistPublicKey,
    track_hash: this.contentHash,
    track_id: this.track.toString(),
    track_title: this.title,
    timestamp: {
      unix: this.blockchain.timestamp || Math.floor(this.createdAt.getTime() / 1000),
      iso: this.createdAt.toISOString()
    },
    blockchain: {
      address: this.blockchain.pdaAddress,
      transaction_id: this.blockchain.transactionId,
      network: this.blockchain.network
    },
    status: this.status,
    version: this.version
  };
};

// Update blockchain status
ProofSchema.methods.updateBlockchainStatus = async function(transactionId, pdaAddress = null, timestamp = null) {
  this.blockchain.transactionId = transactionId;
  if (pdaAddress) this.blockchain.pdaAddress = pdaAddress;
  this.blockchain.timestamp = timestamp || Math.floor(Date.now() / 1000);
  this.status = 'CONFIRMED';
  return this.save();
};

// Log failed attempt
ProofSchema.methods.logFailure = async function(error) {
  this.retries.count += 1;
  this.retries.lastAttempt = new Date();
  if (error) {
    if (!this.retries.errors) this.retries.errors = [];
    this.retries.errors.push(error.toString().substring(0, 500)); // Limit error length
  }
  
  if (this.retries.count >= 3) {
    this.status = 'FAILED';
  }
  
  return this.save();
};

module.exports = mongoose.model('Proof', ProofSchema);