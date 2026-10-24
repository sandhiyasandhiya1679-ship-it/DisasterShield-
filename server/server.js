
const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const volunteerRoutes = require("./routes/volunteerRoutes");
const adminRoutes = require("./routes/adminRoutes");
const disasterRoutes = require("./routes/disasterRoutes");
const emergencyRoutes = require("./routes/emergencyRoutes");
const shelterRoutes = require("./routes/shelterRoutes");
const weatherRoutes = require("./routes/weatherRoutes");

const app = express();

// ========================================
// MIDDLEWARE
// ========================================
const allowedOrigins = [
  'http://localhost:5173',
  'https://disaster-shield-git-main-stars-eb64.vercel.app'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());

// ========================================
// API ROUTES
// ========================================
app.use("/api/auth", authRoutes);
app.use("/api/volunteer", volunteerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/disasters", disasterRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/shelters", shelterRoutes);
app.use("/api/weather", weatherRoutes);

console.log("All API routes mounted successfully");

// ========================================
// DEBUG ROUTE
// ========================================
app.get("/debug", (req, res) => {
    res.send("Debug route is working!");
});

// ========================================
// HOME ROUTE
// ========================================
app.get("/", (req, res) => {
    res.send("DisasterShield Backend is Running!");
});

// ========================================
// MONGODB CONNECTION
// ========================================
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected Successfully");
    })
    .catch((error) => {
        console.log("MongoDB Connection Failed:", error.message);
    });

// ========================================
// START SERVER
// ========================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
