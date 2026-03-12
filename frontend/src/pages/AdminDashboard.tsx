import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBlockchain } from '../context/BlockchainContext';

const AdminDashboard: React.FC = () => {
    const { isAdmin, contract, account } = useBlockchain();
    const { token } = useAuth();
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [pendingEntities, setPendingEntities] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchPendingRequests();
        fetchPendingEntities();
    }, []);

    const fetchPendingRequests = async () => {
        try {
            const headers: any = {};
            if (token) headers['x-auth-token'] = token;

            const res = await fetch('http://localhost:5000/api/verify/incoming', { headers });
            const data = await res.json();
            if (res.ok) {
                // In a real scenario, we'd filter by requests where entityId is the Government
                setPendingRequests(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchPendingEntities = async () => {
        try {
            const headers: any = {};
            if (token) headers['x-auth-token'] = token;

            const res = await fetch('http://localhost:5000/api/entity/pending-registrations', { headers });
            const data = await res.json();
            if (res.ok) {
                setPendingEntities(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const generateHash = async (fileData: string) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(fileData);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return '0x' + hashHex;
    };

    const handleVerifyAndSendHash = async (request: any) => {
        if (!contract || !request.documentCIDs?.length) return;
        
        setLoading(true);
        try {
            const headers: any = { 'Content-Type': 'application/json' };
            if (token) headers['x-auth-token'] = token;

            const doc = request.documentCIDs[0];
            const finalHash = doc.fileHash;
            // Extract document type from fileName format "Aadhar Card : 0xhash..."
            const docType = doc.fileName?.split(' : ')[0]?.trim() || doc.fileName || 'Document';

            // Anchor hash on blockchain via institutionalVerify
            const tx = await contract.institutionalVerify(request.user.walletAddress, finalHash, docType);
            await tx.wait();

            // 3. Update Status on Backend
            const res = await fetch('http://localhost:5000/api/verify/update-status', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    requestId: request._id,
                    status: 'verified' // Using the newly added 'verified' status
                })
            });

            if (res.ok) {
                // 4. Push Hash to User's Vault (Admin only feature)
                await fetch('http://localhost:5000/api/vault/admin/add-to-user', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        userId: request.user._id,
                        fileName: doc.fileName,
                        ipfsHash: doc.ipfsHash,
                        fileHash: finalHash
                    })
                });

                alert('Government Verification Successful! Hash committed to blockchain and sent to user vault.');
                fetchPendingRequests();
            } else {
                throw new Error('Failed to update status on server');
            }
        } catch (err: any) {
            console.error(err);
            alert(`Verification Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveEntity = async (entity: any) => {
        if (!contract) return;
        setLoading(true);
        try {
            // 1. Register on Blockchain
            const tx = await contract.registerEntity(
                entity.walletAddress,
                entity.onChainType || 0,
                entity.entityName || entity.username,
                entity.apiEndpoint || "http://localhost:5000"
            );
            await tx.wait();

            // 2. Mark as approved in DB
            const headers: any = { 'Content-Type': 'application/json' };
            if (token) headers['x-auth-token'] = token;

            const res = await fetch('http://localhost:5000/api/entity/approve-registration', {
                method: 'POST',
                headers,
                body: JSON.stringify({ entityId: entity._id })
            });

            if (res.ok) {
                alert('Institution successfully registered on the blockchain and approved.');
                fetchPendingEntities();
            } else {
                throw new Error('Failed to update status on server');
            }
        } catch (err: any) {
            console.error(err);
            alert(`Approval Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    /* Removed isAdmin check to allow direct access */

    return (
        <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
            <div style={{ marginBottom: '4rem' }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>Government Verification Portal</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
                    Official Gateway for Cryptographic Identity Issuance
                </p>
            </div>

            <div className="glass" style={{ padding: '3rem' }}>
                <h3 style={{ marginBottom: '2rem', borderLeft: '4px solid var(--success)', paddingLeft: '1rem' }}>
                    Pending Identity Applications
                </h3>
                
                {pendingRequests.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                        <p>No pending applications at this time.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        {pendingRequests.map((req) => (
                            <div key={req._id} className="glass" style={{ padding: '2rem', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{req.user?.fullName}</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.6, fontFamily: 'monospace' }}>{req.user?.walletAddress}</div>
                                    <div style={{ marginTop: '1rem' }}>
                                        {req.documentCIDs.map((doc: any, i: number) => (
                                            <div key={i} style={{ fontSize: '0.85rem', color: 'var(--success)' }}>
                                                📄 {doc.fileName}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ textAlign: 'right', marginRight: '2rem' }}>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>HASH COMMITMENT</div>
                                        <div style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{req.documentCIDs[0]?.fileHash?.slice(0, 20)}...</div>
                                    </div>
                                    <button 
                                        className="btn btn-primary" 
                                        onClick={() => handleVerifyAndSendHash(req)}
                                        disabled={loading}
                                    >
                                        {loading ? 'Committing...' : 'Verify & Send Hash'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="glass" style={{ padding: '3rem', marginTop: '3rem' }}>
                <h3 style={{ marginBottom: '2rem', borderLeft: '4px solid #0088ff', paddingLeft: '1rem' }}>
                    Institutional Onboarding Requests
                </h3>
                
                {pendingEntities.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏛️</div>
                        <p>No institutions are currently pending registration.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        {pendingEntities.map((ent) => (
                            <div key={ent._id} className="glass" style={{ padding: '2rem', background: 'rgba(0,136,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{ent.entityName || ent.fullName}</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.6, fontFamily: 'monospace' }}>Wallet: {ent.walletAddress}</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>API: {ent.apiEndpoint || "Not specified"}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button 
                                        className="btn btn-primary" 
                                        onClick={() => handleApproveEntity(ent)}
                                        disabled={loading}
                                        style={{ background: '#0088ff', border: 'none' }}
                                    >
                                        {loading ? 'Processing...' : 'Approve & Register'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <div style={{ marginTop: '3rem', padding: '2rem', background: 'rgba(0,255,136,0.05)', borderRadius: '12px', border: '1px solid rgba(0,255,136,0.2)' }}>
                <h4 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>Government Node Status: ONLINE</h4>
                <p style={{ fontSize: '0.85rem', margin: 0, opacity: 0.8 }}>
                    Connected Wallet: {account} (Authorized Verifier)
                </p>
            </div>
        </div>
    );
};

export default AdminDashboard;
