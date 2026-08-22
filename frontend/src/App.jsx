import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
// Eager: the first screens a user sees (fast first paint)
import Home from './pages/Home';
import KynexAuth from './KynexAuth';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import OfflineBanner from './components/OfflineBanner';
import { isAuthenticated } from './utils/auth';
import { ThemeProvider, useTheme } from './ThemeContext';
import { LanguageProvider } from './LanguageContext';
import LiveChat from './components/LiveChat';
import WhatsNewModal from './components/WhatsNewModal';
import UpdateChecker from './components/UpdateChecker';
import AppLock from './components/AppLock';

// Lazy: everything else is downloaded only when the user opens it. This splits the ~1.1 MB
// bundle so the login/dashboard load is much lighter (charts, admin panel, legal pages, etc.
// no longer ship on first load). Vite emits one small chunk per page.
const Markets = lazy(() => import('./pages/Markets'));
const Trade = lazy(() => import('./pages/Trade'));
const Assets = lazy(() => import('./pages/Assets'));
const Signals = lazy(() => import('./pages/Signals'));
const Invite = lazy(() => import('./pages/Invite'));
const Download = lazy(() => import('./pages/Download'));
const Profile = lazy(() => import('./pages/Profile'));
const Security = lazy(() => import('./pages/Security'));
const Settings = lazy(() => import('./pages/Settings'));
const Messages = lazy(() => import('./pages/Messages'));
const Verification = lazy(() => import('./pages/Verification'));
const AdminKyc = lazy(() => import('./pages/AdminKyc'));
const Certificates = lazy(() => import('./pages/Certificates'));
const DepositPage = lazy(() => import('./pages/DepositPage'));
const WithdrawPage = lazy(() => import('./pages/WithdrawPage'));
const TransactionPage = lazy(() => import('./pages/TransactionPage'));
const TransferPage = lazy(() => import('./pages/TransferPage'));
const LegalLayout = lazy(() => import('./pages/legal/LegalLayout'));
const AboutUs = lazy(() => import('./pages/legal/AboutUs'));
const UserAgreement = lazy(() => import('./pages/legal/UserAgreement'));
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy'));
const Disclaimer = lazy(() => import('./pages/legal/Disclaimer'));
const ContactUs = lazy(() => import('./pages/legal/ContactUs'));
const MemberGuide = lazy(() => import('./pages/legal/MemberGuide'));

// Minimal theme-aware placeholder shown for the split-second a page chunk is downloading
function PageLoader() {
  const { theme } = useTheme();
  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: `3px solid ${theme.cardBorder}`, borderTopColor: theme.primary, animation: 'kynexSpin 0.8s linear infinite' }} />
      <style>{`@keyframes kynexSpin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/auth" replace />;
}

function AnimatedRoutes({ children }) {
  const location = useLocation();
  return (
    <div key={location.pathname} style={{ animation: 'kynexPageIn 0.22s ease-out' }}>
      {children}
      <style>{`
        @keyframes kynexPageIn {
          from { opacity: 0; transform: translateY(7px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function App() {
  const authed = isAuthenticated();

  // UpdateChecker sets this to true while an update prompt is visible.
  // WhatsNewModal reads it — if update is pending, it stays silent.
  const [updatePending, setUpdatePending] = useState(false);

  return (
    <ThemeProvider>
      <LanguageProvider>
      <Router>
        <AnimatedRoutes><Suspense fallback={<PageLoader />}><Routes>
          <Route path="/" element={authed ? <Navigate to="/dashboard" /> : <Home />} />
          <Route path="/auth" element={authed ? <Navigate to="/dashboard" /> : <KynexAuth />} />

          {/* All App Routes — login required */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/markets" element={<ProtectedRoute><Markets /></ProtectedRoute>} />
          <Route path="/trade" element={<ProtectedRoute><Trade /></ProtectedRoute>} />
          <Route path="/assets" element={<ProtectedRoute><Assets /></ProtectedRoute>} />
          <Route path="/signals" element={<ProtectedRoute><Signals /></ProtectedRoute>} />
          <Route path="/invite" element={<ProtectedRoute><Invite /></ProtectedRoute>} />
          <Route path="/download" element={<Download />} />
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

          {/* Catch-all — mistyped URLs get a proper page instead of a blank screen */}
          <Route path="*" element={<NotFound />} />
        </Routes></Suspense></AnimatedRoutes>

        {/* Global overlays — rendered outside AnimatedRoutes so they don't re-animate on navigation */}
        <OfflineBanner />
        {isAuthenticated() && <LiveChat />}
        {isAuthenticated() && <AppLock />}
        <UpdateChecker onPendingChange={setUpdatePending} />
        <WhatsNewModal updatePending={updatePending} />
      </Router>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
