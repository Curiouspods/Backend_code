require('dotenv').config(); // Load environment variables
const express = require('express');
const connectDB = require('./config/db'); // Import MongoDB connection function
const formRoutes = require('./routes/formRoutes');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const app = express();

// Apply middleware in correct order
// 1. CORS should be first to handle preflight requests
app.use(cors({
  origin: 'http://localhost:3000', 
  methods: ['GET', 'POST'],
  credentials: true
}));

// 2. Body parser
app.use(express.json()); // Middleware to parse JSON request bodies

// 3. Rate limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per 15 minutes
    message: { status: 'error', message: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// 4. MongoDB Connection
connectDB();

// Logging middleware for debugging API calls
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// 5. Routes
app.use('/api', formRoutes);
// 6. Error Handling Middleware
app.use((err, req, res, next) => {
    console.error("Server Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} - http://localhost:${PORT}`));