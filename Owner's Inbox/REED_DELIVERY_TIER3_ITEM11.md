# REED Delivery Note — Tier 3 Item 11
## Location Field + Map View

**Delivered:** 28 March 2026
**Engineer:** REED (Senior Full-Stack Developer, LARRY team)
**Scope:** gap 1.2 + 3.1 from PAX's analysis

---

## Summary

Location field support has been added to all event entry points, and a full interactive Map view (9th view) has been built using Leaflet.js. All 22 sample events now carry real geographic coordinates so the map is immediately useful on first launch.

---

## What Was Built

### Part A — Location field on events

**Data model**
- `location: { name: '', lat: null, lon: null }` is now the canonical shape on every event.
- Safe defaults applied throughout: `csvRowToEvent`, `addEvent` in DataView, all sample events.

**Add Event modal**
- New `📍 Location` section (was partially wired in state but had no rendered UI — now complete).
- Text input for place name.
- 🔍 geocode button — calls Nominatim (`nominatim.openstreetmap.org`) with the place name; no API key required.
- On success: fills Lat + Lon inputs. On failure: "Coordinates not found — enter manually."
- Lat / Lon number inputs side-by-side.
- Helper note: "Coordinates are optional — used to place the event on the map view".
- Enter key in the name input triggers geocode.

**Edit Event modal**
- Same `📍 Location` section added; pre-fills from `event.location`.
- Geocode function added (was absent in EditEventModal).
- `location` included in `handleSave` output.

**Event Detail panel (EventPanel)**
- `📍 Location name` shown below the Description block.
- If lat + lon are both present, the name is a hyperlink opening OpenStreetMap centred on those coordinates in a new tab.

**DataGrid (Data view)**
- Location column was already present (`location_name` key in `EVENT_COLS`). No change needed.
- `updateEvent` handler for `location_name` key was already wired. No change needed.

**SQLite / server.py**
- `location_name TEXT DEFAULT ''`, `location_lat REAL DEFAULT NULL`, `location_lon REAL DEFAULT NULL` columns in `migrate_db()` (idempotent `ALTER TABLE`, already stubbed in server.py from a prior session).
- `_build_timeline_payload` reads these three columns and constructs the `location` object.
- `_save_timeline_from_payload` extracts `loc.name/lat/lon` and inserts them as individual columns.

---

### Part B — Map view (`MapView` component)

**Component**
- `const MapView = (...)` inserted immediately before `// ─── App Root`.
- Full-size Leaflet map (CDN was already loaded: `leaflet@1.9.4` CSS + JS in `<head>`).
- OpenStreetMap tile layer with attribution.
- One `L.circleMarker` per event that has `lat` + `lon`.
- Marker fill colour = category colour (via `catColor()` from `CatCtx`).
- Hover tooltip: event title + formatted date (`useFmt()`).
- Click on marker → calls `onSelectEvent(event)` → opens EventPanel.
- **Fit All**: zooms/pans to `L.latLngBounds` of all markers on mount and via toolbar button.
- **Empty state overlay**: shown when no visible events have coordinates; guides user to Add/Edit Event.
- Toolbar: ⇔ Horizontal and ⇕ Vertical back-navigation buttons; ⊞ Fit All; event count ("X events with location").

**Lifecycle safety**
- `useEffect` with `mapContainerRef` initialises the map after mount.
- Cleanup: `mapRef.current.remove()` on unmount — no "map already initialised" errors on remount or React StrictMode double-invocation.
- `map.invalidateSize()` called after 50 ms delay to handle flex-layout size resolution.
- Separate `useEffect` for markers: removes old markers, re-adds new ones when `mappableEvents` changes.

**Filter integration**
- `MapView` receives pre-filtered `displayEvents` (already through the main `filteredEvents` pipeline).
- Internally further filters for events with valid `lat`/`lon`.
- `hiddenEvents`, `hiddenCategories`, `hiddenPeople` props provided as belt-and-suspenders (no double-hide issue since App already filters `displayEvents`).

**Entry points**
- View menu: `🗺 Map` item added between `📽 Slides` and the date-format separator.
- `handleMenuAction`: `case 'viewMap': setOrientation('map')` wired.
- HorizontalTimeline toolbar: `🗺 Map` button added after `📽 Slides`.
- VerticalTimeline toolbar: `🗺 Map` button added after `📽 Slides`.

---

### Sample data

All 22 sample events updated with real-world coordinates:
- Bethlehem, Jordan River, Jerusalem, Paris, Stockholm, London, etc.
- Map shows immediately populated when sample data is active.

---

### Help documentation

- **HELP_SECTIONS (English)**: `🗺 Map view` bullet added to Views section; new "Location Field & Map View" section (`id:'map'`) added at end of array — covers location field usage, geocoding, EventPanel link, DataGrid column, and full Map view guide.
- **HELP_SECTIONS_AF (Afrikaans)**: "Liggingsveld & Kaart-aansig" section added at end of array.
- Getting Started section (AF) updated to list Map as one of the views.

---

## Files Changed

| File | Change |
|---|---|
| `index.html` | AddEventModal: Location UI rendered; EditEventModal: location state + geocode + UI + handleSave; EventPanel: location display; MapView component (new); View menu + action handler; Horizontal/Vertical toolbar buttons; HELP_SECTIONS + HELP_SECTIONS_AF updated |
| `server.py` | No change needed — location columns and payload helpers were already present |
| `CLAUDE.md` | Session notes added; build progress updated |
| `Owner's Inbox/REED_DELIVERY_TIER3_ITEM11.md` | This file |

---

## Testing Checklist

- [ ] Open app with sample data → switch to Map view → 22 markers visible across the world
- [ ] Click a marker → EventPanel opens with correct event
- [ ] Hover over marker → tooltip shows title + date
- [ ] Click ⊞ Fit All → map zooms to show all markers
- [ ] Add a new event with location "New York, USA" → click 🔍 → lat/lon fills automatically
- [ ] Edit an existing event → change location name → 🔍 → coords update
- [ ] Open EventPanel for event with coords → 📍 name appears as OSM link
- [ ] Open EventPanel for event without coords → 📍 name appears as plain text
- [ ] Open EventPanel for event with no location → no 📍 line shown
- [ ] Hide a category in FilterPanel → map markers for that category disappear
- [ ] Switch from Map to Horizontal and back → no "map already initialised" error in console

---

*REED — Tier 3 Item 11 — delivered*
