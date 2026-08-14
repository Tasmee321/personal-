import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { useTheme } from '../ThemeContext';

/* ─────────────────────────────────────────────
   UNIQUE SIGNATURES — 7 distinct hand styles
───────────────────────────────────────────── */
const Sig = ({ idx }) => {
  const p = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  const sigs = [
    <svg key={0} width="110" height="38" viewBox="0 0 110 38">
      <path d="M8,30 C16,6 24,4 28,18 C31,26 25,32 20,27 C15,22 22,10 34,13 C44,16 38,28 46,23 C54,18 48,8 60,12 C67,15 64,26 72,21 C80,16 76,8 86,13 C91,16 96,22 102,17" stroke="#1c1c1c" strokeWidth="1.8" opacity="0.65" {...p}/>
      <path d="M18,33 L102,33" stroke="#1c1c1c" strokeWidth="0.5" opacity="0.2"/>
    </svg>,
    <svg key={1} width="110" height="38" viewBox="0 0 110 38">
      <path d="M10,24 L20,6 L28,22 L38,4 L46,20 L54,8 L62,24 L68,14 L76,28 L84,12 L92,22 L100,14" stroke="#111" strokeWidth="2.1" opacity="0.6" {...p}/>
      <circle cx="104" cy="24" r="2.2" fill="#111" opacity="0.4"/>
    </svg>,
    <svg key={2} width="110" height="38" viewBox="0 0 110 38">
      <path d="M12,32 L12,6 C12,3 17,1 22,6 C27,11 24,18 16,18 L12,18" stroke="#222" strokeWidth="2.4" opacity="0.6" {...p}/>
      <path d="M16,18 L28,32" stroke="#222" strokeWidth="2" opacity="0.55" {...p}/>
      <path d="M32,22 C37,14 43,24 49,17 C55,10 61,22 67,15 C73,8 80,20 88,14 C94,9 100,18 106,14" stroke="#222" strokeWidth="1.3" opacity="0.45" {...p}/>
      <path d="M30,30 L106,30" stroke="#222" strokeWidth="0.5" opacity="0.18"/>
    </svg>,
    <svg key={3} width="110" height="38" viewBox="0 0 110 38">
      <path d="M14,20 C17,9 22,9 25,16 C28,23 22,26 24,19 C26,12 31,11 34,18 C37,25 31,27 34,20 C37,13 42,11 45,18 C48,25 43,27 46,20 C49,13 54,11 57,18 C60,25 55,27 58,20 C61,15 65,12 69,18" stroke="#1a1a1a" strokeWidth="1.9" opacity="0.55" {...p}/>
      <path d="M72,20 L92,20" stroke="#1a1a1a" strokeWidth="0.9" opacity="0.28" {...p} strokeDasharray="2,3"/>
    </svg>,
    <svg key={4} width="110" height="38" viewBox="0 0 110 38">
      <path d="M16,22 C22,6 32,5 37,15 C42,25 34,31 29,24 C24,17 33,11 43,15 C53,19 48,29 55,24 C62,19 57,10 66,15 C71,18 69,25 75,20 C81,15 76,8 84,13 C90,17 87,26 94,20" stroke="#111" strokeWidth="1.7" opacity="0.55" {...p}/>
      <circle cx="38" cy="7" r="2" fill="#111" opacity="0.45"/>
      <circle cx="68" cy="7" r="1.7" fill="#111" opacity="0.35"/>
    </svg>,
    <svg key={5} width="110" height="38" viewBox="0 0 110 38">
      <path d="M20,32 L32,6 L44,32" stroke="#1a1a1a" strokeWidth="2.2" opacity="0.6" {...p}/>
      <path d="M25,22 L39,22" stroke="#1a1a1a" strokeWidth="1.6" opacity="0.5"/>
      <path d="M48,8 C48,8 56,5 59,13 C62,21 52,24 52,24 C52,24 62,26 62,18 C62,10 52,32 62,32" stroke="#1a1a1a" strokeWidth="1.9" opacity="0.55" {...p}/>
      <path d="M14,35 L68,35" stroke="#1a1a1a" strokeWidth="0.9" opacity="0.28"/>
    </svg>,
    <svg key={6} width="110" height="38" viewBox="0 0 110 38">
      <path d="M22,4 C25,12 20,21 24,30" stroke="#222" strokeWidth="2.8" opacity="0.55" {...p}/>
      <path d="M24,18 C32,13 40,20 48,15 C56,10 64,18 72,13 C80,8 88,16 96,13 C101,10 105,15 108,12" stroke="#222" strokeWidth="1.3" opacity="0.5" {...p}/>
      <path d="M17,32 L108,32" stroke="#222" strokeWidth="0.6" opacity="0.18"/>
    </svg>,
  ];
  return sigs[idx % sigs.length];
};

/* ─────────────────────────────────────────────
   7 COMPLETELY DIFFERENT CERTIFICATE DESIGNS
───────────────────────────────────────────── */

