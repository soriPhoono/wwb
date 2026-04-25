const mongoose = require('mongoose');
const fs = require('fs');

function getMongoUri() {
  // Support Docker Swarm secret: mount the URI as a secret file
  if (process.env.MONGO_URI_FILE) {
    try {
      return fs.readFileSync(process.env.MONGO_URI_FILE, 'utf8').trim();
    } catch (e) {
      console.error('Could not read MONGO_URI_FILE:', e.message);
    }
  }
  // Direct env var (Docker env or local .env)
  return process.env.MONGO_URI || 'mongodb://localhost:27017/securecart';
}

async function connectDB() {
  const uri = getMongoUri();
  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.warn('Backend will continue running — auth routes will be unavailable until DB is connected.');
  }
}

module.exports = { connectDB };
