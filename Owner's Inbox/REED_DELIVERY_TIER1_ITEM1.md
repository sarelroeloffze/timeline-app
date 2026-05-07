# REED Delivery Note — Tier 1, Item 1
## SQLite Backend + File-System Image Storage

**Delivered:** 2026-03-28
**Files changed:** `server.py`, `index.html`, `requirements.txt`, `CLAUDE.md`

---

## What Was Built

### 1. SQLite Database (`timeline.db`)

The server now creates `timeline.db` on startup using Python's built-in `sqlite3` module (no extra dependency). Nine tables are created:

| Table | Purpose |
|---|---|
| `timelines` | Header row per timeline — name, timestamps, `bg_settings` (JSON), `eras` (JSON) |
| `people` | One row per person — dates, role, colour, `photo_path` (filesystem path) |
| `events` | One row per event — dates, category, description, `images` (JSON array of paths) |
| `person_events` | Many-to-many: which people appear on which events |
| `relationships` | Flow-view relationship links (parent / spouse / influenced) |
| `canvas_images` | Freely-positioned artwork on the canvas artboard |
| `civilizations` | Civilization/empire overlay data (stored as JSON blob per row) |
| `gen_people` | Genealogy view people |
| `gen_rels` | Genealogy view relationships |

WAL journal mode is enabled for better concurrent read performance. Foreign key cascade deletes are on — deleting a timeline removes all its children automatically.

### 2. REST Endpoints Added to `server.py`

| Method + Path | What it does |
|---|---|
| `GET /api/timelines` | List all timelines (name, counts, saved date) |
| `POST /api/timelines` | Create a new timeline |
| `GET /api/timelines/{id}` | Load full timeline (all children assembled) |
| `PUT /api/timelines/{id}` | Save / overwrite a timeline |
| `DELETE /api/timelines/{id}` | Delete timeline + all child rows |
| `POST /api/upload/image?category=people\|events\|canvas` | Upload an image file, save to `./images/<category>/`, return `{ path, url }` |
| `GET /images/{path}` | Serve saved images as static files |

The existing `/api/claude` streaming endpoint is completely unchanged.

### 3. File-System Image Storage

When the server is running:
- People profile photos → `./images/people/<uuid>.jpg`
- Event images → `./images/events/<uuid>.jpg`
- Canvas artboard overlays → `./images/canvas/<uuid>.jpg`

Images are served directly by FastAPI's `StaticFiles` at `/images/...`. The frontend uses `<img src="/images/people/abc123.jpg">` — no base64 anywhere.

The DB stores only the relative path (e.g. `people/abc123.jpg`). The frontend receives `/images/people/abc123.jpg` (with leading `/images/` prepended on read, stripped on write). This keeps the DB small and the paths portable.

### 4. API-Aware Frontend (Dual Mode)

The frontend detects the server on page load with a 2-second `fetch('/api/timelines')`. If it responds, all save/load/delete/image operations use the API. If not, everything falls back to localStorage exactly as before.

Components updated:
- `saveToStorage` — now `async`, uses `PUT /api/timelines/{id}` or `POST` for new timelines; falls back to localStorage
- `deleteFromStorage` — now `async`, uses `DELETE /api/timelines/{id}` if server connected
- `OpenTimelineModal` — fetches timeline list from API (counts only); clicking Open does `GET /api/timelines/{id}` to load the full payload
- `Avatar` component — after resizing to base64, uploads to `/api/upload/image?category=people` and stores the URL path instead of base64
- `EventPanel` image upload — same pattern for `category=events`
- `CanvasView` image drag/drop — same pattern for `category=canvas`

### 5. Connection Status Indicator

A small dot appears in the Toolbar (next to the timeline name):
- **Amber** — detecting server (first 1-2 seconds after page load)
- **Green** (with glow) — server connected, saving to SQLite
- **Grey** — local mode, saving to browser localStorage

Hover the dot to see a descriptive tooltip.

### 6. Migration Modal

On first server connection, if localStorage holds timeline data, the app shows a one-time modal:
- Lists all timelines found in localStorage with their counts
- "Migrate to Database" button POSTs each one to the API
- Shows per-timeline success/failure after migration
- Offers to clear the localStorage copy or keep it as a backup
- Migration is marked done (`localStorage.setItem('tl_migrated', '1')`) so it never prompts again

---

## How to Test

### Quickstart
```bash
cd timeline
pip install -r requirements.txt
export ANTHROPIC_API_KEY=sk-ant-...   # needed only for Claude chat
python server.py
# → open http://localhost:8765
```

The green dot appears in the toolbar within 2 seconds. All saves now go to `timeline.db`.

### Test checklist
1. **Green dot** — should appear within 2 seconds of loading `http://localhost:8765`
2. **Save a timeline** — File → Save (or Ctrl+S); check the dot does not turn red; `timeline.db` should grow
3. **Open a timeline** — File → Open; list should show timelines from the database
4. **Delete a timeline** — click ✕ in the Open dialog; confirm it disappears
5. **Upload a person photo** — click any person avatar (or in People & Filters); photo should appear; check `./images/people/` folder for the file
6. **Upload an event image** — click an event → "+ Add" image button; check `./images/events/` folder
7. **Canvas drag-drop image** — switch to Canvas view; drag an image file onto the canvas; check `./images/canvas/` folder
8. **Kill the server** — stop `python server.py`; reload the page; grey dot should appear; app should still load from sample data (or localStorage if you saved there previously)
9. **localhost fallback** — open `index.html` directly (file:// URL); grey dot; app works in localStorage mode
10. **Migration** — if you had timelines in localStorage before running the server, the migration modal should appear on first connection

### Verify the database
```bash
sqlite3 timeline.db
.tables
SELECT name, updated_at FROM timelines;
SELECT id, name FROM people WHERE timeline_id = '<id>';
.quit
```

---

## Known Edge Cases

| Situation | Behaviour |
|---|---|
| Server goes down mid-session | Next save attempt fails with "Save failed" in toolbar; data in memory is safe; use File → Export JSON as backup |
| Large base64 background photos | Still stored as JSON in `bg_settings` column (not filesystem) — intentional; background photos are rare and typically small |
| Civilization photos | The `handlePhoto` in `AddCivilizationModal` / `EditCivilizationModal` uses a pre-existing broken call signature (`resizeImage(ev.target.result, 400, 300, callback)` — `resizeImage` takes a `File`, not a data URL as first arg). This bug predates this session and is out of scope |
| Same timeline name different devices | The `_timelineIdMap` (localStorage) maps timeline names → server IDs on each device independently. If the same timeline name exists on two devices, they'll each get their own server ID. A proper multi-device flow needs a name→ID lookup from the server (Stage 4 concern) |
| Images on Windows Electron | The Electron build reads `index.html` directly, not via the server — so it will run in localStorage mode. To use the SQLite backend with Electron, the backend would need to be spawned as a subprocess (future work) |
| `timeline.db` location | Created in the same folder as `server.py`. If the working directory differs, the path resolves to wherever Python was launched from. Always `cd` to the `timeline/` folder before running `python server.py` |

---

## What Comes Next (Suggested Tier 1, Item 2)

- **Visual export** — PNG via `html2canvas`, PDF via `jsPDF`, PowerPoint via `PptxGenJS`
- **Settings modal** — currently routes to Background Settings; needs its own modal
- **Inline DataGrid editing** — currently only via modals; double-click to edit inline would be faster for power users
- **Multi-user / cloud** — upgrade from SQLite to PostgreSQL; add user accounts (Stage 4)
