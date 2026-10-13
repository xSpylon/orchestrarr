import test from 'node:test';
import assert from 'node:assert/strict';
import { paletteCommands } from '../src/helpers/palette_commands.ts';

test('without a query, recent pages lead and are not repeated', () => {
  const commands = paletteCommands(null, '', ['pipeline'], 'dark');
  assert.deepEqual([commands[0].id, commands[0].group], ['pipeline', 'Recent']);
  assert.equal(commands.filter((command) => command.id === 'pipeline').length, 1);
  assert.equal(commands.at(-2).title, 'Switch to light theme');
});

test('a query also searches live items', () => {
  const dashboard = { requests: [{ requestId: 7, title: 'Dune', requester: 'Ann', state: 'Pending' }], services: [{ name: 'Dunesync', state: 'Healthy' }] };
  assert.deepEqual(paletteCommands(dashboard, ' dune ', [], 'light').map((command) => command.id), ['request-7', 'service-0']);
});
