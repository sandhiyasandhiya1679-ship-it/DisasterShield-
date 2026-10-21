const mongoose = require("mongoose");

const disasterAlertSchema = new mongoose.Schema(
    {
        disasterType: {
            type: String,
            enum: [
                "Flood",
                "Cyclone",
                "Earthquake",
                "Landslide",
                "Heavy Rain",
                "Tsunami",
                "Other"
            ],
            required: true
        },

        title: {
            type: String,
            required: true
        },

        description: {
            type: String,
            required: true
        },

        severity: {
            type: String,
            enum: [
                "LOW",
                "MODERATE",
                "HIGH",
                "CRITICAL"
            ],
            required: true
        },

        affectedLocation: {
            type: String,
            required: true
        },

        latitude: {
            type: Number,
            required: true
        },

        longitude: {
            type: Number,
            required: true
        },

        radius: {
            type: Number,
            required: true
        },

        safetyInstructions: {
            type: String,
            required: true
        },

        evacuationInstructions: {
            type: String,
            default: ""
        },

        shelterInformation: {
            type: String,
            default: ""
        },

        source: {
            type: String,
            default: "Admin"
        },

        publishedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            required: true
        },

        status: {
            type: String,
            enum: ["DRAFT", "ACTIVE", "CANCELLED"],
            default: "DRAFT"
        },

        publishedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

const DisasterAlert = mongoose.model(
    "DisasterAlert",
    disasterAlertSchema
);

module.exports = DisasterAlert;