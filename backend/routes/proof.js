const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const snarkjs = require('snarkjs');
const path = require('path');
const fs = require('fs');

const ZK_BUILD_PATH = path.join(__dirname, '..', '..', 'zk_proofs', 'build');

// Helper to generate proof
async function generateZKProof(circuitType, inputs) {
    const wasmPath = path.join(ZK_BUILD_PATH, circuitType, `${circuitType}_js`, `${circuitType}.wasm`);
    const zkeyPath = path.join(ZK_BUILD_PATH, circuitType, `${circuitType}_final.zkey`);

    if (!fs.existsSync(wasmPath) || !fs.existsSync(zkeyPath)) {
        throw new Error(`Circuit files for ${circuitType} not found`);
    }

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(inputs, wasmPath, zkeyPath);
    return { proof, publicSignals };
}

// @route   POST api/proof/generate
// @desc    Generate a ZK proof for the user
router.post('/generate', auth, async (req, res) => {
    try {
        const { circuit_type, inputs } = req.body;
        
        console.log(`[ZK] Generating proof for ${circuit_type}...`);
        
        // In a real app, inputs should be verified against DB/Vault data
        const { proof, publicSignals } = await generateZKProof(circuit_type, inputs);

        res.json({
            proof,
            public_signals: publicSignals,
            proof_hash: `zk_proof_${Date.now()}` // Mock hash for tracking
        });
    } catch (err) {
        console.error("ZK Generation Error:", err);
        res.status(500).json({ message: 'ZK Proof Generation Failed', error: err.message });
    }
});

module.exports = router;
