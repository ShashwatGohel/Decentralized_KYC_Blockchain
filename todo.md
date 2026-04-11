# 📝 Project Todo & Roadmap

This file tracks the current state of the **Decentralized KYC & Self-Sovereign Identity System** and outlines upcoming enhancements.

## ✅ Implemented Features

### 🏛️ Governance & Admin
- [x] **MultiSig Wallet**: 2-of-3 threshold governance implemented for high-security actions.
- [x] **Entity Registration**: On-chain process to register Banks, Government Agencies, and other verifiers via MultiSig consensus.
- [x] **Admin Dashboard**: Frontend interface for proposing, confirming, and executing transactions.

### 👤 User Identity
- [x] **Decentralized Registration**: Users create profiles and link their Ethereum wallets.
- [x] **Document Anchoring**: Document hashes (Aadhar, PAN, etc.) stored on-chain for tamper-proof verification.
- [x] **Access Control**: Granular `grantAccess` and `revokeAccess` logic to put users in control of their own data.

### 🛡️ Privacy (Zero-Knowledge)
- [x] **Age Verification**: Prove age >= 18 without revealing specific Date of Birth.
- [x] **Income Proof**: Prove income falls within a bracket without revealing the exact amount.
- [x] **On-Chain Verification**: Solidity-based Groth16 verifier integrated with the main KYC contract.

### 🌐 Infrastructure
- [x] **Backend API**: Node.js/Express server with JWT authentication and MongoDB integration.
- [x] **Blockchain Node**: Hardhat local network for rapid development and testing.

---

## 🚀 Upcoming / Future Roadmap

### 📂 Storage & Security
- [ ] **IPFS Integration**: Move document storage from local database to IPFS for true decentralization.
- [ ] **Data Encryption**: Implement client-side encryption before uploading documents.
- [ ] **Hardware Wallet Support**: Integrate Ledger/Trezor via MetaMask for admin signatures.

### 🎨 UI/UX Enhancements
- [ ] **Dark Mode**: Toggle for the dashboard interfaces.
- [ ] **Notifications**: Real-time alerts (via Socket.io or Push) when a user grants access or an entity verifies a doc.
- [ ] **Mobile App**: React Native wrapper for mobile-first identity management.

### 📈 Scalability & Compliance
- [ ] **Layer 2 Deployment**: Port contracts to Arbitrum or Polygon for lower gas fees.
- [ ] **Batch Verification**: Allow entities to verify multiple users in a single transaction to save gas.
- [ ] **GDPR Compliance Tools**: Automated workflows for "Right to be Forgotten" while maintaining audit logs.
