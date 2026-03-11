import React, { useState, useEffect } from 'react';
import { useBlockchain } from '../context/BlockchainContext';
import { ethers } from 'ethers';

const UserDashboard: React.FC = () => {
    const { account, contract } = useBlockchain();
    const [name, setName] = useState('');
    const [documentData, setDocumentData] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [userDetails, setUserDetails] = useState<any>(null);

    useEffect(() => {
        if (contract && account) {
            fetchUserDetails();
        }
    }, [contract, account]);

    const fetchUserDetails = async () => {
        if (!contract || !account) return;
        try {
            const details = await contract.getUserDetails(account);
            if (details[0] !== '') {
                setUserDetails({
                    name: details[0],
                    documentHash: details[1],
                    isVerified: details[2],
                    verifiedAt: Number(details[3]),
                    verifiedBy: details[4]
                });
            } else {
                setUserDetails(null);
            }
        } catch (error) {
            console.error("Error fetching user details:", error);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contract || !name || !documentData) return;
        
        setLoading(true);
        setMessage('');
        try {
            const docHash = ethers.id(documentData);
            const tx = await contract.registerUser(name, docHash);
            await tx.wait();
            setMessage(`Registration successful. Your cryptographic commitment: ${docHash.slice(0, 16)}...`);
            await fetchUserDetails();
        } catch (error: any) {
            setMessage(`Protocol Error: ${error.reason || error.message || 'Registration failed'}`);
        } finally {
            setLoading(false);
        }
    };

    if (!account) {
        return (
            <div className="glass fade-in" style={{ padding: '6rem 3rem', textAlign: 'center', marginTop: '4rem' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Identity Portal Locked</h2>
                <p>Connect your wallet to access your decentralized identity dashboard.</p>
            </div>
        );
    }

    return (
        <div className="fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem' }}>Personal Identity</h1>
                <p>Manage your on-chain presence and verification status.</p>
            </div>

            {message && (
                <div className="glass" style={{ 
                    padding: '1.2rem', 
                    marginBottom: '2.5rem', 
                    backgroundColor: message.includes('Error') ? 'rgba(255,68,68,0.05)' : 'rgba(0,255,136,0.05)',
                    borderLeft: `4px solid ${message.includes('Error') ? 'var(--error)' : 'var(--success)'}`,
                    color: message.includes('Error') ? 'var(--error)' : 'var(--success)',
                    fontSize: '0.95rem',
                    wordBreak: 'break-all'
                }}>
                    {message}
                </div>
            )}

            {userDetails ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                    <div className="glass" style={{ padding: '3rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>Identity Certificate</h3>
                                <p style={{ fontSize: '0.9rem' }}>Verified Citizen of DeKYC</p>
                            </div>
                            <div className={`status-badge ${userDetails.isVerified ? 'status-verified' : 'status-pending'}`}>
                                {userDetails.isVerified ? 'Verified' : 'Pending'}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            <div>
                                <label>Legal Name</label>
                                <div style={{ fontSize: '1.4rem', fontWeight: 600 }}>{userDetails.name}</div>
                            </div>
                            <div>
                                <label>Document Commitment (SHA3)</label>
                                <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-secondary)', wordBreak: 'break-all', backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '4px' }}>
                                    {userDetails.documentHash}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className="glass" style={{ padding: '2rem' }}>
                            <h4>Registry Metadata</h4>
                            <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1rem', fontSize: '0.9rem' }}>
                                <div>
                                    <label>Verified At</label>
                                    <div>{userDetails.isVerified ? new Date(userDetails.verifiedAt * 1000).toLocaleString() : '---'}</div>
                                </div>
                                <div>
                                    <label>Authorized By</label>
                                    <div style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{userDetails.isVerified ? userDetails.verifiedBy : 'Searching for verifier...'}</div>
                                </div>
                            </div>
                        </div>
                        <div className="glass" style={{ padding: '2rem', flex: 1 }}>
                            <h4>Security Protocol</h4>
                            <p style={{ fontSize: '0.85rem', marginTop: '1rem' }}>Your data is locally hashed. The protocol verifier will only see the commitment, never the source data.</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="glass" style={{ padding: '4rem', maxWidth: '600px', margin: '0 auto' }}>
                    <h3 style={{ marginBottom: '2rem', textAlign: 'center' }}>Establish Identity</h3>
                    <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label>Full Legal Name</label>
                            <input 
                                type="text" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                                required
                            />
                        </div>
                        <div>
                            <label>Secure Document Data (ID/SSN/Passport)</label>
                            <input 
                                type="text" 
                                value={documentData}
                                onChange={(e) => setDocumentData(e.target.value)}
                                placeholder="Data will be hashed before submission"
                                required
                            />
                            <p style={{ fontSize: '0.75rem', marginTop: '1rem', fontStyle: 'italic' }}>
                                Committing will generate a SHA-3 hash. Your plain-text data will remain on this device.
                            </p>
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={loading || !name || !documentData}
                            className="btn btn-primary"
                            style={{ marginTop: '1rem' }}
                        >
                            {loading ? 'Committing...' : 'Establish On-Chain Identity'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default UserDashboard;
