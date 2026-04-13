const mongoose = require('mongoose');

const ProofRecordSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    statement: {
        type: String, // e.g., 'age_over_18'
        required: true
    },
    verifier: {
        type: String, // Wallet address of the entity who verified it
    },
    proof: {
        type: Object, // The ZK proof object
        required: true
    },
    publicSignals: {
        type: Array,
        required: true
    },
    verifiedAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    }
});

module.exports = mongoose.model('ProofRecord', ProofRecordSchema);
