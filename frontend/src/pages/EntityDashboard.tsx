import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBlockchain } from '../context/BlockchainContext';

interface DataRequest {
    _id: string;
    userWallet: string;
    docType: string;
    status: string;
    sharedHash?: string;
    sharedIpfs?: string;
    requestedAt: string;
    isUserVerifiedOnChain?: boolean;
}

const EntityDashboard: React.FC = () => {
    const [incomingApps, setIncomingApps] = useState<any[]>([]);
    const [selectedApp, setSelectedApp] = useState<any>(null);
    const { user, token } = useAuth();
    const { account, contract } = useBlockchain();

    const [userWallet, setUserWallet] = useState('');
    const [docType, setDocType] = useState('Aadhar Card');
    const [requests, setRequests] = useState<DataRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);

    const [onChainActive, setOnChainActive] = useState<boolean | null>(null);

    useEffect(() => {
        if (token) {
            fetchIncomingApps();
            fetchMyRequests();
            checkOnChainStatus();
        }
    }, [token, account, contract]);

    const checkOnChainStatus = async () => {
        if (!contract || !account) {
            console.log("CheckOnChain: Missing contract or account", { contract: !!contract, account });
            return;
        }
        try {
            console.log("CheckOnChain: Querying blockchain for", account);
            const entity = await contract.entityRegistry(account);
            console.log("CheckOnChain: Result for", account, "isActive:", entity.isActive);
            setOnChainActive(entity.isActive);
        } catch (e) {
            console.error("CheckOnChain: Error", e);
        }
    };

    const fetchIncomingApps = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/verify/incoming', {
                headers: { 'x-auth-token': token || '' }
            });
            const data = await res.json();
            if (res.ok) setIncomingApps(data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchMyRequests = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/entity/my-requests', {
                headers: { 'x-auth-token': token || '' }
            });
            const data = await res.json();
            if (res.ok && contract) {
                // Enhance requests with on-chain verification status
                const enhancedRequests = await Promise.all(data.map(async (req: any) => {
                    try {
                        const verified = await contract.checkVerification(req.userWallet);
                        return { ...req, isUserVerifiedOnChain: verified };
                    } catch (e) {
                        return req;
                    }
                }));
                setRequests(enhancedRequests);
            } else if (res.ok) {
                setRequests(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const verifyOnChain = async (app: any) => {
        if (!contract) return;
        setLoading(true);
        try {
            const doc = app.documentCIDs[0];
            const hashToVerify = doc?.fileHash;
            // Extract document type from fileName format "Aadhar Card : 0xhash..."
            const docType = doc?.fileName?.split(' : ')[0]?.trim() || doc?.fileName || 'Document';
            if (!hashToVerify) throw new Error('No document hash found');

            console.log(`Anchoring hash for: user=${app.user.walletAddress}, docType=${docType}`);
            const tx = await contract.institutionalVerify(app.user.walletAddress, hashToVerify, docType);
            await tx.wait();

            const res = await fetch('http://localhost:5000/api/verify/update-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token || ''
                },
                body: JSON.stringify({
                    requestId: app._id,
                    status: 'approved'
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to update application status on server');
            }

            fetchIncomingApps();
            setSelectedApp(null);
        } catch (err: any) {
            console.error(err);
            alert(`Verification failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyUserBlockchain = async (req: DataRequest) => {
        if (!contract || !req.sharedHash || !user) return;
        
        setLoading(true);
        try {
            // 1. Get current entity type from profile
            const entityType = user.onChainType || 0;
            // Derive doc type from the request's doc type field
            const docType = req.docType || 'Aadhar Card';

            // 2. Call checkDocumentHash on blockchain
            console.log("--- CALLING CHECK DOCUMENT HASH ---");
            console.log("Wallet:", req.userWallet);
            console.log("Submitted Hash:", req.sharedHash);
            console.log("Doc Type:", docType);
            console.log("Entity Type:", entityType);
            
            // Static call first to preview revert reason before spending gas
            try {
                await contract.checkDocumentHash.staticCall(req.userWallet, req.sharedHash, docType, entityType);
                console.log("Static call succeeded. Hash matches!");
            } catch (staticErr: any) {
                const reason = staticErr?.reason || staticErr?.message || 'Hash mismatch';
                console.error("Static call failed:", reason);
                throw new Error(`Verification failed: ${reason}`);
            }

            const tx = await contract.checkDocumentHash(req.userWallet, req.sharedHash, docType, entityType);
            console.log("Transaction sent:", tx.hash);
            await tx.wait();
            console.log("Transaction confirmed!");
            
            // 3. Update Backend Status
            const res = await fetch('http://localhost:5000/api/entity/verify-request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token || ''
                },
                body: JSON.stringify({ requestId: req._id })
            });
            
            if (res.ok) {
                alert('✅ User Verification Successful! Hash matched on-chain record.');
                fetchMyRequests();
            } else {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to update request status on server');
            }
        } catch (err: any) {
            console.error(err);
            alert(`❌ Verification Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const commitVerificationOnChain = async (req: DataRequest) => {
        if (!contract || !req.sharedHash) return;
        
        setLoading(true);
        try {
            const docType = req.docType || 'Aadhar Card';
            console.log(`Committing hash on-chain: docType=${docType}, user=${req.userWallet}`);
            
            // 1. Write to Blockchain (anchor hash)
            const tx = await contract.institutionalVerify(req.userWallet, req.sharedHash, docType);
            await tx.wait();
            
            // 2. Update Backend Status
            const res = await fetch('http://localhost:5000/api/entity/verify-request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token || ''
                },
                body: JSON.stringify({ requestId: req._id })
            });
            
            if (res.ok) {
                alert('✅ Verification committed to blockchain!');
                fetchMyRequests();
            } else {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to update request status on server');
            }
        } catch (err: any) {
            console.error(err);
            alert(`❌ Protocol Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const res = await fetch(`http://localhost:5000/api/entity/search-users?query=${query}`, {
                headers: { 'x-auth-token': token || '' }
            });
            const data = await res.json();
            if (res.ok) setSearchResults(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSearching(false);
        }
    };

    const selectSearchUser = (u: any) => {
        setUserWallet(u.walletAddress);
        setSelectedUser(u);
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleCreateRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const res = await fetch('http://localhost:5000/api/entity/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token || ''
                },
                body: JSON.stringify({ userWallet, docType })
            });

            if (res.ok) {
                setMessage('Request sent successfully!');
                setUserWallet('');
                setSelectedUser(null);
                fetchMyRequests();
            } else {
                const data = await res.json();
                setMessage(`Error: ${data.message}`);
            }
        } catch (err) {
            setMessage('Failed to send request');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelRequest = async (requestId: string) => {
        if (!window.confirm("Are you sure you want to cancel this request?")) return;
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/entity/request/${requestId}`, {
                method: 'DELETE',
                headers: {
                    'x-auth-token': token || ''
                }
            });

            if (res.ok) {
                alert('Request cancelled successfully');
                fetchMyRequests();
            } else {
                const data = await res.json();
                alert(`Error: ${data.message}`);
            }
        } catch (err) {
            alert('Failed to cancel request');
        } finally {
            setLoading(false);
        }
    };

    const handleLinkWallet = async () => {
        if (!account || !token) return;
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/auth/link-wallet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ walletAddress: account })
            });
            const data = await res.json();
            if (res.ok) {
                alert('Wallet linked successfully!');
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.reload();
            } else {
                throw new Error(data.message);
            }
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
            <div style={{ marginBottom: '4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>Institution Portal</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
                            Authenticated as: <strong style={{ color: '#fff' }}>{user?.entityName || user?.username}</strong>
                        </p>
                    </div>
                    {(!user?.walletAddress || (account && user.walletAddress.toLowerCase() !== account.toLowerCase())) && (
                        <div className="glass" style={{ background: 'rgba(255,165,0,0.1)', border: '1px solid orange', padding: '1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div>
                                <div style={{ color: 'orange', fontWeight: 700, fontSize: '0.9rem' }}>⚠️ WALLET SYNC REQUIRED</div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{account ? `Current: ${account.slice(0,6)}...` : 'Connect MetaMask'}</div>
                            </div>
                            {account && (
                                <button className="btn btn-primary" onClick={handleLinkWallet} disabled={loading} style={{ background: 'orange', border: 'none', color: '#000', padding: '0.5rem 1rem' }}>
                                    Link Wallet to Profile
                                </button>
                            )}
                        </div>
                    )}

                    {user?.walletAddress && account && user.walletAddress.toLowerCase() === account.toLowerCase() && onChainActive === false && (
                        <div className="glass" style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid var(--error)', padding: '1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div>
                                <div style={{ color: 'var(--error)', fontWeight: 700, fontSize: '0.9rem' }}>⚠️ NOT REGISTERED ON BLOCKCHAIN</div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Your wallet is linked but not authorized on-chain.</div>
                            </div>
                            <button className="btn btn-primary" onClick={() => document.getElementById('onboarding-section')?.scrollIntoView({ behavior: 'smooth' })} style={{ background: 'var(--error)', border: 'none', color: '#fff', padding: '0.5rem 1rem' }}>
                                Fix Now
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {onChainActive === null && user?.registrationStatus !== 'approved' ? (
                <div style={{ padding: '8rem', textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto 2rem auto' }}></div>
                    <p style={{ opacity: 0.6 }}>Verifying institutional network status...</p>
                </div>
            ) : (user?.registrationStatus === 'approved' || onChainActive) ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2.5rem' }}>
                    {/* Left Column: Stats & Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                    {/* New Request Form */}
                    <div className="glass" style={{ padding: '2.5rem' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>New Data Request</h3>
                        <form onSubmit={handleCreateRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', opacity: user?.walletAddress ? 1 : 0.5, pointerEvents: user?.walletAddress ? 'all' : 'none' }}>
                            {!user?.walletAddress && <p style={{ color: 'orange', fontSize: '0.8rem' }}>Link your wallet to start requesting data.</p>}
                            <div style={{ position: 'relative' }}>
                                <label>Search User by Name</label>
                                <input 
                                    type="text" 
                                    placeholder="Type name or username..." 
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                />
                                {searchResults.length > 0 && (
                                    <div className="glass" style={{ 
                                        position: 'absolute', 
                                        top: '100%', 
                                        left: 0, 
                                        right: 0, 
                                        zIndex: 100, 
                                        background: '#1a1a1a', 
                                        maxHeight: '200px', 
                                        overflowY: 'auto',
                                        marginTop: '0.5rem',
                                        border: '1px solid var(--card-border)'
                                    }}>
                                        {searchResults.map((u, i) => (
                                            <div 
                                                key={i} 
                                                className="hover-glass" 
                                                style={{ padding: '0.8rem 1rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                                onClick={() => selectSearchUser(u)}
                                            >
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.fullName}</div>
                                                <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>@{u.username}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {selectedUser && (
                                <div className="glass" style={{ padding: '1rem', background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)' }}>
                                    <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>SELECTED RECIPIENT</div>
                                    <div style={{ fontWeight: 600 }}>{selectedUser.fullName}</div>
                                    <div style={{ fontSize: '0.7rem', fontFamily: 'monospace' }}>{userWallet}</div>
                                    <button 
                                        type="button" 
                                        onClick={() => {setSelectedUser(null); setUserWallet('');}}
                                        style={{ background: 'none', border: 'none', color: 'var(--error)', fontSize: '0.7rem', padding: 0, marginTop: '0.5rem', cursor: 'pointer' }}
                                    >
                                        Change Recipient
                                    </button>
                                </div>
                            )}

                            <div>
                                <label>User Wallet Address</label>
                                <input 
                                    type="text" 
                                    placeholder="0x..." 
                                    value={userWallet}
                                    onChange={(e) => setUserWallet(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label>Required Document</label>
                                <select 
                                    value={docType}
                                    onChange={(e) => setDocType(e.target.value)}
                                    style={{ 
                                        width: '100%', 
                                        padding: '1rem', 
                                        background: '#1a1a1a', // Fixed background for dark theme compatibility
                                        border: '1px solid var(--card-border)', 
                                        color: '#fff' 
                                    }}
                                >
                                    <option value="Aadhar Card" style={{ background: '#1a1a1a' }}>Aadhar Card</option>
                                    <option value="PAN Card" style={{ background: '#1a1a1a' }}>PAN Card</option>
                                    <option value="Passport" style={{ background: '#1a1a1a' }}>Passport</option>
                                    <option value="Driving License" style={{ background: '#1a1a1a' }}>Driving License</option>
                                </select>
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={loading || !user?.walletAddress}>
                                {loading ? 'Sending...' : 'Request Data Access'}
                            </button>
                        </form>
                        {message && (
                            <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '8px', background: message.includes('Error') ? 'rgba(255,68,68,0.1)' : 'rgba(0,255,136,0.1)', color: message.includes('Error') ? 'var(--error)' : 'var(--success)', fontSize: '0.9rem', textAlign: 'center' }}>
                                {message}
                            </div>
                        )}
                    </div>

                    {/* Quick Stats */}
                    <div className="glass" style={{ padding: '2rem' }}>
                        <h4 style={{ marginBottom: '1rem', opacity: 0.7 }}>Dashboard Summary</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="glass" style={{ padding: '1rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{incomingApps.length}</div>
                                <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>PENDING APPS</div>
                            </div>
                            <div className="glass" style={{ padding: '1rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{requests.length}</div>
                                <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>AUDIT REQUESTS</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Main Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                    {/* Incoming Applications */}
                    <div className="glass" style={{ padding: '2.5rem' }}>
                        <h3 style={{ marginBottom: '2rem', borderLeft: '4px solid #fff', paddingLeft: '1rem' }}>Incoming KYC Applications</h3>
                        {incomingApps.length === 0 ? (
                            <p style={{ opacity: 0.5, textAlign: 'center', padding: '2rem' }}>No pending applications for your institution.</p>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: selectedApp ? '1fr 1fr' : '1fr', gap: '2rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {incomingApps.map(app => (
                                        <div 
                                            key={app._id} 
                                            className="glass" 
                                            style={{ 
                                                padding: '1.5rem', 
                                                cursor: 'pointer', 
                                                background: selectedApp?._id === app._id ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.01)',
                                                border: selectedApp?._id === app._id ? '1px solid #fff' : '1px solid var(--card-border)'
                                            }}
                                            onClick={() => setSelectedApp(app)}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{app.user?.fullName}</div>
                                                    <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>{app.user?.walletAddress?.slice(0,12)}...</div>
                                                </div>
                                                <div className="status-badge" style={{ fontSize: '0.7rem' }}>{app.status.toUpperCase()}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {selectedApp && (
                                    <div className="glass fade-in" style={{ padding: '2.5rem', background: 'rgba(255,255,255,0.02)' }}>
                                        <h4 style={{ marginBottom: '1.5rem' }}>Review Application</h4>
                                        <div style={{ marginBottom: '2rem' }}>
                                            <label style={{ fontSize: '0.7rem', opacity: 0.5 }}>NAME</label>
                                            <div style={{ fontWeight: 600 }}>{selectedApp.user?.fullName}</div>
                                        </div>
                                        <div style={{ marginBottom: '2rem' }}>
                                            <label style={{ fontSize: '0.7rem', opacity: 0.5 }}>SUBMITTED DOCUMENTS</label>
                                            {selectedApp.documentCIDs.map((doc: any, i: number) => (
                                                <div key={i} className="glass" style={{ padding: '1rem', marginTop: '0.5rem', background: 'rgba(255,255,255,0.03)' }}>
                                                    <div style={{ fontSize: '0.85rem' }}>{doc.fileName}</div>
                                                    <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', opacity: 0.4, marginTop: '0.3rem' }}>{doc.fileHash}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <button onClick={() => verifyOnChain(selectedApp)} disabled={loading || selectedApp.status === 'approved'} className="btn btn-primary" style={{ flex: 1 }}>
                                                {loading ? 'Committing...' : selectedApp.status === 'approved' ? 'Verified on Blockchain' : 'Verify & Commit'}
                                            </button>
                                            <button onClick={() => setSelectedApp(null)} className="btn btn-outline" style={{ flex: 0.5 }}>Close</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Pending & Verified Audits */}
                    <div className="glass" style={{ padding: '2.5rem' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>Audit Request History</h3>
                        {requests.length === 0 ? (
                            <p style={{ opacity: 0.5, textAlign: 'center', padding: '2rem' }}>No requests initiated yet.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {requests.map((req) => (
                                    <div key={req._id} className="glass" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <div style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{req.userWallet}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                <button 
                                                    onClick={() => handleCancelRequest(req._id)}
                                                    title="Remove Request"
                                                    style={{ 
                                                        background: 'none', border: '1px solid var(--error)', color: 'var(--error)', 
                                                        padding: '0.3rem 0.8rem', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' 
                                                    }}
                                                >
                                                    Remove
                                                </button>
                                                <div className={`status-badge ${req.status === 'approved' ? 'status-verified' : ''}`} style={{ fontSize: '0.8rem' }}>{req.status.toUpperCase()}</div>
                                            </div>


                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                            <div>
                                                <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>DOCUMENT TYPE</div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{req.docType}</div>
                                            </div>
                                            <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{new Date(req.requestedAt).toLocaleDateString()}</div>
                                        </div>
                                        {req.status === 'approved' && (
                                            <div style={{ marginTop: '1.5rem', padding: '1.2rem', background: 'rgba(0,255,136,0.05)', borderRadius: '8px', border: '1px solid rgba(0,255,136,0.1)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                                    <div>
                                                        <label style={{ fontSize: '0.7rem', opacity: 0.6 }}>Verified Hash Shared</label>
                                                        <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all', color: 'var(--success)' }}>{req.sharedHash}</div>
                                                    </div>
                                                    <a href={`https://gateway.pinata.cloud/ipfs/${req.sharedIpfs}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.7rem', color: '#fff', textDecoration: 'underline' }}>View Data</a>
                                                </div>
                                                {req.isUserVerifiedOnChain ? (
                                                    <button 
                                                        onClick={() => handleVerifyUserBlockchain(req)}
                                                        disabled={loading || !contract}
                                                        className="btn btn-primary" 
                                                        style={{ width: '100%', fontSize: '0.8rem', padding: '0.8rem', background: 'var(--success)', border: 'none' }}
                                                    >
                                                        {loading ? 'Verifying...' : 'Verify User via Blockchain'}
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => commitVerificationOnChain(req)}
                                                        disabled={loading || !contract}
                                                        className="btn btn-primary" 
                                                        style={{ width: '100%', fontSize: '0.8rem', padding: '0.8rem' }}
                                                    >
                                                        {loading ? 'Processing...' : 'Verify on Blockchain'}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        {req.status === 'verified' && (
                                             <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '4px solid var(--success)' }}>
                                                <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>TRANSACTION RECORDED</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>Identitiy verified & locked on Sepolia</div>
                                                <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', opacity: 0.4, marginTop: '0.3rem', wordBreak: 'break-all' }}>Hash: {req.sharedHash}</div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            ) : (
                <div style={{ padding: '4rem', textAlign: 'center', background: 'rgba(255,165,0,0.05)', borderRadius: '12px', border: '1px solid rgba(255,165,0,0.2)', marginBottom: '2.5rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>⏳</div>
                    <h3>Dashboard Locked</h3>
                    <p style={{ opacity: 0.8, maxWidth: '500px', margin: '0 auto', color: 'orange' }}>
                        Your institution is not yet active on the blockchain. Please complete the self-registration onboarding below to unlock the portal.
                    </p>
                </div>
            )}

                {/* On-Chain Registration / Status */}
                {user?.role === 'entity' && (
                    <div id="onboarding-section" style={{ gridColumn: 'span 2' }}>
                        <div className="glass" style={{ padding: '2.5rem', border: '1px solid rgba(0,136,255,0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <div>
                                    <h2 style={{ marginBottom: '0.5rem' }}>Institutional Onboarding</h2>
                                    <p style={{ color: 'var(--text-secondary)' }}>Connect your institution to the global verification network in one step.</p>
                                </div>
                            </div>

                            {onChainActive ? (
                                <div style={{ padding: '3rem', textAlign: 'center' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>✅</div>
                                    <h3>Onboarding Complete</h3>
                                    <p style={{ opacity: 0.7 }}>Your institution is authorized and registered on the blockchain.</p>
                                </div>
                            ) : user?.walletAddress ? (
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    if (!contract || !account) {
                                        alert("Please ensure MetaMask is connected and on Sepolia.");
                                        return;
                                    }
                                    setLoading(true);
                                    const formData = new FormData(e.currentTarget);
                                    const onChainType = parseInt(formData.get('type') as string);
                                    const apiEndpoint = formData.get('endpoint') as string || "http://localhost:5000";
                                    
                                    try {
                                        // 1. Register on Blockchain Directly (No Admin Approval Needed)
                                        const tx = await contract.registerEntity(
                                            account,
                                            onChainType,
                                            user?.entityName || user?.username || "Authorized Institution",
                                            apiEndpoint
                                        );
                                        await tx.wait();

                                        // 2. Update Backend
                                        const res = await fetch('http://localhost:5000/api/entity/apply', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
                                            body: JSON.stringify({ onChainType, apiEndpoint })
                                        });
                                        
                                        if (!res.ok) {
                                            const errData = await res.json();
                                            throw new Error(errData.message || 'Failed to save profile');
                                        }

                                        const result = await res.json();
                                        sessionStorage.setItem('user', JSON.stringify(result.user));

                                        alert("Institutional Onboarding Complete! Your profile is registered on-chain.");
                                        window.location.reload();
                                    } catch (err: any) { 
                                        console.error(err);
                                        alert(`Onboarding Error: ${err.message}`);
                                    } finally {
                                        setLoading(false);
                                    }
                                }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', alignItems: 'flex-end' }}>
                                    <div>
                                        <label>Institutional Category</label>
                                        <select name="type" style={{ width: '100%', padding: '1rem', background: '#1a1a1a', border: '1px solid var(--card-border)', color: '#fff' }}>
                                            <option value="0">Bank</option>
                                            <option value="1">Crypto Exchange</option>
                                            <option value="2">Insurance Provider</option>
                                            <option value="3">Government Agency</option>
                                            <option value="5">DeFi Protocol</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label>API Endpoint (Optional)</label>
                                        <input name="endpoint" type="text" placeholder="http://localhost:5000" defaultValue="http://localhost:5000" />
                                    </div>
                                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '1.1rem' }}>
                                        {loading ? 'Processing...' : 'Complete Onboarding'}
                                    </button>
                                </form>
                            ) : (
                                <div style={{ padding: '3rem', textAlign: 'center' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🏛️</div>
                                    <h3>Institutional Registration</h3>
                                    <p style={{ opacity: 0.7 }}>Please link your wallet to the institution portal first.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
    );
};

export default EntityDashboard;
