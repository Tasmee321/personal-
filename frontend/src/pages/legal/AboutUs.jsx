import React from 'react';
import { useTheme } from '../../ThemeContext';
import LegalPageShell, { Section } from './LegalPageShell';

/* ── Each signature is a completely different hand-drawn style ── */
const SignatureSVG = ({ idx }) => {
  const w = 100, h = 34;
  const shared = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (idx) {
    case 0: // Flowing cursive with big loops
      return <svg width={w} height={h} viewBox="0 0 100 34"><path d="M6,26 C12,4 18,4 22,16 C24,22 20,28 16,24 C12,20 18,8 28,10 C36,12 32,24 38,20 C44,16 40,8 48,10 C54,12 50,22 56,18 C62,14 58,6 66,12 C70,16 74,20 78,14 C82,8 86,18 92,14" stroke="#1a1a1a" strokeWidth="1.6" opacity="0.6" {...shared} /><path d="M16,28 L92,28" stroke="#1a1a1a" strokeWidth="0.6" opacity="0.25" /></svg>;
    case 1: // Sharp angular — lawyer-style
      return <svg width={w} height={h} viewBox="0 0 100 34"><path d="M8,22 L16,6 L22,20 L30,4 L36,18 L42,8 L48,22 L52,12" stroke="#111" strokeWidth="2" opacity="0.55" {...shared} /><path d="M52,12 L58,20 L64,10 L72,24" stroke="#111" strokeWidth="1.4" opacity="0.45" {...shared} /><circle cx="76" cy="22" r="2" fill="#111" opacity="0.35" /></svg>;
    case 2: // Big loopy initial "R" + scrawl
      return <svg width={w} height={h} viewBox="0 0 100 34"><path d="M10,28 L10,6 C10,4 14,2 18,6 C22,10 20,16 14,16 L10,16" stroke="#222" strokeWidth="2.2" opacity="0.55" {...shared} /><path d="M14,16 L24,28" stroke="#222" strokeWidth="1.8" opacity="0.5" {...shared} /><path d="M26,20 C30,14 34,22 38,16 C42,10 46,20 50,14 C54,8 60,18 66,12 C72,6 78,16 84,14" stroke="#222" strokeWidth="1.2" opacity="0.4" {...shared} /><path d="M26,26 L84,26" stroke="#222" strokeWidth="0.5" opacity="0.2" /></svg>;
    case 3: // Compact tight squiggle — doctor handwriting
      return <svg width={w} height={h} viewBox="0 0 100 34"><path d="M12,18 C14,8 18,8 20,14 C22,20 16,22 18,16 C20,10 24,10 26,16 C28,22 24,24 26,18 C28,12 32,10 34,16 C36,22 32,24 34,18 C36,12 40,10 42,16 C44,22 40,24 44,18 C46,14 48,12 52,16" stroke="#1a1a1a" strokeWidth="1.8" opacity="0.5" {...shared} /><path d="M54,18 L70,18" stroke="#1a1a1a" strokeWidth="0.8" opacity="0.3" {...shared} strokeDasharray="2,3" /></svg>;
    case 4: // Arabic-style flowing with dot
      return <svg width={w} height={h} viewBox="0 0 100 34"><path d="M14,20 C18,6 26,6 30,14 C34,22 28,28 24,22 C20,16 28,10 36,14 C44,18 40,26 46,22 C52,18 48,10 56,14 C60,16 58,22 62,18 C66,14 62,10 68,14 C74,18 70,24 76,18" stroke="#111" strokeWidth="1.6" opacity="0.5" {...shared} /><circle cx="34" cy="8" r="1.8" fill="#111" opacity="0.45" /><circle cx="62" cy="8" r="1.5" fill="#111" opacity="0.35" /></svg>;
    case 5: // Clean "AS" monogram with underline
      return <svg width={w} height={h} viewBox="0 0 100 34"><path d="M18,28 L28,6 L38,28" stroke="#1a1a1a" strokeWidth="2" opacity="0.55" {...shared} /><path d="M22,20 L34,20" stroke="#1a1a1a" strokeWidth="1.5" opacity="0.45" /><path d="M42,8 C42,8 48,6 50,12 C52,18 44,20 44,20 C44,20 52,22 52,16 C52,10 44,28 52,28" stroke="#1a1a1a" strokeWidth="1.8" opacity="0.5" {...shared} /><path d="M14,30 L58,30" stroke="#1a1a1a" strokeWidth="0.8" opacity="0.3" /><path d="M14,32 L58,32" stroke="#1a1a1a" strokeWidth="0.4" opacity="0.2" /></svg>;
    case 6: // Vertical slash + horizontal run
      return <svg width={w} height={h} viewBox="0 0 100 34"><path d="M20,4 C22,10 18,18 22,26" stroke="#222" strokeWidth="2.5" opacity="0.5" {...shared} /><path d="M22,16 C28,12 34,18 40,14 C46,10 52,16 58,12 C64,8 70,14 76,12 C80,10 84,14 88,12" stroke="#222" strokeWidth="1.2" opacity="0.45" {...shared} /><path d="M16,28 L88,28" stroke="#222" strokeWidth="0.6" opacity="0.2" /></svg>;
    default:
      return <svg width={w} height={h} viewBox="0 0 100 34"><path d="M10,20 Q30,4 50,20 Q70,36 90,20" stroke="#222" strokeWidth="1.5" opacity="0.5" {...shared} /></svg>;
  }
};

