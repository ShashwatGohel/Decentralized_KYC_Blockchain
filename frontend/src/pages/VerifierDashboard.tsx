import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBlockchain } from '../context/BlockchainContext';
import { Shield, AlertTriangle, CheckCircle, Search, UserCheck } from 'lucide-react';

const VerifierDashboard: React.FC = () => {
    const { isGovernment, isVerifier, kycContract, account } = useBlockchain();
    const { token } = useAuth();
    const [userAddress, setUserAddress] = useState('');
    const [docType, setDocType] = useState('Identity Certificate');
    const [documentHash, setDocumentHash] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | '', msg: string }>({ type: '', msg: '' });
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);

    useEffect(() => {
        if (token && (isGovernment || isVerifier)) {
            fetchPendingRequests();
        }
    }, [token, isGovernment, isVerifier]);

    const fetchPendingRequests = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/verify/pending', {
                headers: { 'x-auth-token': token || '' }
            });
            const data = await res.json();
            if (res.ok) setPendingRequests(data);
        } catch (err) {}
    };

    const handleVerify = async (e?: React.FormEvent, overrideAddress?: string, overrideHash?: string) => {
        if (e) e.preventDefault();
        const address = overrideAddress || userAddress;
        const hash = overrideHash || documentHash;

        if (!kycContract || !address || !hash) return;

        setLoading(true);
        setStatus({ type: '', msg: '' });
        try {
            const tx = await kycContract.verifyDocument(address, docType, hash);
            setStatus({ type: 'success', msg: `Transaction submitted: ${tx.hash.slice(0, 15)}...` });
            await tx.wait();
            setStatus({ type: 'success', msg: `Identity successfully verified for ${address.slice(0, 10)}...` });
            
            await fetch('http://localhost:5000/api/kyc/verify-sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
                body: JSON.stringify({ userWallet: address, docHash: hash })
            });

            fetchPendingRequests();
        } catch (err: any) {
            console.error(err);
            setStatus({ type: 'error', msg: `Verification Failed: ${err.reason || err.message}` });
        } finally {
            setLoading(false);
        }
    };

    if (!isGovernment && !isVerifier) {
        return (
            <div className="glass animate-in" style={{ padding: '6rem 3rem', textAlign: 'center', marginTop: '4rem' }}>
                <div style={{ marginBottom: '1.5rem', color: 'var(--error)' }}><AlertTriangle size={48} /></div>
                <h1 className="gradient-text" style={{ fontSize: '2.5rem' }}>Access Restricted</h1>
                <p className="sub-heading">Only authorized Government entities or registered Institutions can access the Verification Engine.</p>
            </div>
        );
    }

    return (
        <div className="animate-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <header style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <Shield size={40} color="var(--primary)" />
                    <h1 className="gradient-text" style={{ fontSize: '3rem' }}>Verification Engine</h1>
                </div>
                <p className="sub-heading">
                    {isGovernment ? 'Global Government Authority Node' : 'Institutional Verifier Node'} — Connected as <strong>{account?.slice(0,10)}...</strong>
                </p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
                {/* Manual Verification Form */}
                <div className="glass" style={{ padding: '2.5rem' }}>
                    <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <UserCheck size={24} /> Direct On-Chain Verification
                    </h3>
                    
                    {status.msg && (
                        <div className={`badge ${status.type === 'success' ? 'badge-success' : 'badge-error'}`} style={{ width: '100%', padding: '1rem', marginBottom: '2rem', borderRadius: '8px', background: status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: status.type === 'success' ? 'var(--primary)' : 'var(--error)' }}>
                            {status.msg}
                        </div>
                    )}

                    <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label>Subject Wallet Address</label>
                            <input 
                                type="text" 
                                value={userAddress}
                                onChange={(e) => setUserAddress(e.target.value)}
                                placeholder="0x..."
                                required
                            />
                        </div>
                        <div>
                            <label>Document Entry Type</label>
                            <select value={docType} onChange={(e) => setDocType(e.target.value)}>
                                <option>Identity Certificate</option>
                                <option>Financial Statement</option>
                                <option>Credit Certification</option>
                            </select>
                        </div>
                        <div>
                            <label>Content Hash (SHA-256)</label>
                            <input 
                                type="text" 
                                value={documentHash}
                                onChange={(e) => setDocumentHash(e.target.value)}
                                placeholder=" cryptographic commitment"
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                            {loading ? 'Confirming Transaction...' : 'Anchor Identity On-Chain'}
                        </button>
                    </form>
                </div>

                {/* Pending Requests Column */}
                <div className="glass" style={{ padding: '2.5rem' }}>
                    <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Search size={22} /> Pending Queue
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto' }}>
                        {pendingRequests.length === 0 ? (
                            <p style={{ opacity: 0.5, textAlign: 'center', padding: '3rem' }}>No pending verification requests in the queue.</p>
                        ) : (
                            pendingRequests.map((req, idx) => (
                                <div key={idx} className="glass" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>User: {req.user?.fullName || 'Anonymous'}</div>
                                    <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', marginBottom: '1rem', color: 'var(--primary)' }}>{req.userWallet.slice(0, 15)}...</div>
                                    <button 
                                        onClick={() => handleVerify(undefined, req.userWallet, req.documentHash)}
                                        className="btn btn-ghost" 
                                        style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem' }}
                                        disabled={loading}
                                    >
                                        Approve & Anchor
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '3rem', borderTop: '1px solid var(--border-glass)', paddingTop: '2rem' }}>
                <div className="card-grid">
                    <div className="glass" style={{ padding: '1.5rem', background: 'rgba(16,185,129,0.05)' }}>
                        <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Protocol Integrity</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Every verification creates a permanent, immutable audit log linked to your entity signature.</p>
                    </div>
                    <div className="glass" style={{ padding: '1.5rem', background: 'rgba(59,130,246,0.05)' }}>
                        <h4 style={{ color: 'var(--secondary)', marginBottom: '0.5rem' }}>ZK-Ready Anchoring</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Anchored hashes are used by the ZK-Prover to generate selective disclosure proofs for third parties.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifierDashboard;
