const hre = require("hardhat");

async function main() {
    // Hardcoded addresses from recent deployment log
    const kycAddress = "0x9A676e781A523b5d0C0e43731313A708CB607508";
    const multiSigAddress = "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82";
    
    const kyc = await hre.ethers.getContractAt("DecentralizedKYC", kycAddress);
    
    console.log("--- DIAGNOSTIC STATUS (AFTER FIX) ---");
    console.log("MultiSig Wallet:", multiSigAddress);
    console.log("KYC Contract:", kycAddress);
    
    const gov = await kyc.government();
    console.log("On-Chain Government Address:", gov);
    
    const entity = await kyc.entityRegistry(multiSigAddress);
    console.log("MultiSig in Entity Registry:");
    console.log("  - Name:", entity.name);
    console.log("  - Is Active:", entity.isActive);
    console.log("  - Entity Type (0=Gov, 1=Bank):", entity.entityType.toString());
}

main().catch(console.error);
