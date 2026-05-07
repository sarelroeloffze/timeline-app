# REED Delivery — Tier 2 Item 10: Slide / Narrative View

**Delivered:** March 2026
**Developer:** REED (Senior Full-Stack, LARRY team)
**Status:** Complete — Tier 2 fully finished

---

## What Was Built

A full-screen **slide-per-event presentation view** for the Timeline App. Every event becomes one slide. The user navigates forward and backward through the timeline like a slideshow — unlocking journalistic, educational, and presentation use cases (Knight Lab TimelineJS was the benchmark).

---

## Architecture

**Component:** `SlideView` (~360 lines, inserted before `// ─── App Root` in `index.html`)
**Constants:** `SLIDE_DEFAULTS`, `SLIDE_CAT_ICONS`
**Orientation value:** `'slides'` — wired as the 8th view alongside horizontal, vertical, data, canvas, flow, thread, genealogy, gantt

---

## Features Delivered

### Slide Layout
- **Title slide (index 0):** timeline name as large headline (56px, bold); event count + year range subtitle using current date format context; background uses the timeline's `bgSettings` (solid/gradient/photo)
- **Event slides:** two-zone layout:
  - **Media zone (left 50%):** first event image full-bleed; if no image, large category icon/emoji centred on a coloured background. Person avatar stack (overlapping circles, up to 5 + overflow badge) shown bottom-left.
  - **Content zone (right):** category chip (coloured badge), date (large, colour-matched to category), title (36px headline), scrollable description, tag chips, people chips (avatar + name), source footnotes (title linked if URL, author/year)
- **Empty state:** if zero visible events after filtering, "No events to display" shown on title slide

### Navigation
- **Arrow buttons:** large (52px diameter) semi-transparent on slide edges; hover darkens; hidden when at first/last slide
- **Keyboard:** ← → advance slides, Space = next, Escape = exit to previous view
- **Touch swipe:** touchstart/touchend handlers; 50px threshold; left swipe = next, right swipe = previous; handlers added on mount, removed on unmount (no memory leaks)
- **Filmstrip:** collapsible thumbnail strip at bottom; title thumbnail + one per event (image or category icon); active slide has indigo border + glow; click any thumbnail to jump directly; scrollable horizontally
- **Slide counter:** "3 / 24" shown below slide area

### Style Options (⚙ Style panel)
- **Theme:** Dark / Light / Parchment (each with distinct background, card, text, border colours)
- **Font:** Sans / Serif / Mono
- **Show/hide toggles:** Avatars, Tags, Sources, Strip (filmstrip)
- **Transition:** Fade (180ms opacity crossfade) / None

### Event Ordering and Filtering
- Events sorted chronologically by `date_start`
- Respects full current filter state: `hiddenEvents`, `selectedPeople`, `selectedCategories`, `hiddenTags`, search query — only visible events appear as slides

### Controls Bar
- Timeline name (left, truncated if long)
- ⚙ Style button (toggles style panel)
- ✕ Exit button (returns to previous view; also triggered by Escape key)

### Entry Points
- **View menu → 📽 Slides** (keyboard shortcut hint: ⌘⇧L shown in menu)
- **📽 Slides button** in the Horizontal timeline toolbar
- **📽 Slides button** in the Vertical timeline toolbar

---

## Files Changed

| File | Change |
|---|---|
| `index.html` | `SLIDE_DEFAULTS` + `SLIDE_CAT_ICONS` constants added; `SlideView` component added (~360 lines); `viewSlides` case in `handleMenuAction`; `orientation === 'slides'` render branch in App JSX; `📽 Slides` entry in View menu (MENUS); `📽 Slides` button in HorizontalTimeline toolbar; `📽 Slides` button in VerticalTimeline toolbar; `slides` added to ExportModal viewLabels; `'📽 Slides':'📽 Skyfies'` in AF translations; `slides` section added to `HELP_SECTIONS` (EN); `slides` section added to `HELP_SECTIONS_AF` (AF) |
| `CLAUDE.md` | Status updated to Tier 2 complete; session notes for Item 10 added; views list updated |

---

## Implementation Notes

- The component uses `position: fixed; inset: 0; z-index: 8800` as a full-screen overlay — it does not replace any existing view and all other views remain untouched
- `prevOrient` ref captures the orientation at mount time so Escape / ✕ Exit returns to wherever the user came from
- Fade transition uses opacity 0→1 on the slide area div with a 180ms CSS transition; state update is deferred 180ms so the old slide fades out before the new one fades in
- `toSortYear()` is reused from the existing codebase for chronological sort
- `bgToCss()` is reused for the title slide background
- `tagColor()` is reused for tag chips
- `useFmt()` hook and `DateFmtCtx` context are respected — dates render in whatever format the user has selected

---

## Tier 2 — Complete

This item completes Tier 2. All 10 Tier 2 items have been delivered:

| Item | Title | Status |
|---|---|---|
| 6 | PowerPoint (.pptx) export | ✅ |
| 7 | GEDCOM import/export | ✅ |
| 8 | Recurring / repeating events | ✅ |
| 9 | Gantt view + event dependencies + progress/status | ✅ |
| 10 | Slide / Narrative view | ✅ |

Ready for Tier 3 planning.

---

*REED — LARRY team*
