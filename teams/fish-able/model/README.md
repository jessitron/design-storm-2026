# Fish-able model

Fresh TypeScript domain code. The previous visual prototype lives in `../demo/`;
this model does not import its code or datasets.

Run from this directory:

```sh
npm ci
npm run check
npm test
```

The first capability is Collection System topology: identify a Node and find its
outgoing Legs. Construction rejects duplicate identities and unknown endpoints;
the resulting topology cannot be changed by callers. Known Nodes without outgoing
Legs return an empty list; unknown Nodes throw. Isolated Nodes are allowed because
the team's graph includes places whose connectivity is still unresolved.

```ts
import {CollectionSystem} from './src/collection-system/domain/collection-system.js';

// nodes and legs are already translated domain inputs.
const system = new CollectionSystem(nodes, legs);
const choices = system.legsFrom('dam-strontia');
const destinations = choices.map(leg => system.node(leg.to));
```

The types use the existing glossary and graph's `id`, `from`, and `to` vocabulary.
Tests exercise the documented Strontia fork. Structural validation does not prove
that a connection exists in the real world; evidence remains in
`../collection-system.json`. A loader, evidence and Trace types, Journey state,
Regime timing and Readings are subsequent modeling steps. No new decisions about
fabrication or replay are made here.

## Internal structure

Open [the visual explanation](structure.html) for a diagram of these layers and
the existing CollectionSystem interaction.

These are three modules within one Fish-able bounded context, in one TypeScript
package. Each has a domain layer and a place for stateless orchestration:

```text
src/
  collection-system/
    domain/collection-system.ts
    orchestration/README.md
  journey/
    domain/README.md
    orchestration/README.md
  readings/
    domain/README.md
    orchestration/README.md
```

README-only directories reserve placement; they do not represent implemented
capabilities. Domain vocabulary remains in `../CONTEXT.md`; module ownership is
described in `../architecture.md`.

| Module | Domain layer | Orchestration layer, when needed |
| --- | --- | --- |
| Collection System | Node and Leg types, topology invariants and queries; future Trace and evidence models | Coordinate loading, translation and construction |
| Journey | Journey state, Episode, progression invariants, Regime timing and closure policies | Coordinate visitor actions, domain operations and Reading requests |
| Readings | Reading types, Provenance, invariants and selection policies | Obtain translated observations and invoke domain operations for a visit |

Orchestration may receive dependencies, including domain models, and use local
variables during a call. It retains no per-Journey or per-request business state
between calls. State and decisions belong in domain models; orchestration invokes
their behavior instead of updating their fields or reproducing their rules.

Tier 1 is orchestration (use cases); Tier 2 is domain (models and decisions).
Calls go downstream from Tier 1 to Tier 2, never upward. Returning a result does
not constitute an upward call.
Dependencies point from orchestration to domain. Domain code must not import
orchestration, provider adapters or presentation. Journey may use Collection
System's domain interface; supporting modules do not own mutable Journey state.
Cross-module coordination belongs in the use case's orchestration. A domain
operation can be called directly when no coordination is required: do not add
wrappers around `node` or `legsFrom`.

External JSON/CSV/provider translation belongs in the owning module's `adapters/`
directory when required. Create it with the first actual adapter. Domain models
receive domain inputs and enforce invariants independently of translation.
Presentation sends actions and displays results; camera and animation stay there.
No framework, persistence layer, generic base class or separate service is implied.

## Example call flow

The CollectionSystem example above is executable with the Node/Leg fixtures in
`test/collection-system.test.ts`. Construction validates identities and endpoints;
`legsFrom('dam-strontia')` returns the two documented outgoing Legs, and `node`
resolves their destinations, Foothills and Conduit 20 Diversion. No Journey moves
and no Readings are selected by this topology query.

For an eventual loading use case, orchestration could coordinate these steps:

```ts
// Illustrative future orchestration body; loader and adapter are not implemented.
// Dependencies would be supplied by the caller.
const source = await loadSource();
const {nodes, legs} = translateSource(source); // external format -> domain inputs
return new CollectionSystem(nodes, legs);    // domain enforces topology invariants
```

The result can then be passed to the direct query shown above. Duplicate identities
or missing endpoints still fail inside CollectionSystem, regardless of the source.
This is placement guidance, not a new loader interface or pass-through wrapper.

Journey and Readings operation signatures await concrete use cases. Reading-anchor,
fabrication, replay and SNOTEL questions remain deferred. This restructuring adds
no decisions about them and does not reuse the demo model.