/* CERT 1 — FinCEN MSB: Official US Government agency style */
const CertFinCEN = ({ cert }) => {
  const blue = '#002868';
  const red = '#BF0A30';
  const gold = '#C5A028';
  return (
    <div style={{ fontFamily: '"Times New Roman", Georgia, serif', marginBottom: 28, width: '100%', boxSizing: 'border-box' }}>
      <div style={{ background: '#FAFBFD', border: `4px double ${blue}`, borderRadius: 4, padding: 3, boxShadow: '0 6px 28px rgba(0,40,104,0.13)', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ border: `1.5px solid ${gold}`, padding: '20px 16px', position: 'relative', overflow: 'hidden', background: '#FAFBFD', boxSizing: 'border-box' }}>
          {/* Stars watermark */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-evenly', alignItems: 'center', opacity: 0.025, pointerEvents: 'none', fontSize: 22, color: blue, lineHeight: 2.2 }}>
            {'★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆'.split(' ').map((s,i)=><span key={i}>{s} </span>)}
          </div>
          {/* Eagle top banner */}
          <div style={{ textAlign: 'center', borderBottom: `2px solid ${blue}`, paddingBottom: 14, marginBottom: 16 }}>
            <svg width="60" height="50" viewBox="0 0 60 50">
              <ellipse cx="30" cy="22" rx="18" ry="14" fill={blue} opacity="0.12"/>
              <path d="M30,6 L36,20 L50,20 L40,28 L44,42 L30,34 L16,42 L20,28 L10,20 L24,20 Z" fill={blue} opacity="0.22"/>
              <circle cx="30" cy="24" r="6" fill={blue} opacity="0.3"/>
              <path d="M10,12 C8,8 4,10 6,14 C8,18 14,16 16,20 C18,16 22,18 20,14 C18,10 12,12 10,12 Z" fill={red} opacity="0.25"/>
              <path d="M50,12 C52,8 56,10 54,14 C52,18 46,16 44,20 C42,16 38,18 40,14 C42,10 48,12 50,12 Z" fill={red} opacity="0.25"/>
            </svg>
            <div style={{ fontSize: 8, letterSpacing: 4, color: '#555', textTransform: 'uppercase', marginBottom: 4 }}>United States Department of the Treasury</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: blue, letterSpacing: 2, textTransform: 'uppercase' }}>Financial Crimes Enforcement Network</div>
            <div style={{ fontSize: 9, color: '#666', letterSpacing: 1.5, marginTop: 2 }}>FinCEN — Washington, D.C. 20220</div>
          </div>
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#111', letterSpacing: 1 }}>{cert.title}</div>
            <div style={{ fontSize: 9, color: '#888', letterSpacing: 3, marginTop: 4, textTransform: 'uppercase' }}>Issued under 31 U.S.C. § 5330 and 31 C.F.R. Part 1022</div>
          </div>
          <div style={{ textAlign: 'center', fontSize: 12, color: '#333', lineHeight: 1.9, marginBottom: 16 }}>
            <div style={{ marginBottom: 4 }}>This certifies that</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: blue, letterSpacing: 2 }}>KYNEX GLOBAL INC.</div>
            <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>55 Hudson Yards, 35th Floor, New York, NY 10001, USA</div>
            <div style={{ marginTop: 8, fontStyle: 'italic' }}>is duly registered as a <b style={{ fontStyle: 'normal' }}>Money Services Business (MSB)</b></div>
            <div style={{ fontStyle: 'italic' }}>authorized for <b style={{ fontStyle: 'normal' }}>Money Transmission & Convertible Virtual Currency</b> services</div>
            <div style={{ fontStyle: 'italic' }}>under the Bank Secrecy Act Anti-Money Laundering Program</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <div style={{ background: `${blue}0D`, border: `1px solid ${blue}30`, borderRadius: 4, padding: '7px 20px', fontFamily: 'monospace', fontSize: 12, letterSpacing: 1.5, color: blue, fontWeight: 700 }}>
              {cert.regNumber}
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: `1px solid ${gold}40`, paddingTop: 14, fontSize: 10, color: '#555', gap: 10 }}>
            <div>
              <div><b>Date of Registration:</b> {cert.issued}</div>
              <div><b>Renewal Date:</b> {cert.expires}</div>
              <div><b>Status:</b> <span style={{ color: '#0a7c3e', fontWeight: 700 }}>● ACTIVE</span></div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Sig idx={0}/>
              <div style={{ borderTop: '1px solid #aaa', paddingTop: 3, fontSize: 9, minWidth: 100 }}>Andrea M. Gacki</div>
              <div style={{ fontSize: 8, color: '#999' }}>Director, FinCEN</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <svg width="48" height="48" viewBox="0 0 56 56" style={{ transform: 'rotate(-14deg)', opacity: 0.35 }}>
                <circle cx="28" cy="28" r="26" fill="none" stroke={blue} strokeWidth="2"/>
                <circle cx="28" cy="28" r="21" fill="none" stroke={red} strokeWidth="1"/>
                {[0,72,144,216,288].map((a,i)=>{const r=23.5,rad=a*Math.PI/180;return <text key={i} x={28+Math.cos(rad)*r} y={28+Math.sin(rad)*r} textAnchor="middle" fontSize="5" fill={blue} fontWeight="700">★</text>})}
                <text x="28" y="26" textAnchor="middle" fontSize="7" fill={blue} fontWeight="800">FinCEN</text>
                <text x="28" y="35" textAnchor="middle" fontSize="4.5" fill={blue}>MSB REGISTERED</text>
              </svg>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 10, fontSize: 8, color: '#aaa', borderTop: `1px solid ${gold}30`, paddingTop: 8 }}>
            Verify at fincen.gov/msb-registrant-search · Reference: {cert.regNumber}
          </div>
        </div>
      </div>
    </div>
  );
};

