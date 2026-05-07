# REED Delivery — Tier 4, Item 21: i18n Framework + 4 Languages

**Date:** 2026-03-28
**Engineer:** REED (Senior Full-Stack Developer)
**Task:** i18n framework + 3+ languages (PAX gap score: 8.8)
**File modified:** `index.html` (14,845 lines)

---

## What was delivered

### Audit result
A prior session had already implemented the core i18n infrastructure:
- `I18nCtx`, `useT()`, `useLang()`, `makeT()` framework
- `TRANSLATIONS` object with 4 languages (en/af/es/fr) covering ~120 keys
- `MONTH_NAMES` for all 4 languages wired into `fmtDate()`
- Language state in App with `localStorage.tl_lang` persistence
- Language switcher in MenuBar (Tools menu, checkmarked) and Toolbar selector
- `LangCtx.Provider` and `I18nCtx.Provider` wrapping the render tree
- Help modal wired for Afrikaans (`HELP_SECTIONS_AF`)

### What was missing and is now done

**1. TRANSLATIONS object — ~30 new keys added to all 4 language blocks:**
- Source types: `Document`, `Interview` (joining Book/Article/Website/Archive/Other)
- Source confidence: `Primary source`, `Secondary source`, `Unverified`
- Status: `Status` (for FilterPanel section header)
- FilterPanel labels: `All on`, `All off`, `No match`, `Save Changes`
- Modal titles (display, not menu): `Add Person`, `Add Event`, `Edit Person`, `Edit Event`
- Form labels: `Name *`, `Role / description`, `Colour`, `Position / title`, `Reference (URL / citation)`, `Title *`, `Start date *`, `End date`, `Associate with people`, `Show on timeline`, `Parent event`, `None (top-level event)`, `No events match`
- Panel section headers: `Tags`, `Sources`, `Progress`, `Custom Fields`, `Recurrence`, `Part of`
- Messages: `No sources cited.`, `No people added yet.`, `+ Add`
- Geolocation messages: `Coordinates not found — enter manually.`, `Coordinates filled.`
- Hint text: `Press Enter or comma to add · Backspace to remove last`
- Extra menu items: `Version History…`, `Share…`, `Share… (server required)`, `Keyboard Shortcuts…`

**2. MenuBar — all item labels wrapped with `t()`:**
- Every sub-item in File, Edit, View, Navigation, Item, Sync, Tools, Help menus
- Menu name headers already used `t(name)`

**3. AddPersonModal — fully translated:**
- `const t = useT()` added
- Modal title, Name field label, Birth/Death labels, Role, Position, Reference, Colour, Tags, Cancel, Add Person

**4. AddEventModal — fully translated:**
- `const t = useT()` added
- Modal title, Title, Parent event selector text, Start/End date labels, Category, Description, Reference, Show on timeline, Associate with people, Location section header, geocode messages, Tags, Cancel, Add Event

**5. EditEventModal — title and buttons translated:**
- `const t = useT()` added
- Modal title `Edit Event`, Cancel, Save Changes

**6. EditPersonModal — title and buttons translated:**
- `const t = useT()` added
- Modal title `Edit Person`, Name * label, Cancel, Save Changes

**7. EventPanel — section headers and messages translated:**
- `const t = useT()` added
- Description, Reference link, Tags section, Custom Fields section, Sources section, People section, Images section header + `+ Add` button, Progress label, Recurrence label, Part of label
- Messages: `No sources cited.`, `No people added yet.`

**8. FilterPanel — fully translated:**
- `const t = useT()` added
- "Filters" header, People/Categories/Tags/Status/Events section headers with counts, all `All on`/`All off` buttons, `No match` message, `Search people...` placeholder
- Variable shadowing fixed: `allTags.map(t => ...)` renamed to `allTags.map(tag => ...)` and `toggleTag` parameter likewise

**9. Help modal language note for es/fr:**
- Info banner shown when lang is `es` or `fr`: "Help content available in English and Afrikaans."
- af already shows `HELP_SECTIONS_AF`; en shows `HELP_SECTIONS`

---

## Data integrity
All storage remains in English. Category names, status values, and source type/confidence keys are stored as English internally. Translation is purely display-side via `t()`. JSON export files are language-agnostic.

## t() call count
- Before this session: ~103 occurrences
- After this session: ~232 occurrences

## Translation quality
| Language | Translator | Notes |
|---|---|---|
| English | Native | All keys canonical |
| Afrikaans | Migrated from prior `AF` dict + new keys | Accurate South African Afrikaans |
| Spanish | New this session | Latin American Spanish |
| French | New this session | Standard French |

## Fallback behaviour
Any missing key falls back gracefully: `translations[lang]?.[key] ?? translations['en']?.[key] ?? key`. The app is fully usable in all 4 languages with no broken UI.

---

REED out.
