
const express = require("express");
const router = express.Router();

const Shelter = require("../models/Shelter");
const User = require("../models/User");
const protectAdmin = require("../middleware/adminAuthMiddleware");
const protect = require("../middleware/authMiddleware");
const { getDistance } = require("geolib");

// ========================================
// 1. CREATE A NEW SHELTER (ADMIN)
// ========================================
router.post("/create", protectAdmin, async (req, res) => {
    try {
        const {
            name,
            address,
            location,
            capacity,
            currentOccupancy = 0,
            facilities,
            contactNumber,
            status
        } = req.body;

        const numericCapacity = Number(capacity);
        const numericOccupancy = Number(currentOccupancy);

        if (!name || !name.trim() || !address || !address.trim()) {
            return res.status(400).json({
                message: "Shelter name and address are required."
            });
        }

        if (
            capacity === undefined ||
            !Number.isInteger(numericCapacity) ||
            numericCapacity < 1 ||
            !Number.isInteger(numericOccupancy) ||
            numericOccupancy < 0 ||
            numericOccupancy > numericCapacity
        ) {
            return res.status(400).json({
                message: "Please enter a valid capacity and occupancy."
            });
        }

        if (
            !location ||
            !Number.isFinite(Number(location.latitude)) ||
            !Number.isFinite(Number(location.longitude)) ||
            Number(location.latitude) < -90 ||
            Number(location.latitude) > 90 ||
            Number(location.longitude) < -180 ||
            Number(location.longitude) > 180
        ) {
            return res.status(400).json({
                message: "Please provide valid latitude and longitude."
            });
        }

        const shelter = await Shelter.create({
            name: name.trim(),
            address: address.trim(),
            location: {
                latitude: Number(location.latitude),
                longitude: Number(location.longitude)
            },
            capacity: numericCapacity,
            currentOccupancy: numericOccupancy,
            facilities: facilities || [],
            contactNumber: contactNumber || "",
            status:
                status === "CLOSED"
                    ? "CLOSED"
                    : numericOccupancy >= numericCapacity
                        ? "FULL"
                        : "OPEN"
        });

        return res.status(201).json({
            message: "Shelter created successfully",
            shelter: {
                ...shelter.toObject(),
                availableSpaces: Math.max(
                    0,
                    shelter.capacity - shelter.currentOccupancy
                )
            }
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to create shelter",
            error: error.message
        });
    }
});

// ========================================
// 2. GET ALL SHELTERS (ADMIN)
// ========================================
router.get("/", protectAdmin, async (req, res) => {
    try {
        const shelters = await Shelter.find().sort({ createdAt: -1 });

        const sheltersWithAvailability = shelters.map((shelter) => ({
            ...shelter.toObject(),
            availableSpaces: Math.max(
                0,
                shelter.capacity - shelter.currentOccupancy
            )
        }));

        return res.status(200).json({
            message: "Shelters fetched successfully",
            shelters: sheltersWithAvailability
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch shelters",
            error: error.message
        });
    }
});

// ========================================
// 3. GET NEARBY SHELTERS (USER)
// ========================================
router.get("/user", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (
            !user.location ||
            !Number.isFinite(Number(user.location.latitude)) ||
            !Number.isFinite(Number(user.location.longitude))
        ) {
            return res.status(400).json({
                message: "User location is not available."
            });
        }

        const shelters = await Shelter.find({
            status: { $in: ["OPEN", "FULL"] }
        });

        const sheltersWithDistance = shelters
            .filter((shelter) =>
                shelter.location &&
                Number.isFinite(Number(shelter.location.latitude)) &&
                Number.isFinite(Number(shelter.location.longitude))
            )
            .map((shelter) => {
                const distance = getDistance(
                    {
                        latitude: Number(user.location.latitude),
                        longitude: Number(user.location.longitude)
                    },
                    {
                        latitude: Number(shelter.location.latitude),
                        longitude: Number(shelter.location.longitude)
                    }
                );

                return {
                    ...shelter.toObject(),
                    distanceInMeters: distance,
                    distanceInKm: Number((distance / 1000).toFixed(2)),
                    availableSpaces: Math.max(
                        0,
                        shelter.capacity - shelter.currentOccupancy
                    )
                };
            });

        sheltersWithDistance.sort(
            (a, b) => a.distanceInMeters - b.distanceInMeters
        );

        return res.status(200).json({
            message: "Nearby shelters fetched successfully",
            shelters: sheltersWithDistance
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch nearby shelters",
            error: error.message
        });
    }
});

