const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const targetWallet = "0xfc61ac7ea45c4143cbd99fdf5eda18407e5833be";
        
        // 1. Drop existing unique index if it exists
        try {
            await User.collection.dropIndex("walletAddress_1");
            console.log("Dropped unique walletAddress index.");
        } catch (e) {
            console.log("Index not found or already dropped.");
        }

        // 2. Update both users
        await User.updateOne({ username: "JayShah" }, { walletAddress: targetWallet });
        await User.updateOne({ username: "CodeX" }, { walletAddress: targetWallet });
        
        console.log(`Successfully migrated both CodeX and JayShah to wallet: ${targetWallet}`);
        
        const verification = await User.find({ username: { $in: ["JayShah", "CodeX"] } });
        verification.forEach(u => console.log(`${u.username}: ${u.walletAddress}`));
        
    } catch (e) {
        console.error("Migration error:", e.message);
    }
    process.exit();
}

migrate();
