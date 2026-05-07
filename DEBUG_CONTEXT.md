# Timeline App — Debug Context
> Paste this file at the start of every Claude Code session before asking it to fix anything.
> Command: `read DEBUG_CONTEXT.md then read index.html and fix: [describe bug]`

---

## File location
```
/Users/sarelroeloffze/Library/CloudStorage/Dropbox/AAA Claud/timeline/index.html
```
Single file app — ~22,000 lines. React 18 (CDN), vis-timeline 7.7.2, Tailwind CSS (CDN), no build step.

---

## Architecture overview

- **`HorizontalTimeline` component** — main timeline view (around line 6295)
  - `containerRef` — the vis-timeline DOM container
  - `timelineRef` — the `vis.Timeline` instance
  - `overlayRef` — absolutely positioned div drawn on top for era colour bands
  - `itemsRef` / `groupsRef` — vis DataSet instances
  - `erasRef` — ref kept in sync with `eras` state

- **`redrawEras()`** — redraws era colour bands on `overlayRef`
  - Reads `tl.getWindow()` for visible date range
  - Calculates `w` from `vis-panel.vis-center` clientWidth
  - Calculates `h` from `itemset.scrollHeight` and `foreground.children` heights
  - Sets `overlay.style` left/top/width/height then rebuilds innerHTML

- **`syncTimelineHeight()`** — sets explicit pixel height on vis-timeline so it doesn't collapse
  - Must measure from `.vis-itemset` or `.vis-foreground` scrollHeight, NOT `containerRef.current.offsetHeight`

- **Main App state** (line 21258): `people`, `events`, `eras`, `categories`, `relationships`, `civilizations`, `places`, `arcs`, `markers`

---

## Known recurring bugs — what was tried and what worked

### BUG 1: Era colour bands not visible / timeline items disappearing together
**Root cause:** `redrawEras()` called synchronously inside `redraw()` or immediately after, before the DOM has settled.
**Fix that worked:** Wrap all `redrawEras()` calls inside `setTimeout(..., 0)` so they defer to after the DOM paint. Apply in three places:
1. The `people/dateFmt/civilizations` useEffect
2. The `showLabels` useEffect
3. The vis-timeline `'changed'` event handler

### BUG 2: Scroll not reaching bottom of timeline
**Root cause:** `updateMaxScroll` was measuring `containerRef.current.offsetHeight` (the fixed outer wrapper) instead of the actual rendered content height.
**Fix that worked:** Query `.vis-panel.vis-center .vis-content` or `.vis-itemset` for the true `scrollHeight`.

### BUG 3: Era overlay height only covers visible rows, not scrolled rows
**Root cause:** `overlay.style.height` was set to `centerH` (visible panel clientHeight only).
**Fix that worked:** Use `containerRef.current?.scrollHeight` as the height source, or take `Math.max` across `itemset.scrollHeight`, `foreground.scrollHeight`, and sum of `foreground.children` heights.

### BUG 4: Era overlay misaligned horizontally
**Root cause:** `overlay.style.left` must equal the label panel width (`.vis-panel.vis-left` clientWidth), and `overlay.style.top` must equal the axis height (`.vis-panel.vis-top` offsetHeight).
**The correct measurement pattern:**
```js
const leftW = containerRef.current?.querySelector('.vis-panel.vis-left')?.clientWidth || 0;
const topOffset = containerRef.current?.querySelector('.vis-panel.vis-top')?.offsetHeight || 0;
overlay.style.left = leftW + 'px';
overlay.style.top = topOffset + 'px';
```

### BUG 5: Groups/items show as 0 on first render (timing)
**Root cause:** The groups and items effects fire before template data has populated React state, then don't re-fire.
**Pattern:** Always check that `timelineRef.current` exists and `groupsRef.current.length > 0` before considering the timeline "ready". Force a redraw + redrawEras after data load with a short timeout.

---

## What NOT to try (already failed)

- Do NOT set `overlay.style.height` to `centerH` — that's the visible panel height only
- Do NOT call `redrawEras()` synchronously in the `'changed'` handler — causes item flicker/disappear
- Do NOT measure height from `containerRef.current.offsetHeight` — it's the outer fixed wrapper
- Do NOT use `position:relative` without an explicit height on the overlay wrapper div — it collapses
- Do NOT add `masterHeightRef` and make overlays use it — creates timing issues where timeline is not visible on initial load
- Do NOT add guards to prevent DOM reads in redrawEras/updateMarkerLines — breaks initial render
- Do NOT set wrapper div height to `masterHeight + 'px'` — causes infinite re-render loop

