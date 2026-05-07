# REED — Tier 4 Item 20 Delivery Note
## WCAG 2.1 AA Accessibility Pass

**Date:** March 2026
**Engineer:** REED (Senior Full-Stack Developer, LARRY team)
**Gap reference:** PAX analysis item 8.7

---

## Summary

Completed a systematic WCAG 2.1 Level AA accessibility pass across `index.html`. The audit confirmed that the majority of the compliance work was already in place from prior sessions (focus traps, landmark roles, modal ARIA, category contrast warnings, skip link, screen-reader-only utilities, filter panel ARIA, event panel ARIA). This session closed the remaining gaps.

---

## What Was Already Compliant (Prior Sessions)

- `.sr-only` and `.skip-link` CSS utilities
- `*:focus-visible` global focus ring (2px #60a5fa, `!important` overrides inline `outline:none`)
- `<a href="#main-content" class="skip-link">` as first body element
- `<main id="main-content" role="main">` on the timeline content area
- `<header role="banner">` on MenuBar
- `<aside aria-label="…">` on EventPanel, FilterPanel, and Sidebar
- `useFocusTrap` hook defined and active in `Modal` wrapper
- `Modal` wrapper: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, Escape key, return-focus on close
- All 5 priority modals (AddPerson, AddEvent, EditPerson, EditEvent, ExportModal) use `Modal` wrapper
- `contrastRatio()` helper + "⚠ Low contrast" warning in CategoryManagerModal when colour+white text < 4.5:1
- `aria-label`, `aria-pressed` on Sidebar person/category toggles, FilterPanel sections
- `aria-expanded` + `aria-controls` on filter sections
- `role="menu"` / `aria-expanded` on MenuBar items
- `role="img"` + `aria-label` on Flow SVG and Thread timeline container
- `role="img"` + `aria-label` on Gantt SVG
- Collaboration toast: `role="status"`, `aria-live="polite"`, `aria-atomic="true"`
- Form inputs: `<label htmlFor>` + matching `id` throughout AddPerson, AddEvent, EditPerson modals
- `aria-label` on all icon-only buttons in EventPanel, CategoryManager

---

## Changes Made This Session

### 1. `saveMsg` Live Region (WCAG 4.1.3)
- **File:** `index.html` — Toolbar component
- The "Saved ✓" / "Saving…" / "Save failed" span was previously conditional (`{saveMsg && <span>}`), meaning screen readers would not announce it.
- Changed to a permanent `<span role="status" aria-live="polite" aria-atomic="true">` that always exists in the DOM; content is empty string when no message. This is the correct pattern for ARIA live regions (element must be in DOM before content changes).

### 2. Server Connection Dot (WCAG 1.3.3, 1.4.1)
- Added `role="img"` and `aria-label={dotTitle}` alongside existing `title` attribute.
- Colour-only status indicator now has a text equivalent for screen readers.

### 3. `Btn` Component — Spread Props
- Added `...rest` spread to `Btn` so callers can pass `aria-label`, `title`, `aria-pressed`, `aria-expanded`, etc. through to the underlying `<button>`.
- This was needed to label the zoom buttons without duplicating markup.

### 4. Zoom Buttons — `aria-label` + `title` (WCAG 1.3.1, 4.1.2)
All `+` and `−` zoom buttons across 5 views were silent for screen readers:
- **Horizontal toolbar:** `Zoom in` / `Zoom out`
- **Vertical toolbar:** `Zoom in` / `Zoom out` + `aria-live` on the `%` readout
- **Canvas toolbar:** `Zoom timeline in` / `Zoom timeline out` / `Zoom canvas in` / `Zoom canvas out` / `Reset canvas zoom` (↺)
- **Gantt toolbar:** `Zoom in` / `Zoom out`
- **Lightbox zoom bar:** `Zoom in` / `Zoom out` + `aria-live` on the `%` readout

### 5. Drag-Lock Toggle — `aria-pressed` (WCAG 4.1.2)
- Added `aria-pressed={dragLocked}` to the 🔒/🔓 button in the Horizontal toolbar.
- Added descriptive `aria-label` that explains the current state and what clicking will do.

### 6. Drag-Reschedule Feedback — Live Region (WCAG 4.1.3)
- The `dragMoveMsg` confirmation ("Moved to…" / "Dependency conflict") was conditional and silent.
- Replaced with a permanent `role="status"` + `aria-live="polite"` span. Move confirmations and dependency warnings are now announced automatically.

### 7. Icon-Only ✕ / × Buttons — `aria-label` (WCAG 1.3.1, 4.1.2)
Added `aria-label` + `title` to buttons that had only a symbol and no text:
- Era delete button ("Delete section")
- Timeline delete in Open modal ("Delete timeline: {name}")
- Remove image button in EventPanel ("Remove image")
- Remove photo button in Civilization form ("Remove photo")
- Clear parent event button × 2 in AddEventModal and EditEventModal ("Clear parent event")
- Remove dependency button in EditEventModal ("Remove dependency")
- Remove relationship button in EditPersonModal ("Remove relationship")
- VersionHistoryModal header close button ("Close")
- SlidePanel/drawing panel close button ("Close")
- Claude panel close button ("Close")

### 8. HELP_SECTIONS_AF — Accessibility Section Parity
The Afrikaans accessibility help section was missing the keyboard shortcuts reference table and the screen-reader bullet list that the English section had. Added:
- Screen readers section (aria-label, aria-pressed, landmarks, dialog, live regions)
- Updated colour/contrast section (added text-label note, focus ring specification)
- Full keyboard shortcuts reference table (matching English)

### 9. HELP_SECTIONS (EN) — saveMsg Live Region Bullet
Added bullet noting the save-status live region to the Screen Readers list.

---

## What Was Explicitly Not Changed

- `server.py` — not touched
- Visual design — no colour, layout, or spacing changes beyond focus rings
- `role="button"` not added to any `<button>` elements
- `useFocusTrap` not applied beyond the existing `Modal` wrapper (which already covers all 5 priority modals)

---

## Remaining Accessibility Notes (Future Sessions)

- The `outline:'none'` in inline styles on inputs is overridden by `*:focus-visible { outline: 2px solid #60a5fa !important }` in the global CSS — no action needed
- SVG decorative elements inside the main SVG views already have `aria-hidden="true"` where appropriate
- The vis-timeline library renders its own DOM — ARIA annotation within vis-timeline items is limited to the `content` HTML string (some items already include emoji indicators)
- Map view (Leaflet) has its own ARIA layer managed by the Leaflet library
