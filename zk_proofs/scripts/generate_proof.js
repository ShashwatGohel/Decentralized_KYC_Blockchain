// =============================================================================
// generate_proof.js — Generate a ZK proof using SnarkJS.
//
// Usage:
//   node generate_proof.js <circuit_name> <input_file>
//
// Example:
//   node generate_proof.js age_verify ./inputs/age_input.json
//
// Input JSON format (for age_verify):
//   { "age": 25, "min_age": 18 }
//
// Output:
//   - build/<circuit>/proof.json    (the proof)
//   - build/<circuit>/public.json   (public signals)
// =============================================================================

const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");

async function main() {
    // Parse command line args
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.error("Usage: node generate_proof.js <circuit_name> <input_file>");
        console.error("Example: node generate_proof.js age_verify ./inputs/age_input.json");
        process.exit(1);
    }

    const circuit_name = args[0];
    const input_file = args[1];

    // Paths
    const build_dir = path.join(__dirname, "..", "build", circuit_name);
    const wasm_path = path.join(build_dir, `${circuit_name}_js`, `${circuit_name}.wasm`);
    const zkey_path = path.join(build_dir, `${circuit_name}_final.zkey`);

    // Check files exist
    if (!fs.existsSync(wasm_path)) {
        console.error(`WASM file not found: ${wasm_path}`);
        console.error("Run compile_circuits.js first.");
        process.exit(1);
    }

    if (!fs.existsSync(zkey_path)) {
        console.error(`ZKey file not found: ${zkey_path}`);
        console.error("Run compile_circuits.js first.");
        process.exit(1);
    }

    // Load input
    const input_data = JSON.parse(fs.readFileSync(input_file, "utf-8"));
    console.log(`Generating proof for circuit: ${circuit_name}`);

    // Generate the proof
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input_data,
        wasm_path,
        zkey_path
    );

    // Save proof and public signals
    const proof_path = path.join(build_dir, "proof.json");
    const public_path = path.join(build_dir, "public.json");

    fs.writeFileSync(proof_path, JSON.stringify(proof, null, 2));
    fs.writeFileSync(public_path, JSON.stringify(publicSignals, null, 2));

    console.log(`\n✓ Proof saved to: ${proof_path}`);
    console.log(`✓ Public signals saved to: ${public_path}`);
    console.log(`\nPublic signals: ${JSON.stringify(publicSignals)}`);
}

main().catch((err) => {
    require('fs').writeFileSync('proof_error.txt', (err.stack || err).toString());
    console.error("Error generating proof:", err.message);
    process.exit(1);
});