---

## The `redrawEras` function — correct measurement pattern (reference)
```js
const redrawEras = () => {
  const tl = timelineRef.current, overlay = overlayRef.current;
  if (!tl || !overlay) return;
  const win = tl.getWindow();
  const winStart = win.start.getTime(), winEnd = win.end.getTime(), winDur = winEnd - winStart;
  const center   = containerRef.current?.querySelector('.vis-panel.vis-center');
  const itemset  = containerRef.current?.querySelector('.vis-itemset');
  const foreground = containerRef.current?.querySelector('.vis-foreground');
  const axisPanel  = containerRef.current?.querySelector('.vis-panel.vis-top');
  const w = center ? center.clientWidth : 0;

  // ✅ Correct height: max of all content sources
  let h = itemset ? itemset.scrollHeight : 0;
  if (foreground) {
    h = Math.max(h, foreground.scrollHeight || 0);
    const sumKids = Array.from(foreground.children)
      .reduce((sum, c) => sum + c.getBoundingClientRect().height, 0);
    h = Math.max(h, sumKids);
  }

  const leftW     = containerRef.current?.querySelector('.vis-panel.vis-left')?.clientWidth || 0;
  const topOffset = axisPanel ? axisPanel.offsetHeight : 0;

  overlay.style.left   = leftW + 'px';
  overlay.style.top    = topOffset + 'px';
  overlay.style.width  = w + 'px';
  overlay.style.height = h + 'px';
  // ... draw era divs
};
```

---

## Session log — what was changed when

| Date | Bug | Fix applied | Result |
|------|-----|-------------|--------|
| Apr 2026 | Items disappearing when era bands visible | setTimeout(redrawEras, 0) in 3 places | ✅ Both visible |
| Apr 2026 | Scroll not reaching bottom | Measure from .vis-itemset scrollHeight | Partial fix |
| Apr 2026 | Era overlay height wrong | Use containerRef.current.scrollHeight | In progress |
| May 2026 | Horizontal view unresponsive on load | Added guard to setMasterHeight (only update if changed >1px) | ❌ Timeline not visible |
| May 2026 | Timeline not visible | Made redrawEras/updateMarkerLines use masterHeightRef instead of DOM reads | ❌ Still not visible |
| May 2026 | Added DOM fallback when masterHeight null | Read DOM only if masterHeightRef.current is null | ❌ Still not visible, Fit All causes freeze |
| May 2026 | Reverted all changes, restored from April 23 backup | cp index-old3.html index.html | ✅ Back to working state |
| May 2026 | Era overlay height wrong + scroll not reaching bottom | Changed redrawEras & updateMarkerLines to read from itemset/foreground.scrollHeight instead of containerRef.scrollHeight | ✅ BEST SO FAR: Timeline visible, scroll works, but era labels appear ABOVE timeline (should be behind), scroll stops before last events |
| May 2026 | Era positioning timing issue | Wrapped all redrawEras() and updateMarkerLines() calls in setTimeout(0) to defer until DOM is settled | ❌ No change |
| May 2026 | Fit All button no visual feedback | Added fitAllActive state with 800ms green flash on click | ✅ Button now shows visual feedback |
| May 2026 | Era overlay leftW = 0 causing overlap | Added debug logging, discovered leftW always 0 (left panel has clientWidth = 0) | Diagnosed root cause |
| May 2026 | Force leftW to 42px when 0 | Changed leftW default: `(leftPanel?.clientWidth || 0) > 0 ? leftPanel.clientWidth : 42` | ✅ leftW now = 42, but ❌ eras still appear on top, scroll still broken |
| May 4 2026 | Root cause found: horizStyle defaults | Changed line 21252: `showLabels:true, labelWidth:42` (was false/0) | ✅ Person names now visible (Ad, Ev, Se, En...) |
| May 4 2026 | Inner wrapper height | Changed line 7017 from `minHeight:'100%'` to `height: contentH + 'px'` | ✅ Partial scroll improvement |
| May 5 2026 | contentH not updating | Added debug logging - updateContentHeight measures 2219px but contentH state stays at 600px | 🔍 INVESTIGATING |

---

## Current Problem (May 5, 2026) — ACTIVE BUG

