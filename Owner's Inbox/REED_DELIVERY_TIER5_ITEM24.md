# REED Delivery — Tier 5 Item 24: Wikipedia Import

**Delivered:** March 2026
**Status:** Complete

---

## What was built

Wikipedia Import lets you pull people and events directly from any Wikipedia article into your timeline with one click. You supply a URL or a plain topic name, select a language, and Claude does the rest.

---

## How to use it

1. Open **Tools → 🌐 Wikipedia Import…** (or click the **🌐 Wiki** button in the Claude panel header).
2. Paste a Wikipedia URL (e.g. `https://en.wikipedia.org/wiki/Battle_of_Waterloo`) **or** type a plain topic name (e.g. `Napoleon Bonaparte`).
3. Select your Wikipedia language from the dropdown (13 supported: English, Afrikaans, Español, Français, Deutsch, Nederlands, Português, Italiano, Polski, Русский, العربية, 中文, 日本語).
4. Click **Fetch & Extract** (or press Enter). The server fetches the article from Wikipedia and passes it to Claude for analysis.
5. In the **Review** step, check or uncheck individual people and events. Items already in your timeline are auto-unchecked and marked with an amber "Already in timeline" badge. Possible duplicates carry an orange badge.
6. Click **Add selected to timeline**. A summary tells you how many people and events were added.

---

## Technical details

### Server (`server.py`)

| Component | Detail |
|---|---|
| Endpoint | `POST /api/wiki-import` |
| Input | `{ url, topic, language, timelineContext }` |
| Article resolution — URL | Regex extracts the `/wiki/TITLE` segment, URL-decodes it |
| Article resolution — topic | Wikipedia Search API (`action=query&list=search`) picks the top result |
| Article fetch | Wikipedia Extracts API (`action=query&prop=extracts&redirects=1`) — full article text |
| HTML stripping | Regex `<[^>]+>` removes all markup |
| Text limit | 50,000 characters (shared constant `MAX_EXTRACT_CHARS`) |
| Canonical URL | Second API call (`prop=info&inprop=url`) resolves redirects and returns the true article URL |
| Claude model | `claude-sonnet-4-6`, `max_tokens=4096` |
| Prompt | Reuses the existing `EXTRACT_SYSTEM` prompt (same schema as Item 23 Extract from Text) |
| Context sent | Existing people (up to 100) and events (up to 200) so Claude can flag duplicates |

### Frontend (`index.html`)

| Component | Detail |
|---|---|
| Component | `WikiImportModal` — 3-step wizard (Input → Review → Done) |
| Entry points | Tools menu → `🌐 Wikipedia Import…`; Claude panel header → `🌐 Wiki` button |
| Duplicate detection | `isSimilarPerson` + `isSimilarEvent` (Jaccard similarity, shared with Item 23) |
| Auto-uncheck | Duplicates auto-unchecked; new items auto-checked |
| Attribution | Step 2 shows article title as a clickable link back to Wikipedia |
| Offline guard | If server not running, shows inline warning and disables Fetch button |
| Language | 13 languages in dropdown; defaults to English |
| People added | `id`, `name`, `birth`, `death`, `role`, colour `#818cf8`, initials, `showOnTimeline: true` |
| Events added | `id`, `title`, `date_start`, `date_end`, `category`, `description`, `location`, `tags`, `person_ids` (linked to newly added people) |

---

## i18n coverage

All keys translated in all 4 languages (en / af / es / fr):

- `🌐 Wikipedia Import…`
- `Wikipedia Import`
- `Wikipedia URL or topic`
- `Fetch & Extract`
- `Fetching article…`
- `Fetched from Wikipedia`
- `Enter a Wikipedia URL or topic name to import people and events.`
- `Step 1 of 3: Input` / `Step 2 of 3: Review` / `Step 3 of 3: Done`
- `People found` / `Events found`
- `Add selected to timeline`
- `Already in timeline` / `Possible duplicate`
- `Select all` / `Deselect all`
- `Nothing was selected.`

---

## Help modal

- **English** (`HELP_SECTIONS`): "Wikipedia Import 🌐" sub-section added under the Claude AI section — describes URL and topic entry, language selection, Claude analysis, review step, duplicate detection, and the Add to Timeline button.
- **Afrikaans** (`HELP_SECTIONS_AF`): "Wikipedia Invoer 🌐" — full Afrikaans equivalent.

---

## Files changed

| File | Change |
|---|---|
| `server.py` | `POST /api/wiki-import` endpoint (~180 lines); article resolution, fetch, HTML-strip, Claude call |
| `index.html` | `WikiImportModal` component (~400 lines); i18n keys (×4 languages); Help modal sections (EN + AF); entry points in ClaudePanel + MenuBar + App state |
| `CLAUDE.md` | Item 24 completion entry added; "Still remaining" updated |
| `Owner's Inbox/REED_DELIVERY_TIER5_ITEM24.md` | This file |
