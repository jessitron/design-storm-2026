# Fish-able

- [`architecture.md`](architecture.md): accepted module ownership and two-tier structure.
- [`model/structure.html`](model/structure.html): current visual architecture.
- [`model/`](model/): fresh TypeScript implementation, layer placement and tests.
- [`CONTEXT.md`](CONTEXT.md): domain vocabulary.
- [`collection-system.json`](collection-system.json): hand-modeled topology and evidence.

The working [connections explorer](model/index.html) uses the fresh model. Run
`npm ci && npm run build` from `teams/fish-able/model/`, then `python3 serve.py`
from the repository root and open <http://localhost:8765/teams/fish-able/model/>.
Select a Node and inspect its outgoing Legs and destinations.

CollectionSystem topology and loading are implemented. Journey and Readings have reserved
domain/orchestration directories; their behavior is not implemented yet.
Reading-anchor, fabrication, replay and SNOTEL questions remain deferred.

## Historical references

- [`demo/`](demo/): preserved visual prototype, with older domain assumptions.
- [`scenario-3-domain-model.html`](scenario-3-domain-model.html): earlier domain sketch;
  use the accepted architecture above for new implementation.
- [`notes.md`](notes.md): original human notes and topology evidence.

Do not reuse the demo's model as the fresh implementation or treat its policies
as decisions for the MVP.

Serve the prototype from the repository root with `python3 serve.py`, then open
<http://localhost:8765/teams/fish-able/demo/>. The prototype retains its original
behavior and data notices; it is not the new model's implementation.
