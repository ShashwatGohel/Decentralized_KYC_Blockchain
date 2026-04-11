# 🔐 Decentralized KYC - Credentials & Keys

Use the following information to test the dApp locally. You need to import the provided **Private Keys** into your MetaMask to test the Multisig approval consensus fully.

## Application Login Accounts

All default passwords have been reset to `password123` (except admin).

| User / Entity Name | Role | Password | Registered Wallet Address |
| :--- | :--- | :--- | :--- |
| **`admin`** | **Admin / Multisig Owner 1** | `admin123` | `0x0af9a4a27e69b29bd448d7028181f655f64b8ca0` |
| `BhupendraPatel` | Government | `password123` | `0xcac522eecdbae2d735a7ce2de43bbac477593f7f` |
| `Nirmala Devi` | Bank (ICICI) | `password123` | `0xb78d867e61f1f6e84a8c41e6c5b22696249573b9` |
| `Shashwat` | User | `password123` | `0xfc61ac7ea45c4143cbd99fdf5eda18407e5833be` |
| `dharman2701` | User | `password123` | `0x4e8e3c8aa0f554a1598ffae12ac64e75dc8e5815` |

---

## 🦊 MetaMask Hardhat Private Keys

*You must connect MetaMask to `Localhost 8545` (Chain ID: 31337).*

### 1. MultiSig Consensus Owners (Required for Approvals)
To execute an "Entity Registration", **TWO** of these owners must sign the transaction.

**Owner 1 (Admin/Deployer)**
- **Address**: `0x0af9a4a27e69b29bd448d7028181f655f64b8ca0`
- **Private Key**: `[REDACTED - USER TO PROVIDE OR IMPORT]`

**Owner 2**
- **Address**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- **Private Key**: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`

**Owner 3**
- **Address**: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
- **Private Key**: `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`

### 2. Available Test Wallets
You can use these keys if you create new mock users on the frontend.
- **Account 4**: `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6`
- **Account 5**: `0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a`
