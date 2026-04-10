const { ethers } = require('ethers');
const ABI = require('../smart-contract/KYC_ABI_utf8.json');
const CONTRACT_ADDRESS = "0xE26f0926D8C96D937dD38a1d4e029dF77f0240CC";
const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";

async function check() {
    const provider = new ethers.JsonRpcProvider(RPC_URL, undefined, { staticNetwork: true });
    
    console.log("Fetching logs for contract:", CONTRACT_ADDRESS);
    try {
        const topic = ethers.id("EntityRegistered(address,uint8,string)");
        const logs = await provider.getLogs({
            address: CONTRACT_ADDRESS,
            topics: [topic],
            fromBlock: 0,
            toBlock: 'latest'
        });
        
        console.log("Total EntityRegistered logs:", logs.length);
        const iface = new ethers.Interface(ABI);
        logs.forEach((log, i) => {
            const parsed = iface.parseLog(log);
            console.log(`[${i}] Block: ${log.blockNumber}`);
            console.log(`    Address: ${parsed.args[0]}`);
            console.log(`    Type: ${parsed.args[1]}`);
            console.log(`    Name: ${parsed.args[2]}`);
        });
    } catch (e) {
        console.error("Error:", e.message);
    }
    process.exit();
}

check();