**Symptoms:**
1. ✅ App loads and switches to Horizontal view correctly
2. ✅ Person names visible (Ad, Ev, Se, En... = Adam, Eve, Seth, Enoch)
3. ✅ Partial scroll works (can scroll partway down)
4. ✅ Fit All button has visual feedback (green flash)
5. ❌ **Big black blank area** appears above timeline
6. ❌ **Scroll does NOT reach bottom** - stops before last events

**Root cause IDENTIFIED (May 5, 2026):**
- `updateContentHeight()` correctly measures actual timeline height: **2219px**
- But `contentH` React state remains stuck at: **600px**
- Wrapper div uses `height: contentH + 'px'` so it's only 600px tall
- vis-timeline's actual `.vis-panel.vis-center` is **2013px tall**
- This mismatch creates the black gap and prevents full scrolling

**Console output showing the problem:**
```
currentContentH: 600
finalH: 2219
h1: 2153
h2: 2011
h3: 46
```

**Why contentH doesn't update:**
- Multiple calls to `setContentH()` at different times conflict
- Line 6789: Initial calculation sets it to 600px (or row-based calc)
- Line 6704 & 6805: `updateContentHeight()` measures 2219px and calls `setContentH(2219)`
- But the state update doesn't seem to take effect - wrapper stays at 600px

**Investigation in progress:**
- Added logging to track before/after state updates
- Need to verify React state updates are actually being applied to the wrapper div
- May need to eliminate conflicting setContentH calls or use different timing

**Current fix applied (May 4 2026):**
```js
// In redrawEras() and updateMarkerLines():
let fullH = itemset ? itemset.scrollHeight : 0;
if (foreground) {
  fullH = Math.max(fullH, foreground.scrollHeight || 0);
  if (foreground.children.length > 0) {
    const sumKids = Array.from(foreground.children).reduce((sum, child) => {
      return sum + child.getBoundingClientRect().height;
    }, 0);
    fullH = Math.max(fullH, sumKids);
  }
}
```

**Next steps to investigate:**
1. ✅ Added debug logging - confirmed leftW = 0 is the issue
2. ✅ Fixed leftW to default to 42px when panel width is 0
3. ✅ Verified fix is applied (console shows leftW: 42)
4. ❌ **Overlay approach failed** - even with correct leftW, eras still appear wrong
5. **NEW APPROACH:** Use vis-timeline's native background items instead of manual overlay

---

## CONCLUSION: Manual Overlay Approach Does Not Work

**What we tried:**
- Reading height from itemset/foreground scrollHeight ✅
- Wrapping redrawEras in setTimeout(0) ✅
- Fixing leftW to 42px when panel width is 0 ✅

**Result:**
- Console shows correct values: `topOffset: 46, fullH: ~2000, leftW: 42, w: ~1200` ✅
- But eras still render "on top before timeline starts" ❌
- Scroll still doesn't reach bottom ❌

**Root cause hypothesis:**
The manual overlay approach is fundamentally incompatible with vis-timeline's dynamic rendering. The overlay is a separate DOM layer that doesn't integrate with vis-timeline's internal layout system.

**Next approach (May 4, 2026):**
Use vis-timeline's native `type: 'background'` items (like lifeline bands) instead of manual overlay. This will integrate with vis-timeline's own rendering and scrolling.

**Native background items attempt:**
- Added era background items for each era × each group (people + civs)
- Disabled old redrawEras() and updateMarkerLines() functions
- Removed manual overlay from render
- Testing: Still shows blank black block at top, scroll still broken

**ACTUAL ROOT CAUSE FOUND (May 4, 2026 - final):**
1. Default `horizStyle` had `showLabels: false` and `labelWidth: 0` → person names hidden
2. Inner wrapper had `minHeight:'100%'` instead of explicit height → scroll broken

**FIXES APPLIED:**
1. ✅ Changed default to `showLabels: true, labelWidth: 42` (line 21252)
2. ✅ Changed inner wrapper to `height: contentH + 'px'` (line 7016)
3. ✅ Disabled era labels to avoid confusion

**Result:** Person names now visible, scroll should reach full height

---

## How to start a Claude Code session correctly

```
Please read DEBUG_CONTEXT.md first, then read index.html.
The file is at: /Users/sarelroeloffze/Library/CloudStorage/Dropbox/AAA Claud/timeline/index.html

Current bug: [DESCRIBE EXACTLY WHAT YOU SEE]

Do not make changes until you have confirmed which function and line number is responsible.
Make one targeted fix at a time. After each fix, tell me exactly what you changed and why.
```

---

*Last updated: May 2026*
