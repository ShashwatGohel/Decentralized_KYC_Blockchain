const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Decentralized KYC & MultiSig Ecosystem", function () {
    let MultiSigWallet, MultiSig;
    let DecentralizedKYC, KYC;
    let MockZKVerifier, Verifier;
    
    let owner1, owner2, owner3, user1, user2, bank1, attacker;
    let owners;

    const THRESHOLD = 2;

    beforeEach(async function () {
        [owner1, owner2, owner3, user1, user2, bank1, attacker] = await ethers.getSigners();
        owners = [owner1.address, owner2.address, owner3.address];

        // 1. Deploy MultiSig
        MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
        MultiSig = await MultiSigWallet.deploy(owners, THRESHOLD);

        // 2. Deploy Mock Verifier
        MockZKVerifier = await ethers.getContractFactory("MockZKVerifier");
        Verifier = await MockZKVerifier.deploy();

        // 3. Deploy KYC Contract
        DecentralizedKYC = await ethers.getContractFactory("DecentralizedKYC");
        KYC = await DecentralizedKYC.deploy(await Verifier.getAddress());

        // 4. Setup Governance: Set MultiSig as Government
        // Initially owner1 is government (deployer)
        await KYC.connect(owner1).changeGovernment(await MultiSig.getAddress());
    });

    // ─── CATEGORY 1: MultiSigWallet Logic (6 Tests) ──────────────────────────

    describe("MultiSigWallet Fundamentals", function () {
        it("[1] Should initialize with correct owners and threshold", async function () {
            expect(await MultiSig.numConfirmationsRequired()).to.equal(THRESHOLD);
            expect(await MultiSig.isOwner(owner1.address)).to.be.true;
        });

        it("[2] Should allow owner to submit a transaction", async function () {
            await MultiSig.connect(owner1).submitTransaction(user1.address, 0, "0x");
            expect(await MultiSig.getTransactionCount()).to.equal(1);
        });

        it("[3] Should prevent non-owner from submitting", async function () {
            await expect(
                MultiSig.connect(attacker).submitTransaction(user1.address, 0, "0x")
            ).to.be.revertedWith("not owner");
        });

        it("[4] Should record confirmations correctly", async function () {
            await MultiSig.connect(owner1).submitTransaction(user1.address, 0, "0x");
            await MultiSig.connect(owner1).confirmTransaction(0);
            const tx = await MultiSig.getTransaction(0);
            expect(tx.numConfirmations).to.equal(1);
        });

        it("[5] Should allow revoking a confirmation", async function () {
            await MultiSig.connect(owner1).submitTransaction(user1.address, 0, "0x");
            await MultiSig.connect(owner1).confirmTransaction(0);
            await MultiSig.connect(owner1).revokeConfirmation(0);
            const tx = await MultiSig.getTransaction(0);
            expect(tx.numConfirmations).to.equal(0);
        });

        it("[6] Should fail execution if below threshold", async function () {
            await MultiSig.connect(owner1).submitTransaction(user1.address, 0, "0x");
            await MultiSig.connect(owner1).confirmTransaction(0);
            await expect(
                MultiSig.connect(owner1).executeTransaction(0)
            ).to.be.revertedWith("cannot execute tx");
        });
    });

    // ─── CATEGORY 2: KYC Governance via MultiSig (6 Tests) ───────────────────

    describe("KYC Ecosystem Governance", function () {
        it("[7] Should have MultiSig assigned as Government", async function () {
            expect(await KYC.government()).to.equal(await MultiSig.getAddress());
        });

        it("[8] Should register an entity through MultiSig execution", async function () {
            const data = KYC.interface.encodeFunctionData("registerEntity", [
                bank1.address, 
                1, // BANK
                "Global Trust Bank", 
                "https://api.bank.com"
            ]);

            // Owner 1 proposes
            await MultiSig.connect(owner1).submitTransaction(await KYC.getAddress(), 0, data);
            // Owners confirm
            await MultiSig.connect(owner1).confirmTransaction(0);
            await MultiSig.connect(owner2).confirmTransaction(0);
            // Execute
            await MultiSig.connect(owner1).executeTransaction(0);

            const entity = await KYC.entityRegistry(bank1.address);
            expect(entity.isActive).to.be.true;
            expect(entity.name).to.equal("Global Trust Bank");
        });

        it("[9] Should reject direct entity registration by non-government", async function () {
            await expect(
                KYC.connect(attacker).registerEntity(attacker.address, 1, "Fake Bank", "xx")
            ).to.be.revertedWith("Only government can do this");
        });

        it("[10] Should allow changing government via MultiSig", async function () {
            const data = KYC.interface.encodeFunctionData("changeGovernment", [user1.address]);
            await MultiSig.connect(owner1).submitTransaction(await KYC.getAddress(), 0, data);
            await MultiSig.connect(owner1).confirmTransaction(0);
            await MultiSig.connect(owner2).confirmTransaction(0);
            await MultiSig.executeTransaction(0);

            expect(await KYC.government()).to.equal(user1.address);
        });

        it("[11] Should allow updating ZK Verifier address via MultiSig", async function () {
            const dummyAddr = "0x0000000000000000000000000000000000000001";
            const data = KYC.interface.encodeFunctionData("setZKVerifier", [dummyAddr]);
            await MultiSig.connect(owner1).submitTransaction(await KYC.getAddress(), 0, data);
            await MultiSig.connect(owner1).confirmTransaction(0);
            await MultiSig.connect(owner2).confirmTransaction(0);
            await MultiSig.executeTransaction(0);

            expect(await KYC.zkVerifierAddress()).to.equal(dummyAddr);
        });

        it("[12] Should correctly initialize the deployer as the first Government entity", async function () {
            // owner1 is the deployer, so they are the initial gov entity
            const govEntity = await KYC.entityRegistry(owner1.address);
            expect(govEntity.name).to.equal("Global Government");
            expect(govEntity.isActive).to.be.true;
        });
    });

    // ─── CATEGORY 3: User Identity & Access Control (6 Tests) ────────────────

    describe("User Identity & Sovereignty", function () {
        it("[13] Should allow a user to self-register", async function () {
            await KYC.connect(user1).registerUser("Alice", "hash123");
            const profile = await KYC.users(user1.address);
            expect(profile.name).to.equal("Alice");
            expect(profile.isRegistered).to.be.true;
        });

        it("[14] Should prevent duplicate user registration", async function () {
            await KYC.connect(user1).registerUser("Alice", "hash123");
            await expect(
                KYC.connect(user1).registerUser("Alice 2", "hash456")
            ).to.be.revertedWith("Already registered");
        });

        it("[15] Should allow government to manually register a user", async function () {
            const data = KYC.interface.encodeFunctionData("governmentRegisterUser", [user2.address, "Bob"]);
            await MultiSig.connect(owner1).submitTransaction(await KYC.getAddress(), 0, data);
            await MultiSig.connect(owner1).confirmTransaction(0);
            await MultiSig.connect(owner2).confirmTransaction(0);
            await MultiSig.executeTransaction(0);

            const profile = await KYC.users(user2.address);
            expect(profile.name).to.equal("Bob");
        });

        it("[16] Should allow user to grant access to an entity", async function () {
            // Register bank1 as entity first
            const data = KYC.interface.encodeFunctionData("registerEntity", [bank1.address, 1, "Bank", ""]);
            await MultiSig.connect(owner1).submitTransaction(await KYC.getAddress(), 0, data);
            await MultiSig.connect(owner1).confirmTransaction(0);
            await MultiSig.connect(owner2).confirmTransaction(0);
            await MultiSig.executeTransaction(0);

            await KYC.connect(user1).registerUser("Alice", "hash");
            await KYC.connect(user1).grantAccess(bank1.address);
            expect(await KYC.accessGranted(user1.address, bank1.address)).to.be.true;
        });

        it("[17] Should allow user to revoke access", async function () {
            // Register bank1 as entity first
            const data = KYC.interface.encodeFunctionData("registerEntity", [bank1.address, 1, "Bank", ""]);
            await MultiSig.connect(owner1).submitTransaction(await KYC.getAddress(), 0, data);
            await MultiSig.connect(owner1).confirmTransaction(0);
            await MultiSig.connect(owner2).confirmTransaction(0);
            await MultiSig.executeTransaction(0);

            await KYC.connect(user1).registerUser("Alice", "hash");
            await KYC.connect(user1).grantAccess(bank1.address);
            await KYC.connect(user1).revokeAccess(bank1.address);
            expect(await KYC.accessGranted(user1.address, bank1.address)).to.be.false;
        });

        it("[18] Should store and retrieve document hashes correctly", async function () {
            await KYC.connect(user1).registerUser("Alice", "profile_doc_hash");
            expect(await KYC.verifiedDocHashes(user1.address, "self_declared")).to.equal("profile_doc_hash");
        });
    });

    // ─── CATEGORY 4: Privacy & Verification Logic (6 Tests) ──────────────────

    describe("ZK Proofs & Verification History", function () {
        beforeEach(async function () {
            // Setup: Register User and Entity
            await KYC.connect(user1).registerUser("Alice", "hash");
            const data = KYC.interface.encodeFunctionData("registerEntity", [bank1.address, 1, "Bank", ""]);
            await MultiSig.connect(owner1).submitTransaction(await KYC.getAddress(), 0, data);
            await MultiSig.connect(owner1).confirmTransaction(0);
            await MultiSig.connect(owner2).confirmTransaction(0);
            await MultiSig.executeTransaction(0);
            await KYC.connect(user1).grantAccess(bank1.address);
        });

        it("[19] Should verify a valid (mocked) ZK Proof", async function () {
            // Mock signals: [result, is_valid]
            const pubSignals = [0, 1]; 
            const pA = [0, 0], pB = [[0, 0], [0, 0]], pC = [0, 0];
            
            const tx = await KYC.connect(bank1).verifySelectiveDisclosure(
                user1.address, "AgeCheck", pA, pB, pC, pubSignals
            );
            await expect(tx).to.emit(KYC, "ZKProofVerified");
        });

        it("[20] Should fail verification for invalid ZK Proof bit", async function () {
            const pubSignals = [0, 0]; // is_valid bit is 0
            const pA = [0, 0], pB = [[0, 0], [0, 0]], pC = [0, 0];

            // In our MockVerifier, _pubSignals[1] == 0 returns false, triggering "Invalid ZK Proof"
            await expect(
                KYC.connect(bank1).verifySelectiveDisclosure(user1.address, "AgeCheck", pA, pB, pC, pubSignals)
            ).to.be.revertedWith("Invalid ZK Proof");
        });

        it("[21] Should block ZK verification if access not granted", async function () {
            await KYC.connect(user1).revokeAccess(bank1.address);
            const pubSignals = [0, 1];
            const pA = [0, 0], pB = [[0, 0], [0, 0]], pC = [0, 0];

            await expect(
                KYC.connect(bank1).verifySelectiveDisclosure(user1.address, "AgeCheck", pA, pB, pC, pubSignals)
            ).to.be.revertedWith("Access not granted by user");
        });

        it("[22] Should correctly match an anchored hash", async function () {
            // Anchor a hash via government (Entity type Government can verify without explicit grant in some logic, but let's use the grant for bank)
            const docHash = "0x555";
            await KYC.connect(bank1).verifyDocument(user1.address, "Passport", docHash);
            
            const result = await KYC.connect(bank1).checkDocumentHash.staticCall(user1.address, "Passport", docHash);
            expect(result).to.be.true;
        });

        it("[23] Should fail hash match on data tampering", async function () {
            await KYC.connect(bank1).verifyDocument(user1.address, "Passport", "0x555");
            await expect(
                KYC.connect(bank1).checkDocumentHash(user1.address, "Passport", "0x666")
            ).to.be.revertedWith("Hash mismatch");
        });

        it("[24] Should maintain a verification history log", async function () {
            await KYC.connect(bank1).verifyDocument(user1.address, "Passport", "0x555");
            const history = await KYC.getVerificationHistory(user1.address);
            expect(history.length).to.equal(1);
            expect(history[0].entityName).to.equal("Bank");
        });
    });
});
