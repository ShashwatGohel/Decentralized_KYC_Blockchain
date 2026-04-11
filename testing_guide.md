# 🛡️ THE ULTIMATE STEP-BY-STEP TESTING GUIDE

Follow this guide exactly. It is designed to take you from a fresh start to a fully verified Decentralized ID.

---

## 🏗️ PHASE 1: Governance Setup (The MultiSig Flow)
**Objective**: Register "Nirmala Devi" as a trusted Bank on the blockchain.

### 1. Login as Admin
*   **Action**: Go to the Login page. 
*   **Fill**: Username `admin` and Password `admin123`.
*   **MetaMask**: Switch to the **System Administrator** wallet (`0x0af9...`).
*   **Button**: Click "Login to Portal".
*   **Navigation**: Click the **"Admin"** link in the top menu.

### 2. Propose the Bank (Nirmala Devi)
*   **Form**: Find the **"Register Entity"** card on the left.
*   **Fill Name**: `Nirmala Devi`
*   **Select Type**: `Bank`
*   **Fill Wallet**: `0xb78d867e61f1f6e84a8c41e6c5b22696249573b9`
*   **Click**: "Propose Registration".
*   **MetaMask**: A popup appears. Click **"Confirm"**.
*   **Success**: You will see "Proposal submitted successfully!" and a new item in the "Pending Proposals" list on the right.

### 3. Approve as Bhupendra (MultiSig Consensus)
*   **Logout**: In the top right, click the Logout icon (next to your name).
*   **Login**: Login as `BhupendraPatel` / `password123`.
*   **MetaMask**: Switch to **BhupendraPatel**'s wallet (`0xcac5...`).
*   **Navigation**: Click the **"Admin"** link in the top menu.
*   **Action**: Find the pending proposal for Nirmala Devi.
*   **Click**: **"Approve"**.
*   **MetaMask**: Confirm the transaction.
*   **Execute**: Once the vote count shows "2 of 2", click the **"Execute"** button that appears.
*   **Result**: Nirmala Devi is now an **Active Bank** in the system!

---

## 👤 PHASE 2: User Onboarding (Shashwat)
**Objective**: The user uploads their identity and grants permission.

### 1. Login as Shashwat
*   **Login**: Use `Shashwat` / `password123`.
*   **MetaMask**: Switch to **Shashwat**'s wallet (`0xfc61...`).
*   **Click**: "Go to Dashboard".

### 2. Secure your ID
*   **Vault**: Click **"Manage Vault"** on the right.
*   **Upload**: Select any file (e.g., a photo of an ID card).
*   **Blockchain**: Click **"Anchor on Blockchain"**.
*   **MetaMask**: Confirm the transaction.
*   **Status**: Your document now has an on-chain "Hash".

### 3. Grant Permission
*   **Navigation**: Go back to the main User Dashboard ("Identity").
*   **Find**: In the "Grant Access" section, select **"Nirmala Devi"** from the dropdown.
*   **Click**: **"Authorize Entity"**.
*   **Logic**: If you don't do this, Nirmala Devi won't be able to see your documents!

---

## 🏛️ PHASE 3: Government Verification
**Objective**: Bhupendra vouches for Shashwat on-chain.

### 1. Action by Bhupendra (Government)
*   **Login**: Use `BhupendraPatel` / `password123`.
*   **MetaMask**: Switch to **Bhupendra**'s wallet (`0xcac5...`).
*   **Navigation**: Click **"Protocol"** or **"Verification Engine"**.
*   **Search**: Search for `Shashwat`.
*   **Click**: **"Verify Document"**.
*   **Result**: Shashwat is now "Government Verified".

---

## 🏦 PHASE 4: Bank Finalization (Nirmala Devi)
**Objective**: The bank checks the documents and receives a ZK Proof.

### 1. Action by Nirmala Devi (Bank)
*   **Login**: Use `Nirmala Devi` / `password123`.
*   **MetaMask**: Switch to **Nirmala Devi**'s wallet (`0xb78d...`).
*   **Navigation**: Click **"Portal"**.
*   **Search**: Find `Shashwat`.
*   **Action**: Click **"Perform Document Check"**.
*   **Status**: It will say **"Valid & Vouched"** because Bhupendra previously verified it!

### 2. The Zero-Knowledge Proof (Privacy)
*   **Shashwat Step**: Login as Shashwat, go to **"ZK Proofs"**, click **"Generate Age Proof"**, then **"Submit to Nirmala Devi"**.
*   **Nirmala Step**: In the Bank portal, click **"Verify ZK Proof"**.
*   **Magic**: You successfully confirmed Shashwat is over 18 without ever seeing his Birth Date!
