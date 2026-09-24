# Fish-able

Bounded context for team fish-able's take on Scenario 3: visualizing a single
journey of water and its quality data from a snow station, through the collection
system, to a treatment plant. This is a subset of the wider repo's vocabulary —
we don't model the prediction pipeline or the 3D map's data plumbing, only the
journey itself and what makes each number on it trustworthy.

## Language

**Node**:
A real, physical place in the collection system — a snow station, streamflow
gage, reservoir, or treatment plant — that a Journey can pass through.
_Avoid_: Station, facility, marker

**Leg**:
A single real, physical connection between two adjacent Nodes, drawn as one
edge. A Leg is never invented — every Leg shown is a channel, tunnel, or
engineered connection that genuinely exists, whether or not it currently carries
water.
_Avoid_: Edge, connection, link

**Corridor**:
An ordered chain of Legs connecting a chain of Nodes from a snow station toward
a treatment plant. Two Corridors can appear side by side without being related —
sharing a Corridor is what makes two Nodes part of the same system.
_Avoid_: Route, path, pipeline

**Journey**:
One fish's-eye trip along a Corridor, from a chosen starting snow station toward
a treatment plant, replayed under a chosen Regime. The Regime decides which Legs
of the Journey are open and how fast the trip moves along each one.
_Avoid_: Trip, trace, flow

**Reading**:
A single number reported at a Node for one Journey, carrying its own Provenance.
A Reading belongs to the Journey's visit to that Node, not permanently to the
Node itself — the same Node can carry a different Reading, with different
Provenance, on a different Journey.
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

**Regime**:
A stretch of time where one mechanism dominates the water's behavior — snow-flush
and drought are the two this context uses. Same definition as `glossary.md` at
the repo root; repeated here because a Journey's speed and which Legs are even
passable depend on it.
_Avoid_: Scenario, season (a season can cause a Regime, but isn't one — a
drought Regime can persist across seasons)

**Excursion**:
A Reading that crosses its operational threshold (TOC above 3 mg/L, or
alkalinity below 60 mg/L). Same definition as `glossary.md` at the repo root.
Flagging an Excursion only means something when the Reading behind it is
Measured or Estimated — flagging one on a Fabricated Reading is flagging noise
as if it were signal.
_Avoid_: Alert, threshold breach