/* ── Each stamp is a completely different design ── */
const StampSVG = ({ idx, color, authority }) => {
  const s = 60;
  switch (idx) {
    case 0: // Swiss cross inside circle
      return <svg width={s} height={s} viewBox="0 0 60 60" style={{ transform: 'rotate(-12deg)' }}>
        <circle cx="30" cy="30" r="27" fill="none" stroke={color} strokeWidth="2.5" opacity="0.3" />
        <circle cx="30" cy="30" r="23" fill="none" stroke={color} strokeWidth="1" opacity="0.2" />
        <rect x="26" y="16" width="8" height="28" rx="1" fill={color} opacity="0.2" />
        <rect x="16" y="26" width="28" height="8" rx="1" fill={color} opacity="0.2" />
        <text x="30" y="52" textAnchor="middle" fontSize="5" fill={color} opacity="0.35" fontWeight="700">FINMA</text>
      </svg>;
    case 1: // UK crown stamp — rectangle with border
      return <svg width={s} height={s} viewBox="0 0 60 60" style={{ transform: 'rotate(-8deg)' }}>
        <rect x="4" y="8" width="52" height="44" rx="3" fill="none" stroke={color} strokeWidth="2.5" opacity="0.3" />
        <rect x="8" y="12" width="44" height="36" rx="2" fill="none" stroke={color} strokeWidth="1" opacity="0.2" />
        <text x="30" y="27" textAnchor="middle" fontSize="8" fill={color} opacity="0.35" fontWeight="800">FCA</text>
        <line x1="14" y1="32" x2="46" y2="32" stroke={color} strokeWidth="0.8" opacity="0.2" />
        <text x="30" y="41" textAnchor="middle" fontSize="5" fill={color} opacity="0.3" fontWeight="600">REGISTERED</text>
      </svg>;
    case 2: // US eagle-style — double circle with stars
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
    case 3: // Singapore — lion head outline stamp
      return <svg width={s} height={s} viewBox="0 0 60 60" style={{ transform: 'rotate(-6deg)' }}>
        <circle cx="30" cy="30" r="27" fill="none" stroke={color} strokeWidth="2" opacity="0.3" strokeDasharray="4,2" />
        <circle cx="30" cy="30" r="22" fill="none" stroke={color} strokeWidth="1.5" opacity="0.2" />
        <text x="30" y="26" textAnchor="middle" fontSize="9" fill={color} opacity="0.3" fontWeight="900">MAS</text>
        <line x1="16" y1="30" x2="44" y2="30" stroke={color} strokeWidth="0.6" opacity="0.2" />
        <text x="30" y="39" textAnchor="middle" fontSize="4" fill={color} opacity="0.25" fontWeight="600">LICENSED</text>
        <text x="30" y="45" textAnchor="middle" fontSize="3.5" fill={color} opacity="0.2">SINGAPORE</text>
      </svg>;
    case 4: // Dubai — hexagonal stamp
      return <svg width={s} height={s} viewBox="0 0 60 60" style={{ transform: 'rotate(-15deg)' }}>
        <polygon points="30,3 54,17 54,43 30,57 6,43 6,17" fill="none" stroke={color} strokeWidth="2" opacity="0.3" />
        <polygon points="30,9 48,20 48,40 30,51 12,40 12,20" fill="none" stroke={color} strokeWidth="1" opacity="0.18" />
        <text x="30" y="28" textAnchor="middle" fontSize="7" fill={color} opacity="0.35" fontWeight="800">VARA</text>
        <text x="30" y="38" textAnchor="middle" fontSize="4" fill={color} opacity="0.25" fontWeight="600">DUBAI</text>
      </svg>;
    case 5: // ISO — gear/cog shape
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
    case 6: // AICPA — shield shape
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

/* ── Each seal emblem has a different center ── */
const SealSVG = ({ idx, color }) => {
  const gold = '#B8973B';
  const s = 80;
  const cx = 40, cy = 40;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      {/* Outer notched ring */}
      {Array.from({length: 48}).map((_,i) => {
        const a = i*7.5*Math.PI/180;
        const r1 = 38, r2 = i%2===0 ? 34 : (i%4===1 ? 32 : 30);
        return <line key={i} x1={cx+Math.cos(a)*r2} y1={cy+Math.sin(a)*r2} x2={cx+Math.cos(a)*r1} y2={cy+Math.sin(a)*r1} stroke={gold} strokeWidth="1.5" opacity="0.5" />;
      })}
      <circle cx={cx} cy={cy} r="32" fill="none" stroke={color} strokeWidth="2" />
      <circle cx={cx} cy={cy} r="28" fill="none" stroke={gold} strokeWidth="0.8" opacity="0.4" />
      <circle cx={cx} cy={cy} r="24" fill={color} opacity="0.06" />
      {/* Unique center per certificate */}
      {idx === 0 && /* Swiss cross */ <>
        <rect x="36" y="26" width="8" height="28" rx="1" fill={color} opacity="0.5" />
        <rect x="26" y="36" width="28" height="8" rx="1" fill={color} opacity="0.5" />
      </>}
      {idx === 1 && /* Crown */ <>
        <path d="M26,44 L28,28 L32,36 L36,24 L40,32 L44,24 L48,36 L52,28 L54,44 Z" fill={color} opacity="0.45" />
        <rect x="26" y="44" width="28" height="4" rx="1" fill={color} opacity="0.4" />
      </>}
      {idx === 2 && /* Eagle/shield */ <>
        <path d="M40,20 L52,30 L52,40 C52,48 46,52 40,54 C34,52 28,48 28,40 L28,30 Z" fill={color} opacity="0.35" />
        <path d="M40,28 L46,34 L46,40 C46,44 43,47 40,48 C37,47 34,44 34,40 L34,34 Z" fill="white" opacity="0.5" />
        <polygon points="40,32 42,37 47,37 43,40 44,45 40,42 36,45 37,40 33,37 38,37" fill={color} opacity="0.5" />
      </>}
      {idx === 3 && /* Star burst (5-point) */ <>
        <polygon points="40,18 44,30 56,30 46,38 50,50 40,42 30,50 34,38 24,30 36,30" fill={color} opacity="0.5" />
        <circle cx="40" cy="36" r="6" fill="white" opacity="0.5" />
        <circle cx="40" cy="36" r="3" fill={color} opacity="0.35" />
      </>}
      {idx === 4 && /* Crescent + star */ <>
        <circle cx="40" cy="38" r="14" fill={color} opacity="0.35" />
        <circle cx="46" cy="34" r="12" fill="#FFFEF7" opacity="0.9" />
        <polygon points="36,26 37.5,31 42,31 38.5,34 39.5,39 36,36 32.5,39 33.5,34 30,31 34.5,31" fill={color} opacity="0.55" />
      </>}
      {idx === 5 && /* Gear/cog */ <>
        {Array.from({length: 8}).map((_,i) => {
          const a = i*45*Math.PI/180;
          return <line key={i} x1={40+Math.cos(a)*10} y1={40+Math.sin(a)*10} x2={40+Math.cos(a)*18} y2={40+Math.sin(a)*18} stroke={color} strokeWidth="5" opacity="0.2" strokeLinecap="round" />;
        })}
        <circle cx="40" cy="40" r="10" fill={color} opacity="0.3" />
        <circle cx="40" cy="40" r="6" fill="white" opacity="0.5" />
      </>}
      {idx === 6 && /* Balance scales */ <>
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

const Certificate = ({ title, regBody, regNumber, issued, expires, country, color, idx, children }) => {
  const gold = '#B8973B';
  const darkGold = '#8B7532';
  const signer = SIGNER_NAMES[idx % SIGNER_NAMES.length];
  const pat = PATTERNS[idx % PATTERNS.length];

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{
        background: '#FFFEF7',
        borderRadius: '6px',
        border: `3px solid ${gold}`,
        padding: '4px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      }}>
        <div style={{
          border: `2px solid ${darkGold}`,
          borderRadius: '4px',
          padding: '28px 32px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Background pattern */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.03, pointerEvents: 'none', backgroundImage: pat(gold) }} />

          {/* Rosette watermark */}
          <svg style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', opacity: 0.03, pointerEvents: 'none' }} width="260" height="260" viewBox="0 0 260 260">
            {Array.from({length: 12}).map((_,i) => <ellipse key={i} cx="130" cy="130" rx="120" ry="40" fill="none" stroke={gold} strokeWidth="0.8" transform={`rotate(${i*30} 130 130)`} />)}
          </svg>

          {/* Corner ornaments */}
          {[{t:0,l:0,s:''},{t:0,r:0,s:'scaleX(-1)'},{b:0,l:0,s:'scaleY(-1)'},{b:0,r:0,s:'scale(-1)'}].map((p,i) => (
            <svg key={i} style={{ position:'absolute', top:p.t, bottom:p.b, left:p.l, right:p.r, transform:p.s }} width="70" height="70" viewBox="0 0 70 70">
              <path d="M0,0 L70,0 L70,6 Q35,6 6,35 L6,70 L0,70 Z" fill={gold} opacity="0.12" />
              <path d="M0,0 L50,0 L50,4 Q25,4 4,25 L4,50 L0,50 Z" fill={gold} opacity="0.2" />
              <path d="M0,0 L30,0 L30,3 Q15,3 3,15 L3,30 L0,30 Z" fill={gold} opacity="0.3" />
              <circle cx="6" cy="6" r="2.5" fill={gold} opacity="0.5" />
            </svg>
          ))}

          {/* Top decorative line */}
          <svg style={{ display:'block', margin:'0 auto 8px', opacity:0.2 }} width="200" height="6" viewBox="0 0 200 6">
            <line x1="0" y1="3" x2="80" y2="3" stroke={gold} strokeWidth="0.5" />
            <circle cx="90" cy="3" r="2" fill={gold} /><circle cx="100" cy="3" r="3" fill={gold} /><circle cx="110" cy="3" r="2" fill={gold} />
            <line x1="120" y1="3" x2="200" y2="3" stroke={gold} strokeWidth="0.5" />
          </svg>

          {/* Header */}
          <div style={{ textAlign:'center', marginBottom:'14px' }}>
            <div style={{ fontSize:'10px', letterSpacing:'4px', color:'#888', textTransform:'uppercase', marginBottom:'6px' }}>{country}</div>
            <div style={{ fontSize:'14px', fontWeight:'700', color:color, letterSpacing:'2px', textTransform:'uppercase' }}>{regBody}</div>
          </div>

          {/* Seal */}
          <div style={{ textAlign:'center', margin:'10px 0 14px' }}>
            <SealSVG idx={idx} color={color} />
          </div>

          {/* Title */}
          <div style={{ textAlign:'center', marginBottom:'14px' }}>
            <div style={{ fontSize:'18px', fontWeight:'700', color:'#1a1a1a', fontFamily:'Georgia, "Times New Roman", serif' }}>{title}</div>
          </div>

          {/* Body */}
          <div style={{ textAlign:'center', fontSize:'12px', color:'#444', lineHeight:'1.8', marginBottom:'16px', fontFamily:'Georgia, "Times New Roman", serif' }}>
            <p style={{ margin:'0 0 6px' }}>This is to certify that</p>
            <p style={{ fontSize:'18px', fontWeight:'700', color:'#111', margin:'0 0 6px', letterSpacing:'3px' }}>KYNEX AG</p>
            <p style={{ margin:'0 0 4px' }}>Bahnhofstrasse 42, 8001 Zurich, Switzerland</p>
            {children}
          </div>

          {/* Reg number */}
          <div style={{ textAlign:'center', margin:'14px 0' }}>
            <span style={{ fontSize:'11px', color:'#666', letterSpacing:'1px', fontFamily:'monospace', background:'rgba(184,151,59,0.08)', padding:'6px 14px', borderRadius:'4px', border:'1px solid rgba(184,151,59,0.15)' }}>{regNumber}</span>
          </div>

          {/* Dates + unique signature + unique stamp */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginTop:'18px', fontSize:'10px', color:'#666' }}>
            <div>
              <div>Issued: {issued}</div>
              <div>Valid through: {expires}</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <SignatureSVG idx={idx} />
              <div style={{ borderTop:'1px solid #aaa', paddingTop:'3px', fontSize:'9px', color:'#666', minWidth:'90px' }}>{signer}</div>
              <div style={{ fontSize:'7px', color:'#999', marginTop:'1px' }}>Authorized Signatory</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <StampSVG idx={idx} color={color} />
            </div>
          </div>

          {/* Bottom line */}
          <svg style={{ display:'block', margin:'12px auto 0', opacity:0.2 }} width="200" height="4" viewBox="0 0 200 4">
            <line x1="0" y1="2" x2="90" y2="2" stroke={gold} strokeWidth="0.5" />
            <circle cx="95" cy="2" r="1.5" fill={gold} /><circle cx="100" cy="2" r="2" fill={gold} /><circle cx="105" cy="2" r="1.5" fill={gold} />
            <line x1="110" y1="2" x2="200" y2="2" stroke={gold} strokeWidth="0.5" />
          </svg>
        </div>
      </div>
    </div>
  );
};

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

const AboutUs = () => (
  <LegalPageShell title="About KYNEX" updated="August 2026">
    <Section>
      <p>
        KYNEX is a globally regulated digital asset exchange providing institutional-grade
        cryptocurrency trading infrastructure to retail and professional clients across 150+
        jurisdictions. Headquartered in Zurich, Switzerland with operational offices in London,
        Singapore, Dubai, and New York, KYNEX delivers a secure, high-performance trading
        environment backed by enterprise-level technology and multi-layered compliance frameworks.
      </p>
    </Section>

    <Section title="Our Mission">
      <p>
        To democratize access to global digital asset markets by providing a transparent, secure,
        and technologically advanced trading platform that serves both retail investors and
        institutional participants with equal excellence. We believe that the future of finance is
        digital, and every individual deserves access to world-class trading tools regardless of
        their geographical location.
      </p>
    </Section>

    <Section title="Our Vision">
      <p>
        To become the most trusted and widely-used digital asset exchange in the world, setting the
        global standard for security, compliance, and user experience in cryptocurrency trading.
        KYNEX aims to bridge traditional finance and decentralized markets through innovation,
        regulatory adherence, and uncompromising integrity.
      </p>
    </Section>

    <Section title="Platform Capabilities">
      <ul style={{ margin:'10px 0 0 0', paddingLeft:'20px' }}>
        <li>Real-time market data with sub-second price feeds across 21+ trading pairs</li>
        <li>Spot and Futures trading with advanced order types and leverage options</li>
        <li>AI-powered trading signals with institutional-grade analytics</li>
        <li>Cold storage custody securing 98% of client assets offline</li>
        <li>Multi-network deposit and withdrawal (TRC20, ERC20, BEP20)</li>
        <li>Integrated referral program with competitive reward structures</li>
        <li>Multi-language support: English, Arabic, French, Swahili, and Portuguese</li>
        <li>24/7 live market monitoring with automated risk management systems</li>
      </ul>
    </Section>

    <Section title="Regulatory Licenses & Certificates">
      <p style={{ marginBottom:'20px' }}>
        KYNEX operates under a comprehensive international regulatory framework. We maintain
        active registrations and licenses across multiple jurisdictions:
      </p>
      {CERT_DATA.map((c, i) => (
        <Certificate key={i} idx={i} title={c.title} regBody={c.regBody}
          regNumber={c.regNumber} issued={c.issued} expires={c.expires}
          country={c.country} color={c.color}>
          {c.body}
        </Certificate>
      ))}
    </Section>

    <Section title="Security Infrastructure">
      <p>Security is the foundation of our platform. KYNEX employs a defense-in-depth strategy that includes:</p>
      <ul style={{ margin:'10px 0 0 0', paddingLeft:'20px' }}>
        <li><b>Cold Storage Architecture</b> — 98% of digital assets are stored in air-gapped, geographically distributed cold wallets with multi-signature authorization</li>
        <li><b>Penetration Testing</b> — Quarterly penetration testing by CrowdStrike and HackerOne bug bounty program</li>
        <li><b>Insurance Coverage</b> — Digital asset crime insurance policy underwritten by Lloyd's of London covering up to $250 million in aggregate</li>
        <li><b>AML/KYC Compliance</b> — Automated and manual screening powered by Chainalysis and Elliptic for transaction monitoring</li>
      </ul>
    </Section>

    <Section title="Leadership Team">
      <p>KYNEX is led by an experienced team of finance, technology, and compliance professionals:</p>
      <ul style={{ margin:'10px 0 16px 0', paddingLeft:'20px' }}>
        <li><b>Marcus Steinfeld</b> — Chief Executive Officer. Former Managing Director at Deutsche Bank Digital Assets. 18+ years in institutional finance and fintech.</li>
        <li><b>Dr. Yuki Tanaka</b> — Chief Technology Officer. Previously VP of Engineering at Coinbase. PhD in Distributed Systems from ETH Zurich.</li>
        <li><b>Alistair McKinnon</b> — Chief Compliance Officer. Former Head of Financial Crime at HSBC. Certified Anti-Money Laundering Specialist (CAMS).</li>
        <li><b>Nadia Al-Rashid</b> — Chief Financial Officer. Former Partner at PwC Middle East. CPA, CFA Charterholder.</li>
        <li><b>Elena Vasquez</b> — Head of Global Operations. Former Regional Director at Binance LATAM. MBA from INSEAD.</li>
      </ul>
    </Section>

    <Section title="Global Presence">
      <p>With offices and operations spanning five continents, KYNEX provides localized support and compliance in key financial markets:</p>
      <ul style={{ margin:'10px 0 0 0', paddingLeft:'20px' }}>
        <li><b>Zurich, Switzerland</b> (Global Headquarters) — Bahnhofstrasse 42, 8001 Zurich</li>
        <li><b>London, United Kingdom</b> (European Operations) — 25 Cabot Square, Canary Wharf, London E14 4QA</li>
        <li><b>Singapore</b> (Asia-Pacific Operations) — 1 Raffles Place, #44-02 One Raffles Place Tower 1, Singapore 048616</li>
        <li><b>Dubai, UAE</b> (Middle East & Africa Operations) — DIFC Gate Village, Building 3, Level 5, Dubai</li>
        <li><b>New York, USA</b> (Americas Operations) — 55 Hudson Yards, 35th Floor, New York, NY 10001</li>
      </ul>
    </Section>

    <Section title="Industry Memberships & Partnerships">
      <ul style={{ margin:'10px 0 0 0', paddingLeft:'20px' }}>
        <li>Member of the Global Digital Finance (GDF) Code of Conduct</li>
        <li>Associate member of the International Digital Asset Exchange Association (IDAXA)</li>
        <li>Participant in the Crypto Market Integrity Coalition (CMIC)</li>
        <li>Technology partner of Fireblocks for institutional custody solutions</li>
        <li>Strategic partnership with Chainalysis for blockchain analytics and compliance</li>
      </ul>
    </Section>

    <Section title="Corporate Information">
      <ul style={{ margin:'10px 0 0 0', paddingLeft:'20px' }}>
        <li><b>Legal Entity:</b> KYNEX AG</li>
        <li><b>Registration:</b> Commercial Register of the Canton of Zurich, No. CHE-384.719.528</li>
        <li><b>LEI (Legal Entity Identifier):</b> 5493001KZXGF8RWQB712</li>
        <li><b>Incorporation Date:</b> March 14, 2021</li>
        <li><b>Authorized Share Capital:</b> CHF 50,000,000</li>
        <li><b>Auditor:</b> Deloitte AG, Zurich</li>
      </ul>
    </Section>
  </LegalPageShell>
);

export default AboutUs;
