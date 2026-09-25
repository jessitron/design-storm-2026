# Downstream · Fish-able Scenario 3

A no-build fish Journey with 3D terrain scenery through a small subset of the Collection
System. One fish, two historical Episodes, and a real downstream fork. No changes
to Denver Water's originals, the team's CONTEXT.md, or the domain sketch.

## Launch

From the repository root:

```sh
python3 serve.py
```

Open <http://localhost:8765/teams/fish-able/journey/>. If another workspace already
uses that port, run `python3 serve.py 8766` and open
<http://localhost:8766/teams/fish-able/journey/>. The latter was used for verification
in this workspace. Keep this whole directory together, including `TERMS.md`.

Select an Episode, Hoosier Pass as the starting Node, and a departure date. Start,
then choose each downstream Leg. At Strontia Springs choose Conduit 26 to Foothills
or the South Platte through Waterton Canyon to Conduit 20, Marston Forebay and
Marston treatment plant. The 3D camera follows the fish downstream; “Show full system”
returns to the overview. Restart keeps the selections and clears the Journey.
Replay automatically repeats the same choices, dates and Readings, including an
unsuccessful final choice. The event log uses the requested domain event names.
Use the Fish speed slider to adjust animation from 0.05× to 1× in 0.05× steps, including during
a Leg or replay. The setting stays selected when restarting. It applies to both
3D and 2D views without changing Journey dates or Readings; reduced-motion mode
continues to skip the traversal animation.

## Infrastructure evidence and scope

All point coordinates come from `water-system-3d/system.json`. The starting Node
represents snow in the monitored catchment, not water flowing through the SNOTEL
instrument. The fish represents water, not the ability of fish to pass dams or
pipes. These are connected reaches between the Nodes selected for this small
model, not an exhaustive inventory of every physical structure along each reach.

| Leg | Evidence / drawing |
| --- | --- |
| Hoosier Pass → Eleven Mile Canyon Reservoir | NRCS station 531 metadata in `water-system-3d/snotel-co-stations.json` assigns HUC12 **101900010102**, Headwaters Middle Fork South Platte River. The headwater reach goes through the Middle Fork to the South Platte and Spinney before Eleven Mile. This is a reach overview, not a direct engineered conduit. Missing headwater Trace is explicitly schematic. |
| Eleven Mile → Cheesman → sentinel Node | Connected South Platte channel; actual committed USGS NLDI mainstem flowlines. |
| Sentinel Node → Strontia Springs Dam | South Platte through Strontia Springs Reservoir; actual NLDI Trace. The reservoir is represented at its dam/intake. |
| Strontia → Foothills | Conduit 26, identified in `system.json` and `build_system.py`; schematic endpoint line because the committed OSM subset does not provide its Trace. Not classified as a Bore. |
| Strontia → Conduit 20 Diversion | Actual downstream South Platte NLDI Trace, in Waterton Canyon. |
| Diversion → Marston Forebay | Conduit 20, with partial OSM way 1112753995 Trace. Missing endpoint stretches are dashed schematic joins. |
| Marston Forebay → Marston treatment plant | Local terminal storage feeding its adjacent treatment plant, as described in `system.json` / `build_system.py`; schematic because no detailed Trace is committed. |

Primary and local source checks, accessed September 25, 2026:

