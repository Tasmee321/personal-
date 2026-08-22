import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Clock, XCircle, ShieldAlert, Upload, Check } from 'lucide-react';
import { getToken } from '../utils/auth';
import { useTheme } from '../ThemeContext';
import { useLanguage } from '../LanguageContext';
import { API_URL } from '../config';

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

function glassCard(theme) {
  return {
    backgroundColor: theme.card,
    borderRadius: '16px',
    border: `1px solid ${theme.cardBorder}`,
    boxShadow: theme.shadow,
    backdropFilter: theme.cardGlass || 'blur(16px)',
    WebkitBackdropFilter: theme.cardGlass || 'blur(16px)',
  };
}

const COUNTRIES = [
  'United States',
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
  'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
  'Cambodia', 'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
  'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
  'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia',
  'Fiji', 'Finland', 'France',
  'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guyana',
  'Haiti', 'Honduras', 'Hungary',
  'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
  'Jamaica', 'Japan', 'Jordan',
  'Kazakhstan', 'Kenya', 'Kuwait', 'Kyrgyzstan',
  'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
  'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Mauritania', 'Mauritius', 'Mexico', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
  'Namibia', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Macedonia', 'Norway',
  'Oman',
  'Pakistan', 'Palestine', 'Panama', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
  'Qatar',
  'Romania', 'Russia', 'Rwanda',
  'Saudi Arabia', 'Senegal', 'Serbia', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Somalia', 'South Africa', 'South Korea', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
  'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan',
  'UAE', 'Uganda', 'Ukraine', 'United Kingdom', 'Uruguay', 'Uzbekistan',
  'Venezuela', 'Vietnam',
  'Yemen',
  'Zambia', 'Zimbabwe',
];
const DOC_TYPES = [
  { value: 'passport', labelKey: 'verification.docPassport' },
  { value: 'driving_license', labelKey: 'verification.docDrivingLicense' },
  { value: 'national_id', labelKey: 'verification.docNationalId' },
];

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function StatusBadge({ status, theme, iconBadges }) {
  const { t } = useLanguage();
  const map = {
    not_started: { label: t('status.notVerified'), color: theme.subtext, Icon: ShieldAlert, badge: iconBadges.amber },
    pending: { label: t('status.pendingReview'), color: theme.brand, Icon: Clock, badge: iconBadges.amber },
    certified: { label: t('status.certified'), color: theme.up, Icon: ShieldCheck, badge: iconBadges.green },
    rejected: { label: t('status.rejected'), color: theme.down, Icon: XCircle, badge: iconBadges.pink },
  };
  const { label, color, Icon, badge } = map[status] || map.not_started;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', ...glassCard(theme), padding: '16px', marginBottom: '20px' }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '12px', backgroundColor: badge.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={20} color={badge.fg} />
      </div>
      <div>
        <div style={{ fontWeight: 'bold', color }}>{label}</div>
        <div style={{ fontSize: '12px', color: theme.faint }}>
          {status === 'not_started' && t('verification.statusNotStartedDesc')}
          {status === 'pending' && t('verification.statusPendingDesc')}
          {status === 'certified' && t('verification.statusCertifiedDesc')}
          {status === 'rejected' && t('verification.statusRejectedDesc')}
        </div>
      </div>
    </div>
  );
}

function Tiers({ theme }) {
  const { t } = useLanguage();
  const rows = [
    { label: t('verification.withdrawalLimit'), basic: t('verification.limited'), trusted: t('verification.unlimited') },
    { label: t('verification.depositLimit'), basic: t('verification.unlimited'), trusted: t('verification.unlimited') },
    { label: t('verification.p2pTrading'), basic: t('verification.limited'), trusted: t('verification.unlimited') },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '24px' }}>
      <div />
      <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: theme.subtext }}>{t('verification.tierBasic')}</div>
      <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: theme.brand }}>{t('verification.tierTrusted')}</div>
      {rows.map((row) => (
        <React.Fragment key={row.label}>
          <div style={{ fontSize: '12px', color: theme.subtext, alignSelf: 'center' }}>{row.label}</div>
          <div style={{ textAlign: 'center', fontSize: '12px', ...glassCard(theme), borderRadius: '8px', padding: '10px 4px' }}>{row.basic}</div>
          <div style={{ textAlign: 'center', fontSize: '12px', backgroundColor: theme.brandSoft, border: `1px solid ${theme.brand}`, borderRadius: '8px', padding: '10px 4px', fontWeight: 'bold' }}>{row.trusted}</div>
        </React.Fragment>
      ))}
    </div>
  );
}

function DocSlot({ label, file, onChange, theme }) {
  const { t } = useLanguage();
  return (
    <label style={{ display: 'block', cursor: 'pointer', marginBottom: '12px' }}>
      <div style={{ fontSize: '12px', color: theme.subtext, marginBottom: '6px' }}>{label}</div>
      <div style={{
        border: `1.5px dashed ${file ? theme.up : theme.cardBorder}`, borderRadius: '12px', padding: '14px',
        display: 'flex', alignItems: 'center', gap: '10px',
        backgroundColor: theme.card,
        backdropFilter: theme.cardGlass || 'blur(16px)', WebkitBackdropFilter: theme.cardGlass || 'blur(16px)',
      }}>
        {file ? <Check size={18} color={theme.up} /> : <Upload size={18} color={theme.faint} />}
        <span style={{ fontSize: '13px', color: file ? theme.up : theme.faint }}>{file ? file.name : t('verification.tapToChoosePhoto')}</span>
      </div>
      <input type="file" accept="image/*" onChange={onChange} style={{ display: 'none' }} />
    </label>
  );
}

