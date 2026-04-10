// =============================================================================
// credit_tier.circom — ZK circuit to prove credit score is within a bracket.
//
// Private input: credit_score (actual score, never revealed)
// Public inputs: min_score (e.g., 650), max_score (e.g., 850)
// Output:        is_valid (1 if min_score <= credit_score <= max_score)
//
// Proves the score falls in a bracket without revealing the exact value.
// Uses 16-bit comparison (scores up to 65535).
// =============================================================================

pragma circom 2.1.6;

include "circomlib/circuits/comparators.circom";

template CreditTier() {
    // Private: the actual credit score (never revealed on-chain)
    signal input credit_score;

    // Public: the bracket boundaries
    signal input min_score;
    signal input max_score;

    // Output: 1 if valid
    signal output is_valid;

    // Check: credit_score >= min_score
    component gte = GreaterEqThan(16);
    gte.in[0] <== credit_score;
    gte.in[1] <== min_score;
    gte.out === 1;

    // Check: credit_score <= max_score (i.e., max_score >= credit_score)
    component lte = GreaterEqThan(16);
    lte.in[0] <== max_score;
    lte.in[1] <== credit_score;
    lte.out === 1;

    is_valid <== 1;
}

component main { public [ min_score, max_score ] } = CreditTier();
