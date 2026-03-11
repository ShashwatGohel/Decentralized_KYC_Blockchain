import React, { useState } from 'react';
import { useBlockchain } from '../context/BlockchainContext';

const VerifierDashboard: React.FC = () => {
    const { isVerifier, contract } = useBlockchain();
    const [userAddress, setUserAddress] = useState('');
    const [documentHash, setDocumentHash] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    if (!isVerifier) {
        return (
            <div className="glass fade-in" style={{ padding: '6rem 3rem', textAlign: 'center', marginTop: '4rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1.5rem', color: 'var(--error)' }}>⚠</div>
                <h2 style={{ fontSize: '2rem' }}>Unauthorized</h2>
                <p>Only authorized network verifiers can access this verification engine.</p>
            </div>
        );
    }

    const handleAction = async (action: 'verify' | 'revoke' | 'check') => {
        if (!contract || !userAddress) return;
        
        setLoading(true);
        setMessage('');
        try {
            if (action === 'check') {
                const result = await contract.checkDocumentHash.staticCall(userAddress, documentHash);
                setMessage(result ? "✓ Verification Passed: Hashes match." : "✗ Verification Failed: Hash mismatch.");
            } else if (action === 'verify') {
                const tx = await contract.verifyUser(userAddress, documentHash);
                await tx.wait();
                setMessage(`User Account ${userAddress.slice(0, 10)}... has been verified.`);
            } else {
                const tx = await contract.revokeUser(userAddress);
                await tx.wait();
                setMessage(`User Account ${userAddress.slice(0, 10)}... verification has been revoked.`);
            }
        } catch (error: any) {
             setMessage(`Error: ${error.reason || error.message || 'Operation failed'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem' }}>Verification Engine</h1>
                <p>Process pending identities and validate cryptographic certificates.</p>
            </div>

            <div className="glass" style={{ padding: '3.5rem' }}>
                <h3 style={{ marginBottom: '2.5rem', fontSize: '1.25rem', borderLeft: '4px solid #fff', paddingLeft: '1rem' }}>
                    Identity Validation
                </h3>
                
                {message && (
                    <div className="glass" style={{ 
                        padding: '1.2rem', 
                        marginBottom: '2.5rem', 
                        backgroundColor: (message.includes('Error') || message.includes('Failed')) ? 'rgba(255,68,68,0.05)' : 'rgba(0,255,136,0.05)',
                        borderLeft: `4px solid ${(message.includes('Error') || message.includes('Failed')) ? 'var(--error)' : 'var(--success)'}`,
                        color: (message.includes('Error') || message.includes('Failed')) ? 'var(--error)' : 'var(--success)',
                        fontWeight: 500,
                        fontSize: '0.95rem'
                    }}>
                        {message}
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label>Subject Wallet Address</label>
                            <input 
                                type="text" 
                                value={userAddress}
                                onChange={(e) => setUserAddress(e.target.value)}
                                placeholder="0x..."
                            />
                        </div>
                        <div>
                            <label>Certificate Hash (Off-chain)</label>
                            <input 
                                type="text" 
                                value={documentHash}
                                onChange={(e) => setDocumentHash(e.target.value)}
                                placeholder="Data hash to validate"
                            />
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button 
                            onClick={() => handleAction('check')}
                            disabled={loading || !userAddress || !documentHash}
                            className="btn btn-outline"
                        >
                            Compare Hashes
                        </button>
                        <button 
                            onClick={() => handleAction('verify')}
                            disabled={loading || !userAddress || !documentHash}
                            className="btn btn-primary"
                        >
                            Complete Verification
                        </button>
                        <button 
                            onClick={() => handleAction('revoke')}
                            disabled={loading || !userAddress}
                            className="btn btn-outline"
                            style={{ color: 'var(--error)', borderColor: 'rgba(255,68,68,0.2)' }}
                        >
                            Terminate Identity
                        </button>
                    </div>
                </div>
            </div>
            
            <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem' }}>
                <div className="glass" style={{ flex: 1, padding: '1.5rem', fontSize: '0.8rem' }}>
                    <strong>Protocol Standard:</strong> Always compare hashes before finalizing verification to maintain network integrity.
                </div>
                <div className="glass" style={{ flex: 1, padding: '1.5rem', fontSize: '0.8rem' }}>
                    <strong>Privacy Note:</strong> Document data is never shared. The browser only processes cryptographic commitments.
                </div>
            </div>
        </div>
    );
};

export default VerifierDashboard;
