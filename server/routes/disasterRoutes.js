
const express = require("express");
const DisasterAlert = require("../models/DisasterAlert");
const User = require("../models/User");
const Notification = require("../models/Notification");
const protectAdmin = require("../middleware/adminAuthMiddleware");
const protect = require("../middleware/authMiddleware");
const calculateDistance = require("../utils/locationUtils");

const router = express.Router();

// Create a disaster alert and notify users inside its radius.
// Only admins can publish alerts.
router.post("/create", protectAdmin, async (req, res) => {
    try {
        const {
            disasterType,
            title,
            description,
            severity,
            affectedLocation,
            latitude,
            longitude,
            radius,
            safetyInstructions,
            evacuationInstructions,
            shelterInformation,
            source
        } = req.body;

        const lat = Number(latitude);
        const lng = Number(longitude);
        const alertRadius = Number(radius);

        if (
            !disasterType ||
            !title ||
            !description ||
            !severity ||
            !affectedLocation ||
            !Number.isFinite(lat) ||
            lat < -90 ||
            lat > 90 ||
            !Number.isFinite(lng) ||
            lng < -180 ||
            lng > 180 ||
            !Number.isFinite(alertRadius) ||
            alertRadius <= 0
        ) {
            return res.status(400).json({
                message: "Please provide valid alert details, coordinates, and radius."
            });
        }

        const alert = new DisasterAlert({
            disasterType,
            title,
            description,
            severity,
            affectedLocation,
            latitude: lat,
            longitude: lng,
            radius: alertRadius,
            safetyInstructions,
            evacuationInstructions,
            shelterInformation,
            source,
            publishedBy: req.admin.adminId,
            status: "ACTIVE",
            publishedAt: new Date()
        });

        await alert.save();

        const users = await User.find({
            "location.latitude": { $exists: true, $ne: null },
            "location.longitude": { $exists: true, $ne: null }
        });

        const notifications = [];

        for (const user of users) {
            const userLatitude = user.location?.latitude;
            const userLongitude = user.location?.longitude;

            if (
                typeof userLatitude !== "number" ||
                typeof userLongitude !== "number" ||
                !Number.isFinite(userLatitude) ||
                !Number.isFinite(userLongitude) ||
                userLatitude < -90 ||
                userLatitude > 90 ||
                userLongitude < -180 ||
                userLongitude > 180
            ) {
                continue;
            }

            // Both distance and radius are measured in kilometres.
            const distance = calculateDistance(
                lat,
                lng,
                userLatitude,
                userLongitude
            );

            if (distance <= alertRadius) {
                notifications.push({
                    userId: user._id,
                    type: "DISASTER_ALERT",
                    title: `⚠️ ${title}`,
                    message:
                        `Your registered location is within the affected area ` +
                        `for ${disasterType}. Please follow official safety ` +
                        `and evacuation instructions.`,
                    relatedAlertId: alert._id,
                    isRead: false
                });
            }
        }

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        return res.status(201).json({
            message: "Disaster alert created successfully",
            alert,
            affectedUserCount: notifications.length,
            notificationsCreated: notifications.length
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to create disaster alert",
            error: error.message
        });
    }
});

// Fetch all disaster alerts for admins only.
router.get("/", protectAdmin, async (req, res) => {
    try {
        const alerts = await DisasterAlert.find()
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Disaster alerts fetched successfully",
            count: alerts.length,
            alerts
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch disaster alerts",
            error: error.message
        });
    }
});

// Fetch active alerts for logged-in users only.
router.get("/active", protect, async (req, res) => {
    try {
        const alerts = await DisasterAlert.find({
            status: "ACTIVE"
        })
            .select(
                "disasterType title description severity affectedLocation latitude longitude radius safetyInstructions evacuationInstructions shelterInformation publishedAt status"
            )
            .sort({ publishedAt: -1 });

        return res.status(200).json({
            message: "Active disaster alerts fetched successfully",
            count: alerts.length,
            alerts
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch active disaster alerts",
            error: error.message
        });
    }
});

// Update a disaster alert. Admin only.
router.put("/:id", protectAdmin, async (req, res) => {
    try {
        const alert = await DisasterAlert.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!alert) {
            return res.status(404).json({
                message: "Disaster alert not found"
            });
        }

        return res.status(200).json({
            message: "Disaster alert updated successfully",
            alert
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to update disaster alert",
            error: error.message
        });
    }
});

// Cancel a disaster alert. Admin only.
router.put("/:id/cancel", protectAdmin, async (req, res) => {
    try {
        const alert = await DisasterAlert.findByIdAndUpdate(
            req.params.id,
            { status: "CANCELLED" },
            {
                new: true,
                runValidators: true
            }
        );

        if (!alert) {
            return res.status(404).json({
                message: "Disaster alert not found"
            });
        }

        return res.status(200).json({
            message: "Disaster alert cancelled successfully",
            alert
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to cancel disaster alert",
            error: error.message
        });
    }
});

// Find users inside a disaster alert's radius. Admin only.
router.get("/:id/affected-users", protectAdmin, async (req, res) => {
    try {
        const alert = await DisasterAlert.findById(req.params.id);

        if (!alert) {
            return res.status(404).json({
                message: "Disaster alert not found"
            });
        }

        const users = await User.find({
            "location.latitude": { $exists: true, $ne: null },
            "location.longitude": { $exists: true, $ne: null }
        }).select("-password");

        const affectedUsers = users.filter((user) => {
            const lat = user.location?.latitude;
            const lng = user.location?.longitude;

            if (
                typeof lat !== "number" ||
                typeof lng !== "number" ||
                !Number.isFinite(lat) ||
                !Number.isFinite(lng) ||
                lat < -90 ||
                lat > 90 ||
                lng < -180 ||
                lng > 180
            ) {
                return false;
            }

            const distance = calculateDistance(
                alert.latitude,
                alert.longitude,
                lat,
                lng
            );

            return distance <= alert.radius;
        });

        return res.status(200).json({
            message: "Affected users fetched successfully",
            count: affectedUsers.length,
            users: affectedUsers
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to find affected users",
            error: error.message
        });
    }
});

module.exports = router;
