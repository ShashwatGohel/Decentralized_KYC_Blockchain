import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { contractAddresses } from '../config';
import KYC_ABI from '../KYC_ABI.json';
import MultiSig_ABI from '../MultiSig_ABI.json';

interface BlockchainContextType {
  account: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  kycContract: ethers.Contract | null;
  multiSigContract: ethers.Contract | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isAdmin: boolean;
  isVerifier: boolean;
  isEntity: boolean;
  isGovernment: boolean;
  networkName: string;
  isCorrectNetwork: boolean;
  switchNetwork: () => Promise<void>;
}

const BlockchainContext = createContext<BlockchainContextType | undefined>(undefined);

export const BlockchainProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [kycContract, setKycContract] = useState<ethers.Contract | null>(null);
  const [multiSigContract, setMultiSigContract] = useState<ethers.Contract | null>(null);
  
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isVerifier, setIsVerifier] = useState<boolean>(false);
  const [isGovernment, setIsGovernment] = useState<boolean>(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState<boolean>(!window.ethereum); // Only false if we have ethereum to check
  const [networkChecked, setNetworkChecked] = useState<boolean>(false);
  const networkName = 'Hardhat / Local';
  const EXPECTED_CHAIN_ID = '31337';

  const initBlockchain = async () => {
    if (window.ethereum) {
      try {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await browserProvider.listAccounts();
        
        if (accounts.length > 0) {
          const userSigner = await browserProvider.getSigner();
          const address = await userSigner.getAddress();
          
          setAccount(address.toLowerCase());
          setProvider(browserProvider);
          setSigner(userSigner);

          const kyc = new ethers.Contract(contractAddresses.decentralizedKycAddress, KYC_ABI, userSigner);
          const multi = new ethers.Contract(contractAddresses.multiSigAddress, MultiSig_ABI, userSigner);

          setKycContract(kyc);
          setMultiSigContract(multi);

          const network = await browserProvider.getNetwork();
          const currentChainId = network.chainId.toString();
          console.log("Network Connection Check - Chain ID:", currentChainId);
          console.log("ACTIVE CONTRACT ADDRESS:", contractAddresses.decentralizedKycAddress);
          setIsCorrectNetwork(currentChainId === EXPECTED_CHAIN_ID);

          const isOwner = await multi.isOwner(address);
          setIsAdmin(isOwner);

          // Detect Roles
          const govAddress = await kyc.government();
          setIsGovernment(address.toLowerCase() === govAddress.toLowerCase() || isOwner);
          
          const entity = await kyc.entityRegistry(address);
          setIsVerifier(entity.isActive);
        } else {
            // Not connected to accounts yet, but we can still check network if provider exists
            const browserProvider = new ethers.BrowserProvider(window.ethereum);
            const network = await browserProvider.getNetwork();
            setIsCorrectNetwork(network.chainId.toString() === EXPECTED_CHAIN_ID);
        }
      } catch (err) {
        console.error("Blockchain initialization error:", err);
      }
    }
  };

  useEffect(() => {
    initBlockchain();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', () => window.location.reload());
      window.ethereum.on('chainChanged', () => window.location.reload());
    }
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      await initBlockchain();
    } catch (err) {
      console.error("Connection failed:", err);
    }
  };

  const switchNetwork = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x7A69' }], // 31337 in hex
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x7A69',
                chainName: 'Hardhat Localhost',
                rpcUrls: ['http://127.0.0.1:8545'],
                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              },
            ],
          });
        } catch (addError) {}
      }
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setKycContract(null);
    setMultiSigContract(null);
    setIsAdmin(false);
    setIsVerifier(false);
    setIsGovernment(false);
  };

  return (
    <BlockchainContext.Provider value={{
      account,
      provider,
      signer,
      kycContract,
      multiSigContract,
      connectWallet,
      disconnectWallet,
      isAdmin,
      isVerifier,
      isEntity: isVerifier,
      isGovernment,
      networkName,
      isCorrectNetwork,
      switchNetwork
    }}>
      {children}
    </BlockchainContext.Provider>
  );
};

export const useBlockchain = () => {
  const context = useContext(BlockchainContext);
  if (context === undefined) {
    throw new Error('useBlockchain must be used within a BlockchainProvider');
  }
  return context;
};

// No global ethereum declaration here to avoid conflict with existing types
