const dns = require('dns');
const mongoose = require('mongoose');

// Algunos resolvers DNS en Windows fallan con querySrv en URIs mongodb+srv://
dns.setServers(['8.8.8.8', '1.1.1.1']);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
