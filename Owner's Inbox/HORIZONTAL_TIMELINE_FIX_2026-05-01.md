# Horizontal Timeline Height Regressions — Fixed 2026-05-01

## Summary

Fixed three critical regressions in the HorizontalTimeline component introduced by the previous height calculation refactor.

---

## Regression 1: `visibility: hidden` Stuck on Timeline

**Symptom:**
vis-timeline container ends up with `style="... visibility: hidden; height: 2058px;"` in inline styles after resize/redraw. Time axis and items invisible. Manually setting `visibility: visible` in DevTools makes content appear.

**Root Cause:**
No explicit visibility toggle in current code, but vis-timeline may internally set `visibility:hidden` during layout calculations and fail to restore it when height changes are applied asynchronously.

**Fix:**
Added forced `visibility: visible` in `requestAnimationFrame` after every `setOptions({ height })` call:

```javascript
requestAnimationFrame(() => {
  const container = containerRef.current;
  if (container) {
    container.style.visibility = 'visible';
  }
  tl.redraw();
  redrawEras();
  updateMarkerLines();
});
```

---

## Regression 2: Zero Items Rendered

**Symptom:**
App data has 27 events, but `document.querySelectorAll('.vis-item').length === 0`. Groups (37) render correctly, but the items DataSet appears empty.

**Root Cause:**
Timeline was being **re-initialized** every time `masterHeight` changed (via the `useEffect` dependency array `[masterHeight, redrawEras, updateMarkerLines]`). This created a new vis-timeline instance with fresh empty `DataSet` objects, then the groups `useEffect` would populate groups, but the items `useEffect` would populate the OLD DataSet reference from the previous timeline instance — the new timeline never received any items.

**Fix:**
1. **Initialize timeline ONCE on mount** using a `timelineInitialized` ref guard:
   ```javascript
   const timelineInitialized = useRef(false);
   useEffect(() => {
     if (!containerRef.current || masterHeight === null || timelineInitialized.current) return;
     timelineInitialized.current = true;
     // ... create timeline once
   }, []); // Empty dependency array — runs once
   ```

2. **Update groups and items via `setGroups`/`setItems`** on the existing timeline instance whenever people/events change, instead of recreating the timeline:
   ```javascript
   useEffect(() => {
     const ds = groupsRef.current;
     const tl = timelineRef.current;
     if (!ds || !tl) return;
     ds.clear();
     ds.add(/* new groups */);
     // Update height via setOptions, not re-init
     tl.setOptions({ height: calcHeight });
   }, [people, dateFmt, civilizations, hs.rowHeight]);
   ```

---

## Regression 3: Two Nested Scrollers (Double Scroller)

**Symptom:**
Outer flex wrapper has `overflow: hidden auto` with `height: 600` and `scrollHeight: 2104`. vis-timeline is 2058px tall. Two independent scrollbars confuse users.

**Root Cause:**
Original fix attempted to use **native browser scroll** on an outer wrapper (`tlWrapRef` with `overflowY:'auto'`) while also setting vis-timeline to a fixed `height: masterHeight`. This created two scroll contexts fighting each other.

**Fix:**
**Let vis-timeline own the scroll behavior entirely.** Remove outer scroller:

1. **Set vis-timeline to use `maxHeight` instead of fixed `height`:**
   ```javascript
   const tl = new vis.Timeline(containerRef.current, items, groups, {
     // ... other options
     maxHeight: '100%',
     height: null,
   });
   ```

2. **Remove outer scroll wrapper:**
   ```javascript
   // OLD:
   <div ref={tlWrapRef} style={{ overflowY:'auto', ... }}>
     <div ref={containerRef} />
   </div>

   // NEW:
   <div ref={tlWrapRef} style={{ flex:1, position:'relative', display:'flex', flexDirection:'column' }}>
     <div style={{ flex:1, position:'relative', minHeight:0 }}>
       <div ref={containerRef} style={{ width:'100%', height:'100%' }} />
     </div>
   </div>
   ```

3. **Removed scroll event listeners, keyboard scroll handlers, and scroll control buttons** — vis-timeline handles all vertical scrolling internally now.

4. **Updated overlay height calculation** to read from `.vis-panel.vis-center.scrollHeight` instead of `masterHeight`:
   ```javascript
   const h = center ? center.scrollHeight : 0;
   overlay.style.height = h + 'px';
   ```

---

## Key Architectural Changes

| Aspect | Before | After |
|--------|--------|-------|
| **Timeline initialization** | Re-created every time `masterHeight` changed | Created ONCE on mount via ref guard |
| **DataSet updates** | New DataSets on every height change | Persistent DataSets, updated via `ds.add()` / `ds.clear()` |
| **Scroll ownership** | Outer wrapper with `overflowY:'auto'` | vis-timeline internal scroll via `maxHeight:'100%'` |
| **Height mode** | Fixed `height: masterHeight` | `maxHeight: '100%', height: null` (auto-size to content) |
| **Overlay positioning** | Used `masterHeight` state | Reads `.vis-panel.vis-center.scrollHeight` DOM value |

---

## Testing Checklist

- [x] Time axis visible on load
- [x] 27 event items render correctly across 37 rows
- [x] Era background bands align with timeline content
- [x] Single vertical scrollbar (no double scroller)
- [x] Fit All command works without blank flash
- [x] Zoom in/out triggers overlay redraw correctly
- [x] Drag-to-reschedule still works
- [x] No `visibility:hidden` stuck in inline styles

---

## Repro Verification

**Before fix:**
Open "Bible — Sweeping Timeline" at http://localhost:8765 → Horizontal view → Fit All → blank screen, 0 items, `visibility:hidden`.

**After fix:**
Open same timeline → Horizontal view → Fit All → time axis visible, 27 events visible across 37 rows, era bands aligned, smooth scroll.

---

## Files Modified

- `/Users/sarelroeloffze/Library/CloudStorage/Dropbox/AAA Claud/timeline/index.html`
  - Lines ~6560–7080: `HorizontalTimeline` component

---

## Delivery Status

✅ **All three regressions fixed.**
✅ **Horizontal timeline now stable.**
✅ **No re-introduction of stale closure issues.**
✅ **Single-scroller architecture confirmed.**

---

**Delivered by:** REED
**Date:** 2026-05-01
**Session:** Horizontal timeline regression debug
