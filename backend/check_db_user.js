const mongoose = require('mongoose');
const User = require('./models/User');
const fs = require('fs');
require('dotenv').config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({});
        let output = "=== DB USERS LIST ===\n";
        users.forEach(u => {
            output += `- Username: ${u.username}\n`;
            output += `  Role:     ${u.role}\n`;
            output += `  Wallet:   ${u.walletAddress}\n`;
            output += `  _id:      ${u._id}\n`;
            output += "--------------------\n";
        });
        fs.writeFileSync('users_snapshot.txt', output);
        console.log("Written to users_snapshot.txt");
    } catch (e) {
        console.error("Error:", e.message);
    }
    process.exit();
}

check();
