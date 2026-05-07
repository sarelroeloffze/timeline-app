# Delivery Note — Tier 1, Item 5: Category Management

**Developer:** REED
**Date:** 2026-03-28
**Feature:** Dynamic category management — create, edit, delete, reorder

---

## Summary

Categories have been lifted out of hardcoded constants and into a fully manageable React state system. Users can now create their own categories, rename or recolour existing ones, reorder them, and delete unused ones — all from a dedicated modal. Everything persists in localStorage and SQLite.

---

## What Was Built

### 1. Data model

- `DEFAULT_CATEGORIES` — array of `{ id, name, color, icon }` for the 7 built-in categories (Religion, Politics, Science, Aviation, Historical, Award, Personal).
- `UNCATEGORISED` constant — permanent fallback category (`id: 'cat-uncategorised'`). Can never be deleted.
- Module-level `CATEGORY_COLORS` and `ALL_CATEGORIES` kept as derived constants so no non-React code paths break.

### 2. `CatCtx` context

- `CatCtx = React.createContext(...)` with `useCat()` hook returning `{ categories, catColor, catNames }`.
- `catCtxValue` computed via `useMemo` in App — recalculates whenever `categories` state changes.
- Entire App render tree wrapped in `<CatCtx.Provider value={catCtxValue}>`.

### 3. `CategoryManagerModal`

Full CRUD interface:
- **Inline edit rows** — click ✏ to edit name, colour swatch (12-colour palette + native `<input type="color">`), and optional emoji icon; ✓ to confirm, ✕ to cancel.
- **▲ / ▼ reorder** — move any row up or down; order reflected immediately in dropdowns and legends.
- **🗑 Delete** — if the category is referenced by one or more events, a confirmation dialog warns the user; confirmed delete reassigns those events to `Uncategorised`.
- **+ New Category** — appends a new row in edit mode.
- **Restore Defaults** — confirmation dialog, then replaces the list with `DEFAULT_CATEGORIES` (Uncategorised preserved).
- Permanent `Uncategorised` row shown at top/bottom (no reorder, no delete controls).

### 4. Entry points

| Location | How to open Category Manager |
|---|---|
| Menu bar | Tools → Manage Categories… |
| Add Event modal | "✏ Manage" button beside the Category label |
| Edit Event modal | "✏ Manage" button beside the Category label |
| FilterPanel | "✏" button in the Categories section header |
| PeopleFilterModal | "✏ Manage" button in the Categories column header |

### 5. All category references updated

Every view and component now uses `useCat()` instead of the old constants:

- `HorizontalTimeline` — event bar colours, legend
- `VerticalTimeline` — event card colours
- `CanvasView` — event colours (aliased `catColorCtx`)
- `ThreadTimeline` — thread and card colours (aliased `catColorThread`)
- `FlowView` — event dot colours (aliased `catColorFlow`)
- `Sidebar` — category chips and counts
- `FilterPanel` — categories section, counts, badge
- `PeopleFilterModal` — categories column
- `ImportCSVModal` — hint text for valid category values
- `DataView` — `eventCols` computed via `useMemo` inside the component to dynamically override the category `options` array (static `EVENT_COLS` retained at module level for non-React code)

### 6. Orphan-event safety net

`handleSaveCategories` in App maps through all events before calling `setCategories`. Any event whose `category` is not in the incoming category list gets its category reset to `UNCATEGORISED.name`. `setSelectedCategories` is also synced to the new set.

### 7. Persistence

- `saveToStorageLS`, `saveToStorage`, `exportJSON` — all include `categories` in their payload.
- `OpenTimelineModal.handleOpen` — passes `full.categories || null` to `onLoad` (API path).
- `OpenTimelineModal.handleOpen` — passes `s.categories || null` to `onLoad` (localStorage path).
- `OpenTimelineModal.handleFile` — passes `d.categories || null` to `onLoad` (JSON import path).
- `loadTimeline` — accepts `newCategories` as last param; calls `setCategories` and syncs `setSelectedCategories`.
- `handleNew` — passes `DEFAULT_CATEGORIES` to reset categories on new timeline.

### 8. SQLite migration (`server.py`)

`migrate_db()` now runs:
```python
try:
    conn.execute("ALTER TABLE timelines ADD COLUMN categories TEXT DEFAULT '[]'")
except Exception:
    pass  # column already exists
```

`_build_timeline_payload` reads the column:
```python
"categories": _j(row["categories"] if "categories" in row.keys() else "[]", [])
```

`_save_timeline_from_payload` writes it in both UPDATE and INSERT SQL paths.

### 9. Help updated

- `HELP_SECTIONS` (English) — new `categories` section added before `claude-ai` covering: what categories are, opening the manager, create / rename / reorder / delete / restore defaults, and persistence.
- `HELP_SECTIONS_AF` (Afrikaans) — matching `kategorieë` section added in full Afrikaans.

### 10. CLAUDE.md updated

Build progress notes for Tier 1 Item 5 added to the "Completed this session" block.

---

## Files Modified

| File | Changes |
|---|---|
| `index.html` | ~200 lines added/changed across 20+ locations |
| `server.py` | `migrate_db()`, `_build_timeline_payload`, `_save_timeline_from_payload` |
| `CLAUDE.md` | Session notes added |

---

## Testing Checklist

- [ ] Open app — default 7 categories load correctly; all event bars coloured as before
- [ ] Tools → Manage Categories… — modal opens
- [ ] Create new category — appears in Add/Edit Event dropdowns immediately
- [ ] Rename + recolour — event bars update across all views
- [ ] Reorder — order reflected in dropdowns and FilterPanel legend
- [ ] Delete a category in use — warning shown; affected events reassigned to Uncategorised
- [ ] Delete unused category — removes silently
- [ ] Restore Defaults — confirms, resets to 7 built-ins
- [ ] Save → reload — custom categories survive round-trip (localStorage)
- [ ] Export JSON → Import JSON — categories included in exported file and restored on import
- [ ] Server running — categories column stored in SQLite; round-trip via API preserves categories
- [ ] "✏ Manage" in Add/Edit Event modals — opens Category Manager and returns to event modal
- [ ] FilterPanel ✏ and PeopleFilterModal ✏ — both open Category Manager
- [ ] Help modal → Categories section — content visible in English and Afrikaans

---

REED
