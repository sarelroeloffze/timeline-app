# REED Delivery Note — Tier 5, Item 23
## Auto-extract events from pasted text / documents

**Date:** 2026-03-28
**Engineer:** REED (Senior Full-Stack Developer, LARRY team)
**Status:** Complete

---

## What was built

### Part A — `/api/extract` endpoint (server.py)

New `POST /api/extract` endpoint added after the `/api/claude` streaming endpoint (line ~1100).

- Accepts `{ text: string, timelineContext: { people, events } }`
- Enforces 50,000 character limit (truncates silently)
- Calls `claude-sonnet-4-6` with a structured single (non-streaming) call
- Uses `EXTRACT_SYSTEM` prompt that instructs Claude to return raw JSON (no markdown fences)
- Handles markdown-fenced JSON fallback with regex unwrapping
- Sanitises extracted categories against the valid set
- Returns `{ people: [...], events: [...] }`
- Proper error handling: 400 (empty text), 503 (no API key), 502 (Claude error / bad JSON), 500 (unexpected)

### Part B — `ExtractModal` component (index.html)

3-step modal. Entry points:
- **Tools → ✨ Extract from text…** (menu item added)
- **📄 Extract** button in the Claude panel header (opens extract modal, closes Claude panel)

**Step 1 — Input:**
- Large textarea, 50,000 char limit with live character count
- Drag-and-drop or file picker for .txt / .md files (FileReader)
- Server-required warning banner when backend is offline
- Error display with Retry button

**Step 2 — Review:**
- Two sections: People found (N) and Events found (N)
- Per-item checkboxes with Select all / Deselect all bulk controls
- "Already in timeline" amber badge on name-matched people (unchecked by default)
- "Possible duplicate" orange badge on similar events (unchecked by default)
- Category badge shown on each event row
- Description truncated at 120 characters

**Step 3 — Done:**
- Summary message: "Added N people and M events to the timeline."
- Localised variants for people-only, events-only, nothing-selected

### Part C — Duplicate detection

Two helper functions added above `ExtractModal`:

- `jaccardSim(a, b)` — Jaccard similarity on word sets (0–1)
- `isSimilarEvent(newEv, existingEv)` — title Jaccard > 70% AND within 2 years
- `isSimilarPerson(newPerson, existingPerson)` — exact name match (case-insensitive) OR last-name + first-initial match
- `yearOf(d)` — extracts integer year from any date value (int, ISO string)

### Part D — i18n (all 4 languages)

Translation keys added to all language sections in `TRANSLATIONS`:
- English (en) — 29 new keys
- Afrikaans (af) — 29 translated keys
- Spanish (es) — 29 translated keys
- French (fr) — 29 translated keys

Keys cover: modal title, step labels, buttons, badge labels, error messages, summary strings with `{{p}}` / `{{e}}` interpolation.

### Part E — Help modal updates

`HELP_SECTIONS` (English): New sub-section "Extract from Text ✨" added inside the Claude AI section — explains the 3-step workflow, tips on what text works best, and notes on duplicate detection.

`HELP_SECTIONS_AF` (Afrikaans): Equivalent "Onttrek uit Teks ✨" section added in the Claude KI section.

---

## Files changed

| File | What changed |
|---|---|
| `server.py` | Added `EXTRACT_SYSTEM` prompt constant and `POST /api/extract` endpoint (~90 lines) |
| `index.html` | Added translation keys (4 langs), `ExtractModal` component, `showExtract` state, `extractText` menu case, `handleAddPeopleBulk` + `handleAddEventsBulk` handlers, `onOpenExtract` prop on `ClaudePanel`, `✨ Extract from text…` Tools menu item, `ExtractModal` render, HELP_SECTIONS + HELP_SECTIONS_AF updates |
| `CLAUDE.md` | Session notes added |

---

## Architecture notes

- `/api/extract` uses a single blocking Claude call (not streaming) — appropriate for structured JSON output
- The existing `/api/claude` streaming endpoint is untouched
- `handleAddPeopleBulk` + `handleAddEventsBulk` batch-insert to React state in one update, avoiding N re-renders
- People extracted from events are cross-linked by name → id using a local `nameToId` map built during apply
- The modal is self-contained with no new global state except the `showExtract` boolean

---

## Test scenarios to verify

1. Paste a Wikipedia article about WWII → should extract Churchill, Roosevelt, key battles
2. Paste text with no dates → should show the "no datable events" error
3. Run on text that overlaps with existing timeline → duplicates flagged, unchecked
4. Open via Tools menu AND via Claude panel 📄 Extract button
5. Drag-drop a .txt file → text populates textarea
6. Run with server offline → "Server required" warning, Extract button disabled
7. Select subset of items → only selected items added; summary message correct
8. Switch language to Afrikaans → all Extract modal strings translated
