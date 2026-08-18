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
