import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, TrendingUp, Shield, Globe, Award, Smartphone, RefreshCw, Wifi, HardDrive, Download as DownloadIcon, CheckCircle } from 'lucide-react';
import { CoinIcon } from '../components/CoinIcons';
import { useTheme } from '../ThemeContext';

const FloatingCoin = ({ symbol, size, top, left, right, bottom, delay, duration }) => (
  <div style={{
    position: 'absolute', top, left, right, bottom, zIndex: 1,
    animation: `coinFloat ${duration || '6s'} ease-in-out ${delay || '0s'} infinite`,
    opacity: 0.55, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))',
  }}>
    <CoinIcon symbol={symbol} size={size} />
  </div>
);

const MINI_SIGNERS = ['M. Lehmann', 'J. Whitfield', 'R. Hernandez', 'K. Lim Wei', 'H. Al-Maktoum', 'A. Schmidt'];

const MiniSigSVG = ({ idx }) => {
  const s = { fill:'none', strokeLinecap:'round', strokeLinejoin:'round' };
  switch (idx) {
    case 0: return <svg width="50" height="16" viewBox="0 0 50 16"><path d="M3,12 C6,2 10,2 12,8 C13,11 11,14 9,12 C7,10 10,4 15,5 C20,6 18,12 22,10 C26,8 24,4 28,6 C32,8 30,12 34,10 C38,8 42,4 46,8" stroke="#1a1a1a" strokeWidth="1.1" opacity="0.55" {...s} /></svg>;
    case 1: return <svg width="50" height="16" viewBox="0 0 50 16"><path d="M4,10 L9,3 L13,10 L17,2 L21,9 L25,4 L29,10 L32,6" stroke="#111" strokeWidth="1.4" opacity="0.5" {...s} /><circle cx="36" cy="8" r="1.2" fill="#111" opacity="0.3" /></svg>;
    case 2: return <svg width="50" height="16" viewBox="0 0 50 16"><path d="M5,14 L5,3 C5,2 8,1 10,3 C12,5 10,8 7,8 L5,8" stroke="#222" strokeWidth="1.5" opacity="0.5" {...s} /><path d="M7,8 L13,14" stroke="#222" strokeWidth="1.2" opacity="0.45" {...s} /><path d="M15,10 C18,6 21,10 24,8 C27,6 30,10 34,8 C38,6 42,10 46,8" stroke="#222" strokeWidth="0.9" opacity="0.35" {...s} /></svg>;
    case 3: return <svg width="50" height="16" viewBox="0 0 50 16"><path d="M6,8 C7,4 9,4 10,7 C11,10 9,11 10,8 C11,5 13,5 14,8 C15,11 13,12 14,8 C15,5 17,4 18,7 C19,10 17,12 20,8 C22,6 24,6 26,8" stroke="#1a1a1a" strokeWidth="1.3" opacity="0.45" {...s} /><path d="M28,8 L38,8" stroke="#1a1a1a" strokeWidth="0.6" opacity="0.25" strokeDasharray="1.5,2" /></svg>;
    case 4: return <svg width="50" height="16" viewBox="0 0 50 16"><path d="M7,10 C10,3 15,3 18,7 C21,11 17,14 14,11 C11,8 16,4 22,6 C28,8 26,12 30,10 C34,8 32,4 38,8 C42,10 40,14 44,10" stroke="#111" strokeWidth="1.1" opacity="0.45" {...s} /><circle cx="20" cy="4" r="1" fill="#111" opacity="0.35" /></svg>;
    case 5: return <svg width="50" height="16" viewBox="0 0 50 16"><path d="M10,14 L16,3 L22,14" stroke="#1a1a1a" strokeWidth="1.4" opacity="0.5" {...s} /><path d="M13,10 L19,10" stroke="#1a1a1a" strokeWidth="1" opacity="0.4" /><path d="M24,4 C24,4 28,3 29,6 C30,9 26,10 26,10 C26,10 30,11 30,8 C30,5 26,14 30,14" stroke="#1a1a1a" strokeWidth="1.2" opacity="0.45" {...s} /><path d="M8,15 L34,15" stroke="#1a1a1a" strokeWidth="0.5" opacity="0.25" /></svg>;
    default: return <svg width="50" height="16" viewBox="0 0 50 16"><path d="M5,10 Q15,2 25,10 Q35,18 45,10" stroke="#222" strokeWidth="1" opacity="0.4" {...s} /></svg>;
  }
};

