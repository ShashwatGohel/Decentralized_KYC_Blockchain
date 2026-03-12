import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBlockchain } from '../context/BlockchainContext';
import { useNavigate, Link } from 'react-router-dom';

const UserDashboard: React.FC = () => {
    const [applications, setApplications] = useState<any[]>([]);
    const [institutions, setInstitutions] = useState<any[]>([]);
    const [selectedEntity, setSelectedEntity] = useState('');
    const { token, user } = useAuth();
    const { account, contract, checkVerification, checkRegistration } = useBlockchain();

    const [isVerified, setIsVerified] = useState<boolean | null>(null);
    const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(false);
    const [requestCount, setRequestCount] = useState(0);
    const [assetCount, setAssetCount] = useState(0);

    const navigate = useNavigate();

    useEffect(() => {
        if (token) {
            fetchApplications();
            fetchInstitutions();
        }
    }, [token]);

    useEffect(() => {
        if (account) {
            checkVerification(account).then(setIsVerified);
            checkRegistration(account).then(setIsRegistered);
        }
        fetchDashboardStats();
    }, [account, contract]);

    const fetchApplications = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/verify/my-applications', {
                headers: { 'x-auth-token': token || '' }
            });
            const data = await res.json();
            if (res.ok) setApplications(data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchInstitutions = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/public/search?q= '); 
            const data = await res.json();
            if (res.ok) setInstitutions(data.filter((d: any) => d.role === 'entity'));
        } catch (err) {
            console.error(err);
        }
    };

    const requestVerification = async () => {
        if (!selectedEntity || !user?.vault?.length) return;
        try {
            const res = await fetch('http://localhost:5000/api/verify/apply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token || ''
                },
                body: JSON.stringify({
                    entityId: selectedEntity,
                    documentCIDs: user.vault.map(v => ({
                        fileName: v.fileName,
                        ipfsHash: v.ipfsHash,
                        fileHash: v.fileHash
                    }))
                })
            });
            if (res.ok) {
                fetchApplications();
                setSelectedEntity('');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleLinkWallet = async () => {
        if (!account || !token) return;
        try {
            const res = await fetch('http://localhost:5000/api/auth/link-wallet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ walletAddress: account })
            });
            if (res.ok) window.location.reload();
        } catch (err) {
            console.error(err);
        }
    };

    const handleOnChainRegister = async () => {
        if (!contract || !user) return;
        
        setLoading(true);
        try {
            let vaultDocs = user.vault || [];
            
            // If vault in context is empty, try to fetch from backend
            if (vaultDocs.length === 0) {
                const res = await fetch('http://localhost:5000/api/vault', {
                    headers: { 'x-auth-token': token || '' }
                });
                if (res.ok) {
                    vaultDocs = await res.json();
                }
            }

            if (vaultDocs.length === 0) {
                alert("No documents in vault to use for registration. Please add a document first.");
                return;
            }
            
            // Use the first document hash in vault as initial commitment
            const initialDoc = vaultDocs[0];
            const tx = await contract.registerUser(user.fullName || user.username, initialDoc.fileHash);
            await tx.wait();
            
            alert("Identity registered on blockchain successfully!");
            window.location.reload();
        } catch (err: any) {
            console.error(err);
            alert(`Registration Failed: ${err.reason || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const fetchDashboardStats = async () => {
        if (!token) return;
        try {
            // Fetch Incoming Requests count
            const reqRes = await fetch('http://localhost:5000/api/entity/user-requests', {
                headers: { 'x-auth-token': token }
            });
            const reqData = await reqRes.json();
            if (reqRes.ok) {
                setRequestCount(reqData.filter((r: any) => r.status === 'pending').length);
            }

            // Fetch Vault Assets count
            const vaultRes = await fetch('http://localhost:5000/api/vault', {
                headers: { 'x-auth-token': token }
            });
            const vaultData = await vaultRes.json();
            if (vaultRes.ok) {
                setAssetCount(vaultData.length);
            }
        } catch (err) {
            console.error('Stats fetch error:', err);
        }
    };

    return (
        <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header Section */}
            <header style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>Identity Hub</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
                        Connected as <strong style={{ color: '#fff' }}>{user?.username}</strong>
                    </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Network Address</div>
                    <div className="glass" style={{ padding: '0.6rem 1.2rem', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                        {account?.slice(0, 10)}...{account?.slice(-8)}
                    </div>
                </div>
            </header>

            {/* Status & Alerts */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '4rem' }}>
                <div className="glass" style={{ padding: '3rem', display: 'flex', alignItems: 'center', gap: '2rem', borderLeft: `6px solid ${isVerified ? 'var(--success)' : isRegistered ? '#FFA500' : 'var(--error)'}` }}>
                    <div style={{ fontSize: '3rem' }}>{isVerified ? '🛡️' : isRegistered ? '⏳' : '⚠️'}</div>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ margin: 0, fontSize: '1.8rem' }}>
                            {isVerified ? 'Identity Protocol Active' : isRegistered ? 'Identity Pending Verification' : 'Identity Not Registered'}
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                            {isVerified 
                                ? 'Your cryptographic hash is locked on the blockchain. You can now use DeKYC to onboard instantly with any entity.' 
                                : isRegistered 
                                ? 'Your identity is announced on the blockchain. Please wait for an institution to verify your vault documents.'
                                : 'Your identity hasn\'t been announced on-chain. You must register your identity before institutions can verify you.'}
                        </p>
                        
                        {!user?.walletAddress && account && (
                            <button onClick={handleLinkWallet} className="btn btn-primary" style={{ marginTop: '1.5rem', background: 'orange', border: 'none', color: '#000' }}>
                                Link Connected Wallet: {account.slice(0,6)}...
                            </button>
                        )}

                        {user?.walletAddress && account && !isRegistered && (
                            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                                <button onClick={handleOnChainRegister} disabled={loading || !assetCount} className="btn btn-primary">
                                    {loading ? 'Registering...' : assetCount ? 'Register Identity on Blockchain' : 'Add Document to Register'}
                                </button>
                                {!assetCount && <Link to="/verify" className="btn btn-outline">Go to Verify</Link>}
                            </div>
                        )}
                    </div>
                </div>

                <div className="glass" style={{ padding: '2.5rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>Vault Stats</div>
                    <div style={{ fontSize: '3.5rem', fontWeight: 900 }}>{assetCount}</div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--success)', marginTop: '0.5rem' }}>
                        Secured Assets in Private Vault
                    </p>
                    <Link to="/vault" style={{ 
                        display: 'block', 
                        marginTop: '1.5rem', 
                        fontSize: '0.85rem', 
                        color: '#fff', 
                        textDecoration: 'underline' 
                    }}>
                        Go to Vault &rarr;
                    </Link>
                </div>
            </div>

            {/* Government Verification Section */}
            <div className="glass" style={{ padding: '3rem', marginBottom: '4rem', background: 'rgba(0,102,255,0.05)', border: '1px solid rgba(0,102,255,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ color: '#0066ff' }}>Government Identity Staking</h2>
                        <p style={{ opacity: 0.8, maxWidth: '600px', marginTop: '0.5rem' }}>
                            Submit your primary documents to the Government node. Once verified, your cryptographic hash will be locked on the blockchain for instant reuse across all banks and exchanges.
                        </p>
                    </div>
                    {isVerified ? (
                        <div className="status-badge status-verified" style={{ padding: '1rem 2rem' }}>GOVERNMENT VERIFIED</div>
                    ) : (
                        <button 
                            className="btn btn-primary" 
                            style={{ background: '#0066ff', border: 'none' }}
                            onClick={() => navigate('/verify')}
                        >
                            Submit to Government
                        </button>
                    )}
                </div>
            </div>

            {/* Verification Request & Activity Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '4rem' }}>
                <div className="glass" style={{ padding: '2.5rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', borderLeft: '4px solid #fff', paddingLeft: '1rem' }}>Request Permanent Proof</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
                        Select a registered institution to manually verify your vault documents and commit your identity to the blockchain.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                        <select 
                            value={selectedEntity} 
                            onChange={(e) => setSelectedEntity(e.target.value)}
                            style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', color: '#fff', borderRadius: '8px' }}
                        >
                            <option value="">-- Select Institution (Bank/Exchange) --</option>
                            {institutions.map(inst => (
                                <option key={inst.walletAddress} value={inst.walletAddress}>{inst.name} ({inst.walletAddress.slice(0,6)}...)</option>
                            ))}
                        </select>
                        <button 
                            onClick={requestVerification} 
                            disabled={!selectedEntity || !assetCount} 
                            className="btn btn-primary"
                        >
                            Submit Verification Request
                        </button>
                    </div>
                </div>

                <div className="glass" style={{ padding: '2.5rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', borderLeft: '4px solid #fff', paddingLeft: '1rem' }}>On-Chain Verification Activity</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
                        {applications.length === 0 ? (
                            <p style={{ opacity: 0.5, textAlign: 'center', padding: '2rem' }}>No verification requests found.</p>
                        ) : (
                            applications.map(app => (
                                <div key={app._id} className="glass" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{app.entity?.entityName || 'Institution'}</div>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{new Date(app.createdAt).toLocaleDateString()}</div>
                                    </div>
                                    <div className="status-badge" style={{ 
                                        backgroundColor: app.status === 'approved' ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.05)',
                                        color: app.status === 'approved' ? 'var(--success)' : '#fff',
                                        fontSize: '0.7rem'
                                    }}>
                                        {app.status.toUpperCase()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Action Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
                <div className="glass hover-glass" style={{ padding: '2.5rem', cursor: 'pointer' }} onClick={() => navigate('/verify')}>
                    <div style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>📄</div>
                    <h3>Verify Identity</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        Upload your legal documents, generate local hashes, and submit your identity commitment to the protocol.
                    </p>
                </div>

                <div className="glass hover-glass" style={{ padding: '2.5rem', cursor: 'pointer' }} onClick={() => navigate('/vault')}>
                    <div style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>🔐</div>
                    <h3>Secure Vault</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        Access your stored cryptographic certificates, manage shared permissions, and approve data requests from banks.
                    </p>
                    <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--success)' }}>
                        {assetCount} Assets Secured
                    </div>
                </div>

                <div className="glass" style={{ padding: '2.5rem', opacity: 0.6 }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>📊</div>
                    <h3>Ecosystem Activity</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        View the immutable audit trail of which entity types have checked your identity status on-chain. (Coming Soon)
                    </p>
                </div>
            </div>

            <style>{`
                .hover-glass:hover {
                    background: rgba(255, 255, 255, 0.05);
                    transform: translateY(-5px);
                }
            `}</style>
        </div>
    );
};

export default UserDashboard;
