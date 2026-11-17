
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// Import routes
const itemRoutes = require("./routes/items");
const claimRoutes = require("./routes/claims");
const authRoutes = require("./routes/auth");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
const path = require("path");

// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect routes
app.use("/api/items", itemRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/auth", authRoutes);

// Test route
app.get("/", (req, res) => {
    res.send("Campus Lost and Found Portal Backend is Running!");
});

// Connect MongoDB and start server
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected Successfully!");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.log("MongoDB Connection Error:", error.message);
    });
