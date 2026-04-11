const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB for seeding...");

        const salt = await bcrypt.genSalt(10);
        
        // 1. Setup Admin
        const adminPassword = 'admin123';
        const hashedAdminPassword = await bcrypt.hash(adminPassword, salt);
        
        await User.findOneAndUpdate(
            { username: 'admin' },
            { 
                password: hashedAdminPassword,
                role: 'admin',
                fullName: 'System Administrator',
                walletAddress: '0x0af9a4a27e69b29bd448d7028181f655f64b8ca0'.toLowerCase()
            },
            { upsert: true, new: true }
        );
        console.log("Admin account ensured: admin / admin123");

        // 2. Reset others
        const users = await User.find({ username: { $ne: 'admin' } });
        const defaultPassword = 'password123';
        const hashedDefaultPassword = await bcrypt.hash(defaultPassword, salt);

        console.log(`\nFound ${users.length} other users. Resetting passwords to 'password123'...`);
        
        for (let user of users) {
             await User.findByIdAndUpdate(user._id, { 
                password: hashedDefaultPassword 
             }, { runValidators: false });
            console.log(`- Reset: ${user.username} (${user.role})`);
        }

        console.log("\nSeeding complete!");
        process.exit(0);
    } catch (err) {
        console.error("Seeding error:", err);
        process.exit(1);
    }
}

seed();
