# Journey orchestration

Reserved for coordinating visitor actions with supplied Journey models, Collection
System and Readings dependencies. Journey domain operations decide whether and
where progression occurs; orchestration coordinates the resulting visit's Reading
request and returns results for presentation.

Do not retain a current Journey, Node, date or selected Leg between calls. Exact
operation signatures and ordering await a concrete use case. Camera and animation
belong in presentation. See the [model structure](../../../README.md#internal-structure).
