const express = require('express');
const router = express.Router();
const User = require('../models/User');
const DataRequest = require('../models/DataRequest');
const jwt = require('jsonwebtoken');
const { getOnChainEntity } = require('../utils/blockchain');

const auth = require('../middleware/auth');

// @route   POST api/entity/request
// @desc    Create a data request for a user
router.post('/request', auth, async (req, res) => {
    try {
        if (req.user.role !== 'entity') {
            return res.status(403).json({ message: 'Only entities can create requests' });
        }

        const entity = await User.findById(req.user.id);
        if (!entity.walletAddress) {
            return res.status(400).json({ message: 'Please link your wallet to the institution portal first.' });
        }

        // Validate on-chain registration
        const onChainInfo = await getOnChainEntity(entity.walletAddress);
        if (!onChainInfo) {
            return res.status(403).json({ 
                message: 'This institution is not registered on the blockchain. Please complete the "On-Chain Registration" in your Institution Portal first.' 
            });
        }

        const { userWallet, docType } = req.body;

        const newRequest = new DataRequest({
            entityId: req.user.id,
            userWallet: userWallet.toLowerCase(),
            docType,
            entityType: onChainInfo.type // Store the on-chain type for verification protocol
        });

        await newRequest.save();
        res.status(201).json(newRequest);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// @route   GET api/entity/my-requests
// @desc    Get all requests made by the entity
router.get('/my-requests', auth, async (req, res) => {
    try {
        if (req.user.role !== 'entity') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const requests = await DataRequest.find({ entityId: req.user.id }).sort({ requestedAt: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// @route   DELETE api/entity/request/:id
// @desc    Cancel/Remove a data request made by the entity
router.delete('/request/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'entity') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const request = await DataRequest.findById(req.params.id);
        
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Ensure the entity trying to delete it is the one who created it
        if (request.entityId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized to delete this request' });
        }

        await DataRequest.findByIdAndDelete(req.params.id);
        res.json({ message: 'Request cancelled successfully' });
    } catch (err) {
        console.error('Delete Request Error:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// @route   GET api/entity/user-requests
// @desc    Get all requests made to the current user
router.get('/user-requests', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user.walletAddress) return res.json([]);

        const requests = await DataRequest.find({ userWallet: user.walletAddress.toLowerCase() })
            .populate('entityId', 'entityName fullName')
            .sort({ requestedAt: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// @route   POST api/entity/approve
// @desc    Approve a data request
router.post('/approve', auth, async (req, res) => {
    try {
        const { requestId, fileHash, ipfsHash } = req.body;

        const request = await DataRequest.findById(requestId);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        const user = await User.findById(req.user.id);
        if (request.userWallet !== user.walletAddress.toLowerCase()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        request.status = 'approved';
        request.sharedHash = fileHash;
        request.sharedIpfs = ipfsHash;
        request.respondedAt = Date.now();

        await request.save();
        res.json({ message: 'Request approved and data shared' });
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// @route   POST api/entity/reject
// @desc    Reject a data request
router.post('/reject', auth, async (req, res) => {
    try {
        const { requestId } = req.body;

        const request = await DataRequest.findById(requestId);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        const user = await User.findById(req.user.id);
        if (request.userWallet !== user.walletAddress.toLowerCase()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        request.status = 'rejected';
        request.respondedAt = Date.now();

        await request.save();
        res.json({ message: 'Request rejected' });
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// @route   POST api/entity/verify-request
// @desc    Mark a data request as verified on-chain
router.post('/verify-request', auth, async (req, res) => {
    try {
        const { requestId } = req.body;

        const request = await DataRequest.findById(requestId);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        if (request.entityId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        request.status = 'verified';
        await request.save();
        res.json({ message: 'Request marked as verified' });
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// @route   POST api/entity/apply
// @desc    Apply for on-chain registration (sets status to pending)
router.post('/apply', auth, async (req, res) => {
    try {
        if (req.user.role !== 'entity') {
            return res.status(403).json({ message: 'Only entities can apply for registration' });
        }

        const { onChainType, apiEndpoint } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.registrationStatus = 'approved'; // Bypassing admin approval
        user.onChainType = onChainType;
        user.apiEndpoint = apiEndpoint;
        await user.save();
        res.json({ 
            message: 'Institutional profile updated and approved.', 
            user: {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                walletAddress: user.walletAddress,
                role: user.role,
                entityName: user.entityName,
                registrationStatus: user.registrationStatus,
                onChainType: user.onChainType,
                apiEndpoint: user.apiEndpoint
            }
        });
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// @route   GET api/entity/pending-registrations
// @desc    Get all entities pending registration approval (Admin only - Publicly accessible for secret route)
router.get('/pending-registrations', async (req, res) => {
    try {
        const pendingEntities = await User.find({ 
            role: 'entity', 
            registrationStatus: 'pending' 
        }).select('-password').sort({ createdAt: -1 });

        res.json(pendingEntities);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// @route   POST api/entity/approve-registration
// @desc    Mark an entity's registration as approved (Admin only - Publicly accessible for secret route)
router.post('/approve-registration', async (req, res) => {
    try {
        const { entityId } = req.body;
        
        const entity = await User.findById(entityId);
        if (!entity || entity.role !== 'entity') {
            return res.status(404).json({ message: 'Entity not found' });
        }

        entity.registrationStatus = 'approved';
        await entity.save();

        res.json({ message: 'Entity registration approved successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// @route   GET api/entity/search-users
// @desc    Search for users by name or username
router.get('/search-users', auth, async (req, res) => {
    try {
        if (req.user.role !== 'entity') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const { query } = req.query;
        if (!query) return res.json([]);

        // Search for users with role 'user' and matching name/username
        const users = await User.find({
            role: 'user',
            $or: [
                { fullName: { $regex: query, $options: 'i' } },
                { username: { $regex: query, $options: 'i' } }
            ]
        }).select('fullName username walletAddress').limit(10);

        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// @route   GET api/entity/users
// @desc    List all users this entity has interacted with or can see
router.get('/users', auth, async (req, res) => {
    try {
        if (req.user.role !== 'entity') return res.status(403).json({ message: 'Unauthorized' });
        
        // Find users that have responded to requests from this entity
        const requests = await DataRequest.find({ entityId: req.user.id });
        const userWallets = [...new Set(requests.map(r => r.userWallet))];

        const users = await User.find({ walletAddress: { $in: userWallets } }).select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// @route   GET api/entity/users/:userId
// @desc    Get detailed info of a user with robust permissions check
router.get('/users/:userId', auth, async (req, res) => {
    try {
        if (req.user.role !== 'entity') return res.status(403).json({ message: 'Unauthorized' });

        const user = await User.findById(req.params.userId).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Ensure entity has an approved request from this user
        const hasAccess = await DataRequest.findOne({ 
            entityId: req.user.id, 
            userWallet: user.walletAddress.toLowerCase(),
            status: 'approved'
        });

        if (!hasAccess) {
            return res.status(403).json({ message: 'No active data access for this user' });
        }

        res.json(user);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// @route   GET api/entity/users/:userId/proofs
// @desc    Get all proofs for a specific user
router.get('/users/:userId/proofs', auth, async (req, res) => {
    try {
        const ProofRecord = require('../models/ProofRecord');
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Ensure entity has access
        const hasAccess = await DataRequest.findOne({ 
            entityId: req.user.id, 
            userWallet: user.walletAddress.toLowerCase(),
            status: 'approved'
        });

        if (!hasAccess) return res.status(403).json({ message: 'No active data access' });

        const proofs = await ProofRecord.find({ userId: req.params.userId });
        res.json(proofs);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// @route   GET api/entity/users/:userId/access
// @desc    Get the current access permissions this entity holds for this user
router.get('/users/:userId/access', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const requests = await DataRequest.find({ 
            entityId: req.user.id, 
            userWallet: user.walletAddress.toLowerCase()
        });

        res.json(requests);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

module.exports = router;
