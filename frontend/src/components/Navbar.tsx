import React from 'react';
import { useBlockchain } from '../context/BlockchainContext';
import { Link, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const { account, connectWallet, disconnectWallet, isAdmin, isVerifier } = useBlockchain();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="glass" style={{ 
      margin: '1.5rem 2rem', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '0.8rem 2rem',
      position: 'sticky',
      top: '1rem',
      zIndex: 100
    }}>
      <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '32px', height: '32px', background: '#fff', borderRadius: '6px' }}></div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>DeKYC</h2>
        </Link>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>Market</Link>
          {account && <Link to="/user" className={`nav-link ${isActive('/user') ? 'active' : ''}`}>Dashboard</Link>}
          {isVerifier && <Link to="/verifier" className={`nav-link ${isActive('/verifier') ? 'active' : ''}`}>Verify</Link>}
          {isAdmin && <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>Admin</Link>}
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {account ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="account-pill glass">
              <span className="dot"></span>
              <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{account.slice(0, 6)}...{account.slice(-4)}</span>
            </div>
            <button onClick={disconnectWallet} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              Disconnect
            </button>
          </div>
        ) : (
          <button onClick={connectWallet} className="btn btn-primary">
            Connect Wallet
          </button>
        )}
      </div>

      <style>{`
        .nav-link {
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 0.95rem;
          font-weight: 500;
          transition: var(--transition);
        }
        .nav-link:hover, .nav-link.active {
          color: var(--text-primary);
        }
        .account-pill {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.5rem 1rem;
          border-radius: 100px;
        }
        .dot {
          width: 8px;
          height: 8px;
          background-color: var(--success);
          border-radius: 50%;
          box-shadow: 0 0 10px var(--success);
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
