
const mongoose = require("mongoose");

const emergencyRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    submissionKey: {
  type: String,
  unique: true,
  sparse: true,
  trim: true,
},

    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Volunteer",
      default: null,
    },

    emergencyType: {
      type: String,
      enum: [
        "FLOOD",
        "CYCLONE",
        "EARTHQUAKE",
        "FIRE",
        "LANDSLIDE",
        "MEDICAL",
        "OTHER",
        "Rescue",
        "Medical Help",
        "Food",
        "Water",
        "Transportation",
        "Shelter",
        "Evacuation",
        "Other",
      ],
      required: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      address: {
        type: String,
        default: "",
      },
      latitude: {
        type: Number,
        required: true,
        min: -90,
        max: 90,
      },
      longitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180,
      },
    },

    numberOfPeople: {
      type: Number,
      required: true,
      min: 1,
    },

    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL", "NORMAL"],
      required: true,
    },

    contactNumber: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      type: String,
      default: "",
    },

    additionalInformation: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "ASSIGNED",
        "ACCEPTED",
        "ON_THE_WAY",
        "ARRIVED",
        "WORK_IN_PROGRESS",
        "COMPLETED",
        "REJECTED",
        "CANCELLED",
      ],
      default: "PENDING",
    },

    assignedAt: {
      type: Date,
      default: null,
    },

    acceptedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const EmergencyRequest = mongoose.model(
  "EmergencyRequest",
  emergencyRequestSchema
);

module.exports = EmergencyRequest;
