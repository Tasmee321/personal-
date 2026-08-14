import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { useTheme } from '../ThemeContext';

/* ── Reused from AboutUs ── */
const SignatureSVG = ({ idx }) => {
  const w = 100, h = 34;
  const shared = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (idx) {
    case 0:
      return <svg width={w} height={h} viewBox="0 0 100 34"><path d="M6,26 C12,4 18,4 22,16 C24,22 20,28 16,24 C12,20 18,8 28,10 C36,12 32,24 38,20 C44,16 40,8 48,10 C54,12 50,22 56,18 C62,14 58,6 66,12 C70,16 74,20 78,14 C82,8 86,18 92,14" stroke="#1a1a1a" strokeWidth="1.6" opacity="0.6" {...shared} /><path d="M16,28 L92,28" stroke="#1a1a1a" strokeWidth="0.6" opacity="0.25" /></svg>;
    case 1:
      return <svg width={w} height={h} viewBox="0 0 100 34"><path d="M8,22 L16,6 L22,20 L30,4 L36,18 L42,8 L48,22 L52,12" stroke="#111" strokeWidth="2" opacity="0.55" {...shared} /><path d="M52,12 L58,20 L64,10 L72,24" stroke="#111" strokeWidth="1.4" opacity="0.45" {...shared} /><circle cx="76" cy="22" r="2" fill="#111" opacity="0.35" /></svg>;
    case 2:
      return <svg width={w} height={h} viewBox="0 0 100 34"><path d="M10,28 L10,6 C10,4 14,2 18,6 C22,10 20,16 14,16 L10,16" stroke="#222" strokeWidth="2.2" opacity="0.55" {...shared} /><path d="M14,16 L24,28" stroke="#222" strokeWidth="1.8" opacity="0.5" {...shared} /><path d="M26,20 C30,14 34,22 38,16 C42,10 46,20 50,14 C54,8 60,18 66,12 C72,6 78,16 84,14" stroke="#222" strokeWidth="1.2" opacity="0.4" {...shared} /><path d="M26,26 L84,26" stroke="#222" strokeWidth="0.5" opacity="0.2" /></svg>;
    case 3:
      return <svg width={w} height={h} viewBox="0 0 100 34"><path d="M12,18 C14,8 18,8 20,14 C22,20 16,22 18,16 C20,10 24,10 26,16 C28,22 24,24 26,18 C28,12 32,10 34,16 C36,22 32,24 34,18 C36,12 40,10 42,16 C44,22 40,24 44,18 C46,14 48,12 52,16" stroke="#1a1a1a" strokeWidth="1.8" opacity="0.5" {...shared} /><path d="M54,18 L70,18" stroke="#1a1a1a" strokeWidth="0.8" opacity="0.3" {...shared} strokeDasharray="2,3" /></svg>;
    case 4:
      return <svg width={w} height={h} viewBox="0 0 100 34"><path d="M14,20 C18,6 26,6 30,14 C34,22 28,28 24,22 C20,16 28,10 36,14 C44,18 40,26 46,22 C52,18 48,10 56,14 C60,16 58,22 62,18 C66,14 62,10 68,14 C74,18 70,24 76,18" stroke="#111" strokeWidth="1.6" opacity="0.5" {...shared} /><circle cx="34" cy="8" r="1.8" fill="#111" opacity="0.45" /><circle cx="62" cy="8" r="1.5" fill="#111" opacity="0.35" /></svg>;
    case 5:
      return <svg width={w} height={h} viewBox="0 0 100 34"><path d="M18,28 L28,6 L38,28" stroke="#1a1a1a" strokeWidth="2" opacity="0.55" {...shared} /><path d="M22,20 L34,20" stroke="#1a1a1a" strokeWidth="1.5" opacity="0.45" /><path d="M42,8 C42,8 48,6 50,12 C52,18 44,20 44,20 C44,20 52,22 52,16 C52,10 44,28 52,28" stroke="#1a1a1a" strokeWidth="1.8" opacity="0.5" {...shared} /><path d="M14,30 L58,30" stroke="#1a1a1a" strokeWidth="0.8" opacity="0.3" /><path d="M14,32 L58,32" stroke="#1a1a1a" strokeWidth="0.4" opacity="0.2" /></svg>;
    case 6:
      return <svg width={w} height={h} viewBox="0 0 100 34"><path d="M20,4 C22,10 18,18 22,26" stroke="#222" strokeWidth="2.5" opacity="0.5" {...shared} /><path d="M22,16 C28,12 34,18 40,14 C46,10 52,16 58,12 C64,8 70,14 76,12 C80,10 84,14 88,12" stroke="#222" strokeWidth="1.2" opacity="0.45" {...shared} /><path d="M16,28 L88,28" stroke="#222" strokeWidth="0.6" opacity="0.2" /></svg>;
    default:
      return <svg width={w} height={h} viewBox="0 0 100 34"><path d="M10,20 Q30,4 50,20 Q70,36 90,20" stroke="#222" strokeWidth="1.5" opacity="0.5" {...shared} /></svg>;
  }
};

