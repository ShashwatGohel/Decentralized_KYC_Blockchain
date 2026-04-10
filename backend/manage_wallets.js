require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dekyc';

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
                console.log(`\nSUCCESS: Updated ${username}'s wallet to ${newWallet}\n`);
            } else {
                console.log(`\nERROR: User '${username}' not found.\n`);
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
