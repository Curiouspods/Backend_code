const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URL;
        if (!mongoURI) {
            throw new Error("MONGO_URI is missing in environment variables.");
        }

        await mongoose.connect(mongoURI); // Remove deprecated options
        console.log("✅ MongoDB connected successfully!");
    } catch (err) {
        console.error("❌ MongoDB connection error:", err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
