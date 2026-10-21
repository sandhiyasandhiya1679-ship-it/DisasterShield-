const mongoose = require("mongoose");

const shelterSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },

        address: {
            type: String,
            required: true
        },

        location: {
            latitude: {
                type: Number,
                required: true
            },
            longitude: {
                type: Number,
                required: true
            }
        },

        capacity: {
            type: Number,
            required: true,
            min: 1
        },

        currentOccupancy: {
            type: Number,
            default: 0,
            min: 0
        },

        facilities: {
            type: [String],
            default: []
        },

        contactNumber: {
            type: String,
            required: true
        },

        status: {
            type: String,
            enum: ["OPEN", "FULL", "CLOSED"],
            default: "OPEN"
        }
    },
    {
        timestamps: true
    }
);

const Shelter = mongoose.model("Shelter", shelterSchema);

module.exports = Shelter;