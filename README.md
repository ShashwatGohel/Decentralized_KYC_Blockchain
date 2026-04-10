# Decentralized KYC & Self-Sovereign Identity System

A production-grade, privacy-preserving KYC identity platform built on the **Radix Network (Scrypto)** with **Zero-Knowledge Proof** selective disclosure. Users retain full control of their personal data while institutions verify credentials cryptographically — no raw PII ever touches the blockchain.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        OFF-CHAIN (User Side)                    │
│                                                                 │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐    │
│  │ Raw KYC Docs │   │ Private Data │   │ ZK Witness       │    │
│  │ (name, DOB,  │──>│ (age=25,     │──>│ (Circom circuit  │    │
│  │  address)    │   │  income=80k) │   │  private inputs) │    │
│  └──────────────┘   └──────────────┘   └────────┬─────────┘    │
│                                                  │              │
│                                          ┌───────▼───────┐     │
│                                          │ SnarkJS       │     │
│                                          │ Proof Gen     │     │
│                                          └───────┬───────┘     │
└──────────────────────────────────────────────────┼──────────────┘
                                                   │
                     ZK Proof Bytes + Hash         │
                                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ON-CHAIN (Radix Ledger)                    │
│                                                                 │
│  ┌─────────────────────┐  ┌────────────────────┐               │
│  │  IdentityRegistry   │  │ InstitutionAccess  │               │
│  │                     │  │                    │               │
│  │  • credential_hash  │  │ • grant_access()   │               │
│  │  • proof_hash       │  │ • selective_access │               │
│  │  • trust_score      │  │ • revoke_access()  │               │
│  │  • expires_at       │  │ • check_access()   │               │
│  │  • is_revoked       │  │                    │               │
│  │  • last_verified_at │  └────────────────────┘               │
│  └─────────────────────┘                                        │
│                                                                 │
│  ┌─────────────────────┐  ┌────────────────────┐               │
│  │   MultiSigAdmin     │  │     Badges         │               │
│  │                     │  │                    │               │
│  │  • propose_action() │  │ • AdminBadge       │               │
│  │  • approve_action() │  │ • KycAgencyBadge   │               │
│  │  • execute_action() │  │                    │               │
│  │  • batch_revoke()   │  └────────────────────┘               │
│  └─────────────────────┘                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
├── kyc_identity/                    # Scrypto smart contract package
│   ├── Cargo.toml                   # Rust/Scrypto dependencies
│   ├── src/
│   │   ├── lib.rs                   # Package entry point
│   │   ├── types.rs                 # Shared structs & enums
│   │   ├── identity_registry.rs     # Credential issuance & verification
│   │   ├── institution_access.rs    # User consent management
│   │   └── multisig_admin.rs        # M-of-N admin governance
│   └── tests/
│       ├── identity_registry_test.rs
│       ├── institution_access_test.rs
│       └── multisig_admin_test.rs
├── zk_proofs/                       # Zero-Knowledge proof layer
│   ├── circuits/
│   │   ├── age_verify.circom        # Prove age >= 18
│   │   ├── income_verify.circom     # Prove income >= threshold
│   │   ├── kyc_verify.circom        # Prove credential hash match
│   │   └── credit_tier.circom       # Prove score in bracket
│   └── scripts/
│       ├── compile_circuits.sh      # Compile all circuits
│       ├── generate_proof.js        # Generate ZK proofs
│       └── verify_proof.js          # Verify ZK proofs
├── .github/workflows/ci.yml        # CI/CD pipeline
└── README.md                       # This file
```

---

## Setup Instructions

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Rust | 1.70+ | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| Scrypto CLI | 1.2.x | `cargo install radix-clis` |
| Node.js | 20+ | [nodejs.org](https://nodejs.org/) |
| Circom | 2.1.6+ | [circom docs](https://docs.circom.io/getting-started/installation/) |

### 1. Install Scrypto

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add WASM target (required for Scrypto)
rustup target add wasm32-unknown-unknown

# Install Scrypto CLI tools
cargo install radix-clis
```

