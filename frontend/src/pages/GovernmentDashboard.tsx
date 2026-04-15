import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBlockchain } from '../context/BlockchainContext';
import { ShieldAlert, FileCheck2, Gavel, BadgeCheck } from 'lucide-react';

const GovernmentDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const { isGovernment, account, multiSigContract, kycContract, isCorrectNetwork } = useBlockchain();

  const [requiredSigs, setRequiredSigs] = useState(2);
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [manualVerifyData, setManualVerifyData] = useState({
    user_wallet: '',
    doc_type: 'Identity Certificate',
    doc_hash: '',
  });

  const [attrData, setAttrData] = useState({
    user_wallet: '',
    age: '',
    income: '',
  });

  const canAccess = useMemo(() => {
    // Only explicit government users should access this console.
    return Boolean(user?.role === 'government' || isGovernment);
  }, [user?.role, isGovernment]);

  useEffect(() => {
    if (!canAccess || !multiSigContract || !kycContract || !isCorrectNetwork) return;

    multiSigContract
      .numConfirmationsRequired()
      .then((res: any) => setRequiredSigs(Number(res)))
      .catch(() => {});
  }, [canAccess, multiSigContract, kycContract, isCorrectNetwork]);

  const fetchProposals = async () => {
    if (!multiSigContract || !kycContract || !isCorrectNetwork) return;

    try {
      const countBig = await multiSigContract.getTransactionCount();
      const count = Number(countBig);
      const txs = [];

      for (let i = 0; i < count; i++) {
        const tx = await multiSigContract.getTransaction(i);
        const isExecuted = tx.executed !== undefined ? tx.executed : (tx[3] !== undefined ? tx[3] : false);
        if (isExecuted) continue;

        let isConf = false;
        if (account) {
          try {
            isConf = await multiSigContract.isConfirmed(i, account);
          } catch {}
        }

        const confirmations = tx.numConfirmations !== undefined ? tx.numConfirmations : (tx[4] !== undefined ? tx[4] : 0);
        const txData = tx.data || tx[2];

        txs.push({
          proposal_id: i.toString(),
          confirmations: Number(confirmations),
          alreadyConfirmed: isConf,
          data: txData,
        });
      }

      setProposals(txs);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!canAccess || !multiSigContract || !kycContract || !isCorrectNetwork) return;
    fetchProposals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAccess, multiSigContract, kycContract, isCorrectNetwork, account]);

  const approveProposal = async (proposal_id: string) => {
    if (!multiSigContract) return;
    try {
      setMessage('');
      const tx = await multiSigContract.confirmTransaction(Number(proposal_id));
      setMessage('Confirming transaction...');
      await tx.wait();
      setMessage('Transaction confirmed.');
      fetchProposals();
    } catch (e: any) {
      console.error(e);
      setMessage(`Error confirming: ${e.reason || e.message}`);
    }
  };

  const executeProposal = async (proposal_id: string) => {
    if (!multiSigContract) return;
    try {
      setMessage('');
      const tx = await multiSigContract.executeTransaction(Number(proposal_id));
      setMessage('Executing transaction...');
      await tx.wait();
      setMessage('Transaction executed successfully.');
      fetchProposals();
    } catch (e: any) {
      console.error(e);
      setMessage(`Error executing: ${e.reason || e.message}`);
    }
  };

  const handleManualVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!multiSigContract || !kycContract) return;
    setLoading(true);
    setMessage('');
    try {
      const targetAddress = typeof kycContract.target === 'string' ? kycContract.target : await kycContract.getAddress();
      const data = kycContract.interface.encodeFunctionData('verifyDocument', [
        manualVerifyData.user_wallet,
        manualVerifyData.doc_type,
        manualVerifyData.doc_hash,
      ]);

      const tx = await multiSigContract.submitTransaction(targetAddress, 0, data);
      setMessage('Awaiting transaction confirmation...');
      await tx.wait();
      setMessage(`Verification proposal submitted! (TxHash: ${tx.hash})`);
      setManualVerifyData({ user_wallet: '', doc_type: 'Identity Certificate', doc_hash: '' });
      fetchProposals();
    } catch (err: any) {
      console.error(err);
      setMessage(`Error: ${err.reason || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSetVerifiedAttributes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('http://localhost:5050/api/admin/verified-attributes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({
          userWallet: attrData.user_wallet,
          age: attrData.age === '' ? undefined : Number(attrData.age),
          income: attrData.income === '' ? undefined : Number(attrData.income),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to set verified attributes');
      setMessage('Verified attributes updated for ZK proofs.');
      setAttrData({ user_wallet: '', age: '', income: '' });
    } catch (err: any) {
      console.error(err);
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!canAccess) {
    return (
      <div className="fade-in" style={{ padding: '6rem 3rem', textAlign: 'center', marginTop: '4rem' }}>
        <div style={{ marginBottom: '1.5rem', color: 'var(--error)' }}>
          <ShieldAlert size={64} />
        </div>
        <h2 style={{ fontSize: '2.5rem' }}>Access Denied</h2>
        <p style={{ color: 'var(--text-secondary)' }}>This portal is restricted to government accounts.</p>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '4rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Government Console</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Manual document verification + multisig execution only.
        </p>
      </div>

      {message && (
        <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(59,130,246,0.1)', color: 'var(--accent)', borderRadius: '8px' }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        <div className="glass" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', borderLeft: '4px solid var(--success)', paddingLeft: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileCheck2 size={18} /> Propose Document Anchor (MultiSig)
          </h3>
          <form onSubmit={handleManualVerifySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label>User Wallet Address</label>
              <input
                type="text"
                value={manualVerifyData.user_wallet}
                onChange={(e) => setManualVerifyData({ ...manualVerifyData, user_wallet: e.target.value })}
                placeholder="0x..."
                required
              />
            </div>
            <div>
              <label>Document Type</label>
              <input
                type="text"
                value={manualVerifyData.doc_type}
                onChange={(e) => setManualVerifyData({ ...manualVerifyData, doc_type: e.target.value })}
                placeholder="e.g. Aadhar Card"
                required
              />
            </div>
            <div>
              <label>Document Hash (Keccak256)</label>
              <input
                type="text"
                value={manualVerifyData.doc_hash}
                onChange={(e) => setManualVerifyData({ ...manualVerifyData, doc_hash: e.target.value })}
                placeholder="0x..."
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', background: 'var(--success)', color: '#000' }}>
              {loading ? 'Submitting...' : 'Submit Proposal'}
            </button>
          </form>
        </div>

        <div className="glass" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', borderLeft: '4px solid var(--warning)', paddingLeft: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Gavel size={18} /> Pending MultiSig Proposals
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Confirm until \( {requiredSigs} \) signatures, then execute.
          </p>
          <div style={{ maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {proposals.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No pending proposals.</p>
            ) : (
              proposals.map((p) => (
                <div key={p.proposal_id} style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Proposal #{p.proposal_id}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Approvals: {p.confirmations} / {requiredSigs}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {p.confirmations < requiredSigs && !p.alreadyConfirmed && (
                      <button onClick={() => approveProposal(p.proposal_id)} className="btn btn-outline" style={{ fontSize: '0.8rem' }}>
                        Confirm
                      </button>
                    )}
                    {p.confirmations < requiredSigs && p.alreadyConfirmed && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Confirmed</span>
                    )}
                    {p.confirmations >= requiredSigs && (
                      <button onClick={() => executeProposal(p.proposal_id)} className="btn btn-primary" style={{ fontSize: '0.8rem' }}>
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

      <div className="glass" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', borderLeft: '4px solid var(--accent)', paddingLeft: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BadgeCheck size={18} /> Verified Attributes (for ZK proofs)
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          This prevents users from typing arbitrary values when generating proofs (the prover uses government-verified values).
        </p>
        <form onSubmit={handleSetVerifiedAttributes} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label>User Wallet</label>
            <input
              type="text"
              value={attrData.user_wallet}
              onChange={(e) => setAttrData({ ...attrData, user_wallet: e.target.value })}
              placeholder="0x..."
              required
            />
          </div>
          <div>
            <label>Verified Age</label>
            <input type="number" value={attrData.age} onChange={(e) => setAttrData({ ...attrData, age: e.target.value })} placeholder="e.g. 25" />
          </div>
          <div>
            <label>Verified Income</label>
            <input type="number" value={attrData.income} onChange={(e) => setAttrData({ ...attrData, income: e.target.value })} placeholder="e.g. 80000" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>
              {loading ? 'Saving...' : 'Save Verified Attributes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GovernmentDashboard;

