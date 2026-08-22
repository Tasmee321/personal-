export const LANGUAGES = [
  { code: 'en', label: 'English',   flag: '\u{1F1FA}\u{1F1F8}', dir: 'ltr' },
  { code: 'ar', label: 'العربية',   flag: '\u{1F1EA}\u{1F1EC}', dir: 'rtl' },
  { code: 'fr', label: 'Français',  flag: '\u{1F1EB}\u{1F1F7}', dir: 'ltr' },
  { code: 'sw', label: 'Kiswahili', flag: '\u{1F1F0}\u{1F1EA}', dir: 'ltr' },
  { code: 'pt', label: 'Português', flag: '\u{1F1F5}\u{1F1F9}', dir: 'ltr' },
];

export function applyLanguage(code) {
  const lang = LANGUAGES.find(l => l.code === code) || LANGUAGES[0];
  document.documentElement.lang = lang.code;
  document.documentElement.dir = lang.dir;
}

// First-open language: honour the phone's language if we support it, else English.
// navigator.language looks like "fr-FR" / "ar" / "pt-BR" — we key off the base subtag only.
export function detectDeviceLang() {
  try {
    const raw = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
    const base = String(raw).toLowerCase().split('-')[0];
    return LANGUAGES.some(l => l.code === base) ? base : 'en';
  } catch { return 'en'; }
}

