
const mongoose = require("mongoose");

const volunteerSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        mobile: {
            type: String,
            required: true
        },

        password: {
            type: String,
            required: true
        },

        role: {
            type: String,
            enum: ["VOLUNTEER"],
            default: "VOLUNTEER"
        },

        city: {
            type: String,
            required: true,
            trim: true
        },

        location: {
            latitude: {
                type: Number,
                default: null
            },
            longitude: {
                type: Number,
                default: null
            }
        },

        address: {
            type: String,
            required: true,
            trim: true
        },

        skills: {
            type: [String],
            default: []
        },

        emergencyContact: {
            type: String,
            required: true
        },

        availableServices: {
            type: [String],
            default: []
        },

        profilePhoto: {
            type: String,
            default: ""
        },

        availabilityStatus: {
            type: String,
            enum: ["ACTIVE", "BUSY", "OFFLINE"],
            default: "ACTIVE"
        }
    },
    {
        timestamps: true
    }
);

const Volunteer = mongoose.model("Volunteer", volunteerSchema);

module.exports = Volunteer;
