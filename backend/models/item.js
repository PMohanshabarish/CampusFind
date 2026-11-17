
const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
    itemName: {
        type: String,
        required: true
    },

    category: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    location: {
        type: String,
        required: true
    },

    date: {
        type: Date,
        required: true
    },

    listingType: {
        type: String,
        enum: ["Lost", "Found"],
        required: true
    },

    image: {
        type: String,
        default: ""
    },

    status: {
        type: String,
        enum: ["Active", "Claimed", "Returned"],
        default: "Active"
    }
}, { timestamps: true });

module.exports = mongoose.model("Item", itemSchema);