const StampSVG = ({ idx, color }) => {
  const s = 60;
  switch (idx) {
    case 0:
      return <svg width={s} height={s} viewBox="0 0 60 60" style={{ transform: 'rotate(-12deg)' }}>
        <circle cx="30" cy="30" r="27" fill="none" stroke={color} strokeWidth="2.5" opacity="0.3" />
        <circle cx="30" cy="30" r="23" fill="none" stroke={color} strokeWidth="1" opacity="0.2" />
        <rect x="26" y="16" width="8" height="28" rx="1" fill={color} opacity="0.2" />
        <rect x="16" y="26" width="28" height="8" rx="1" fill={color} opacity="0.2" />
        <text x="30" y="52" textAnchor="middle" fontSize="5" fill={color} opacity="0.35" fontWeight="700">FINMA</text>
      </svg>;
    case 1:
      return <svg width={s} height={s} viewBox="0 0 60 60" style={{ transform: 'rotate(-8deg)' }}>
        <rect x="4" y="8" width="52" height="44" rx="3" fill="none" stroke={color} strokeWidth="2.5" opacity="0.3" />
        <rect x="8" y="12" width="44" height="36" rx="2" fill="none" stroke={color} strokeWidth="1" opacity="0.2" />
        <text x="30" y="27" textAnchor="middle" fontSize="8" fill={color} opacity="0.35" fontWeight="800">FCA</text>
        <line x1="14" y1="32" x2="46" y2="32" stroke={color} strokeWidth="0.8" opacity="0.2" />
        <text x="30" y="41" textAnchor="middle" fontSize="5" fill={color} opacity="0.3" fontWeight="600">REGISTERED</text>
      </svg>;
    case 2:
      return <svg width={s} height={s} viewBox="0 0 60 60" style={{ transform: 'rotate(-18deg)' }}>
        <circle cx="30" cy="30" r="27" fill="none" stroke={color} strokeWidth="2" opacity="0.28" />
        <circle cx="30" cy="30" r="22" fill="none" stroke={color} strokeWidth="1.5" opacity="0.22" />
        <circle cx="30" cy="30" r="17" fill="none" stroke={color} strokeWidth="0.5" opacity="0.15" />
        {[0,72,144,216,288].map((a,i) => {
          const r = 25, rad = a * Math.PI/180;
          return <text key={i} x={30+Math.cos(rad)*r} y={30+Math.sin(rad)*r} textAnchor="middle" fontSize="5" fill={color} opacity="0.25">★</text>;
        })}
        <text x="30" y="28" textAnchor="middle" fontSize="6" fill={color} opacity="0.35" fontWeight="800">FinCEN</text>
        <text x="30" y="37" textAnchor="middle" fontSize="4.5" fill={color} opacity="0.28" fontWeight="600">MSB</text>
      </svg>;
    case 3:
      return <svg width={s} height={s} viewBox="0 0 60 60" style={{ transform: 'rotate(-6deg)' }}>
        <circle cx="30" cy="30" r="27" fill="none" stroke={color} strokeWidth="2" opacity="0.3" strokeDasharray="4,2" />
        <circle cx="30" cy="30" r="22" fill="none" stroke={color} strokeWidth="1.5" opacity="0.2" />
        <text x="30" y="26" textAnchor="middle" fontSize="9" fill={color} opacity="0.3" fontWeight="900">MAS</text>
        <line x1="16" y1="30" x2="44" y2="30" stroke={color} strokeWidth="0.6" opacity="0.2" />
        <text x="30" y="39" textAnchor="middle" fontSize="4" fill={color} opacity="0.25" fontWeight="600">LICENSED</text>
        <text x="30" y="45" textAnchor="middle" fontSize="3.5" fill={color} opacity="0.2">SINGAPORE</text>
      </svg>;
    case 4:
      return <svg width={s} height={s} viewBox="0 0 60 60" style={{ transform: 'rotate(-15deg)' }}>
        <polygon points="30,3 54,17 54,43 30,57 6,43 6,17" fill="none" stroke={color} strokeWidth="2" opacity="0.3" />
        <polygon points="30,9 48,20 48,40 30,51 12,40 12,20" fill="none" stroke={color} strokeWidth="1" opacity="0.18" />
        <text x="30" y="28" textAnchor="middle" fontSize="7" fill={color} opacity="0.35" fontWeight="800">VARA</text>
        <text x="30" y="38" textAnchor="middle" fontSize="4" fill={color} opacity="0.25" fontWeight="600">DUBAI</text>
      </svg>;
    case 5:
      return <svg width={s} height={s} viewBox="0 0 60 60" style={{ transform: 'rotate(-10deg)' }}>
        {Array.from({length: 12}).map((_,i) => {
          const a = i*30*Math.PI/180, r1=27, r2=22, hw=4;
          const cos=Math.cos(a), sin=Math.sin(a);
          return <line key={i} x1={30+cos*r2} y1={30+sin*r2} x2={30+cos*r1} y2={30+sin*r1} stroke={color} strokeWidth={hw} opacity="0.12" strokeLinecap="round" />;
        })}
        <circle cx="30" cy="30" r="20" fill="none" stroke={color} strokeWidth="2" opacity="0.25" />
        <circle cx="30" cy="30" r="15" fill="none" stroke={color} strokeWidth="0.8" opacity="0.18" />
        <text x="30" y="29" textAnchor="middle" fontSize="8" fill={color} opacity="0.35" fontWeight="800">ISO</text>
        <text x="30" y="38" textAnchor="middle" fontSize="3.5" fill={color} opacity="0.22">27001</text>
      </svg>;
    case 6:
      return <svg width={s} height={s} viewBox="0 0 60 60" style={{ transform: 'rotate(-20deg)' }}>
        <path d="M30,4 L52,16 L52,36 C52,46 42,54 30,58 C18,54 8,46 8,36 L8,16 Z" fill="none" stroke={color} strokeWidth="2" opacity="0.28" />
        <path d="M30,10 L46,20 L46,34 C46,42 39,48 30,52 C21,48 14,42 14,34 L14,20 Z" fill="none" stroke={color} strokeWidth="0.8" opacity="0.18" />
        <text x="30" y="30" textAnchor="middle" fontSize="5.5" fill={color} opacity="0.32" fontWeight="800">SOC2</text>
        <text x="30" y="39" textAnchor="middle" fontSize="3.5" fill={color} opacity="0.22" fontWeight="600">TYPE II</text>
      </svg>;
    default:
      return <svg width={s} height={s} viewBox="0 0 60 60"><circle cx="30" cy="30" r="25" fill="none" stroke={color} strokeWidth="2" opacity="0.3" /></svg>;
  }
};

