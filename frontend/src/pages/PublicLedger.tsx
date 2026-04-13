import React, { useState, useEffect } from 'react';
import { Network, Activity, Users, Download, Search, Server, Cpu, ExternalLink, X, FileText, Clock, Hash } from 'lucide-react';
import io from 'socket.io-client';

const socket: any = io('http://localhost:5050');

const PublicLedger: React.FC = () => {
    const [events, setEvents] = useState<any[]>([]);
    const [blockNumber, setBlockNumber] = useState(0);
    const [connected, setConnected] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEvent, setSelectedEvent] = useState<any>(null);

    useEffect(() => {
        fetchHistory();

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

    const fetchHistory = async () => {
        try {
            const res = await fetch('http://localhost:5050/api/ledger/history');
            if (res.ok) {
                const data = await res.json();
                setEvents(data);
                if (data.length > 0) setBlockNumber(data[0].blockNumber);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const truncateStr = (str: string) => {
        if (!str) return '';
        if (str.length <= 16) return str;
        return `${str.substring(0, 10)}...${str.substring(str.length - 6)}`;
    };

    const getEventPurpose = (ev: any) => {
        switch (ev.event) {
            case 'UserRegistered': return 'New identity registered on decentralized protocol.';
            case 'DocumentVerified': return 'Trust anchor established for user document.';
            case 'AccessGranted': return 'User granted data visibility to institution.';
            case 'EntityRegistered': return 'New trusted entity approved via governance.';
            case 'ZKProofVerified': return 'Selective disclosure proof validated on-chain.';
            case 'ZKProofRevoked': return 'User revoked their cryptographic anchor on-chain.';
            case 'SubmitTransaction': return 'New governance proposal submitted for voting.';
            case 'ConfirmTransaction': return 'Decentralized consensus vote cast by owner.';
            case 'ExecuteTransaction': return 'Consensus reached: Proposal executed on-chain.';
            default: return 'System-level protocol interaction.';
        }
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
                            style={{ width: '100%', paddingLeft: '2.8rem', background: 'rgba(0,0,0,0.3)' }}
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
                                <tr 
                                    key={tx.transactionHash || idx} 
                                    onClick={() => setSelectedEvent(tx)}
                                    style={{ borderBottom: '1px solid var(--border-glass)', transition: 'background 0.2s', cursor: 'pointer' }} 
                                    className="ledger-row"
                                >
                                    <td style={{ padding: '1.2rem 2rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                        #{tx.blockNumber}
                                    </td>
                                    <td style={{ padding: '1.2rem 2rem', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--secondary)' }}>
                                        {truncateStr(tx.transactionHash)}
                                    </td>
                                    <td style={{ padding: '1.2rem 2rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-glass)', width: 'fit-content' }}>
                                                {tx.event}
                                            </span>
                                            <span style={{ fontSize: '0.65rem', color: tx.contractType === 'MultiSig' ? 'var(--warning)' : 'var(--primary)', fontWeight: 800 }}>
                                                {tx.contractType?.toUpperCase()}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.2rem 2rem', fontSize: '0.85rem', color: 'var(--text-dim)', maxWidth: '400px' }}>
                                        {getEventPurpose(tx)}
                                    </td>
                                    <td style={{ padding: '1.2rem 2rem' }}>
                                        <div className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            Finalized <ExternalLink size={10} />
                                        </div>
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

            {/* TRANSACTION DETAIL MODAL */}
            {selectedEvent && (
                <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
                    <div className="glass modal-content animate-in" onClick={e => e.stopPropagation()} style={{ padding: '3rem', maxWidth: '700px', width: '90%', position: 'relative' }}>
                        <button onClick={() => setSelectedEvent(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                            <div style={{ background: 'rgba(16,185,129,0.1)', padding: '1rem', borderRadius: '12px', color: 'var(--primary)' }}>
                                <FileText size={32} />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.8rem' }}>Transaction Inspector</h2>
                                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Immutable Cryptographic Receipt</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="detail-item">
                                <label><Hash size={14} /> Transaction Hash</label>
                                <div style={{ fontFamily: 'monospace', wordBreak: 'break-all', color: 'var(--secondary)', background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '8px' }}>
                                    {selectedEvent.transactionHash}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="detail-item">
                                    <label><Cpu size={14} /> Block Number</label>
                                    <div className="detail-val">#{selectedEvent.blockNumber}</div>
                                </div>
                                <div className="detail-item">
                                    <label><Clock size={14} /> Timestamp</label>
                                    <div className="detail-val">{new Date(selectedEvent.timestamp).toLocaleString()}</div>
                                </div>
                            </div>

                            <div className="detail-item">
                                <label><Activity size={14} /> Protocol Event</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span className="badge" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>{selectedEvent.event}</span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>via {selectedEvent.contractType} Contract</span>
                                </div>
                                <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: 'var(--text-dim)' }}>{getEventPurpose(selectedEvent)}</p>
                            </div>

                            <div className="detail-item">
                                <label><Users size={14} /> Decoded Arguments</label>
                                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.25rem', borderRadius: '12px' }}>
                                    {selectedEvent.args && selectedEvent.args.length > 0 ? (
                                        <ul style={{ margin: 0, paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {selectedEvent.args.map((arg: any, i: number) => (
                                                <li key={i} style={{ fontSize: '0.85rem' }}>
                                                    <span style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }}>Param {i}:</span>
                                                    <span style={{ fontFamily: 'monospace', color: '#fff', wordBreak: 'break-all' }}>{arg}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No additional parameters for this event.</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button 
                            className="btn btn-primary" 
                            style={{ width: '100%', marginTop: '3rem' }}
                            onClick={() => setSelectedEvent(null)}
                        >
                            Close Inspector
                        </button>
                    </div>
                </div>
            )}
            
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
                .ledger-row:hover {
                    background: rgba(255,255,255,0.05) !important;
                }
                .modal-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.8); backdrop-filter: blur(8px);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 1000;
                }
                .detail-item label {
                    display: flex; align-items: center; gap: 0.5rem;
                    font-size: 0.7rem; text-transform: uppercase; font-weight: 800;
                    color: var(--text-muted); margin-bottom: 0.5rem;
                }
                .detail-val {
                    font-size: 1.2rem; font-weight: 700; color: #fff;
                }
            `}</style>
        </div>
    );
};

export default PublicLedger;

