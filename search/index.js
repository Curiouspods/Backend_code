require('dotenv').config();
const express = require("express");
const connectDB = require("./config/db");
const searchRoutes = require("./routes/searchRoute");

const app = express();
connectDB();

app.use(express.json());
app.use("/api/search", searchRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
