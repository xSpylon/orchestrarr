import test from 'node:test';
import assert from 'node:assert/strict';
import { attentionItems } from '../src/helpers/attention.ts';

const paddington = { title: 'Paddington 2', service: 'Radarr', sourceId: 813, state: 'Import pending', needsAction: true };
const alien = { title: 'Alien Resurrection', service: 'Radarr', sourceId: 559, state: 'Import blocked', needsAction: true };

test('a pipeline item and its alert show up once, as the actionable pipeline item', () => {
  const alerts = [
    { id: 'service-Prowlarr', title: 'Prowlarr needs attention', severity: 'attention', resolved: false },
    { id: 'pipeline-Radarr-813', title: 'Paddington 2', severity: 'attention', resolved: false },
  ];
  const items = attentionItems(alerts, [paddington]);
  assert.equal(items.length, 2);
  assert.equal(items[0].state, 'Attention');
  assert.equal(items[1], paddington);
});

test('a dismissed alert hides its pipeline item too', () => {
  const alerts = [{ id: 'pipeline-Radarr-559', title: 'Alien Resurrection', resolved: true }];
  assert.deepEqual(attentionItems(alerts, [alien]), []);
});

test('a pipeline item the server flags for action groups as attention, whatever its state text says', async () => {
  const { pipelineShape } = await import('../src/helpers/attention.ts');
  assert.equal(pipelineShape({ title: 'Paddington 2', state: 'Import pending', needsAction: true }), 'attention');
  assert.equal(pipelineShape({ title: 'Dune', state: 'Import pending', needsAction: false }), 'pending');
  assert.equal(pipelineShape({ title: 'Heat', state: 'Downloading' }), 'progress');
});
