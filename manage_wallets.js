const mongoose = require('mongoose');
const User = require('./backend/models/User');

// --- CONFIGURATION ---
const MONGO_URI = 'mongodb://localhost:27017/dekyc';

// USAGE: 
// 1. node manage_wallets.js list                  -> Show all users and their wallets
// 2. node manage_wallets.js update <username> <new_wallet> -> Update a specific user's wallet
// ---------------------

const args = process.argv.slice(2);
const command = args[0];

mongoose.connect(MONGO_URI)
    .then(async () => {
        if (command === 'list') {
            const users = await User.find({}, 'username fullName role walletAddress');
            console.log('\n--- SYSTEM USERS & REGISTERED WALLETS ---');
            users.forEach(u => {
                console.log(`[${u.role.toUpperCase()}] ${u.username} (${u.fullName}) -> ${u.walletAddress || 'NOT_LINKED'}`);
            });
            console.log('------------------------------------------\n');
        } 
        else if (command === 'update' && args.length === 3) {
            const username = args[1];
            const newWallet = args[2].toLowerCase();

            const result = await User.findOneAndUpdate(
                { username }, 
                { walletAddress: newWallet },
                { new: true }
            );

            if (result) {
                console.log(`SUCCESS: Updated ${username}'s wallet to ${newWallet}`);
            } else {
                console.log(`ERROR: User '${username}' not found.`);
            }
        }
        else {
            console.log('Usage:');
            console.log('  node manage_wallets.js list');
            console.log('  node manage_wallets.js update <username> <wallet_address>');
        }
        process.exit();
    })
    .catch(err => {
        console.error('Connection Error:', err);
        process.exit(1);
    });
