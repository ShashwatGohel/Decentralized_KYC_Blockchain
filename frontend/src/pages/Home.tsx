import React from 'react';
import { useBlockchain } from '../context/BlockchainContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const { account, connectWallet } = useBlockchain();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const renderHero = () => {
    if (!isAuthenticated) {
      return (
        <>
          <h1 className="gradient-text" style={{ fontSize: '4.5rem', lineHeight: 1.1, marginBottom: '2rem' }}>
            De-Identification for the Decentralized Web.
          </h1>
          <p style={{ fontSize: '1.25rem', marginBottom: '3rem', maxWidth: '700px', margin: '0 auto 3rem auto', color: 'var(--text-secondary)' }}>
            DeKYC is a trustless identity layer that allows users to verify their credentials on-chain without ever exposing private document data.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
            <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
              Get Started
            </button>
            <button className="btn btn-outline" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
              How it Works
            </button>
          </div>
        </>
      );
    }

    if (user?.role === 'entity') {
      return (
        <>
          <h1 className="gradient-text" style={{ fontSize: '4rem', lineHeight: 1.1, marginBottom: '2rem' }}>
            Institution Management Console
          </h1>
          <p style={{ fontSize: '1.25rem', marginBottom: '3rem', maxWidth: '700px', margin: '0 auto 3rem auto', color: 'var(--text-secondary)' }}>
            Welcome back, <strong>{user.entityName || user.username}</strong>. Manage KYC applications, verify user identities on-chain, and audit access logs.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
            <button onClick={() => navigate('/entity')} className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
              Go to Portal
            </button>
            <button onClick={() => navigate('/explorer')} className="btn btn-outline" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
              Search Registry
            </button>
          </div>
        </>
      );
    }

    return (
      <>
        <h1 className="gradient-text" style={{ fontSize: '4rem', lineHeight: 1.1, marginBottom: '2rem' }}>
          Welcome to Your Identity Hub
        </h1>
        <p style={{ fontSize: '1.25rem', marginBottom: '3rem', maxWidth: '700px', margin: '0 auto 3rem auto', color: 'var(--text-secondary)' }}>
          Hello, <strong>{user?.fullName || user?.username}</strong>. Your decentralized identity is ready. Secure your vault and manage your on-chain verification status.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
          <button onClick={() => navigate('/user')} className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
            Open Dashboard
          </button>
          <button onClick={() => navigate('/vault')} className="btn btn-outline" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
            Access Vault
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="fade-in" style={{ padding: '4rem 0' }}>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', maxWidth: '900px', margin: '0 auto', marginBottom: '8rem' }}>
        {renderHero()}
      </section>

      {/* How it Works Section */}
      <section style={{ marginBottom: '10rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '4rem', fontSize: '2.5rem' }}>The Verification Cycle</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3rem' }}>
          <div className="glass" style={{ padding: '3rem', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-1rem', left: '2rem', background: '#fff', color: '#000', padding: '0.2rem 1rem', fontWeight: 900, borderRadius: '4px' }}>01</div>
            <h3 style={{ marginTop: '1rem' }}>Local Hashing</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Users input their sensitive document data (Passport/ID). Our frontend generates a <strong>SHA-3 cryptographic hash</strong> locally. Your plain text data never leaves your device.
            </p>
          </div>
          <div className="glass" style={{ padding: '3rem', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-1rem', left: '2rem', background: '#fff', color: '#000', padding: '0.2rem 1rem', fontWeight: 900, borderRadius: '4px' }}>02</div>
            <h3 style={{ marginTop: '1rem' }}>Node Verification</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Authorized network verifiers check the physical document against the commitment hash. Once confirmed, a <strong>Smart Contract verification event</strong> is triggered.
            </p>
          </div>
          <div className="glass" style={{ padding: '3rem', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-1rem', left: '2rem', background: '#fff', color: '#000', padding: '0.2rem 1rem', fontWeight: 900, borderRadius: '4px' }}>03</div>
            <h3 style={{ marginTop: '1rem' }}>Immutable Proof</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              The Ethereum blockchain stores the verification status for your wallet address. Any Web3 service can now <strong>instantly validate your identity</strong> without seeing your documents.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
        <div className="glass" style={{ padding: '2.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>✦</div>
          <h3>Privacy-First</h3>
          <p>Zero-Knowledge principles ensure that your private data is never stored on a central server or the blockchain.</p>
        </div>
        <div className="glass" style={{ padding: '2.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>◈</div>
          <h3>Admin Managed</h3>
          <p>The protocol is governed by administrators who manage the pool of trusted verifiers, ensuring network integrity.</p>
        </div>
        <div className="glass" style={{ padding: '2.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>▣</div>
          <h3>Sybil Resistance</h3>
          <p>One verified identity per wallet. DeKYC provides a robust foundation for DAO voting and gated decentralized services.</p>
        </div>
      </section>

      <footer style={{ marginTop: '8rem', textAlign: 'center', borderTop: '1px solid var(--card-border)', paddingTop: '4rem' }}>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>&copy; 2026 DeKYC Protocol. Built for Ahmedabad University Blockchain Lab.</p>
      </footer>
    </div>
  );
};

export default Home;
