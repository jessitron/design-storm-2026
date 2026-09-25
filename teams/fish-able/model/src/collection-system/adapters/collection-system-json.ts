import type {Leg, Node} from '../domain/collection-system.js';

type SourceRecord = Record<string, unknown>;

/**
 * Translate the hand-maintained external graph into Collection System inputs.
 *
 * The source format is deliberately checked at runtime because it crosses an
 * external-data seam. Only fields owned by the domain are copied; evidence and
 * rendering fields such as `terrain`, `trace`, and `source` stay outside it.
 */
export function translateCollectionSystem(source: unknown): {
  readonly nodes: readonly Node[];
  readonly legs: readonly Leg[];
} {
  const record = asRecord(source, 'source');
  const sourceNodes = asArray(record.nodes, 'source.nodes');
  const sourceLegs = asArray(record.legs, 'source.legs');

  const nodes = sourceNodes.map((value, index) => {
    const node = asRecord(value, `source.nodes[${index}]`);
    return {
      id: asString(node.id, `source.nodes[${index}].id`),
      name: asString(node.name, `source.nodes[${index}].name`),
      kind: asNodeKind(node.kind, `source.nodes[${index}].kind`),
    };
  });

  const legs = sourceLegs.map((value, index) => {
    const leg = asRecord(value, `source.legs[${index}]`);
    return {
      id: asString(leg.id, `source.legs[${index}].id`),
      from: asString(leg.from, `source.legs[${index}].from`),
      to: asString(leg.to, `source.legs[${index}].to`),
    };
  });

  return {nodes, legs};
}

function asRecord(value: unknown, path: string): SourceRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`Invalid Collection System source: ${path} must be an object`);
  }
  return value as SourceRecord;
}

function asArray(value: unknown, path: string): readonly unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`Invalid Collection System source: ${path} must be an array`);
  }
  return value;
}

function asString(value: unknown, path: string): string {
  if (typeof value !== 'string') {
    throw new Error(`Invalid Collection System source: ${path} must be a string`);
  }
  return value;
}

function asNodeKind(value: unknown, path: string): Node['kind'] {
  if (value !== 'gage' && value !== 'reservoir' && value !== 'plant') {
    throw new Error(
      `Invalid Collection System source: ${path} must be gage, reservoir, or plant`,
    );
  }
  return value;
}
