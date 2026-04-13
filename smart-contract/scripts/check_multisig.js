const hre = require("hardhat");
const { multiSigAddress } = require("../../backend/utils/config");

async function main() {
    const MultiSigWallet = await hre.ethers.getContractFactory("MultiSigWallet");
    const multiSig = MultiSigWallet.attach(multiSigAddress);

    const count = await multiSig.getTransactionCount();
    console.log("On-chain Proposal Count:", count.toString());

    for (let i = 0; i < Number(count); i++) {
        const tx = await multiSig.getTransaction(i);
        console.log(`\nProposal #${i}:`);
        console.log(`- To: ${tx.to}`);
        console.log(`- Executed: ${tx.executed}`);
        console.log(`- Confirmations: ${tx.numConfirmations}`);
    }
}

main().catch(console.error);
