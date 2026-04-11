import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { BlockchainProvider } from './context/BlockchainContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import VerifierDashboard from './pages/VerifierDashboard';
import EntityDashboard from './pages/EntityDashboard';
import Verify from './pages/Verify';
import LoginPage from './pages/LoginPage';
import Vault from './pages/Vault';
import UserDashboard from './pages/UserDashboard';
import PublicStatus from './pages/PublicStatus';
import PublicLedger from './pages/PublicLedger';
import AdminDashboard from './pages/AdminDashboard';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <BlockchainProvider>
      <AuthProvider>
        <Router>
          <div className="app-wrapper">
            <Navbar />
            <main className="container fade-in" style={{ padding: '3rem 2rem' }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/explorer" element={<PublicStatus />} />
                <Route path="/ledger" element={<PublicLedger />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/verifier" element={<ProtectedRoute><VerifierDashboard /></ProtectedRoute>} />
                <Route path="/entity" element={<ProtectedRoute><EntityDashboard /></ProtectedRoute>} />
                <Route path="/user" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin-dashboard" element={<Navigate to="/admin" replace />} />
                <Route path="/Admindashboard" element={<Navigate to="/admin" replace />} />
                <Route path="/Admindashboad" element={<Navigate to="/admin" replace />} />
                <Route path="/verify" element={<ProtectedRoute><Verify /></ProtectedRoute>} />
                <Route path="/vault" element={<ProtectedRoute><Vault /></ProtectedRoute>} />
              </Routes>
            </main>   
          </div>
        </Router>
      </AuthProvider>
    </BlockchainProvider>
  );
};

export default App;
