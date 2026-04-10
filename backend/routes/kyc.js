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

module.exports = router;
