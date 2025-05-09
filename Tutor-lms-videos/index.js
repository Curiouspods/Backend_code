
const express = require('express');
const app = express();
app.use(express.json());
const dotenv = require('dotenv');
const {connectDB} = require('./config/db');

dotenv.config();

const videosRoutes = require('./routes/videosRoutes'); 
const videoRoutesFromDB = require('./routes/videoRoutesFromDB')
const { connectClient } = require('./config/redis');

// Connect to MongoDB
connectDB().then(() => {
  console.log("Database Connected")
}).catch(err => {
  console.log('MongoDB connection error', { error: err.message, stack: err.stack });
  process.exit(1);
});

const startServer = async () => {
    try {
      await connectClient(); // 👈 Connect Redis before starting the server
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });
    } catch (err) {
      console.error('Failed to start server:', err);
      process.exit(1);
    }
  };
  
  startServer();

app.use('/api/videos', videosRoutes);
app.use('/api/videosFromDB', videoRoutesFromDB);

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Hello from Node.js'));

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
