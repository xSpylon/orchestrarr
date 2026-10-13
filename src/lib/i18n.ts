import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import messagesEn from '../translations/en.json' with { type: 'json' };
import messagesNl from '../translations/nl.json' with { type: 'json' };
import messagesDe from '../translations/de.json' with { type: 'json' };
import messagesFr from '../translations/fr.json' with { type: 'json' };
import messagesEs from '../translations/es.json' with { type: 'json' };
import messagesIt from '../translations/it.json' with { type: 'json' };
import messagesPt from '../translations/pt.json' with { type: 'json' };
import messagesZh from '../translations/zh.json' with { type: 'json' };
import messagesJa from '../translations/ja.json' with { type: 'json' };

interface MessageCatalog {
  [key: string]: string | MessageCatalog;
}

const translations = {
  en: messagesEn,
  nl: messagesNl,
  de: messagesDe,
  fr: messagesFr,
  es: messagesEs,
  it: messagesIt,
  pt: messagesPt,
  zh: messagesZh,
  ja: messagesJa,
} as const satisfies Record<string, MessageCatalog>;

export type Locale = keyof typeof translations;
export const supportedLocales = Object.keys(translations) as Locale[];

const localeLabels: Record<Locale, string> = {
  en: 'English',
  nl: 'Nederlands',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  it: 'Italiano',
  pt: 'Português',
  zh: '简体中文',
  ja: '日本語',
};

export const localeOptions = supportedLocales.map((value) => ({ value, label: localeLabels[value] }));

export type Translator = (key: string, fallback?: string, values?: Record<string, string | number>) => string;

function getMessage(catalog: MessageCatalog, key: string): string | undefined {
  const value = key.split('.').reduce<string | MessageCatalog | undefined>((current, part) => {
    if (!current || typeof current === 'string') return undefined;
    return current[part];
  }, catalog);
  return typeof value === 'string' ? value : undefined;
}

function statusMessageKey(value: string): string {
  return value.toLowerCase().replace(/\s+([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

export function createTranslator(locale: Locale): Translator {
  return (key, fallback = getMessage(translations.en, key) || key, values = {}) => {
    const message = getMessage(translations[locale], key) || getMessage(translations.en, key) || fallback;
    return message.replace(/\{(\w+)\}/g, (match, name: string) => Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match);
  };
}

export function translateStatus(t: Translator, value?: unknown): string {
  const raw = String(value || '').trim();
  return raw ? t(`status.${statusMessageKey(raw)}`, raw) : t('status.unknown');
}

function isLocale(value: string): value is Locale {
  return supportedLocales.includes(value as Locale);
}

function detectLocale(): Locale {
  try {
    const stored = localStorage.getItem('locale');
    if (stored && isLocale(stored)) return stored;
  } catch { /* localStorage can be unavailable in private browsing or tests */ }
  const language = typeof navigator === 'undefined' ? '' : navigator.language.toLowerCase();
  const match = supportedLocales.find((locale) => language === locale || language.startsWith(`${locale}-`));
  return match || 'en';
}

type LocaleContextValue = { locale: Locale; setLocale: (locale: Locale) => void; t: Translator };
const defaultLocale: Locale = 'en';
const LocaleContext = createContext<LocaleContextValue>({ locale: defaultLocale, setLocale: () => undefined, t: createTranslator(defaultLocale) });

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);
  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try { localStorage.setItem('locale', next); } catch { /* preference remains in memory */ }
  }, []);
  const t = useMemo(() => createTranslator(locale), [locale]);
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  return createElement(LocaleContext.Provider, { value: { locale, setLocale, t } }, children);
}

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}
