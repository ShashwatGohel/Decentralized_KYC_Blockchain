import React from 'react';
import { useBlockchain } from '../context/BlockchainContext';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const { account, connectWallet, disconnectWallet, isVerifier } = useBlockchain();
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    disconnectWallet();
  };

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
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>Protocol</Link>
          <Link to="/explorer" className={`nav-link ${isActive('/explorer') ? 'active' : ''}`}>Explorer</Link>
          {isAuthenticated && (
            <>
              {/* User-Specific Links */}
              {user?.role === 'user' && (
                <>
                  <Link to="/user" className={`nav-link ${isActive('/user') ? 'active' : ''}`}>My Identity</Link>
                  <Link to="/verify" className={`nav-link ${isActive('/verify') ? 'active' : ''}`}>Verify Identity</Link>
                  <Link to="/vault" className={`nav-link ${isActive('/vault') ? 'active' : ''}`}>Vault</Link>
                </>
              )}

              {/* Entity-Specific Links */}
              {user?.role === 'entity' && (
                <>
                  <Link to="/entity" className={`nav-link ${isActive('/entity') ? 'active' : ''}`}>Institution Portal</Link>
                </>
              )}

              {/* Verifier Specific */}
              {isVerifier && (
                <Link to="/verifier" className={`nav-link ${isActive('/verifier') ? 'active' : ''}`}>Verifier Portal</Link>
              )}
            </>
          )}
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {!isAuthenticated ? (
          <Link to="/login" className="btn btn-primary" style={{ textDecoration: 'none' }}>Login / Signup</Link>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user?.username}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{account?.slice(0, 6)}...{account?.slice(-4)}</span>
            </div>
            <div className="account-pill glass" style={{ padding: '0.4rem' }}>
              <span className="dot"></span>
            </div>
            <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              Sign Out
            </button>
          </div>
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
