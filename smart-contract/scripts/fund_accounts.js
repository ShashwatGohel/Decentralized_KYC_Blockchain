const hre = require("hardhat");

async function main() {
    const addressesToFund = [
        "0x3aF75be923b21Fe14B5717895215C1975B71186d", // Admin
        "0x585CaE62915e95eFbba7615D39B7F7e103A1BdB9", // Government
        "0xb78d867e61f1f6e84a8c41e6c5b22696249573b9", // Nirmala (Bank)
        "0xfc61ac7ea45c4143cbd99fdf5eda18407e5833be", // Shashwat (User)
        "0x4e8e3c8aa0f554a1598ffae12ac64e75dc8e5815"  // Dharman (User)
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
