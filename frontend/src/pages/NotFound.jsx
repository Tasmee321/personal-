import { Link } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import { isAuthenticated } from '../utils/auth';

export default function NotFound() {
  const { theme } = useTheme();
  const home = isAuthenticated() ? '/dashboard' : '/';
  return (
    <div style={{ minHeight: '100vh', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center', background: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: '16px', padding: '32px 24px', boxShadow: theme.shadow }}>
        <div style={{ fontSize: '48px', fontWeight: 800, color: theme.primary, lineHeight: 1 }}>404</div>
        <h2 style={{ margin: '12px 0 6px', color: theme.text, fontSize: '18px' }}>Page not found</h2>
        <p style={{ margin: '0 0 20px', color: theme.subtext, fontSize: '14px' }}>
          The link you followed doesn't exist or has moved.
        </p>
        <Link to={home} style={{ display: 'inline-block', padding: '10px 20px', borderRadius: '10px', background: theme.primaryGradient, color: '#fff', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}>
          {isAuthenticated() ? 'Go to Dashboard' : 'Go to Home'}
        </Link>
      </div>
    </div>
  );
}
