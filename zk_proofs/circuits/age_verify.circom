// =============================================================================
// age_verify.circom — ZK circuit to prove age >= 18.
//
// Private input: age (the actual age, never revealed)
// Public input:  min_age (set to 18)
// Output:        is_valid (1 if age >= min_age, else constraint fails)
//
// How it works:
//   1. Compute diff = age - min_age
//   2. Assert diff >= 0 using a range check (age must be >= min_age)
//   3. Output 1 to confirm validity
// =============================================================================

pragma circom 2.1.6;

// LessThan from circomlib — checks if a < b using N bits
include "circomlib/circuits/comparators.circom";

template AgeVerify() {
    // Private: the actual age (never revealed on-chain)
    signal input age;

    // Public: the minimum age threshold (e.g., 18)
    signal input min_age;

    // Output: 1 if valid
    signal output is_valid;

    // Use GreaterEqThan to check age >= min_age
    // We use 8 bits because age values fit in 0-255
    component gte = GreaterEqThan(8);
    gte.in[0] <== age;
    gte.in[1] <== min_age;

    // If age < min_age, gte.out = 0 and this constraint fails
    gte.out === 1;

    // Output success
    is_valid <== 1;
}

component main { public [ min_age ] } = AgeVerify();
