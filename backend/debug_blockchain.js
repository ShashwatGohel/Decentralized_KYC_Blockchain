const { ethers } = require('ethers');
const ABI = require('../smart-contract/KYC_ABI_utf8.json');
const CONTRACT_ADDRESS = "0xE26f0926D8C96D937dD38a1d4e029dF77f0240CC";
const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";

async function check() {
    const provider = new ethers.JsonRpcProvider(RPC_URL, undefined, { staticNetwork: true });
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
    
    const wallet = "0x82f7750ff5a4c4352edf212fe0c168781f55ec6"; // Example from previous msgs, but I should check the user's wallet
    // Actually, I should probably check the wallet the user most recently linked.
    
    console.log("Checking contract:", CONTRACT_ADDRESS);
    try {
        const admin = await contract.admin();
        console.log("Contract Admin:", admin);
        
        // I'll leave the specific wallet check for when I have the actual address from logs or the user
    } catch (e) {
        console.error("Error connecting to contract:", e.message);
    }
}

check();
