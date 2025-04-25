const mongoose = require('mongoose');


// src/models/Track.js
const TrackSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  audioFile: {
    type: String,
    required: [true, 'Audio file is required']
  },
  coverImage: {
    type: String,
    default: 'default-cover.jpg'
  },
  genre: {
    type: String,
    required: [true, 'Genre is required']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required']
  },
  plays: {
    type: Number,
    default: 0
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  tags: [String],
  
  proofOfCreation: {
    transactionId: String,
    signature: String,
    timestamp: Number,
    hash: String,
    network: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Track', TrackSchema);
