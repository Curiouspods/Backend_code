// server.js
const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');

// Load env vars
dotenv.config({ path: './config/config.env' });

// Import route files
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const archiveRoutes = require('./routes/archiveRoutes');
const subscriptionRoutes=require('./routes/subscriptionRoutes')
// Import services
const inactivityService = require('./services/inactivityService');

// Connect to database
mongoose.connect(process.env.MONGODB_URI, {

})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error(err));

// Initialize app
const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/archive', archiveRoutes);
app.use('/api/subscription',subscriptionRoutes);

// Schedule inactivity check (run daily at midnight)
cron.schedule('0 0 * * *', async () => {
  console.log('Running scheduled task: Check for inactive users');
  try {
    await inactivityService.checkInactiveUsers();
  } catch (error) {
    console.error('Error in scheduled task:', error);
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  process.exit(1);
});