// ========================================
// 4. UPDATE A SHELTER (ADMIN)
// ========================================
router.put("/:id", protectAdmin, async (req, res) => {
    try {
        const shelter = await Shelter.findById(req.params.id);

        if (!shelter) {
            return res.status(404).json({
                message: "Shelter not found"
            });
        }

        const newCapacity =
            req.body.capacity !== undefined
                ? Number(req.body.capacity)
                : shelter.capacity;

        const newOccupancy =
            req.body.currentOccupancy !== undefined
                ? Number(req.body.currentOccupancy)
                : shelter.currentOccupancy;

        if (
            !Number.isInteger(newCapacity) ||
            newCapacity < 1 ||
            !Number.isInteger(newOccupancy) ||
            newOccupancy < 0 ||
            newOccupancy > newCapacity
        ) {
            return res.status(400).json({
                message: "Please enter a valid capacity and occupancy."
            });
        }

        if (
            req.body.location !== undefined &&
            (
                !req.body.location ||
                !Number.isFinite(Number(req.body.location.latitude)) ||
                !Number.isFinite(Number(req.body.location.longitude)) ||
                Number(req.body.location.latitude) < -90 ||
                Number(req.body.location.latitude) > 90 ||
                Number(req.body.location.longitude) < -180 ||
                Number(req.body.location.longitude) > 180
            )
        ) {
            return res.status(400).json({
                message: "Please provide valid latitude and longitude."
            });
        }

        shelter.capacity = newCapacity;
        shelter.currentOccupancy = newOccupancy;

        if (req.body.name !== undefined) {
            shelter.name = req.body.name;
        }

        if (req.body.address !== undefined) {
            shelter.address = req.body.address;
        }

        if (req.body.location !== undefined) {
            shelter.location = {
                latitude: Number(req.body.location.latitude),
                longitude: Number(req.body.location.longitude)
            };
        }

        if (req.body.facilities !== undefined) {
            shelter.facilities = req.body.facilities;
        }

        if (req.body.contactNumber !== undefined) {
            shelter.contactNumber = req.body.contactNumber;
        }

        if (req.body.status === "CLOSED") {
            shelter.status = "CLOSED";
        } else if (
            req.body.status !== undefined ||
            req.body.capacity !== undefined ||
            req.body.currentOccupancy !== undefined
        ) {
            shelter.status =
                newOccupancy >= newCapacity ? "FULL" : "OPEN";
        }

        await shelter.save();

        return res.status(200).json({
            message: "Shelter updated successfully",
            shelter: {
                ...shelter.toObject(),
                availableSpaces: Math.max(
                    0,
                    shelter.capacity - shelter.currentOccupancy
                )
            }
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to update shelter",
            error: error.message
        });
    }
});

// ========================================
// 5. DELETE A SHELTER (ADMIN)
// ========================================
router.delete("/:id", protectAdmin, async (req, res) => {
    try {
        const shelter = await Shelter.findByIdAndDelete(req.params.id);

        if (!shelter) {
            return res.status(404).json({
                message: "Shelter not found"
            });
        }

        return res.status(200).json({
            message: "Shelter deleted successfully"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to delete shelter",
            error: error.message
        });
    }
});

// ========================================
// ========================================
// 6. GET SHELTERS FOR MAP (LOGGED-IN USERS)
// ========================================
router.get("/map", protect, async (req, res) => {
    try {
        const shelters = await Shelter.find({
            status: { $in: ["OPEN", "FULL"] }
        })
            .select(
                "name address location capacity currentOccupancy facilities status contactNumber"
            )
            .sort({ createdAt: -1 });

        const sheltersWithAvailability = shelters.map((shelter) => ({
            ...shelter.toObject(),
            availableSpaces: Math.max(
                0,
                shelter.capacity - shelter.currentOccupancy
            )
        }));

        return res.status(200).json({
            message: "Shelters fetched successfully",
            shelters: sheltersWithAvailability
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch shelters",
            error: error.message
        });
    }
});

// ========================================
// 7. GET ONE SHELTER BY ID (ADMIN)
// ========================================
router.get("/:id", protectAdmin, async (req, res) => {
    try {
        const shelter = await Shelter.findById(req.params.id);

        if (!shelter) {
            return res.status(404).json({
                message: "Shelter not found"
            });
        }

        return res.status(200).json({
            message: "Shelter fetched successfully",
            shelter: {
                ...shelter.toObject(),
                availableSpaces: Math.max(
                    0,
                    shelter.capacity - shelter.currentOccupancy
                )
            }
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch shelter",
            error: error.message
        });
    }
});

module.exports = router;
