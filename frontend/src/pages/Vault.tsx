import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface VaultItem {
    fileName: string;
    ipfsHash: string;
    fileHash: string;
    uploadedAt: string;
    status: string;
    sharedWith: string[];
}

interface PendingRequest {
    _id: string;
    entityId: {
        entityName: string;
        fullName: string;
    };
    docType: string;
    status: string;
    requestedAt: string;
}

const Vault: React.FC = () => {
    const { token } = useAuth();
    const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
    const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [sharingWith, setSharingWith] = useState<{ [key: string]: string }>({});
    const [manualHash, setManualHash] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        fetchVault();
        fetchRequests();
    }, []);

    const fetchVault = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/vault', {
                headers: { 'x-auth-token': token || '' }
            });
            const data = await res.json();
            if (res.ok) setVaultItems(data);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRequests = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/entity/user-requests', {
                headers: { 'x-auth-token': token || '' }
            });
            const data = await res.json();
            if (res.ok) setPendingRequests(data.filter((r: any) => r.status === 'pending'));
        } catch (err) {
            console.error('Requests fetch error:', err);
        }
    };

    const handleApproveRequest = async (requestId: string, docType: string, customHash?: string) => {
        // Find a matching file in vault if no custom hash provided
        const matchingFile = customHash ? null : vaultItems.find(item => item.fileName.toLowerCase().includes(docType.toLowerCase()));
        
        if (!matchingFile && !customHash) {
            setMessage(`Error: No ${docType} found in your vault to share.`);
            return;
        }

        const h = customHash || matchingFile?.fileHash;
        const i = matchingFile?.ipfsHash || "";

        try {
            const res = await fetch('http://localhost:5000/api/entity/approve', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-auth-token': token || '' 
                },
                body: JSON.stringify({ 
                    requestId, 
                    fileHash: h, 
                    ipfsHash: i 
                })
            });

            if (res.ok) {
                setMessage('Request approved! Hash shared with the institution.');
                fetchRequests();
            }
        } catch (err) {
            console.error('Approve error:', err);
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        if (!window.confirm("Are you sure you want to decline this identity request?")) return;
        
        try {
            const res = await fetch('http://localhost:5000/api/entity/reject', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-auth-token': token || '' 
                },
                body: JSON.stringify({ requestId })
            });

            if (res.ok) {
                setMessage('Request declined successfully.');
                fetchRequests();
            }
        } catch (err) {
            console.error('Reject error:', err);
        }
    };

    const handleDeleteDocument = async (fileHash: string) => {
        if (!window.confirm("Are you sure you want to permanently delete this document from your vault? This cannot be undone on the server.")) return;
        
        try {
            const res = await fetch(`http://localhost:5000/api/vault/${fileHash}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token || '' }
            });

            if (res.ok) {
                setMessage('Document deleted from vault.');
                fetchVault();
            } else {
                const data = await res.json();
                setMessage(`Error: ${data.message || 'Deletion failed'}`);
            }
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const handleShare = async (fileHash: string) => {
        const entity = sharingWith[fileHash];
        if (!entity || !token) return;

        try {
            const res = await fetch('http://localhost:5000/api/vault/share', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-auth-token': token 
                },
                body: JSON.stringify({ fileHash, entityName: entity })
            });

            if (res.ok) {
                setMessage(`Certificate successfully shared with ${entity}`);
                setSharingWith({ ...sharingWith, [fileHash]: '' });
                fetchVault();
            }
        } catch (err) {
            console.error('Share error:', err);
        }
    };

    return (
        <div className="fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '3rem' }}>Document Vault</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
                        Your secure repository for cryptographic identity certificates.
                    </p>
                </div>
                <div className="glass" style={{ padding: '0.8rem 1.5rem', fontSize: '0.9rem', color: 'var(--success)' }}>
                    {vaultItems.length} Secured Assets
                </div>
            </div>

            {message && (
                <div className="status-badge status-verified" style={{ width: '100%', justifyContent: 'center', marginBottom: '2rem' }}>
                    {message}
                </div>
            )}

            <div className="glass" style={{ padding: '3rem', minHeight: '100px', marginBottom: '2rem', display: pendingRequests.length > 0 ? 'block' : 'none' }}>
                <h3 style={{ marginBottom: '2rem', borderLeft: '4px solid var(--success)', paddingLeft: '1rem', color: 'var(--success)' }}>
                    Incoming Identity Requests
                </h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {pendingRequests.map((req) => (
                        <div key={req._id} className="glass" style={{ padding: '1.5rem', background: 'rgba(0, 255, 136, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '0.9rem', color: '#fff' }}>
                                    <strong>{req.entityId.entityName || req.entityId.fullName}</strong> is requesting your <strong>{req.docType}</strong>
                                </div>
                                <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '0.4rem' }}>
                                    Received: {new Date(req.requestedAt).toLocaleString()}
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button 
                                        onClick={() => handleApproveRequest(req._id, req.docType)}
                                        className="btn btn-primary" 
                                        style={{ padding: '0.5rem 1.2rem', fontSize: '0.8rem' }}
                                    >
                                        Direct Approve
                                    </button>
                                    <button 
                                        onClick={() => handleRejectRequest(req._id)}
                                        className="btn btn-outline" 
                                        style={{ padding: '0.5rem 1.2rem', fontSize: '0.8rem', borderColor: 'var(--error)', color: 'var(--error)' }}
                                    >
                                        Decline
                                    </button>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input 
                                        type="text" 
                                        placeholder="Paste Verified Hash manually..." 
                                        value={manualHash[req._id] || ''}
                                        onChange={(e) => setManualHash({...manualHash, [req._id]: e.target.value})}
                                        style={{ fontSize: '0.75rem', padding: '0.4rem', flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    />
                                    <button 
                                        onClick={() => handleApproveRequest(req._id, req.docType, manualHash[req._id])}
                                        className="btn btn-primary" 
                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem', background: 'var(--success)', border: 'none' }}
                                    >
                                        Share Hash
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="glass" style={{ padding: '3rem', minHeight: '500px' }}>
                <h3 style={{ marginBottom: '2.5rem', borderLeft: '4px solid #fff', paddingLeft: '1rem' }}>Secured Evidence</h3>
                
                {loading ? (
                    <div style={{ textAlign: 'center', marginTop: '5rem' }}>Synchronizing with Network...</div>
                ) : vaultItems.length === 0 ? (
                    <div style={{ textAlign: 'center', marginTop: '6rem', opacity: 0.5 }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🗃</div>
                        <p>No document proofs found. Go to <strong>Verify Identity</strong> to add your first asset.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        {vaultItems.map((item, idx) => (
                            <div key={idx} className="glass" style={{ padding: '2rem', background: 'rgba(255,255,255,0.02)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                    <div style={{ maxWidth: '80%' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                                            Validated Asset
                                        </div>
                                        <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, wordBreak: 'break-word', lineHeight: 1.4 }}>
                                            {item.fileName.split(' : ')[0]} 
                                            <span style={{ fontWeight: 400, opacity: 0.6, fontSize: '0.9rem', marginLeft: '0.5rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                                : {item.fileName.split(' : ')[1]}
                                            </span>
                                        </h4>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {item.status === 'Verified' && (
                                            <div className="status-badge" style={{ backgroundColor: 'rgba(0,136,255,0.1)', color: '#0088ff', border: '1px solid #0088ff' }}>
                                                Government Issuance
                                            </div>
                                        )}
                                        <div className="status-badge status-verified">Network Verified</div>
                                    </div>
                                </div>
                                
                                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.2rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                                    <label style={{ fontSize: '0.75rem', opacity: 0.6 }}>Cryptographic Fingerprint (SHA-256)</label>
                                    <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', wordBreak: 'break-all', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                                        {item.fileHash}
                                    </div>
                                    <div style={{ marginTop: '0.8rem', fontSize: '0.7rem' }}>
                                        <span style={{ opacity: 0.6 }}>IPFS CID:</span> <span style={{ fontFamily: 'monospace' }}>{item.ipfsHash}</span>
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                                        {item.sharedWith.length > 0 ? (
                                            item.sharedWith.map((sw, i) => (
                                                <span key={i} style={{ 
                                                    fontSize: '0.7rem', 
                                                    background: 'rgba(0, 255, 136, 0.1)', 
                                                    color: 'var(--success)',
                                                    border: '1px solid rgba(0, 255, 136, 0.2)',
                                                    padding: '0.3rem 0.8rem', 
                                                    borderRadius: '100px',
                                                    fontWeight: 600
                                                }}>
                                                    Shared with {sw}
                                                </span>
                                            ))
                                        ) : (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Private: Visible only to owner</span>
                                        )}
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: '0.8rem' }}>
                                        <button 
                                            onClick={() => handleDeleteDocument(item.fileHash)}
                                            className="btn btn-outline" 
                                            style={{ 
                                                padding: '0.6rem 1.2rem', 
                                                fontSize: '0.85rem', 
                                                borderColor: 'rgba(255,68,68,0.3)', 
                                                color: 'var(--error)' 
                                            }}
                                        >
                                            Delete
                                        </button>
                                        <input 
                                            type="text" 
                                            placeholder="Recipient Entity" 
                                            value={sharingWith[item.fileHash] || ''}
                                            onChange={(e) => setSharingWith({ ...sharingWith, [item.fileHash]: e.target.value })}
                                            style={{ 
                                                fontSize: '0.85rem', 
                                                padding: '0.6rem 1rem', 
                                                width: '200px',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid var(--card-border)'
                                            }}
                                        />
                                        <button 
                                            onClick={() => handleShare(item.fileHash)}
                                            className="btn btn-primary" 
                                            style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}
                                        >
                                            Share Certificate
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Vault;
