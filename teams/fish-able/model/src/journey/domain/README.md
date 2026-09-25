# Journey domain

Reserved for Journey state and behavior: the active Episode, current Node/date,
Leg selection, progression and terminal status, with Regime policies for
illustrative duration and closure. Models enforce their own invariants and make
these decisions; orchestration must not manipulate state fields to implement them.

No Journey behavior is implemented yet. Use Collection System's domain interface
for topology; do not duplicate its validation or own mutable state in that module.
See the [model structure](../../../README.md#internal-structure).
