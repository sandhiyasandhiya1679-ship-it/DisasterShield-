const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

const Admin = require("./models/Admin");

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const existingAdmin = await Admin.findOne({
            email: "admin@disastershield.com"
        });

        if (existingAdmin) {
            console.log("Admin already exists");
            process.exit();
        }

        const hashedPassword = await bcrypt.hash(
            "Admin@12345",
            10
        );

        const admin = new Admin({
            fullName: "DisasterShield Admin",
            email: "admin@disastershield.com",
            password: hashedPassword,
            role: "ADMIN"
        });

        await admin.save();

        console.log("Admin created successfully");

        process.exit();

    } catch (error) {
        console.log("Admin creation failed:", error.message);
        process.exit(1);
    }
};

createAdmin();