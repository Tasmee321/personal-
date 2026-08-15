import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import KynexAuth from './KynexAuth';
import Dashboard from './pages/Dashboard';
import Markets from './pages/Markets';
import Trade from './pages/Trade';
import Assets from './pages/Assets';
import LegalLayout from './pages/legal/LegalLayout';
import AboutUs from './pages/legal/AboutUs';
import UserAgreement from './pages/legal/UserAgreement';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import Disclaimer from './pages/legal/Disclaimer';
import ContactUs from './pages/legal/ContactUs';
import MemberGuide from './pages/legal/MemberGuide';
import Download from './pages/Download';
import Signals from './pages/Signals';
import Invite from './pages/Invite';
import Profile from './pages/Profile';
import Security from './pages/Security';
import Settings from './pages/Settings';
import Messages from './pages/Messages';
import Verification from './pages/Verification';
import AdminKyc from './pages/AdminKyc';
import Certificates from './pages/Certificates';
import DepositPage from './pages/DepositPage';
import WithdrawPage from './pages/WithdrawPage';
import TransactionPage from './pages/TransactionPage';
import TransferPage from './pages/TransferPage';
import { isAuthenticated } from './utils/auth';
import { ThemeProvider } from './ThemeContext';
import LiveChat from './components/LiveChat';

function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/auth" replace />;
}

function App() {
  const authed = isAuthenticated();

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={authed ? <Navigate to="/dashboard" /> : <Home />} />
          <Route path="/auth" element={authed ? <Navigate to="/dashboard" /> : <KynexAuth />} />

          {/* All App Routes — login required */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/markets" element={<ProtectedRoute><Markets /></ProtectedRoute>} />
          <Route path="/trade" element={<ProtectedRoute><Trade /></ProtectedRoute>} />
          <Route path="/assets" element={<ProtectedRoute><Assets /></ProtectedRoute>} />
          <Route path="/signals" element={<ProtectedRoute><Signals /></ProtectedRoute>} />
          <Route path="/invite" element={<ProtectedRoute><Invite /></ProtectedRoute>} />
          <Route path="/download" element={<ProtectedRoute><Download /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/security" element={<ProtectedRoute><Security /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/verification" element={<ProtectedRoute><Verification /></ProtectedRoute>} />
          <Route path="/deposit" element={<ProtectedRoute><DepositPage /></ProtectedRoute>} />
          <Route path="/withdraw" element={<ProtectedRoute><WithdrawPage /></ProtectedRoute>} />
          <Route path="/transactions" element={<ProtectedRoute><TransactionPage /></ProtectedRoute>} />
          <Route path="/transfer" element={<ProtectedRoute><TransferPage /></ProtectedRoute>} />
          <Route path="/admin/kyc" element={<AdminKyc />} />
          <Route path="/certificates" element={<ProtectedRoute><Certificates /></ProtectedRoute>} />

          {/* About / Legal Pages */}
          <Route path="/legal" element={<LegalLayout />}>
            <Route index element={<Navigate to="about" replace />} />
            <Route path="about" element={<AboutUs />} />
            <Route path="user-agreement" element={<UserAgreement />} />
            <Route path="privacy" element={<PrivacyPolicy />} />
            <Route path="disclaimer" element={<Disclaimer />} />
            <Route path="contact" element={<ContactUs />} />
            <Route path="member-guide" element={<MemberGuide />} />
          </Route>
        </Routes>
        {/* Global LiveChat — shows on all protected pages */}
        {isAuthenticated() && <LiveChat />}
      </Router>
    </ThemeProvider>
  );
}

export default App;