const inputStyle = (theme) => ({
  width: '100%', padding: '12px', borderRadius: '10px',
  border: `1px solid ${theme.cardBorder}`,
  backgroundColor: theme.inputBg || theme.bg, color: theme.text,
  marginBottom: '10px', boxSizing: 'border-box', fontSize: '14px',
  outline: 'none',
});

const Verification = () => {
  const { theme, iconBadges, mode } = useTheme();
  const { t } = useLanguage();
  const [kyc, setKyc] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [country, setCountry] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [docType, setDocType] = useState('passport');
  const [idNumber, setIdNumber] = useState('');
  const [front, setFront] = useState(null);
  const [back, setBack] = useState(null);
  const [selfie, setSelfie] = useState(null);

  const load = async () => {
    try {
      const res = await fetch(`${API_URL}/api/account/kyc`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setKyc(data.kyc);
    } catch {}
  };

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!front || !back || !selfie) { setError(t('verification.uploadAllThree')); return; }
    setBusy(true);
    try {
      const documents = await Promise.all([front, back, selfie].map(fileToDataUrl));
      const res = await fetch(`${API_URL}/api/account/kyc/submit`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ country, firstName, lastName, dob, docType, idNumber, documents }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('verification.couldNotSubmit'));
      setKyc(data.kyc);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const showForm = kyc && (kyc.status === 'not_started' || kyc.status === 'rejected');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, color: theme.text }}>
      {/* Sticky glass header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px',
        borderBottom: `1px solid ${theme.cardBorder}`, backgroundColor: theme.card,
        backdropFilter: theme.cardGlass || 'blur(16px)', WebkitBackdropFilter: theme.cardGlass || 'blur(16px)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <Link to="/security" style={{ color: theme.text, display: 'flex' }}><ArrowLeft size={20} /></Link>
        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{t('verification.title')}</span>
      </div>

      <div style={{ padding: '20px', maxWidth: '480px', margin: '0 auto' }}>
        {kyc === null && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 0' }}>
            <style>{`@keyframes kynexSpin { to { transform: rotate(360deg); } }`}</style>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              border: `3px solid ${theme.cardBorder}`,
              borderTop: `3px solid ${theme.primary}`,
              animation: 'kynexSpin 0.8s linear infinite',
            }} />
          </div>
        )}
        {kyc && <StatusBadge status={kyc.status} theme={theme} iconBadges={iconBadges} />}

        {(kyc?.status === 'not_started' || kyc?.status === 'rejected') && <Tiers theme={theme} />}

        {showForm && (
          <form onSubmit={submit}>
            {error && <div style={{ color: theme.down, fontSize: '13px', marginBottom: '14px', padding: '10px', backgroundColor: theme.downSoft, borderRadius: '8px' }}>{error}</div>}

            <div style={{ fontSize: '13px', fontWeight: 'bold', color: theme.subtext, margin: '0 0 8px' }}>{t('verification.personalDetails')}</div>
            <select value={country} onChange={(e) => setCountry(e.target.value)} required style={{ ...inputStyle(theme), colorScheme: mode }}>
              <option value="" disabled>{t('verification.countryRegion')}</option>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="text" placeholder={t('verification.firstName')} value={firstName} onChange={(e) => setFirstName(e.target.value)} required style={inputStyle(theme)} />
            <input type="text" placeholder={t('verification.lastName')} value={lastName} onChange={(e) => setLastName(e.target.value)} required style={inputStyle(theme)} />
            <label style={{ fontSize: '12px', color: theme.subtext, marginBottom: '6px', display: 'block' }}>{t('verification.dateOfBirth')}</label>
            <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required style={{ ...inputStyle(theme), marginBottom: '18px', colorScheme: mode }} />

            <div style={{ fontSize: '13px', fontWeight: 'bold', color: theme.subtext, margin: '0 0 8px' }}>{t('verification.document')}</div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              {DOC_TYPES.map((d) => (
                <button key={d.value} type="button" onClick={() => setDocType(d.value)} style={{
                  flex: 1, padding: '10px 6px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                  border: `1px solid ${docType === d.value ? theme.primary : theme.cardBorder}`,
                  backgroundColor: docType === d.value ? theme.primarySoft : (theme.inputBg || theme.bg),
                  color: docType === d.value ? theme.primary : theme.subtext,
                }}>
                  {t(d.labelKey)}
                </button>
              ))}
            </div>
            <input type="text" placeholder={t('verification.documentIdNumber')} value={idNumber} onChange={(e) => setIdNumber(e.target.value)} required style={{ ...inputStyle(theme), marginBottom: '18px' }} />

            <div style={{ fontSize: '13px', fontWeight: 'bold', color: theme.subtext, margin: '0 0 8px' }}>{t('verification.uploadPhotos')}</div>
            <DocSlot label={t('verification.frontOfDocument')} file={front} onChange={(e) => setFront(e.target.files[0])} theme={theme} />
            <DocSlot label={t('verification.backOfDocument')} file={back} onChange={(e) => setBack(e.target.files[0])} theme={theme} />
            <DocSlot label={t('verification.selfieHolding')} file={selfie} onChange={(e) => setSelfie(e.target.files[0])} theme={theme} />

            <button type="submit" disabled={busy} style={{
              width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
              background: theme.primaryGradient || theme.primary, color: 'white',
              fontWeight: 'bold', cursor: busy ? 'not-allowed' : 'pointer', marginTop: '10px',
              boxShadow: '0 6px 18px rgba(59,130,246,0.3)',
            }}>
              {busy ? t('common.submitting') : t('verification.submitForReview')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Verification;
