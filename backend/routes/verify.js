const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const VerificationRequest = require('../models/VerificationRequest');
const User = require('../models/User');

// @route   POST api/verify/apply
// @desc    User submits documents to an entity for verification
router.post('/apply', auth, async (req, res) => {
    try {
        const { entityId, documentCIDs } = req.body;

        const request = new VerificationRequest({
            user: req.user.id,
            entity: entityId,
            documentCIDs: documentCIDs
        });

        await request.save();
        res.json(request);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// @route   GET api/verify/my-applications
// @desc    User gets their verification applications
router.get('/my-applications', auth, async (req, res) => {
    try {
        const applications = await VerificationRequest.find({ user: req.user.id })
            .populate('entity', 'entityName fullName walletAddress')
            .sort({ createdAt: -1 });
        res.json(applications);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// @route   GET api/verify/incoming
// @desc    Entity gets incoming verification applications (Public for Admin secret route)
router.get('/incoming', async (req, res) => {
    try {
        let targetId;
        
        // If no auth token, assume we are fetching for the admin (Government) via the secret route
        if (!req.header('x-auth-token')) {
            const admin = await User.findOne({ role: 'admin' });
            if (!admin) return res.status(404).json({ message: 'Admin account not found' });
            targetId = admin._id;
        } else {
            // Standard auth flow for logged-in entities
            const auth = require('../middleware/auth');
            return auth(req, res, async () => {
                const applications = await VerificationRequest.find({ entity: req.user.id })
                    .populate('user', 'fullName username walletAddress')
                    .sort({ createdAt: -1 });
                res.json(applications);
            });
        }

        const applications = await VerificationRequest.find({ entity: targetId })
            .populate('user', 'fullName username walletAddress')
            .sort({ createdAt: -1 });
        res.json(applications);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// @route   POST api/verify/update-status
// @desc    Entity updates application status (Public for Admin secret route)
router.post('/update-status', async (req, res) => {
    try {
        const { requestId, status } = req.body;

        const request = await VerificationRequest.findById(requestId);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        // If no auth token, allow update (assuming secret admin route)
        // In a production app, you'd add IP whitelisting or a secret API key here
        request.status = status;
        await request.save();

        res.json(request);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// @route   GET api/verify/user-details/:walletAddress
// @desc    Verifier gets user details and their latest vault hash for anchoring
router.get('/user-details/:walletAddress', auth, async (req, res) => {
    try {
        // Only verifiers/government can use this discovery endpoint
        if (req.user.role !== 'government' && req.user.role !== 'verifier' && req.user.role !== 'bank') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const user = await User.findOne({ walletAddress: req.params.walletAddress.toLowerCase() })
            .select('fullName walletAddress vault');
        
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Get the latest hash from the vault
        const latestDoc = user.vault && user.vault.length > 0 
            ? user.vault[user.vault.length - 1] 
            : null;

        res.json({
            fullName: user.fullName,
            walletAddress: user.walletAddress,
            latestHash: latestDoc ? latestDoc.fileHash : null,
            latestFileName: latestDoc ? latestDoc.fileName : null
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
