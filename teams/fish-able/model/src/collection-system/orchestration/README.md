# Collection System orchestration

Reserved for use cases that coordinate dependencies and topology construction.
For example, loading a source, asking an adapter to translate it, and constructing
the domain model would belong here once a loader is needed. Identity and endpoint
validation stay in `../domain/collection-system.ts`.

No orchestration code is needed for direct `node` or `legsFrom` calls. See the
[model structure](../../../README.md#internal-structure) for dependency rules.
