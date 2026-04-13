import React, { useState, useEffect } from 'react';
import { useBlockchain } from '../context/BlockchainContext';
import { useAuth } from '../context/AuthContext';
import { Users, Building2, FileText, Ban, CheckCircle, ShieldAlert } from 'lucide-react';

const AdminDashboard: React.FC = () => {
    const { isAdmin, account, multiSigContract, kycContract, isCorrectNetwork } = useBlockchain();
    const { user } = useAuth();
    
    const [stats, setStats] = useState({ users: 0, entities: 0, proofs: 0, bans: 0 });
    const [entities, setEntities] = useState<any[]>([]);
    const [proposals, setProposals] = useState<any[]>([]);
    const [bans, setBans] = useState<any[]>([]);
    const [requiredSigs, setRequiredSigs] = useState(2);
    const [connDebug, setConnDebug] = useState({ chainId: 'Unknown', address: 'Unknown' });
    
    const [formData, setFormData] = useState({
        entity_name: '',
        entity_type: 'Bank',
        wallet_address: '',
        kyc_agency: false
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const [manualVerifyData, setManualVerifyData] = useState({
        user_wallet: '',
        doc_type: 'Identity Certificate',
        doc_hash: ''
    });

    useEffect(() => {
        if ((isAdmin || user?.role === 'admin' || user?.role === 'government') && multiSigContract && kycContract && isCorrectNetwork) {
            console.log("Admin Dashboard detected: Fetching data for account:", account);
            fetchStats();
            fetchEntities();
            fetchProposals();
            fetchBans();
            
            multiSigContract.numConfirmationsRequired().then((res: any) => {
                setRequiredSigs(Number(res));
            }).catch(e => console.error("Error fetching required sigs:", e));

            // Diagnostic info
            (async () => {
                try {
                    const network = await multiSigContract.runner?.provider?.getNetwork();
                    const addr = await multiSigContract.getAddress();
                    setConnDebug({ 
                        chainId: network?.chainId.toString() || 'ERR', 
                        address: addr 
                    });
                } catch (e) {}
            })();
        }
    }, [isAdmin, user?.role, multiSigContract, kycContract, account, isCorrectNetwork]);

    const fetchStats = async () => {
        try {
            const res = await fetch('http://localhost:5050/api/admin/system-stats');
            if (res.ok) setStats(await res.json());
        } catch (e) {}
    };

    const fetchEntities = async () => {
        try {
            const res = await fetch('http://localhost:5050/api/admin/entities');
            if (res.ok) setEntities(await res.json());
        } catch (e) {}
    };

    const fetchProposals = async () => {
        if (!multiSigContract || !kycContract || !isCorrectNetwork) {
            console.log("fetchProposals skipped: missing contracts or wrong network", { multi: !!multiSigContract, kyc: !!kycContract, correctNetwork: isCorrectNetwork });
            return;
        }
        try {
            const countBig = await multiSigContract.getTransactionCount();
            const count = Number(countBig);
            console.log("On-chain Transaction Count:", count);
            
            const txs = [];
            for (let i = 0; i < count; i++) {
                try {
                    const tx = await multiSigContract.getTransaction(i);
                    console.log(`Transaction ${i} fetched:`, tx);
                    
                    const isExecuted = tx.executed !== undefined ? tx.executed : (tx[3] !== undefined ? tx[3] : false);
                    
                    if (!isExecuted) {
                        let isConf = false;
                        if (account) {
                            try {
                                isConf = await multiSigContract.isConfirmed(i, account);
                            } catch (err) {
                                console.warn(`Could not check confirmation status for tx ${i}`, err);
                            }
                        }
                        
                        const toAddress = tx.to || tx[0];
                        const confirmations = tx.numConfirmations !== undefined ? tx.numConfirmations : (tx[4] !== undefined ? tx[4] : 0);
                        const txData = tx.data || tx[2];
                        
                        console.log(`Adding non-executed proposal ${i}: to=${toAddress}, confirmations=${confirmations}`);
                        
                        txs.push({
                            proposal_id: i.toString(),
                            to: toAddress,
                            action_type: "Entity Registration",
                            proposed_by: "MultiSig Owner",
                            required_sigs: requiredSigs,
                            approvals: Array(Number(confirmations)).fill('sig'),
                            alreadyConfirmed: isConf,
                            data: txData
                        });
                    } else {
                        console.log(`Transaction ${i} skipped: already executed`);
                    }
                } catch (txErr) {
                    console.error(`Error fetching individual transaction ${i}:`, txErr);
                }
            }
            console.log("Setting proposals state with count:", txs.length);
            setProposals(txs);
        } catch (e) {
            console.error("CRITICAL: Error in fetchProposals", e);
        }
    };

    const fetchBans = async () => {
        try {
            const res = await fetch('http://localhost:5050/api/ban/proposals');
            if (res.ok) {
                const data = await res.json();
                setBans(data.filter((b: any) => b.status === 'executed'));
            }
        } catch (e) {}
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!multiSigContract || !kycContract) return;
        setLoading(true);
        setMessage('');
        try {
            let typeEnum = 1;
            if (formData.entity_type === 'Broker') typeEnum = 2;
            else if (formData.entity_type === 'Insurance') typeEnum = 3;
            else if (formData.entity_type === 'Investment') typeEnum = 4;

            const endpoint = formData.kyc_agency ? "agency" : "standard";
            
            // kycContract target might be string address or object
            const targetAddress = typeof kycContract.target === 'string' ? kycContract.target : await kycContract.getAddress();

            const data = kycContract.interface.encodeFunctionData("registerEntity", [
                formData.wallet_address,
                typeEnum,
                formData.entity_name,
                endpoint
            ]);

            const tx = await multiSigContract.submitTransaction(
                targetAddress,
                0,
                data
            );
            setMessage("Awaiting transaction confirmation...");
            await tx.wait();
            setMessage(`Proposal submitted successfully! (TxHash: ${tx.hash})`);
            setFormData({ entity_name: '', entity_type: 'Bank', wallet_address: '', kyc_agency: false });
            fetchProposals();
        } catch (err: any) {
            console.error("Submission Error", err);
            setMessage(`Error: ${err.reason || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleManualVerifySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!multiSigContract || !kycContract) return;
        setLoading(true);
        setMessage('');
        try {
            const targetAddress = typeof kycContract.target === 'string' ? kycContract.target : await kycContract.getAddress();

            const data = kycContract.interface.encodeFunctionData("verifyDocument", [
                manualVerifyData.user_wallet,
                manualVerifyData.doc_type,
                manualVerifyData.doc_hash
            ]);

            const tx = await multiSigContract.submitTransaction(
                targetAddress,
                0,
                data
            );
            setMessage("Awaiting transaction confirmation...");
            await tx.wait();
            setMessage(`Verification proposal submitted! (TxHash: ${tx.hash})`);
            setManualVerifyData({ user_wallet: '', doc_type: 'Identity Certificate', doc_hash: '' });
            fetchProposals();
        } catch (err: any) {
            console.error("Verification Proposal Error", err);
            setMessage(`Error: ${err.reason || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const approveProposal = async (proposal_id: string) => {
        if (!multiSigContract) return;
        try {
            const tx = await multiSigContract.confirmTransaction(Number(proposal_id));
            setMessage("Confirming transaction...");
            await tx.wait();
            setMessage("Transaction confirmed.");
            fetchProposals();
            fetchEntities();
        } catch (e: any) {
            console.error("Approve Error", e);
            setMessage(`Error confirming: ${e.reason || e.message}`);
        }
    };

    const executeProposal = async (proposal_id: string) => {
        if (!multiSigContract || !kycContract) return;
        try {
            const proposal = proposals.find(p => p.proposal_id === proposal_id);
            
            const tx = await multiSigContract.executeTransaction(Number(proposal_id));
            setMessage("Executing transaction...");
            await tx.wait();
            setMessage("Transaction executed successfully.");

            // Sync with backend if it was an entity registration
            if (proposal && proposal.data) {
                try {
                    const decoded = kycContract.interface.decodeFunctionData("registerEntity", proposal.data);
                    const walletAddress = decoded[0];
                    console.log("Syncing entity with backend:", walletAddress);
                    
                    const syncRes = await fetch('http://localhost:5050/api/admin/sync-entity', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'x-auth-token': localStorage.getItem('token') || '' 
                        },
                        body: JSON.stringify({ walletAddress })
                    });
                    
                    if (!syncRes.ok) {
                        const errData = await syncRes.json();
                        console.error("Sync failed:", errData.message);
                    } else {
                        console.log("Backend synced successfully.");
                    }
                } catch (syncErr) {
                    console.warn("Backend sync skipped or failed (might not be a registration tx):", syncErr);
                }
            }

            fetchProposals();
            fetchEntities();
        } catch (e: any) {
            console.error("Execute Error", e);
            setMessage(`Error executing: ${e.reason || e.message}`);
        }
    };

    if (!isAdmin && user?.role !== 'admin' && user?.role !== 'government') {
        return (
            <div className="fade-in" style={{ padding: '6rem 3rem', textAlign: 'center', marginTop: '4rem' }}>
                <div style={{ marginBottom: '1.5rem', color: 'var(--error)' }}><ShieldAlert size={64} /></div>
                <h2 style={{ fontSize: '2.5rem' }}>Access Denied</h2>
                <p style={{ color: 'var(--text-secondary)' }}>You must hold an on-chain AdminBadge to view this dashboard.</p>
            </div>
        );
    }

    return (
        <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>System Administration</h1>

            {/* 1. Stats bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                <div className="glass" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Users size={32} color="var(--accent)" />
                    <div><div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.users}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>TOTAL USERS</div></div>
                </div>
                <div className="glass" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Building2 size={32} color="var(--success)" />
                    <div><div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.entities}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ENTITIES</div></div>
                </div>
                <div className="glass" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <FileText size={32} color="var(--warning)" />
                    <div><div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.proofs}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ZK PROOFS</div></div>
                </div>
                <div className="glass" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Ban size={32} color="var(--error)" />
                    <div><div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.bans}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ACTIVE BANS</div></div>
                </div>
            </div>

            <div className="glass" style={{ padding: '1rem 2rem', marginBottom: '2rem', fontSize: '0.8rem', display: 'flex', gap: '2rem', color: 'var(--text-muted)' }}>
                <div><strong>Contract:</strong> {connDebug.address}</div>
                <div><strong>Chain ID:</strong> {connDebug.chainId}</div>
                <div><strong>User Wallet:</strong> {account || 'Not Connected'}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
                {/* 2. Register Entity Form */}
                <div className="glass" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--accent)', paddingLeft: '1rem' }}>Register Entity</h3>
                    {message && <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(59,130,246,0.1)', color: 'var(--accent)', borderRadius: '8px' }}>{message}</div>}
                    <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label>Entity Name</label>
                            <input type="text" value={formData.entity_name} onChange={e => setFormData({...formData, entity_name: e.target.value})} required />
                        </div>
                        <div>
                            <label>Entity Type</label>
                            <select value={formData.entity_type} onChange={e => setFormData({...formData, entity_type: e.target.value})} style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid var(--card-border)', borderRadius: '8px' }}>
                                <option value="Bank">Bank</option>
                                <option value="Broker">Broker</option>
                                <option value="Insurance">Insurance</option>
                                <option value="Investment">Investment</option>
                            </select>
                        </div>
                        <div>
                            <label>Wallet Address</label>
                            <input type="text" value={formData.wallet_address} onChange={e => setFormData({...formData, wallet_address: e.target.value})} placeholder="0x..." required />
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={formData.kyc_agency} onChange={e => setFormData({...formData, kyc_agency: e.target.checked})} style={{ width: 'auto' }} />
                            <span>Grant KYC Agency Permission (Issue Credentials)</span>
                        </label>
                        <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                            {loading ? 'Creating Proposal...' : 'Propose Registration'}
                        </button>
                    </form>
                </div>

                {/* 3. Pending Proposals Table */}
                <div className="glass" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--warning)', paddingLeft: '1rem' }}>Pending Proposals</h3>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {proposals.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No pending proposals.</p> : (
                            proposals.map(prop => (
                                <div key={prop.proposal_id} style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                            {prop.data && kycContract && prop.data.startsWith(kycContract.interface.getFunction("verifyDocument")?.selector) 
                                                ? "Document Verification" 
                                                : prop.action_type}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{prop.proposal_id}</div>
                                        <div style={{ fontSize: '0.8rem', marginTop: '0.3rem' }}>By: {prop.proposed_by.substring(0,6)}...</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                            {prop.approvals.length} of {requiredSigs}
                                        </div>
                                        {prop.approvals.length < requiredSigs && !prop.alreadyConfirmed && (
                                            <button onClick={() => approveProposal(prop.proposal_id)} className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', borderRadius: '8px', cursor: 'pointer' }}>
                                                Approve
                                            </button>
                                        )}
                                        {prop.approvals.length < requiredSigs && prop.alreadyConfirmed && (
                                            <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Voted</span>
                                        )}
                                        {prop.approvals.length >= requiredSigs && (
                                            <button onClick={() => executeProposal(prop.proposal_id)} className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                Execute
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginBottom: '3rem' }}>
                {/* 3. Manual Document Verification (Anchor) */}
                <div className="glass" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--success)', paddingLeft: '1rem' }}>Manual Document Verification (On-Chain Anchor)</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                        As a government official, use this form to manually verify a citizen's physical documents and anchor their cryptographic hash to the blockchain. 
                        This action requires MultiSig consensus.
                    </p>
                    <form onSubmit={handleManualVerifySubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', alignItems: 'end' }}>
                        <div>
                            <label>User Wallet Address</label>
                            <input 
                                type="text" 
                                value={manualVerifyData.user_wallet} 
                                onChange={e => setManualVerifyData({...manualVerifyData, user_wallet: e.target.value})} 
                                placeholder="0x..." 
                                required 
                            />
                        </div>
                        <div>
                            <label>Document Type</label>
                            <input 
                                type="text" 
                                value={manualVerifyData.doc_type} 
                                onChange={e => setManualVerifyData({...manualVerifyData, doc_type: e.target.value})} 
                                placeholder="e.g. Aadhar Card" 
                                required 
                            />
                        </div>
                        <div>
                            <label>Document Hash (Keccak256)</label>
                            <input 
                                type="text" 
                                value={manualVerifyData.doc_hash} 
                                onChange={e => setManualVerifyData({...manualVerifyData, doc_hash: e.target.value})} 
                                placeholder="0x..." 
                                required 
                            />
                        </div>
                        <div style={{ gridColumn: 'span 3' }}>
                            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', background: 'var(--success)', color: '#000' }}>
                                {loading ? 'Submitting proposal...' : 'Propose On-Chain Verification'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* 4. Registered Entities */}
            <div className="glass" style={{ padding: '2rem', marginBottom: '3rem' }}>
                <h3 style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--success)', paddingLeft: '1rem' }}>Registered Entities</h3>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                            <th style={{ padding: '1rem' }}>NAME</th>
                            <th style={{ padding: '1rem' }}>TYPE</th>
                            <th style={{ padding: '1rem' }}>WALLET</th>
                            <th style={{ padding: '1rem' }}>PERMISSIONS</th>
                            <th style={{ padding: '1rem' }}>STATUS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entities.map(e => (
                            <tr key={e.entity_id} style={{ borderBottom: '1px solid var(--card-border)' }}>
                                <td style={{ padding: '1rem', fontWeight: 600 }}>{e.entity_name}</td>
                                <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{e.entity_type}</td>
                                <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.9rem' }}>{e.wallet_address.substring(0,8)}...</td>
                                <td style={{ padding: '1rem', fontSize: '0.8rem' }}>{e.kyc_agency ? <span style={{ color: 'var(--warning)' }}>KYC Agency</span> : 'Standard'}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span className="status-badge status-verified"><CheckCircle size={12} style={{ display: 'inline' }} /> Active</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 5. Active Bans */}
            <div className="glass" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--error)', paddingLeft: '1rem' }}>Active Network Bans</h3>
                {bans.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No active bans in the system.</p> : (
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '1rem' }}>TARGET USER</th>
                                <th style={{ padding: '1rem' }}>REASON</th>
                                <th style={{ padding: '1rem' }}>EXECUTION DATE</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bans.map(b => (
                                <tr key={b.proposal_id} style={{ borderBottom: '1px solid var(--card-border)' }}>
                                    <td style={{ padding: '1rem', fontFamily: 'monospace', color: 'var(--error)' }}>{b.target_user_id}</td>
                                    <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{b.reason}</td>
                                    <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{new Date(b.executed_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
