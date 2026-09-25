/** A real place in the Collection System. */
export type Node = Readonly<{
  id: string;
  name: string;
  kind: 'gage' | 'reservoir' | 'plant';
}>;

/** A directed physical connection. Illustrative travel timing belongs elsewhere. */
export type Leg = Readonly<{
  id: string;
  from: Node['id'];
  to: Node['id'];
}>;

/** Validated topology, independent of Journey state, observations and rendering. */
export class CollectionSystem {
  readonly #nodes = new Map<string, Node>();
  readonly #outgoing = new Map<string, readonly Leg[]>();
  readonly #nodeList: readonly Node[];

  constructor(nodes: readonly Node[], legs: readonly Leg[]) {
    for (const node of nodes) {
      if (this.#nodes.has(node.id)) throw new Error(`Duplicate Node: ${node.id}`);
      this.#nodes.set(node.id, Object.freeze({...node}));
      this.#outgoing.set(node.id, Object.freeze([]));
    }
    this.#nodeList = Object.freeze([...this.#nodes.values()]);

    const ids = new Set<string>();
    for (const leg of legs) {
      if (ids.has(leg.id)) throw new Error(`Duplicate Leg: ${leg.id}`);
      ids.add(leg.id);
      this.node(leg.from);
      this.node(leg.to);
      this.#outgoing.set(leg.from, Object.freeze([
        ...this.legsFrom(leg.from), Object.freeze({...leg}),
      ]));
    }
  }

  node(id: Node['id']): Node {
    const node = this.#nodes.get(id);
    if (!node) throw new Error(`Unknown Node: ${id}`);
    return node;
  }

  nodes(): readonly Node[] {
    return this.#nodeList;
  }

  legsFrom(id: Node['id']): readonly Leg[] {
    this.node(id);
    return this.#outgoing.get(id)!;
  }
}
