const express = require('express');
const router = express.Router();
const { kycContract, multiSigContract, provider } = require('../utils/blockchain');

let io; // Socket.io instance

// Helper to format event data
const formatEvent = (event, type) => {
    // Ethers args often contain BigInts which break res.json()
    let safeArgs = [];
    if (event.args) {
        safeArgs = Array.from(event.args).map(val => 
            typeof val === 'bigint' ? val.toString() : val
        );
    }
    
    return {
        blockNumber: event.blockNumber || event.log?.blockNumber,
        transactionHash: event.transactionHash || event.log?.transactionHash,
        event: event.eventName || event.fragment?.name || event.path || 'Transaction',
        args: safeArgs,
        timestamp: Date.now(),
        contractType: type
    };
};

const startLedgerPolling = (socketIo) => {
    io = socketIo;
    console.log('[LEDGER] Starting blockchain event polling...');

    if (!kycContract || !multiSigContract) return;

    // Listen for KYC events
    kycContract.on("*", (event) => {
        const entry = formatEvent(event, 'KYC');
        io.emit('new_event', entry);
    });

    // Listen for MultiSig events
    multiSigContract.on("*", (event) => {
        const entry = formatEvent(event, 'MultiSig');
        io.emit('new_event', entry);
    });

    // Block height updates
    setInterval(async () => {
        try {
            const blockNumber = await provider.getBlockNumber();
            io.emit('block_update', { number: blockNumber });
        } catch (err) {}
    }, 5000);
};

// GET /api/ledger/history - Fetch past events for the UI
router.get('/history', async (req, res) => {
    try {
        if (!kycContract || !multiSigContract || !provider) return res.json([]);

        // Safety: ensure fromBlock is never negative
        const currentBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 100);

        // Fetch blocks worth of events
        const [kycEvents, msEvents] = await Promise.all([
            kycContract.queryFilter('*', fromBlock),
            multiSigContract.queryFilter('*', fromBlock)
        ]);

        const allEvents = [
            ...kycEvents.map(e => ({ ...formatEvent(e, 'KYC'), event: e.fragment?.name || e.event || 'Event' })),
            ...msEvents.map(e => ({ ...formatEvent(e, 'MultiSig'), event: e.fragment?.name || e.event || 'Event' }))
        ].sort((a, b) => b.blockNumber - a.blockNumber);

        res.json(allEvents);
    } catch (err) {
        console.error('[LEDGER ERROR]', err);
        res.status(500).json({ message: 'Failed to fetch history' });
    }
});

module.exports = {
    router,
    startLedgerPolling
};
