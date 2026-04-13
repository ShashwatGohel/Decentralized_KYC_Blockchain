# 🛡️ THE ULTIMATE STEP-BY-STEP TESTING GUIDE

Follow this guide exactly to test every feature of the Decentralized KYC system, from governance to privacy-preserving ZK proofs.

---

## 🏗️ PHASE 1: Governance Setup (The MultiSig Flow)
**Objective**: Register "Nirmala Devi" as a trusted Bank on the blockchain using MultiSig consensus.

### 1. Login as Admin
*   **Action**: Go to the Login page. 
*   **Fill**: Username `admin` and Password `admin123`.
*   **MetaMask**: Switch to the **System Administrator** wallet (`0x0af9...`).
*   **Button**: Click "Login to Portal".
*   **Navigation**: Click the **"Admin"** link in the top menu.

### 2. Propose the Bank (Nirmala Devi)
*   **Form**: Find the **"Register Entity"** card.
*   **Fill Name**: `Nirmala Devi`
*   **Select Type**: `Bank`
*   **Fill Wallet**: `0xb78d867e61f1f6e84a8c41e6c5b22696249573b9`
*   **Click**: "Propose Registration".
*   **MetaMask**: Confirm the transaction.
*   **Success**: New item appears in "Pending Proposals".

### 3. Approve as MultiSig Owner 2 (Consensus)
*   **Logout**: Logout from the portal.
*   **MetaMask**: Switch to **Owner 2** wallet (`0x7099...`).
*   **Login**: Login as `admin` / `admin123` (or any admin-privileged account).
*   **Navigation**: Go to the **Admin** dashboard.
*   **Action**: Find the pending proposal and click **"Approve"**.
*   **MetaMask**: Confirm.
*   **Execute**: Once "2 of 2" approvals are reached, click **"Execute"**.
*   **Result**: Nirmala Devi is now an **Active Bank**!

---

## 👤 PHASE 2: User Onboarding & Vault setup
**Objective**: "Shashwat" registers his identity and secures his data in the Chrono Vault.

### 1. Login as Shashwat
*   **Login**: Use `Shashwat` / `password123`.
*   **MetaMask**: Switch to **Shashwat**'s wallet (`0xfc61...`).
*   **Action**: Click "Go to Dashboard".

### 2. Secure Data in Vault
*   **Navigation**: Click **"Manage Vault"** on the right.
*   **Upload**: Select an ID document (e.g., Aadhar/Passport scan).
*   **Blockchain**: Click **"Anchor on Blockchain"**.
*   **MetaMask**: Confirm. This creates a cryptographic hash of your document on-chain.

---

## 🏛️ PHASE 3: Hash-Based Verification Flow [NEW]
**Objective**: Government officials manually anchor a verified hash, and entities verify the user's data against it.

### 1. Government Anchoring (Admin Dashboard)
*   **Login**: Login as `admin` (Owner 1).
*   **MetaMask**: Switch to `0x0af9...`.
*   **Navigation**: Admin Dashboard -> **"Manual Document Verification (On-Chain Anchor)"**.
*   **Fill**:
    *   User Wallet: `0xfc61ac7ea45c4143cbd99fdf5eda18407e5833be` (Shashwat)
    *   Doc Type: `Identity Certificate`
    *   Doc Hash: Paste the hash from Shashwat's Vault (or use a test hash like `0xabc...`).
*   **Action**: Click "Propose On-Chain Verification".
*   **Consensus**: Follow Phase 1, Step 3 (Owner 2 approval) to **Execute** this proposal.

### 2. Entity Matching (Institution Portal)
*   **Login**: Login as `Nirmala Devi` / `password123`.
*   **MetaMask**: Switch to `0xb78d...`.
*   **Search**: In "Institution Portal", search for `Shashwat`.
*   **Action**: Click **"View Details"** -> **"Perform Document Check"**.
*   **Result**: Should show **"Valid & Vouched"**.
*   **Verification**: Paste Shashwat's document hash into the "Verify User-Provided Hash" field and click **"Verify Match"**.
*   **Bingo**: If the hashes match, a **"CRYPTOGRAPHIC MATCH CONFIRMED"** badge appears!

---

## 🛡️ PHASE 4: Global Verification Engine
**Objective**: Direct on-chain vouching without MultiSig (for recognized agencies).

### 1. Verification Agency Action
*   **Login**: Login as `BhupendraPatel` / `password123`.
*   **MetaMask**: Switch to `0xcac5...`.
*   **Navigation**: Click **"Protocol"** or **"Verification Engine"**.
*   **Search**: Search for `Shashwat`.
*   **Action**: Click **"Verify Document"** or **"Anchor Identity"**.
*   **Result**: Shashwat's identity is vouched for on the blockchain immediately.

---

## 🔒 PHASE 5: Privacy-Preserving ZK Proofs
**Objective**: Prove details (like Age > 18) without revealing the actual data.

### 1. Grant Access
*   **User Step**: Login as `Shashwat`. In the dashboard, select `Nirmala Devi` and click **"Authorize Entity"**.

### 2. Generate and Submit Proof
*   **User Step**: Go to **"ZK Proofs"** page.
*   **Action**: Click **"Generate Age Proof"** -> **"Submit to Nirmala Devi"**.

### 3. Verify Privacy on Bank Side
*   **Bank Step**: Login as `Nirmala Devi`. View Shashwat's details.
*   **Action**: Under "ZK Proofs Available", click **"Verify On-Chain Math"**.
*   **Result**: The smart contract verifies the ZK Proof. If valid, click **"Accept"**.
*   **Privacy**: You've confirmed his age without ever seeing his Birth Date!

---

## 📊 PHASE 6: Public Transparency & Audit
**Objective**: View the immutable protocol trail.

*   **Navigation**: Click **"Public Ledger"** in the top menu.
*   **Insight**: You can see every `UserRegistered`, `DocumentVerified`, and `ExecuteTransaction` event in real-time.
*   **Inspector**: Click any row to open the **Transaction Inspector** and see the raw decoded parameters.

---

## 🚫 PHASE 7: Network Governance (Bans)
**Objective**: Revoke access for fraudulent users via decentralized consensus.

### 1. Initiate Ban
*   **Bank Step**: Login as `Nirmala Devi`. Open Shashwat's portfolio.
*   **Action**: Click **"Initiate Ban Vote"**. Provide a reason (e.g., "Document Fraud").
*   **Consensus**: This creates a MultiSig proposal.

### 2. Finalize Ban
*   **Admin Step**: Login as `admin`. Go to Admin Dashboard -> **"Pending Proposals"**.
*   **Consensus**: As with Phase 1, get TWO admins to approve and click **"Execute"**.
*   **Result**: The user `Shashwat` is now globally banned. You can see this in the "Active Network Bans" table!
