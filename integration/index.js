const express = require("express");
const connectDB = require("./config/db");
const tutorRoutes = require("./routes/tutorRoute");
require('dotenv').config();

const app = express();
connectDB();

app.use(express.json());
app.use("/api/integration", tutorRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
