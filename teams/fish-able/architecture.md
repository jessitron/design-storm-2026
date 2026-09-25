# Fish-able architecture

Accepted structure. Use this document and `model/structure.html` for the MVP.
Module responsibilities are agreed; future operation signatures and unresolved
domain policies still require concrete use cases.

## Context and ownership

Keep one Fish-able bounded context. Current evidence supports one educational
language and purpose; it does not establish separate bounded contexts for the
three responsibilities below. External data providers are upstream systems, not
automatically additional Fish-able bounded contexts.

| Module | Owns | Does not decide |
| --- | --- | --- |
| Collection System | Real Nodes, Legs, connectivity, known and Unspecified Traces, supporting evidence | Illustrative travel times or educational closures |
| Journey | Active Episode, current Node/date, choices, progression, completion; internal Regime policy for illustrative duration and closure | Historical or fabricated Reading provenance |
| Readings | Historical lookup, fictional fallback, provenance, historical anchor and date | Where or when the Journey moves |

Journey uses the Collection System and requests Readings for visits under the
same selected Episode. Neither supporting module owns mutable Journey state.
Provider translation belongs behind the modules' interfaces. Presentation sends
visitor actions and displays results; it owns camera and animation state.

Journey is a candidate aggregate because current Node, date, selected Leg, and
terminal status must remain consistent. That does not require atomically updating
the graph or source observations, nor storing the whole graph inside Journey.
Persistence, event sourcing, microservices, and replay randomness are not selected.

## Implementation structure

Each module separates domain models, invariants and policies from stateless
orchestration of use cases and dependencies. Tier 1 serves use cases through
orchestration; Tier 2 contains domain models. Calls go downstream from Tier 1 to
Tier 2, never upward. Returning a result is not an upward call.
Orchestration retains no per-Journey
or per-request business state; domain models own state and decisions. External
translation stays in adapters outside domain models, and camera/animation stays in
presentation. Direct domain queries do not need orchestration wrappers.

The directory layout, dependency rules and CollectionSystem call flow are in
[`model/README.md`](model/README.md#internal-structure). Collection System
topology, loading and browser exploration are implemented; Journey and Readings
have reserved layer directories.
