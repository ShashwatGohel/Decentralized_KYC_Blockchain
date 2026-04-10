const express = require('express');
const router = express.Router();
const User = require('../models/User');

// @route   GET api/public/search
// @desc    Search users and entities by name
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) {
            return res.json([]);
        }

        // Case-insensitive regex search
        const regex = new RegExp(q, 'i');

        // Search in fullName (for users/entities) and entityName (for institutions)
        const results = await User.find({
            $or: [
                { fullName: regex },
                { entityName: regex }
            ],
            walletAddress: { $exists: true, $ne: null } // Only return if they have a wallet linked
        }).select('fullName entityName walletAddress role');

        // Format results
        const formattedResults = results.map(user => ({
            name: user.role === 'entity' ? user.entityName || user.fullName : user.fullName,
            walletAddress: user.walletAddress,
            role: user.role
        }));

        res.json(formattedResults);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
