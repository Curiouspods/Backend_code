const express = require('express');
const app = express();
app.use(express.json());
const dotenv = require('dotenv');
const {connectDB} = require('./config/db');
const cors = require('cors');

dotenv.config();

const videosRoutes = require('./routes/videosRoutes'); 
const videoRoutesFromDB = require('./routes/videoRoutesFromDB')

// Connect to MongoDB
connectDB().then(() => {
  console.log("Database Connected")
}).catch(err => {
  console.log('MongoDB connection error', { error: err.message, stack: err.stack });
  process.exit(1);
});

// Enable CORS
app.use(cors());

app.use('/api/videos', videosRoutes);
app.use('/api/videosFromDB', videoRoutesFromDB);

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => res.send('Hello from Node.js'));

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
