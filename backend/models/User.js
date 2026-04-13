const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    fullName: {
        type: String,
        required: true
    },
    walletAddress: {
        type: String,
        default: null
    },
    vault: [{
        fileName: String,
        ipfsHash: String,
        fileHash: String,
        uploadedAt: { type: Date, default: Date.now },
        status: { type: String, default: 'Stored' },
        sharedWith: [String]
    }],
    role: {
        type: String,
        enum: ['user', 'entity', 'verifier', 'admin', 'government', 'bank'],
        default: 'user'
    },
    entityName: {
        type: String, // Company/Bank name if role is entity
    },
    registrationStatus: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected'],
        default: 'none'
    },
    onChainType: {
        type: Number, // Enum value for smart contract
        default: 0
    },
    apiEndpoint: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', UserSchema);
