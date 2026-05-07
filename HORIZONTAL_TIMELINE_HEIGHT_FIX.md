# Horizontal Timeline Height Contract Fix

## Problem Diagnosis

**Symptom:** Opening the Bible "Sweeping Timeline" (37 people rows) showed blank space under the axis, or partial scroll, or no scrolling.

**Root Cause:** Height contract mismatch between vis-timeline and overlay layers
1. vis-timeline initialized with hardcoded `height: 600`
2. Overlay layers (eras, markers) calculated height from `masterHeight` state (2000+px for 37 rows)
3. Race condition: overlays rendered before vis-timeline processed the height update
4. Result: vis-timeline at 600px pushed out of view, while 2058px overlays remained visible

## Solution Implemented

### 1. Pre-calculate Initial Height
```javascript
// Calculate initial height based on people count BEFORE timeline init
const initialHeight = useMemo(() => {
  const activeCivs = civilizations.filter(c => c.showOnTimeline !== false);
  const rowCount = people.length + (activeCivs.length > 0 ? 1 : 0);
  const rowH = hs.rowHeight || 44;
  return Math.max(rowCount * (rowH + 10) + 60, 400);
}, [people.length, civilizations, hs.rowHeight]);
```

### 2. Initialize masterHeight Before Timeline Render
```javascript
// Initialize masterHeight once we know the row count
useEffect(() => {
  if (masterHeight === null && people.length >= 0) {
    setMasterHeight(initialHeight);
  }
}, [masterHeight, people.length, initialHeight]);
```

### 3. Guard Timeline Creation Until Height is Ready
```javascript
useEffect(() => {
  if (!containerRef.current || masterHeight === null) return;
  // ... create vis.Timeline with height: masterHeight
}, [masterHeight, redrawEras, updateMarkerLines]);
```

### 4. Guard Overlay Rendering
```javascript
const redrawEras = useCallback(() => {
  const tl = timelineRef.current, overlay = overlayRef.current;
  if (!tl || !overlay || masterHeight == null) return;
  // ... use masterHeight for overlay.style.height
}, [masterHeight]);
```

### 5. Synchronous Height Updates
```javascript
// When people change, update masterHeight and vis-timeline height synchronously
setMasterHeight(calcHeight);
if (timelineRef.current) {
  timelineRef.current.setOptions({ height: calcHeight });
  requestAnimationFrame(() => {
    timelineRef.current?.redraw();
    redrawEras();
    updateMarkerLines();
  });
}
```

### 6. Loading State Guard
```javascript
// Don't render timeline until masterHeight is calculated
if (masterHeight === null) {
  return (
    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'#6b7280', fontSize:14 }}>Loading timeline...</div>
    </div>
  );
}
```

### 7. Synchronous Overlay Updates on Navigation
```javascript
const fitAll = () => {
  if (!timelineRef.current) return;
  timelineRef.current.fit({ animation:{ duration:700, easingFunction:'easeInOutQuad' } });
  // Redraw overlays synchronously to avoid blank flash
  requestAnimationFrame(() => {
    redrawEras();
    updateMarkerLines();
  });
  // Also update after animation completes
  setTimeout(() => {
    redrawEras();
    updateMarkerLines();
  }, 750);
};
```

## Key Architectural Principles

1. **Single Source of Truth:** `masterHeight` state drives all height calculations
2. **No Circular Dependencies:** Height flows one direction: calculation → state → consumers
3. **Synchronous Updates:** Height changes trigger immediate vis-timeline.setOptions() + overlay redraws
4. **Guard Clauses:** All height-dependent code checks `masterHeight !== null` before proceeding
5. **requestAnimationFrame:** Ensures DOM reads happen after layout is complete

## Testing

Open http://localhost:8765
1. Load the Bible "Sweeping Timeline" (37 people, 27 events)
2. Click "Fit All"
3. Expected: Time axis visible at top, era bands aligned to axis, all 37 event rows visible with scroll

## Files Modified

- `/Users/sarelroeloffze/Library/CloudStorage/Dropbox/AAA Claud/timeline/index.html`
  - HorizontalTimeline component (lines ~6292-7020)

## Date

2026-05-01
