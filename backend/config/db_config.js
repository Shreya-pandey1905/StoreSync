require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/CollegeProject';
  const options = {
    serverSelectionTimeoutMS: 15000,
    // Fix SSL/TLS ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR on Windows with MongoDB Atlas
  };
  await mongoose.connect(mongoURI, options);
  console.log(`MongoDB connected: ${mongoURI.replace(/:[^:@]+@/, ':****@')}`);
};

module.exports = connectDB;