const SealSVG = ({ idx, color }) => {
  const gold = '#B8973B';
  const s = 80;
  const cx = 40, cy = 40;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      {Array.from({length: 48}).map((_,i) => {
        const a = i*7.5*Math.PI/180;
        const r1 = 38, r2 = i%2===0 ? 34 : (i%4===1 ? 32 : 30);
        return <line key={i} x1={cx+Math.cos(a)*r2} y1={cy+Math.sin(a)*r2} x2={cx+Math.cos(a)*r1} y2={cy+Math.sin(a)*r1} stroke={gold} strokeWidth="1.5" opacity="0.5" />;
      })}
      <circle cx={cx} cy={cy} r="32" fill="none" stroke={color} strokeWidth="2" />
      <circle cx={cx} cy={cy} r="28" fill="none" stroke={gold} strokeWidth="0.8" opacity="0.4" />
      <circle cx={cx} cy={cy} r="24" fill={color} opacity="0.06" />
      {idx === 0 && <>
        <rect x="36" y="26" width="8" height="28" rx="1" fill={color} opacity="0.5" />
        <rect x="26" y="36" width="28" height="8" rx="1" fill={color} opacity="0.5" />
      </>}
      {idx === 1 && <>
        <path d="M26,44 L28,28 L32,36 L36,24 L40,32 L44,24 L48,36 L52,28 L54,44 Z" fill={color} opacity="0.45" />
        <rect x="26" y="44" width="28" height="4" rx="1" fill={color} opacity="0.4" />
      </>}
      {idx === 2 && <>
        <path d="M40,20 L52,30 L52,40 C52,48 46,52 40,54 C34,52 28,48 28,40 L28,30 Z" fill={color} opacity="0.35" />
        <path d="M40,28 L46,34 L46,40 C46,44 43,47 40,48 C37,47 34,44 34,40 L34,34 Z" fill="white" opacity="0.5" />
        <polygon points="40,32 42,37 47,37 43,40 44,45 40,42 36,45 37,40 33,37 38,37" fill={color} opacity="0.5" />
      </>}
      {idx === 3 && <>
        <polygon points="40,18 44,30 56,30 46,38 50,50 40,42 30,50 34,38 24,30 36,30" fill={color} opacity="0.5" />
        <circle cx="40" cy="36" r="6" fill="white" opacity="0.5" />
        <circle cx="40" cy="36" r="3" fill={color} opacity="0.35" />
      </>}
      {idx === 4 && <>
        <circle cx="40" cy="38" r="14" fill={color} opacity="0.35" />
        <circle cx="46" cy="34" r="12" fill="#FFFEF7" opacity="0.9" />
        <polygon points="36,26 37.5,31 42,31 38.5,34 39.5,39 36,36 32.5,39 33.5,34 30,31 34.5,31" fill={color} opacity="0.55" />
      </>}
      {idx === 5 && <>
        {Array.from({length: 8}).map((_,i) => {
          const a = i*45*Math.PI/180;
          return <line key={i} x1={40+Math.cos(a)*10} y1={40+Math.sin(a)*10} x2={40+Math.cos(a)*18} y2={40+Math.sin(a)*18} stroke={color} strokeWidth="5" opacity="0.2" strokeLinecap="round" />;
        })}
        <circle cx="40" cy="40" r="10" fill={color} opacity="0.3" />
        <circle cx="40" cy="40" r="6" fill="white" opacity="0.5" />
      </>}
      {idx === 6 && <>
        <line x1="40" y1="22" x2="40" y2="52" stroke={color} strokeWidth="2.5" opacity="0.4" />
        <line x1="26" y1="30" x2="54" y2="30" stroke={color} strokeWidth="2" opacity="0.4" />
        <path d="M26,30 L22,42 L30,42 Z" fill={color} opacity="0.35" />
        <path d="M54,30 L50,42 L58,42 Z" fill={color} opacity="0.35" />
        <rect x="36" y="50" width="8" height="4" rx="1" fill={color} opacity="0.3" />
      </>}
      <circle cx={cx} cy={cy} r="10" fill="none" stroke={gold} strokeWidth="0.5" opacity="0.5" />
    </svg>
  );
};

