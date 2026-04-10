// =============================================================================
// income_verify.circom — ZK circuit to prove income >= threshold.
//
// Private input: income (actual income, never revealed)
// Public input:  threshold (e.g., 50000)
// Output:        is_valid (1 if income >= threshold)
//
// Uses 32-bit comparison to handle income values up to ~4 billion.
// =============================================================================

pragma circom 2.1.6;

include "circomlib/circuits/comparators.circom";

template IncomeVerify() {
    // Private: the actual income (never revealed on-chain)
    signal input income;

    // Public: the minimum income threshold
    signal input threshold;

    // Output: 1 if valid
    signal output is_valid;

    // 32-bit comparison for income values
    component gte = GreaterEqThan(32);
    gte.in[0] <== income;
    gte.in[1] <== threshold;

    // Constraint: income must be >= threshold
    gte.out === 1;

    is_valid <== 1;
}

component main { public [ threshold ] } = IncomeVerify();
