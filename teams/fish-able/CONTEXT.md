# Fish-able

Bounded context for team fish-able's take on Scenario 3: visualizing a single
journey of water and its quality data from a snow station, through the collection
system, to a treatment plant. This is a subset of the wider repo's vocabulary —
we don't model the prediction pipeline or the 3D map's data plumbing, only the
journey itself and what makes each number on it trustworthy.

## Language

**Node**:
A real, physical place in the collection system — a snow station, streamflow
gage, reservoir, or treatment plant — that a Journey can pass through. A Node can
have more than one Leg in and more than one Leg out (confluences and forks are
both real).
_Avoid_: Station, facility, marker

**Leg**:
A single real, physical connection between two adjacent Nodes, drawn as one
edge. A Leg is never invented — every Leg shown is a channel, tunnel, or
engineered connection that genuinely exists, whether or not it currently carries
water. Every Leg has its own baseline travel time, in whole days.
_Avoid_: Edge, connection, link

**Terrain**:
The kind of physical medium a Leg's water travels through — River, Conduit,
Reservoir, or Bore — which determines what the fish sees and feels passing
through it, independent of the Leg's travel time or Provenance.
_Avoid_: Environment, biome, medium

**River**:
A Terrain of natural, flowing stream, backed by a real Trace from USGS
flowline data — the fish's home ground: current, banks, daylight.
_Avoid_: Stream, creek (real Denver Water names for specific waterways, not
the Terrain category)

**Conduit**:
A Terrain of engineered pipe, backed by a real Trace from OSM pipeline data.
Exposed to daylight on stretches the source data marks overhead, hidden on
stretches it marks underground or at surface grade.
_Avoid_: Pipe, channel (Leg already uses "channel" loosely; Conduit is the
precise Terrain term)

**Reservoir**:
A Terrain of open, still water with no single path through it — the fish
crosses a basin, not a channel, so no Trace exists to draw. Shown with
underwater scenery and other fish: the missing Trace here means "no one path
to draw," not "nothing to show." Same word as the Node kind (a reservoir is
both a place the fish can stop and a Terrain it can cross) — deliberately,
since it's the same physical reservoir seen at two levels.
_Avoid_: Lake, basin

**Bore**:
A Terrain of drilled rock with no Trace, like Roberts or Moffat Tunnel — a
real, specific path exists, but nothing about it has ever been published, so
none can be drawn. Shown as featureless, spooky pipe walls: the missing
Trace here means "we don't know," the opposite reason from Reservoir's.
_Avoid_: Tunnel

**Trace**:
The real coordinate path a Leg follows — its meanders, its above-ground or
below-ground stretches — pulled from USGS flowline or OSM conduit data. Only
River and Conduit Terrains have one; Reservoir and Bore both lack one, for
opposite reasons (see each).
_Avoid_: Geometry, path, route

**Collection System**:
The full graph of every real Node and Leg — confluences, forks, and all. Denver
Water's own term (used in `README.md`/`guide.md`). A Journey is one path carved
through it, not a separately-named thing; there's no "Corridor" concept
alongside it.
_Avoid_: Corridor, network, route (Corridor was our own earlier draft term,
retired once the graph turned out to branch)

**Journey**:
One fish's trip through the Collection System, starting at a chosen snow
station, under a chosen Episode, ending either at a treatment plant or wherever
a Regime-closed Leg stops it. At a fork, the viewer picks which Leg the fish
takes next. There is only ever one fish — "multiple Journeys running at once"
isn't a concept this context has.
_Avoid_: Trip, trace, flow

**Episode**:
One specific, named historical stretch of time — a real date range with real
data behind it — that instantiates a Regime. A Regime (drought, snow-flush) is
a category; it can have more than one Episode (e.g. a 2002 drought and a 2018
drought are both Episodes of the drought Regime). The viewer picks an Episode
by name, not just a Regime category.
_Avoid_: Run, scenario, instance

**Regime**:
A stretch of time where one mechanism dominates the water's behavior — snow-flush
and drought are the two this context uses. Same definition as `glossary.md` at
the repo root. A Regime modifies each Leg's baseline travel time — speeding it
up, slowing it down, or closing it outright — and (via its Episodes) supplies
the real data a Journey's Measured, Estimated, and Interpolated Readings come
from.
_Avoid_: Scenario, season (a season can cause a Regime, but isn't one — a
drought Regime can persist across seasons), Episode (a Regime is the category;
an Episode is one real instance of it)

**Reading**:
A single number for a single parameter (TOC, alkalinity, SWE, cfs, water level,
...), looked up for one Node on one date within an Episode, carrying its own
Provenance. A Node's visit on a given date produces *several* Readings, one per
parameter, not one bundled value — so "the Reading at Foothills" is ambiguous;
"the TOC Reading at Foothills" is not.
_Avoid_: Value, measurement, data point ("measurement" implies Provenance is
Measured, so it doesn't work as the general term)

**Provenance**:
How a Reading came to have its number. One of four levels, in decreasing order
of trust: **Measured** (a sensor or lab really recorded it), **Estimated**
(computed from real data by a documented method), **Interpolated** (math filled
in between two known Readings), **Fabricated** (no data, no method — invented,
and must be marked as such). Provenance is a property of the Reading, never of
the Node or the Leg: a real Node can carry a Fabricated Reading without the Node
or the Leg leading to it being any less real.
_Avoid_: Confidence, quality, source

**Excursion**:
A Reading that crosses its operational threshold (TOC above 3 mg/L, or
alkalinity below 60 mg/L). Same definition as `glossary.md` at the repo root.
_Avoid_: Alert, threshold breach

## Invariants

- A Reading is always for exactly one parameter. A Node's visit on a date can
  produce many Readings, never one bundled Reading covering several parameters.
- A reachable Node always has a Reading for any date a Journey visits it —
  Fabricated is the fallback of last resort, never a blank. "No Reading" only
  ever means the Node isn't reachable from where the fish is.
- Provenance is set independently per Node. There is no rule that a Fabricated
  or Estimated Node upstream degrades what a Measured Node downstream can claim.
- Excursion is a soft note, not a hard rule: it can be computed and shown for
  any Provenance, but it only means something when the Reading behind it is
  Measured or Estimated. Flagging one on an Interpolated or Fabricated Reading
  is flagging noise as if it were signal, and should read as less meaningful.
- A Regime-closed Leg ends the Journey there. The Journey does not continue
  past a closed Leg by any other name — shown as a dry, flopping fish.
- Measured, Estimated, and Interpolated Readings are consistent across replays
  of the *same* Episode — same date range, same real data, same numbers every
  time. Fabricated Readings are generated fresh on every execution regardless
  of Episode, because nothing real backs them to begin with.
- A Journey's "moment" advances by whole days as the fish crosses each Leg —
  never finer, because every CSV in `data/` is daily-only. A Leg's travel time
  is a deliberately-set property (can be 0, for a fast leg like reservoir to
  plant) modified by the active Regime, not derived from anything else.
- A missing Trace is never treated as a gap to fill. No Leg gets an invented
  wiggle to look less like a straight line — a Trace is included when real
  path data backs it, and left out otherwise. A Bore and a Reservoir both
  lack a Trace but are never rendered alike: a Bore's absence reads as
  mystery (we don't know), a Reservoir's as openness (there's nothing to
  know) — Terrain, not the presence of a Trace, decides how a Leg looks.
