import en from './en.json';

/**
 * Tiny translation helper. Every UI string goes through t(); en.json is the only locale today.
 * Plurals: pass { n } and define `key_zero` / `key_one` / `key_other` variants.
 * Interpolation: "{name}" placeholders are replaced from params.
 */
export type MessageKey = keyof typeof en;
type Messages = Record<string, string>;

const locales: Record<string, Messages> = { en };
let current: Messages = en;
let plural = new Intl.PluralRules('en');

export function setLocale(locale: string): void {
  current = locales[locale] ?? en;
  plural = new Intl.PluralRules(locale);
}

export function t(key: string, params?: Record<string, string | number>): string {
  let msg: string | undefined;
  const n = params?.n;
  if (typeof n === 'number') {
    msg = (n === 0 ? current[`${key}_zero`] : undefined) ?? current[`${key}_${plural.select(n)}`];
  }
  msg ??= current[key] ?? (en as Messages)[key] ?? key;
  return params ? msg.replace(/\{(\w+)\}/g, (m, p: string) => String(params[p] ?? m)) : msg;
}
