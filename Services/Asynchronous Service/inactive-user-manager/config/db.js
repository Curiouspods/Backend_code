const mongoose = require('mongoose');
require('dotenv').config();

// Main database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Main MongoDB connected');
  } catch (err) {
    console.error('Failed to connect to main database', err);
    process.exit(1);
  }
};

// Archive database connection
const archiveConnection = mongoose.createConnection(process.env.ARCHIVE_MONGODB_URI);
archiveConnection.on('connected', () => console.log('Archive MongoDB connected'));
archiveConnection.on('error', (err) => console.error('Archive DB connection error', err));

module.exports = { connectDB, archiveConnection };