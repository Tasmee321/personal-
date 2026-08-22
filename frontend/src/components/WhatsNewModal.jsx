import React, { useState, useEffect } from 'react';
import { Sparkles, X, Star } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { useLanguage } from '../LanguageContext';

const SEEN_WHATS_NEW_KEY = 'kynex_seen_whats_new';

export default function WhatsNewModal({ updatePending }) {
  const { theme } = useTheme();
  const { t, lang, isRTL } = useLanguage();
  const [modal, setModal] = useState(null);
  const [visible, setVisible] = useState(false);
  const [animOut, setAnimOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache:'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const versionCode = Number(data.version_code);
        if (!versionCode || !Array.isArray(data.features) || data.features.length === 0) return;

        const seen = Number(localStorage.getItem(SEEN_WHATS_NEW_KEY) || 0);
        if (seen >= versionCode || cancelled) return;

        setModal({ version_code:versionCode, version_name:data.version_name, features:data.features, tagline:data.tagline, i18n:data.i18n });
      } catch {}
    };
    const timer = setTimeout(check, 500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  useEffect(() => {
    if (modal && !updatePending) setVisible(true);
    if (updatePending) setVisible(false);
  }, [modal, updatePending]);

  const close = () => {
    if (!modal) return;
    localStorage.setItem(SEEN_WHATS_NEW_KEY, String(modal.version_code));
    setAnimOut(true);
    setTimeout(() => { setVisible(false); setModal(null); }, 300);
  };

  if (!visible || !modal) return null;

  const loc = modal.i18n?.[lang];
  const locTagline = loc?.tagline || modal.tagline || t('whatsnew.tagline');

  return (
    <>
      <div onClick={close} style={{ position:'fixed', inset:0, zIndex:9998, background:'rgba(0,0,0,.65)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)' }} />
      <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:9999, paddingBottom:'env(safe-area-inset-bottom, 20px)' }}>
        <div dir={isRTL ? 'rtl' : 'ltr'} style={{ margin:'0 10px 10px', borderRadius:28, overflow:'hidden', background:theme.card, border:`1px solid ${theme.cardBorder}`, boxShadow:'0 -8px 60px rgba(0,0,0,.3)', maxHeight:'85vh', display:'flex', flexDirection:'column' }}>
          <div style={{ background:'linear-gradient(135deg,#6366F1 0%,#3B82F6 60%,#06B6D4 100%)', padding:'22px 20px 20px', position:'relative', flexShrink:0 }}>
            <button onClick={close} style={{ position:'absolute', top:16, [isRTL ? 'left' : 'right']:16, background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.2)', borderRadius:10, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center' }}><X size={15} color="white" /></button>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:52, height:52, borderRadius:16, background:'rgba(255,255,255,.2)', border:'1px solid rgba(255,255,255,.3)', display:'flex', alignItems:'center', justifyContent:'center' }}><Star size={24} color="white" fill="white" /></div>
              <div><div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}><span style={{ color:'white', fontWeight:800, fontSize:18 }}>{t('whatsnew.title')}</span><span style={{ background:'rgba(255,255,255,.22)', borderRadius:20, padding:'2px 9px', fontSize:11, color:'white', fontWeight:700 }}>v{modal.version_name}</span></div><div style={{ color:'rgba(255,255,255,.78)', fontSize:13, fontWeight:500 }}>{locTagline}</div></div>
            </div>
          </div>
          <div style={{ padding:'18px 20px', overflowY:'auto' }}>
            <div style={{ fontSize:12, fontWeight:700, letterSpacing:.8, color:theme.subtext, textTransform:'uppercase', marginBottom:14 }}>{t('whatsnew.heading')}</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {modal.features.map((feat,i)=><div key={i} style={{ display:'flex', alignItems:'flex-start', gap:12, background:theme.primarySoft || 'rgba(99,102,241,.08)', borderRadius:14, padding:'12px 14px', border:`1px solid ${theme.cardBorder}` }}><div style={{ width:32, height:32, borderRadius:10, flexShrink:0, background:'linear-gradient(135deg,#6366F1,#3B82F6)', display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ fontSize:15 }}>{feat.icon || '✦'}</span></div><div><div style={{ fontWeight:700, fontSize:14, color:theme.text, marginBottom:2 }}>{loc?.features?.[i]?.title || feat.title}</div><div style={{ fontSize:12.5, color:theme.subtext, lineHeight:1.5 }}>{loc?.features?.[i]?.desc || feat.desc}</div></div></div>)}
            </div>
          </div>
          <div style={{ padding:'12px 20px 16px', flexShrink:0 }}><button onClick={close} style={{ width:'100%', padding:'15px 12px', borderRadius:16, border:'none', background:'linear-gradient(135deg,#6366F1 0%,#3B82F6 100%)', color:'white', fontWeight:700, fontSize:15 }}><Sparkles size={17} style={{ verticalAlign:'middle', marginRight:8 }} />{t('whatsnew.cta')}</button></div>
        </div>
      </div>
    </>
  );
}
