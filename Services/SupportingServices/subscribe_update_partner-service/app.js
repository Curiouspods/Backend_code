const express = require('express');
const app = express();
require('dotenv').config();
const SubscriptionRoutes = require('./routes/SubscriptionRoutes')
const {connectDB} = require('./config/db');

// Connect to MongoDB
connectDB().then(() => {
    console.log("Database Connected")
  }).catch(err => {
    console.log('MongoDB connection error', { error: err.message, stack: err.stack });
    process.exit(1);
  });

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/api/users',SubscriptionRoutes)

app.get('/', (req, res) => {
  res.send('Hello from Node.js!');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
