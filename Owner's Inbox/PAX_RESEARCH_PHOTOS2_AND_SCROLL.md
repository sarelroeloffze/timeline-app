# PAX Research Report — Photos2 Views + Horizontal Scroll Bug
*Commissioned by LARRY — 2026-04-14*

---

## 1. Tree View Research (for REINHOLT)

### What the reference images show
- Top-down and left-right genealogy trees
- Multi-spouse branching (husband + wife side by side above children)
- Portrait photos in oval/circle nodes (IMG_2448)
- Colour-coded lineage lines
- Parchment styling options
- Birth/death dates on nodes

### Recommended library: `d3-hierarchy` (CDN, ~20 KB)
One new `<script>` tag. Computes tree layout positions; rendering done as custom React SVG — the same pattern already used in SubwayView, FlowView, and ThreadTimeline. No other library needed.

### Library comparison
| Library | Verdict | Reason |
|---|---|---|
| **d3-hierarchy** | ✅ GO | Lightweight, CDN, outputs x/y coords, works with React SVG rendering |
| dagre-d3 | ❌ NO-GO | Heavy, adds Graphviz dependency, overkill |
| elkjs | ❌ NO-GO | Excellent for DAGs but 500 KB+ bundle, no CDN, complex API |
| vis-network | ❌ NO-GO | Wrong visual model (force-directed, not tree) |
| chart.js | ❌ NO-GO | No tree layout support |

### Multi-parent handling
d3-hierarchy natively supports one parent per node. Strategy: pick the **first** `parent` relationship as the structural parent for layout; draw the second parent as a **supplementary dashed curved line** post-layout. This is the standard approach used by all major genealogy tools.

### Multi-spouse handling
Post-layout pass: nudge spouse nodes side-by-side and draw a horizontal **couple bar** above their shared children.

### Data gaps
**None.** All required data already exists:
- `people` — name, birth, death, photo, color ✅
- `relationships` — parent/spouse/influenced ✅
- Person photos (base64 or server URL) ✅

### Recommended layout directions
User-selectable: Top-Down (default for genealogy) and Left-Right (for "Genealogy of the Nations" style).

### Edge cases to handle
- People with no relationships → show as isolated node
- Very large trees (100+ people) → paginate or collapse subtrees (REINHOLT to decide)
- Cycles in relationship data → `hasAncestorCycle()` already exists in the app, reuse it

---

## 2. Radial / Wheel View Research (for CIERAN)

### What the reference images show
- **IMG_2443** — "Wheel of Prophecy": concentric ring segments, centre hub, colour-coded radial segments, text labels inside segments
- **IMG_2447** — "Christ in You": body silhouette with spoke labels — a simpler variant; defer this one

### Recommended approach: Custom SVG arc math (~40 lines, no new CDN needed)
The math for arc segments is straightforward: `d3-arc` path generator is available but unnecessary — pure `Math.sin`/`Math.cos` with SVG `<path>` elements is sufficient and keeps the file self-contained.

### Library comparison
| Library | Verdict | Reason |
|---|---|---|
| **Custom SVG arcs** | ✅ GO | No dependency, already done for SubwayView/ThreadTimeline |
| d3-shape | 🟡 OPTIONAL | Provides arc helpers but not worth adding a CDN tag for |
| chart.js Polar Area | ❌ NO-GO | Canvas-based, can't integrate with EventPanel click handler |
| Highcharts | ❌ NO-GO | Paid licence |

### Data mapping (no new entity required)
| Ring | Maps to |
|---|---|
| Inner ring | Eras (time bands already in the app) |
| Middle ring | Categories |
| Outer ring | Events |
| Centre hub | Timeline name or user-typed label |

Existing `events`, `categories`, `eras` data is fully sufficient. No new data entity needed.

### Interactivity
- Click outer segment → open EventPanel (same as all other views)
- Hover → tooltip (title, date, category)
- Zoom in/out → scale SVG viewBox
- Toggle rings on/off via style panel

---

## 3. Horizontal Timeline Scroll Bug (for REED)

### Symptom
Users cannot scroll down in the Horizontal timeline view — rows are clipped and inaccessible when there are many people.

### Root cause — line ~21709 in index.html

```jsx
<div style={{ flex:1, display:'flex', overflow:'auto', minWidth:0 }}>
```

This outer content-area wrapper has `overflow:'auto'`. This intercepts vertical scroll events before vis-timeline's internal `verticalScroll:true` mechanism can act on them. vis-timeline's own documentation requires `overflow:hidden` on its outer container — which is correctly set on the inner wrappers — but this outer div undoes that.

### Fix
**Change `overflow:'auto'` → `overflow:'hidden'`** on that outer content wrapper div.

This is safe: VerticalTimeline, DataView, ReportView, SlideView, GanttView, and all other views manage their own internal scrolling and are not affected by this change.

### Secondary issue
The `height: tlWrapRef.current?.clientHeight || 600` fallback at the vis-timeline init may read 0 on first mount. The ResizeObserver already corrects this shortly after, but a one-frame blank flash is possible. REED can address by ensuring `setTlHeight` fires before vis init, or by using a CSS `height:100%` approach with a stable container.

### Recommended vis-timeline options to verify/add
```js
verticalScroll: true,
height: '100%',        // or explicit px via ResizeObserver
groupHeightMode: 'auto',
```

---

## 4. Recommendations Summary

| Task | Assignee | Action |
|---|---|---|
| Tree View | **REINHOLT** | Build using d3-hierarchy CDN + React SVG; top-down default + left-right toggle |
| Radial View | **CIERAN** | Build using custom SVG arc math; inner=eras, middle=categories, outer=events |
| Horizontal scroll bug | **REED** | Change `overflow:'auto'` → `overflow:'hidden'` on outer content wrapper; verify vis options |

*— PAX, Senior Researcher*
