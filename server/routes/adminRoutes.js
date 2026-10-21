const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const protectAdmin = require("../middleware/adminAuthMiddleware");
const Notification = require("../models/Notification");
const User = require("../models/User");
const Volunteer = require("../models/Volunteer");
const DisasterAlert = require("../models/DisasterAlert");
const EmergencyRequest = require("../models/EmergencyRequest");
const VolunteerTask = require("../models/VolunteerTask");
const router = express.Router();

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            admin.password
        );

        if (!isPasswordCorrect) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                adminId: admin._id,
                role: admin.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.status(200).json({
            message: "Admin login successful",
            token: token,
            admin: {
                id: admin._id,
                fullName: admin.fullName,
                email: admin.email,
                role: admin.role
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Admin login failed",
            error: error.message
        });
    }
});

router.get("/profile", protectAdmin, async (req, res) => {
    try {
        const admin = await Admin.findById(
            req.admin.adminId
        ).select("-password");

        if (!admin) {
            return res.status(404).json({
                message: "Admin not found"
            });
        }

        res.status(200).json({
            message: "Admin profile accessed successfully",
            admin: admin
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to get admin profile"
        });
    }
});
router.get("/notifications", protectAdmin, async (req, res) => {
    try {
        const notifications = await Notification.find({
            adminId: req.admin.adminId
        }).sort({ createdAt: -1 });

        res.status(200).json({
            message: "Admin notifications fetched successfully",
            notifications: notifications
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch admin notifications",
            error: error.message
        });
    }
});
router.get("/dashboard-stats", protectAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();

        const activeAlerts = await DisasterAlert.countDocuments({
            status: "ACTIVE"
        });
        const activeAlertList = await DisasterAlert.find({
    status: "ACTIVE"
});

let affectedUserIds = new Set();

for (const alert of activeAlertList) {
    const users = await User.find({
        "location.latitude": {
            $gte: alert.latitude - (alert.radius / 111),
            $lte: alert.latitude + (alert.radius / 111)
        },
        "location.longitude": {
            $gte: alert.longitude - (alert.radius / 111),
            $lte: alert.longitude + (alert.radius / 111)
        }
    }).select("_id");

    users.forEach(user => affectedUserIds.add(user._id.toString()));
}

const affectedUsers = affectedUserIds.size;

        const pendingRequests = await EmergencyRequest.countDocuments({
            status: "PENDING"
        });

        const assignedRequests = await EmergencyRequest.countDocuments({
            status: {
                $in: [
                    "ASSIGNED",
                    "ACCEPTED",
                    "ON_THE_WAY",
                    "ARRIVED",
                    "WORK_IN_PROGRESS"
                ]
            }
        });

        const activeVolunteers = await Volunteer.countDocuments({
            availabilityStatus: "ACTIVE"
        });

        const busyVolunteers = await Volunteer.countDocuments({
            availabilityStatus: "BUSY"
        });

        const completedRequests = await EmergencyRequest.countDocuments({
            status: "COMPLETED"
        });

        res.status(200).json({
            message: "Dashboard statistics fetched successfully",
            statistics: {
                totalUsers,
                activeAlerts,
                affectedUsers,
                pendingRequests,
                assignedRequests,
                activeVolunteers,
                busyVolunteers,
                completedRequests
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch dashboard statistics",
            error: error.message
        });
    }
});
router.get("/request-stats", protectAdmin, async (req, res) => {
    try {
        const byType = await EmergencyRequest.aggregate([
            {
                $group: {
                    _id: "$emergencyType",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        const byStatus = await EmergencyRequest.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        const byPriority = await EmergencyRequest.aggregate([
            {
                $group: {
                    _id: "$priority",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        res.status(200).json({
            message: "Emergency request statistics fetched successfully",
            statistics: {
                byType,
                byStatus,
                byPriority
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch emergency request statistics",
            error: error.message
        });
    }
});
router.get("/volunteer-stats", protectAdmin, async (req, res) => {
    try {
        const byAvailability = await Volunteer.aggregate([
            {
                $group: {
                    _id: "$availabilityStatus",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        const taskActivity = await VolunteerTask.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        res.status(200).json({
            message: "Volunteer statistics fetched successfully",
            statistics: {
                byAvailability,
                taskActivity
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch volunteer statistics",
            error: error.message
        });
    }
});
router.get("/alert-stats", protectAdmin, async (req, res) => {
    try {
        const byType = await DisasterAlert.aggregate([
            {
                $group: {
                    _id: "$disasterType",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        const bySeverity = await DisasterAlert.aggregate([
            {
                $group: {
                    _id: "$severity",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        const byStatus = await DisasterAlert.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        res.status(200).json({
            message: "Disaster alert statistics fetched successfully",
            statistics: {
                byType,
                bySeverity,
                byStatus
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch disaster alert statistics",
            error: error.message
        });
    }
});

router.get("/users", protectAdmin, async (req, res) => {
    try {
        const users = await User.find()
            .select("-password")
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Users fetched successfully",
            count: users.length,
            users
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch users",
            error: error.message
        });
    }
});


module.exports = router;