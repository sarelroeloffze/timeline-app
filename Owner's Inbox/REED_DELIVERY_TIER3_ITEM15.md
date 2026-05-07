# REED — Delivery Note
## Tier 3, Item 15: Bulk Edit Operations
**Date:** March 2026
**Engineer:** REED (Senior Full-Stack, LARRY team)

---

## What Was Built

Bulk edit operations for the Timeline app — the ability to select multiple events across all major views and apply the same change to all of them in one action.

---

## Architecture

### State model
- `selectedEventIds: Set` added to App state (`useState(() => new Set())`)
- Always updated immutably (always `new Set(prev)`)
- Cleared automatically when a timeline is loaded or created
- Global Escape key listener clears selection when bar is visible

### BulkEditBar component
- Fixed-position bar at the bottom of the screen (z-index 600)
- Renders only when `selectedEventIds.size > 0`
- Shows count badge + 8 action buttons
- Each button opens a small inline popover (not a full modal) anchored to its button
- Popovers close on Escape, Cancel, or successful Apply

### handleBulkAction callback (in App)
Pure immutable event-map update — iterates `events` array, applies action only to selected events, leaves all others untouched. Delete is handled via filter.

---

## Selection in Each View

| View | How to select |
|---|---|
| Vertical timeline | Hover any event card — checkbox appears on left edge. Click to select. Selected cards highlighted dark blue. |
| Data view (Events tab) | Checkbox column as first column. Header checkbox selects/deselects all with indeterminate support. |
| Horizontal timeline | Ctrl+click (Cmd+click on Mac) multiple event bars. vis-timeline `multiselect: true` enabled. Single click still opens EventPanel as before. |

---

## Actions in the BulkEditBar

| Button | What it does |
|---|---|
| Category | Changes category for all selected events. Confirmation dialog before apply. |
| + Person | Adds a person link to all selected events (does not remove existing links). |
| − Person | Removes a person link from all selected events. |
| + Tags | Union-merge: adds chosen tags to all selected events, preserving existing tags. |
| − Tags | Removes chosen tags from all selected events. Tags come from the union of all selected event tags. |
| Status | Sets planned/active/done/cancelled/at-risk on all selected events. |
| Shift Dates | Moves all selected events forward or backward by N days/months/years. Integer-year events show an amber warning when day/month units are chosen — they are rounded to year boundaries. Preview text shows exactly what will happen. |
| 🗑 Delete | Permanently deletes all selected events. Requires explicit confirmation. Clears selection after delete. |

---

## Technical Details

### Vertical timeline checkbox
- `.vert-sel-cb` element positioned `absolute left: -20px` relative to the card row wrapper
- CSS: `opacity: 0` by default; `#tl-view-vertical div:hover > .vert-sel-cb` reveals on hover
- `.vert-sel-cb--checked` class forces `opacity: 1 !important` when checked
- No React hover state needed — pure CSS hover + class-based checked state

### DataGrid checkbox
- Only rendered when `selectedEventIds` and `onSelectionChange` props are present
- Passed from App only for the events tab in DataView (not the people tab)
- Header checkbox uses `indeterminate` DOM property via `ref` callback

### HorizontalTimeline multiselect
- `multiselect: true, multiselectPerGroup: false` added to vis-timeline init options
- `select` event fires with array of all currently selected item IDs
- When `realIds.length > 1` (Ctrl+click multi-select): populates `selectedEventIds` with the full set
- When `realIds.length === 1` (plain single click): opens EventPanel as before, does not change bulk selection
- `onSelectionChangeRef` pattern (same as `onSelectRef`) keeps the callback fresh inside the one-time `useEffect` closure

### Guardrails respected
- Non-selected events are never touched in bulk actions
- Shift Dates on integer-year events: day/month shifts rounded to year (not silently ignored — yellow warning shown)
- Delete: mandatory confirm dialog, no way to delete without explicit confirmation
- server.py: not touched

---

## Files Changed

- `/Users/sarelroeloffze/Library/CloudStorage/Dropbox/AAA Claud/timeline/index.html` — all new code
- `/Users/sarelroeloffze/Library/CloudStorage/Dropbox/AAA Claud/timeline/CLAUDE.md` — session notes + status updated

---

## Testing

1. Open http://localhost:8765 (or open index.html directly)
2. Switch to Vertical view — hover event cards to see checkboxes appear
3. Check 2+ events — BulkEditBar appears at the bottom
4. Try Category change: pick a category, confirm → all selected events update
5. Try Shift Dates with "years" → events move; try "days" on BC integer-year events → amber warning shown
6. Try Delete → confirmation required before events are removed
7. Press Escape → BulkEditBar disappears, selection cleared
8. Switch to Data view → checkboxes appear as first column in Events tab; select all works
9. Switch to Horizontal view → Ctrl+click two or more event bars → BulkEditBar appears

---

*Delivered by REED — architecture-first, finish the last 10%.*
