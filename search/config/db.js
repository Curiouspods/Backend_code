const mongoose = require('mongoose');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("Connected to MongoDB Atlas");
  } catch (error) {
    console.error("DB Connection Error:", error);
  }
}

module.exports = connectDB;
