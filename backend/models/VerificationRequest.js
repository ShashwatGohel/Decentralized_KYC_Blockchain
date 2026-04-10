const mongoose = require('mongoose');

const VerificationRequestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    entity: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    documentCIDs: [{
        fileName: String,
        ipfsHash: String,
        fileHash: String
    }],
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'approved', 'rejected', 'verified'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('VerificationRequest', VerificationRequestSchema);