const MiniStampSVG = ({ idx, color }) => {
  const s = 34;
  switch (idx) {
    case 0: return <svg width={s} height={s} viewBox="0 0 34 34" style={{transform:'rotate(-12deg)'}}><circle cx="17" cy="17" r="15" fill="none" stroke={color} strokeWidth="1.5" opacity="0.28" /><rect x="14.5" y="9" width="5" height="16" rx="0.5" fill={color} opacity="0.18" /><rect x="9" y="14.5" width="16" height="5" rx="0.5" fill={color} opacity="0.18" /></svg>;
    case 1: return <svg width={s} height={s} viewBox="0 0 34 34" style={{transform:'rotate(-8deg)'}}><rect x="3" y="5" width="28" height="24" rx="2" fill="none" stroke={color} strokeWidth="1.5" opacity="0.28" /><text x="17" y="16" textAnchor="middle" fontSize="6" fill={color} opacity="0.3" fontWeight="800">FCA</text><line x1="8" y1="19" x2="26" y2="19" stroke={color} strokeWidth="0.5" opacity="0.2" /><text x="17" y="25" textAnchor="middle" fontSize="3.5" fill={color} opacity="0.22">REGISTERED</text></svg>;
    case 2: return <svg width={s} height={s} viewBox="0 0 34 34" style={{transform:'rotate(-18deg)'}}><circle cx="17" cy="17" r="15" fill="none" stroke={color} strokeWidth="1.5" opacity="0.25" /><circle cx="17" cy="17" r="11" fill="none" stroke={color} strokeWidth="1" opacity="0.18" />{[0,72,144,216,288].map((a,i)=>{const r=13.5,rad=a*Math.PI/180;return <text key={i} x={17+Math.cos(rad)*r} y={17+Math.sin(rad)*r} textAnchor="middle" fontSize="3.5" fill={color} opacity="0.2">★</text>})}<text x="17" y="16" textAnchor="middle" fontSize="5" fill={color} opacity="0.3" fontWeight="800">MSB</text></svg>;
    case 3: return <svg width={s} height={s} viewBox="0 0 34 34" style={{transform:'rotate(-6deg)'}}><circle cx="17" cy="17" r="15" fill="none" stroke={color} strokeWidth="1.5" opacity="0.28" strokeDasharray="3,1.5" /><circle cx="17" cy="17" r="11" fill="none" stroke={color} strokeWidth="0.8" opacity="0.2" /><text x="17" y="16" textAnchor="middle" fontSize="6.5" fill={color} opacity="0.3" fontWeight="900">MAS</text><text x="17" y="23" textAnchor="middle" fontSize="3" fill={color} opacity="0.2">LICENSED</text></svg>;
    case 4: return <svg width={s} height={s} viewBox="0 0 34 34" style={{transform:'rotate(-15deg)'}}><polygon points="17,2 30,10 30,24 17,32 4,24 4,10" fill="none" stroke={color} strokeWidth="1.5" opacity="0.28" /><text x="17" y="16" textAnchor="middle" fontSize="5.5" fill={color} opacity="0.3" fontWeight="800">VARA</text><text x="17" y="22" textAnchor="middle" fontSize="3" fill={color} opacity="0.2">DUBAI</text></svg>;
    case 5: return <svg width={s} height={s} viewBox="0 0 34 34" style={{transform:'rotate(-10deg)'}}>{Array.from({length:8}).map((_,i)=>{const a=i*45*Math.PI/180;return <line key={i} x1={17+Math.cos(a)*9} y1={17+Math.sin(a)*9} x2={17+Math.cos(a)*14} y2={17+Math.sin(a)*14} stroke={color} strokeWidth="3" opacity="0.1" strokeLinecap="round" />})}<circle cx="17" cy="17" r="9" fill="none" stroke={color} strokeWidth="1.2" opacity="0.22" /><text x="17" y="16" textAnchor="middle" fontSize="5.5" fill={color} opacity="0.3" fontWeight="800">ISO</text><text x="17" y="22" textAnchor="middle" fontSize="3" fill={color} opacity="0.18">27001</text></svg>;
    default: return <svg width={s} height={s} viewBox="0 0 34 34"><circle cx="17" cy="17" r="14" fill="none" stroke={color} strokeWidth="1.5" opacity="0.25" /></svg>;
  }
};