### 2. Build the Scrypto Package

```bash
cd kyc_identity
cargo build
cargo test
```

### 3. Set Up ZK Proofs

```bash
cd zk_proofs
npm install

# Compile all circuits (downloads Powers of Tau, generates zkeys)
bash scripts/compile_circuits.sh
```

---

## Deploy on Radix Stokenet (Testnet)

```bash
cd kyc_identity

# Build the WASM package
cargo build --target wasm32-unknown-unknown --release

# Use Radix CLI to deploy
resim reset
resim new-account

# Publish the package
resim publish .

# Note the package address, then instantiate components via transaction manifests
```

For detailed Stokenet deployment, see the [Radix documentation](https://docs.radixdlt.com/).

---

## ZK Proof End-to-End Workflow

### Step 1: Compile circuits

```bash
cd zk_proofs
bash scripts/compile_circuits.sh
```

### Step 2: Generate a proof

Create an input file, e.g. `age_input.json`:
```json
{
  "age": 25,
  "min_age": 18
}
```

Generate the proof:
```bash
node scripts/generate_proof.js age_verify age_input.json
```

Output:
- `build/age_verify/proof.json` — the ZK proof
- `build/age_verify/public.json` — public signals

### Step 3: Verify the proof

```bash
node scripts/verify_proof.js age_verify
# Output: ✓ Proof is VALID
```

### Step 4: Submit proof hash on-chain

The compressed proof bytes from `proof.json` are hashed and submitted to the `IdentityRegistry.issue_credential()` method by an authorized KYC agency.

---

## Multi-Sig Admin Workflow

The `MultiSigAdmin` blueprint implements M-of-N governance:

```
Admin A proposes "Add Agency XYZ"     →  propose_action("add_xyz", "Add Agency XYZ")
Admin A approves                      →  approve_action("add_xyz", "admin_a")
Admin B approves                      →  approve_action("add_xyz", "admin_b")
                                         (threshold met: 2-of-3)
Any admin executes                    →  execute_action("add_xyz")
                                         ✓ Action executed
```

**Security features:**
- Each admin is identified by a unique string ID
- Duplicate approvals from the same admin are rejected
- Actions can only execute after reaching the M threshold
- All proposals are tracked on-chain for audit compliance

---

## Uniqueness Differentiators

| Feature | Description |
|---------|-------------|
| **Selective Disclosure** | Users grant access to specific proof types per institution (e.g., age proof to a retailer, but not income) |
| **Trust Score** | KYC agencies assign a 0–100 trust score at issuance for tiered access rules |
| **Proof Freshness** | `last_verified_at` timestamp updated on each verification — institutions can require recent checks |
| **Batch Revocation** | Multi-sig authorized mass revocation for regulatory compliance events |
| **Credit Tier Circuit** | ZK proof that credit score falls in a bracket (e.g., 650–850) without revealing the exact score |

---

## Testing

```bash
cd kyc_identity
cargo test --verbose
```

### Test Coverage

| Blueprint | Test Cases | Coverage |
|-----------|-----------|----------|
| IdentityRegistry | 5 tests | Authorized/unauthorized issuance, revocation, expiry, nonexistent lookup |
| InstitutionAccess | 4 tests | Grant, revoke, list, selective disclosure |
| MultiSigAdmin | 4 tests | Propose, insufficient/sufficient approvals, duplicate prevention |

---

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs automatically on every push/PR to `main`:

| Job | What it does |
|-----|-------------|
| `lint` | `cargo fmt --check` + `cargo clippy -D warnings` |
| `test` | `cargo test --verbose` |
| `zk-test` | Compile circuits + generate/verify a sample age proof |
| `security` | `cargo audit` for known Rust vulnerabilities |

---

## License

MIT
