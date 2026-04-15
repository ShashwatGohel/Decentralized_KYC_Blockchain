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
                walletAddress: '0x3aF75be923b21Fe14B5717895215C1975B71186d'.toLowerCase()
            },
            { upsert: true, new: true }
        );
        console.log("Admin account ensured: admin / admin123");

        // 2. Setup Core Test Users
        console.log("\nEnsuring Core Test Accounts...");
        const defaultPassword = 'password123';
        const hashedDefaultPassword = await bcrypt.hash(defaultPassword, salt);

        const testUsers = [
            { username: 'BhupendraPatel', role: 'government', fullName: 'Bhupendra Patel', wallet: '0x585CaE62915e95eFbba7615D39B7F7e103A1BdB9' },
            { username: 'Nirmala Devi', role: 'bank', fullName: 'Nirmala Devi', wallet: '0xb78d867e61f1f6e84a8c41e6c5b22696249573b9' },
            { username: 'Shashwat', role: 'user', fullName: 'Shashwat Gohel', wallet: '0xfc61ac7ea45c4143cbd99fdf5eda18407e5833be' },
            { username: 'dharman2701', role: 'user', fullName: 'Dharman', wallet: '0x4e8e3c8aa0f554a1598ffae12ac64e75dc8e5815' }
        ];

        for (let u of testUsers) {
            await User.findOneAndUpdate(
                { username: u.username },
                { 
                    password: hashedDefaultPassword,
                    role: u.role,
                    fullName: u.fullName,
                    walletAddress: u.wallet.toLowerCase(),
                    registrationStatus: u.role === 'user' ? 'approved' : 'none'
                },
                { upsert: true }
            );
            console.log(`- Ensured: ${u.username} (${u.role}) / password123`);
        }

        // 3. Reset others if any
        const others = await User.find({ username: { $nin: ['admin', ...testUsers.map(u => u.username)] } });
        console.log(`\nFound ${others.length} other users. Resetting...`);
        for (let user of others) {
             await User.findByIdAndUpdate(user._id, { password: hashedDefaultPassword }, { runValidators: false });
        }

        console.log("\nSeeding complete!");
        process.exit(0);
    } catch (err) {
        console.error("Seeding error:", err);
        process.exit(1);
    }
}

seed();