const SIGNER_NAMES = [
  'Dr. M. Lehmann',
  'J. Whitfield CBE',
  'R. Hernandez III',
  'Dr. K. Lim Wei',
  'H. Al-Maktoum',
  'Prof. A. Schmidt',
  'D. Richardson CPA',
];

const PATTERNS = [
  (g) => `repeating-linear-gradient(45deg, ${g} 0px, ${g} 1px, transparent 1px, transparent 14px)`,
  (g) => `repeating-linear-gradient(-45deg, ${g} 0px, ${g} 0.5px, transparent 0.5px, transparent 10px), repeating-linear-gradient(45deg, ${g} 0px, ${g} 0.5px, transparent 0.5px, transparent 10px)`,
  (g) => `repeating-radial-gradient(circle at 50% 50%, transparent 0px, transparent 8px, ${g} 8px, ${g} 9px, transparent 9px, transparent 18px)`,
  (g) => `repeating-linear-gradient(0deg, ${g} 0px, ${g} 0.5px, transparent 0.5px, transparent 6px), repeating-linear-gradient(90deg, ${g} 0px, ${g} 0.5px, transparent 0.5px, transparent 6px)`,
  (g) => `repeating-linear-gradient(60deg, ${g} 0px, ${g} 0.8px, transparent 0.8px, transparent 12px)`,
  (g) => `repeating-linear-gradient(30deg, ${g} 0px, ${g} 0.5px, transparent 0.5px, transparent 8px), repeating-linear-gradient(150deg, ${g} 0px, ${g} 0.5px, transparent 0.5px, transparent 8px)`,
  (g) => `repeating-conic-gradient(${g} 0deg, transparent 2deg, transparent 10deg)`,
];

