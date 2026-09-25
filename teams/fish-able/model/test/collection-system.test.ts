import assert from 'node:assert/strict';
import test from 'node:test';
import {CollectionSystem, type Node, type Leg} from '../src/collection-system/domain/collection-system.js';

// A small subset of the real topology recorded in ../collection-system.json.
const nodes: Node[] = [
  {id: 'dam-strontia', name: 'Strontia Springs Dam', kind: 'reservoir'},
  {id: 'plant-foothills', name: 'Foothills Treatment Plant', kind: 'plant'},
  {id: 'dam-marston-diversion', name: 'Conduit 20 Diversion', kind: 'reservoir'},
];
const legs: Leg[] = [
  {id: 'leg-conduit-26', from: 'dam-strontia', to: 'plant-foothills'},
  {id: 'leg-strontia-to-marston-diversion', from: 'dam-strontia', to: 'dam-marston-diversion'},
];

test('Strontia offers both downstream Legs; arriving at Foothills offers none', () => {
  const system = new CollectionSystem(nodes, legs);
  assert.deepEqual(system.legsFrom('dam-strontia').map(leg => leg.to), [
    'plant-foothills', 'dam-marston-diversion',
  ]);
  assert.deepEqual(system.legsFrom('plant-foothills'), []);
  assert.equal(system.node('plant-foothills').kind, 'plant');
});

test('unknown Nodes are errors, distinct from known Nodes without outgoing Legs', () => {
  const system = new CollectionSystem(nodes, legs);
  assert.throws(() => system.node('missing'), /Unknown Node: missing/);
  assert.throws(() => system.legsFrom('missing'), /Unknown Node: missing/);
  for (const leg of [
    {id: 'bad', from: 'missing', to: 'plant-foothills'},
    {id: 'bad', from: 'dam-strontia', to: 'missing'},
  ]) assert.throws(() => new CollectionSystem(nodes, [leg]), /Unknown Node: missing/);
});

test('duplicate identities cannot silently replace Nodes or Legs', () => {
  assert.throws(() => new CollectionSystem([...nodes, nodes[0]!], legs), /Duplicate Node/);
  assert.throws(() => new CollectionSystem(nodes, [...legs, legs[0]!]), /Duplicate Leg/);
});

test('caller changes cannot alter the validated topology', () => {
  const node = {id: 'dam-strontia', name: 'Strontia Springs Dam', kind: 'reservoir'} satisfies Node;
  const leg = {id: 'leg-conduit-26', from: node.id, to: 'plant-foothills'};
  const system = new CollectionSystem([node, nodes[1]!], [leg]);
  node.name = 'Changed';
  leg.to = 'missing';
  assert.equal(system.node('dam-strontia').name, 'Strontia Springs Dam');
  assert.equal(system.legsFrom('dam-strontia')[0]?.to, 'plant-foothills');
  assert.ok(Object.isFrozen(system.node('dam-strontia')));
  assert.ok(Object.isFrozen(system.legsFrom('dam-strontia')));
  assert.ok(Object.isFrozen(system.legsFrom('dam-strontia')[0]));
});
