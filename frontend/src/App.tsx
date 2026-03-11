import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { BlockchainProvider } from './context/BlockchainContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import VerifierDashboard from './pages/VerifierDashboard';
import UserDashboard from './pages/UserDashboard';

const App: React.FC = () => {
  return (
    <BlockchainProvider>
      <Router>
        <div className="app-wrapper">
          <Navbar />
          <main className="container fade-in" style={{ padding: '3rem 2rem' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/verifier" element={<VerifierDashboard />} />
              <Route path="/user" element={<UserDashboard />} />
            </Routes>
          </main>
        </div>
      </Router>
    </BlockchainProvider>
  );
};

export default App;