const MINI_PATTERNS = [
  (g) => `repeating-linear-gradient(45deg, ${g} 0px, ${g} 1px, transparent 1px, transparent 12px)`,
  (g) => `repeating-linear-gradient(-45deg, ${g} 0px, ${g} 0.5px, transparent 0.5px, transparent 9px), repeating-linear-gradient(45deg, ${g} 0px, ${g} 0.5px, transparent 0.5px, transparent 9px)`,
  (g) => `repeating-radial-gradient(circle at 50% 50%, transparent 0px, transparent 7px, ${g} 7px, ${g} 8px, transparent 8px, transparent 15px)`,
  (g) => `repeating-linear-gradient(0deg, ${g} 0px, ${g} 0.5px, transparent 0.5px, transparent 5px), repeating-linear-gradient(90deg, ${g} 0px, ${g} 0.5px, transparent 0.5px, transparent 5px)`,
  (g) => `repeating-linear-gradient(60deg, ${g} 0px, ${g} 0.6px, transparent 0.6px, transparent 10px)`,
  (g) => `repeating-linear-gradient(30deg, ${g} 0px, ${g} 0.5px, transparent 0.5px, transparent 7px), repeating-linear-gradient(150deg, ${g} 0px, ${g} 0.5px, transparent 0.5px, transparent 7px)`,
];

const MiniSealSVG = ({ idx, color }) => {
  const cx=24, cy=24;
  const gold = '#B8973B';
  return <svg width="48" height="48" viewBox="0 0 48 48">
    {Array.from({length:24}).map((_,i) => {
      const a = (i*15)*Math.PI/180, r1=22, r2=i%2===0?19:17;
      return <line key={i} x1={cx+Math.cos(a)*r2} y1={cy+Math.sin(a)*r2} x2={cx+Math.cos(a)*r1} y2={cy+Math.sin(a)*r1} stroke={gold} strokeWidth="1.2" opacity="0.45" />;
    })}
    <circle cx={cx} cy={cy} r="17" fill="none" stroke={color} strokeWidth="1.5" />
    <circle cx={cx} cy={cy} r="13" fill={color} opacity="0.06" />
    {idx===0 && <><rect x="21" y="14" width="6" height="20" rx="0.5" fill={color} opacity="0.4" /><rect x="14" y="21" width="20" height="6" rx="0.5" fill={color} opacity="0.4" /></>}
    {idx===1 && <path d="M16,30 L17.5,20 L20,25 L22,18 L24,22 L26,18 L28,25 L30.5,20 L32,30 Z" fill={color} opacity="0.4" />}
    {idx===2 && <><path d="M24,14 L32,20 L32,28 C32,32 28,34 24,36 C20,34 16,32 16,28 L16,20 Z" fill={color} opacity="0.3" /><polygon points="24,20 25.5,24 30,24 26.5,27 27.5,31 24,28.5 20.5,31 21.5,27 18,24 22.5,24" fill="white" opacity="0.5" /></>}
    {idx===3 && <><polygon points="24,12 27,20 36,20 29,26 31,34 24,29 17,34 19,26 12,20 21,20" fill={color} opacity="0.4" /><circle cx="24" cy="24" r="4" fill="white" opacity="0.5" /></>}
    {idx===4 && <><circle cx="24" cy="25" r="10" fill={color} opacity="0.25" /><circle cx="28" cy="22" r="8" fill="#FFFEF7" opacity="0.85" /><polygon points="22,17 23,20.5 26,20.5 23.5,23 24.5,26.5 22,24 19.5,26.5 20.5,23 18,20.5 21,20.5" fill={color} opacity="0.45" /></>}
    {idx===5 && <>{Array.from({length:6}).map((_,i)=>{const a=i*60*Math.PI/180;return <line key={i} x1={24+Math.cos(a)*7} y1={24+Math.sin(a)*7} x2={24+Math.cos(a)*13} y2={24+Math.sin(a)*13} stroke={color} strokeWidth="3.5" opacity="0.15" strokeLinecap="round" />})}<circle cx="24" cy="24" r="7" fill={color} opacity="0.2" /><circle cx="24" cy="24" r="4" fill="white" opacity="0.4" /></>}
  </svg>;
};

