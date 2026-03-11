import React from 'react';
import { useBlockchain } from '../context/BlockchainContext';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const { account, connectWallet } = useBlockchain();
  const navigate = useNavigate();

  return (
    <div className="fade-in" style={{ padding: '4rem 0' }}>
      <section style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto', marginBottom: '6rem' }}>
        <h1 className="gradient-text" style={{ fontSize: '4.5rem', lineHeight: 1.1, marginBottom: '2rem' }}>
          Secure Identity Verification on the Ethereum Blockchain.
        </h1>
        <p style={{ fontSize: '1.25rem', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem auto' }}>
          DeKYC provides a decentralized, tamper-proof, and privacy-focused identity layer for modern decentralized applications.
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
          {!account ? (
            <button onClick={connectWallet} className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
              Launch App
            </button>
          ) : (
            <button onClick={() => navigate('/user')} className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
              Go to Dashboard
            </button>
          )}
          <button className="btn btn-outline" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
            View Protocol
          </button>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
        <div className="glass" style={{ padding: '2.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>✦</div>
          <h3>Privacy-First</h3>
          <p>Your documents never touch the blockchain. We only store cryptographic hashes, keeping your data secure.</p>
        </div>
        <div className="glass" style={{ padding: '2.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>◈</div>
          <h3>Immutable Proof</h3>
          <p>Once verified by authorized entites, your identity is cryptographically proven across the decentralized web.</p>
        </div>
        <div className="glass" style={{ padding: '2.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>▣</div>
          <h3>Permissionless Access</h3>
          <p>Any dApp can integrate DeKYC to verify their users without storing sensitive PI data themselves.</p>
        </div>
      </section>

      <footer style={{ marginTop: '8rem', textAlign: 'center', borderTop: '1px solid var(--card-border)', paddingTop: '4rem' }}>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>&copy; 2026 DeKYC Protocol. Built for Ahmedabad University Blockchain Lab.</p>
      </footer>
    </div>
  );
};

export default Home;
