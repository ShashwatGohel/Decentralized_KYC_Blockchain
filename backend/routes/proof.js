const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const snarkjs = require('snarkjs');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');

const ZK_BUILD_PATH = path.join(__dirname, '..', '..', 'zk_proofs', 'build');

function requireFile(p) {
    if (!fs.existsSync(p)) {
        const err = new Error(`ZK artifact missing: ${p}`);
        err.statusCode = 500;
        throw err;
    }
}

async function generateAndVerifyGroth16(circuitType, inputs) {
    const buildDir = path.join(ZK_BUILD_PATH, circuitType);
    const wasmPath = path.join(buildDir, `${circuitType}_js`, `${circuitType}.wasm`);
    const zkeyPath = path.join(buildDir, `${circuitType}_final.zkey`);
    const vkeyPath = path.join(buildDir, `verification_key.json`);

    requireFile(wasmPath);
    requireFile(zkeyPath);
    requireFile(vkeyPath);

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(inputs, wasmPath, zkeyPath);
    const vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf-8'));
    const isValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);
    if (!isValid) {
        const err = new Error('Generated proof did not verify (invalid artifacts or inputs)');
        err.statusCode = 400;
        throw err;
    }

    return { proof, publicSignals };
}

// @route   POST api/proof/generate
// @desc    Generate a ZK proof for the user
router.post('/generate', auth, async (req, res) => {
    try {
        const { circuit_type, inputs } = req.body;
        
        console.log(`[ZK] Generating proof for ${circuit_type}...`);
        
        // IMPORTANT: do NOT trust user-entered private inputs.
        // We bind private values to server-stored verified attributes (set by government/admin).
        const me = await User.findById(req.user.id).select('verifiedAttributes');
        if (!me) return res.status(404).json({ message: 'User not found' });

        let fullInputs = {};
        if (circuit_type === 'age_verify') {
            const minAge = Number(inputs?.min_age ?? 18);
            if (!Number.isFinite(minAge) || minAge < 0 || minAge > 255) {
                return res.status(400).json({ message: 'Invalid min_age (expected 0-255)' });
            }
            const verifiedAge = me.verifiedAttributes?.age;
            if (verifiedAge === null || verifiedAge === undefined) {
                return res.status(400).json({ message: 'No government-verified age available for this user' });
            }
            fullInputs = { age: Number(verifiedAge), min_age: minAge };
        } else if (circuit_type === 'income_verify') {
            const threshold = Number(inputs?.threshold ?? 50000);
            if (!Number.isFinite(threshold) || threshold < 0 || threshold > 4294967295) {
                return res.status(400).json({ message: 'Invalid threshold (expected 0 - 2^32-1)' });
            }
            const verifiedIncome = me.verifiedAttributes?.income;
            if (verifiedIncome === null || verifiedIncome === undefined) {
                return res.status(400).json({ message: 'No government-verified income available for this user' });
            }
            fullInputs = { income: Number(verifiedIncome), threshold };
        } else {
            return res.status(400).json({ message: `Unsupported circuit_type: ${circuit_type}` });
        }

        const { proof, publicSignals } = await generateAndVerifyGroth16(circuit_type, fullInputs);

        res.json({
            proof,
            public_signals: publicSignals,
            proof_hash: `zk_proof_${Date.now()}` // Mock hash for tracking
        });
    } catch (err) {
        console.error("ZK Generation Error:", err);
        res.status(err.statusCode || 500).json({ message: 'ZK Proof Generation Failed', error: err.message });
    }
});

// @route   POST api/proof/save
// @desc    Save a successfully on-chain verified ZK proof to the database
router.post('/save', auth, async (req, res) => {
    try {
        const { proofType, proofHash, publicSignals, fullProof } = req.body;
        const ProofRecord = require('../models/ProofRecord');

        const newProof = new ProofRecord({
            userId: req.user.id,
            statement: proofType,
            proof: fullProof,
            publicSignals: publicSignals
        });

        await newProof.save();
        res.status(201).json({ message: "Proof anchored locally." });
    } catch (err) {
        console.error("Proof Save Error:", err);
        res.status(500).send("Server error");
    }
});

// @route   GET api/proof/mine
// @desc    Get all active proofs anchored by the authenticated user
router.get('/mine', auth, async (req, res) => {
    try {
        const ProofRecord = require('../models/ProofRecord');
        const proofs = await ProofRecord.find({ userId: req.user.id }).sort({ verifiedAt: -1 });
        res.json(proofs);
    } catch (err) {
        console.error("Proof Fetch Error:", err);
        res.status(500).send('Server error');
    }
});

// @route   DELETE api/proof/:id
// @desc    Revoke and delete an active ZK proof
router.delete('/:id', auth, async (req, res) => {
    try {
        const ProofRecord = require('../models/ProofRecord');
        const proof = await ProofRecord.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!proof) {
            return res.status(404).json({ message: 'Proof not found or unauthorized' });
        }
        res.json({ message: 'Zero-Knowledge Proof successfully revoked and wiped.' });
    } catch (err) {
        console.error("Proof Revoke Error:", err);
        res.status(500).send('Server error');
    }
});

// @route   POST api/proof/decide
// @desc    Institution accepts or rejects a mathematically verified truth
router.post('/decide', auth, async (req, res) => {
    try {
        // Enforce role
        if (req.user.role !== 'entity') {
            return res.status(403).json({ message: "Only institutions can decide on proofs." });
        }

        const { proofId, decision } = req.body;
        if (!['accepted', 'rejected'].includes(decision)) {
            return res.status(400).json({ message: "Invalid decision status" });
        }

        const ProofRecord = require('../models/ProofRecord');
        const proof = await ProofRecord.findById(proofId);

        if (!proof) return res.status(404).json({ message: "Proof not found" });

        // Update the status and tie it to the specific entity
        proof.status = decision;
        proof.verifier = req.user.id; 
        
        await proof.save();

        res.json({ message: `Proof marked as ${decision.toUpperCase()}.` });
    } catch (err) {
        console.error("Proof Decision Error:", err);
        res.status(500).send("Server error");
    }
});

module.exports = router;