const CERT_DATA = [
  {
    title: 'Certificate of Registration — Virtual Asset Service Provider',
    authority: 'FINMA', regBody: 'Swiss Financial Market Supervisory Authority',
    regNumber: 'Registration No. CHE-384.719.528',
    issued: '14 March 2021', expires: '31 December 2027',
    country: 'Swiss Confederation', color: '#D52B1E',
    body: <>
      <p style={{ margin:'4px 0' }}>has been duly registered as a <b>Virtual Asset Service Provider (VASP)</b></p>
      <p style={{ margin:'4px 0' }}>under the Swiss Anti-Money Laundering Act (AMLA)</p>
      <p style={{ margin:'4px 0' }}>and is authorized to operate Digital Asset Exchange Services</p>
    </>,
  },
  {
    title: 'Certificate of Registration — Cryptoasset Business',
    authority: 'FCA', regBody: 'Financial Conduct Authority',
    regNumber: 'Firm Reference Number: 924817',
    issued: '22 June 2022', expires: 'Ongoing (subject to annual review)',
    country: 'United Kingdom', color: '#003087',
    body: <>
      <p style={{ margin:'4px 0' }}>is registered under the <b>Money Laundering, Terrorist Financing</b></p>
      <p style={{ margin:'4px 0' }}>and Transfer of Funds (Information on the Payer) Regulations 2017</p>
      <p style={{ margin:'4px 0' }}>to carry on <b>Cryptoasset Exchange and Custodian Wallet</b> activities</p>
    </>,
  },
  {
    title: 'Money Services Business — Registration Certificate',
    authority: 'FinCEN', regBody: 'Financial Crimes Enforcement Network — U.S. Department of the Treasury',
    regNumber: 'MSB Registration No. 31000276419582',
    issued: '8 January 2022', expires: '31 December 2026 (renewal filed)',
    country: 'United States of America', color: '#002868',
    body: <>
      <p style={{ margin:'4px 0' }}>operating as <b>KYNEX Americas Inc.</b></p>
      <p style={{ margin:'4px 0' }}>is registered as a <b>Money Services Business (MSB)</b></p>
      <p style={{ margin:'4px 0' }}>authorized for Money Transmission and Convertible Virtual Currency services</p>
    </>,
  },
  {
    title: 'Digital Payment Token Service License',
    authority: 'MAS', regBody: 'Monetary Authority of Singapore',
    regNumber: 'License No. PS20220001438',
    issued: '15 September 2022', expires: '14 September 2027',
    country: 'Republic of Singapore', color: '#EF3340',
    body: <>
      <p style={{ margin:'4px 0' }}>operating as <b>KYNEX Pte. Ltd.</b></p>
      <p style={{ margin:'4px 0' }}>is licensed under the <b>Payment Services Act 2019</b></p>
      <p style={{ margin:'4px 0' }}>to provide Digital Payment Token (DPT) services</p>
    </>,
  },
  {
    title: 'Virtual Asset Exchange Service Provider License',
    authority: 'VARA', regBody: 'Dubai Virtual Assets Regulatory Authority',
    regNumber: 'License No. VARA-2024-00397',
    issued: '3 February 2024', expires: '2 February 2029',
    country: 'United Arab Emirates — Dubai', color: '#00732F',
    body: <>
      <p style={{ margin:'4px 0' }}>operating as <b>KYNEX MENA FZE</b></p>
      <p style={{ margin:'4px 0' }}>is authorized under the <b>Virtual Assets and Related Activities Regulations 2023</b></p>
      <p style={{ margin:'4px 0' }}>for Virtual Asset Exchange, Broker-Dealer, and Custody services</p>
    </>,
  },
  {
    title: 'ISO/IEC 27001:2022 — Information Security Management',
    authority: 'ISO', regBody: 'International Organization for Standardization',
    regNumber: 'Certificate No. IS 809247 / Audit by Deloitte AG',
    issued: '10 November 2023', expires: '9 November 2026',
    country: 'International Standard', color: '#00539F',
    body: <>
      <p style={{ margin:'4px 0' }}>has implemented an <b>Information Security Management System (ISMS)</b></p>
      <p style={{ margin:'4px 0' }}>in accordance with the requirements of <b>ISO/IEC 27001:2022</b></p>
      <p style={{ margin:'4px 0' }}>covering all digital asset exchange and custody operations</p>
    </>,
  },
  {
    title: 'SOC 2 Type II — Service Organization Control Report',
    authority: 'AICPA', regBody: 'American Institute of Certified Public Accountants',
    regNumber: 'Report Period: 01 Jan 2025 – 31 Dec 2025 / Auditor: Deloitte AG',
    issued: '15 March 2026', expires: 'Annual (next audit: Q1 2027)',
    country: 'International Standard', color: '#0077C0',
    body: <>
      <p style={{ margin:'4px 0' }}>has been evaluated against the <b>Trust Services Criteria</b></p>
      <p style={{ margin:'4px 0' }}>for Security, Availability, Processing Integrity, Confidentiality, and Privacy</p>
      <p style={{ margin:'4px 0' }}>and has met the requirements for <b>SOC 2 Type II Compliance</b></p>
    </>,
  },
];

