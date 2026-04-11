import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBlockchain } from '../context/BlockchainContext';
import { Shield, Lock, Share2, Trash2, Clock, CheckCircle, FileText, Globe, RefreshCw } from 'lucide-react';

interface VaultItem {
    fileName: string;
    ipfsHash: string;
    fileHash: string;
    uploadedAt: string;
    status: string;
    sharedWith: string[];
}

const Vault: React.FC = () => {
    const { token } = useAuth();
    const { kycContract, account } = useBlockchain();
    const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [sharingWith, setSharingWith] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (token) fetchVault();
    }, [token]);

    const fetchVault = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5050/api/vault', {
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

    const handleDelete = async (fileHash: string) => {
        if (!window.confirm("Delete this document? This will remove the local record and IPFS link.")) return;
        try {
            const res = await fetch(`http://localhost:5050/api/vault/${fileHash}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token || '' }
            });
            if (res.ok) {
                setMessage('Document removed from vault.');
                fetchVault();
            }
        } catch (err) {}
    };

    const handleShare = async (fileHash: string) => {
        const entity = sharingWith[fileHash];
        if (!entity || !token) return;
        try {
            const res = await fetch('http://localhost:5050/api/vault/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ fileHash, entityName: entity })
            });
            if (res.ok) {
                setMessage(`Certificate shared with ${entity}`);
                setSharingWith({ ...sharingWith, [fileHash]: '' });
                fetchVault();
            }
        } catch (err) {}
    };

    return (
        <div className="animate-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 className="gradient-text" style={{ fontSize: '3.5rem' }}>Secure Vault</h1>
                    <p className="sub-heading">Self-sovereign control over your cryptographic document commitments.</p>
                </div>
                <div className="glass" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Shield size={20} color="var(--primary)" />
                    <span style={{ fontWeight: 700 }}>{vaultItems.length} ASSETS</span>
                </div>
            </header>

            {message && (
                <div className="badge badge-success" style={{ width: '100%', padding: '1rem', marginBottom: '2rem', borderRadius: '8px' }}>
                    <CheckCircle size={16} /> {message}
                </div>
            )}

            <div className="glass" style={{ padding: '3rem' }}>
                <h3 style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Lock size={24} /> Encrypted evidence
                </h3>

                {loading ? (
                    <div style={{ padding: '5rem', textAlign: 'center' }}><RefreshCw className="spin" /></div>
                ) : vaultItems.length === 0 ? (
                    <div style={{ padding: '5rem', textAlign: 'center', opacity: 0.5 }}>
                        <FileText size={48} style={{ marginBottom: '1rem' }} />
                        <p>No documents found in your vault.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '2rem' }}>
                        {vaultItems.map((item, idx) => (
                            <div key={idx} className="glass glass-hover" style={{ padding: '2rem', background: 'rgba(255,255,255,0.01)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <div style={{ background: 'rgba(59,130,246,0.1)', padding: '0.75rem', borderRadius: '10px', color: 'var(--secondary)' }}>
                                            <FileText size={28} />
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: '1.25rem' }}>{item.fileName}</h4>
                                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <Clock size={12} /> {new Date(item.uploadedAt).toLocaleDateString()}
                                                </span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <Globe size={12} /> IPFS Anchored
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="badge badge-success">Verified</div>
                                </div>

                                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-glass)', marginBottom: '1.5rem' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>SHA-256 Fingerprint</div>
                                    <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', wordBreak: 'break-all', color: 'var(--secondary)' }}>{item.fileHash}</div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {item.sharedWith.length > 0 ? (
                                            item.sharedWith.map((sw, i) => (
                                                <span key={i} className="badge" style={{ fontSize: '0.65rem', padding: '0.25rem 0.75rem', background: 'rgba(16,185,129,0.1)', color: 'var(--primary)' }}>
                                                    Shared: {sw}
                                                </span>
                                            ))
                                        ) : (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Private local access only</span>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <button onClick={() => handleDelete(item.fileHash)} className="btn btn-ghost" style={{ padding: '0.5rem', color: 'var(--error)' }}><Trash2 size={18} /></button>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <input 
                                                type="text" 
                                                placeholder="Institution Name" 
                                                value={sharingWith[item.fileHash] || ''}
                                                onChange={(e) => setSharingWith({ ...sharingWith, [item.fileHash]: e.target.value })}
                                                style={{ width: '180px', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                            />
                                            <button onClick={() => handleShare(item.fileHash)} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                                                <Share2 size={16} /> Share
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <Lock size={12} /> Multi-layer encryption ensures your documents are only decryptable by you and the authorized entities via on-chain keys.
                </p>
            </div>
        </div>
    );
};

export default Vault;
