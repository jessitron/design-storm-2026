# Fish-able use-case implementation handoff

Extend Fish-able’s fresh implementation to cover the historical demo’s user-facing use cases, using the accepted architecture.

Read AGENTS.md and inspect git status first. Preserve existing changes.
Start from origin/gaganvats-05/fish-able-mvp-plan, including commit e1e430e.
Do not assume this work is on origin/main.

Read:
- teams/fish-able/README.md
- teams/fish-able/architecture.md
- teams/fish-able/CONTEXT.md
- teams/fish-able/collection-system.json
- teams/fish-able/model/README.md and structure.html
- All fresh model source, layer READMEs, and tests
- Historical demo README, app.js, model.js, scenery.js, water.js,
  build_data.py, and tests

Use the domain-modeling and codebase-design skills.
You may delegate bounded implementation tasks to gpt-5.6-luna subagents
with max reasoning after agreeing interfaces and file ownership.

Current working capability:
A browser connections explorer loads the real collection-system.json,
validates it through an adapter and stateless orchestration, and queries
CollectionSystem directly. Visitors select Nodes and inspect destinations.
Immutable topology, loading errors, retry, keyboard navigation, and mobile
layout work. Ten model tests and type checking pass. Preserve this capability.

Architecture is decided:
- One Fish-able bounded context.
- Collection System, Journey, and Readings modules.
- Each has orchestration/ (Tier 1) and domain/ (Tier 2).
- Orchestration coordinates dependencies and use cases without retaining
  per-Journey or per-request business state.
- Domain owns state, invariants, policies, and behavior.
- Calls go downstream; domain never calls orchestration.
- External translation belongs in adapters.
- Camera, animation, and view preferences belong in presentation.
- Avoid pass-through wrappers, generic base classes, framework migration,
  CQRS, event sourcing, and persistence infrastructure.

First produce a brief use-case inventory and phased implementation plan.
Distinguish demo behavior from accepted domain decisions.
Ask focused questions where unresolved domain choices block implementation.
Continue independent work while awaiting answers.

Cover these demo capabilities:
1. Select a named historical Episode, starting Node, and departure date.
2. Start a Journey and present the initial visit.
3. Inspect outgoing Legs, choose at forks, progress, and present arrivals.
4. Apply explicitly illustrative whole-day travel timing and Regime policies.
5. Complete at a treatment plant; handle a selected closed Leg.
6. Present per-parameter Readings with units, provenance, observation dates,
   sources, methods, and provisional labels.
7. Show Journey status, visit history, activity log, and completion summary.
   An activity log does not imply event-sourced storage.
8. Restart, including during animation, without stale callbacks mutating the
   replacement Journey; retain appropriate setup and view preferences.
9. Replay the prior choices, including an unsuccessful final choice, once
   replay semantics are explicitly resolved.
10. Provide 3D scenery and an offline-capable 2D diagram; retain domain
    functionality when imagery or WebGL is unavailable.
11. Support fish-eye/overview cameras, full-system/follow views, camera-height
    adjustment, animation speed, and water-effect toggling. These controls
    must not change Journey dates, Readings, or domain history.
12. Support reduced motion, accessible controls, responsive layout, and clear
    load failures.
13. Exercise closure behavior through an explicitly synthetic test fixture;
    never describe a fixture as a historical drought or real closure.

Do not copy the demo’s domain implementation or treat its tests as current
policy specifications. Presentation code/assets may be adapted where compatible,
with attribution preserved and no old domain dependencies.

Resolve these conflicts explicitly before implementing dependent behavior:
- Reading-anchor and historical-date selection remain deferred. Do not adopt
  the demo’s exact-date-only lookup automatically.
- Fabrication remains deferred. Do not silently adopt either the demo’s
  “Reading unavailable” fallback or a fictional-number generator.
- The demo stops at the Episode boundary; current vocabulary describes
  continuation beyond it. Do not copy the demo’s terminal behavior.
- Replay remains deferred, especially whether fabricated Readings repeat or
  are regenerated.
- SNOTEL remains deferred. The demo starts at Hoosier Pass, but the current
  vocabulary excludes SNOTEL stations from Nodes. Do not add Hoosier or the
  demo’s headwater Legs to the accepted topology without an explicit decision.
- Revalidate Episode evidence, Regime classification, travel-time configuration,
  and daily-summary provenance. Demo constants are not accepted policies.
- Handle starting at a plant or an isolated Node explicitly; missing recorded
  connectivity does not establish an operational closure.
- Preserve known versus Unspecified Traces. Do not portray invented paths,
  water surfaces, or scenery as measured geography.

Keep CONTEXT.md for vocabulary and domain invariants, with implementation
structure and use-case acceptance criteria elsewhere. Preserve Denver Water
originals, both notices, and provisional-data labeling. Compute historical
numbers from the supplied files. Any fictional values require an explicit
resolution of the fabrication policy and unmistakable labeling.

Build in independently working slices, starting with Journey setup/progression
and Readings before adding richer presentation. Each slice needs concrete
acceptance criteria and verification through public module interfaces.
Report blocked policies honestly rather than claiming full parity.

Verify from teams/fish-able/model/:
```sh
npm run check
npm test
npm run build
```

Also verify the actual browser flow: both Strontia branches, terminal and invalid
actions, agreed Reading policies, restart during movement, agreed replay behavior,
view controls that preserve domain state, unavailable-network fallback, keyboard
use, and mobile layout. Save screenshots under .context/.

Finish with a running URL, completed use cases, checks performed, and remaining
limitations. Do not merge or push unless requested.
