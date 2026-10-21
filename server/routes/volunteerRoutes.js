const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Volunteer = require("../models/Volunteer");
const protectVolunteer = require("../middleware/volunteerAuthMiddleware");
const Notification = require("../models/Notification");
const router = express.Router();


router.post("/register", async (req, res) => {
    try {
        const {
            fullName,
            email,
            mobile,
            password,
            city,
            location,
            address,
            skills,
            emergencyContact,
            availableServices,
            profilePhoto
        } = req.body;

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

        const latitude = Number(location?.latitude);
        const longitude = Number(location?.longitude);

        if (
            location?.latitude == null ||
            location?.longitude == null ||
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

        const existingVolunteer = await Volunteer.findOne({
            email: email.trim().toLowerCase()
        });

        if (existingVolunteer) {
            return res.status(400).json({
                message: "Email already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const volunteer = new Volunteer({
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            mobile,
            password: hashedPassword,
            role: "VOLUNTEER",
            city: city.trim(),
            location: {
                latitude,
                longitude
            },
            address: address.trim(),
            skills: Array.isArray(skills) ? skills : [],
            emergencyContact,
            availableServices: Array.isArray(availableServices)
                ? availableServices
                : [],
            profilePhoto
        });

        await volunteer.save();

        return res.status(201).json({
            message: "Volunteer registered successfully"
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                message: "Email already registered"
            });
        }

        return res.status(500).json({
            message: "Volunteer registration failed",
            error: error.message
        });
    }
});


router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const volunteer = await Volunteer.findOne({ email });

        if (!volunteer) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            volunteer.password
        );

        if (!isPasswordCorrect) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                volunteerId: volunteer._id,
                role: volunteer.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.status(200).json({
            message: "Volunteer login successful",
            token: token,
            volunteer: {
                id: volunteer._id,
                fullName: volunteer.fullName,
                email: volunteer.email,
                role: volunteer.role,
                availabilityStatus: volunteer.availabilityStatus
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Volunteer login failed",
            error: error.message
        });
    }
});
router.get("/profile", protectVolunteer, async (req, res) => {
    try {
        const volunteer = await Volunteer.findById(
            req.volunteer.volunteerId
        ).select("-password");

        if (!volunteer) {
            return res.status(404).json({
                message: "Volunteer not found"
            });
        }

        res.status(200).json({
            message: "Volunteer profile accessed successfully",
            volunteer: volunteer
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to get volunteer profile",
            error: error.message
        });
    }
});
router.get("/notifications", protectVolunteer, async (req, res) => {
    try {
        const notifications = await Notification.find({
            volunteerId: req.volunteer.volunteerId
        }).sort({ createdAt: -1 });

        res.status(200).json({
            message: "Volunteer notifications fetched successfully",
            notifications: notifications
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch volunteer notifications",
            error: error.message
        });
    }
});


router.get("/map", async (req, res) => {
    try {
        const volunteers = await Volunteer.find({
            availabilityStatus: "ACTIVE"
        }).select(
            "fullName email mobile city address location skills availableServices availabilityStatus"
        );

        res.status(200).json({
            message: "Available volunteers fetched successfully",
            volunteers
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch available volunteers",
            error: error.message
        });
    }
});


module.exports = router;