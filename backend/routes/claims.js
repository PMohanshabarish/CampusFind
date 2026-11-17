
const express = require("express");
const router = express.Router();

const Claim = require("../models/claim");
const Item = require("../models/item");

const authMiddleware = require("../middleware/authmiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// GET API - Retrieve all claims (Admin only)
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const claims = await Claim.find().populate("item");

        res.status(200).json({
            message: "Claims retrieved successfully!",
            claims: claims
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

// POST API - Submit a new claim (Login required)
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { item, claimantName, claimantEmail, description } = req.body;

        if (!item || !claimantName || !claimantEmail || !description) {
            return res.status(400).json({
                message: "Please provide all required fields!"
            });
        }

        const existingItem = await Item.findById(item);

        if (!existingItem) {
            return res.status(404).json({
                message: "Item not found!"
            });
        }

        const newClaim = new Claim({
            item,
            claimantName,
            claimantEmail,
            description
        });

        const savedClaim = await newClaim.save();

        res.status(201).json({
            message: "Claim submitted successfully!",
            claim: savedClaim
        });

    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
});

// PATCH API - Approve or Reject a claim (Admin only)
router.patch(
    "/:id/status",
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            const { status } = req.body;

            if (!["Approved", "Rejected"].includes(status)) {
                return res.status(400).json({
                    message: "Status must be Approved or Rejected"
                });
            }

            const updatedClaim = await Claim.findByIdAndUpdate(
                req.params.id,
                { status: status },
                {
                    new: true,
                    runValidators: true
                }
            );

            if (!updatedClaim) {
                return res.status(404).json({
                    message: "Claim not found!"
                });
            }

            res.status(200).json({
                message: "Claim status updated successfully!",
                claim: updatedClaim
            });

        } catch (error) {
            res.status(400).json({
                message: error.message
            });
        }
    }
);

module.exports = router;
