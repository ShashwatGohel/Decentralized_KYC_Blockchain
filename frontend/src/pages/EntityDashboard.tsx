import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBlockchain } from '../context/BlockchainContext';
import { Search, FolderLock, ShieldAlert, X, Shield, FileText, CheckCircle, RefreshCw } from 'lucide-react';

const EntityDashboard: React.FC = () => {
    const { token, user: authUser } = useAuth();
    const { isEntity, kycContract } = useBlockchain();
    const [users, setUsers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [userDetails, setUserDetails] = useState<any>(null);
    const [banReason, setBanReason] = useState('');
    const [showBanModal, setShowBanModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [auditStatus, setAuditStatus] = useState<string>('');
    const [checking, setChecking] = useState(false);
    const [verifiedProofs, setVerifiedProofs] = useState<Record<string, boolean>>({});
    const [pastedHash, setPastedHash] = useState('');
    const [hashMatchStatus, setHashMatchStatus] = useState<string>('');

    const [discoveryResults, setDiscoveryResults] = useState<any[]>([]);

    useEffect(() => {
        if (isEntity && token) {
            fetchUsers();
        }
    }, [isEntity, token]);

    const fetchUsers = async () => {
        try {
            const res = await fetch('http://localhost:5050/api/entity/users', {
                headers: { 'x-auth-token': token || '' }
            });
            if (res.ok) setUsers(await res.json());
        } catch (e) {}
    };

    const handleGlobalSearch = async () => {
        if (!searchTerm || searchTerm.length < 2) return;
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5050/api/entity/search-users?query=${searchTerm}`, {
                headers: { 'x-auth-token': token || '' }
            });
            if (res.ok) {
                const data = await res.json();
                // Filter out users already in our 'users' list
                const newUsers = data.filter((gu: any) => !users.some(u => u.walletAddress === gu.walletAddress));
                setDiscoveryResults(newUsers);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserDetails = async (userId: string) => {
        setLoading(true);
        try {
            const [userRes, accessRes, proofRes] = await Promise.all([
                fetch(`http://localhost:5050/api/entity/users/${userId}`, { headers: { 'x-auth-token': token || '' }}),
                fetch(`http://localhost:5050/api/entity/users/${userId}/access`, { headers: { 'x-auth-token': token || '' }}),
                fetch(`http://localhost:5050/api/entity/users/${userId}/proofs`, { headers: { 'x-auth-token': token || '' }})
            ]);
            
            if (userRes.ok) {
                const userData = await userRes.json();
                const accessData = accessRes.ok ? await accessRes.json() : [];
                const proofData = proofRes.ok ? await proofRes.json() : [];
                
                setUserDetails({ ...userData, access: accessData, proofs: proofData });
                setSelectedUser(userData);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestAccess = async (userWallet: string) => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5050/api/entity/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
                body: JSON.stringify({ userWallet, docType: 'Identity Verification' })
            });
            if (res.ok) {
                alert('Access request sent to user!');
                fetchUsers();
                setDiscoveryResults([]);
                setSearchTerm('');
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to send request');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleBanSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5050/api/ban/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
                body: JSON.stringify({
                    target_user_id: selectedUser._id,
                    target_wallet: selectedUser.walletAddress,
                    reason: banReason,
                    entity_id: authUser?.id
                })
            });
            if (res.ok) {
                alert('Ban vote initiated successfully');
                setShowBanModal(false);
                setBanReason('');
            } else {
                const data = await res.json();
                alert('Failed: ' + data.message);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDocumentCheck = async () => {
        if (!kycContract || !selectedUser?.walletAddress) return;
        setChecking(true);
        setAuditStatus('');
        try {
            // Check the blockchain mapping for the Identity Certificate
            const hash = await kycContract.verifiedDocHashes(selectedUser.walletAddress, "Identity Certificate");
            if (hash && hash.length > 0) {
                setAuditStatus("Valid & Vouched");
            } else {
                setAuditStatus("Unverified / No Anchor");
            }
        } catch (e) {
            console.error("Audit Error:", e);
            setAuditStatus("Error querying ledger");
        } finally {
            setChecking(false);
        }
    };

    const handleVerifySubmittedHash = async (docType: string) => {
        if (!kycContract || !selectedUser?.walletAddress || !pastedHash) return;
        setChecking(true);
        setHashMatchStatus('');
        try {
            // Call the smart contract function to match hashes
            const result = await kycContract.checkDocumentHash(
                selectedUser.walletAddress,
                docType,
                pastedHash
            );
            
            // If the transaction/call didn't revert, it means it returned true
            setHashMatchStatus("MATCH_SUCCESS");
            alert("SUCCESS: Document Hash matches the Government Anchor on the blockchain!");
        } catch (e: any) {
            console.error("Match Error:", e);
            setHashMatchStatus("MATCH_FAILED");
            alert("FAILURE: Hash mismatch! The document provided does not match the official government record.");
        } finally {
            setChecking(false);
        }
    };

    const handleVerifyZKProof = async (proofRecord: any) => {
        if (!kycContract || !selectedUser?.walletAddress) return;
        setChecking(true);
        try {
            // Extract proof components from saved data
            const pA = proofRecord.proof.pi_a.slice(0, 2);
            const pB = [
                proofRecord.proof.pi_b[0].slice(0, 2).reverse(),
                proofRecord.proof.pi_b[1].slice(0, 2).reverse()
            ];
            const pC = proofRecord.proof.pi_c.slice(0, 2);
            const pubSignals = proofRecord.publicSignals;

            // Execute On-Chain Verification
            const tx = await kycContract.verifySelectiveDisclosure(
                selectedUser.walletAddress,
                proofRecord.statement,
                pA, pB, pC, pubSignals
            );
            await tx.wait();
            
            alert("ZK Proof Verified On-Chain! Zero-Knowledge Truth Confirmed. You may now formally accept or reject it.");
            setVerifiedProofs(prev => ({ ...prev, [proofRecord._id]: true }));
        } catch (e: any) {
            alert("Proof Rejected: " + (e.reason || e.message));
        } finally {
            setChecking(false);
        }
    };

    const handleDecideProof = async (proofId: string, decision: 'accepted' | 'rejected') => {
        try {
            const res = await fetch(`http://localhost:5050/api/proof/decide`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
                body: JSON.stringify({ proofId, decision })
            });
            if (res.ok) {
                alert(`Proof officially marked as ${decision.toUpperCase()}.`);
                fetchUserDetails(selectedUser._id);
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to update decision');
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (!isEntity) {
        return (
            <div className="fade-in" style={{ padding: '6rem 3rem', textAlign: 'center', marginTop: '4rem' }}>
                <div style={{ marginBottom: '1.5rem', color: 'var(--error)' }}><ShieldAlert size={64} /></div>
                <h2 style={{ fontSize: '2.5rem' }}>Access Denied</h2>
                <p style={{ color: 'var(--text-secondary)' }}>This portal is strictly for registered institutions.</p>
            </div>
        );
    }

    const filteredUsers = users.filter(u => 
        u.walletAddress?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Institution Portal</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage user portfolios and data access.</p>
                </div>
                <div style={{ position: 'relative', width: '400px', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input 
                            type="text" 
                            placeholder="Type 'Shashwat' and wait..." 
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                if (e.target.value.length > 2) handleGlobalSearch();
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleGlobalSearch()}
                            style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', borderRadius: '8px', color: '#fff' }}
                        />
                    </div>
                    <button onClick={handleGlobalSearch} className="btn btn-primary" style={{ padding: '0.8rem 1.2rem' }}>
                        {loading ? <RefreshCw size={18} className="spin" /> : 'Search'}
                    </button>
                </div>
            </div>

            {discoveryResults.length > 0 ? (
                <div style={{ marginBottom: '3rem', padding: '1.5rem', background: 'rgba(59,130,246,0.05)', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.1)' }}>
                    <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Shield size={20} /> Discovery: Registered Users on Network
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
                        {discoveryResults.map(u => (
                            <div key={u._id} className="glass" style={{ padding: '1.5rem', border: '1px solid var(--accent)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div style={{ background: 'rgba(59,130,246,0.1)', padding: '0.8rem', borderRadius: '10px', color: 'var(--accent)' }}>
                                        <Search size={28} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{u.fullName || u.username}</h3>
                                        <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                            {u.walletAddress}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => handleRequestAccess(u.walletAddress)} className="btn btn-primary" style={{ width: '100%' }}>
                                    {loading ? 'Processing...' : 'Request Data Access'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : searchTerm.length > 2 && !loading && filteredUsers.length === 0 && (
                <div style={{ marginBottom: '3rem', padding: '2rem', textAlign: 'center', opacity: 0.6 }}>
                    <p>No new users found for "{searchTerm}". Make sure the name is correct.</p>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
                {filteredUsers.map(u => (
                    <div key={u._id} className="glass hover-glass" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ background: 'rgba(59,130,246,0.1)', padding: '0.8rem', borderRadius: '10px', color: 'var(--accent)' }}>
                                <FolderLock size={28} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{u.fullName || 'Anonymous'}</h3>
                                <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                                    {u.walletAddress ? `${u.walletAddress.substring(0,8)}...${u.walletAddress.substring(u.walletAddress.length-6)}` : 'No Wallet'}
                                </div>
                            </div>
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Status</span>
                                <span style={{ color: 'var(--success)', fontWeight: 600 }}>Active Protocols</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Granted Access</span>
                                <span>KYC Standard</span>
                            </div>
                        </div>
                        <button onClick={() => fetchUserDetails(u._id)} className="btn btn-outline" style={{ width: '100%' }}>
                            View Details
                        </button>
                    </div>
                ))}
            </div>

            {/* View Details Modal */}
            {selectedUser && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '0' }}>
                        <div style={{ padding: '2rem', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <Shield size={28} color="var(--accent)" /> Identity Portfolio
                            </h2>
                            <button onClick={() => { setSelectedUser(null); setShowBanModal(false); setAuditStatus(''); }} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        
                        <div style={{ padding: '2rem' }}>
                            {loading ? <p>Loading portfolio data...</p> : userDetails && (
                                <>
                                    <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>FULL NAME</div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{userDetails.fullName}</div>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>WALLET TRACE</div>
                                            <div style={{ fontSize: '1.2rem', fontFamily: 'monospace' }}>{userDetails.walletAddress?.substring(0,10)}...</div>
                                        </div>
                                    </div>

                                    {/* ON-CHAIN AUDIT SECTION */}
                                    <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid var(--success)', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem' }}>
                                        <h3 style={{ fontSize: '1.1rem', color: 'var(--success)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Shield size={20} /> Decentralized Ledger Audit
                                        </h3>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <button 
                                                onClick={handleDocumentCheck} 
                                                disabled={checking}
                                                className="btn btn-primary" 
                                                style={{ background: 'var(--success)', color: '#000', padding: '0.5rem 1rem' }}
                                            >
                                                {checking ? 'Scanning Ledger...' : 'Perform Document Check'}
                                            </button>
                                            
                                            {auditStatus && (
                                                <span style={{ 
                                                    padding: '0.5rem 1rem', 
                                                    borderRadius: '6px', 
                                                    background: auditStatus === 'Valid & Vouched' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                    color: auditStatus === 'Valid & Vouched' ? 'var(--success)' : 'var(--error)',
                                                    fontWeight: 'bold'
                                                }}>
                                                    Status: {auditStatus}
                                                </span>
                                            )}
                                        </div>

                                        <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(16, 185, 129, 0.2)', paddingTop: '1.5rem' }}>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>
                                                <strong>Verify User-Provided Hash:</strong> Paste the hash shared by the user to match it against the on-chain anchor.
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <input 
                                                    type="text" 
                                                    value={pastedHash}
                                                    onChange={(e) => setPastedHash(e.target.value)}
                                                    placeholder="Paste User's Hash (0x...)"
                                                    style={{ flex: 1, padding: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--card-border)', borderRadius: '6px', fontSize: '0.8rem' }}
                                                />
                                                <button 
                                                    onClick={() => handleVerifySubmittedHash("Identity Certificate")}
                                                    disabled={checking || !pastedHash}
                                                    className="btn btn-outline"
                                                    style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                                                >
                                                    Verify Match
                                                </button>
                                            </div>
                                            {hashMatchStatus && (
                                                <div style={{ 
                                                    marginTop: '1rem', 
                                                    padding: '0.8rem', 
                                                    borderRadius: '6px', 
                                                    background: hashMatchStatus === 'MATCH_SUCCESS' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                    border: `1px solid ${hashMatchStatus === 'MATCH_SUCCESS' ? 'var(--success)' : 'var(--error)'}`,
                                                    color: hashMatchStatus === 'MATCH_SUCCESS' ? 'var(--success)' : 'var(--error)',
                                                    fontSize: '0.85rem',
                                                    textAlign: 'center',
                                                    fontWeight: 600
                                                }}>
                                                    {hashMatchStatus === 'MATCH_SUCCESS' ? '✓ CRYPTOGRAPHIC MATCH CONFIRMED' : '✗ HASH MISMATCH DETECTED'}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <h3 style={{ fontSize: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Active Data Requests</h3>
                                    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '1rem', marginBottom: '2rem' }}>
                                        {userDetails.access?.length ? userDetails.access.map((acc: any) => (
                                            <div key={acc._id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                                <span>{acc.docType}</span>
                                                <span style={{ color: acc.status === 'approved' ? 'var(--success)' : 'var(--warning)' }}>{acc.status}</span>
                                            </div>
                                        )) : <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No shared documents.</p>}
                                    </div>

                                    <h3 style={{ fontSize: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>ZK Proofs Available</h3>
                                    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '1rem', marginBottom: '2rem' }}>
                                        {userDetails.proofs?.length ? userDetails.proofs.map((proof: any) => (
                                            <div key={proof._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', fontSize: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <CheckCircle size={16} color="var(--success)" />
                                                        <span style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{proof.statement.replace('_', ' ')}</span>
                                                        <span className={`badge ${proof.status === 'accepted' ? 'badge-success' : proof.status === 'rejected' ? 'badge-error' : 'badge-warning'}`}>
                                                            {proof.status ? proof.status.toUpperCase() : 'PENDING'}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    {proof.status === 'pending' && !verifiedProofs[proof._id] && (
                                                        <button 
                                                            onClick={() => handleVerifyZKProof(proof)}
                                                            className="btn btn-primary"
                                                            style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}
                                                            disabled={checking}
                                                        >
                                                            Verify On-Chain Math
                                                        </button>
                                                    )}

                                                    {proof.status === 'pending' && verifiedProofs[proof._id] && (
                                                        <>
                                                            <button 
                                                                onClick={() => handleDecideProof(proof._id, 'accepted')}
                                                                className="btn btn-primary"
                                                                style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', background: 'var(--success)' }}
                                                            >
                                                                Accept
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDecideProof(proof._id, 'rejected')}
                                                                className="btn btn-outline"
                                                                style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', borderColor: 'var(--error)', color: 'var(--error)' }}
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )) : <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No localized ZK proofs found.</p>}
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--card-border)', paddingTop: '1.5rem', gap: '1rem' }}>
                                        <button onClick={() => setShowBanModal(true)} className="btn btn-outline" style={{ borderColor: 'var(--error)', color: 'var(--error)' }}>
                                            Initiate Ban Vote
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Ban Modal Overlay */}
                        {showBanModal && (
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.95)', padding: '3rem', zIndex: 110, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <h3 style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', marginBottom: '1rem' }}>
                                    <ShieldAlert size={24} /> Flag User for Consensus Ban
                                </h3>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                                    This will create a multi-sig proposal. If approved by the network quorum, this identity will be permanently revoked from the Radix ledger.
                                </p>
                                <form onSubmit={handleBanSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div>
                                        <label>Reason for Ban</label>
                                        <textarea 
                                            value={banReason}
                                            onChange={e => setBanReason(e.target.value)}
                                            required
                                            rows={4}
                                            placeholder="E.g., Fraudulent documents detected in recent audit..."
                                            style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(239,68,68,0.3)', color: '#fff', borderRadius: '8px', marginTop: '0.5rem' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                        <button type="button" onClick={() => setShowBanModal(false)} className="btn btn-outline">Cancel</button>
                                        <button type="submit" className="btn btn-primary" style={{ background: 'var(--error)' }}>Submit Proposal</button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EntityDashboard;
