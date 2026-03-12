const { ethers } = require('ethers');
const path = require('path');
require('dotenv').config();

// Load contract info
const CONTRACT_ADDRESS = "0xE26f0926D8C96D937dD38a1d4e029dF77f0240CC";
const ABI = require('../../smart-contract/KYC_ABI_utf8.json');

// Provider - Use a stable Sepolia public RPC
const RPC_URL = process.env.RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
let provider;
try {
    provider = new ethers.JsonRpcProvider(RPC_URL, undefined, {
        staticNetwork: true // Helps skip eager network detection that can loop errors
    });
} catch (e) {
    console.error("Critical: Failed to initialize Blockchain Provider:", e.message);
}

// Contract instance (read-only)
const contract = provider ? new ethers.Contract(CONTRACT_ADDRESS, ABI, provider) : null;

/**
 * Check if a wallet is a registered and active entity on-chain
 * @param {string} walletAddress 
 * @returns {Promise<Object|null>} Entity info or null if not registered
 */
const getOnChainEntity = async (walletAddress) => {
    try {
        if (!ethers.isAddress(walletAddress)) return null;
        if (!contract) {
            console.warn("Blockchain contract not initialized. Is the node running?");
            return null;
        }
        
        const entity = await contract.entityRegistry(walletAddress);
        console.log(`[BLOCKCHAIN] Checking ${walletAddress} on ${CONTRACT_ADDRESS}`);
        
        // Ethers v6 Result objects can be accessed by name or index
        const isActive = entity.isActive || entity[3];
        const entityType = entity.entityType !== undefined ? entity.entityType : entity[0];
        const name = entity.name !== undefined ? entity.name : entity[1];
        const endpoint = entity.apiEndpoint !== undefined ? entity.apiEndpoint : entity[2];

        console.log(`[BLOCKCHAIN] Result - Active: ${isActive}, Type: ${entityType}, Name: ${name}`);
        
        if (isActive) {
            return {
                type: Number(entityType),
                name: name,
                endpoint: endpoint
            };
        }
        return null;
    } catch (err) {
        console.error("Blockchain check error:", err);
        return null; // Fallback to null on error
    }
};

module.exports = {
    getOnChainEntity,
    provider,
    contract
};
