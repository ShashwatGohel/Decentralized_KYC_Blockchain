import React from 'react';
import { useBlockchain } from '../context/BlockchainContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Globe, Zap, CheckCircle, Activity, UserPlus, Server } from 'lucide-react';

const Home: React.FC = () => {
  const { account, connectWallet } = useBlockchain();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const renderHero = () => {
    if (!isAuthenticated) {
      return (
        <div className="animate-in">
          <h1 className="gradient-text" style={{ fontSize: '5rem', lineHeight: 1, marginBottom: '2rem' }}>
            Identity for the <br/>Decentralized Era.
          </h1>
          <p className="sub-heading" style={{ maxWidth: '800px', margin: '0 auto 3.5rem auto', fontSize: '1.25rem' }}>
            DeKYC is an institutional-grade identity protocol that enables trustless verification through Zero-Knowledge proofs and Multi-Sig governance.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem' }}>
            <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>
              Create Identity
            </button>
            <button className="btn btn-ghost" style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>
              Read Whitepaper
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="animate-in">
        <h1 className="gradient-text" style={{ fontSize: '4.5rem', lineHeight: 1.1, marginBottom: '2rem' }}>
          Welcome back, <br/>{user?.fullName || user?.username}
        </h1>
        <p className="sub-heading" style={{ maxWidth: '800px', margin: '0 auto 3.5rem auto', fontSize: '1.25rem' }}>
          Your Decentralized ID is {account ? <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Active</span> : <span style={{ color: 'var(--warning)', fontWeight: 700 }}>Syncing...</span>}.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem' }}>
          <button onClick={() => navigate(user?.role === 'entity' ? '/entity' : '/user')} className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>
            Go to Dashboard
          </button>
          <button onClick={() => navigate('/ledger')} className="btn btn-ghost" style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>
            View Network Ledger
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-in" style={{ padding: '4rem 0' }}>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', maxWidth: '1000px', margin: '0 auto', marginBottom: '10rem' }}>
        {renderHero()}
      </section>

      {/* Stats/Badge Section */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '4rem', marginBottom: '10rem' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', fontWeight: 800 }}>100%</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700 }}>Privacy Preserved</div>
            </div>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', fontWeight: 800 }}>{'<'}1s</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700 }}>Verification Time</div>
            </div>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', fontWeight: 800 }}>ZK</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700 }}>Groth16 Engine</div>
            </div>
      </div>

      {/* Feature Grid */}
      <section style={{ marginBottom: '10rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '5rem', fontSize: '3rem' }} className="gradient-text">The Protocol Engine</h2>
        <div className="feature-grid">
           <div className="glass glass-hover" style={{ padding: '3rem' }}>
              <Lock size={40} color="var(--primary)" style={{ marginBottom: '1.5rem' }} />
              <h3>Self-Sovereignty</h3>
              <p style={{ color: 'var(--text-dim)', lineHeight: 1.6 }}>Own your data. Documents are hashed locally and stored in your private vault, only shared via cryptographic consent.</p>
           </div>
           <div className="glass glass-hover" style={{ padding: '3rem' }}>
              <Activity size={40} color="var(--secondary)" style={{ marginBottom: '1.5rem' }} />
              <h3>Real-Time Audit</h3>
              <p style={{ color: 'var(--text-dim)', lineHeight: 1.6 }}>Every identity action is recorded on the public ledger, providing full transparency without compromising user anonymity.</p>
           </div>
           <div className="glass glass-hover" style={{ padding: '3rem' }}>
              <Zap size={40} color="var(--warning)" style={{ marginBottom: '1.5rem' }} />
              <h3>ZK-Disclosures</h3>
              <p style={{ color: 'var(--text-dim)', lineHeight: 1.6 }}>Prove you are over 18, have a certain income, or credit score bracket using mathematical proofs that never reveal raw data.</p>
           </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="glass" style={{ padding: '5rem', textAlign: 'center', background: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.05) 0%, transparent 70%)' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Network Governance</h2>
        <p className="sub-heading" style={{ maxWidth: '700px', margin: '0 auto 3rem auto' }}>
          DeKYC is managed by a decentralized Multi-Signature council. No single entity can revoke or modify your identity status without M-of-N consensus.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '4rem' }}>
            <div style={{ textAlign: 'center' }}>
                <Server size={32} color="var(--primary)" />
                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', fontWeight: 700 }}>Decentralized Nodes</div>
            </div>
            <div style={{ textAlign: 'center' }}>
                <UserPlus size={32} color="var(--secondary)" />
                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', fontWeight: 700 }}>Certified Verifiers</div>
            </div>
            <div style={{ textAlign: 'center' }}>
                <Shield size={32} color="var(--warning)" />
                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', fontWeight: 700 }}>Council Guard</div>
            </div>
        </div>
      </section>

      <footer style={{ marginTop: '10rem', textAlign: 'center', borderTop: '1px solid var(--border-glass)', paddingTop: '5rem' }}>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>&copy; 2026 DeKYC Protocol &bull; Secure Identity Layer &bull; v2.0-beta</p>
      </footer>
    </div>
  );
};

export default Home;
