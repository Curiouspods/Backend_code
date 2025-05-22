require('dotenv').config();
const express = require("express");
const connectDB = require("./config/db");
const recommendationRoutes = require("./routes/recommendationRoutes");

const app = express();
connectDB();

app.use(express.json());
app.use("/api/recommendations", recommendationRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
