const express = require('express');
const router = express.Router();
const { kycContract, provider } = require('../utils/blockchain');

let io; // Socket.io instance

const startLedgerPolling = (socketIo) => {
    io = socketIo;
    console.log('[LEDGER] Starting blockchain event polling...');

    if (!kycContract) return;

    // Listen for all events from the KYC contract
    kycContract.on("*", (event) => {
        try {
            const entry = {
                blockNumber: event.log.blockNumber,
                transactionHash: event.log.transactionHash,
                event: event.path,
                args: event.args,
                timestamp: Date.now()
            };
            console.log(`[BLOCKCHAIN EVENT] ${event.path} at block ${event.log.blockNumber}`);
            io.emit('new_event', entry);
        } catch (err) {
            console.error('Error processing event:', err);
        }
    });

    // Also poll for block height
    setInterval(async () => {
        try {
            const blockNumber = await provider.getBlockNumber();
            io.emit('block_update', { number: blockNumber });
        } catch (err) {}
    }, 5000);
};

module.exports = {
    router,
    startLedgerPolling
};
