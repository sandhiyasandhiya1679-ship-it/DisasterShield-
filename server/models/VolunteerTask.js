const mongoose = require("mongoose");

const volunteerTaskSchema = new mongoose.Schema(
    {
        emergencyRequestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "EmergencyRequest",
            required: true
        },

        volunteerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Volunteer",
            required: true
        },

        status: {
            type: String,
            enum: [
                "ASSIGNED",
                "ACCEPTED",
                "ON_THE_WAY",
                "ARRIVED",
                "WORK_IN_PROGRESS",
                "WORK_COMPLETED",
                "REJECTED"
            ],
            default: "ASSIGNED"
        },

        assignedAt: {
            type: Date,
            default: Date.now
        },

        acceptedAt: {
            type: Date,
            default: null
        },

        completedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

const VolunteerTask = mongoose.model(
    "VolunteerTask",
    volunteerTaskSchema
);

module.exports = VolunteerTask;