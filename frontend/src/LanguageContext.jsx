import React, { createContext, useContext, useState, useEffect } from 'react';
import { LANGUAGES, applyLanguage, detectDeviceLang } from './utils/language';
import { t as translate } from './i18n';

const LANG_KEY = 'kynex_language';
const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  // Saved choice wins; otherwise open in the phone's language (English if unsupported).
  const [lang, setLangState] = useState(() => localStorage.getItem(LANG_KEY) || detectDeviceLang());

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang);
    applyLanguage(lang); // sets <html lang/dir> — drives RTL for Arabic
  }, [lang]);

  const active = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  const value = {
    lang,
    setLang: setLangState,
    t: (key, vars) => translate(lang, key, vars),
    dir: active.dir,
    isRTL: active.dir === 'rtl',
    LANGUAGES,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- hook lives alongside its provider intentionally
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}
