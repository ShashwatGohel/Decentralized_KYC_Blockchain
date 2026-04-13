import React from 'react';
import { useBlockchain } from '../context/BlockchainContext';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, Wallet, Shield } from 'lucide-react';

const Navbar: React.FC = () => {
  const { account, connectWallet, disconnectWallet, isVerifier, isAdmin, isGovernment, isCorrectNetwork, switchNetwork } = useBlockchain();
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    disconnectWallet();
  };

  return (
    <>
      {!isCorrectNetwork && (
        <div style={{ 
          background: '#ef4444', 
          color: '#fff', 
          textAlign: 'center', 
          padding: '0.6rem', 
          fontSize: '0.95rem', 
          fontWeight: 'bold',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
        }}>
          <span>⚠️ WRONG NETWORK: Please switch MetaMask to Localhost (8545).</span>
          <button 
            onClick={switchNetwork} 
            style={{ 
              padding: '0.3rem 0.8rem', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              border: '2px solid #fff', 
              background: '#fff', 
              color: '#ef4444',
              fontWeight: 'bold',
              fontSize: '0.85rem'
            }}
          >
            Switch to Localhost
          </button>
        </div>
      )}
      <nav className="nav" style={{ marginTop: !isCorrectNetwork ? '2.8rem' : '0' }}>
        <div style={{ display: 'flex', gap: '3rem', alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ 
              width: '36px', height: '36px', 
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', 
              borderRadius: '10px',
              boxShadow: '0 0 15px var(--primary-glow)'
            }}></div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              <span style={{ color: '#fff' }}>De</span><span style={{ color: 'var(--primary)' }}>KYC</span>
            </h2>
          </Link>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>Protocol</Link>
            <Link to="/ledger" className={`nav-link ${isActive('/ledger') ? 'active' : ''}`}>Live Ledger</Link>
            {isAuthenticated && (
              <>
                {user?.role === 'user' && (
                  <>
                    <Link to="/user" className={`nav-link ${isActive('/user') ? 'active' : ''}`}>Identity</Link>
                    <Link to="/verify" className={`nav-link ${isActive('/verify') ? 'active' : ''}`}>ZK Proofs</Link>
                    <Link to="/vault" className={`nav-link ${isActive('/vault') ? 'active' : ''}`}>Vault</Link>
                  </>
                )}
                {user?.role === 'entity' && (
                  <Link to="/entity" className={`nav-link ${isActive('/entity') ? 'active' : ''}`}>Portal</Link>
                )}
                {(isVerifier || isGovernment || user?.role === 'government' || user?.role === 'bank' || user?.role === 'verifier') && (
                  <Link to="/verifier" className={`nav-link ${isActive('/verifier') ? 'active' : ''}`}>Verification Engine</Link>
                )}
                {(isAdmin || user?.role === 'admin' || user?.role === 'government') && (
                  <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>Admin</Link>
                )}
              </>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {!isAuthenticated ? (
            <Link to="/login" className="btn btn-primary" style={{ textDecoration: 'none' }}>Get Started</Link>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>{user?.fullName || user?.username}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontFamily: 'monospace' }}>
                    {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Wallet Disconnected'}
                  </span>
              </div>
              
              {account ? (
                <button onClick={handleLogout} className="btn btn-ghost" style={{ padding: '0.6rem 1rem' }}>
                  <LogOut size={16} />
                </button>
              ) : (
                <button onClick={connectWallet} className="btn btn-secondary" style={{ padding: '0.6rem 1rem' }}>
                  <Wallet size={16} /> Connect
                </button>
              )}
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
