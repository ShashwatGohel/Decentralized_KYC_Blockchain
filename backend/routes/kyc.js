const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const { kycContract, getUserHistory } = require('../utils/blockchain');

// @route   GET api/kyc/status
// @desc    Get user's KYC status and history from blockchain
router.get('/status', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user.walletAddress) {
            return res.json({ registered: false, history: [] });
        }

        const history = await getUserHistory(user.walletAddress);
        const onChainUser = await kycContract.users(user.walletAddress);

        res.json({
            registered: onChainUser.isRegistered,
            history: history
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/kyc/grant-access
// @desc    Update DB status when user grants access on-chain (frontend handles tx)
router.post('/grant-access', auth, async (req, res) => {
    try {
        const { entityAddress } = req.body;
        // This is mainly for DB sync, the source of truth is the blockchain
        res.json({ message: 'Access grant reflected' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   POST api/kyc/verify-sync
// @desc    Mark the latest matching vault document as Verified after on-chain anchoring
router.post('/verify-sync', auth, async (req, res) => {
    try {
        // Only government/verifier/bank should call this
        if (req.user.role !== 'government' && req.user.role !== 'verifier' && req.user.role !== 'bank') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const { userWallet, docHash } = req.body;
        if (!userWallet || !docHash) return res.status(400).json({ message: 'userWallet and docHash are required' });

        const user = await User.findOne({ walletAddress: userWallet.toLowerCase() });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Find the most recent vault item matching this hash and mark verified
        for (let i = user.vault.length - 1; i >= 0; i--) {
            if (user.vault[i]?.fileHash === docHash) {
                user.vault[i].status = 'Verified';
                await user.save();
                return res.json({ message: 'Vault status updated', verifiedFileHash: docHash });
            }
        }

        // If hash wasn't found in vault, still return ok (on-chain is source of truth),
        // but UI will remain "Pending" until the matching upload exists.
        res.json({ message: 'No matching vault entry found for hash; no status updated' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
