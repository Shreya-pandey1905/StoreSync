require('dotenv').config();
const mongoose = require('mongoose');

// Fail fast instead of hanging API requests when DB is unreachable
mongoose.set('bufferCommands', false);

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/CollegeProject';
  const options = {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  };
  await mongoose.connect(mongoURI, options);
  console.log(`MongoDB connected: ${mongoURI.replace(/:[^:@]+@/, ':****@')}`);
};

module.exports = connectDB;