import React, { useState } from 'react';
import { useBlockchain } from '../context/BlockchainContext';

const AdminDashboard: React.FC = () => {
    const { isAdmin, contract } = useBlockchain();
    const [verifierAddress, setVerifierAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    if (!isAdmin) {
        return (
            <div className="glass fade-in" style={{ padding: '6rem 3rem', textAlign: 'center', marginTop: '4rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1.5rem', color: 'var(--error)' }}>⚠</div>
                <h2 style={{ fontSize: '2rem' }}>Access Denied</h2>
                <p>Only the protocol administrator can access this management portal.</p>
            </div>
        );
    }

    const handleAction = async (action: 'add' | 'remove') => {
        if (!contract || !verifierAddress) return;
        
        setLoading(true);
        setMessage('');
        try {
            const tx = action === 'add' 
                ? await contract.addVerifier(verifierAddress) 
                : await contract.removeVerifier(verifierAddress);
            await tx.wait();
            setMessage(`Protocol Updated: Successfully ${action === 'add' ? 'authorized' : 'revoked'} ${verifierAddress.slice(0, 10)}...`);
            setVerifierAddress('');
        } catch (error: any) {
            setMessage(`Protocol Error: ${error.reason || error.message || 'Operation failed'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fade-in" style={{ maxWidth: '700px', margin: '0 auto' }}>
            <div style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem' }}>Network Administration</h1>
                <p>Manage node authorize states and verifier permissions.</p>
            </div>

            <div className="glass" style={{ padding: '3rem' }}>
                <h3 style={{ marginBottom: '2rem', fontSize: '1.25rem', borderLeft: '4px solid #fff', paddingLeft: '1rem' }}>
                    Verifier Management
                </h3>
                
                {message && (
                    <div className="glass" style={{ 
                        padding: '1rem', 
                        marginBottom: '2rem', 
                        backgroundColor: message.includes('Error') ? 'rgba(255,68,68,0.05)' : 'rgba(0,255,136,0.05)',
                        borderLeft: `4px solid ${message.includes('Error') ? 'var(--error)' : 'var(--success)'}`,
                        color: message.includes('Error') ? 'var(--error)' : 'var(--success)',
                        fontSize: '0.9rem'
                    }}>
                        {message}
                    </div>
                )}

                <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div>
                        <label>Ethereum Wallet Address</label>
                        <input 
                            type="text" 
                            value={verifierAddress}
                            onChange={(e) => setVerifierAddress(e.target.value)}
                            placeholder="0x..."
                            required
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button 
                            onClick={() => handleAction('add')}
                            disabled={loading || !verifierAddress}
                            className="btn btn-primary"
                            style={{ flex: 1 }}
                        >
                            {loading ? 'Processing...' : 'Authorize Verifier'}
                        </button>
                        <button 
                            onClick={() => handleAction('remove')}
                            disabled={loading || !verifierAddress}
                            className="btn btn-outline"
                            style={{ flex: 1 }}
                        >
                            {loading ? 'Processing...' : 'Revoke Access'}
                        </button>
                    </div>
                </form>
            </div>
            
            <div style={{ marginTop: '3rem', padding: '2rem' }} className="glass">
                <p style={{ fontSize: '0.85rem' }}>
                    <strong>Note:</strong> All administrative actions are recorded on-chain. revoking access will immediately disconnect the verifier from the protocol.
                </p>
            </div>
        </div>
    );
};

export default AdminDashboard;
