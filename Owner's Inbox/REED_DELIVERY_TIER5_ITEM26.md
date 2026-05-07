# REED Delivery — Tier 5 Item 26: Google Sheets Live Sync

**Delivered:** March 2026
**Item:** 26 — Google Sheets live sync
**Status:** ✅ Complete

---

## What was built

### server.py — `POST /api/sheets-fetch`

A new proxy endpoint that fetches a Google Sheets CSV on behalf of the browser (required to bypass Google's CORS headers).

- Accepts any Google Sheets URL: edit-mode (`/edit?...`), view-mode (`/view`), published CSV (`/pub?...output=csv`), or bare spreadsheet URL
- Extracts the sheet ID with regex; extracts the `gid` (tab number) if present (defaults to 0)
- Converts any non-publish URL to `/export?format=csv&gid={gid}`
- Fetches with `urllib.request` + browser-like User-Agent header; 15-second timeout
- 403 response: returns a clear "Sheet is not published publicly" error with step-by-step instructions
- Timeout: returns 504 with a friendly message
- No new Python dependencies — `urllib` only

### index.html — `GoogleSheetsModal`

A 3-step modal component inserted after `NarrativeModal`:

**Step 1 — Connect**
- URL input (full-width)
- Sheet type selector: Events / People
- Error display with 403-specific publish instructions
- Server-offline warning banner

**Step 2 — Map Columns**
- Preview table showing first 3 rows from the fetched sheet
- Column mapping dropdowns for each app field (auto-detected from header names using aliases)
  - Events: Title*, Start Date*, End Date, Description, Category, People, Location, Tags
  - People: Name*, Birth, Death, Role, Color
- Import strategy: Merge / Replace
- Auto-sync interval: Off / Every 5 min / Every 15 min / Every 30 min

**Step 3 — Done**
- Summary of rows added
- Auto-sync active message when interval is not "Off"

### App state additions

- `showSheets` — controls modal visibility
- `sheetsConfig` — persists `{ url, sheetType, columnMap, mergeStrategy, syncInterval, lastSync }` in React state
- `handleReplaceAll(newPeople, newEvents)` — replaces all people + events + syncs selectedPeople
- `doSheetsSync(config)` — async function that silently re-fetches + re-imports using stored config
- `useEffect` — sets up `setInterval` when `syncInterval !== 'off'`; cleaned up on config change

### Toolbar badge

When `sheetsConfig` is set:
- 📊 badge shows "Synced Xm ago" (live relative time)
- 🔄 button triggers immediate manual sync
- Clicking badge opens the GoogleSheetsModal again

### Menu entries

- `File → 📊 Google Sheets Sync…` (read-only users excluded)
- `Tools → 📊 Google Sheets Sync…`

### i18n

8 keys added to all 4 language blocks (en/af/es/fr):
`Google Sheets Sync`, `📊 Google Sheets Sync…`, `Fetch Sheet`, `Fetching sheet…`, `Map Columns`, `Merge`, `Replace`, `Auto-sync`

### Help modal

- English: "Google Sheets Sync" sub-section in Import & Export — explains the publish step, the 8-step workflow, the toolbar badge, and the server requirement
- Afrikaans: "Google Blaaie Sinkronisering" — full translation of the same content

---

## How to use

1. Open your Google Sheet
2. **File → Share → Publish to web** → choose the sheet tab → **Comma-separated values (.csv)** → **Publish**
3. In the Timeline app: **File → 📊 Google Sheets Sync…** or **Tools → 📊 Google Sheets Sync…**
4. Paste the URL (any Google Sheets URL format works — the app converts it)
5. Choose Events or People
6. Click **🔍 Fetch Sheet**
7. Map columns → choose Merge or Replace → set auto-sync interval
8. Click **✓ Import**

The 📊 badge in the toolbar shows connection status and provides a one-click 🔄 re-sync.

---

## Design notes

- **No OAuth required** — uses Google's public CSV export (same approach as TimelineJS)
- **Server proxy** — the server fetches the sheet, not the browser, because Google sends CORS headers that block direct browser requests
- **Duplicate detection** — Merge mode skips rows whose title/name already exists (case-insensitive); Replace mode clears the list first
- **Location field** — sheet "Location" column is stored as `{ name, lat: null, lon: null }`; geocoding can be done later via the Edit Event modal
- **Tags field** — comma-separated string in the sheet is split into a tags array
- **Auto-sync is in-memory only** — the sheetsConfig is not persisted to localStorage or the database; it resets on page reload (by design, to keep it simple)
