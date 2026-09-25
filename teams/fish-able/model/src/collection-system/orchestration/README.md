# Collection System orchestration

`load-collection-system.ts` owns the loading use case. It receives a source
loader, awaits one source, delegates external-shape translation to
`../adapters/collection-system-json.ts`, and constructs `CollectionSystem`.
The orchestration function retains no source or topology state between calls.

Identity and endpoint validation stay in `../domain/collection-system.ts`, so a
different source adapter cannot bypass the domain invariants.

No orchestration code is needed for direct `node`, `nodes`, or `legsFrom` calls.
See the [model structure](../../../README.md#internal-structure) for dependency
rules.