const Certificate = ({ title, regBody, regNumber, issued, expires, country, color, idx, children }) => {
  const patternColor = `${color}18`;
  const bgPattern = PATTERNS[idx % PATTERNS.length](patternColor);

  return (
    <div style={{
      position: 'relative', borderRadius: '12px', border: `1.5px solid ${color}40`,
      overflow: 'hidden', marginBottom: '20px',
      boxShadow: `0 4px 20px ${color}15, 0 1px 4px rgba(0,0,0,0.08)`,
    }}>
      {/* Security pattern background */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: bgPattern, opacity: 0.7, pointerEvents: 'none' }} />

      {/* Top color bar */}
      <div style={{ height: '6px', background: `linear-gradient(90deg, ${color}, ${color}88)`, position: 'relative' }} />

      <div style={{ padding: '20px 20px 16px', position: 'relative', backgroundColor: 'rgba(255,255,255,0.97)' }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div style={{ flex: 1, paddingRight: '12px' }}>
            <div style={{ fontSize: '9px', fontWeight: '800', color, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>
              {regBody}
            </div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a1a', lineHeight: '1.35' }}>{title}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <SealSVG idx={idx} color={color} />
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: `1px solid ${color}30`, marginBottom: '12px' }} />

        {/* Body text */}
        <div style={{ fontSize: '12px', color: '#2a2a2a', lineHeight: '1.7', marginBottom: '14px', fontStyle: 'italic', textAlign: 'center', padding: '0 8px' }}>
          <p style={{ margin: '0 0 4px', fontWeight: '600', fontSize: '11px', color: '#555', letterSpacing: '0.5px' }}>
            This is to certify that <span style={{ color, fontWeight: '800', fontStyle: 'normal' }}>KYNEX GLOBAL LTD</span>
          </p>
          {children}
        </div>

        {/* Meta grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
          {[
            { label: 'Registration / Ref No.', value: regNumber },
            { label: 'Country / Jurisdiction', value: country },
            { label: 'Issue Date', value: issued },
            { label: 'Expiry / Renewal', value: expires },
          ].map(({ label, value }) => (
            <div key={label} style={{ backgroundColor: `${color}08`, border: `1px solid ${color}20`, borderRadius: '8px', padding: '8px 10px' }}>
              <div style={{ fontSize: '9px', color: '#888', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '3px' }}>{label}</div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#1a1a1a', lineHeight: '1.4' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Signature + stamp row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: `1px solid ${color}20`, paddingTop: '12px' }}>
          <div>
            <SignatureSVG idx={idx} />
            <div style={{ fontSize: '9px', color: '#888', marginTop: '3px' }}>{SIGNER_NAMES[idx]}</div>
            <div style={{ fontSize: '8px', color: '#aaa' }}>Authorised Signatory</div>
          </div>
          <StampSVG idx={idx} color={color} />
        </div>
      </div>
    </div>
  );
};

const Certificates = () => {
  const { theme } = useTheme();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, color: theme.text }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '16px 20px', borderBottom: `1px solid ${theme.cardBorder}`,
        backgroundColor: theme.card, backdropFilter: theme.cardGlass,
        WebkitBackdropFilter: theme.cardGlass, position: 'sticky', top: 0, zIndex: 10,
      }}>
        <Link to="/dashboard" style={{ color: theme.text, display: 'flex' }}>
          <ArrowLeft size={20} />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={18} color={theme.primary} />
          <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Certificates & Licenses</span>
        </div>
      </div>

      <div style={{ padding: '20px', maxWidth: '520px', margin: '0 auto', paddingBottom: '40px' }}>
        {/* Intro */}
        <div style={{
          backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`,
          borderRadius: '14px', padding: '16px', marginBottom: '22px',
          backdropFilter: theme.cardGlass, WebkitBackdropFilter: theme.cardGlass,
        }}>
          <p style={{ margin: 0, fontSize: '13px', color: theme.subtext, lineHeight: '1.6' }}>
            KYNEX operates under regulatory oversight across multiple jurisdictions. All licenses and
            certificates are maintained in good standing and subject to ongoing compliance monitoring.
          </p>
        </div>

        {/* All certificates */}
        {CERT_DATA.map((c, i) => (
          <Certificate
            key={i} idx={i}
            title={c.title} regBody={c.regBody}
            regNumber={c.regNumber} issued={c.issued}
            expires={c.expires} country={c.country}
            color={c.color}
          >
            {c.body}
          </Certificate>
        ))}

        {/* Footer note */}
        <p style={{ fontSize: '11px', color: theme.faint, textAlign: 'center', lineHeight: '1.6', marginTop: '8px' }}>
          All certificates are verified and maintained in accordance with applicable regulations.
          For verification inquiries, contact <span style={{ color: theme.primary }}>compliance@kynex.io</span>
        </p>
      </div>
    </div>
  );
};

export default Certificates;
