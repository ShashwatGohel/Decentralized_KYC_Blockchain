const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = require('../middleware/auth');

// @route   POST api/vault/add
// @desc    Add document to vault
router.post('/add', auth, async (req, res) => {
    try {
        const { fileName, ipfsHash, fileHash } = req.body;
        const user = await User.findById(req.user.id);

        user.vault.push({ fileName, ipfsHash, fileHash });
        await user.save();

        res.json(user.vault);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/vault
// @desc    Get user vault
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json(user.vault);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/vault/share
// @desc    Share document with an entity (e.g. Bank)
router.post('/share', auth, async (req, res) => {
    try {
        const { fileHash, entityName } = req.body;
        const user = await User.findById(req.user.id);

        const doc = user.vault.find(d => d.fileHash === fileHash);
        if (!doc) return res.status(404).json({ message: 'Document not found' });

        if (!doc.sharedWith) {
            doc.sharedWith = []; // Initialize if not present
        }
        if (!doc.sharedWith.includes(entityName)) {
            doc.sharedWith.push(entityName);
        }

        await user.save();
        res.json(user.vault);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/vault/:fileHash
// @desc    Delete document from vault
router.delete('/:fileHash', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        user.vault = user.vault.filter(doc => doc.fileHash !== req.params.fileHash);
        await user.save();

        res.json(user.vault);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/vault/admin/add-to-user
// @desc    Admin adds verified hash to a user's vault (Public for Admin secret route)
router.post('/admin/add-to-user', async (req, res) => {
    try {
        const { userId, fileName, ipfsHash, fileHash } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Check if hash already exists in vault to avoid duplicates
        const exists = user.vault.some(d => d.fileHash === fileHash);
        if (!exists) {
            user.vault.push({ 
                fileName: `GOVT_VERIFIED: ${fileName}`, 
                ipfsHash, 
                fileHash, 
                status: 'Verified' 
            });
            await user.save();
        }

        res.json({ message: 'Hash successfully added to user vault', vault: user.vault });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
