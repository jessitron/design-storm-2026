import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {translateCollectionSystem} from '../src/collection-system/adapters/collection-system-json.js';
import {CollectionSystem, type Node} from '../src/collection-system/domain/collection-system.js';
import {loadCollectionSystem} from '../src/collection-system/orchestration/load-collection-system.js';

const sourceUrl = new URL('../../../collection-system.json', import.meta.url);

async function readSource(): Promise<unknown> {
  return JSON.parse(await readFile(sourceUrl, 'utf8')) as unknown;
}

test('the real graph loads through the use case and exposes its topology', async () => {
  let loads = 0;
  const system = await loadCollectionSystem(async () => {
    loads += 1;
    return readSource();
  });

  assert.equal(loads, 1);
  assert.equal(system.node('dam-strontia').name, 'Strontia Springs Dam');
  assert.deepEqual(system.legsFrom('dam-strontia').map(leg => leg.to), [
    'plant-foothills', 'dam-marston-diversion',
  ]);
  assert.deepEqual(system.legsFrom('plant-foothills'), []);
  assert.ok(system.nodes().some(node => node.id === 'plant-foothills'));
});

test('the node listing and its nodes cannot be mutated by a caller', () => {
  const node: Node = {id: 'one', name: 'One', kind: 'gage'};
  const system = new CollectionSystem([node], []);
  const listed = system.nodes();

  assert.ok(Object.isFrozen(listed));
  assert.ok(Object.isFrozen(listed[0]));
  assert.throws(() => (listed as Node[]).push({id: 'two', name: 'Two', kind: 'gage'}), TypeError);
  assert.throws(() => {
    (listed[0] as {name: string}).name = 'Changed';
  }, TypeError);
  assert.equal(system.nodes().length, 1);
  assert.equal(system.node('one').name, 'One');
});

test('the JSON adapter copies domain fields and strips source metadata', () => {
  const translated = translateCollectionSystem({
    extra: 'ignored',
    nodes: [{id: 'one', name: 'One', kind: 'gage', evidence: {source: 'test'}}],
    legs: [{id: 'leg-one', from: 'one', to: 'one', terrain: 'River', trace: 'known'}],
  });

  assert.deepEqual(translated, {
    nodes: [{id: 'one', name: 'One', kind: 'gage'}],
    legs: [{id: 'leg-one', from: 'one', to: 'one'}],
  });
});

test('the JSON adapter rejects malformed external shapes', () => {
  assert.throws(() => translateCollectionSystem(null), /source must be an object/);
  assert.throws(() => translateCollectionSystem({nodes: [], legs: 'legs'}), /source\.legs must be an array/);
  assert.throws(
    () => translateCollectionSystem({nodes: [{id: 'one', name: 'One', kind: 'station'}], legs: []}),
    /source\.nodes\[0\]\.kind/,
  );
  assert.throws(
    () => translateCollectionSystem({nodes: [{id: 'one', name: 'One', kind: 'gage'}], legs: [{id: 'leg-one', from: 'one'}]}),
    /source\.legs\[0\]\.to must be a string/,
  );
  assert.throws(
    () => translateCollectionSystem({nodes: [{}], legs: []}),
    /source\.nodes\[0\]\.id must be a string/,
  );
});

test('domain identity and endpoint invariants remain enforced after translation', async () => {
  await assert.rejects(
    loadCollectionSystem(async () => ({
      nodes: [
        {id: 'one', name: 'One', kind: 'gage'},
        {id: 'one', name: 'Again', kind: 'gage'},
      ],
      legs: [],
    })),
    /Duplicate Node: one/,
  );
  await assert.rejects(
    loadCollectionSystem(async () => ({
      nodes: [{id: 'one', name: 'One', kind: 'gage'}],
      legs: [{id: 'leg-one', from: 'one', to: 'missing'}],
    })),
    /Unknown Node: missing/,
  );
});

test('loader errors are returned to the caller', async () => {
  const failure = new Error('source unavailable');
  await assert.rejects(
    loadCollectionSystem(async () => {
      throw failure;
    }),
    failure,
  );
});
