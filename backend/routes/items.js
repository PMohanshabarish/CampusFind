
const express = require("express");
const router = express.Router();

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Item = require("../models/item");
const authMiddleware = require("../middleware/authmiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// Create uploads folder if it does not exist
const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const uniqueName =
            Date.now() + "-" +
            Math.round(Math.random() * 1E9) +
            path.extname(file.originalname).toLowerCase();

        cb(null, uniqueName);
    }
});

// Accept image files only
const upload = multer({
    storage: storage,

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed."));
        }
    }
});

// GET API - Retrieve all items
router.get("/", async (req, res) => {
    try {
        const items = await Item.find();

        res.status(200).json({
            message: "Items retrieved successfully!",
            items: items
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

// SEARCH AND FILTER API
router.get("/search", async (req, res) => {
    try {
        const { keyword, category, location, listingType } = req.query;

        let filter = {};

        if (keyword) {
            filter.itemName = {
                $regex: keyword,
                $options: "i"
            };
        }

        if (category) {
            filter.category = category;
        }

        if (location) {
            filter.location = {
                $regex: location,
                $options: "i"
            };
        }

        if (listingType) {
            filter.listingType = listingType;
        }

        const items = await Item.find(filter);

        res.status(200).json({
            message: "Search completed successfully!",
            items: items
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

// POST API - Add a new item with optional photo (Login Required)
router.post("/", authMiddleware, upload.single("photo"), async (req, res) => {
    try {
        const newItem = new Item({
            itemName: req.body.itemName,
            category: req.body.category,
            description: req.body.description,
            location: req.body.location,
            date: req.body.date,
            listingType: req.body.listingType,
            image: req.file ? `/uploads/${req.file.filename}` : ""
        });

        const savedItem = await newItem.save();

        res.status(201).json({
            message: "Item added successfully!",
            item: savedItem
        });

    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
});

// DELETE API - Delete an item (Admin Only)
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const deletedItem = await Item.findByIdAndDelete(req.params.id);

        if (!deletedItem) {
            return res.status(404).json({
                message: "Item not found!"
            });
        }

        res.status(200).json({
            message: "Item deleted successfully!",
            item: deletedItem
        });

    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
});

// PATCH API - Update an item (Admin Only)
router.patch("/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const updatedItem = await Item.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedItem) {
            return res.status(404).json({
                message: "Item not found!"
            });
        }

        res.status(200).json({
            message: "Item updated successfully!",
            item: updatedItem
        });

    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
});

// Handle photo upload errors
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError || error.message === "Only image files are allowed.") {
        return res.status(400).json({
            message: error.message
        });
    }

    next(error);
});

module.exports = router;
