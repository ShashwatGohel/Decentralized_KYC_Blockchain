import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBlockchain } from '../context/BlockchainContext';

const Verify: React.FC = () => {
    const { token } = useAuth();
    const { account } = useBlockchain();
    const [file, setFile] = useState<File | null>(null);
    const [docType, setDocType] = useState('Aadhar Card');
    const [generatedHash, setGeneratedHash] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
            setGeneratedHash('');
            setMessage('');
        }
    };

    const generateHash = async () => {
        if (!file) return;
        setLoading(true);
        try {
            const buffer = await file.arrayBuffer();
            const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            setGeneratedHash(hashHex);
            setMessage('Success: Cryptographic hash generated from local file.');
        } catch (err: any) {
            setMessage(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const storeHash = async () => {
        if (!generatedHash || !token) return;
        setLoading(true);
        try {
            // Simulated IPFS CID for this doc
            const ipfsHash = `Qm${Math.random().toString(36).substring(2, 15)}`;
            // 3. Save to Backend Vault
            const res = await fetch('http://localhost:5000/api/vault/add', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-auth-token': token 
                },
                body: JSON.stringify({
                    fileName: `${docType} : ${generatedHash}`,
                    ipfsHash: ipfsHash,
                    fileHash: generatedHash
                })
            });

            if (res.ok) {
                setMessage(`Protocol updated: ${docType} hash secured in your vault.`);
                setFile(null);
                setGeneratedHash('');
            } else {
                const data = await res.json();
                throw new Error(data.message || 'Storage failed');
            }
        } catch (err: any) {
            setMessage(`Protocol Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '4rem' }}>
                <h1 style={{ fontSize: '3rem' }}>Verify Identity</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
                    Upload your legal documents to generate permanent cryptographic proofs.
                </p>
            </div>

            <div className="glass" style={{ padding: '4rem' }}>
                <div style={{ display: 'grid', gap: '2.5rem' }}>
                    <div>
                        <label>Document Type</label>
                        <select 
                            value={docType} 
                            onChange={(e) => setDocType(e.target.value)}
                            style={{ 
                                width: '100%', 
                                padding: '1rem', 
                                background: 'rgba(255,255,255,0.05)', 
                                border: '1px solid var(--card-border)',
                                color: '#fff',
                                borderRadius: '8px',
                                fontSize: '1rem'
                            }}
                        >
                            <option value="Aadhar Card">Aadhar Card</option>
                            <option value="PAN Card">PAN Card</option>
                            <option value="Passport">Passport</option>
                            <option value="Driver License">Driver License</option>
                        </select>
                    </div>

                    <div>
                        <label>Identity Document (Image/PDF)</label>
                        <div style={{ 
                            border: '2px dashed var(--card-border)', 
                            padding: '3rem', 
                            textAlign: 'center', 
                            borderRadius: '12px',
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'var(--transition)'
                        }} className="hover-glass">
                            <input 
                                type="file" 
                                onChange={handleFileChange} 
                                style={{ opacity: 0, position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, cursor: 'pointer' }} 
                            />
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
                            <p style={{ fontWeight: 500 }}>{file ? file.name : 'Select document file to proceed'}</p>
                            <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>Your data remains local throughout this process.</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <button 
                            onClick={generateHash} 
                            disabled={!file || loading} 
                            className="btn btn-outline"
                            style={{ flex: 1, padding: '1.2rem' }}
                        >
                            {loading ? 'Processing...' : 'Generate Hash'}
                        </button>
                        
                        <button 
                            onClick={storeHash} 
                            disabled={!generatedHash || loading} 
                            className="btn btn-primary"
                            style={{ flex: 1, padding: '1.2rem' }}
                        >
                            {loading ? 'Storing...' : 'Store Hash in Vault'}
                        </button>
                    </div>

                    {generatedHash && (
                        <div className="glass" style={{ padding: '1.5rem', marginTop: '1rem', border: '1px solid var(--success)' }}>
                            <label style={{ color: 'var(--success)' }}>SHA-256 Output</label>
                            <div style={{ 
                                fontFamily: 'monospace', 
                                fontSize: '0.8rem', 
                                wordBreak: 'break-all', 
                                marginTop: '0.5rem',
                                color: 'var(--text-secondary)'
                            }}>
                                {generatedHash}
                            </div>
                        </div>
                    )}

                    {message && (
                        <div style={{ 
                            textAlign: 'center', 
                            fontSize: '0.9rem', 
                            color: message.includes('Error') ? 'var(--error)' : 'var(--success)',
                            fontWeight: 600
                        }}>
                            {message}
                        </div>
                    )}
                </div>
            </div>

            <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                <div className="glass" style={{ padding: '2rem' }}>
                    <h4 style={{ marginBottom: '1rem' }}>Local Verification</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Hashing is performed directly on your device. The original document is never transmitted to our servers during the generation phase.
                    </p>
                </div>
                <div className="glass" style={{ padding: '2rem' }}>
                    <h4 style={{ marginBottom: '1rem' }}>Permanent Proof</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Storing the hash commits your identity proof to the protocol vault, allowing banks to verify your status instantly.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Verify;
