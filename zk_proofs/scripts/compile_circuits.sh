#!/bin/bash
# =============================================================================
# compile_circuits.sh — Compile all Circom circuits.
#
# Prerequisites:
#   - circom installed: https://docs.circom.io/getting-started/installation/
#   - circomlib installed via npm (see package.json)
#   - Powers of Tau file (downloaded below)
#
# This script:
#   1. Compiles each .circom file to WASM + R1CS
#   2. Runs a trusted setup using Hermez Powers of Tau
#   3. Exports verification keys
# =============================================================================

set -e

CIRCUITS_DIR="$(cd "$(dirname "$0")/../circuits" && pwd)"
BUILD_DIR="$(cd "$(dirname "$0")/.." && pwd)/build"
NODE_MODULES="$(cd "$(dirname "$0")/.." && pwd)/node_modules"
PTAU_FILE="$BUILD_DIR/pot12_final.ptau"

echo "=== KYC ZK Circuit Compiler ==="
echo ""

# Create build directory
mkdir -p "$BUILD_DIR"

# Download Powers of Tau if missing
if [ ! -f "$PTAU_FILE" ]; then
    echo "[1/4] Downloading Powers of Tau (Hermez, 2^12)..."
    curl -L -o "$PTAU_FILE" \
        "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau"
else
    echo "[1/4] Powers of Tau already downloaded."
fi

# List of circuits to compile
CIRCUITS=("age_verify" "income_verify" "kyc_verify" "credit_tier")

for CIRCUIT in "${CIRCUITS[@]}"; do
    echo ""
    echo "--- Compiling: $CIRCUIT ---"

    CIRCUIT_DIR="$BUILD_DIR/$CIRCUIT"
    mkdir -p "$CIRCUIT_DIR"

    # Step 2: Compile circom to WASM and R1CS
    echo "[2/4] Compiling $CIRCUIT.circom..."
    circom "$CIRCUITS_DIR/$CIRCUIT.circom" \
        --r1cs --wasm --sym \
        -l "$NODE_MODULES" \
        -o "$CIRCUIT_DIR"

    # Step 3: Generate zkey (trusted setup)
    echo "[3/4] Running trusted setup for $CIRCUIT..."
    npx snarkjs groth16 setup \
        "$CIRCUIT_DIR/$CIRCUIT.r1cs" \
        "$PTAU_FILE" \
        "$CIRCUIT_DIR/${CIRCUIT}_final.zkey"

    # Step 4: Export verification key
    echo "[4/4] Exporting verification key for $CIRCUIT..."
    npx snarkjs zkey export verificationkey \
        "$CIRCUIT_DIR/${CIRCUIT}_final.zkey" \
        "$CIRCUIT_DIR/verification_key.json"

    echo "✓ $CIRCUIT compiled successfully."
done

echo ""
echo "=== All circuits compiled! Build output: $BUILD_DIR ==="
