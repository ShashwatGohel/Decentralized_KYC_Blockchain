import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers, Contract, BrowserProvider } from 'ethers';
import { KYC_CONTRACT_ADDRESS, KYC_ABI } from '../config';

interface BlockchainContextType {
  account: string | null;
  provider: BrowserProvider | null;
  contract: Contract | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isAdmin: boolean;
  isVerifier: boolean;
}

const BlockchainContext = createContext<BlockchainContextType | undefined>(undefined);

export const BlockchainProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isVerifier, setIsVerifier] = useState<boolean>(false);

  useEffect(() => {
    checkConnection();
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
      await initializeEthers();
    } else {
      setAccount(null);
      setContract(null);
      setIsAdmin(false);
      setIsVerifier(false);
    }
  };

  const checkConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          handleAccountsChanged(accounts);
        }
      } catch (err) {
        console.error("Error checking connection:", err);
      }
    }
  };

  const initializeEthers = async () => {
    if (window.ethereum) {
      const _provider = new ethers.BrowserProvider(window.ethereum);
      const _signer = await _provider.getSigner();
      const _contract = new ethers.Contract(KYC_CONTRACT_ADDRESS, KYC_ABI, _signer);
      
      setProvider(_provider);
      setContract(_contract);

      try {
        const adminAddress = await _contract.admin();
        const verifierStatus = await _contract.verifiers(_signer.address);
        setIsAdmin(adminAddress.toLowerCase() === _signer.address.toLowerCase());
        setIsVerifier(verifierStatus);
      } catch (error) {
        console.error("Error reading role statuses:", error);
      }
    }
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        handleAccountsChanged(accounts);
      } catch (err) {
        console.error("Connection rejected", err);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setContract(null);
    setIsAdmin(false);
    setIsVerifier(false);
  };

  return (
    <BlockchainContext.Provider value={{ account, provider, contract, connectWallet, disconnectWallet, isAdmin, isVerifier }}>
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