const CertBadge = ({ title, body, regNo, color, seal, idx }) => {
  const gold = '#B8973B';
  const pat = MINI_PATTERNS[idx % MINI_PATTERNS.length];
  const signerName = MINI_SIGNERS[idx % MINI_SIGNERS.length];

  return (
    <div style={{
      background: '#FFFEF7',
      borderRadius: '4px',
      border: `2.5px solid ${gold}`,
      padding: '3px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
    }}>
      <div style={{
        border: `1.5px solid ${gold}88`,
        borderRadius: '3px',
        padding: '18px 16px 14px',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '180px',
      }}>
        <div style={{ position:'absolute', inset:0, opacity:0.025, pointerEvents:'none', backgroundImage:pat(gold) }} />
        {[{t:2,l:2,s:''},{t:2,r:2,s:'scaleX(-1)'},{b:2,l:2,s:'scaleY(-1)'},{b:2,r:2,s:'scale(-1)'}].map((pos,pi) => (
          <svg key={pi} style={{position:'absolute',top:pos.t,bottom:pos.b,left:pos.l,right:pos.r,transform:pos.s}} width="28" height="28" viewBox="0 0 28 28">
            <path d="M0,0 L28,0 L28,4 Q14,4 4,14 L4,28 L0,28 Z" fill={gold} opacity="0.2" />
            <path d="M0,0 L18,0 L18,3 Q10,3 3,10 L3,18 L0,18 Z" fill={gold} opacity="0.35" />
            <circle cx="4" cy="4" r="1.5" fill={gold} opacity="0.4" />
          </svg>
        ))}
        <div style={{ textAlign:'center', marginBottom:'8px' }}>
          <MiniSealSVG idx={idx} color={color} />
        </div>
        <div style={{ textAlign:'center', marginBottom:'4px' }}>
          <div style={{ fontSize:'7px', letterSpacing:'2.5px', color:'#888', textTransform:'uppercase', marginBottom:'4px' }}>{seal}</div>
          <div style={{ fontSize:'11px', fontWeight:'700', color:'#1a1a1a', fontFamily:'Georgia, "Times New Roman", serif', lineHeight:1.3 }}>{title}</div>
        </div>
        <div style={{ textAlign:'center', fontSize:'8.5px', color:'#555', lineHeight:'1.6', margin:'8px 0', fontFamily:'Georgia, "Times New Roman", serif' }}>
          <div style={{ fontWeight:'700', color:'#111', fontSize:'11px', letterSpacing:'1.5px', margin:'4px 0' }}>KYNEX AG</div>
          <div>{body}</div>
        </div>
        <div style={{ textAlign:'center', margin:'8px 0 6px' }}>
          <span style={{ fontSize:'7px', color:'#777', letterSpacing:'0.8px', fontFamily:'monospace', background:`${gold}11`, padding:'3px 8px', borderRadius:'2px', border:`1px solid ${gold}22` }}>{regNo}</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginTop:'10px' }}>
          <div style={{ fontSize:'7px', color:'#999' }}>
            <MiniSigSVG idx={idx} />
            <div style={{ borderTop:'1px solid #ccc', paddingTop:'2px', width:'50px', fontSize:'6.5px' }}>{signerName}</div>
          </div>
          <MiniStampSVG idx={idx} color={color} />
        </div>
      </div>
    </div>
  );
};

const CERTS = [
  { title: 'FINMA VASP Registration', body: 'Registered Virtual Asset Service Provider under Swiss Anti-Money Laundering Act', regNo: 'CHE-384.719.528', color: '#D52B1E', seal: 'Swiss Confederation' },
  { title: 'FCA Cryptoasset Registration', body: 'Registered under Money Laundering Regulations 2017 for Cryptoasset Exchange', regNo: 'FRN: 924817', color: '#003087', seal: 'United Kingdom' },
  { title: 'FinCEN MSB Registration', body: 'Money Services Business — Money Transmission & Virtual Currency', regNo: 'MSB 31000276419582', color: '#002868', seal: 'United States of America' },
  { title: 'MAS DPT Service License', body: 'Licensed under Payment Services Act 2019 for Digital Payment Tokens', regNo: 'PS20220001438', color: '#EF3340', seal: 'Republic of Singapore' },
  { title: 'VARA Exchange License', body: 'Virtual Asset Exchange, Broker-Dealer & Custody Services', regNo: 'VARA-2024-00397', color: '#00732F', seal: 'UAE — Dubai' },
  { title: 'ISO/IEC 27001:2022', body: 'Information Security Management System Certification', regNo: 'IS 809247 / Deloitte AG', color: '#00539F', seal: 'International Standard' },
];

