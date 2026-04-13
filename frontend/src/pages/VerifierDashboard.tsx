import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBlockchain } from '../context/BlockchainContext';
import { Shield, AlertTriangle, CheckCircle, Search, UserCheck } from 'lucide-react';

const VerifierDashboard: React.FC = () => {
    const { isGovernment, isVerifier, kycContract, account } = useBlockchain();
    const { token, user } = useAuth();
    const [userAddress, setUserAddress] = useState('');
    const [docType, setDocType] = useState('Identity Certificate');
    const [documentHash, setDocumentHash] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | '', msg: string }>({ type: '', msg: '' });
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    
    // Discovery States
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (token && (isGovernment || isVerifier || user?.role === 'government' || user?.role === 'bank' || user?.role === 'verifier')) {
            fetchPendingRequests();
        }
    }, [token, isGovernment, isVerifier, user?.role]);

    const fetchPendingRequests = async () => {
        try {
            const res = await fetch('http://localhost:5050/api/verify/incoming', {
                headers: { 'x-auth-token': token || '' }
            });
            const data = await res.json();
            if (res.ok) setPendingRequests(data);
        } catch (err) {}
    };

    const handleSearch = async (val: string) => {
        setSearchTerm(val);
        if (val.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const res = await fetch(`http://localhost:5050/api/public/search?q=${val}`);
            const data = await res.json();
            if (res.ok) {
                // Only show 'user' role for verification engine
                setSearchResults(data.filter((u: any) => u.role === 'user'));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSearching(false);
        }
    };

    const selectUser = async (user: any) => {
        setUserAddress(user.walletAddress);
        setSearchTerm('');
        setSearchResults([]);
        
        // Fetch detailed vault data for this user
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5050/api/verify/user-details/${user.walletAddress}`, {
                headers: { 'x-auth-token': token || '' }
            });
            const data = await res.json();
            if (res.ok && data.latestHash) {
                setDocumentHash(data.latestHash);
                setStatus({ type: 'success', msg: `Protocol Match: Found ${data.latestFileName} in ${user.name}'s vault.` });
            } else if (res.ok && !data.latestHash) {
                setDocumentHash('');
                setStatus({ type: 'error', msg: `${user.name} has no uploaded documents in their vault yet.` });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
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
            
            await fetch('http://localhost:5050/api/kyc/verify-sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
                body: JSON.stringify({ userWallet: address, docHash: hash })
            });

            fetchPendingRequests();
        } catch (err: any) {
            console.error(err);
            if (err.code === 'ACTION_REJECTED' || err.message.includes('rejected')) {
                setStatus({ type: 'error', msg: 'Transaction was rejected in MetaMask.' });
            } else {
                setStatus({ type: 'error', msg: `Verification Failed: ${err.reason || err.message}` });
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isGovernment && !isVerifier && user?.role !== 'government' && user?.role !== 'bank' && user?.role !== 'verifier') {
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
                    <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <UserCheck size={24} /> Direct On-Chain Verification
                    </h3>
                    
                    {/* Discovery Search Bar */}
                    <div style={{ position: 'relative', marginBottom: '2.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.02)' }}>
                            <Search size={18} style={{ opacity: 0.5, marginRight: '0.75rem' }} />
                            <input 
                                type="text"
                                placeholder="Search Protocol Registry by Name..."
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                style={{ border: 'none', padding: '0.5rem 0', boxShadow: 'none' }}
                            />
                        </div>
                        {searchResults.length > 0 && (
                            <div className="glass" style={{ position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 10, padding: '0.5rem', maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--primary-glow)' }}>
                                {searchResults.map((u, i) => (
                                    <div 
                                        key={i} 
                                        onClick={() => selectUser(u)}
                                        style={{ padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', transition: '0.2s', borderBottom: i !== searchResults.length - 1 ? '1px solid var(--border-glass)' : 'none' }}
                                        className="search-result-item"
                                    >
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.name}</div>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.5, fontFamily: 'monospace' }}>{u.walletAddress}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {isSearching && <div style={{ position: 'absolute', top: '50%', right: '1rem', transform: 'translateY(-50%)', fontSize: '0.8rem', opacity: 0.5 }}>Syncing...</div>}
                    </div>

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
