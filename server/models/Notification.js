const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        volunteerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Volunteer",
            default: null
        },
        adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    default: null
},

        type: {
            type: String,
            enum: [
                "DISASTER_ALERT",
                "HELP_REQUEST",
                "VOLUNTEER_ASSIGNED",
                "TASK_UPDATE",
                "VOLUNTEER_REJECTED",
                "GENERAL"
            ],
            required: true
        },

        title: {
            type: String,
            required: true
        },

        message: {
            type: String,
            required: true
        },

        relatedAlertId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "DisasterAlert",
            default: null
        },
        relatedRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "EmergencyRequest",
    default: null
},

relatedVolunteerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Volunteer",
    default: null
},

        isRead: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

const Notification = mongoose.model(
    "Notification",
    notificationSchema
);

module.exports = Notification;