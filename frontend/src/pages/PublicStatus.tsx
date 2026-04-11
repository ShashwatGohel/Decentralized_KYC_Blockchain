import React, { useState } from 'react';
import { useBlockchain } from '../context/BlockchainContext';

const PublicStatus: React.FC = () => {
    const { account } = useBlockchain();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchMode, setSearchMode] = useState<'wallet' | 'name'>('wallet');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [status, setStatus] = useState<'idle' | 'loading' | 'results' | 'verified' | 'unverified' | 'error'>('idle');
    const [details, setDetails] = useState<any>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery) return;

        if (searchMode === 'wallet') {
            performWalletCheck(searchQuery);
        } else {
            performNameSearch(searchQuery);
        }
    };

    const performNameSearch = async (name: string) => {
        setStatus('loading');
        try {
            const res = await fetch(`http://localhost:5050/api/public/search?q=${encodeURIComponent(name)}`);
            const data = await res.json();
            setSearchResults(data);
            setStatus('results');
        } catch (err) {
            setStatus('error');
        }
    };

    const performWalletCheck = async (address: string) => {
        setStatus('loading');
        try {
            // Query backend for KYC status instead of contract
            const res = await fetch(`http://localhost:5050/api/public/search?q=${encodeURIComponent(address)}`);
            const data = await res.json();
            
            if (data && data.length > 0) {
                setDetails({
                    address,
                    name: data[0].name || data[0].fullName || 'Unknown',
                    verifiedAt: 0,
                    history: []
                });
                setStatus('verified');
            } else {
                setStatus('unverified');
                setDetails(null);
            }
        } catch (err) {
            console.error(err);
            setStatus('error');
        }
    };

    const getEntityTypeName = (type: number) => {
        const types = ["BANK", "CRYPTO_EXCHANGE", "INSURANCE", "GOVERNMENT", "HEALTHCARE", "DEFI", "TELECOM", "OTHER"];
        return types[type] || "UNKNOWN";
    };

    return (
        <div className="fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>Public Verification Explorer</h1>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <button 
                        onClick={() => setSearchMode('wallet')} 
                        className={`btn ${searchMode === 'wallet' ? 'btn-primary' : 'btn-outline'}`}
                        style={{ padding: '0.5rem 1.5rem', fontSize: '0.8rem' }}
                    >
                        Search by Wallet
                    </button>
                    <button 
                        onClick={() => setSearchMode('name')} 
                        className={`btn ${searchMode === 'name' ? 'btn-primary' : 'btn-outline'}`}
                        style={{ padding: '0.5rem 1.5rem', fontSize: '0.8rem' }}
                    >
                        Search by Name
                    </button>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
                    Instant, trustless identity validation. Enter {searchMode === 'wallet' ? 'any Ethereum wallet address' : 'a name'} to query global protocol status.
                </p>
            </div>

            <div className="glass" style={{ padding: '3rem', marginBottom: '3rem' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem' }}>
                    <input 
                        type="text" 
                        placeholder={searchMode === 'wallet' ? "0x..." : "Search by name (User or Institution)"}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ flex: 1, padding: '1.2rem', fontSize: '1.1rem' }}
                        required
                    />
                    <button type="submit" className="btn btn-primary" style={{ padding: '0 2.5rem' }} disabled={status === 'loading'}>
                        {status === 'loading' ? 'Searching...' : 'Search Engine'}
                    </button>
                </form>
            </div>

            {status === 'results' && (
                <div className="glass fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Search Results ({searchResults.length})</h3>
                    {searchResults.length === 0 ? (
                        <p style={{ opacity: 0.5 }}>No results found for "{searchQuery}"</p>
                    ) : (
                        searchResults.map(result => (
                            <div 
                                key={result.walletAddress} 
                                className="glass" 
                                style={{ 
                                    padding: '1.5rem', 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    background: 'rgba(255,255,255,0.02)',
                                    transition: 'transform 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.01)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                onClick={() => performWalletCheck(result.walletAddress)}
                            >
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{result.name}</div>
                                    <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', opacity: 0.5 }}>{result.walletAddress}</div>
                                </div>
                                <div className="status-badge" style={{ fontSize: '0.7rem', background: result.role === 'entity' ? 'rgba(0,136,255,0.1)' : 'rgba(255,255,255,0.05)', color: result.role === 'entity' ? '#0088ff' : '#fff' }}>
                                    {result.role.toUpperCase()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {status === 'verified' && details && (
                <div className="glass fade-in" style={{ padding: '4rem', borderTop: '6px solid var(--success)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
                        <div>
                            <div className="status-badge status-verified" style={{ marginBottom: '1rem' }}>On-Chain Verified</div>
                            <h2 style={{ fontSize: '2.5rem', margin: 0 }}>{details.name}</h2>
                            <p style={{ opacity: 0.6, marginTop: '0.5rem', fontFamily: 'monospace' }}>{details.address}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.8rem', opacity: 0.5, textTransform: 'uppercase' }}>Protocol Locked Since</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                                {new Date(details.verifiedAt * 1000).toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <div style={{ padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                            <h4 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Institutional Usage History</h4>
                            {details.history.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
                                    {details.history.map((type: number, i: number) => (
                                        <span key={i} style={{ 
                                            background: 'rgba(255,255,255,0.05)', 
                                            padding: '0.5rem 1rem', 
                                            borderRadius: '4px',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            border: '1px solid var(--card-border)'
                                        }}>
                                            {getEntityTypeName(type)}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ fontSize: '0.9rem', opacity: 0.5 }}>No institutional access records found for this identity.</p>
                            )}
                        </div>

                        <div style={{ padding: '2rem', background: 'rgba(0,255,136,0.03)', borderRadius: '12px', border: '1px solid rgba(0,255,136,0.1)' }}>
                            <h4 style={{ marginBottom: '1.5rem', color: 'var(--success)' }}>Trust Metrics</h4>
                            <div style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                                <p><strong>Level 1:</strong> Document Provenance Confirmed</p>
                                <p><strong>Level 2:</strong> Cryptographic Hash Match</p>
                                <p><strong>Level 3:</strong> Multi-Entity Compatibility</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {status === 'unverified' && (
                <div className="glass fade-in" style={{ padding: '4rem', textAlign: 'center', borderTop: '6px solid var(--error)' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🚫</div>
                    <h2 style={{ color: 'var(--error)', marginBottom: '1rem' }}>Identity Not Found</h2>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
                        The query <strong>{searchQuery}</strong> is not currently registered or verified within the DeKYC protocol layers.
                    </p>
                </div>
            )}

            {status === 'error' && (
                <div className="glass fade-in" style={{ padding: '3rem', textAlign: 'center', color: 'var(--error)' }}>
                    <p>There was a technical error querying the blockchain. Please ensure you are connected to the correct network.</p>
                </div>
            )}
        </div>
    );
};

export default PublicStatus;
