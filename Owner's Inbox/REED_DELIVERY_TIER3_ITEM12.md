# REED Delivery Note — Tier 3, Item 12
## Uncertainty / Confidence Flags on Dates

**Delivered:** 2026-03-28
**Developer:** REED (Senior Full-Stack Developer, LARRY team)
**Gap reference:** PAX analysis gap 1.3

---

## What Was Built

Full end-to-end date certainty system for the Timeline app. Every date on every person and event can now be flagged as one of four certainty levels, with consistent visual treatment across all views.

---

## Certainty Levels

| Value | Display | Meaning |
|---|---|---|
| `exact` | No prefix (default) | Known date — no indicator shown |
| `circa` | `c. 1847` | Approximately this date |
| `estimated` | `est. 1847` | Rough estimate only |
| `unknown` | `Unknown` | Date not known at all |

---

## Data Model Changes

**Events** — two new fields:
- `dateStartCertainty` — certainty for `date_start`
- `dateEndCertainty` — certainty for `date_end`

**People** — two new fields:
- `birthCertainty` — certainty for `birth`
- `deathCertainty` — certainty for `death`

All default to `'exact'`. All existing data loads without any migration needed on the frontend (fallback `|| 'exact'` everywhere).

---

## UI Changes

### `DateCertaintyPicker` component
Four-pill selector (Exact | c. | est. | ?) placed directly below each date input field in:
- Add Person modal
- Edit Person modal
- Add Event modal
- Edit Event modal

Active pill highlighted in indigo. Each pill has a tooltip. Default is always `'exact'`.

### `fmtDate(d, fmt, certainty)` enhancement
Third parameter added with default `'exact'`. All existing two-argument call sites continue to work unchanged. New behaviour:
- `'unknown'` → returns `'Unknown'` immediately (ignores date value)
- `'circa'` → prepends `'c. '`
- `'estimated'` → prepends `'est. '`
- `'exact'` → no change (existing behaviour)

---

## Visual Indicators Per View

| View | Indicator |
|---|---|
| Horizontal (vis-timeline) | Dashed border on event bar; `?` superscript badge if unknown; certainty shown in hover tooltip |
| Vertical | Amber `~` badge before date label |
| Thread | Card border switches to dashed; `~` prefix on date text within card |
| Flow | Person ribbon gets dashed amber `strokeDasharray` outline when birth is non-exact |
| EventPanel (detail slide) | Certainty-prefixed date display; amber `~` indicator beside date |
| PeopleFilterModal | Birth/death dates include certainty prefix |

---

## GEDCOM Import Integration

New `gedDateCertaintyOf(dateString)` helper detects GEDCOM date qualifiers and maps them:

| GEDCOM qualifier | Mapped certainty |
|---|---|
| `ABT`, `CAL`, `CIRCA`, `C.` | `'circa'` |
| `BEF`, `AFT`, `BET`, `EST` | `'estimated'` |
| Plain date | `'exact'` |

Applied to `birthCertainty` / `deathCertainty` when parsing INDI records in `parseGEDCOM()`.

---

## SQLite Migration (`server.py`)

Four new idempotent `ALTER TABLE` statements added to `migrate_db()`:

```sql
ALTER TABLE events ADD COLUMN date_start_certainty TEXT DEFAULT 'exact';
ALTER TABLE events ADD COLUMN date_end_certainty TEXT DEFAULT 'exact';
ALTER TABLE people ADD COLUMN birth_certainty TEXT DEFAULT 'exact';
ALTER TABLE people ADD COLUMN death_certainty TEXT DEFAULT 'exact';
```

All wrapped in `try/except` — safe to run against an existing database.

Full round-trip in `_build_timeline_payload` (read with `'exact'` fallback) and `_save_timeline_from_payload` (write in both INSERT statements).

---

## Files Changed

| File | Changes |
|---|---|
| `index.html` | `fmtDate` enhanced; `DateCertaintyPicker` component added; certainty state in Add/Edit Person/Event modals; EventPanel date display; Horizontal/Vertical/Thread/Flow view visual indicators; PeopleFilterModal; `parseGEDCOM` certainty detection; `HELP_SECTIONS` + `HELP_SECTIONS_AF` new section |
| `server.py` | `migrate_db()` — 4 new columns; `_build_timeline_payload` — reads certainty fields; `_save_timeline_from_payload` — writes certainty fields |
| `CLAUDE.md` | Session notes added for Tier 3 Item 12 |

---

## Design Decisions

1. **Default 'exact' everywhere** — no visual regression for existing timelines. Adding certainty is opt-in.
2. **`fmtDate` third param defaults to 'exact'** — all existing call sites (`fmtDate(d, fmt)` with 2 args) remain correct with no changes needed.
3. **`useFmt()` hook unchanged** — returns `d => fmtDate(d, fmt)`. Existing `fmt(date)` calls still work. Only places where certainty must be shown explicitly pass it directly to `fmtDate`.
4. **`'range-approx'` value reserved** — the spec mentioned it; it maps to `'~date'` in `fmtDate` but the UI picker does not expose it (kept as an internal/future value since it overlaps with `'estimated'` visually).
5. **Flow view: ribbon = person lifespan** — certainty indicator is on the ribbon stroke (birth certainty), not on individual event dots, since the ribbon represents the person's birth-to-death span.
6. **No redesign of DateEntryWidget** — the DataGrid floating date picker was not modified; certainty is only editable through the Add/Edit modals as specified.

---

## Testing Checklist

- [ ] Add a person with `c.` birth — confirm `c. 1847` displays in sidebar / PeopleFilterModal / Flow view label
- [ ] Add an event with `est.` start date — confirm `est. 1847` in EventPanel, `~` badge in Vertical view, dashed border in Horizontal view
- [ ] Add an event with `?` (unknown) date — confirm `Unknown` displays instead of date value
- [ ] Import a GEDCOM with `ABT` dates — confirm `circa` certainty on imported people
- [ ] Save to SQLite, reload — confirm certainty fields survive round-trip
- [ ] Export JSON, re-import — confirm certainty fields survive round-trip
- [ ] Open existing timeline from localStorage — confirm no visual change (all default to `'exact'`)
- [ ] Thread view — dashed card borders on uncertain events
- [ ] Flow view — dashed ribbon outline on person with non-exact birth certainty
- [ ] Help modal → "Date Uncertainty" section visible in both EN and AF

---

*REED — LARRY team*
