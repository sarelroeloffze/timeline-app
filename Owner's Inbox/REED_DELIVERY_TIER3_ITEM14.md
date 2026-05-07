# REED — Delivery Note: Tier 3, Item 14
## Drag-to-reschedule events in the Horizontal vis-timeline view

**Delivered:** March 2026
**Branch/file:** `index.html` (single-file app, no build step)

---

## What was built

### Core drag-to-move / drag-to-resize
- `editable: { add:false, remove:false, updateTime:true, updateGroup:false, overrideItems:false }` set on the vis-timeline instance.
- Dragging left/right moves events along the time axis.
- Dragging the edge of a range event (bar) resizes it (changes start or end date independently).
- Dragging between person rows is **disabled** (`updateGroup:false`). The Edit Event modal remains the only way to change which person an event belongs to.

### Date format preservation
- `dateFromVisItem(visDate, originalVal)` — converts the vis `Date` object back to the app's native format: integer year (for BC/AD integer-year events) or ISO string (`YYYY-MM-DD` for full-date events). Format is detected by checking `typeof originalVal`.

### Snap behaviour
- `snapFn(date, scale, step)` — snaps to **year boundary** when `scale === 'year'` or `step >= 365`; snaps to **day boundary** otherwise. This means dragging a BC-era event on a century-scale view snaps cleanly to whole years.

### Undo support (Ctrl+Z / Cmd+Z)
- `undoStack` ref holds up to 20 entries `{ eventId, prevStart, prevEnd }`.
- Each successful drag pushes one entry.
- `keydown` handler on `window` intercepts Ctrl+Z (or Cmd+Z) when the undo stack is non-empty, pops the top entry, and calls `onRescheduleEvent` to restore previous dates.
- Toast: "Undo: date restored" (blue, 2 s).

### Confirmation toast
- After each drag: green "Moved to [year]" appears in the toolbar right area for 2 seconds.
- After a dependency warning: red "⚠ Dependency conflict: …" stays for 5 seconds.
- After undo: blue "Undo: date restored" for 2 seconds.
- All three share the same `dragMoveMsg` state slot; the colour and prefix distinguish them.

### Lock/unlock button (🔓/🔒)
- New button added to the Horizontal timeline toolbar, immediately after the "⬍ Reorder Rows" button.
- Default: **🔓 Unlocked** — drag is enabled.
- Click to lock: **🔒 Locked** — amber border, `dragLockedRef.current = true`; `onMove` rejects all drags immediately.
- Lock state persists in component state (resets to unlocked on page reload — intentional, safe default).
- Tooltip explains the action.
- `dragLocked` state triggers a `useEffect` that calls `timeline.setOptions({ editable: { updateTime:!dragLocked, ... } })` live on the vis-timeline instance.

### Recurring events
- `id.includes('_occ_')` detects an occurrence item.
- A `window.confirm` dialog appears: "OK = This occurrence only / Cancel = All occurrences".
  - **This only**: a copy of the master event is created with a new `uid()`, `recurrence: undefined` stripped, and the new dragged dates. Added to events state as a standalone event.
  - **All occurrences**: the delta (ms) between original and new start is computed; `shiftDateByMs` applies the delta to the master's `date_start` and `date_end`. The master event updates in state; `expandRecurringEvents` automatically recalculates all occurrences on next render.
- Recurring **master** events (`.recurrence` set, not an occurrence) have `editable: false` on their vis item — they cannot be dragged directly.

### Dependency conflict warning
- After any drag, `checkDependencyWarnings` scans `dependenciesRef.current` for Finish-to-Start (`FS` / `finish-to-start`) constraints involving the moved event.
- If the moved event's end year now exceeds a successor's start year, a red toast is shown.
- The warning is **advisory only** — the move is not rejected.
- `dependencies` prop is now passed from App into `HorizontalTimeline`.

### App wiring
- `handleRescheduleEvent(eventId, newStart, newEnd, special?, occEvent?)` added to App.
  - Normal: updates `date_start` and `date_end` on the matching event in state.
  - `special === 'detach-occurrence'`: inserts the standalone occurrence as a new event.
- `onRescheduleEvent={handleRescheduleEvent}` and `dependencies={dependencies}` added to the `<HorizontalTimeline>` JSX call.

### Architecture note — `dragHelpersRef` pattern
The vis-timeline `onMove` callback is registered inside a one-time `useEffect([], [redrawEras])`. Functions called from inside that closure must not be stale. Rather than re-running the expensive init effect on every render, helper functions are stored in `dragHelpersRef.current` (a plain ref object that is overwritten every render). The closure calls `dragHelpersRef.current.dateFromVisItem(...)` etc., always getting the latest version.

---

## Files changed

| File | Changes |
|---|---|
| `index.html` | HorizontalTimeline component + App wiring (see above) |
| `CLAUDE.md` | Session notes added, status line updated |
| `Owner's Inbox/REED_DELIVERY_TIER3_ITEM14.md` | This file |

---

## Testing checklist

- [ ] Open app at `http://localhost:8765` (or open `index.html` directly in browser)
- [ ] Horizontal view: drag a range event bar left/right — it moves, green toast appears, dates update
- [ ] Drag an edge of a range event — start or end date changes independently
- [ ] Drag a point event (box type) — it moves to new year
- [ ] Ctrl+Z after a drag — event snaps back, blue toast appears
- [ ] Ctrl+Z with nothing to undo — no effect (no error)
- [ ] Click 🔓 button → becomes 🔒, amber border — dragging has no effect
- [ ] Click 🔒 again → unlocks, dragging works again
- [ ] Lifeline river bands and civ bars cannot be dragged (rejected silently)
- [ ] If you have a recurring event and drag an occurrence, confirm dialog appears
- [ ] "This occurrence only" → new standalone event added, original recurrence unchanged
- [ ] "All occurrences" → master event dates shift, all occurrences shift accordingly
- [ ] If you have dependencies (Gantt view) and drag a predecessor past a successor, red warning appears

---

## Known limitations / follow-up

- `window.confirm` for the occurrence-vs-all choice is a browser native dialog — can be replaced with a custom modal in a later pass for a smoother UX.
- Dependency checking only covers `FS` (Finish-to-Start) constraint type; other types (SS, FF, SF) are not yet checked.
- Drag history (undo stack) is cleared on page reload — no persistence.

---

*Delivered by REED, Senior Full-Stack Developer, LARRY team.*
