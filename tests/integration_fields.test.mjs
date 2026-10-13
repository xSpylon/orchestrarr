import test from 'node:test';
import assert from 'node:assert/strict';
import { integrationFieldsToSend } from '../src/helpers/integration_fields.ts';

test('blank secrets are left out, plain settings are trimmed and kept even when blank', () => {
  assert.deepEqual(integrationFieldsToSend({ apiKey: '', token: ' t ', username: ' admin ', publicUrl: '' }), { token: ' t ', username: 'admin', publicUrl: '' });
});
