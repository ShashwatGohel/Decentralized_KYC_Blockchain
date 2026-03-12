const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const User = require('./models/User');
const VerificationRequest = require('./models/VerificationRequest');

async function checkDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dekyc');
        console.log('Connected to MongoDB');

        const pendingEntities = await User.find({ role: 'entity', registrationStatus: 'pending' });
        console.log(`\n--- Pending Entities (${pendingEntities.length}) ---`);
        pendingEntities.forEach(e => console.log(`- ${e.username} (${e.entityName}): ${e.registrationStatus}`));

        const admin = await User.findOne({ role: 'admin' });
        if (admin) {
            console.log(`\nAdmin found: ${admin.username} (${admin._id})`);
            const adminRequests = await VerificationRequest.find({ entity: admin._id });
            console.log(`\n--- Verification Requests for Admin (${adminRequests.length}) ---`);
            adminRequests.forEach(r => console.log(`- User: ${r.user} | Status: ${r.status}`));
        } else {
            console.log('\n❌ No Admin user found!');
        }

        const allEntities = await User.find({ role: 'entity' });
        console.log(`\n--- All Entities (${allEntities.length}) ---`);
        allEntities.forEach(e => console.log(`- ${e.username} (${e.entityName}): ${e.registrationStatus}`));

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkDB();
