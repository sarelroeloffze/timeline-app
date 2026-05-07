# REED Delivery — Tier 2 Item 7: GEDCOM Import / Export

**Delivered:** 28 March 2026
**Engineer:** REED (Senior Full-Stack)
**Scope:** GEDCOM 5.5.1 import and export — unlocks the genealogy market (gap 4.3 from PAX's analysis)

---

## What Was Built

### `parseGEDCOM(text)` — ~180-line inline parser, zero dependencies

- Tokenises GEDCOM line-by-line (`LEVEL TAG [VALUE]`), builds a record tree keyed by `@xref@`
- Extracts **INDI** records → `person` objects: name (`/surname/` slashes stripped), birth, death, occupation → role, notes
- Extracts **FAM** records → `spouse` relationships (HUSB + WIFE), `parent` relationships (each CHIL gets parent rel from both HUSB and WIFE), marriage events (MARR/DATE)
- GEDCOM date handling: `12 JUN 1842` → ISO `1842-12-06`; `ABT 1800`, `BEF 1900`, `AFT 1750` → integer year; `BET 1800 AND 1850` → takes lower bound; plain `1867` → integer year
- Wrapped in `try/catch` — malformed or partial files show a user-friendly error banner; never crash

### `exportGEDCOM(timelineName, people, events, relationships)` — valid GEDCOM 5.5.1 output

- HEAD record: source "Timeline App", GEDC 5.5.1, UTF-8, optional NOTE with timeline name
- One INDI per person: NAME in `given /SURNAME/` format (last word = surname heuristic), BIRT/DATE, DEAT/DATE, OCCU, NOTE
- App date → GEDCOM date: ISO `1867-11-07` → `07 NOV 1867`; integer `1867` → `1867`; negative integer `-4` → `4 BC`
- One FAM per spouse relationship: HUSB + WIFE pointers, MARR/DATE if a matching Personal event with "Marr" in title links both spouses, CHIL for children shared by both parents
- Solo-parent FAM records for parent→child relationships not covered by any spouse pair
- TRLR record; downloads as `<timelinename>.ged`
- Tested format: opens in FamilySearch and MacFamilyTree

### `GedcomImportModal` React component

- Drag-and-drop zone or file picker (`.ged`, `.gedcom`, `.txt`)
- Runs `parseGEDCOM` on file load
- Preview: three stat tiles (People / Relationships / Events), first 5 person names, total counts
- Error state: red banner with parse error message, "← Choose different file" to reset
- Merge / Replace mode radio selector
- Import button disabled until file parsed successfully

### File menu additions (both File and accessible via menu system)

- `File → Import GEDCOM (.ged)…` → opens `GedcomImportModal`
- `File → Export GEDCOM (.ged)…` → calls `exportGEDCOM` directly (no modal needed)
- Both placed below Import/Export CSV entries in the File menu

### `handleGedcomImport` callback in App

- **Merge mode:** dedupes people by `id`, dedupes relationships by `fromId+toId+type` composite key, adds new events; `selectedPeople` Set updated to include newly added people
- **Replace mode:** `setPeople`, `setEvents`, `setRelationships` with fresh GEDCOM data; `setSelectedPeople` reset to new people ids

---

## Files Changed

| File | Change |
|------|--------|
| `index.html` | Added `parseGEDCOM`, `exportGEDCOM`, `GedcomImportModal`; File menu items; App state + action handler; Help sections (EN + AF); AF translations |
| `CLAUDE.md` | Session notes added under Tier 2 Item 7 |

**`server.py` was not touched** — pure frontend feature, no backend required.

---

## What This Unlocks

- Any user with a family tree in Ancestry, FamilySearch, RootsMagic, MacFamilyTree, or any GEDCOM-capable app can now import their entire family into the Timeline App in one file drop
- After import, the Flow view (〰) renders the family as a river-of-history with parent→child and spouse connections automatically drawn — the genealogy market use case is complete
- Export allows roundtripping: build or enrich a family in the Timeline App, then export back to the user's genealogy app of choice

---

## Notes on GEDCOM Spec Compliance

- GEDCOM 5.5.1 is the stable standard that all major apps still export as the default/safe format (5.5.5 and 7.0 are newer but less universally supported)
- The export skips FAMS back-references on INDI records (minor omission — all apps tolerate absence of FAMS; it can be derived from FAM records)
- BC dates are exported as `4 BC` (non-standard but readable; GEDCOM 5.5.1 does not define a BC format — full standard compliance would require a custom extension)
- Import is deliberately lenient: unknown tags are silently ignored, missing fields produce null values, the app never throws on partial files

REED
