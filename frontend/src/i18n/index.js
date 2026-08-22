// KYNEX i18n engine.
//
// Each dictionary is a FLAT object of namespaced keys ("nav.home", "common.cancel", …). English is
// the complete source of truth; the other four languages may be partial. Any key missing in the
// active language falls back to English, and a key missing everywhere falls back to itself — so the
// UI is never blank or shows a raw key, it just shows English until that string is translated.
//
// This is deliberately tiny (no i18n library): the app has one bundle, strings are static, and the
// only runtime need is lookup + {var} interpolation.

import en from './en';
import ar from './ar';
import fr from './fr';
import sw from './sw';
import pt from './pt';

const DICTS = { en, ar, fr, sw, pt };

/**
 * Translate `key` into `lang`, substituting {placeholders} from `vars`.
 * Lookup order: active language → English → the key itself.
 */
export function t(lang, key, vars) {
  const dict = DICTS[lang] || en;
  let str = dict[key];
  if (str == null) str = en[key];
  if (str == null) str = key;
  if (vars) {
    for (const k in vars) {
      str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
    }
  }
  return str;
}

export { DICTS };
