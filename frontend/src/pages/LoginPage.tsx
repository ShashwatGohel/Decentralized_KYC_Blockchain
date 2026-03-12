import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBlockchain } from '../context/BlockchainContext';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        fullName: '',
        role: 'user',
        entityName: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, signup } = useAuth();
    const { account, connectWallet } = useBlockchain();
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // 1. Enforce Wallet Connection First
            let currentAccount = window.ethereum?.selectedAddress || account;

            if (!currentAccount) {
                 setError('⚠️ Identity Wallet Required. Connecting to MetaMask...');
                 try {
                     await connectWallet();
                     // Re-fetch selected address after connection
                     currentAccount = window.ethereum?.selectedAddress;
                     if (!currentAccount) {
                         throw new Error('MetaMask connection rejected. Please connect your wallet to access the portal.');
                     }
                 } catch (walletErr: any) {
                     setLoading(false);
                     setError(walletErr.message || 'MetaMask connection failed');
                     return;
                 }
            }

            // 2. Authenticate with Backend
            if (isLogin) {
                // Pass current account to login for validation
                await login(formData.username, formData.password, currentAccount || undefined);
                navigate('/');
            } else {
                // Force registration with current wallet
                await signup(
                    formData.username, 
                    formData.password, 
                    formData.fullName, 
                    currentAccount || undefined,
                    formData.role,
                    formData.role === 'entity' ? formData.entityName : undefined
                );
                setIsLogin(true);
                setError('✅ Account created and wallet linked! Please login now.');
                setLoading(false);
            }
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
            setLoading(false);
        }
    };

    return (
        <div className="fade-in" style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '70vh' 
        }}>
            <div className="glass" style={{ 
                width: '100%', 
                maxWidth: '450px', 
                padding: '3rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                        width: '60px', 
                        height: '60px', 
                        background: '#fff', 
                        borderRadius: '12px', 
                        margin: '0 auto 1.5rem auto' 
                    }}></div>
                    <h2 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                        {isLogin ? 'Welcome Back' : 'Create Identity'}
                    </h2>
                    <p style={{ fontSize: '0.9rem' }}>
                        {isLogin 
                            ? 'Connect your decentralized identity to the protocol.' 
                            : 'Sign up to start managing your on-chain KYC profile.'}
                    </p>
                </div>

                <div style={{ display: 'flex', borderBottom: '1px solid var(--card-border)' }}>
                    <button 
                        onClick={() => setIsLogin(true)}
                        style={{ 
                            flex: 1, 
                            padding: '1rem', 
                            background: 'none', 
                            border: 'none', 
                            color: isLogin ? 'var(--text-primary)' : 'var(--text-muted)',
                            borderBottom: isLogin ? '2px solid #fff' : 'none',
                            cursor: 'pointer',
                            fontWeight: 600
                        }}
                    >
                        Login
                    </button>
                    <button 
                        onClick={() => setIsLogin(false)}
                        style={{ 
                            flex: 1, 
                            padding: '1rem', 
                            background: 'none', 
                            border: 'none', 
                            color: !isLogin ? 'var(--text-primary)' : 'var(--text-muted)',
                            borderBottom: !isLogin ? '2px solid #fff' : 'none',
                            cursor: 'pointer',
                            fontWeight: 600
                        }}
                    >
                        Sign Up
                    </button>
                </div>

                {error && (
                    <div className="glass" style={{ 
                        width: '100%', 
                        background: error.includes('successful') ? 'rgba(0,255,136,0.1)' : 'rgba(255,68,68,0.1)',
                        color: error.includes('successful') ? 'var(--success)' : 'var(--error)',
                        padding: '1rem',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        border: `1px solid ${error.includes('successful') ? 'var(--success)' : 'var(--error)'}`,
                        textAlign: 'center'
                    }}>
                        <div style={{ fontWeight: 700, marginBottom: '0.3rem' }}>
                            {error.includes('Wallet mismatch') ? '🔒 SECURITY CHECK' : (error.includes('successful') ? '✅ SUCCESS' : '⚠️ ACTION REQUIRED')}
                        </div>
                        {error}
                        {error.includes('Wallet mismatch') && (
                            <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.8 }}>
                                Please switch your MetaMask account, then click Refresh.
                            </p>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {!isLogin && (
                        <>
                            <div>
                                <label>I am registering as a:</label>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({...formData, role: 'user'})}
                                        style={{ 
                                            flex: 1, padding: '0.8rem', borderRadius: '8px', 
                                            background: formData.role === 'user' ? '#fff' : 'rgba(255,255,255,0.05)',
                                            color: formData.role === 'user' ? '#000' : '#fff',
                                            border: '1px solid var(--card-border)', cursor: 'pointer', fontSize: '0.8rem'
                                        }}
                                    >
                                        Individual
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({...formData, role: 'entity'})}
                                        style={{ 
                                            flex: 1, padding: '0.8rem', borderRadius: '8px', 
                                            background: formData.role === 'entity' ? '#fff' : 'rgba(255,255,255,0.05)',
                                            color: formData.role === 'entity' ? '#000' : '#fff',
                                            border: '1px solid var(--card-border)', cursor: 'pointer', fontSize: '0.8rem'
                                        }}
                                    >
                                        Institution (Bank)
                                    </button>
                                </div>
                            </div>

                            {formData.role === 'entity' && (
                                <div>
                                    <label>Institution Name</label>
                                    <input 
                                        type="text" 
                                        name="entityName"
                                        value={formData.entityName}
                                        onChange={handleChange}
                                        placeholder="e.g. SBI Bank, HDFC"
                                        required
                                    />
                                </div>
                            )}

                            <div>
                                <label>{formData.role === 'entity' ? 'Authorized Person Name' : 'Full Name'}</label>
                                <input 
                                    type="text" 
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="Enter full legal name"
                                    required
                                />
                            </div>
                        </>
                    )}
                    <div>
                        <label>Username</label>
                        <input 
                            type="text" 
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Your unique identifier"
                            required
                        />
                    </div>
                    <div>
                        <label>Password</label>
                        <input 
                            type="password" 
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Min. 8 characters"
                            required
                        />
                    </div>

                    <div className="divider" style={{ margin: '1rem 0' }}></div>

                    <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: account ? 'var(--success)' : 'var(--error)' }}></div>
                            <span style={{ fontSize: '0.8rem', color: account ? 'var(--success)' : 'var(--text-secondary)' }}>
                                {account ? 'Wallet Connected' : 'Wallet Not Connected'}
                            </span>
                        </div>
                        {account && <p style={{ fontSize: '0.7rem', opacity: 0.7 }}>{account}</p>}
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '1rem', marginBottom: '1rem' }}
                    >
                        {loading ? 'Authenticating...' : (isLogin ? 'Login to Portal' : 'Create Account')}
                    </button>
                    {isLogin && (
                        <button 
                            type="button" 
                            onClick={async () => {
                                try {
                                    setError('');
                                    await connectWallet();
                                } catch (err: any) {
                                    setError(err.message || 'Connection failed');
                                }
                            }}
                            className="btn btn-outline"
                            style={{ width: '100%', padding: '1rem' }}
                        >
                            {account ? 'Refresh / Fetch MetaMask Account' : 'Connect MetaMask'}
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
