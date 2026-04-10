const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const circuitsDir = path.join(__dirname, '..', 'circuits');
const buildDir = path.join(__dirname, '..', 'build');
const nodeModules = path.join(__dirname, '..', 'node_modules');
const ptauFile = path.join(buildDir, 'pot12_final.ptau');

console.log("=== KYC ZK Circuit Compiler ===");

if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
}

if (!fs.existsSync(ptauFile)) {
    console.log("[1/4] Generating Powers of Tau (local, 2^12)...");
    execSync(`npx snarkjs powersoftau new bn128 12 "${path.join(buildDir, 'pot12_0000.ptau')}" -v`, {stdio: 'inherit'});
    execSync(`npx snarkjs powersoftau contribute "${path.join(buildDir, 'pot12_0000.ptau')}" "${path.join(buildDir, 'pot12_0001.ptau')}" --name="First" -v -e="random"`, {stdio: 'inherit'});
    execSync(`npx snarkjs powersoftau prepare phase2 "${path.join(buildDir, 'pot12_0001.ptau')}" "${ptauFile}" -v`, {stdio: 'inherit'});
} else {
    console.log("[1/4] Powers of Tau already downloaded.");
}

const circuits = ["age_verify", "income_verify", "kyc_verify", "credit_tier"];

for (const circuit of circuits) {
    console.log(`\n--- Compiling: ${circuit} ---`);
    const circuitDir = path.join(buildDir, circuit);
    if (!fs.existsSync(circuitDir)) {
        fs.mkdirSync(circuitDir, { recursive: true });
    }

    console.log(`[2/4] Compiling ${circuit}.circom...`);
    execSync(`circom "${path.join(circuitsDir, circuit + '.circom')}" --r1cs --wasm --sym -l "${nodeModules}" -o "${circuitDir}"`, {stdio: 'inherit'});

    console.log(`[3/4] Running trusted setup...`);
    execSync(`npx snarkjs groth16 setup "${path.join(circuitDir, circuit + '.r1cs')}" "${ptauFile}" "${path.join(circuitDir, circuit + '_final.zkey')}"`, {stdio: 'inherit'});

    console.log(`[4/4] Exporting verification key...`);
    execSync(`npx snarkjs zkey export verificationkey "${path.join(circuitDir, circuit + '_final.zkey')}" "${path.join(circuitDir, 'verification_key.json')}"`, {stdio: 'inherit'});

    console.log(`✓ ${circuit} compiled successfully.`);
}

console.log("\n=== All circuits compiled! Build output:", buildDir, "===");
