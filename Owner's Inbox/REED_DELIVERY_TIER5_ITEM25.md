# REED Delivery — Tier 5 Item 25: Narrative Generation Export

**Delivered:** March 2026
**Status:** ✅ Complete

---

## What was built

Claude writes a full prose narrative of the current timeline on demand. The user triggers it, configures options, and receives a formatted multi-section document they can copy, download as .txt, or export as PDF.

---

## Files changed

| File | Change |
|---|---|
| `server.py` | `NARRATIVE_SYSTEM` constant + `POST /api/narrative` endpoint |
| `index.html` | `NarrativeModal` component; App state + menu wiring; i18n keys; Help modal |
| `CLAUDE.md` | Item 25 completion block added; status updated |
| `Owner's Inbox/REED_DELIVERY_TIER5_ITEM25.md` | This file |

---

## Feature detail

### server.py — `POST /api/narrative`
- Request: `{ timelineContext: { timelineName, people, events, relationships }, options: { tone, length, focus, language } }`
- Builds a compact context string (people with birth/death/role, events sorted chronologically with date/category/location/people, relationships), capped at 30,000 chars
- Calls `claude-sonnet-4-6` (non-streaming, max_tokens=4096) with `NARRATIVE_SYSTEM` prompt
- Returns `{ narrative: "...", title: "The Story of {name}" }`
- Same error-handling pattern as `/api/extract`

### index.html — NarrativeModal
- **Entry points:** Tools → 📖 Narrative Export… and File → 📖 Narrative Export… (alongside PNG/PDF/PPTX)
- **Step 1 (Options):**
  - Tone: Narrative / Academic / Journalistic / Simple (pill buttons, default: Narrative)
  - Length: Brief (~300 words) / Standard (~800 words) / Detailed (~1500 words)
  - Focus: All / People / Events
  - Language: English / Afrikaans / Español / Français
  - Event + people count shown in header subtitle
  - Loading spinner during generation
- **Step 2 (Result):**
  - Narrative rendered as markdown-lite (## headings → h3, paragraphs → p)
  - 📋 Copy button (clipboard, shows "✓ Copied!" flash)
  - ⬇ Download .txt (Blob download)
  - ⬇ Download PDF (jsPDF — title page header, section headings, body paragraphs, auto page breaks)
  - ← Regenerate button returns to options
- Offline guard: shows warning banner when server not running

### i18n
All 4 languages (en/af/es/fr) have keys for: Narrative Export, Writing narrative…, Generate Narrative, Tone, Academic, Narrative, Journalistic, Simple, Length, Brief, Detailed.

### Help modal
- English (claude-ai section): "Narrative Export 📖" sub-section added after Wikipedia Import
- Afrikaans (claude-ai section): "Verhaal Uitvoer 📖" sub-section added

---

## Usage

1. Load a timeline with events and people
2. Tools → 📖 Narrative Export… (or File → 📖 Narrative Export…)
3. Choose tone, length, focus, language
4. Click ✍ Generate Narrative — wait ~5–15 seconds
5. Read, copy, or download the result
