const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { multiSigContract } = require('../utils/blockchain');

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

module.exports = router;
