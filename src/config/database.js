// src/config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Utilisez soundcloud-clone si c'est votre vraie DB
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/soundcloud-clone', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;