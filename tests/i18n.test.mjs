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
