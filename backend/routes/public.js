const express = require('express');
const router = express.Router();
const User = require('../models/User');

// @route   GET api/public/search
// @desc    Search users and entities by name
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        let query = { walletAddress: { $exists: true, $ne: null } };
        
        if (q && q.trim().length >= 1) {
            const regex = new RegExp(q.trim(), 'i');
            query.$or = [
                { fullName: regex },
                { entityName: regex }
            ];
        } else {
            // If no search term, only return entities/verifiers (institutions)
            query.role = { $in: ['entity', 'verifier'] };
        }

        const results = await User.find(query).select('fullName entityName walletAddress role');

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
