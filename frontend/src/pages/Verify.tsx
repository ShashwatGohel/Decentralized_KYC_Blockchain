import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBlockchain } from '../context/BlockchainContext';
import { RefreshCw, Zap, Lock, Globe, ShieldCheck, User, Banknote, BarChart3, CheckCircle2 } from 'lucide-react';

const PROOF_CIRCUITS = [
    {
        id: 'age_verify',
        title: 'Age Verification',
        icon: <User size={24} />,
        description: 'Prove you are 18 or older without revealing your actual age.',
        fields: [
            { name: 'age', label: 'Your Private Age', type: 'number', placeholder: 'e.g. 25' },
            { name: 'min_age', label: 'Minimum Threshold (Public)', type: 'number', placeholder: '18', defaultValue: '18' }
        ]
    },
    {
        id: 'income_verify',
        title: 'Income Verification',
        icon: <Banknote size={24} />, 
        description: 'Prove your income meets a threshold without revealing the exact amount.',
        fields: [
            { name: 'income', label: 'Your Private Income', type: 'number', placeholder: 'e.g. 80000' },
            { name: 'threshold', label: 'Minimum Threshold (Public)', type: 'number', placeholder: '50000', defaultValue: '50000' }
        ]
    }
];

const Verify: React.FC = () => {
    const { token } = useAuth();
    const { kycContract, account } = useBlockchain();

    const [inputs, setInputs] = useState<Record<string, Record<string, string>>>({});
    const [loadingCircuit, setLoadingCircuit] = useState<string | null>(null);
    const [results, setResults] = useState<Record<string, any>>({});
    const [status, setStatus] = useState<Record<string, string>>({});

    const updateField = (circuitId: string, fieldName: string, value: string) => {
        setInputs(prev => ({
            ...prev,
            [circuitId]: { ...prev[circuitId], [fieldName]: value }
        }));
    };

    const handleGenerateAndVerify = async (circuitId: string) => {
        if (!token || !kycContract || !account) return;

        setLoadingCircuit(circuitId);
        setStatus(prev => ({ ...prev, [circuitId]: 'Generating Cryptographic Proof...' }));

        try {
            const circuit = PROOF_CIRCUITS.find(c => c.id === circuitId)!;
            const payload: any = {};
            circuit.fields.forEach(f => {
                payload[f.name] = inputs[circuitId]?.[f.name] || f.defaultValue;
            });

            // 1. Generate Proof via Backend
            const res = await fetch('http://localhost:5050/api/proof/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ circuit_type: circuitId, inputs: payload })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setStatus(prev => ({ ...prev, [circuitId]: 'Proof Generated. Submitting to Blockchain...' }));

            // 2. Format Proof for Solidity (Groth16 Verifier Format)
            const pA = data.proof.pi_a.slice(0, 2);
            const pB = [
                data.proof.pi_b[0].slice(0, 2).reverse(),
                data.proof.pi_b[1].slice(0, 2).reverse()
            ];
            const pC = data.proof.pi_c.slice(0, 2);
            const pubSignals = data.public_signals;

            // 3. Verify on Blockchain
            const tx = await kycContract.verifySelectiveDisclosure(
                account,
                circuitId,
                pA,
                pB,
                pC,
                pubSignals
            );
            
            await tx.wait();
            
            setResults(prev => ({ ...prev, [circuitId]: { ...data, verified: true } }));
            setStatus(prev => ({ ...prev, [circuitId]: 'Verification Successful!' }));

        } catch (err: any) {
            console.error(err);
            setStatus(prev => ({ ...prev, [circuitId]: `Error: ${err.reason || err.message}` }));
        } finally {
            setLoadingCircuit(null);
        }
    };

    return (
        <div className="animate-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <h1 className="gradient-text" style={{ fontSize: '3rem' }}>Selective Disclosure</h1>
                <p className="sub-heading">Prove specific attributes of your identity while maintaining 100% privacy.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {PROOF_CIRCUITS.map(circuit => {
                    const result = results[circuit.id];
                    const msg = status[circuit.id];
                    const isLoading = loadingCircuit === circuit.id;

                    return (
                        <div key={circuit.id} className="glass" style={{ padding: '2.5rem', border: result?.verified ? '1px solid var(--primary)' : '1px solid var(--border-glass)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ color: 'var(--primary)' }}>{circuit.icon}</div>
                                <h3 style={{ margin: 0 }}>{circuit.title}</h3>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '2rem' }}>{circuit.description}</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
                                {circuit.fields.map(field => (
                                    <div key={field.name}>
                                        <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>
                                            {field.label} {field.name === 'age' || field.name === 'income' ? <Lock size={10} /> : <Globe size={10} />}
                                        </label>
                                        <input
                                            type={field.type}
                                            placeholder={field.placeholder}
                                            value={inputs[circuit.id]?.[field.name] || field.defaultValue || ''}
                                            onChange={(e) => updateField(circuit.id, field.name, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>

                            <button
                                className="btn btn-primary"
                                onClick={() => handleGenerateAndVerify(circuit.id)}
                                disabled={isLoading || !token}
                                style={{ width: '100%' }}
                            >
                                {isLoading ? <><RefreshCw size={16} className="spin" /> Processing...</> : <><Zap size={16} /> Generate & Verify Proof</> }
                            </button>

                            {msg && (
                                <div style={{ 
                                    marginTop: '1.5rem', padding: '1rem', borderRadius: '8px', 
                                    background: msg.includes('Error') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                    color: msg.includes('Error') ? 'var(--error)' : 'var(--primary)',
                                    fontSize: '0.85rem', fontWeight: 500
                                }}>
                                    {msg.includes('Successful') && <CheckCircle2 size={16} style={{ marginRight: '0.5rem' }} />}
                                    {msg}
                                </div>
                            )}

                            {result?.verified && (
                                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', fontSize: '0.75rem' }}>
                                    <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>PROOFS ARE ANCHORED</div>
                                    <div style={{ fontFamily: 'monospace', wordBreak: 'break-all', opacity: 0.7 }}>
                                        Public Signals: {JSON.stringify(result.public_signals)}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                <div className="glass" style={{ padding: '1.5rem' }}>
                    <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Mathematical Truth</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Verifier checks the proof against the circuit constraints on-chain, not the data.</p>
                </div>
                <div className="glass" style={{ padding: '1.5rem' }}>
                    <h4 style={{ color: 'var(--secondary)', marginBottom: '0.5rem' }}>Full Privacy</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>The bank only knows "Age {'>'} 18" but never your actual birthdate or name.</p>
                </div>
                <div className="glass" style={{ padding: '1.5rem' }}>
                    <h4 style={{ color: '#fff', marginBottom: '0.5rem' }}>One-Step Trust</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Once verified, the result is stored in the blockchain's history for all entities to trust.</p>
                </div>
            </div>

            <style>{`
                input { background: rgba(0,0,0,0.4); border-color: rgba(255,255,255,0.1); }
            `}</style>
        </div>
    );
};

export default Verify;
