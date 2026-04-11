const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { multiSigContract } = require('../utils/blockchain');

const User = require('../models/User');

// @route   GET api/admin/multisig/status
// @desc    Get multisig wallet status (owners, required confirmations)
router.get('/multisig/status', auth, async (req, res) => {
    try {
        if (!multiSigContract) return res.status(500).json({ message: 'MultiSig contract not initialized' });

        const owners = await multiSigContract.getOwners();
        const required = await multiSigContract.numConfirmationsRequired();
        const txCount = await multiSigContract.getTransactionCount();

        res.json({
            address: multiSigContract.target,
            owners,
            requiredConfirmations: Number(required),
            transactionCount: Number(txCount)
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/admin/system-stats
// @desc    Get counts of different entities in the system
router.get('/system-stats', async (req, res) => {
    try {
        const users = await User.countDocuments({ role: 'user' });
        const entities = await User.countDocuments({ role: { $in: ['entity', 'verifier'] } });
        // Keeping proofs and bans at 0 or fixed logic as they might be handled in a separate model/contract
        res.json({ users, entities, proofs: 0, bans: 0 });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/admin/entities
// @desc    Get all registered entities
router.get('/entities', async (req, res) => {
    try {
        const entities = await User.find({ role: { $in: ['entity', 'verifier'] } })
            .select('entityName role walletAddress onChainType registrationStatus');
        
        const mappedEntities = entities.map(e => ({
            entity_id: e._id,
            entity_name: e.entityName || e.username,
            entity_type: e.role,
            wallet_address: e.walletAddress || '0x...',
            kyc_agency: e.role === 'verifier',
            status: e.registrationStatus
        }));
        res.json(mappedEntities);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// The pending proposals will now be fetched directly from the smart contract by the frontend,
// but we'll add an empty endpoint just in case the frontend relies on it as a fallback.
router.get('/pending-proposals', async (req, res) => {
    res.json([]);
});

module.exports = router;
