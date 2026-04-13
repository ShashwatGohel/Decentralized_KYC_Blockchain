const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const snarkjs = require('snarkjs');
const path = require('path');
const fs = require('fs');

const ZK_BUILD_PATH = path.join(__dirname, '..', '..', 'zk_proofs', 'build');

// Helper to generate proof
async function generateZKProof(circuitType, inputs) {
    console.log(`[ZK Mock] Simulating cryptographic proof generation for ${circuitType}...`, inputs);
    // Mock sleep to simulate heavy cryptography
    await new Promise(resolve => setTimeout(resolve, 800));

    // --- MOCK LOGIC TO SIMULATE ZK CONSTRAINTS ---
    if (circuitType === 'age_verify') {
        if (Number(inputs.age) < Number(inputs.min_age)) {
            throw new Error("ZK Constraint Failed: Age does not meet the minimum public threshold.");
        }
    } else if (circuitType === 'income_verify') {
        if (Number(inputs.income) < Number(inputs.threshold)) {
            throw new Error("ZK Constraint Failed: Income does not meet the minimum public threshold.");
        }
    }

    const dummyProof = {
        pi_a: ["0x01", "0x02", "0x03"],
        pi_b: [
            ["0x04", "0x05"],
            ["0x06", "0x07"],
            ["0x08", "0x09"]
        ],
        pi_c: ["0x0a", "0x0b", "0x0c"]
    };
    
    // Simulate public signals for UI (e.g. threshold met)
    const publicSignals = ["0x01", "0x00"]; 

    return { proof: dummyProof, publicSignals };
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
