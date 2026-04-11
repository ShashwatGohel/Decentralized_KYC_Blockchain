const { ethers } = require('ethers');
const config = require('./config');
const KYC_ABI = require('./KYC_ABI.json');
const MultiSig_ABI = require('./MultiSig_ABI.json');
require('dotenv').config();

// Provider - Use Hardhat local node by default
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
let provider;
try {
    provider = new ethers.JsonRpcProvider(RPC_URL);
    // Explicitly handle provider errors to prevent uncaught exceptions during polling
    provider.on("error", (err) => {
        // Silent or minimal log for network issues
    });
} catch (e) {
    console.error("Critical: Failed to initialize Blockchain Provider:", e.message);
}

// Contract instances (read-only)
const kycContract = provider ? new ethers.Contract(config.decentralizedKycAddress, KYC_ABI, provider) : null;
const multiSigContract = provider ? new ethers.Contract(config.multiSigAddress, MultiSig_ABI, provider) : null;

/**
 * Check if a wallet is a registered and active entity on-chain
 */
const getOnChainEntity = async (walletAddress) => {
    try {
        if (!ethers.isAddress(walletAddress)) return null;
        if (!kycContract) return null;
        
        const entity = await kycContract.entityRegistry(walletAddress);
        if (entity.isActive) {
            return {
                type: Number(entity.entityType),
                name: entity.name,
                endpoint: entity.apiEndpoint
            };
        }
        return null;
    } catch (err) {
        console.error("Blockchain check error:", err);
        return null;
    }
};

/**
 * Get user verification history from on-chain
 */
const getUserHistory = async (walletAddress) => {
    try {
        if (!ethers.isAddress(walletAddress)) return [];
        if (!kycContract) return [];
        
        const history = await kycContract.getVerificationHistory(walletAddress);
        return history.map(log => ({
            verifier: log.verifier,
            entityName: log.entityName,
            timestamp: Number(log.timestamp) * 1000 // Convert to JS ms
        }));
    } catch (err) {
        console.error("Error fetching history:", err);
        return [];
    }
};

module.exports = {
    provider,
    kycContract,
    multiSigContract,
    getOnChainEntity,
    getUserHistory
};
