const mongoose = require('mongoose');

const DataRequestSchema = new mongoose.Schema({
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userWallet: {
        type: String,
        required: true
    },
    docType: {
        type: String,
        required: true
    },
    entityType: {
        type: Number, // Enum value from smart contract
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'verified'],
        default: 'pending'
    },
    sharedHash: String,
    sharedIpfs: String,
    requestedAt: {
        type: Date,
        default: Date.now
    },
    respondedAt: Date
});

module.exports = mongoose.model('DataRequest', DataRequestSchema);
