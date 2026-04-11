import React, { useState, useEffect } from 'react';
import { Network, Activity, Users, Download, Search, Server, Cpu } from 'lucide-react';
import io from 'socket.io-client';

const socket: any = io('http://localhost:5050');

const PublicLedger: React.FC = () => {
    const [events, setEvents] = useState<any[]>([]);
    const [blockNumber, setBlockNumber] = useState(0);
    const [connected, setConnected] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        socket.on('connect', () => {
            console.log("Connected to Ledger Socket");
            setConnected(true);
        });
        socket.on('disconnect', () => setConnected(false));
        
        socket.on('new_event', (event: any) => {
            setEvents(prev => [event, ...prev].slice(0, 50));
        });

        socket.on('block_update', (data: any) => {
            setBlockNumber(data.number);
        });

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('new_event');
            socket.off('block_update');
        };
    }, []);

    const truncateStr = (str: string) => {
        if (!str) return '';
        if (str.length <= 10) return str;
        return `${str.substring(0, 6)}...${str.substring(str.length - 4)}`;
    };

    const filteredEvents = events.filter(ev => {
        const term = searchTerm.toLowerCase();
        return (ev.event?.toLowerCase().includes(term) ||
                ev.transactionHash?.toLowerCase().includes(term));
    });

    return (
        <div className="animate-in" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
                <div>
                    <h1 className="gradient-text" style={{ fontSize: '3rem', margin: '0 0 0.5rem 0', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <Network size={40} /> Real-Time Protocol Ledger
                    </h1>
                    <p className="sub-heading">
                        Immutable audit trail of on-chain identity commitments and verifications.
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div className="glass" style={{ padding: '0.5rem 1.25rem', border: '1px solid var(--border-glass)', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="live-indicator" style={{ 
                            width: '10px', height: '10px', borderRadius: '50%', 
                            background: connected ? 'var(--primary)' : 'var(--error)',
                            boxShadow: connected ? '0 0 10px var(--primary)' : 'none'
                        }}></div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: connected ? 'var(--primary)' : 'var(--error)' }}>
                            {connected ? 'NODE LIVE' : 'SYNCING...'}
                        </span>
                    </div>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginBottom: '3rem' }}>
                <div className="glass" style={{ padding: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div style={{ background: 'rgba(16,185,129,0.1)', padding: '1rem', borderRadius: '12px', color: 'var(--primary)' }}>
                        <Cpu size={32} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Current Block</div>
                        <div style={{ fontSize: '2rem', fontWeight: 800 }}>#{blockNumber}</div>
                    </div>
                </div>
                <div className="glass" style={{ padding: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div style={{ background: 'rgba(59,130,246,0.1)', padding: '1rem', borderRadius: '12px', color: 'var(--secondary)' }}>
                        <Activity size={32} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Events</div>
                        <div style={{ fontSize: '2rem', fontWeight: 800 }}>{events.length}</div>
                    </div>
                </div>
                <div className="glass" style={{ padding: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', color: '#fff' }}>
                        <Server size={32} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Network Status</div>
                        <div style={{ fontSize: '2rem', fontWeight: 800 }}>Healthy</div>
                    </div>
                </div>
            </div>

            <div className="glass" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: '350px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input 
                            type="text" 
                            placeholder="Filter by event name or Tx hash..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', paddingLeft: '2.8rem' }}
                        />
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                <th style={{ padding: '1.2rem 2rem', color: 'var(--text-dim)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>Block</th>
                                <th style={{ padding: '1.2rem 2rem', color: 'var(--text-dim)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>Transaction Hash</th>
                                <th style={{ padding: '1.2rem 2rem', color: 'var(--text-dim)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>Event</th>
                                <th style={{ padding: '1.2rem 2rem', color: 'var(--text-dim)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>Details</th>
                                <th style={{ padding: '1.2rem 2rem', color: 'var(--text-dim)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEvents.map((tx, idx) => (
                                <tr key={tx.transactionHash || idx} style={{ borderBottom: '1px solid var(--border-glass)', transition: 'background 0.2s' }} className="ledger-row">
                                    <td style={{ padding: '1.2rem 2rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                        #{tx.blockNumber}
                                    </td>
                                    <td style={{ padding: '1.2rem 2rem', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--secondary)' }}>
                                        {truncateStr(tx.transactionHash)}
                                    </td>
                                    <td style={{ padding: '1.2rem 2rem' }}>
                                        <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-glass)' }}>
                                            {tx.event}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1.2rem 2rem', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                                        {tx.event === 'DocumentVerified' ? 'Identity Anchored' : 
                                         tx.event === 'UserRegistered' ? 'New User Entry' : 
                                         tx.event === 'ZKProofVerified' ? 'Private Logic Validated' : 'Protocol Interaction'}
                                    </td>
                                    <td style={{ padding: '1.2rem 2rem' }}>
                                        <div className="badge badge-success">Finalized</div>
                                    </td>
                                </tr>
                            ))}
                            {filteredEvents.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        Waiting for network activity...
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <style>{`
                @keyframes pulse {
                    0% { transform: scale(0.95); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.7; }
                    100% { transform: scale(0.95); opacity: 1; }
                }
                .live-indicator {
                    animation: pulse 2s infinite;
                }
                .ledger-row {
                    animation: slideUp 0.4s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default PublicLedger;
