// =============================================================================
// kyc_verify.circom — ZK circuit to prove a credential hash matches.
//
// Private input: credential_preimage (raw credential data, never revealed)
// Public input:  credential_hash (the on-chain Poseidon hash)
// Output:        is_valid (1 if hash(preimage) == credential_hash)
//
// Uses Poseidon hash for ZK-friendly hashing.
// =============================================================================

pragma circom 2.1.6;

include "circomlib/circuits/poseidon.circom";

template KycVerify() {
    // Private: the raw credential data (never revealed on-chain)
    signal input credential_preimage;

    // Public: the hash stored on-chain
    signal input credential_hash;

    // Output: 1 if valid
    signal output is_valid;

    // Hash the preimage using Poseidon (1 input)
    component hasher = Poseidon(1);
    hasher.inputs[0] <== credential_preimage;

    // Constraint: computed hash must match the on-chain hash
    hasher.out === credential_hash;

    is_valid <== 1;
}

component main { public [ credential_hash ] } = KycVerify();
