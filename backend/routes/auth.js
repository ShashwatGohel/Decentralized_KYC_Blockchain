const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Signup
router.post('/signup', async (req, res) => {
    try {
        const { username, password, fullName, walletAddress, role, entityName } = req.body;

        // Check if username exists
        let user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ message: 'Username already registered' });
        }

        if (!walletAddress) {
            return res.status(400).json({ message: 'Wallet address is required for registration' });
        }

        const normalizedWallet = walletAddress.toLowerCase();
        
        // Ensure wallet address is unique
        const existingWallet = await User.findOne({ walletAddress: normalizedWallet });
        if (existingWallet) {
            return res.status(400).json({ message: 'This wallet address is already associated with another account' });
        }

        user = new User({
            username,
            password,
            fullName,
            walletAddress: normalizedWallet,
            role: role || 'user',
            entityName: role === 'entity' ? entityName : undefined
        });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password, walletAddress } = req.body;

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Strict wallet verification during login (to enforce one wallet per entity/user)
        if (user.walletAddress && walletAddress) {
            if (user.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
                return res.status(400).json({ 
                    message: `Wallet mismatch. This account is locked to wallet: ${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`,
                    expectedWallet: user.walletAddress
                });
            }
        }
        
        // If user hasn't linked a wallet yet but is connecting one now, link it (ensuring uniqueness)
        if (!user.walletAddress && walletAddress) {
            const normalizedWallet = walletAddress.toLowerCase();
            const existingWallet = await User.findOne({ walletAddress: normalizedWallet });
            if (existingWallet) {
                return res.status(400).json({ message: 'This wallet is already attached to another account.' });
            }
            user.walletAddress = normalizedWallet;
            await user.save();
        }

        const payload = {
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
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '24h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: payload.user });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

const auth = require('../middleware/auth');

// @route   POST api/auth/link-wallet
// @desc    Link currently connected wallet to user profile
router.post('/link-wallet', auth, async (req, res) => {
    try {
        const { walletAddress } = req.body;
        if (!walletAddress) return res.status(400).json({ message: 'Wallet address required' });

        const normalizedWallet = walletAddress.toLowerCase();

        // Check if wallet is already linked to another user
        const existingWallet = await User.findOne({ 
            walletAddress: normalizedWallet,
            _id: { $ne: req.user.id } // Exclude current user
        });

        if (existingWallet) {
            return res.status(400).json({ message: 'This wallet address is already associated with another account' });
        }

        const user = await User.findById(req.user.id);
        user.walletAddress = normalizedWallet;
        await user.save();

        res.json({ 
            message: 'Wallet linked successfully!',
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
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
