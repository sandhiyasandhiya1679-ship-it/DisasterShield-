
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const protect = require("../middleware/authMiddleware");
const Notification = require("../models/Notification");

const router = express.Router();

console.log("Auth routes loaded");

router.get("/test", (req, res) => {
    res.send("Auth route is working!");
});

// Register a new user
router.post("/register", async (req, res) => {
    console.log("REGISTER ROUTE HIT");

    try {
        const {
            fullName,
            email,
            mobile,
            password,
            city,
            location,
            address,
            emergencyContact
        } = req.body;

        // Validate required fields
        if (
            !fullName ||
            !email ||
            !mobile ||
            !password ||
            !city ||
            !address ||
            !emergencyContact
        ) {
            return res.status(400).json({
                message: "Please fill in all required fields."
            });
        }

        // Validate map coordinates
        const latitude = Number(location?.latitude);
        const longitude = Number(location?.longitude);

        if (
            !location ||
            location.latitude == null ||
            location.longitude == null ||
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            latitude < -90 ||
            latitude > 90 ||
            longitude < -180 ||
            longitude > 180
        ) {
            return res.status(400).json({
                message: "Please select a valid location on the map."
            });
        }

        // Check whether email already exists
        const normalizedEmail = email.trim().toLowerCase();
        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(400).json({
                message: "Email already registered"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = new User({
            fullName: fullName.trim(),
            email: normalizedEmail,
            mobile,
            password: hashedPassword,
            role: "USER",
            city: city.trim(),
            location: {
                latitude,
                longitude
            },
            address,
            emergencyContact
        });

        // Save user to MongoDB
        await user.save();

        return res.status(201).json({
            message: "User registered successfully"
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                message: "Email already registered"
            });
        }

        console.error("User registration error:", error);

        return res.status(500).json({
            message: "Registration failed",
            error: error.message
        });
    }
});

// Log in an existing user
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({
            email: email?.trim().toLowerCase()
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                userId: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Login failed",
            error: error.message
        });
    }
});

// Get the logged-in user's profile
router.get("/profile", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json({
            message: "Protected profile accessed successfully",
            user
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to get profile",
            error: error.message
        });
    }
});

// Get notifications for the logged-in user
router.get("/notifications", protect, async (req, res) => {
    try {
        const notifications = await Notification.find({
            userId: req.user.userId
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Notifications fetched successfully",
            notifications
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch notifications",
            error: error.message
        });
    }
});

// Mark a notification as read
router.put("/notifications/:id/read", protect, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            {
                _id: req.params.id,
                userId: req.user.userId
            },
            {
                isRead: true
            },
            {
                new: true
            }
        );

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found"
            });
        }

        return res.status(200).json({
            message: "Notification marked as read",
            notification
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to update notification",
            error: error.message
        });
    }
});

module.exports = router;
