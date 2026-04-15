const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { ethers } = require('ethers');
const { provider } = require('../utils/blockchain');

// @route   POST api/dev/faucet
// @desc    Fund a wallet on local Hardhat network (31337) so dev txs never fail
router.post('/faucet', auth, async (req, res) => {
    try {
        if (!provider) return res.status(500).json({ message: 'Blockchain provider not initialized' });

        const { address } = req.body;
        if (!address || !ethers.isAddress(address)) {
            return res.status(400).json({ message: 'Valid address is required' });
        }

        const network = await provider.getNetwork();
        const chainId = Number(network.chainId);
        if (chainId !== 31337) {
            return res.status(400).json({
                message: 'Faucet is only available on local Hardhat (chainId 31337). Use a public faucet on Sepolia instead.'
            });
        }

        // Set balance to 100 ETH (Hardhat-only RPC)
        const newBalanceHex = ethers.toBeHex(ethers.parseEther('100'));
        await provider.send('hardhat_setBalance', [address, newBalanceHex]);

        const bal = await provider.getBalance(address);
        res.json({ message: 'Funded successfully', balanceEth: ethers.formatEther(bal) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Faucet funding failed', error: err.message });
    }
});

module.exports = router;

