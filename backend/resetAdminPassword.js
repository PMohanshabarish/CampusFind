
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/user");

async function resetPassword() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const user = await User.findOne({
            email: "mohan123@gmail.com"
        });

        if (!user) {
            console.log("Admin account not found!");
            return;
        }

        const newPassword = "Mohan@123";
        user.password = await bcrypt.hash(newPassword, 10);

        // Keep the existing Admin role
        await user.save();

        console.log("Admin password updated successfully!");
        console.log("Admin role:", user.role);

    } catch (error) {
        console.log(error.message);
    } finally {
        await mongoose.disconnect();
    }
}

resetPassword();