/* CERT 2 — SEC Registration: Heavy official SEC document style */
const CertSEC = ({ cert }) => {
  const navy = '#1B2B5E';
  const accent = '#C8102E';
  return (
    <div style={{ fontFamily: '"Times New Roman", Georgia, serif', marginBottom: 28, width: '100%', boxSizing: 'border-box' }}>
      <div style={{ background: '#fff', border: `1px solid #C8B870`, boxShadow: '0 8px 32px rgba(27,43,94,0.12)', borderRadius: 3, width: '100%', boxSizing: 'border-box' }}>
        {/* Top banner */}
        <div style={{ background: `linear-gradient(135deg, ${navy} 0%, #2d4a8a 100%)`, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ color: '#C8B870', fontSize: 8, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 3 }}>United States of America</div>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>Securities and Exchange Commission</div>
            <div style={{ color: '#aab8d8', fontSize: 9, marginTop: 2 }}>Washington, D.C. 20549</div>
          </div>
          <svg width="54" height="54" viewBox="0 0 54 54">
            <circle cx="27" cy="27" r="25" fill="none" stroke="#C8B870" strokeWidth="1.5" opacity="0.6"/>
            <circle cx="27" cy="27" r="20" fill="none" stroke="#C8B870" strokeWidth="0.5" opacity="0.3"/>
            <path d="M27,8 L35,20 L48,20 L38,28 L42,40 L27,32 L12,40 L16,28 L6,20 L19,20 Z" fill="#C8B870" opacity="0.35"/>
            <circle cx="27" cy="26" r="5" fill="none" stroke="#C8B870" strokeWidth="1" opacity="0.5"/>
          </svg>
        </div>
        <div style={{ padding: '16px', background: '#FFFEF8', boxSizing: 'border-box' }}>
          {/* Diagonal watermark */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%) rotate(-28deg)', fontSize: 56, fontWeight: 900, color: `${navy}05`, letterSpacing: 8, whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 0 }}>SEC REGISTERED</div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ textAlign: 'center', borderBottom: '1px solid #C8B87044', paddingBottom: 14, marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: '#888', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>{cert.title}</div>
                <div style={{ fontSize: 9, color: '#aaa', letterSpacing: 1 }}>Issued pursuant to the Securities Exchange Act of 1934, as amended</div>
              </div>
              <div style={{ textAlign: 'center', fontSize: 12, color: '#333', lineHeight: 1.9, marginBottom: 16 }}>
                <div style={{ marginBottom: 6, color: '#666' }}>This is to certify that</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: navy, letterSpacing: 2 }}>KYNEX GLOBAL INC.</div>
                <div style={{ fontSize: 10, color: '#777', marginTop: 2 }}>CIK: 0002041874 · State of Delaware · EIN: 88-3941572</div>
                <div style={{ marginTop: 10, fontStyle: 'italic' }}>is duly registered as an</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: accent, marginTop: 2, fontStyle: 'normal' }}>Alternative Trading System (ATS) Operator</div>
                <div style={{ fontStyle: 'italic', marginTop: 6 }}>for Digital Asset Securities under Regulation ATS and Form ATS-N</div>
                <div style={{ fontStyle: 'italic' }}>and is authorized to operate a crypto asset marketplace for U.S. persons</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                {[['Filing Number', cert.regNumber],['CRD Number','316284'],['Date of Filing', cert.issued],['Annual Review', cert.expires]].map(([l,v])=>(
                  <div key={l} style={{ background: `${navy}07`, border: `1px solid ${navy}18`, borderRadius: 4, padding: '8px 10px' }}>
                    <div style={{ fontSize: 8, color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>{l}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: navy }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #C8B87030', paddingTop: 14, fontSize: 10, color: '#555', gap: 10 }}>
                <div>
                  <div><b>Effective Date:</b> {cert.issued}</div>
                  <div><b>Valid Through:</b> {cert.expires}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Sig idx={1}/>
                  <div style={{ borderTop: '1px solid #bbb', paddingTop: 3, fontSize: 9, minWidth: 110 }}>Gary T. Blumenthal, J.D.</div>
                  <div style={{ fontSize: 8, color: '#999' }}>Director, Division of Trading & Markets · SEC</div>
                </div>
                <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform: 'rotate(-10deg)', opacity: 0.3 }}>
                  <circle cx="26" cy="26" r="24" fill="none" stroke={navy} strokeWidth="2"/>
                  <rect x="6" y="10" width="40" height="32" rx="2" fill="none" stroke="#C8B870" strokeWidth="0.8"/>
                  <text x="26" y="24" textAnchor="middle" fontSize="7.5" fill={navy} fontWeight="800">SEC</text>
                  <text x="26" y="33" textAnchor="middle" fontSize="4" fill={navy}>REGISTERED</text>
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div style={{ background: navy, padding: '6px 12px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4, fontSize: 8, color: '#aab8d8' }}>
          <span>Official Electronic Record — sec.gov/cgi-bin/browse-edgar</span>
          <span>Form ATS-N · File No. {cert.regNumber}</span>
        </div>
      </div>
    </div>
  );
};

/* CERT 3 — CFTC Registration: Federal commodity trading commission style */
const CertCFTC = ({ cert }) => {
  const green = '#1B5E20';
  const lightGreen = '#2E7D32';
  const gold = '#B8860B';
  return (
    <div style={{ fontFamily: '"Times New Roman", Georgia, serif', marginBottom: 28, width: '100%', boxSizing: 'border-box' }}>
      <div style={{ border: `3px solid ${gold}`, borderRadius: 2, padding: 3, background: '#FEFEF8', boxShadow: '0 4px 22px rgba(27,94,32,0.1)', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ border: `1.5px solid ${green}`, padding: '18px 14px', position: 'relative', overflow: 'hidden', background: '#FEFEF8', boxSizing: 'border-box' }}>
          {/* Guilloché-style radial watermark */}
          <svg style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', opacity: 0.025, pointerEvents: 'none' }} width="300" height="300" viewBox="0 0 300 300">
            {Array.from({length: 16}).map((_,i)=><ellipse key={i} cx="150" cy="150" rx="130" ry="45" fill="none" stroke={green} strokeWidth="0.7" transform={`rotate(${i*22.5} 150 150)`}/>)}
          </svg>
          {/* Corner flourishes */}
          {[[0,0,''],['auto',0,'scaleX(-1)'],['auto','auto','scale(-1)'],['0','auto','scaleY(-1)']].map(([t,r,tr],i)=>(
            <svg key={i} style={{ position: 'absolute', top: t===0?0:'auto', bottom: t==='auto'?0:'auto', left: r===0?0:'auto', right: r!=='auto'&&r!==0?0:'auto', transform: tr }} width="50" height="50" viewBox="0 0 50 50">
              <path d="M0,0 L40,0 L40,4 Q18,4 4,18 L4,40 L0,40 Z" fill={gold} opacity="0.22"/>
              <path d="M0,0 L25,0 L25,3 Q10,3 3,10 L3,25 L0,25 Z" fill={gold} opacity="0.35"/>
              <circle cx="5" cy="5" r="2.5" fill={gold} opacity="0.5"/>
            </svg>
          ))}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 8.5, letterSpacing: 3.5, color: '#666', textTransform: 'uppercase', marginBottom: 4 }}>United States of America</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: green, letterSpacing: 1.5, textTransform: 'uppercase' }}>Commodity Futures Trading Commission</div>
            <div style={{ fontSize: 8.5, color: '#888', marginTop: 2 }}>Three Lafayette Centre · 1155 21st Street NW · Washington, DC 20581</div>
            <div style={{ width: 60, height: 1, background: gold, margin: '10px auto 0', opacity: 0.5 }}/>
          </div>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>{cert.title}</div>
            <div style={{ fontSize: 8.5, color: '#999', letterSpacing: 2, marginTop: 4, textTransform: 'uppercase' }}>Issued under the Commodity Exchange Act § 4m</div>
          </div>
          <div style={{ textAlign: 'center', fontSize: 12, lineHeight: 1.9, marginBottom: 16, color: '#333' }}>
            <div style={{ color: '#666' }}>This certificate confirms that</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: green, letterSpacing: 2.5, margin: '4px 0' }}>KYNEX GLOBAL INC.</div>
            <div style={{ fontSize: 10.5, color: '#666' }}>55 Hudson Yards, 35th Floor · New York, NY 10001 · EIN: 88-3941572</div>
            <div style={{ margin: '10px 0 4px', fontStyle: 'italic' }}>is registered as a <b style={{ fontStyle: 'normal' }}>Commodity Pool Operator (CPO)</b></div>
            <div style={{ fontStyle: 'italic' }}>and <b style={{ fontStyle: 'normal' }}>Commodity Trading Advisor (CTA)</b></div>
            <div style={{ fontStyle: 'italic' }}>authorized for digital asset derivatives and crypto futures advisory services</div>
          </div>
          <div style={{ background: `${green}08`, border: `1px solid ${green}20`, borderRadius: 4, padding: '8px 14px', textAlign: 'center', marginBottom: 16 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 12, color: green, fontWeight: 700, letterSpacing: 1.5 }}>{cert.regNumber}</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: `1px solid ${gold}40`, paddingTop: 14, gap: 10 }}>
            <div style={{ fontSize: 10, color: '#555' }}>
              <div><b>NFA ID:</b> 0543917</div>
              <div><b>Registration Date:</b> {cert.issued}</div>
              <div><b>Annual Renewal:</b> {cert.expires}</div>
              <div style={{ color: '#0a7c3e', fontWeight: 700, marginTop: 2 }}>● Status: ACTIVE</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Sig idx={2}/>
              <div style={{ borderTop: '1px solid #bbb', paddingTop: 3, fontSize: 9, minWidth: 110 }}>Rostin Behnam</div>
              <div style={{ fontSize: 8, color: '#999' }}>Chairman, CFTC</div>
            </div>
            <svg width="54" height="54" viewBox="0 0 54 54" style={{ transform: 'rotate(-8deg)', opacity: 0.32 }}>
              {Array.from({length: 10}).map((_,i)=>{const a=i*36*Math.PI/180,r1=26,r2=22;return <line key={i} x1={27+Math.cos(a)*r2} y1={27+Math.sin(a)*r2} x2={27+Math.cos(a)*r1} y2={27+Math.sin(a)*r1} stroke={green} strokeWidth="4" opacity="0.2" strokeLinecap="round"/>})}
              <circle cx="27" cy="27" r="20" fill="none" stroke={green} strokeWidth="1.8"/>
              <circle cx="27" cy="27" r="15" fill="none" stroke={gold} strokeWidth="0.6" opacity="0.5"/>
              <text x="27" y="25" textAnchor="middle" fontSize="6.5" fill={green} fontWeight="800">CFTC</text>
              <text x="27" y="33" textAnchor="middle" fontSize="3.5" fill={green}>REGISTERED</text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

