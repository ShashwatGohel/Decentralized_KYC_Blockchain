import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBlockchain } from '../context/BlockchainContext';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Hourglass, AlertTriangle, FileText, Lock, BarChart3, Building2, CheckCircle, Activity } from 'lucide-react';

const UserDashboard: React.FC = () => {
    const [applications, setApplications] = useState<any[]>([]);
    const [institutions, setInstitutions] = useState<any[]>([]);
    const [selectedEntity, setSelectedEntity] = useState('');
    const { token, user } = useAuth();
    const { account, kycContract } = useBlockchain();
    const [accessRequests, setAccessRequests] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);

    const [isVerified, setIsVerified] = useState<boolean>(false);
    const [isRegistered, setIsRegistered] = useState<boolean>(false);
    const [loading, setLoading] = useState(false);
    const [assetCount, setAssetCount] = useState(0);

    const navigate = useNavigate();

    useEffect(() => {
        if (token) {
            fetchApplications();
            fetchInstitutions();
            fetchDashboardStats();
        }
    }, [token]);

    useEffect(() => {
        if (account && kycContract) {
            checkOnChainStatus();
        }
    }, [account, kycContract]);

    const checkOnChainStatus = async () => {
        if (!account || !kycContract) return;
        try {
            const onChainUser = await kycContract.users(account);
            setIsRegistered(onChainUser.isRegistered);
            
            const govHistory = await kycContract.getVerificationHistory(account);
            setHistory(govHistory);
            setIsVerified(govHistory.length > 0);
        } catch (err) {
            console.error("Error checking on-chain status:", err);
        }
    };

    const fetchApplications = async () => {
        try {
            const res = await fetch('http://localhost:5050/api/verify/my-applications', {
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
            const res = await fetch('http://localhost:5050/api/public/search?q= '); 
            const data = await res.json();
            if (res.ok) setInstitutions(data.filter((d: any) => d.role === 'entity'));
        } catch (err) {
            console.error(err);
        }
    };

    const fetchDashboardStats = async () => {
        if (!token) return;
        try {
            const reqRes = await fetch('http://localhost:5050/api/entity/user-requests', {
                headers: { 'x-auth-token': token }
            });
            const reqData = await reqRes.json();
            if (reqRes.ok) setAccessRequests(reqData);

            const vaultRes = await fetch('http://localhost:5050/api/vault', {
                headers: { 'x-auth-token': token }
            });
            const vaultData = await vaultRes.json();
            if (vaultRes.ok) setAssetCount(vaultData.length);
        } catch (err) {
            console.error('Stats fetch error:', err);
        }
    };

    const handleOnChainRegister = async () => {
        if (!kycContract || !user) return;
        setLoading(true);
        try {
            const tx = await kycContract.registerUser(user.fullName, "initial_registration");
            await tx.wait();
            setIsRegistered(true);
            alert("Identity registered on-chain!");
        } catch (err: any) {
            console.error(err);
            alert(`Registration Failed: ${err.reason || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const requestVerification = async () => {
        if (!selectedEntity || !kycContract) return;
        try {
            setLoading(true);
            const tx = await kycContract.grantAccess(selectedEntity);
            await tx.wait();
            alert("Digital Consent Granted! The institution can now verify your documents.");
            fetchDashboardStats();
        } catch (err: any) {
            alert(`Error: ${err.reason || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header Section */}
            <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="gradient-text" style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>Identity Hub</h1>
                    <p className="sub-heading">Welcome back, <strong>{user?.fullName || user?.username}</strong></p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 700 }}>Network Identity</div>
                    <div className="glass" style={{ padding: '0.6rem 1.2rem', fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--primary)' }}>
                        {account?.slice(0, 10)}...{account?.slice(-8)}
                    </div>
                </div>
            </header>

            {/* Status & Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
                <div className="glass" style={{ padding: '2.5rem', display: 'flex', alignItems: 'center', gap: '2rem', borderLeft: `6px solid ${isVerified ? 'var(--primary)' : isRegistered ? 'var(--warning)' : 'var(--error)'}` }}>
                    <div style={{ display: 'flex' }}>
                        {isVerified ? <Shield size={64} color="var(--primary)"/> : isRegistered ? <Hourglass size={64} color="var(--warning)"/> : <AlertTriangle size={64} color="var(--error)"/>}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
                            {isVerified ? 'Identity Fully Verified' : isRegistered ? 'Awaiting Verification' : 'Identity Unregistered'}
                        </h2>
                        <p style={{ color: 'var(--text-dim)' }}>
                            {isVerified 
                                ? 'Your anchor hash is live on-chain. You can now use selective disclosure for any institution.' 
                                : isRegistered 
                                ? 'Your identity is announced. Wait for the Government or an Entity to verify your documents.'
                                : 'Start by announcing your identity on the blockchain to enable trustless verification.'}
                        </p>
                        
                        {!isRegistered && account && (
                          <button onClick={handleOnChainRegister} disabled={loading} className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
                              {loading ? 'Processing...' : 'Register Identity on Blockchain'}
                          </button>
                        )}
                    </div>
                </div>

                <div className="glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 700 }}>Vault Assets</div>
                    <div style={{ fontSize: '4rem', fontWeight: 800, color: '#fff' }}>{assetCount}</div>
                    <p style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 600 }}>Documents Secured</p>
                    <Link to="/vault" className="btn btn-ghost" style={{ marginTop: '1rem', fontSize: '0.8rem' }}>Manage Vault</Link>
                </div>
            </div>

            {/* Action Section */}
            <div className="feature-grid" style={{ marginBottom: '3rem' }}>
                <div className="glass glass-hover" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <CheckCircle size={24} color="var(--primary)"/> Grant Access
                    </h3>
                    <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                        Authorize a bank or demat account to verify your on-chain status.
                    </p>
                    <select 
                        value={selectedEntity} 
                        onChange={(e) => setSelectedEntity(e.target.value)}
                        style={{ marginBottom: '1rem' }}
                    >
                        <option value="">Select Entity</option>
                        {institutions.map(inst => (
                            <option key={inst.walletAddress} value={inst.walletAddress}>{inst.entityName || inst.fullName}</option>
                        ))}
                    </select>
                    <button className="btn btn-primary" style={{ width: '100%' }} onClick={requestVerification} disabled={!selectedEntity || loading}>
                        Authorize Entity
                    </button>
                </div>

                <div className="glass" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Activity size={24} color="var(--secondary)"/> On-Chain History
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '180px', overflowY: 'auto' }}>
                        {history.length === 0 ? (
                            <p style={{ textAlign: 'center', opacity: 0.5, padding: '1rem' }}>No verification events recorded.</p>
                        ) : (
                            history.map((log, idx) => (
                                <div key={idx} style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-glass)', fontSize: '0.85rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontWeight: 600 }}>{log.entityName}</span>
                                        <span style={{ color: 'var(--primary)' }}>Verified</span>
                                    </div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                        {new Date(Number(log.timestamp) * 1000).toLocaleString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="glass glass-hover" style={{ padding: '2rem', cursor: 'pointer' }} onClick={() => navigate('/verify')}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Lock size={24} color="var(--warning)"/> ZK Proofs
                    </h3>
                    <p style={{ color: 'var(--text-dim)', marginBottom: '1rem', fontSize: '0.95rem' }}>
                        Generate a zero-knowledge proof for age or income eligibility.
                    </p>
                    <div className="badge badge-warning">Zero-Knowledge Secure</div>
                </div>
            </div>

            {/* Access Management */}
            <div className="glass" style={{ padding: '2.5rem' }}>
                <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Building2 size={24} /> Access Permissions
                </h3>
                <div className="card-grid">
                    {accessRequests.map((req: any) => (
                        <div key={req._id} className="glass" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{req.entityId?.entityName || 'Institution'}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>Type: {req.docType}</div>
                            <div className={`badge ${req.status === 'approved' ? 'badge-success' : 'badge-warning'}`}>
                                {req.status === 'approved' ? 'ACCESS GRANTED' : 'PENDING'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
