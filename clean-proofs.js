// clean-proofs.js
const mongoose = require('mongoose');
const User = require('./src/modules/user/userModel');
require('dotenv').config();

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/soundcloud-clone';
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const cleanUserProofs = async () => {
  await connectDB();
  
  const userId = '6807646f8b55918158393f2b';
  const user = await User.findById(userId);
  
  if (!user || !user.proofs) {
    console.log('No user or proofs found');
    mongoose.connection.close();
    return;
  }
  
  console.log('Original proofs count:', user.proofs.length);
  
  // Nettoyer les preuves avec trackId valides
  const cleanedProofs = [];
  
  for (const proof of user.proofs) {
    if (proof.trackId && mongoose.Types.ObjectId.isValid(proof.trackId.toString())) {
      // Nettoyer la preuve
      cleanedProofs.push({
        trackId: mongoose.Types.ObjectId(proof.trackId.toString()),
        timestamp: proof.timestamp,
        signature: proof.signature,
        transactionId: proof.transactionId
      });
    }
  }
  
  console.log('Cleaned proofs count:', cleanedProofs.length);
  
  // Sauvegarder les preuves nettoyées
  user.proofs = cleanedProofs;
  await user.save();
  
  console.log('✅ Proofs cleaned and saved');
  mongoose.connection.close();
};

cleanUserProofs().catch(console.error);