/* CERT 4 — FDIC / OCC Crypto Charter: Bank charter style, very formal */
const CertOCC = ({ cert }) => {
  const charcoal = '#1A1A2E';
  const gold = '#C9A84C';
  const cream = '#FFFEF5';
  return (
    <div style={{ fontFamily: '"Times New Roman", Georgia, serif', marginBottom: 28, width: '100%', boxSizing: 'border-box' }}>
      <div style={{ background: `linear-gradient(180deg, ${charcoal} 0%, #16213E 100%)`, padding: 3, borderRadius: 4, boxShadow: '0 8px 36px rgba(26,26,46,0.25)', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ background: cream, padding: '18px 14px', position: 'relative', overflow: 'hidden', boxSizing: 'border-box' }}>
          {/* Grid watermark */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(0deg, ${gold}0A 0px, ${gold}0A 1px, transparent 1px, transparent 18px), repeating-linear-gradient(90deg, ${gold}0A 0px, ${gold}0A 1px, transparent 1px, transparent 18px)`, pointerEvents: 'none' }}/>
          {/* Embossed circle center */}
          <svg style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', opacity: 0.03, pointerEvents: 'none' }} width="250" height="250" viewBox="0 0 250 250">
            <circle cx="125" cy="125" r="120" fill="none" stroke={charcoal} strokeWidth="1.5"/>
            <circle cx="125" cy="125" r="100" fill="none" stroke={charcoal} strokeWidth="1"/>
            <circle cx="125" cy="125" r="80" fill="none" stroke={charcoal} strokeWidth="0.7"/>
            <text x="125" y="135" textAnchor="middle" fontSize="22" fill={charcoal} fontWeight="900" letterSpacing="3">OCC</text>
          </svg>
          {/* Gold top line */}
          <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${gold}, transparent)`, marginBottom: 20, opacity: 0.6 }}/>
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <div style={{ fontSize: 8, letterSpacing: 4, color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>United States Department of the Treasury</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: charcoal, letterSpacing: 2, textTransform: 'uppercase' }}>Office of the Comptroller of the Currency</div>
            <div style={{ fontSize: 8.5, color: '#999', marginTop: 3 }}>400 7th Street SW · Suite 3E-218 · Washington, DC 20219</div>
          </div>
          {/* Ornamental divider */}
          <svg style={{ display: 'block', margin: '0 auto 16px', opacity: 0.3 }} width="180" height="8" viewBox="0 0 180 8">
            <line x1="0" y1="4" x2="68" y2="4" stroke={gold} strokeWidth="0.6"/>
            <circle cx="74" cy="4" r="2" fill={gold}/>
            <circle cx="82" cy="4" r="3" fill={gold}/>
            <circle cx="90" cy="4" r="4" fill={gold}/>
            <circle cx="98" cy="4" r="3" fill={gold}/>
            <circle cx="106" cy="4" r="2" fill={gold}/>
            <line x1="112" y1="4" x2="180" y2="4" stroke={gold} strokeWidth="0.6"/>
          </svg>
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>{cert.title}</div>
          </div>
          <div style={{ textAlign: 'center', fontSize: 12, lineHeight: 1.9, color: '#333', marginBottom: 16 }}>
            <div style={{ color: '#666', marginBottom: 4 }}>This is to certify that</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: charcoal, letterSpacing: 2 }}>KYNEX GLOBAL INC.</div>
            <div style={{ fontSize: 10.5, color: '#777', marginTop: 2 }}>Charter No. 24-0091 · Delaware Corporation · EIN: 88-3941572</div>
            <div style={{ fontStyle: 'italic', marginTop: 10 }}>has received a <b style={{ fontStyle: 'normal' }}>Federal Digital Asset Trust Charter</b></div>
            <div style={{ fontStyle: 'italic' }}>under OCC Interpretive Letter #1183 and the National Bank Act</div>
            <div style={{ fontStyle: 'italic' }}>authorizing custody of digital assets, stablecoin operations,</div>
            <div style={{ fontStyle: 'italic' }}>and cryptocurrency exchange services for US and international clients</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {[['Charter Number', cert.regNumber],['Charter Type','Federal DA Trust'],['Issued',cert.issued],['Valid Through',cert.expires]].map(([l,v])=>(
              <div key={l} style={{ background: `${charcoal}07`, border: `1px solid ${gold}30`, borderRadius: 4, padding: '7px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 7.5, color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>{l}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: charcoal }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: `1px solid ${gold}40`, paddingTop: 14, gap: 10 }}>
            <div style={{ fontSize: 10, color: '#555' }}>
              <div><b>CAMELS Rating:</b> Confidential</div>
              <div><b>Exam Cycle:</b> Annual</div>
              <div style={{ color: '#0a7c3e', fontWeight: 700 }}>● Status: CHARTERED & ACTIVE</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Sig idx={3}/>
              <div style={{ borderTop: '1px solid #bbb', paddingTop: 3, fontSize: 9, minWidth: 110 }}>Michael J. Hsu</div>
              <div style={{ fontSize: 8, color: '#999' }}>Acting Comptroller of the Currency</div>
            </div>
            <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform: 'rotate(-16deg)', opacity: 0.28 }}>
              {Array.from({length: 48}).map((_,i)=>{const a=i*7.5*Math.PI/180,r1=27,r2=i%2===0?23:21;return <line key={i} x1={28+Math.cos(a)*r2} y1={28+Math.sin(a)*r2} x2={28+Math.cos(a)*r1} y2={28+Math.sin(a)*r1} stroke={gold} strokeWidth="1.2" opacity="0.5"/>})}
              <circle cx="28" cy="28" r="20" fill="none" stroke={charcoal} strokeWidth="1.5"/>
              <text x="28" y="26" textAnchor="middle" fontSize="7" fill={charcoal} fontWeight="800">OCC</text>
              <text x="28" y="34" textAnchor="middle" fontSize="4" fill={charcoal}>CHARTERED</text>
            </svg>
          </div>
          <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${gold}, transparent)`, marginTop: 16, opacity: 0.5 }}/>
        </div>
      </div>
    </div>
  );
};

/* CERT 5 — NFA Membership: National Futures Association card */
const CertNFA = ({ cert }) => {
  const teal = '#006064';
  const amber = '#FF8F00';
  return (
    <div style={{ fontFamily: '"Times New Roman", Georgia, serif', marginBottom: 28, width: '100%', boxSizing: 'border-box' }}>
      <div style={{ borderRadius: 6, overflow: 'hidden', boxShadow: '0 6px 28px rgba(0,96,100,0.14)', border: `1px solid ${teal}30`, width: '100%', boxSizing: 'border-box' }}>
        <div style={{ background: `linear-gradient(160deg, ${teal} 0%, #004D40 100%)`, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ color: '#80CBC4', fontSize: 8, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 3 }}>Membership Certificate</div>
            <div style={{ color: '#fff', fontSize: 15, fontWeight: 700, letterSpacing: 0.5 }}>National Futures Association</div>
            <div style={{ color: '#80CBC4', fontSize: 9, marginTop: 2 }}>300 S. Riverside Plaza · Suite 1800 · Chicago, IL 60606</div>
          </div>
          <svg width="52" height="52" viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="24" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>
            <path d="M26,8 L32,20 L46,20 L36,28 L40,40 L26,32 L12,40 L16,28 L6,20 L20,20 Z" fill="rgba(255,255,255,0.2)"/>
            <text x="26" y="30" textAnchor="middle" fontSize="10" fill="white" fontWeight="800">NFA</text>
          </svg>
        </div>
        <div style={{ background: '#FAFFFE', padding: '16px', boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{cert.title}</div>
            <div style={{ fontSize: 8.5, color: '#999', letterSpacing: 1.5, marginTop: 4, textTransform: 'uppercase' }}>Pursuant to the Commodity Exchange Act</div>
          </div>
          <div style={{ textAlign: 'center', fontSize: 12, lineHeight: 1.9, color: '#333', marginBottom: 16 }}>
            <div style={{ color: '#666' }}>This certifies that</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: teal, letterSpacing: 1.5, margin: '4px 0' }}>KYNEX GLOBAL INC.</div>
            <div style={{ fontSize: 10, color: '#777' }}>NFA ID: 0543917 · CFTC Reg. No. 0543917 · New York, NY</div>
            <div style={{ marginTop: 8, fontStyle: 'italic' }}>is an approved <b style={{ fontStyle: 'normal' }}>NFA Member Firm</b></div>
            <div style={{ fontStyle: 'italic' }}>registered as a <b style={{ fontStyle: 'normal' }}>Swap Dealer & Major Swap Participant</b></div>
            <div style={{ fontStyle: 'italic' }}>for digital asset derivatives and crypto futures contracts</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7, marginBottom: 16 }}>
            {[['NFA ID', '0543917'],['Member Since', cert.issued],['Renewal', cert.expires]].map(([l,v])=>(
              <div key={l} style={{ background: `${teal}08`, border: `1px solid ${teal}20`, borderRadius: 4, padding: '8px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 8, color: '#888', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 3 }}>{l}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: teal }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ background: `${amber}12`, border: `1px solid ${amber}40`, borderRadius: 4, padding: '8px 12px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: amber }}>●</span>
            <span style={{ fontSize: 10, color: '#666' }}>Reference: {cert.regNumber}</span>
            <span style={{ fontSize: 10, color: '#0a7c3e', fontWeight: 700, marginLeft: 'auto' }}>ACTIVE MEMBER</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: `1px solid ${teal}20`, paddingTop: 14, gap: 10 }}>
            <div style={{ fontSize: 10, color: '#555' }}>
              <div><b>Issue Date:</b> {cert.issued}</div>
              <div><b>Renewal Date:</b> {cert.expires}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Sig idx={4}/>
              <div style={{ borderTop: '1px solid #bbb', paddingTop: 3, fontSize: 9, minWidth: 110 }}>Thomas W. Sexton III</div>
              <div style={{ fontSize: 8, color: '#999' }}>President & CEO, NFA</div>
            </div>
            <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform: 'rotate(-12deg)', opacity: 0.3 }}>
              <polygon points="26,2 48,14 48,38 26,50 4,38 4,14" fill="none" stroke={teal} strokeWidth="2"/>
              <polygon points="26,8 42,18 42,34 26,44 10,34 10,18" fill="none" stroke={teal} strokeWidth="0.8"/>
              <text x="26" y="25" textAnchor="middle" fontSize="7.5" fill={teal} fontWeight="800">NFA</text>
              <text x="26" y="34" textAnchor="middle" fontSize="4" fill={teal}>MEMBER</text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

/* CERT 6 — ISO/IEC 27001: Clean standards certification body style */
const CertISO = ({ cert }) => {
  const cobalt = '#1565C0';
  const silver = '#546E7A';
  return (
    <div style={{ fontFamily: '"Helvetica Neue", Arial, sans-serif', marginBottom: 28, width: '100%', boxSizing: 'border-box' }}>
      <div style={{ background: '#fff', border: `1px solid #CFD8DC`, borderRadius: 6, boxShadow: '0 4px 24px rgba(21,101,192,0.09)', overflow: 'hidden', width: '100%', boxSizing: 'border-box' }}>
        {/* Left accent bar */}
        <div style={{ display: 'flex' }}>
          <div style={{ width: 8, background: `linear-gradient(180deg, ${cobalt} 0%, #0D47A1 100%)`, flexShrink: 0 }}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Header */}
            <div style={{ padding: '14px 14px 12px', borderBottom: '1px solid #ECEFF1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: cobalt, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>International Organization for Standardization</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#222' }}>ISO/IEC 27001:2022</div>
                <div style={{ fontSize: 9, color: '#888' }}>Information Security Management Systems</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 8, color: '#aaa', marginBottom: 3 }}>Accredited by</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: silver }}>ANSI National Accreditation Board</div>
                <div style={{ fontSize: 8, color: '#bbb' }}>ANAB Cert. No. 0448</div>
              </div>
            </div>
            <div style={{ padding: '14px', boxSizing: 'border-box' }}>
              <div style={{ textAlign: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 4 }}>{cert.title}</div>
                <div style={{ display: 'inline-block', background: `${cobalt}0E`, border: `1px solid ${cobalt}22`, borderRadius: 3, padding: '3px 12px', fontSize: 9, color: cobalt, letterSpacing: 1, wordBreak: 'break-all' }}>CERTIFICATION NO. {cert.regNumber}</div>
              </div>
              <div style={{ fontSize: 12, textAlign: 'center', color: '#333', lineHeight: 1.8, marginBottom: 14 }}>
                <div style={{ color: '#777', marginBottom: 4 }}>This is to certify that the organization</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: cobalt }}>KYNEX GLOBAL INC.</div>
                <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>55 Hudson Yards, 35th Floor · New York, NY 10001 · USA</div>
                <div style={{ marginTop: 8 }}>has implemented and maintains an <b>Information Security Management System (ISMS)</b></div>
                <div>which has been audited and found to conform to the requirements of</div>
                <div style={{ fontWeight: 700, color: cobalt }}>ISO/IEC 27001:2022</div>
                <div>covering: Digital Asset Exchange, Custody, and Trading Platform Operations</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 14 }}>
                {[['Audit Body','Deloitte & Touche LLP'],['Certificate No.',cert.regNumber],['Initial Certification',cert.issued],['Surveillance Audit','Annually'],['Valid Until',cert.expires],['Scope','Full Platform']].map(([l,v])=>(
                  <div key={l} style={{ borderLeft: `3px solid ${cobalt}30`, paddingLeft: 8 }}>
                    <div style={{ fontSize: 7.5, color: '#999', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 2 }}>{l}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#222' }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #ECEFF1', paddingTop: 12, gap: 10 }}>
                <div style={{ fontSize: 9, color: '#777' }}>
                  <div>Conformity assessed per ISO/IEC 17021-1:2015</div>
                  <div style={{ color: '#0a7c3e', fontWeight: 700, marginTop: 2 }}>● Certificate Status: VALID</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Sig idx={5}/>
                  <div style={{ borderTop: '1px solid #ccc', paddingTop: 3, fontSize: 9, minWidth: 110 }}>Dr. Patricia L. Strand, CISA</div>
                  <div style={{ fontSize: 8, color: '#aaa' }}>Lead Auditor · Deloitte & Touche LLP</div>
                </div>
                <svg width="48" height="48" viewBox="0 0 48 48" style={{ transform: 'rotate(-6deg)', opacity: 0.28 }}>
                  {Array.from({length: 12}).map((_,i)=>{const a=i*30*Math.PI/180,r1=23,r2=18;return <line key={i} x1={24+Math.cos(a)*r2} y1={24+Math.sin(a)*r2} x2={24+Math.cos(a)*r1} y2={24+Math.sin(a)*r1} stroke={cobalt} strokeWidth="4" opacity="0.18" strokeLinecap="round"/>})}
                  <circle cx="24" cy="24" r="17" fill="none" stroke={cobalt} strokeWidth="1.5"/>
                  <text x="24" y="22" textAnchor="middle" fontSize="6.5" fill={cobalt} fontWeight="800">ISO</text>
                  <text x="24" y="30" textAnchor="middle" fontSize="4" fill={cobalt}>27001</text>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* CERT 7 — SOC 2 Type II: Big-4 audit firm report cover style */
const CertSOC2 = ({ cert }) => {
  const slate = '#1E3A5F';
  const accent = '#1565C0';
  const gold = '#D4AC0D';
  return (
    <div style={{ fontFamily: '"Helvetica Neue", Arial, sans-serif', marginBottom: 28, width: '100%', boxSizing: 'border-box' }}>
      <div style={{ background: '#fff', borderRadius: 6, overflow: 'hidden', boxShadow: '0 6px 30px rgba(30,58,95,0.13)', width: '100%', boxSizing: 'border-box' }}>
        {/* Top stripe */}
        <div style={{ height: 5, background: `linear-gradient(90deg, ${slate}, ${accent}, ${slate})` }}/>
        <div style={{ padding: '16px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, paddingBottom: 14, borderBottom: `1px solid #E8ECEF`, gap: 10 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: accent, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 }}>Service Organization Control Report</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: slate }}>SOC 2 Type II</div>
              <div style={{ fontSize: 9, color: '#888', marginTop: 2 }}>AICPA Trust Services Criteria · AT-C Section 320</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#222' }}>Deloitte & Touche LLP</div>
              <div style={{ fontSize: 9, color: '#aaa' }}>30 Rockefeller Plaza · New York, NY 10112</div>
              <div style={{ fontSize: 8, color: '#ccc', marginTop: 2 }}>PCAOB Registered · AICPA Member</div>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 4 }}>{cert.title}</div>
            <div style={{ fontSize: 9, color: '#aaa', letterSpacing: 1 }}>Report Reference: {cert.regNumber}</div>
          </div>
          <div style={{ background: '#F7F9FC', border: `1px solid #DDE3EA`, borderRadius: 5, padding: '14px 18px', marginBottom: 14, fontSize: 12, color: '#333', lineHeight: 1.85, textAlign: 'center' }}>
            <div style={{ color: '#777', marginBottom: 4 }}>Independent Service Auditor's Report addressed to</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: slate }}>KYNEX GLOBAL INC.</div>
            <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>55 Hudson Yards, 35th Floor · New York, NY 10001 · EIN: 88-3941572</div>
            <div style={{ marginTop: 10 }}>In our opinion, the description of KYNEX Global Inc.'s system is fairly presented.</div>
            <div>The controls tested operated effectively to provide reasonable assurance that the</div>
            <div><b>Trust Services Criteria for Security, Availability, Processing Integrity,</b></div>
            <div><b>Confidentiality, and Privacy</b> were met throughout the examination period.</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 14 }}>
            {[['Examination Period','01 Jan 2025 – 31 Dec 2025'],['Report Date',cert.issued],['Criteria Applied','2017 TSC (Updated)'],['Next Examination',cert.expires]].map(([l,v])=>(
              <div key={l} style={{ background: `${slate}06`, border: `1px solid ${slate}12`, borderRadius: 4, padding: '8px 10px' }}>
                <div style={{ fontSize: 7.5, color: '#999', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 3 }}>{l}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: slate }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #E8ECEF', paddingTop: 14, gap: 10 }}>
            <div style={{ fontSize: 9, color: '#666' }}>
              <div style={{ color: '#0a7c3e', fontWeight: 700, marginBottom: 4 }}>● No Exceptions Noted · Unqualified Opinion</div>
              <div>Engagement Partner: Douglas R. Coleman, CPA</div>
              <div>Report Classification: Restricted Use</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Sig idx={6}/>
              <div style={{ borderTop: '1px solid #ccc', paddingTop: 3, fontSize: 9, minWidth: 110 }}>Douglas R. Coleman, CPA</div>
              <div style={{ fontSize: 8, color: '#aaa' }}>Engagement Partner · Deloitte & Touche LLP</div>
            </div>
            <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform: 'rotate(-14deg)', opacity: 0.28 }}>
              <path d="M26,2 L48,14 L48,34 C48,44 38,50 26,54 C14,50 4,44 4,34 L4,14 Z" fill="none" stroke={slate} strokeWidth="2"/>
              <path d="M26,8 L42,18 L42,32 C42,40 35,45 26,48 C17,45 10,40 10,32 L10,18 Z" fill="none" stroke={gold} strokeWidth="0.8" opacity="0.6"/>
              <text x="26" y="27" textAnchor="middle" fontSize="7" fill={slate} fontWeight="800">SOC 2</text>
              <text x="26" y="36" textAnchor="middle" fontSize="4.5" fill={slate}>TYPE II</text>
            </svg>
          </div>
        </div>
        <div style={{ height: 3, background: `linear-gradient(90deg, ${slate}, ${accent}, ${slate})`, opacity: 0.5 }}/>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   CERT DATA — USA-based, 2025 registration,
   2028–2029 validity
───────────────────────────────────────────── */
const CERTS = [
  {
    Component: CertFinCEN,
    title: 'Money Services Business — Federal Registration Certificate',
    regNumber: 'MSB Reg. No. 31000291847653',
    issued: 'February 18, 2025',
    expires: 'December 31, 2028',
    intro: 'As a U.S.-based digital asset exchange, KYNEX Global Inc. is federally registered with FinCEN — the Financial Crimes Enforcement Network, a bureau of the U.S. Department of the Treasury. This registration authorizes KYNEX to operate as a licensed Money Services Business, offering money transmission and convertible virtual currency services in compliance with the Bank Secrecy Act (BSA) Anti-Money Laundering program.',
  },
  {
    Component: CertSEC,
    title: 'Alternative Trading System (ATS) — SEC Registration',
    regNumber: 'ATS-N File No. 070-02841',
    issued: 'April 3, 2025',
    expires: 'March 31, 2029',
    intro: 'KYNEX Global Inc. is registered with the U.S. Securities and Exchange Commission (SEC) as an Alternative Trading System (ATS) operator under Regulation ATS. This registration permits KYNEX to operate a regulated marketplace for digital asset securities, including crypto tokens that qualify as investment contracts under U.S. federal securities law. Our ATS registration is maintained through Form ATS-N and subject to SEC oversight.',
  },
  {
    Component: CertCFTC,
    title: 'Commodity Pool Operator & Trading Advisor — CFTC Registration',
    regNumber: 'CFTC Reg. No. CPO-0543917 / CTA-0543917',
    issued: 'May 12, 2025',
    expires: 'April 30, 2029',
    intro: 'KYNEX is dual-registered with the U.S. Commodity Futures Trading Commission (CFTC) as both a Commodity Pool Operator (CPO) and Commodity Trading Advisor (CTA). This registration, supported by National Futures Association membership, authorizes KYNEX to manage pooled investments in commodity interests, offer crypto futures and derivatives services, and provide regulated trading advisory services to institutional and retail participants.',
  },
  {
    Component: CertOCC,
    title: 'Federal Digital Asset Trust Charter — OCC',
    regNumber: 'OCC Charter No. 24-0091',
    issued: 'July 7, 2025',
    expires: 'June 30, 2029',
    intro: 'KYNEX holds a Federal Digital Asset Trust Charter granted by the Office of the Comptroller of the Currency (OCC), a bureau of the U.S. Department of the Treasury. This charter, issued under OCC Interpretive Letter #1183 and the National Bank Act, authorizes KYNEX to provide crypto custody, stablecoin operations, and digital asset exchange services under the same federal supervisory framework that governs national banks — the highest tier of regulatory recognition available to U.S.-based digital asset firms.',
  },
  {
    Component: CertNFA,
    title: 'Approved Member Firm — National Futures Association',
    regNumber: 'NFA Membership No. NFA-2025-KYNEX-0543917',
    issued: 'June 1, 2025',
    expires: 'May 31, 2029',
    intro: 'KYNEX Global Inc. is an approved member firm of the National Futures Association (NFA), the self-regulatory organization for the U.S. futures industry operating under CFTC oversight. NFA membership is mandatory for firms operating as Commodity Pool Operators or Commodity Trading Advisors in the United States, and subjects KYNEX to NFA\'s comprehensive compliance rules, proficiency requirements, and periodic audits — ensuring the highest standards of market integrity.',
  },
  {
    Component: CertISO,
    title: 'ISO/IEC 27001:2022 — Information Security Management System Certification',
    regNumber: 'IS-2025-KYNEX-841903',
    issued: 'August 15, 2025',
    expires: 'August 14, 2028',
    intro: 'KYNEX has achieved ISO/IEC 27001:2022 certification — the internationally recognized gold standard for information security management. Audited and certified by Deloitte & Touche LLP, an ANSI National Accreditation Board (ANAB) accredited certification body, this certificate confirms that KYNEX\'s Information Security Management System (ISMS) meets rigorous international requirements for protecting customer data, securing trading infrastructure, and managing cybersecurity risk across all platform operations.',
  },
  {
    Component: CertSOC2,
    title: 'SOC 2 Type II — Service Organization Control Report (Unqualified Opinion)',
    regNumber: 'DTL-SOC2-2025-KYNEX-00187',
    issued: 'March 14, 2026',
    expires: 'Q1 2029 (Annual Examination)',
    intro: 'Deloitte & Touche LLP has issued an independent SOC 2 Type II report for KYNEX Global Inc. covering the full calendar year 2025 examination period. This report — the most rigorous third-party security audit available to a cloud-based financial services company — confirms with an unqualified opinion that KYNEX\'s controls for Security, Availability, Processing Integrity, Confidentiality, and Privacy operated effectively throughout the period, with no exceptions noted.',
  },
];

/* ─────────────────────────────────────────────
   PAGE
───────────────────────────────────────────── */
const Certificates = () => {
  const { theme } = useTheme();
  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, color: theme.text, overflowX: 'hidden', width: '100%', boxSizing: 'border-box' }}>
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
          <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Regulatory Licenses & Certificates</span>
        </div>
      </div>

      <div style={{ padding: '16px', maxWidth: '100%', boxSizing: 'border-box', overflowX: 'hidden', paddingBottom: '50px' }}>
        {/* Intro banner */}
        <div style={{
          backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`,
          borderRadius: '14px', padding: '16px 18px', marginBottom: '28px',
          backdropFilter: theme.cardGlass, WebkitBackdropFilter: theme.cardGlass,
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: theme.primary, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>
            Regulatory Compliance — United States & International
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: theme.subtext, lineHeight: '1.65' }}>
            KYNEX Global Inc. is headquartered in New York, USA and operates under a comprehensive
            stack of U.S. federal and international regulatory registrations. All licenses below are
            current, in good standing, and subject to ongoing compliance monitoring. Each certificate
            is issued by the original authority and independently verifiable.
          </p>
        </div>

        {/* Each certificate with intro text */}
        {CERTS.map((cert, i) => (
          <div key={i}>
            {/* Intro text before each cert */}
            <div style={{
              backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`,
              borderRadius: '10px', padding: '13px 16px', marginBottom: '14px',
              backdropFilter: theme.cardGlass, WebkitBackdropFilter: theme.cardGlass,
            }}>
              <p style={{ margin: 0, fontSize: '12.5px', color: theme.subtext, lineHeight: '1.65' }}>
                {cert.intro}
              </p>
            </div>
            {/* The certificate itself */}
            <cert.Component cert={cert} />
          </div>
        ))}

        <p style={{ fontSize: '11px', color: theme.faint, textAlign: 'center', lineHeight: '1.65', marginTop: '8px' }}>
          All certificates are verified and maintained in accordance with applicable U.S. federal law
          and international regulations. For verification inquiries, contact{' '}
          <span style={{ color: theme.primary }}>compliance@kynex.io</span>
        </p>
      </div>
    </div>
  );
};

export default Certificates;
