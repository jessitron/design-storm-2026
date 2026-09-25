import {translateCollectionSystem} from '../adapters/collection-system-json.js';
import {CollectionSystem} from '../domain/collection-system.js';

/** Load, translate, and validate one Collection System for a use case. */
export async function loadCollectionSystem(
  loadSource: () => Promise<unknown>,
): Promise<CollectionSystem> {
  const source = await loadSource();
  const {nodes, legs} = translateCollectionSystem(source);
  return new CollectionSystem(nodes, legs);
}
