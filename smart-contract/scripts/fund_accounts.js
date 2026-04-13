const hre = require("hardhat");

async function main() {
    const addressesToFund = [
        "0x0af9a4a27e69b29bd448d7028181f655f64b8ca0", // Admin
        "0xcac522eecdbae2d735a7ce2de43bbac477593f7f", // Government
        "0xb78d867e61f1f6e84a8c41e6c5b22696249573b9"  // Nirmala
    ];

    const [deployer] = await hre.ethers.getSigners();
    console.log("Funding from Account[0]:", deployer.address);
    console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");

    for (const addr of addressesToFund) {
        const balance = await hre.ethers.provider.getBalance(addr);
        console.log(`- ${addr}: ${hre.ethers.formatEther(balance)} ETH`);
        if (balance < hre.ethers.parseEther("10.0")) {
            console.log(`  Transferring 50 ETH to ${addr}...`);
            const tx = await deployer.sendTransaction({
                to: addr,
                value: hre.ethers.parseEther("50.0")
            });
            await tx.wait();
            console.log("  Success!");
        }
    }
}

main().catch(console.error);
