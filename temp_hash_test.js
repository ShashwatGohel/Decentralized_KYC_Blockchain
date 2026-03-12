const mongoose = require('mongoose');
const DataRequest = require('./models/DataRequest');
const User = require('./models/User');
require('dotenv').config();

async function checkDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB.");
        
        const requests = await DataRequest.find().sort({ requestedAt: -1 }).limit(1).populate('entityId');
        if (requests.length > 0) {
            console.log("Latest Request Shared Hash:", requests[0].sharedHash);
            console.log("Request Status:", requests[0].status);
            
            const user = await User.findOne({ walletAddress: new RegExp(requests[0].userWallet, 'i') });
            if (user) {
                const vaultDoc = user.vault.find(v => v.fileHash === requests[0].sharedHash);
                console.log("Found in user vault:", !!vaultDoc);
                console.log("Vault fileHash:", vaultDoc?.fileHash);
            }
        }
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}
checkDB();
