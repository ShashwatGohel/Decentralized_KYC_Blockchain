const hre = require("hardhat");

async function main() {
    const txHash = "0x5e4445c678097d4b6f4294e0108a850016fd4b8bc817376f3655d203eef75a46";
    try {
        const tx = await hre.ethers.provider.getTransaction(txHash);
        if (!tx) {
            console.log("Transaction NOT found on this node.");
            return;
        }
        console.log("Transaction found!");
        console.log("- From:", tx.from);
        console.log("- To:", tx.to);
        
        const receipt = await hre.ethers.provider.getTransactionReceipt(txHash);
        if (receipt) {
            console.log("- Status:", receipt.status === 1 ? "Success" : "Failed");
        } else {
            console.log("- Status: Pending");
        }
    } catch (e) {
        console.error("Error checking tx:", e);
    }
}

main().catch(console.error);
