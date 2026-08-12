import React from 'react';
import { useTheme } from '../../ThemeContext';

const LegalPageShell = ({ title, updated, children }) => {
  const { theme } = useTheme();
  return (
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 8px 0' }}>{title}</h1>
      {updated && <p style={{ color: theme.faint, fontSize: '13px', margin: '0 0 28px 0' }}>Last updated: {updated}</p>}
      <div style={{ color: theme.subtext, fontSize: '15px', lineHeight: '1.7' }}>{children}</div>
    </div>
  );
};

export const Section = ({ title, children }) => {
  const { theme } = useTheme();
  return (
    <div style={{ marginBottom: '24px' }}>
      {title && <h3 style={{ color: theme.text, fontSize: '17px', margin: '0 0 10px 0' }}>{title}</h3>}
      {children}
    </div>
  );
};

export default LegalPageShell;
