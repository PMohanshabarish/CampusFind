const express = require("express");
const router = express.Router();

const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");

const Item = require("../models/item");
const authMiddleware = require("../middleware/authmiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer memory storage
const upload = multer({
    storage: multer.memoryStorage(),

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

// Upload image buffer to Cloudinary
const uploadToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "campusfind/items",
                resource_type: "image"
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }

                resolve(result);
            }
        );

        stream.end(fileBuffer);
    });
};

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

// POST API - Add item with optional Cloudinary photo
router.post("/", authMiddleware, upload.single("photo"), async (req, res) => {
    let uploadedImage = null;

    try {
        let imageUrl = "";

        if (req.file) {
            uploadedImage = await uploadToCloudinary(req.file.buffer);
            imageUrl = uploadedImage.secure_url;
        }

        const newItem = new Item({
            itemName: req.body.itemName,
            category: req.body.category,
            description: req.body.description,
            location: req.body.location,
            date: req.body.date,
            listingType: req.body.listingType,
            image: imageUrl
        });

        const savedItem = await newItem.save();

        res.status(201).json({
            message: "Item added successfully!",
            item: savedItem
        });

    } catch (error) {
        // Remove uploaded image if database saving fails
        if (uploadedImage && uploadedImage.public_id) {
            try {
                await cloudinary.uploader.destroy(uploadedImage.public_id);
            } catch (cleanupError) {
                console.error("Cloudinary cleanup failed.");
            }
        }

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
    if (
        error instanceof multer.MulterError ||
        error.message === "Only image files are allowed."
    ) {
        return res.status(400).json({
            message: error.message
        });
    }

    next(error);
});

module.exports = router;
