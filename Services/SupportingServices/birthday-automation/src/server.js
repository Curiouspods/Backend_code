const express = require('express');
const cron = require('node-cron');
const connectDB = require('./config/db');
const userController = require('./controllers/userController');
const birthdayService = require('./services/birthdayService');
require('dotenv').config();

// Initialize Express
const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(express.json());

// Routes
app.post('/api/users', userController.createUser);
app.put('/api/users/login', userController.updateLastLogin);
app.get('/api/users/birthday-check', userController.triggerBirthdayCheck);
app.get('/api/users/:email', userController.getUserByEmail);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Schedule the birthday check to run every day at 8:00 AM
cron.schedule('0 8 * * *', async () => {
  console.log('Running scheduled birthday check...');
  try {
    await birthdayService.checkAndSendBirthdayEmails();
  } catch (error) {
    console.error('Error in scheduled birthday check:', error);
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Run initial birthday check on startup
  birthdayService.checkAndSendBirthdayEmails()
    .then(() => console.log('Initial birthday check completed'))
    .catch(err => console.error('Error in initial birthday check:', err));
});