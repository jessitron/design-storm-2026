# Fish-able architecture

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
