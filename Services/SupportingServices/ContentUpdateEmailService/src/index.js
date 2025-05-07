// File: src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const emailRoutes = require('./routes/email.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/email', emailRoutes); 
const klaviyoRoutes = require('./routes/klaviyo.routes');
app.use('/api/klaviyo', klaviyoRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Excel to Klaviyo Email Microservice' });
});
console.log("ENV VARIABLES:", {
  public: process.env.KLAVIYO_PUBLIC_API_KEY,
  private: process.env.KLAVIYO_PRIVATE_API_KEY,
  node_env: process.env.NODE_ENV
});
// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});