import test from 'node:test';
import assert from 'node:assert/strict';
import { createTranslator, supportedLocales, translateStatus } from '../src/lib/i18n.ts';

test('supports the major dashboard locales and keeps English as the fallback', () => {
  assert.deepEqual([...supportedLocales], ['en', 'nl', 'de', 'fr', 'es', 'it', 'pt', 'zh', 'ja']);
  assert.equal(createTranslator('nl')('nav.settings'), 'Instellingen');
  assert.equal(createTranslator('ja')('settings.language'), '言語');
  assert.equal(createTranslator('en')('missing.key', 'Fallback'), 'Fallback');
});

test('interpolates translated values and preserves API status values as display text', () => {
  const t = createTranslator('nl');
  assert.equal(t('shell.attention', undefined, { value: 3 }), 'Let op, 3 onopgeloste meldingen');
  assert.equal(translateStatus(t, 'Not configured'), 'Niet geconfigureerd');
  assert.equal(translateStatus(createTranslator('en'), 'Direct Play'), 'Direct play');
  assert.equal(translateStatus(t, 'An upstream-specific state'), 'An upstream-specific state');
});

test('every language translates every English text, with the same placeholders', async () => {
  const { readFileSync } = await import('node:fs');
  const load = (locale) => JSON.parse(readFileSync(new URL(`../src/translations/${locale}.json`, import.meta.url), 'utf8'));
  const flat = (object, prefix = '') => Object.entries(object).flatMap(([key, value]) => typeof value === 'object' ? flat(value, `${prefix}${key}.`) : [[`${prefix}${key}`, value]]);
  const placeholders = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort().join(',');
  const english = flat(load('en'));
  for (const locale of supportedLocales.filter((code) => code !== 'en')) {
    const texts = new Map(flat(load(locale)));
    const missing = english.filter(([key]) => !texts.has(key)).map(([key]) => key);
    assert.deepEqual(missing, [], `${locale} is missing ${missing.length} texts`);
    for (const [key, text] of english) assert.equal(placeholders(texts.get(key)), placeholders(text), `${locale} ${key} has different placeholders`);
  }
});
