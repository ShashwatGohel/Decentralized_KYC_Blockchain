// =============================================================================
// verify_proof.js — Verify a ZK proof using SnarkJS.
//
// Usage:
//   node verify_proof.js <circuit_name>
//
// Example:
//   node verify_proof.js age_verify
//
// Reads:
//   - build/<circuit>/verification_key.json
//   - build/<circuit>/public.json
//   - build/<circuit>/proof.json
//
// Output: prints whether the proof is valid or invalid.
// =============================================================================

const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");

async function main() {
    const args = process.argv.slice(2);

    if (args.length < 1) {
        console.error("Usage: node verify_proof.js <circuit_name>");
        console.error("Example: node verify_proof.js age_verify");
        process.exit(1);
    }

    const circuit_name = args[0];
    const build_dir = path.join(__dirname, "..", "build", circuit_name);

    // Load verification key, proof, and public signals
    const vkey_path = path.join(build_dir, "verification_key.json");
    const proof_path = path.join(build_dir, "proof.json");
    const public_path = path.join(build_dir, "public.json");

    // Check all files exist
    for (const file_path of [vkey_path, proof_path, public_path]) {
        if (!fs.existsSync(file_path)) {
            console.error(`File not found: ${file_path}`);
            console.error("Run generate_proof.js first.");
            process.exit(1);
        }
    }

    const vkey = JSON.parse(fs.readFileSync(vkey_path, "utf-8"));
    const proof = JSON.parse(fs.readFileSync(proof_path, "utf-8"));
    const public_signals = JSON.parse(fs.readFileSync(public_path, "utf-8"));

    console.log(`Verifying proof for circuit: ${circuit_name}`);
    console.log(`Public signals: ${JSON.stringify(public_signals)}`);

    // Verify
    const is_valid = await snarkjs.groth16.verify(vkey, public_signals, proof);

    if (is_valid) {
        console.log("\n✓ Proof is VALID");
        process.exit(0);
    } else {
        console.log("\n✗ Proof is INVALID");
        process.exit(1);
    }
}

main().catch((err) => {
    console.error("Error verifying proof:", err);
    process.exit(1);
});
