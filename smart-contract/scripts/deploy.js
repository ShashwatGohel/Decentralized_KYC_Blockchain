const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const [deployer, admin2, admin3] = await hre.ethers.getSigners();

  console.log("Deploying contracts with local account:", deployer.address);

  // 1. Deploy ZKVerifier
  console.log("Deploying ZKVerifier...");
  const ZKVerifier = await hre.ethers.getContractFactory("Groth16Verifier");
  const zkVerifier = await ZKVerifier.deploy();
  await zkVerifier.waitForDeployment();
  const zkVerifierAddress = await zkVerifier.getAddress();
  console.log(`ZKVerifier deployed to: ${zkVerifierAddress}`);

  // 2. Deploy MultiSigWallet
  // BhupendraPatel added as an owner for easier testing
  const owners = [
    "0x0af9a4a27e69b29bd448d7028181f655f64b8ca0", // New Admin Wallet
    admin2.address, 
    admin3.address, 
    "0xcac522eecdbae2d735a7ce2de43bbac477593f7f" // BhupendraPatel
  ];
  const requiredConfirmations = 2;
  console.log("Deploying MultiSigWallet with owners:", owners);
  const MultiSigWallet = await hre.ethers.getContractFactory("MultiSigWallet");
  const multiSigWallet = await MultiSigWallet.deploy(owners, requiredConfirmations);
  await multiSigWallet.waitForDeployment();
  const multiSigAddress = await multiSigWallet.getAddress();
  console.log(`MultiSigWallet deployed to: ${multiSigAddress}`);

  // 3. Deploy DecentralizedKYC
  console.log("Deploying DecentralizedKYC...");
  const DecentralizedKYC = await hre.ethers.getContractFactory("DecentralizedKYC");
  const decentralizedKyc = await DecentralizedKYC.deploy(zkVerifierAddress);
  await decentralizedKyc.waitForDeployment();
  const kycAddress = await decentralizedKyc.getAddress();
  console.log(`DecentralizedKYC deployed to: ${kycAddress}`);

  // Transfer ownership of Government role in DecentralizedKYC to MultiSigWallet
  console.log("Transferring Government role to MultiSigWallet...");
  let tx = await decentralizedKyc.changeGovernment(multiSigAddress);
  await tx.wait();
  console.log("Government role transferred successfully. Project deployed securely.");

  // Write contract addresses out so backend/frontend can use them
  const frontendConfigPath = path.join(__dirname, "..", "..", "frontend", "src", "config.ts");
  const backendConfigPath = path.join(__dirname, "..", "..", "backend", "utils", "config.js");

  const contractInfo = {
    decentralizedKycAddress: kycAddress,
    multiSigAddress: multiSigAddress,
    zkVerifierAddress: zkVerifierAddress
  };

  const configContent = `// Auto-generated from deployment script
export const contractAddresses = ${JSON.stringify(contractInfo, null, 2)};
`;

  // We write to frontend (frontend might be TS)
  fs.writeFileSync(frontendConfigPath, configContent);
  console.log("Updated frontend config.");

  // For backend it needs to be commonJS
  const backendContent = `// Auto-generated from deployment script
module.exports = ${JSON.stringify(contractInfo, null, 2)};
`;

  fs.writeFileSync(backendConfigPath, backendContent);
  console.log("Updated backend config.");

  // Also copy ABIs
  const kycArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'artifacts', 'contracts', 'DecentralizedKYC.sol', 'DecentralizedKYC.json')));
  const multiSigArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'artifacts', 'contracts', 'MultiSigWallet.sol', 'MultiSigWallet.json')));

  fs.writeFileSync(path.join(__dirname, "..", "..", "frontend", "src", "KYC_ABI.json"), JSON.stringify(kycArtifact.abi, null, 2));
  fs.writeFileSync(path.join(__dirname, "..", "..", "backend", "utils", "KYC_ABI.json"), JSON.stringify(kycArtifact.abi, null, 2));

  fs.writeFileSync(path.join(__dirname, "..", "..", "frontend", "src", "MultiSig_ABI.json"), JSON.stringify(multiSigArtifact.abi, null, 2));
  fs.writeFileSync(path.join(__dirname, "..", "..", "backend", "utils", "MultiSig_ABI.json"), JSON.stringify(multiSigArtifact.abi, null, 2));

  console.log("ABIs copied successfully.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