const Download = () => {
  const { theme, iconBadges } = useTheme();
  const navigate = useNavigate();
  const [showIosGuide, setShowIosGuide] = useState(false);

  const features = [
    { icon: <Zap size={28} />, badge: iconBadges.amber, title: 'Lightning-fast transactions', desc: 'The KYNEX matching engine enables up to 100,000 transactions per second' },
    { icon: <TrendingUp size={28} />, badge: iconBadges.purple, title: 'Turn costs into investments', desc: 'Access the most popular crypto perpetual future contracts, as well as spot crypto' },
    { icon: <Shield size={28} />, badge: iconBadges.green, title: 'Security you can trust', desc: 'Your assets are protected with industry-leading encryption and multi-layer security' },
    { icon: <Globe size={28} />, badge: iconBadges.blue, title: 'Trade anytime, anywhere', desc: 'Our platform is available 24/7 across all devices with real-time market data' },
  ];

  const appBenefits = [
    { icon: <RefreshCw size={18} />, title: 'Always Up-to-Date', desc: 'App updates automatically with the platform — no manual updates needed' },
    { icon: <Wifi size={18} />, title: 'Live Web Technology', desc: 'Built as a smart web app that loads the latest version every time you open it' },
    { icon: <HardDrive size={18} />, title: 'Lightweight (~3 MB)', desc: 'Small because the app is a smart launcher — all features load from our secure servers' },
    { icon: <Smartphone size={18} />, title: 'Native App Feel', desc: 'Fullscreen experience with no browser bar — looks and feels like a native app' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, color: theme.text }}>
      <style>{`
        @keyframes coinFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-12px) rotate(5deg); }
          75% { transform: translateY(8px) rotate(-3deg); }
        }
        @keyframes gridPulse {
          0%, 100% { opacity: 0.08; }
          50% { opacity: 0.15; }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @media (max-width: 520px) {
          .dl-feature-grid { grid-template-columns: 1fr !important; }
          .dl-cert-grid { grid-template-columns: 1fr 1fr !important; }
          .dl-platform-grid { grid-template-columns: 1fr !important; }
          .dl-benefits-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px',
        borderBottom: `1px solid ${theme.cardBorder}`,
        backgroundColor: theme.card,
        backdropFilter: theme.cardGlass || 'blur(16px)', WebkitBackdropFilter: theme.cardGlass || 'blur(16px)',
        position: 'relative', zIndex: 10,
      }}>
        <Link to="/" style={{ color: theme.text, display: 'flex' }}><ArrowLeft size={20} /></Link>
        <span style={{ fontWeight: 'bold', fontSize: '17px', letterSpacing: '0.3px', color: theme.brand }}>KYNEX</span>
      </div>

      {/* Hero Section */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        padding: '60px 20px 50px', textAlign: 'center',
        background: `linear-gradient(180deg, ${theme.bg} 0%, ${theme.card} 50%, ${theme.bg} 100%)`,
        minHeight: '340px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: `linear-gradient(${theme.cardBorder} 1px, transparent 1px), linear-gradient(90deg, ${theme.cardBorder} 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          animation: 'gridPulse 8s ease-in-out infinite',
        }} />

        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0, opacity: 0.1 }} preserveAspectRatio="none" viewBox="0 0 400 500">
          <line x1="100" y1="0" x2="300" y2="500" stroke={theme.text} strokeWidth="0.5" />
          <line x1="300" y1="0" x2="100" y2="500" stroke={theme.text} strokeWidth="0.5" />
          <line x1="0" y1="150" x2="400" y2="150" stroke={theme.text} strokeWidth="0.5" />
          <line x1="0" y1="350" x2="400" y2="350" stroke={theme.text} strokeWidth="0.5" />
          <rect x="120" y="80" width="160" height="160" stroke={theme.text} strokeWidth="0.5" fill="none" transform="rotate(45, 200, 160)" />
        </svg>

        {[
          { top: '15%', left: '30%', delay: '0s' },
          { top: '25%', right: '25%', delay: '1.5s' },
          { top: '60%', left: '20%', delay: '3s' },
          { top: '70%', right: '15%', delay: '0.8s' },
        ].map((s, i) => (
          <div key={i} style={{
            position: 'absolute', top: s.top, left: s.left, right: s.right,
            width: 4, height: 4, backgroundColor: theme.faint,
            transform: 'rotate(45deg)', zIndex: 1,
            animation: `sparkle 3s ease-in-out ${s.delay} infinite`,
          }} />
        ))}

        <FloatingCoin symbol="BTC" size={48} top="18%" left="8%" delay="0s" duration="7s" />
        <FloatingCoin symbol="ETH" size={40} top="30%" right="10%" delay="1s" duration="5.5s" />
        <FloatingCoin symbol="USDT" size={36} bottom="25%" right="8%" delay="2s" duration="6.5s" />
        <FloatingCoin symbol="SOL" size={32} bottom="30%" left="12%" delay="0.5s" duration="8s" />
        <FloatingCoin symbol="BNB" size={28} top="12%" right="22%" delay="1.5s" duration="5s" />
        <FloatingCoin symbol="LTC" size={30} bottom="15%" left="28%" delay="3s" duration="7.5s" />

        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: theme.primaryGradient || theme.primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: 22, color: 'white', letterSpacing: 1,
          marginBottom: 24, position: 'relative', zIndex: 2,
          boxShadow: `0 8px 32px rgba(59,130,246,0.4)`,
        }}>
          K
        </div>

        <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.5px', position: 'relative', zIndex: 2 }}>
          Get KYNEX App
        </h1>
        <p style={{ color: theme.faint, fontSize: '14px', margin: '0 0 36px', position: 'relative', zIndex: 2, maxWidth: 360 }}>
          Trade crypto on the go with our fast, secure & always up-to-date application
        </p>
      </div>

      {/* Platform Download Cards */}
      <div style={{ padding: '0 20px 40px', maxWidth: '600px', margin: '-30px auto 0' }}>
        <div className="dl-platform-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', position: 'relative', zIndex: 3 }}>

          {/* Android Card */}
          <div style={{
            padding: '24px 20px', borderRadius: '16px',
            backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`,
            boxShadow: theme.shadowElevated || theme.shadow,
            backdropFilter: theme.cardGlass || 'blur(16px)', WebkitBackdropFilter: theme.cardGlass || 'blur(16px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'linear-gradient(135deg, #3DDC84, #2DA65A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 14, boxShadow: '0 4px 16px rgba(61,220,132,0.3)',
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="white"><path d="M17.523 2.237a.625.625 0 0 0-.803.368L15.482 6H8.518L7.28 2.605a.625.625 0 1 0-1.17.435L7.24 6H4.625a.625.625 0 0 0 0 1.25h.838L7.1 17.563A2.625 2.625 0 0 0 9.69 19.75h4.62a2.625 2.625 0 0 0 2.59-2.188L18.537 7.25h.838a.625.625 0 0 0 0-1.25H16.76l1.13-2.96a.625.625 0 0 0-.368-.803z"/></svg>
            </div>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700 }}>Android</h3>
            <p style={{ margin: '0 0 6px', fontSize: '11px', color: theme.faint }}>APK Download</p>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: '11px', color: theme.up, fontWeight: 600,
              backgroundColor: `${theme.up}15`, padding: '3px 10px', borderRadius: 20,
              marginBottom: 14,
            }}>
              <CheckCircle size={12} /> v1.0 — 3.4 MB
            </div>
            <a
              href={`${window.location.origin}/kynex.apk`}
              download
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '12px 24px', borderRadius: '10px', border: 'none', width: '100%',
                background: 'linear-gradient(135deg, #3DDC84, #2DA65A)',
                color: 'white', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                textDecoration: 'none', boxShadow: '0 4px 16px rgba(61,220,132,0.3)',
              }}
            >
              <DownloadIcon size={16} /> Download
            </a>
          </div>

          {/* iOS Card */}
          <div style={{
            padding: '24px 20px', borderRadius: '16px',
            backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`,
            boxShadow: theme.shadowElevated || theme.shadow,
            backdropFilter: theme.cardGlass || 'blur(16px)', WebkitBackdropFilter: theme.cardGlass || 'blur(16px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'linear-gradient(135deg, #555, #222)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 14, boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
            </div>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700 }}>iPhone</h3>
            <p style={{ margin: '0 0 6px', fontSize: '11px', color: theme.faint }}>Add to Home Screen</p>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: '11px', color: theme.primary, fontWeight: 600,
              backgroundColor: `${theme.primary}15`, padding: '3px 10px', borderRadius: 20,
              marginBottom: 14,
            }}>
              <Smartphone size={12} /> No download needed
            </div>
            <button
              onClick={() => setShowIosGuide(true)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '12px 24px', borderRadius: '10px', border: 'none', width: '100%',
                background: 'linear-gradient(135deg, #555, #222)',
                color: 'white', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              }}
            >
              View Guide
            </button>
          </div>
        </div>

        {/* Why Small Size Info */}
        <div style={{
          marginTop: 20, padding: '18px 20px', borderRadius: '14px',
          backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`,
          boxShadow: theme.shadow,
          backdropFilter: theme.cardGlass || 'blur(16px)', WebkitBackdropFilter: theme.cardGlass || 'blur(16px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <RefreshCw size={16} style={{ color: theme.brand }} />
            <span style={{ fontWeight: 700, fontSize: '14px' }}>Why is the app only 3 MB?</span>
          </div>
          <p style={{ margin: '0 0 14px', fontSize: '12px', color: theme.subtext, lineHeight: 1.7 }}>
            KYNEX is a <strong style={{ color: theme.text }}>smart web application</strong> — the app acts as a secure launcher that connects directly to our servers. All features, data, and updates load in real-time from the cloud.
          </p>
          <div className="dl-benefits-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {appBenefits.map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  backgroundColor: `${theme.primary}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: theme.primary,
                }}>
                  {b.icon}
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, marginBottom: 2 }}>{b.title}</div>
                  <div style={{ fontSize: '10px', color: theme.faint, lineHeight: 1.5 }}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* QR Code */}
        <div style={{ textAlign: 'center', marginTop: 30 }}>
          <div style={{
            width: 130, height: 130, backgroundColor: 'white', borderRadius: 12,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: theme.shadowElevated || theme.shadow,
            marginBottom: 10,
          }}>
            <svg width="100" height="100" viewBox="0 0 110 110">
              <rect x="0" y="0" width="35" height="35" rx="4" fill="#111827"/>
              <rect x="5" y="5" width="25" height="25" rx="2" fill="white"/>
              <rect x="10" y="10" width="15" height="15" rx="1" fill="#111827"/>
              <rect x="75" y="0" width="35" height="35" rx="4" fill="#111827"/>
              <rect x="80" y="5" width="25" height="25" rx="2" fill="white"/>
              <rect x="85" y="10" width="15" height="15" rx="1" fill="#111827"/>
              <rect x="0" y="75" width="35" height="35" rx="4" fill="#111827"/>
              <rect x="5" y="80" width="25" height="25" rx="2" fill="white"/>
              <rect x="10" y="85" width="15" height="15" rx="1" fill="#111827"/>
              <rect x="42" y="42" width="26" height="26" rx="4" fill="#3B82F6"/>
              <text x="55" y="59" textAnchor="middle" fill="white" fontSize="14" fontWeight="900">K</text>
              {[40,47,54,61,68].map(x => [40,47,54,61,68].map(y => (
                (x < 42 || x > 64 || y < 42 || y > 64) &&
                <rect key={`${x}-${y}`} x={x} y={y} width="5" height="5" rx="1" fill="#111827" opacity={(x+y) % 14 < 7 ? 0.8 : 0.3} />
              )))}
            </svg>
          </div>
          <p style={{ color: theme.faint, fontSize: '12px', margin: 0 }}>
            Scan to open KYNEX on your phone
          </p>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${theme.cardBorder}, transparent)` }} />

      {/* Features Section */}
      <div style={{ padding: '50px 20px 40px', maxWidth: '600px', margin: '0 auto' }}>
        <div className="dl-feature-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
          {features.map((f, i) => (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column', gap: '12px',
              padding: '20px', borderRadius: '16px',
              backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`,
              boxShadow: theme.shadow,
              backdropFilter: theme.cardGlass || 'blur(16px)', WebkitBackdropFilter: theme.cardGlass || 'blur(16px)',
            }}>
              <div style={{
                width: 50, height: 50, borderRadius: 14,
                backgroundColor: f.badge.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: f.badge.fg,
              }}>
                {f.icon}
              </div>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, lineHeight: 1.3 }}>{f.title}</h4>
              <p style={{ margin: 0, fontSize: '12px', color: theme.faint, lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate('/auth')}
          style={{
            display: 'block', width: '100%', marginTop: 40,
            padding: '16px', borderRadius: '12px', border: 'none',
            background: theme.primaryGradient || theme.primary,
            color: 'white', fontWeight: 700, fontSize: '15px', cursor: 'pointer',
            boxShadow: '0 6px 24px rgba(59,130,246,0.35)',
          }}
        >
          Open Web App
        </button>
        <p style={{ textAlign: 'center', color: theme.faint, fontSize: '12px', marginTop: 12, marginBottom: 0 }}>
          No install needed — works on any device with a browser
        </p>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${theme.cardBorder}, transparent)`, margin: '0 20px' }} />

      {/* iOS Guide Modal */}
      {showIosGuide && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          backgroundColor: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: theme.card, borderRadius: '20px', border: `1px solid ${theme.cardBorder}`,
            boxShadow: theme.shadowElevated, backdropFilter: theme.cardGlass, WebkitBackdropFilter: theme.cardGlass,
            maxWidth: '400px', width: '100%', padding: '28px 24px', maxHeight: '80vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: theme.text }}>Install on iPhone</h3>
              <button onClick={() => setShowIosGuide(false)} style={{ background: 'none', border: 'none', color: theme.faint, cursor: 'pointer', fontSize: '22px', padding: 0, lineHeight: 1 }}>×</button>
            </div>

            <p style={{ color: theme.subtext, fontSize: '13px', marginBottom: '20px', lineHeight: 1.6 }}>
              KYNEX works as a full-screen app on iPhone — no App Store needed. Just follow these steps:
            </p>

            {[
              { step: 1, title: 'Open in Safari', desc: 'Open kynex.site in Safari browser (not Chrome or other browsers).', icon: <Globe size={16} /> },
              { step: 2, title: 'Tap the Share button', desc: 'Tap the Share icon (square with arrow pointing up) at the bottom of Safari.', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> },
              { step: 3, title: 'Add to Home Screen', desc: 'Scroll down in the share menu and tap "Add to Home Screen".', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> },
              { step: 4, title: 'Confirm & Add', desc: 'Keep the name "KYNEX" and tap "Add" in the top right corner.', icon: <CheckCircle size={16} /> },
              { step: 5, title: 'Done!', desc: 'KYNEX icon appears on your home screen. Open it for a full-screen app experience.', icon: <Smartphone size={16} /> },
            ].map(s => (
              <div key={s.step} style={{ display: 'flex', gap: '14px', marginBottom: '16px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                  background: theme.primaryGradient || theme.primary,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white',
                }}>{s.icon}</div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: theme.text, marginBottom: '2px' }}>
                    <span style={{ color: theme.faint, marginRight: 6, fontSize: '12px' }}>Step {s.step}</span>
                    {s.title}
                  </div>
                  <div style={{ fontSize: '12px', color: theme.subtext, lineHeight: 1.5 }}>{s.desc}</div>
                </div>
              </div>
            ))}

            <button onClick={() => setShowIosGuide(false)} style={{
              width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
              background: theme.primaryGradient || theme.primary,
              color: 'white', fontWeight: 700, fontSize: '15px', cursor: 'pointer',
              marginTop: '8px', boxShadow: '0 6px 18px rgba(59,130,246,0.3)',
            }}>
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Certificates Section */}
      <div style={{ padding: '40px 20px 60px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Award size={20} style={{ color: '#B8973B' }} />
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, letterSpacing: '-0.3px' }}>Regulatory Licenses & Certifications</h2>
        </div>
        <p style={{ color: theme.faint, fontSize: '13px', margin: '0 0 24px', lineHeight: 1.5 }}>
          KYNEX is registered and regulated across multiple international jurisdictions. All licenses can be independently verified with the respective regulatory authorities.
        </p>

        <div className="dl-cert-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
          {CERTS.map((c, i) => (
            <CertBadge key={i} idx={i} {...c} />
          ))}
        </div>

        <div style={{
          marginTop: '20px', padding: '14px 16px', borderRadius: '12px',
          backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`,
          boxShadow: theme.shadow,
        }}>
          <p style={{ margin: 0, fontSize: '11px', color: theme.faint, lineHeight: 1.6 }}>
            KYNEX AG is incorporated in the Canton of Zurich, Switzerland (CHE-384.719.528).
            SOC 2 Type II and ISO 27001:2022 certified. Audited by Deloitte AG.
            Digital asset insurance coverage by Lloyd's of London (up to $250M aggregate).
            For full regulatory details, visit <Link to="/legal/about" style={{ color: theme.brand, textDecoration: 'underline' }}>About KYNEX</Link>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Download;
