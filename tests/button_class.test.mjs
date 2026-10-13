import test from 'node:test';
import assert from 'node:assert/strict';
import { buttonClass } from '../src/components/Button/button_class.ts';

test('buttonClass defaults to the quiet variant', () => {
  assert.equal(buttonClass(), 'quiet-button');
});

test('buttonClass combines variant, size, danger and extra classes', () => {
  assert.equal(buttonClass({ variant: 'solid' }), 'solid-button');
  assert.equal(buttonClass({ variant: 'ghost', size: 'small' }), 'ghost-button button-small');
  assert.equal(buttonClass({ variant: 'ghost', danger: true, className: 'row-hook' }), 'ghost-button danger-button row-hook');
  assert.equal(buttonClass({ variant: 'link' }), 'link-button');
  assert.equal(buttonClass({ variant: 'icon' }), 'icon-button');
});
