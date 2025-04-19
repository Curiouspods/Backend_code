const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
dotenv.config();
const app = express();
app.use(express.json());

app.get('/', (req, res) => {
    console.log('Root route accessed');  // Debugging log
    res.send('API is running successfully!');
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB Connection Error:', err));

// API Routes
app.use('/api/subscriptions', subscriptionRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