- [USGS HUC identification](https://nas.er.usgs.gov/queries/SpecimenViewer.aspx?SpecimenID=614170)
  identifies 101900010102 as Headwaters Middle Fork South Platte River. Together
  with NRCS's station metadata this supports the starting catchment. The local
  sketch's direct Hoosier → North Fork confluence depiction is **not** reused.
- [Upper South Platte Watershed Protection Association](https://www.uppersouthplatte.org/ijourney/midsofrk/almaswa.html)
  locates the Middle Fork at the base of Hoosier Pass.
- [Denver Water: getting ready for big river flows](https://www.denverwater.org/tap/getting-ready-big-river-flows)
  describes South Platte water passing through Spinney to Eleven Mile.
- [Denver Water: South Platte River](https://www.denverwater.org/recreation/south-platte-river)
  describes Cheesman → Deckers → North Fork confluence.
- [Denver Water: Waterton Canyon / Strontia Springs](https://www.denverwater.org/es/node/81)
  confirms diversion to both Foothills and Marston.
- `water-system-3d/build_system.py` documents the dam, downstream diversion,
  Conduits 26 and 20, Marston storage and plants. `system.json` is reused, not edited.
- `strontia-brief/basins/mainstem-flowlines-06707525.json` and
  `downstream-mainstem-06707525.json` provide USGS NLDI coordinates. The generator
  joins the ordered features, then slices at vertices nearest each Node. Original
  coordinates are preserved. Short endpoint joins are schematic and drawn dashed.
- `strontia-brief/basins/conduits-osm.json` supplies partial Conduit 20 coordinates;
  © OpenStreetMap contributors. Other parallel/fragmentary OSM features are not
  falsely joined into a continuous Trace.

The overview camera tilts over actual terrain and frames the selected Leg, then
flies to the arrival Node. The default fish-eye camera rides along the Leg. The optional 2D diagram keeps north up. No invented wiggles or missing-Trace → Bore inference is used.
The missing Middle Fork Trace is not replaced with the upstream NLDI mainstem
file: that file follows the **South Fork** above the confluence, not Hoosier Pass.

## Historical data and assumptions

The Episodes are **May 25–June 20, 2023** and **May 25–June 20, 2024**, named
“Hoosier snowmelt.” They are supported by the supplied daily records. SWE declines
from **9.1 to 0.0 inches** and **17.6 to 0.0 inches**, respectively (computed from
`HoosierPass.csv` on those exact boundary dates). This supports an educational
snowmelt framing. Assigning the team's **Snow-flush** Regime is an interpretation,
not a validated hydrologic classification. No drought Episode or historical
closure is offered.

`data.json` holds only those date windows, selected infrastructure and Trace
coordinates. Reading data uses no live API requests or external fonts. The 3D scenery streams
satellite and elevation tiles and therefore requires a network connection.

| Node / parameter | Source | Per-Reading Provenance |
| --- | --- | --- |
| Hoosier SWE, inches | `data/HoosierPass.csv`, NRCS 531:CO:SNTL | Measured sensor observation |
| Sentinel daily mean temperature, °C | `data/USGS_South_Platte.csv`, USGS 06707525 | Estimated: supplied aggregate of observations |
| Sentinel daily median turbidity, FNU | Same file | Estimated: supplied aggregate of observations |
| Foothills TOC and alkalinity, mg/L | `data/FoothillsInfluent.csv`, Denver Water | Measured lab observations, separate cards |
| Other Node/date/parameter combinations | No supported observation in the selected demo datasets | Reading unavailable; no number or Provenance class |

The daily aggregate labels retain the source column's mean/median meaning. The
source aggregation algorithm is not reproduced here; no claim is made that these
summaries are instantaneous measurements. Both Denver Water notices are copied
verbatim to `TERMS.md` and displayed in the demo. Water-quality Readings are marked
provisional. The generator reads committed snapshots; it does not revise them.

Readings are independent observations at the visited Node and exact Journey date,
not a transported chemical concentration or prediction of what the fish carried.
The UI explicitly shows actual observation dates; no nearest-date substitution,
interpolation, fabricated fallback, or sketch-derived Excursion threshold is used.
The Strontia sonde workbook is intentionally outside this first version: its 2026
casts do not support these historical Episodes and selecting a depth needs a
separate domain decision.

Baseline times are **demo configuration only**: 4, 4, 4, 2 days for the headwaters,
Eleven Mile–Cheesman, Cheesman–sentinel and sentinel–dam Legs; 2 days for each
Waterton and Conduit 20 Leg; 0 for the two final plant Legs. The Snow-flush Regime
multiplies each by 0.5, rounded up to a whole day. No timing has been validated as a
physical prediction. No operational decisions should be inferred from this demo.

If the next arrival would exceed the Episode's inclusive end date, `Leg selected`
is followed by `Journey ended` with an explicit Episode-boundary reason. The fish
remains at the departure Node/date; no traversal or out-of-window Reading is
created. Zero-day Legs may complete on the final date.

## Verification and test fixture

The expandable explanation contains an opt-in **closed-Leg test fixture**. It
restarts the Journey, displays a persistent warning, doubles configured travel
times, and closes Conduit 26. This is a synthetic Regime override of the same
historical records, not a historical Episode, documented drought or real closure.
Selecting that Leg emits:

```
Leg selected
Selected Leg found closed under the Regime
Journey ended
```

There is no arrival or alternate continuation after closure. Restart is required.

Rebuild the checked-in subset (offline, Python standard library):

```sh
python3 teams/fish-able/journey/build_data.py
```

Run domain tests (Node with ES module support):

```sh
node --experimental-default-type=module --test teams/fish-able/journey/model.test.mjs
```

Run browser tests with Playwright and Chromium installed externally, and serve.py
running on 8766 (or set `DEMO_URL`):

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/node_modules/playwright \
  node teams/fish-able/journey/browser.test.cjs
```

Verified: both Episodes; complete Foothills and Marston paths; actual fork choices;
exact observation dates and per-parameter cards; missing data; Episode boundary;
fixture closure; deterministic replay; restart including cancellation mid-animation;
responsive 390-pixel layout; reduced-motion support; no browser JavaScript errors.
The browser test captures desktop completion, the fork, and mobile screenshots in
`.context/`. Controls use native buttons, labels, selects and date input, visible
keyboard focus and an arrival live region. Map controls do not require pointer
interaction with tiny Nodes.

## Domain handoff

- **Explicit conflict:** CONTEXT.md requires Fabricated fallback Readings, while
  AGENTS.md forbids invented numbers. The task explicitly resolves this in favor
  of **Reading unavailable**. `unavailableReading()` in `model.js` isolates the
  policy. It does not silently classify absence as Fabricated or as Measured.
- CONTEXT.md's prose says Provenance belongs to each Reading but one invariant
  says “per Node.” This implementation follows per Reading. The team should
  reconcile that wording separately.
- Confirm whether daily supplied sensor summaries should be Estimated (used here)
  or Measured with a separate aggregation attribute.
- Confirm whether the summary headwater reach is the desired Leg granularity or
  should expand into additional Nodes (e.g. Spinney) with a verified Middle Fork
  Trace. No direct North Fork Leg is modeled from Hoosier Pass.
- Validate Regime classification and per-Leg timing before any physical claim;
  provide evidence before adding drought Episodes or closures.
- Decide whether Episode exhaustion deserves its own domain event. For now it is
  an explicit reason on the existing `Journey ended` event.
- Supply validated parameter-specific thresholds before enabling Excursion notes.

The existing domain sketch and glossary remain unchanged for the parallel domain
modeling session. Denver Water's originals remain read-only.

## 3D scenery

The default view reuses the repository's MapLibre GL JS **5.15.0** renderer and
providers: Esri World Imagery plus Mapzen Terrarium elevation tiles on AWS. The
library and stylesheet are pinned locally in `vendor/`, with their bundled license.
No API key or build step is required. Terrain elevation is exaggerated **1.35×**
for readability, as in the existing map. Imagery depicts the provider's satellite
mosaic, **not historical conditions on the selected Episode date**.

Drag to pan; right-drag to rotate and tilt; use the on-map zoom, compass and
fullscreen controls. In overview mode the fish is an illustrative billboard above actual terrain,
not a depth-resolved aquatic simulation. First-person mode hides that billboard. Available real Traces are turquoise;
schematic stretches remain dashed amber. A selected Leg is highlighted, and the
overview camera frames its extent during traversal. Camera flights respect reduced motion.

“2D diagram” switches to the local offline-capable diagram without changing the
Journey. If WebGL initialization fails, the diagram is used automatically. Tile
load failures display a status message and the 2D switch remains available.
The Episode controls, Readings, closures and event log do not rely on imagery.

Implementation uses [MapLibre's terrain API](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/#setterrain),
using the same tile providers as `design-storm-water-system-3d.html`. The renderer
is updated locally to 5.15.0 for explicit first-person camera elevation support. Scenery verification additionally
checks terrain initialization, 3D/2D switching, and unavailable-network fallback.

## Fish-eye camera

The default 3D perspective now puts the camera at the fish's position, looking
forward along the selected Leg. “Overview camera” restores the external fish and
terrain overview; “Fish-eye camera” returns to first person. Switching perspectives
does not select a Leg, change dates, or add Journey events. “Show full system”
automatically leaves first person. The 2D fallback remains available.

The camera samples the same geographic polyline as the fish, looks approximately
200 metres ahead, and uses MapLibre 5.15.0's `calculateCameraOptionsFromCameraLngLatAltRotation` with DEM
elevations. It defaults to **3 metres above terrain at the fish’s location**, adjustable
from **1–150 metres** using the Fish-eye height slider. Higher terrain ahead no
longer raises the fish automatically; the first-person pitch is 82 degrees. Explicit camera elevation prevents ground
clamping from tipping the camera downward after a restart. These are rendering
settings, not physical fish height, water depth or hydraulic predictions. There is
no underwater bathymetry, water-surface elevation model or tunnel interior data.
Missing-Trace stretches still follow the explicitly schematic dashed joins.
The first-person fins and reticle are decorative screen overlays.

First-person Leg animations take eight seconds of screen time, independent of
configured whole-day Journey time. Reduced-motion preference makes traversal and
camera arrival immediate. Restart cancels pending movement, including the camera.

Verify first-person controls, moving camera and cancellation with:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/node_modules/playwright \
  node teams/fish-able/journey/fish-eye.test.cjs
```

The test captures `.context/fish-eye.png`.


The height slider updates the camera immediately, including during a Leg, and
retains the chosen height across restart and view switches for this page session.
It does not alter Journey dates or events. Height is above the terrain mesh, not
measured depth or water-surface elevation. Very low settings can expose terrain
mesh or satellite texture limitations; the slider lets viewers raise it as needed.

## Water along the Journey

“3D water effects” is on by default. A selected or already traversed **surface
river** Leg receives a turquoise ribbon following its committed NLDI Trace.
Procedural ripples and moving highlights animate while traversing; they stop with
reduced motion, on arrival, or on restart. The display works in both fish-eye and
overview modes. Restart clears the traveled water. The toggle affects visuals
only, never the Journey's events or Readings.

`water.js` explicitly limits surface ribbons to the canyon, river, reservoir and
Waterton Legs. The headwater schematic reach and enclosed conduits get **dashed
symbolic water movement**, not an invented surface river. Short schematic joins
between river Trace vertices and Nodes are not widened into real river geometry.
A rejected/closed Leg is never included as traveled water.

The ribbon's 24-metre graphic width, color, ripples and animation rate are purely
illustrative. They are not observed river banks, historical inundation, water
levels, flow velocities or bathymetry. The ribbon is draped onto the existing
terrain mesh rather than a modeled water surface. Original infrastructure and
Trace coordinates are unchanged; no new Reading values are introduced.

The pinned renderer is now MapLibre **5.15.0**, which includes upstream fixes for
terrain tile retention and camera transitions. Water verification exercised rapid
fish-eye/overview switching, ripple animation, toggling without event changes,
schematic vs. surface classification, and clearing traveled water on restart.
