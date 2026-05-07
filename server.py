"""
Timeline App — FastAPI backend
Serves index.html, proxies streaming requests to the Anthropic Claude API,
and provides SQLite-backed REST endpoints for timeline persistence.

Usage:
  export ANTHROPIC_API_KEY=sk-ant-...
  pip install anthropic fastapi uvicorn python-multipart
  python server.py

Then open http://localhost:8765
"""

import os
import re
import json
import sqlite3
import uuid
import shutil
import secrets
import hashlib
import hmac
import threading
import urllib.request
import urllib.parse
from datetime import datetime, timezone, timedelta
from pathlib import Path
from contextlib import contextmanager

from fastapi import FastAPI, Request, HTTPException, UploadFile, File, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.responses import HTMLResponse, StreamingResponse, JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import anthropic

# OpenAI integration
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

# ─── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR    = Path(__file__).parent
DB_PATH     = BASE_DIR / "timeline.db"
IMAGES_DIR  = BASE_DIR / "images"
PEOPLE_DIR  = IMAGES_DIR / "people"
EVENTS_DIR  = IMAGES_DIR / "events"
CANVAS_DIR  = IMAGES_DIR / "canvas"

# Ensure image directories exist
for d in (PEOPLE_DIR, EVENTS_DIR, CANVAS_DIR):
    d.mkdir(parents=True, exist_ok=True)

# ─── Database ─────────────────────────────────────────────────────────────────
def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


@contextmanager
def db_conn():
    conn = get_db()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def migrate_db():
    """Run idempotent schema migrations after init_db."""
    with db_conn() as conn:
        # Add sources column to events (TEXT JSON array) — ignore if already present
        try:
            conn.execute("ALTER TABLE events ADD COLUMN sources TEXT DEFAULT '[]'")
        except Exception:
            pass  # column already exists

        # Tags + custom fields — Tier 1 Item 4
        try:
            conn.execute("ALTER TABLE events ADD COLUMN tags TEXT DEFAULT '[]'")
        except Exception:
            pass
        try:
            conn.execute("ALTER TABLE events ADD COLUMN custom_fields TEXT DEFAULT '[]'")
        except Exception:
            pass
        try:
            conn.execute("ALTER TABLE people ADD COLUMN tags TEXT DEFAULT '[]'")
        except Exception:
            pass
        try:
            conn.execute("ALTER TABLE timelines ADD COLUMN custom_field_defs TEXT DEFAULT '[]'")
        except Exception:
            pass

        # Categories — Tier 1 Item 5
        try:
            conn.execute("ALTER TABLE timelines ADD COLUMN categories TEXT DEFAULT '[]'")
        except Exception:
            pass  # column already exists

        # Recurrence — Tier 2 Item 8
        try:
            conn.execute("ALTER TABLE events ADD COLUMN recurrence TEXT DEFAULT NULL")
        except Exception:
            pass  # column already exists

        # Progress + Status — Tier 2 Item 9
        try:
            conn.execute("ALTER TABLE events ADD COLUMN progress INTEGER DEFAULT 0")
        except Exception:
            pass  # column already exists
        try:
            conn.execute("ALTER TABLE events ADD COLUMN status TEXT DEFAULT 'planned'")
        except Exception:
            pass  # column already exists

        # Location — Tier 3 Item 11
        try:
            conn.execute("ALTER TABLE events ADD COLUMN location_name TEXT DEFAULT ''")
        except Exception:
            pass  # column already exists
        try:
            conn.execute("ALTER TABLE events ADD COLUMN location_lat REAL DEFAULT NULL")
        except Exception:
            pass  # column already exists
        try:
            conn.execute("ALTER TABLE events ADD COLUMN location_lon REAL DEFAULT NULL")
        except Exception:
            pass  # column already exists

        # Date certainty — Tier 3 Item 12
        try:
            conn.execute("ALTER TABLE events ADD COLUMN date_start_certainty TEXT DEFAULT 'exact'")
        except Exception:
            pass  # column already exists
        try:
            conn.execute("ALTER TABLE events ADD COLUMN date_end_certainty TEXT DEFAULT 'exact'")
        except Exception:
            pass  # column already exists
        try:
            conn.execute("ALTER TABLE people ADD COLUMN birth_certainty TEXT DEFAULT 'exact'")
        except Exception:
            pass  # column already exists
        try:
            conn.execute("ALTER TABLE people ADD COLUMN death_certainty TEXT DEFAULT 'exact'")
        except Exception:
            pass  # column already exists

        # Nested / hierarchical events — Tier 3 Item 13
        try:
            conn.execute("ALTER TABLE events ADD COLUMN parent_event_id TEXT DEFAULT NULL")
        except Exception:
            pass  # column already exists

        # Places / Arcs / Markers — Left Sidebar + Calendar Markers features
        try:
            conn.execute("ALTER TABLE events ADD COLUMN place_id TEXT DEFAULT NULL")
        except Exception:
            pass  # column already exists
        try:
            conn.execute("ALTER TABLE timelines ADD COLUMN markers TEXT DEFAULT '[]'")
        except Exception:
            pass  # column already exists

        # Share links — Tier 4 Item 17
        conn.execute("""
            CREATE TABLE IF NOT EXISTS share_links (
                token         TEXT PRIMARY KEY,
                timeline_id   TEXT NOT NULL,
                role          TEXT NOT NULL DEFAULT 'viewer',
                created_at    TEXT DEFAULT (datetime('now')),
                expires_at    TEXT DEFAULT NULL,
                password_hash TEXT DEFAULT NULL,
                FOREIGN KEY(timeline_id) REFERENCES timelines(id) ON DELETE CASCADE
            )
        """)

        # Version history — Tier 4 Item 18
        conn.execute("""
            CREATE TABLE IF NOT EXISTS timeline_versions (
                id             TEXT PRIMARY KEY,
                timeline_id    TEXT NOT NULL,
                version_number INTEGER NOT NULL,
                label          TEXT DEFAULT NULL,
                snapshot       TEXT NOT NULL,
                created_at     TEXT DEFAULT (datetime('now')),
                auto           INTEGER DEFAULT 1,
                FOREIGN KEY(timeline_id) REFERENCES timelines(id) ON DELETE CASCADE
            )
        """)

        # API keys — Tier 5 Item 28
        conn.execute("""
            CREATE TABLE IF NOT EXISTS api_keys (
                id           TEXT PRIMARY KEY,
                name         TEXT NOT NULL,
                key_prefix   TEXT NOT NULL,
                key_hash     TEXT NOT NULL UNIQUE,
                created_at   TEXT DEFAULT (datetime('now')),
                last_used_at TEXT DEFAULT NULL
            )
        """)

        # Webhooks — Tier 5 Item 28
        conn.execute("""
            CREATE TABLE IF NOT EXISTS webhooks (
                id          TEXT PRIMARY KEY,
                timeline_id TEXT DEFAULT NULL,
                url         TEXT NOT NULL,
                events      TEXT DEFAULT '["save"]',
                secret      TEXT DEFAULT NULL,
                created_at  TEXT DEFAULT (datetime('now'))
            )
        """)


def init_db():
    """Create tables if they don't exist."""
    with db_conn() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS timelines (
                id          TEXT PRIMARY KEY,
                name        TEXT NOT NULL,
                created_at  TEXT NOT NULL,
                updated_at  TEXT NOT NULL,
                bg_settings TEXT,
                eras        TEXT
            );

            CREATE TABLE IF NOT EXISTS people (
                id           TEXT NOT NULL,
                timeline_id  TEXT NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
                name         TEXT NOT NULL DEFAULT '',
                birth        TEXT,
                death        TEXT,
                role         TEXT DEFAULT '',
                color        TEXT DEFAULT '#818cf8',
                photo_path   TEXT,
                notes        TEXT DEFAULT '',
                position     TEXT DEFAULT '',
                reference    TEXT DEFAULT '',
                show_on_timeline INTEGER DEFAULT 1,
                PRIMARY KEY (id, timeline_id)
            );

            CREATE TABLE IF NOT EXISTS events (
                id           TEXT NOT NULL,
                timeline_id  TEXT NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
                title        TEXT NOT NULL DEFAULT '',
                date_start   TEXT,
                date_end     TEXT,
                category     TEXT DEFAULT 'Historical',
                description  TEXT DEFAULT '',
                images       TEXT DEFAULT '[]',
                hidden       INTEGER DEFAULT 0,
                reference    TEXT DEFAULT '',
                show_on_timeline INTEGER DEFAULT 1,
                PRIMARY KEY (id, timeline_id)
            );

            CREATE TABLE IF NOT EXISTS person_events (
                person_id   TEXT NOT NULL,
                event_id    TEXT NOT NULL,
                timeline_id TEXT NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
                PRIMARY KEY (person_id, event_id, timeline_id)
            );

            CREATE TABLE IF NOT EXISTS relationships (
                id          TEXT NOT NULL,
                timeline_id TEXT NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
                from_id     TEXT NOT NULL,
                to_id       TEXT NOT NULL,
                type        TEXT NOT NULL DEFAULT 'parent',
                PRIMARY KEY (id, timeline_id)
            );

            CREATE TABLE IF NOT EXISTS canvas_images (
                id          TEXT NOT NULL,
                timeline_id TEXT NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
                src_path    TEXT NOT NULL,
                x           REAL DEFAULT 0,
                y           REAL DEFAULT 0,
                width       REAL DEFAULT 200,
                height      REAL DEFAULT 150,
                z_index     INTEGER DEFAULT 1,
                PRIMARY KEY (id, timeline_id)
            );

            CREATE TABLE IF NOT EXISTS civilizations (
                id          TEXT NOT NULL,
                timeline_id TEXT NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
                data        TEXT NOT NULL DEFAULT '{}',
                PRIMARY KEY (id, timeline_id)
            );

            CREATE TABLE IF NOT EXISTS gen_people (
                id          TEXT NOT NULL,
                timeline_id TEXT NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
                data        TEXT NOT NULL DEFAULT '{}',
                PRIMARY KEY (id, timeline_id)
            );

            CREATE TABLE IF NOT EXISTS gen_rels (
                id          TEXT NOT NULL,
                timeline_id TEXT NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
                data        TEXT NOT NULL DEFAULT '{}',
                PRIMARY KEY (id, timeline_id)
            );

            CREATE TABLE IF NOT EXISTS dependencies (
                id            TEXT NOT NULL,
                timeline_id   TEXT NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
                from_event_id TEXT NOT NULL,
                to_event_id   TEXT NOT NULL,
                type          TEXT DEFAULT 'fs',
                PRIMARY KEY (id, timeline_id)
            );

            CREATE TABLE IF NOT EXISTS places (
                id          TEXT NOT NULL,
                timeline_id TEXT NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
                name        TEXT DEFAULT '',
                lat         REAL DEFAULT NULL,
                lon         REAL DEFAULT NULL,
                description TEXT DEFAULT '',
                color       TEXT DEFAULT '#6366f1',
                PRIMARY KEY (id)
            );

            CREATE TABLE IF NOT EXISTS arcs (
                id          TEXT NOT NULL,
                timeline_id TEXT NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
                name        TEXT DEFAULT '',
                color       TEXT DEFAULT '#6366f1',
                description TEXT DEFAULT '',
                event_ids   TEXT DEFAULT '[]',
                PRIMARY KEY (id)
            );
        """)


# ─── Serialisation helpers ────────────────────────────────────────────────────
def _j(v, default=None):
    """Safely parse a JSON string from DB, returning default on failure."""
    if v is None:
        return default
    if isinstance(v, (dict, list)):
        return v
    try:
        return json.loads(v)
    except Exception:
        return default


def _date_val(s):
    """
    Convert a date value from DB text back to its original Python type.
    Integers are stored as strings like '1867' or '-4'; ISO dates remain strings.
    """
    if s is None:
        return None
    try:
        return int(s)
    except (ValueError, TypeError):
        return s


def _date_str(v):
    """Convert a date value (int or ISO string or None) to a storable string."""
    if v is None:
        return None
    return str(v)


def _now():
    return datetime.now(timezone.utc).isoformat()


def _build_timeline_payload(conn, timeline_id: str) -> dict:
    """Assemble the full timeline dict that the frontend expects."""
    row = conn.execute("SELECT * FROM timelines WHERE id=?", (timeline_id,)).fetchone()
    if row is None:
        return None

    # People
    people_rows = conn.execute(
        "SELECT * FROM people WHERE timeline_id=?", (timeline_id,)
    ).fetchall()
    # Build person_ids map from person_events
    pe_rows = conn.execute(
        "SELECT event_id, person_id FROM person_events WHERE timeline_id=?", (timeline_id,)
    ).fetchall()
    # Index: event_id -> [person_ids]
    pe_map = {}
    for pe in pe_rows:
        pe_map.setdefault(str(pe["event_id"]), []).append(str(pe["person_id"]))

    people = []
    for p in people_rows:
        name = p["name"] or ""
        initials = "".join(w[0] for w in name.split() if w)[:2].upper() or "?"
        photo_val = None
        if p["photo_path"]:
            photo_val = f"/images/{p['photo_path']}"
        pk = p.keys()
        people.append({
            "id":              p["id"],
            "name":            name,
            "birth":           _date_val(p["birth"]),
            "death":           _date_val(p["death"]),
            "birthCertainty":  p["birth_certainty"] if "birth_certainty" in pk and p["birth_certainty"] else "exact",
            "deathCertainty":  p["death_certainty"] if "death_certainty" in pk and p["death_certainty"] else "exact",
            "role":            p["role"] or "",
            "color":           p["color"] or "#818cf8",
            "photo":           photo_val,
            "photo_path":      p["photo_path"],
            "initials":        initials,
            "notes":           p["notes"] or "",
            "position":        p["position"] or "",
            "reference":       p["reference"] or "",
            "showOnTimeline":  bool(p["show_on_timeline"]),
            "tags":            _j(p["tags"] if "tags" in pk else "[]", []),
        })

    # Events
    events_rows = conn.execute(
        "SELECT * FROM events WHERE timeline_id=?", (timeline_id,)
    ).fetchall()
    events = []
    for e in events_rows:
        raw_images = _j(e["images"], [])
        # Convert stored paths to URL paths
        images = [f"/images/{img}" if img and not img.startswith("/images/") and not img.startswith("data:") else img
                  for img in raw_images]
        person_ids = pe_map.get(str(e["id"]), [])
        try:
            eid = int(e["id"])
        except (ValueError, TypeError):
            eid = e["id"]
        ek = e.keys()
        loc_name = e["location_name"] if "location_name" in ek and e["location_name"] else ""
        loc_lat  = e["location_lat"]  if "location_lat"  in ek else None
        loc_lon  = e["location_lon"]  if "location_lon"  in ek else None
        events.append({
            "id":                    eid,
            "title":                 e["title"] or "",
            "date_start":            _date_val(e["date_start"]),
            "date_end":              _date_val(e["date_end"]),
            "dateStartCertainty":    e["date_start_certainty"] if "date_start_certainty" in ek and e["date_start_certainty"] else "exact",
            "dateEndCertainty":      e["date_end_certainty"]   if "date_end_certainty"   in ek and e["date_end_certainty"]   else "exact",
            "category":              e["category"] or "Historical",
            "description":           e["description"] or "",
            "images":                images,
            "sources":               _j(e["sources"] if "sources" in ek else "[]", []),
            "tags":                  _j(e["tags"] if "tags" in ek else "[]", []),
            "customFields":          _j(e["custom_fields"] if "custom_fields" in ek else "[]", []),
            "person_ids":            person_ids,
            "hidden":                bool(e["hidden"]),
            "reference":             e["reference"] or "",
            "showOnTimeline":        bool(e["show_on_timeline"]),
            "recurrence":            _j(e["recurrence"] if "recurrence" in ek else None, None),
            "progress":              int(e["progress"]) if "progress" in ek and e["progress"] is not None else 0,
            "status":                e["status"] if "status" in ek and e["status"] else "planned",
            "location":              { "name": loc_name, "lat": loc_lat, "lon": loc_lon },
            "parentEventId":         e["parent_event_id"] if "parent_event_id" in ek and e["parent_event_id"] else None,
            "placeId":               e["place_id"] if "place_id" in ek and e["place_id"] else None,
        })

    # Relationships
    rel_rows = conn.execute(
        "SELECT * FROM relationships WHERE timeline_id=?", (timeline_id,)
    ).fetchall()
    relationships = [{"id": r["id"], "fromId": r["from_id"], "toId": r["to_id"], "type": r["type"]}
                     for r in rel_rows]

    # Canvas images
    ci_rows = conn.execute(
        "SELECT * FROM canvas_images WHERE timeline_id=?", (timeline_id,)
    ).fetchall()
    canvas_images = []
    for ci in ci_rows:
        src = ci["src_path"]
        if src and not src.startswith("/images/") and not src.startswith("data:"):
            src = f"/images/{src}"
        canvas_images.append({
            "id":     ci["id"],
            "src":    src,
            "x":      ci["x"],
            "y":      ci["y"],
            "width":  ci["width"],
            "height": ci["height"],
            "zIndex": ci["z_index"],
        })

    # Civilizations
    civ_rows = conn.execute(
        "SELECT * FROM civilizations WHERE timeline_id=?", (timeline_id,)
    ).fetchall()
    civilizations = [_j(c["data"], {}) for c in civ_rows]

    # Gen people / rels
    gp_rows = conn.execute(
        "SELECT * FROM gen_people WHERE timeline_id=?", (timeline_id,)
    ).fetchall()
    gen_people = [_j(g["data"], {}) for g in gp_rows]

    gr_rows = conn.execute(
        "SELECT * FROM gen_rels WHERE timeline_id=?", (timeline_id,)
    ).fetchall()
    gen_rels = [_j(g["data"], {}) for g in gr_rows]

    # Dependencies — Tier 2 Item 9
    dep_rows = conn.execute(
        "SELECT * FROM dependencies WHERE timeline_id=?", (timeline_id,)
    ).fetchall()
    dependencies = [
        {"id": d["id"], "fromEventId": d["from_event_id"], "toEventId": d["to_event_id"], "type": d["type"]}
        for d in dep_rows
    ]

    # Places
    places_rows = conn.execute(
        "SELECT id, name, lat, lon, description, color FROM places WHERE timeline_id=?", (timeline_id,)
    ).fetchall()
    places = [
        {"id": r["id"], "name": r["name"] or "", "lat": r["lat"], "lon": r["lon"],
         "description": r["description"] or "", "color": r["color"] or "#6366f1"}
        for r in places_rows
    ]

    # Arcs
    arcs_rows = conn.execute(
        "SELECT id, name, color, description, event_ids FROM arcs WHERE timeline_id=?", (timeline_id,)
    ).fetchall()
    arcs = [
        {"id": r["id"], "name": r["name"] or "", "color": r["color"] or "#6366f1",
         "description": r["description"] or "", "eventIds": _j(r["event_ids"], [])}
        for r in arcs_rows
    ]

    # Markers — stored as JSON in the timelines table
    rk = row.keys()
    markers = _j(row["markers"] if "markers" in rk and row["markers"] else "[]", [])

    # hiddenEvents — derive from events.hidden flag
    hidden_events = [str(e["id"]) for e in events_rows if e["hidden"]]

    return {
        "id":               row["id"],
        "name":             row["name"],
        "savedAt":          row["updated_at"],
        "bgSettings":       _j(row["bg_settings"]),
        "eras":             _j(row["eras"], []),
        "customFieldDefs":  _j(row["custom_field_defs"] if "custom_field_defs" in rk else "[]", []),
        "categories":       _j(row["categories"] if "categories" in rk else "[]", []),
        "people":           people,
        "events":           events,
        "relationships":    relationships,
        "dependencies":     dependencies,
        "canvasImages":     canvas_images,
        "hiddenEvents":     hidden_events,
        "civilizations":    civilizations,
        "genPeople":        gen_people,
        "genRels":          gen_rels,
        "places":           places,
        "arcs":             arcs,
        "markers":          markers,
    }


def _save_timeline_from_payload(conn, timeline_id: str, payload: dict):
    """
    Write a full timeline payload into DB.
    Upserts timeline row, replaces all child rows.
    """
    now = _now()
    name = payload.get("name", "Untitled")

    # Upsert timeline header
    custom_field_defs_json = json.dumps(payload.get("customFieldDefs", []))
    categories_json = json.dumps(payload.get("categories", []))
    markers_json = json.dumps(payload.get("markers", []))
    existing = conn.execute("SELECT id FROM timelines WHERE id=?", (timeline_id,)).fetchone()
    if existing:
        conn.execute(
            "UPDATE timelines SET name=?, updated_at=?, bg_settings=?, eras=?, custom_field_defs=?, categories=?, markers=? WHERE id=?",
            (name, now, json.dumps(payload.get("bgSettings")), json.dumps(payload.get("eras", [])), custom_field_defs_json, categories_json, markers_json, timeline_id)
        )
    else:
        created = payload.get("savedAt", now)
        conn.execute(
            "INSERT INTO timelines (id, name, created_at, updated_at, bg_settings, eras, custom_field_defs, categories, markers) VALUES (?,?,?,?,?,?,?,?,?)",
            (timeline_id, name, created, now, json.dumps(payload.get("bgSettings")), json.dumps(payload.get("eras", [])), custom_field_defs_json, categories_json, markers_json)
        )

    # Delete old child rows
    for table in ("people", "events", "person_events", "relationships", "dependencies",
                  "canvas_images", "civilizations", "gen_people", "gen_rels",
                  "places", "arcs"):
        conn.execute(f"DELETE FROM {table} WHERE timeline_id=?", (timeline_id,))

    # Insert people
    for p in payload.get("people", []):
        pid = str(p.get("id", ""))
        photo_path = p.get("photo_path") or None
        # If frontend sends a /images/... URL, strip prefix to store relative path
        if photo_path and photo_path.startswith("/images/"):
            photo_path = photo_path[len("/images/"):]
        conn.execute(
            "INSERT INTO people (id, timeline_id, name, birth, death, role, color, photo_path, notes, position, reference, show_on_timeline, tags, birth_certainty, death_certainty) "
            "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (pid, timeline_id,
             p.get("name", ""),
             _date_str(p.get("birth")),
             _date_str(p.get("death")),
             p.get("role", ""),
             p.get("color", "#818cf8"),
             photo_path,
             p.get("notes", ""),
             p.get("position", ""),
             p.get("reference", ""),
             1 if p.get("showOnTimeline", True) else 0,
             json.dumps(p.get("tags", [])),
             p.get("birthCertainty", "exact") or "exact",
             p.get("deathCertainty", "exact") or "exact")
        )

    # Insert events + person_events
    hidden_set = set(str(h) for h in payload.get("hiddenEvents", []))
    for e in payload.get("events", []):
        eid = str(e.get("id", ""))
        raw_images = e.get("images", [])
        # Strip /images/ prefix from image paths before storing
        stored_images = []
        for img in raw_images:
            if img and img.startswith("/images/"):
                stored_images.append(img[len("/images/"):])
            else:
                stored_images.append(img)
        is_hidden = 1 if (eid in hidden_set or not e.get("showOnTimeline", True)) else 0
        recurrence_val = e.get("recurrence")
        recurrence_json = json.dumps(recurrence_val) if recurrence_val is not None else None
        loc = e.get("location") or {}
        loc_name = str(loc.get("name") or "")
        loc_lat  = loc.get("lat")
        loc_lon  = loc.get("lon")
        loc_lat  = float(loc_lat) if loc_lat is not None else None
        loc_lon  = float(loc_lon) if loc_lon is not None else None
        parent_event_id = e.get("parentEventId") or None
        if parent_event_id is not None:
            parent_event_id = str(parent_event_id)
        place_id = e.get("placeId") or None
        if place_id is not None:
            place_id = str(place_id)
        conn.execute(
            "INSERT INTO events (id, timeline_id, title, date_start, date_end, category, description, images, sources, hidden, reference, show_on_timeline, tags, custom_fields, recurrence, progress, status, location_name, location_lat, location_lon, date_start_certainty, date_end_certainty, parent_event_id, place_id) "
            "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (eid, timeline_id,
             e.get("title", ""),
             _date_str(e.get("date_start")),
             _date_str(e.get("date_end")),
             e.get("category", "Historical"),
             e.get("description", ""),
             json.dumps(stored_images),
             json.dumps(e.get("sources", [])),
             is_hidden,
             e.get("reference", ""),
             1 if e.get("showOnTimeline", True) else 0,
             json.dumps(e.get("tags", [])),
             json.dumps(e.get("customFields", [])),
             recurrence_json,
             int(e.get("progress", 0) or 0),
             e.get("status", "planned") or "planned",
             loc_name, loc_lat, loc_lon,
             e.get("dateStartCertainty", "exact") or "exact",
             e.get("dateEndCertainty", "exact") or "exact",
             parent_event_id, place_id)
        )
        for pid in e.get("person_ids", []):
            try:
                conn.execute(
                    "INSERT OR IGNORE INTO person_events (person_id, event_id, timeline_id) VALUES (?,?,?)",
                    (str(pid), eid, timeline_id)
                )
            except Exception:
                pass

    # Insert relationships
    for r in payload.get("relationships", []):
        conn.execute(
            "INSERT INTO relationships (id, timeline_id, from_id, to_id, type) VALUES (?,?,?,?,?)",
            (str(r.get("id", uuid.uuid4().hex)), timeline_id,
             str(r.get("fromId", "")), str(r.get("toId", "")), r.get("type", "parent"))
        )

    # Insert dependencies — Tier 2 Item 9
    for dep in payload.get("dependencies", []):
        conn.execute(
            "INSERT INTO dependencies (id, timeline_id, from_event_id, to_event_id, type) VALUES (?,?,?,?,?)",
            (str(dep.get("id", uuid.uuid4().hex)), timeline_id,
             str(dep.get("fromEventId", "")), str(dep.get("toEventId", "")),
             dep.get("type", "fs"))
        )

    # Insert canvas images
    for ci in payload.get("canvasImages", []):
        src = ci.get("src", "")
        if src and src.startswith("/images/"):
            src = src[len("/images/"):]
        conn.execute(
            "INSERT INTO canvas_images (id, timeline_id, src_path, x, y, width, height, z_index) VALUES (?,?,?,?,?,?,?,?)",
            (str(ci.get("id", uuid.uuid4().hex)), timeline_id,
             src, ci.get("x", 0), ci.get("y", 0),
             ci.get("width", 200), ci.get("height", 150),
             ci.get("zIndex", 1))
        )

    # Insert places
    for p in payload.get("places", []):
        conn.execute(
            "INSERT INTO places (id, timeline_id, name, lat, lon, description, color) VALUES (?,?,?,?,?,?,?)",
            (str(p.get("id", uuid.uuid4().hex)), timeline_id,
             p.get("name", ""),
             p.get("lat"),
             p.get("lon"),
             p.get("description", ""),
             p.get("color", "#6366f1"))
        )

    # Insert arcs
    for a in payload.get("arcs", []):
        conn.execute(
            "INSERT INTO arcs (id, timeline_id, name, color, description, event_ids) VALUES (?,?,?,?,?,?)",
            (str(a.get("id", uuid.uuid4().hex)), timeline_id,
             a.get("name", ""),
             a.get("color", "#6366f1"),
             a.get("description", ""),
             json.dumps(a.get("eventIds", [])))
        )

    # Insert civilizations
    for civ in payload.get("civilizations", []):
        cid = str(civ.get("id", uuid.uuid4().hex))
        conn.execute(
            "INSERT INTO civilizations (id, timeline_id, data) VALUES (?,?,?)",
            (cid, timeline_id, json.dumps(civ))
        )

    # Insert gen_people
    for gp in payload.get("genPeople", []):
        gid = str(gp.get("id", uuid.uuid4().hex))
        conn.execute(
            "INSERT INTO gen_people (id, timeline_id, data) VALUES (?,?,?)",
            (gid, timeline_id, json.dumps(gp))
        )

    # Insert gen_rels
    for gr in payload.get("genRels", []):
        gid = str(gr.get("id", uuid.uuid4().hex))
        conn.execute(
            "INSERT INTO gen_rels (id, timeline_id, data) VALUES (?,?,?)",
            (gid, timeline_id, json.dumps(gr))
        )


# ─── Version snapshot helpers — Tier 4 Item 18 ───────────────────────────────

def _create_version_snapshot(conn, timeline_id: str, payload: dict,
                              label: str = None, auto: bool = True):
    """Insert a version snapshot row. Prunes oldest auto-snapshots if > 50."""
    # Next version number for this timeline
    row = conn.execute(
        "SELECT COALESCE(MAX(version_number), 0) AS mx FROM timeline_versions WHERE timeline_id=?",
        (timeline_id,)
    ).fetchone()
    next_ver = (row["mx"] if row else 0) + 1

    vid = uuid.uuid4().hex
    conn.execute(
        "INSERT INTO timeline_versions (id, timeline_id, version_number, label, snapshot, auto) "
        "VALUES (?,?,?,?,?,?)",
        (vid, timeline_id, next_ver, label, json.dumps(payload), 1 if auto else 0)
    )

    # Keep only last 50 auto-snapshots (named ones are never pruned)
    if auto:
        old_rows = conn.execute(
            "SELECT id FROM timeline_versions "
            "WHERE timeline_id=? AND auto=1 "
            "ORDER BY version_number ASC",
            (timeline_id,)
        ).fetchall()
        if len(old_rows) > 50:
            ids_to_delete = [r["id"] for r in old_rows[: len(old_rows) - 50]]
            placeholders = ",".join("?" * len(ids_to_delete))
            conn.execute(
                f"DELETE FROM timeline_versions WHERE id IN ({placeholders})",
                ids_to_delete
            )
    return vid


# ─── API key helpers — Tier 5 Item 28 ────────────────────────────────────────

def _hash_key(raw_key: str) -> str:
    return hashlib.sha256(raw_key.encode()).hexdigest()


def _validate_api_key(request: Request) -> str:
    """
    Extract and validate a Bearer API key from the Authorization header.
    Returns the key_id on success; raises HTTP 401 on failure.
    """
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer tl_"):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header. Use: Bearer tl_<key>")
    raw = auth[len("Bearer "):]
    key_hash = _hash_key(raw)
    with db_conn() as conn:
        row = conn.execute(
            "SELECT id FROM api_keys WHERE key_hash=?", (key_hash,)
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=401, detail="Invalid API key")
        conn.execute(
            "UPDATE api_keys SET last_used_at=? WHERE id=?", (_now(), row["id"])
        )
        return row["id"]


def _fire_webhooks(timeline_id: str, event_type: str, payload: dict):
    """
    POST payload to every registered webhook matching timeline_id + event_type.
    Runs in a background thread — never blocks the request.
    """
    def _send():
        try:
            with db_conn() as conn:
                rows = conn.execute(
                    "SELECT * FROM webhooks WHERE (timeline_id IS NULL OR timeline_id=?)",
                    (timeline_id,)
                ).fetchall()
        except Exception:
            return
        body = json.dumps({"timelineId": timeline_id, "event": event_type, "data": payload}).encode()
        for row in rows:
            events = _j(row["events"], ["save"])
            if event_type not in events:
                continue
            url = row["url"]
            secret = row["secret"]
            headers = {"Content-Type": "application/json", "X-Timeline-Event": event_type}
            if secret:
                sig = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
                headers["X-Timeline-Signature"] = f"sha256={sig}"
            try:
                req = urllib.request.Request(url, data=body, headers=headers, method="POST")
                urllib.request.urlopen(req, timeout=5)
            except Exception:
                pass  # webhook delivery failure is silent — never crash the save path
    threading.Thread(target=_send, daemon=True).start()


# ─── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve images as static files
app.mount("/images", StaticFiles(directory=str(IMAGES_DIR)), name="images")

# Initialise DB on startup
init_db()
migrate_db()

# ─── Claude client ────────────────────────────────────────────────────────────
_client = None

def get_client():
    global _client
    if _client is None:
        api_key = os.environ.get("ANTHROPIC_API_KEY", "")
        if not api_key:
            raise RuntimeError("ANTHROPIC_API_KEY environment variable not set")
        _client = anthropic.Anthropic(api_key=api_key)
    return _client


_openai_client = None

def get_openai_client():
    """Get or create OpenAI client instance"""
    global _openai_client
    if not OPENAI_AVAILABLE:
        raise RuntimeError("OpenAI library not installed. Run: pip3 install openai")
    if _openai_client is None:
        api_key = os.environ.get("OPENAI_API_KEY", "")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY environment variable not set")
        _openai_client = OpenAI(api_key=api_key)
    return _openai_client


SYSTEM_TEMPLATE = """\
You are an AI assistant built into a historical timeline app. \
You help users research, explore, and populate their timeline with people and events.

**Current timeline data:**
{context}

**Your capabilities:**
- Answer questions about historical people, events, and time periods
- Suggest people or events to add to the timeline
- Edit or improve existing entries (update roles, dates, descriptions)
- Analyse patterns, connections, and gaps in the existing data
- Date format: negative integers = BC (e.g. -44 = 44 BC), positive = AD, or ISO "YYYY-MM-DD"

**When proposing to ADD a PERSON**, output a JSON code block:
```json
{{"action":"add_person","name":"Julius Caesar","birth":-100,"death":-44,"role":"Roman general and dictator","color":"#f59e0b"}}
```

**When proposing to ADD an EVENT**, output a JSON code block:
```json
{{"action":"add_event","title":"Battle of Actium","start":-31,"end":null,"description":"Naval battle that ended the Roman Republic.","category":"Historical"}}
```

**When proposing to EDIT an existing PERSON** (use the exact id from context), output:
```json
{{"action":"edit_person","id":"p2","name":"Marie Curie","birth":"1867-11-07","death":"1934-07-04","role":"Physicist, chemist, first woman to win Nobel Prize","color":"#22d3ee"}}
```

**When proposing to EDIT an existing EVENT** (use the exact id from context), output:
```json
{{"action":"edit_event","id":"21","title":"Birth of Jesus","start":-4,"description":"Jesus is born in Bethlehem, circa 4 BC.","category":"Religion"}}
```

Only include fields you want to change in edit blocks — omit unchanged fields.
Available categories: Religion, Politics, Science, Aviation, Historical, Award, Personal.
Color suggestions — gold #f59e0b, purple #c084fc, cyan #22d3ee, red #f87171, green #4ade80, blue #60a5fa, orange #fb923c.

You may propose multiple actions in one response — give a short explanation first, then the JSON block(s).
Do NOT propose ADD actions for people or events that are already in the timeline.
Keep replies focused and concise.\
"""


# ─── Static file serving ──────────────────────────────────────────────────────
@app.get("/", response_class=HTMLResponse)
async def serve_index():
    with open(str(BASE_DIR / "index.html"), encoding="utf-8") as f:
        return f.read()


@app.get("/health")
async def health():
    return {"status": "ok", "key_set": bool(os.environ.get("ANTHROPIC_API_KEY"))}


# ─── Timeline CRUD endpoints ──────────────────────────────────────────────────
@app.get("/api/timelines")
async def list_timelines():
    """List all timelines (summary — no children)."""
    with db_conn() as conn:
        rows = conn.execute(
            "SELECT t.id, t.name, t.updated_at, "
            "(SELECT COUNT(*) FROM people WHERE timeline_id=t.id) AS people_count, "
            "(SELECT COUNT(*) FROM events WHERE timeline_id=t.id) AS events_count "
            "FROM timelines t ORDER BY t.updated_at DESC"
        ).fetchall()
        return [
            {
                "id":           r["id"],
                "name":         r["name"],
                "savedAt":      r["updated_at"],
                "peopleCount":  r["people_count"],
                "eventsCount":  r["events_count"],
            }
            for r in rows
        ]


@app.post("/api/timelines")
async def create_timeline(request: Request):
    """Create a new timeline. Body: { name, ...full payload fields }"""
    payload = await request.json()
    timeline_id = payload.get("id") or uuid.uuid4().hex
    payload["id"] = timeline_id
    with db_conn() as conn:
        _save_timeline_from_payload(conn, timeline_id, payload)
    return {"id": timeline_id, "savedAt": _now()}


@app.get("/api/timelines/{timeline_id}")
async def get_timeline(timeline_id: str):
    """Load full timeline."""
    with db_conn() as conn:
        result = _build_timeline_payload(conn, timeline_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Timeline not found")
    return result


@app.put("/api/timelines/{timeline_id}")
async def save_timeline(timeline_id: str, request: Request):
    """Save / overwrite a timeline. Automatically creates a version snapshot."""
    payload = await request.json()
    payload["id"] = timeline_id
    with db_conn() as conn:
        _save_timeline_from_payload(conn, timeline_id, payload)
        # Auto-snapshot — silent, non-blocking within the same transaction
        try:
            _create_version_snapshot(conn, timeline_id, payload, auto=True)
        except Exception:
            pass  # never break the save path due to snapshot failure
    # Fire webhooks in background thread — non-blocking
    summary = {"id": timeline_id, "name": payload.get("name", ""), "savedAt": _now()}
    _fire_webhooks(timeline_id, "save", summary)
    return {"id": timeline_id, "savedAt": summary["savedAt"]}


@app.delete("/api/timelines/{timeline_id}")
async def delete_timeline(timeline_id: str):
    """Delete a timeline and all child rows (cascade)."""
    with db_conn() as conn:
        row = conn.execute("SELECT id FROM timelines WHERE id=?", (timeline_id,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Timeline not found")
        conn.execute("DELETE FROM timelines WHERE id=?", (timeline_id,))
    return {"deleted": timeline_id}


# ─── Version history endpoints — Tier 4 Item 18 ──────────────────────────────

@app.get("/api/timelines/{timeline_id}/versions")
async def list_versions(timeline_id: str):
    """List versions for a timeline — newest first. Does NOT return full snapshot."""
    with db_conn() as conn:
        row = conn.execute("SELECT id FROM timelines WHERE id=?", (timeline_id,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Timeline not found")
        rows = conn.execute(
            "SELECT id, version_number, label, created_at, auto "
            "FROM timeline_versions WHERE timeline_id=? "
            "ORDER BY version_number DESC",
            (timeline_id,)
        ).fetchall()
    return [
        {
            "id":            r["id"],
            "versionNumber": r["version_number"],
            "label":         r["label"],
            "createdAt":     r["created_at"],
            "auto":          bool(r["auto"]),
        }
        for r in rows
    ]


@app.get("/api/timelines/{timeline_id}/versions/{vid}")
async def get_version(timeline_id: str, vid: str):
    """Return full snapshot for one version."""
    with db_conn() as conn:
        row = conn.execute(
            "SELECT * FROM timeline_versions WHERE id=? AND timeline_id=?",
            (vid, timeline_id)
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Version not found")
    snapshot = _j(row["snapshot"], {})
    return {
        "id":            row["id"],
        "versionNumber": row["version_number"],
        "label":         row["label"],
        "createdAt":     row["created_at"],
        "auto":          bool(row["auto"]),
        "snapshot":      snapshot,
    }


@app.post("/api/timelines/{timeline_id}/versions")
async def create_named_version(timeline_id: str, request: Request):
    """Create a named (manual) snapshot of the current timeline state."""
    body = await request.json()
    label = (body.get("label") or "").strip() or "Unnamed snapshot"
    with db_conn() as conn:
        row = conn.execute("SELECT id FROM timelines WHERE id=?", (timeline_id,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Timeline not found")
        payload = _build_timeline_payload(conn, timeline_id)
        if payload is None:
            raise HTTPException(status_code=404, detail="Timeline not found")
        vid = _create_version_snapshot(conn, timeline_id, payload, label=label, auto=False)
    return {"id": vid, "label": label}


@app.post("/api/timelines/{timeline_id}/versions/{vid}/restore")
async def restore_version(timeline_id: str, vid: str):
    """Restore a version. Creates a pre-restore backup first, then overwrites the timeline."""
    with db_conn() as conn:
        ver_row = conn.execute(
            "SELECT * FROM timeline_versions WHERE id=? AND timeline_id=?",
            (vid, timeline_id)
        ).fetchone()
        if ver_row is None:
            raise HTTPException(status_code=404, detail="Version not found")

        # 1. Create pre-restore backup of current state
        current_payload = _build_timeline_payload(conn, timeline_id)
        if current_payload:
            try:
                _create_version_snapshot(
                    conn, timeline_id, current_payload,
                    label="Pre-restore backup", auto=True
                )
            except Exception:
                pass

        # 2. Restore snapshot into timeline
        snapshot = _j(ver_row["snapshot"], {})
        snapshot["id"] = timeline_id
        _save_timeline_from_payload(conn, timeline_id, snapshot)

        # 3. Create a post-restore marker snapshot
        try:
            ver_label = ver_row["label"] or f"v{ver_row['version_number']}"
            _create_version_snapshot(
                conn, timeline_id, snapshot,
                label=f"Restored from {ver_label}", auto=True
            )
        except Exception:
            pass

    return {"restored": vid, "savedAt": _now()}


@app.patch("/api/timelines/{timeline_id}/versions/{vid}")
async def label_version(timeline_id: str, vid: str, request: Request):
    """Set or update the label on a version."""
    body = await request.json()
    label = (body.get("label") or "").strip()
    with db_conn() as conn:
        row = conn.execute(
            "SELECT id FROM timeline_versions WHERE id=? AND timeline_id=?",
            (vid, timeline_id)
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Version not found")
        conn.execute(
            "UPDATE timeline_versions SET label=? WHERE id=?",
            (label or None, vid)
        )
    return {"id": vid, "label": label}


@app.delete("/api/timelines/{timeline_id}/versions/{vid}")
async def delete_version(timeline_id: str, vid: str):
    """Delete a named snapshot. Auto-snapshots cannot be manually deleted."""
    with db_conn() as conn:
        row = conn.execute(
            "SELECT id, auto FROM timeline_versions WHERE id=? AND timeline_id=?",
            (vid, timeline_id)
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Version not found")
        if row["auto"]:
            raise HTTPException(status_code=400, detail="Auto-snapshots cannot be manually deleted")
        conn.execute("DELETE FROM timeline_versions WHERE id=?", (vid,))
    return {"deleted": vid}


# ─── Image upload endpoint ─────────────────────────────────────────────────────
@app.post("/api/upload/image")
async def upload_image(
    file: UploadFile = File(...),
    category: str = "events"   # 'people' | 'events' | 'canvas'
):
    """
    Receive an image upload, save to ./images/<category>/, return the relative path.
    The path returned is relative to ./images/ so it can be used as /images/<path>.
    """
    allowed_categories = {"people", "events", "canvas"}
    if category not in allowed_categories:
        category = "events"

    # Determine target directory
    target_dir = IMAGES_DIR / category
    target_dir.mkdir(parents=True, exist_ok=True)

    # Build a unique filename preserving extension
    original_ext = Path(file.filename).suffix.lower() if file.filename else ".jpg"
    if original_ext not in {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp"}:
        original_ext = ".jpg"
    filename = uuid.uuid4().hex + original_ext
    dest_path = target_dir / filename

    # Stream upload to disk
    with open(str(dest_path), "wb") as out:
        while True:
            chunk = await file.read(65536)
            if not chunk:
                break
            out.write(chunk)

    relative_path = f"{category}/{filename}"
    return {"path": relative_path, "url": f"/images/{relative_path}"}


# ─── Claude streaming endpoint (unchanged) ────────────────────────────────────
@app.post("/api/claude")
async def claude_endpoint(request: Request):
    body = await request.json()
    messages = body.get("messages", [])
    context = body.get("context", {})

    people = context.get("people", [])
    events = context.get("events", [])
    eras   = context.get("eras", [])

    def fmt_year(y):
        if y is None: return "?"
        if isinstance(y, (int, float)):
            y = int(y)
            return f"{abs(y)} BC" if y <= 0 else f"{y} AD"
        return str(y)[:10]  # ISO date — show just the date part

    ctx_lines = []
    if people:
        ctx_lines.append(
            "People (" + str(len(people)) + "):\n" +
            "\n".join(
                f"  [{p.get('id','?')}] {p.get('name','?')} ({fmt_year(p.get('birth'))}–{fmt_year(p.get('death'))}) — {p.get('role','')}"
                for p in people
            )
        )
    else:
        ctx_lines.append("People: none added yet")

    if events:
        def fmt_event(e):
            end_part = ("-" + fmt_year(e.get('end'))) if e.get('end') else ''
            desc_part = (" -- " + str(e.get('description',''))[:80]) if e.get('description') else ''
            return f"  [{e.get('id','?')}] {e.get('title','?')} ({fmt_year(e.get('start'))}{end_part}) [{e.get('category','')}]{desc_part}"
        ctx_lines.append(
            "Events (" + str(len(events)) + "):\n" +
            "\n".join(fmt_event(e) for e in events)
        )
    else:
        ctx_lines.append("Events: none added yet")

    if eras:
        ctx_lines.append(
            "Time periods: " +
            ", ".join(
                f"{e.get('label','?')} ({e.get('yearStart')}–{e.get('yearEnd') or 'present'})"
                for e in eras
            )
        )

    system = SYSTEM_TEMPLATE.format(context="\n".join(ctx_lines))

    def generate():
        try:
            client = get_client()
            with client.messages.stream(
                model="claude-sonnet-4-6",
                max_tokens=4096,
                system=system,
                messages=messages,
            ) as stream:
                for text in stream.text_stream:
                    yield f"data: {json.dumps({'type': 'text', 'text': text})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except RuntimeError as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        except anthropic.APIError as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': f'Unexpected error: {e}'})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ─── OpenAI endpoint ──────────────────────────────────────────────────────────

@app.post("/api/openai")
async def openai_endpoint(request: Request):
    """
    OpenAI chat endpoint with streaming support.
    Uses GPT-4o by default, or o1-preview for reasoning tasks.
    Accepts the same message format as the Claude endpoint.
    """
    body = await request.json()
    messages = body.get("messages", [])
    context = body.get("context", {})
    model = body.get("model", "gpt-4o")  # Default to GPT-4o, can override with "o1-preview"

    people = context.get("people", [])
    events = context.get("events", [])
    eras   = context.get("eras", [])

    def fmt_year(y):
        if y is None: return "?"
        if isinstance(y, (int, float)):
            y = int(y)
            return f"{abs(y)} BC" if y <= 0 else f"{y} AD"
        return str(y)[:10]

    ctx_lines = []
    if people:
        ctx_lines.append(
            "People (" + str(len(people)) + "):\n" +
            "\n".join(
                f"  [{p.get('id','?')}] {p.get('name','?')} ({fmt_year(p.get('birth'))}–{fmt_year(p.get('death'))}) — {p.get('role','')}"
                for p in people
            )
        )
    else:
        ctx_lines.append("People: none added yet")

    if events:
        def fmt_event(e):
            ds = fmt_year(e.get("date_start"))
            de = e.get("date_end")
            de_str = f"–{fmt_year(de)}" if de else ""
            return f"  [{e.get('id','?')}] {e.get('title','?')} ({ds}{de_str}) — {e.get('description','')[:80]}"
        ctx_lines.append(
            "Events (" + str(len(events)) + "):\n" +
            "\n".join(fmt_event(e) for e in events[:30])
        )
    else:
        ctx_lines.append("Events: none added yet")

    if eras:
        ctx_lines.append(
            "Eras/Sections (" + str(len(eras)) + "):\n" +
            "\n".join(f"  {e.get('label','?')} ({fmt_year(e.get('yearStart'))}–{fmt_year(e.get('yearEnd'))})" for e in eras)
        )

    # Build system message
    system_content = SYSTEM_TEMPLATE.format(context="\n".join(ctx_lines))

    # Prepend system message to messages array (OpenAI uses messages format, not separate system)
    openai_messages = [{"role": "system", "content": system_content}] + messages

    def generate():
        try:
            client = get_openai_client()
            stream = client.chat.completions.create(
                model=model,
                messages=openai_messages,
                max_tokens=4096,
                stream=True
            )

            for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield f"data: {json.dumps({'type': 'text', 'text': chunk.choices[0].delta.content})}\n\n"

            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except RuntimeError as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': f'OpenAI error: {e}'})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ─── Extract from text endpoint — Tier 5 Item 23 ─────────────────────────────

EXTRACT_SYSTEM = """\
You are a timeline extraction assistant. Given a text passage, identify all people and datable events mentioned.

Return ONLY a JSON object — no markdown, no explanation, no code fences — in exactly this format:
{
  "people": [
    { "name": "...", "birth": null_or_year_or_iso, "death": null_or_year_or_iso, "role": "...", "notes": "..." }
  ],
  "events": [
    { "title": "...", "dateStart": year_or_iso, "dateEnd": null_or_year_or_iso, "description": "...", "category": "...", "peopleNames": ["..."], "location": "...", "tags": ["..."] }
  ]
}

Rules:
- Only include people/events that have at least one datable reference (approximate year is fine).
- Use integer years for ancient/modern whole-year dates (e.g. -44 for 44 BC, 1944 for 1944 AD).
- Use ISO strings (e.g. "1944-06-06") only when a specific calendar date is clearly stated.
- dateEnd must be null for point events.
- category must be exactly one of: Religion, Politics, Science, Aviation, Historical, Award, Personal, General.
- peopleNames must be an array of names that match entries in the people array above.
- Omit people/events that are already in the existing timeline (listed below).
- Be generous with extraction — better to include borderline cases than to miss real data.
"""

MAX_EXTRACT_CHARS = 50_000


@app.post("/api/extract")
async def extract_from_text(request: Request):
    """
    Extract people and events from pasted text using a single Claude call.
    Body: { text: str, timelineContext: { people: [...], events: [...], timelineName: str } }
    Returns: { people: [...], events: [...] }
    """
    body = await request.json()
    text = (body.get("text") or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is required")
    if len(text) > MAX_EXTRACT_CHARS:
        text = text[:MAX_EXTRACT_CHARS]

    ctx = body.get("timelineContext") or {}
    existing_people = ctx.get("people") or []
    existing_events = ctx.get("events") or []

    def fmt_year(y):
        if y is None:
            return "?"
        if isinstance(y, (int, float)):
            y = int(y)
            return f"{abs(y)} BC" if y <= 0 else f"{y} AD"
        return str(y)[:10]

    existing_people_str = (
        "\n".join(f"  - {p.get('name','?')} ({fmt_year(p.get('birth'))}–{fmt_year(p.get('death'))})"
                  for p in existing_people[:100])
        if existing_people else "  (none)"
    )
    existing_events_str = (
        "\n".join(f"  - {e.get('title','?')} ({fmt_year(e.get('date_start'))})"
                  for e in existing_events[:200])
        if existing_events else "  (none)"
    )

    user_msg = (
        f"Existing timeline people (do not duplicate):\n{existing_people_str}\n\n"
        f"Existing timeline events (do not duplicate):\n{existing_events_str}\n\n"
        f"Text to analyse:\n{text}"
    )

    try:
        client = get_client()
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            system=EXTRACT_SYSTEM,
            messages=[{"role": "user", "content": user_msg}],
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except anthropic.APIError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")

    raw = (response.content[0].text or "").strip()

    # Strip markdown code fences if Claude wrapped the JSON anyway
    if raw.startswith("```"):
        lines = raw.split("\n")
        raw = "\n".join(l for l in lines if not l.startswith("```"))

    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        # Try to extract JSON object from the text
        m = re.search(r'\{[\s\S]*\}', raw)
        if m:
            try:
                result = json.loads(m.group())
            except json.JSONDecodeError:
                raise HTTPException(status_code=502, detail="Claude returned invalid JSON. Try again with clearer text.")
        else:
            raise HTTPException(status_code=502, detail="Claude returned invalid JSON. Try again with clearer text.")

    people = result.get("people") or []
    events = result.get("events") or []

    # Basic sanitisation
    valid_categories = {"Religion","Politics","Science","Aviation","Historical","Award","Personal","General"}
    for e in events:
        if e.get("category") not in valid_categories:
            e["category"] = "General"
        if not isinstance(e.get("peopleNames"), list):
            e["peopleNames"] = []
        if not isinstance(e.get("tags"), list):
            e["tags"] = []

    return JSONResponse({"people": people, "events": events})


# ─── Wikipedia import endpoint — Tier 5 Item 24 ──────────────────────────────

@app.post("/api/wiki-import")
async def wiki_import(request: Request):
    """
    Fetch a Wikipedia article and extract people/events from it using Claude.
    Body: { url: str, topic: str, language: str,
            timelineContext: { people: [...], events: [...], timelineName: str } }
    Returns: { people: [...], events: [...], articleTitle: str, articleUrl: str }
    """
    body = await request.json()
    url      = (body.get("url") or "").strip()
    topic    = (body.get("topic") or "").strip()
    language = (body.get("language") or "en").strip() or "en"

    if not url and not topic:
        raise HTTPException(status_code=400, detail="url or topic is required")

    # ── Resolve article title ──────────────────────────────────────────────────
    article_title = None

    if url:
        # Extract title from URL path: last segment after /wiki/
        m = re.search(r'/wiki/([^/?#]+)', url)
        if m:
            article_title = urllib.parse.unquote(m.group(1)).replace('_', ' ')
        else:
            raise HTTPException(status_code=400, detail="Could not parse a Wikipedia article title from the URL. Make sure it contains '/wiki/'.")

    if not article_title:
        # Search Wikipedia for the best match
        search_url = (
            f"https://{urllib.parse.quote(language)}.wikipedia.org/w/api.php?"
            f"action=query&list=search&srsearch={urllib.parse.quote(topic)}&srlimit=1&format=json"
        )
        try:
            req = urllib.request.Request(search_url, headers={"User-Agent": "TimelineApp/1.0"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                search_data = json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Wikipedia search failed: {e}")

        results = (search_data.get("query") or {}).get("search") or []
        if not results:
            raise HTTPException(status_code=404, detail="Article not found — check the URL or try a different topic.")
        article_title = results[0].get("title", "")

    if not article_title:
        raise HTTPException(status_code=404, detail="Article not found — check the URL or try a different topic.")

    # ── Fetch article extract ──────────────────────────────────────────────────
    encoded_title = urllib.parse.quote(article_title)
    extract_api_url = (
        f"https://{urllib.parse.quote(language)}.wikipedia.org/w/api.php?"
        f"action=query&prop=extracts&exlimitreq=10&titles={encoded_title}&format=json&redirects=1"
    )
    canonical_api_url = (
        f"https://{urllib.parse.quote(language)}.wikipedia.org/w/api.php?"
        f"action=query&prop=info&inprop=url&titles={encoded_title}&format=json&redirects=1"
    )

    try:
        req = urllib.request.Request(extract_api_url, headers={"User-Agent": "TimelineApp/1.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            extract_data = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Wikipedia fetch failed: {e}")

    pages = (extract_data.get("query") or {}).get("pages") or {}
    if not pages:
        raise HTTPException(status_code=404, detail="Article not found — check the URL or try a different topic.")

    page = next(iter(pages.values()))
    if page.get("pageid") == -1 or not page.get("extract"):
        raise HTTPException(status_code=404, detail="Article not found — check the URL or try a different topic.")

    # Get canonical URL
    article_url = f"https://{language}.wikipedia.org/wiki/{urllib.parse.quote(article_title.replace(' ', '_'))}"
    try:
        req2 = urllib.request.Request(canonical_api_url, headers={"User-Agent": "TimelineApp/1.0"})
        with urllib.request.urlopen(req2, timeout=10) as resp2:
            canon_data = json.loads(resp2.read().decode("utf-8"))
        canon_pages = (canon_data.get("query") or {}).get("pages") or {}
        if canon_pages:
            canon_page = next(iter(canon_pages.values()))
            article_url = canon_page.get("fullurl") or article_url
            article_title = canon_page.get("title") or article_title
    except Exception:
        pass  # fall back to constructed URL

    # Strip HTML tags from the extract
    raw_text = re.sub(r'<[^>]+>', '', page["extract"])
    # Collapse multiple blank lines
    raw_text = re.sub(r'\n{3,}', '\n\n', raw_text).strip()

    if len(raw_text) > MAX_EXTRACT_CHARS:
        raw_text = raw_text[:MAX_EXTRACT_CHARS]

    # ── Build Claude prompt (same pattern as /api/extract) ─────────────────────
    ctx = body.get("timelineContext") or {}
    existing_people = ctx.get("people") or []
    existing_events = ctx.get("events") or []

    def fmt_year(y):
        if y is None:
            return "?"
        if isinstance(y, (int, float)):
            y = int(y)
            return f"{abs(y)} BC" if y <= 0 else f"{y} AD"
        return str(y)[:10]

    existing_people_str = (
        "\n".join(f"  - {p.get('name','?')} ({fmt_year(p.get('birth'))}–{fmt_year(p.get('death'))})"
                  for p in existing_people[:100])
        if existing_people else "  (none)"
    )
    existing_events_str = (
        "\n".join(f"  - {e.get('title','?')} ({fmt_year(e.get('date_start'))})"
                  for e in existing_events[:200])
        if existing_events else "  (none)"
    )

    user_msg = (
        f"Wikipedia article: {article_title}\n\n"
        f"Existing timeline people (do not duplicate):\n{existing_people_str}\n\n"
        f"Existing timeline events (do not duplicate):\n{existing_events_str}\n\n"
        f"Article text:\n{raw_text}"
    )

    try:
        client = get_client()
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            system=EXTRACT_SYSTEM,
            messages=[{"role": "user", "content": user_msg}],
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except anthropic.APIError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")

    raw = (response.content[0].text or "").strip()

    if raw.startswith("```"):
        lines = raw.split("\n")
        raw = "\n".join(l for l in lines if not l.startswith("```"))

    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        m = re.search(r'\{[\s\S]*\}', raw)
        if m:
            try:
                result = json.loads(m.group())
            except json.JSONDecodeError:
                raise HTTPException(status_code=502, detail="Claude returned invalid JSON. Try again.")
        else:
            raise HTTPException(status_code=502, detail="Claude returned invalid JSON. Try again.")

    people = result.get("people") or []
    events = result.get("events") or []

    valid_categories = {"Religion","Politics","Science","Aviation","Historical","Award","Personal","General"}
    for e in events:
        if e.get("category") not in valid_categories:
            e["category"] = "General"
        if not isinstance(e.get("peopleNames"), list):
            e["peopleNames"] = []
        if not isinstance(e.get("tags"), list):
            e["tags"] = []

    return JSONResponse({
        "people": people,
        "events": events,
        "articleTitle": article_title,
        "articleUrl": article_url,
    })


# ─── Narrative generation endpoint — Tier 5 Item 25 ──────────────────────────

NARRATIVE_SYSTEM = """\
You are a skilled historical narrator. You will be given structured timeline data and must write a compelling, well-organised prose narrative about the people and events.

Guidelines:
- Write in continuous prose, not bullet points
- Organise chronologically with natural transitions
- Group related events into coherent paragraphs
- Use section headings (## Heading) to divide the narrative into logical chapters
- Mention people by name and connect their stories across events
- For each major event mention approximate dates naturally in the prose
- Write in the requested tone: academic (formal, scholarly), narrative (engaging storytelling), journalistic (clear, factual), or simple (plain language, accessible)
- Keep the length appropriate: brief (~300 words), standard (~800 words), detailed (~1500 words)
- Do not fabricate facts — only use information provided
- End with a brief concluding paragraph summarising significance

Output format: plain markdown text with ## section headings. No JSON, no code fences.
"""

MAX_NARRATIVE_CHARS = 30_000


@app.post("/api/narrative")
async def generate_narrative(request: Request):
    """
    Generate a prose narrative of a timeline using Claude.
    Body: {
      timelineContext: { timelineName, people, events, relationships },
      options: { tone, length, focus, language }
    }
    Returns: { narrative: "...", title: "The Story of ..." }
    """
    body = await request.json()
    ctx     = body.get("timelineContext") or {}
    options = body.get("options") or {}

    timeline_name = ctx.get("timelineName") or "Timeline"
    people        = ctx.get("people") or []
    events        = ctx.get("events") or []
    relationships = ctx.get("relationships") or []

    tone     = options.get("tone", "narrative")
    length   = options.get("length", "standard")
    focus    = options.get("focus", "all")
    language = options.get("language", "en")

    if tone not in ("academic", "narrative", "journalistic", "simple"):
        tone = "narrative"
    if length not in ("brief", "standard", "detailed"):
        length = "standard"
    if focus not in ("all", "people", "events"):
        focus = "all"

    # ── Helper to format a date value ─────────────────────────────────────────
    def fmt_year(y):
        if y is None:
            return "?"
        if isinstance(y, (int, float)):
            y = int(y)
            return f"{abs(y)} BC" if y <= 0 else f"{y} AD"
        return str(y)[:10]

    # ── Build compact context string ──────────────────────────────────────────
    # Sort events chronologically
    def sort_key(e):
        d = e.get("date_start")
        if d is None:
            return 0
        if isinstance(d, (int, float)):
            return int(d)
        try:
            return int(str(d)[:4])
        except Exception:
            return 0

    sorted_events = sorted(events, key=sort_key)

    people_str = ""
    if focus in ("all", "people") and people:
        lines = []
        for p in people[:100]:
            birth = fmt_year(p.get("birth"))
            death = fmt_year(p.get("death"))
            role  = p.get("role") or p.get("notes") or ""
            line  = f"  - {p.get('name','?')} ({birth}–{death})"
            if role:
                line += f" — {role}"
            lines.append(line)
        people_str = "PEOPLE:\n" + "\n".join(lines) + "\n\n"

    events_str = ""
    if focus in ("all", "events") and sorted_events:
        lines = []
        for e in sorted_events[:300]:
            date_s = fmt_year(e.get("date_start"))
            date_e = fmt_year(e.get("date_end")) if e.get("date_end") else ""
            date_range = f"{date_s}–{date_e}" if date_e else date_s
            desc  = (e.get("description") or "")[:200]
            cat   = e.get("category") or ""
            loc   = ""
            loc_obj = e.get("location")
            if isinstance(loc_obj, dict):
                loc = loc_obj.get("name") or ""
            elif isinstance(loc_obj, str):
                loc = loc_obj
            people_names = []
            if e.get("person_ids") and people:
                pid_map = {p["id"]: p["name"] for p in people if "id" in p}
                people_names = [pid_map[pid] for pid in e["person_ids"] if pid in pid_map]
            line = f"  - [{date_range}] {e.get('title','?')}"
            if cat:
                line += f" ({cat})"
            if loc:
                line += f" @ {loc}"
            if people_names:
                line += f" — {', '.join(people_names[:5])}"
            if desc:
                line += f"\n    {desc}"
            lines.append(line)
        events_str = "EVENTS (chronological):\n" + "\n".join(lines) + "\n\n"

    rels_str = ""
    if relationships and focus in ("all", "people"):
        pid_map = {p["id"]: p["name"] for p in people if "id" in p}
        lines = []
        for r in relationships[:100]:
            from_name = pid_map.get(r.get("fromId", ""), r.get("fromId", "?"))
            to_name   = pid_map.get(r.get("toId",   ""), r.get("toId",   "?"))
            rtype     = r.get("type", "related")
            lines.append(f"  - {from_name} → {rtype} → {to_name}")
        rels_str = "RELATIONSHIPS:\n" + "\n".join(lines) + "\n\n"

    context_str = f"TIMELINE: {timeline_name}\n\n{people_str}{events_str}{rels_str}".strip()

    if len(context_str) > MAX_NARRATIVE_CHARS:
        context_str = context_str[:MAX_NARRATIVE_CHARS]

    length_guide = {"brief": "~300 words", "standard": "~800 words", "detailed": "~1500 words"}[length]

    lang_map = {"en": "English", "af": "Afrikaans", "es": "Spanish", "fr": "French"}
    lang_name = lang_map.get(language, "English")

    user_msg = (
        f"Write a {tone} prose narrative about the following timeline.\n"
        f"Target length: {length_guide}\n"
        f"Focus: {focus}\n"
        f"Language: {lang_name}\n\n"
        f"{context_str}"
    )

    try:
        client = get_client()
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            system=NARRATIVE_SYSTEM,
            messages=[{"role": "user", "content": user_msg}],
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except anthropic.APIError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")

    narrative = (response.content[0].text or "").strip()
    title = f"The Story of {timeline_name}"

    return JSONResponse({"narrative": narrative, "title": title})


# ─── Google Sheets proxy fetch — Tier 5 Item 26 ──────────────────────────────

import urllib.request
import urllib.error
import re as _re

@app.post("/api/sheets-fetch")
async def sheets_fetch(request: Request):
    """Proxy-fetch a Google Sheets CSV URL to avoid browser CORS issues.
    Converts edit/view URLs to CSV export URLs automatically.
    Body: { url: str }
    Returns: { csv: str, resolvedUrl: str }
    """
    body = await request.json()
    raw_url = (body.get("url") or "").strip()

    if not raw_url:
        raise HTTPException(status_code=400, detail="url is required")

    # Must be a Google Sheets URL
    if "docs.google.com/spreadsheets" not in raw_url and "docs.google.com/forms" not in raw_url:
        raise HTTPException(status_code=400, detail="URL must be a Google Sheets URL (docs.google.com/spreadsheets/…)")

    # Extract sheet ID
    id_match = _re.search(r'/spreadsheets/d/([a-zA-Z0-9_-]+)', raw_url)
    if not id_match:
        raise HTTPException(status_code=400, detail="Could not find spreadsheet ID in URL")
    sheet_id = id_match.group(1)

    # Extract gid (tab/sheet id) if present
    gid_match = _re.search(r'[?&]gid=(\d+)', raw_url)
    gid = gid_match.group(1) if gid_match else "0"

    # Build resolved CSV URL
    if "/pub?" in raw_url and "output=csv" in raw_url:
        # Already a publish-to-web CSV URL — use as-is
        resolved_url = raw_url
    else:
        # Convert edit/view/any URL to export CSV
        resolved_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={gid}"

    # Fetch with browser-like User-Agent and 15s timeout
    req = urllib.request.Request(
        resolved_url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/csv,text/plain,*/*",
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            raw_bytes = resp.read()
            # Detect encoding from headers or default utf-8
            content_type = resp.headers.get("Content-Type", "")
            charset = "utf-8"
            if "charset=" in content_type:
                charset = content_type.split("charset=")[-1].split(";")[0].strip()
            try:
                csv_text = raw_bytes.decode(charset)
            except Exception:
                csv_text = raw_bytes.decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        if e.code == 403:
            raise HTTPException(
                status_code=403,
                detail=(
                    "Google Sheets returned 403 Forbidden. "
                    "Make sure the sheet is published publicly: "
                    "File → Share → Publish to web → select 'Comma-separated values (.csv)' → Publish."
                )
            )
        raise HTTPException(status_code=502, detail=f"Google Sheets fetch failed (HTTP {e.code}): {e.reason}")
    except urllib.error.URLError as e:
        if "timed out" in str(e).lower():
            raise HTTPException(status_code=504, detail="Request timed out fetching the sheet. Check your internet connection.")
        raise HTTPException(status_code=502, detail=f"Could not reach Google Sheets: {e.reason}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error fetching sheet: {e}")

    if not csv_text.strip():
        raise HTTPException(status_code=422, detail="The sheet returned empty content. Make sure the sheet has data and is published correctly.")

    return JSONResponse({"csv": csv_text, "resolvedUrl": resolved_url})


# ─── Share link endpoints — Tier 4 Item 17 ───────────────────────────────────

@app.post("/api/timelines/{timeline_id}/share")
async def create_share_link(timeline_id: str, request: Request):
    """Create a share link for a timeline.
    Body: { role: 'viewer'|'commenter'|'editor', expiresIn: null|'24h'|'7d'|'30d', password: '' }
    Returns: { token, url }
    """
    body = await request.json()
    role     = body.get("role", "viewer")
    if role not in ("viewer", "commenter", "editor"):
        role = "viewer"
    expires_in = body.get("expiresIn")
    password   = body.get("password") or ""

    expires_at = None
    if expires_in:
        delta_map = {"24h": timedelta(hours=24), "7d": timedelta(days=7), "30d": timedelta(days=30)}
        delta = delta_map.get(expires_in)
        if delta:
            expires_at = (datetime.now(timezone.utc) + delta).isoformat()

    pw_hash = hashlib.sha256(password.encode()).hexdigest() if password else None
    token   = secrets.token_urlsafe(24)

    with db_conn() as conn:
        row = conn.execute("SELECT id FROM timelines WHERE id=?", (timeline_id,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Timeline not found")
        conn.execute(
            "INSERT INTO share_links (token, timeline_id, role, expires_at, password_hash) VALUES (?,?,?,?,?)",
            (token, timeline_id, role, expires_at, pw_hash)
        )

    port = int(os.environ.get("PORT", 8765))
    url = f"http://localhost:{port}/?share={token}"
    return {"token": token, "url": url}


@app.delete("/api/share/{token}")
async def revoke_share_link(token: str):
    """Revoke (delete) a share link."""
    with db_conn() as conn:
        row = conn.execute("SELECT token FROM share_links WHERE token=?", (token,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Share link not found")
        conn.execute("DELETE FROM share_links WHERE token=?", (token,))
    return {"revoked": token}


@app.get("/api/share/{token}")
async def resolve_share_link(token: str, password: str = ""):
    """Resolve a share token → return timeline payload with role metadata.
    If password-protected: require ?password= query param.
    If expired: return 403.
    """
    with db_conn() as conn:
        row = conn.execute("SELECT * FROM share_links WHERE token=?", (token,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Share link not found or revoked")

        # Check expiry
        if row["expires_at"]:
            try:
                exp = datetime.fromisoformat(row["expires_at"])
                if exp.tzinfo is None:
                    exp = exp.replace(tzinfo=timezone.utc)
                if datetime.now(timezone.utc) > exp:
                    raise HTTPException(status_code=403, detail="Share link has expired")
            except HTTPException:
                raise
            except Exception:
                pass  # malformed — treat as unexpired

        # Check password
        if row["password_hash"]:
            supplied_hash = hashlib.sha256(password.encode()).hexdigest() if password else ""
            if supplied_hash != row["password_hash"]:
                raise HTTPException(status_code=401, detail="Password required or incorrect")

        # Build payload
        result = _build_timeline_payload(conn, row["timeline_id"])
        if result is None:
            raise HTTPException(status_code=404, detail="Timeline not found")

    result["_shareRole"] = row["role"]
    result["_shareToken"] = token
    return result


@app.get("/api/timelines/{timeline_id}/shares")
async def list_share_links(timeline_id: str):
    """List all active share links for a timeline."""
    with db_conn() as conn:
        row = conn.execute("SELECT id FROM timelines WHERE id=?", (timeline_id,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Timeline not found")
        links = conn.execute(
            "SELECT token, role, created_at, expires_at FROM share_links WHERE timeline_id=? ORDER BY created_at DESC",
            (timeline_id,)
        ).fetchall()
    port = int(os.environ.get("PORT", 8765))
    return [
        {
            "token":      r["token"],
            "role":       r["role"],
            "createdAt":  r["created_at"],
            "expiresAt":  r["expires_at"],
            "url":        f"http://localhost:{port}/?share={r['token']}",
            "hasPassword": False,  # intentionally not exposing the hash
        }
        for r in links
    ]


# ─── Real-time collaboration — WebSocket (Tier 4 Item 19) ─────────────────────

class ConnectionManager:
    """
    Manages WebSocket connections grouped by timeline_id.
    Each entry: (websocket, user_id, user_name, role)
    """

    def __init__(self):
        # timeline_id → list of [ws, user_id, user_name, role]
        self.active: dict[str, list] = {}

    async def connect(self, ws: WebSocket, timeline_id: str,
                      user_id: str, user_name: str, role: str):
        await ws.accept()
        self.active.setdefault(timeline_id, [])
        self.active[timeline_id].append([ws, user_id, user_name, role])

    def disconnect(self, ws: WebSocket, timeline_id: str):
        conns = self.active.get(timeline_id, [])
        self.active[timeline_id] = [c for c in conns if c[0] is not ws]
        if not self.active[timeline_id]:
            del self.active[timeline_id]

    def get_users(self, timeline_id: str) -> list[dict]:
        return [
            {"id": c[1], "name": c[2], "role": c[3]}
            for c in self.active.get(timeline_id, [])
        ]

    async def broadcast(self, timeline_id: str, message: dict,
                        exclude_ws = None):
        conns = list(self.active.get(timeline_id, []))
        dead = []
        for c in conns:
            ws = c[0]
            if ws is exclude_ws:
                continue
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        # Silently prune dead connections
        for ws in dead:
            self.active[timeline_id] = [
                c for c in self.active.get(timeline_id, []) if c[0] is not ws
            ]


manager = ConnectionManager()


@app.websocket("/ws/{timeline_id}")
async def websocket_endpoint(
    ws: WebSocket,
    timeline_id: str,
    user_id: str = "anon",
    user_name: str = "Guest",
    token: str = None,
):
    """
    WebSocket endpoint for real-time collaboration.

    Query params:
      user_id   — stable per-browser UUID
      user_name — display name (default "Guest")
      token     — optional share link token; used to validate role

    Message protocol (JSON):
      Client → Server:
        { type: "change",  payload: { fullTimeline } }
        { type: "cursor",  payload: { view, eventId } }
        { type: "rename",  payload: { name } }   — user changed their display name
        { type: "ping" }

      Server → Client:
        { type: "change",  from, fromName, payload }
        { type: "presence", users: [{id, name, role}] }
        { type: "joined",  user: {id, name, role} }
        { type: "left",    user: {id, name} }
        { type: "pong" }
    """
    # Determine role from share token (if any)
    role = "editor"
    if token:
        with db_conn() as conn:
            row = conn.execute(
                "SELECT role, expires_at FROM share_links WHERE token=?", (token,)
            ).fetchone()
            if row:
                # Check expiry
                if row["expires_at"]:
                    try:
                        exp = datetime.fromisoformat(row["expires_at"])
                        if exp.tzinfo is None:
                            exp = exp.replace(tzinfo=timezone.utc)
                        if datetime.now(timezone.utc) > exp:
                            await ws.close(code=4003, reason="Share link expired")
                            return
                    except Exception:
                        pass
                role = row["role"]

    await manager.connect(ws, timeline_id, user_id, user_name, role)
    user_info = {"id": user_id, "name": user_name, "role": role}

    try:
        # 1. Send current presence list to the new joiner
        await ws.send_json({
            "type": "presence",
            "users": manager.get_users(timeline_id),
        })

        # 2. Announce join to everyone else
        await manager.broadcast(timeline_id, {
            "type": "joined",
            "user": user_info,
        }, exclude_ws=ws)

        # 3. Main message loop
        while True:
            try:
                data = await ws.receive_json()
            except Exception:
                break  # client disconnected or sent non-JSON

            msg_type = data.get("type")

            if msg_type == "ping":
                await ws.send_json({"type": "pong"})

            elif msg_type == "change":
                payload = data.get("payload", {})
                # Persist the new timeline state
                try:
                    with db_conn() as conn:
                        _save_timeline_from_payload(conn, timeline_id, payload)
                        try:
                            _create_version_snapshot(conn, timeline_id, payload, auto=True)
                        except Exception:
                            pass
                except Exception as e:
                    await ws.send_json({"type": "error", "message": f"Save failed: {e}"})
                    continue
                # Broadcast to other clients on the same timeline
                await manager.broadcast(timeline_id, {
                    "type": "change",
                    "from": user_id,
                    "fromName": user_name,
                    "payload": payload,
                }, exclude_ws=ws)

            elif msg_type == "cursor":
                # Relay cursor position to others
                await manager.broadcast(timeline_id, {
                    "type": "cursor",
                    "from": user_id,
                    "fromName": user_name,
                    "payload": data.get("payload", {}),
                }, exclude_ws=ws)

            elif msg_type == "rename":
                # User changed their display name — update in manager and broadcast
                new_name = str(data.get("payload", {}).get("name", "Guest"))[:60]
                for c in manager.active.get(timeline_id, []):
                    if c[0] is ws:
                        c[2] = new_name
                        break
                user_name = new_name
                user_info["name"] = new_name
                await manager.broadcast(timeline_id, {
                    "type": "presence",
                    "users": manager.get_users(timeline_id),
                }, exclude_ws=None)

    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(ws, timeline_id)
        # Broadcast leave event
        try:
            await manager.broadcast(timeline_id, {
                "type": "left",
                "user": {"id": user_id, "name": user_name},
            })
        except Exception:
            pass


@app.get("/api/collab/{timeline_id}/presence")
async def collab_presence(timeline_id: str):
    """REST fallback — returns current connected users for a timeline."""
    return {"users": manager.get_users(timeline_id)}


# ─── REST API v1 — Tier 5 Item 28 ────────────────────────────────────────────
# All /api/v1/* endpoints require a valid API key (Bearer tl_<key>).
# Keys are managed via /api/v1/keys (no auth required for key management —
# these endpoints are local-only by design).

# ── Key management (no auth — local server access assumed) ───────────────────

@app.get("/api/v1/keys")
async def list_api_keys():
    """List all API keys (names + prefixes + last used — never returns full keys)."""
    with db_conn() as conn:
        rows = conn.execute(
            "SELECT id, name, key_prefix, created_at, last_used_at FROM api_keys ORDER BY created_at DESC"
        ).fetchall()
    return [
        {
            "id":         r["id"],
            "name":       r["name"],
            "keyPrefix":  r["key_prefix"],
            "createdAt":  r["created_at"],
            "lastUsedAt": r["last_used_at"],
        }
        for r in rows
    ]


@app.post("/api/v1/keys")
async def create_api_key(request: Request):
    """
    Generate a new API key.
    Body: { "name": "My integration" }
    Returns the full key once — it cannot be retrieved again.
    """
    body = await request.json()
    name = (body.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="name is required")
    raw_key = "tl_" + secrets.token_hex(32)
    key_hash = _hash_key(raw_key)
    key_prefix = raw_key[:11]  # "tl_" + 8 hex chars
    kid = uuid.uuid4().hex
    with db_conn() as conn:
        conn.execute(
            "INSERT INTO api_keys (id, name, key_prefix, key_hash) VALUES (?,?,?,?)",
            (kid, name, key_prefix, key_hash)
        )
    return {"id": kid, "name": name, "key": raw_key, "keyPrefix": key_prefix,
            "note": "Store this key securely — it will not be shown again."}


@app.delete("/api/v1/keys/{kid}")
async def revoke_api_key(kid: str):
    """Revoke (delete) an API key by ID."""
    with db_conn() as conn:
        row = conn.execute("SELECT id FROM api_keys WHERE id=?", (kid,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Key not found")
        conn.execute("DELETE FROM api_keys WHERE id=?", (kid,))
    return {"revoked": kid}


# ── Webhook management (requires API key) ────────────────────────────────────

@app.get("/api/v1/webhooks")
async def list_all_webhooks():
    """List all webhooks (no auth — management UI only, local-server access assumed)."""
    with db_conn() as conn:
        rows = conn.execute("SELECT * FROM webhooks ORDER BY created_at DESC").fetchall()
    return [
        {
            "id":         r["id"],
            "timelineId": r["timeline_id"],
            "url":        r["url"],
            "events":     _j(r["events"], ["save"]),
            "hasSecret":  bool(r["secret"]),
            "createdAt":  r["created_at"],
        }
        for r in rows
    ]


@app.get("/api/v1/timelines/{timeline_id}/webhooks")
async def list_webhooks(timeline_id: str, request: Request):
    """List webhooks registered for a specific timeline."""
    _validate_api_key(request)
    with db_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM webhooks WHERE timeline_id=? OR timeline_id IS NULL ORDER BY created_at DESC",
            (timeline_id,)
        ).fetchall()
    return [
        {
            "id":         r["id"],
            "timelineId": r["timeline_id"],
            "url":        r["url"],
            "events":     _j(r["events"], ["save"]),
            "hasSecret":  bool(r["secret"]),
            "createdAt":  r["created_at"],
        }
        for r in rows
    ]


@app.post("/api/v1/timelines/{timeline_id}/webhooks")
async def create_webhook(timeline_id: str, request: Request):
    """
    Register a new webhook.
    Body: { url, events?: ["save"], secret?: "...", allTimelines?: false }
    """
    _validate_api_key(request)
    body = await request.json()
    url = (body.get("url") or "").strip()
    if not url.startswith("http"):
        raise HTTPException(status_code=400, detail="url must be a valid http(s) URL")
    events_val = body.get("events", ["save"])
    secret = body.get("secret") or None
    all_timelines = bool(body.get("allTimelines", False))
    tid = None if all_timelines else timeline_id
    wid = uuid.uuid4().hex
    with db_conn() as conn:
        conn.execute(
            "INSERT INTO webhooks (id, timeline_id, url, events, secret) VALUES (?,?,?,?,?)",
            (wid, tid, url, json.dumps(events_val), secret)
        )
    return {"id": wid, "url": url, "events": events_val, "timelineId": tid}


@app.delete("/api/v1/webhooks/{wid}")
async def delete_webhook(wid: str, request: Request):
    """Remove a registered webhook."""
    _validate_api_key(request)
    with db_conn() as conn:
        row = conn.execute("SELECT id FROM webhooks WHERE id=?", (wid,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Webhook not found")
        conn.execute("DELETE FROM webhooks WHERE id=?", (wid,))
    return {"deleted": wid}


# ── Timelines (read-only list + full get via v1) ──────────────────────────────

@app.get("/api/v1/timelines")
async def v1_list_timelines(request: Request):
    """List all timelines (summary). Requires API key."""
    _validate_api_key(request)
    with db_conn() as conn:
        rows = conn.execute(
            "SELECT t.id, t.name, t.updated_at, "
            "(SELECT COUNT(*) FROM people WHERE timeline_id=t.id) AS people_count, "
            "(SELECT COUNT(*) FROM events WHERE timeline_id=t.id) AS events_count "
            "FROM timelines t ORDER BY t.updated_at DESC"
        ).fetchall()
    return [
        {"id": r["id"], "name": r["name"], "savedAt": r["updated_at"],
         "peopleCount": r["people_count"], "eventsCount": r["events_count"]}
        for r in rows
    ]


@app.get("/api/v1/timelines/{timeline_id}")
async def v1_get_timeline(timeline_id: str, request: Request):
    """Return full timeline payload. Requires API key."""
    _validate_api_key(request)
    with db_conn() as conn:
        result = _build_timeline_payload(conn, timeline_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Timeline not found")
    return result


# ── People CRUD ───────────────────────────────────────────────────────────────

def _person_row_to_dict(p, people_by_id=None) -> dict:
    """Convert a SQLite Row (people table) to the API response dict."""
    pk = p.keys()
    name = p["name"] or ""
    initials = "".join(w[0] for w in name.split() if w)[:2].upper() or "?"
    photo_val = f"/images/{p['photo_path']}" if p.get("photo_path") else None
    return {
        "id":             p["id"],
        "name":           name,
        "birth":          _date_val(p["birth"]),
        "death":          _date_val(p["death"]),
        "birthCertainty": p["birth_certainty"] if "birth_certainty" in pk and p["birth_certainty"] else "exact",
        "deathCertainty": p["death_certainty"] if "death_certainty" in pk and p["death_certainty"] else "exact",
        "role":           p["role"] or "",
        "color":          p["color"] or "#818cf8",
        "photo":          photo_val,
        "initials":       initials,
        "notes":          p["notes"] or "",
        "showOnTimeline": bool(p["show_on_timeline"]),
        "tags":           _j(p["tags"] if "tags" in pk else "[]", []),
    }


@app.get("/api/v1/timelines/{timeline_id}/people")
async def v1_list_people(timeline_id: str, request: Request):
    """List all people in a timeline. Requires API key."""
    _validate_api_key(request)
    with db_conn() as conn:
        if conn.execute("SELECT id FROM timelines WHERE id=?", (timeline_id,)).fetchone() is None:
            raise HTTPException(status_code=404, detail="Timeline not found")
        rows = conn.execute("SELECT * FROM people WHERE timeline_id=?", (timeline_id,)).fetchall()
    return [_person_row_to_dict(r) for r in rows]


@app.post("/api/v1/timelines/{timeline_id}/people")
async def v1_create_person(timeline_id: str, request: Request):
    """Create a new person in a timeline. Requires API key."""
    _validate_api_key(request)
    body = await request.json()
    with db_conn() as conn:
        if conn.execute("SELECT id FROM timelines WHERE id=?", (timeline_id,)).fetchone() is None:
            raise HTTPException(status_code=404, detail="Timeline not found")
        pid = body.get("id") or uuid.uuid4().hex
        conn.execute(
            "INSERT INTO people (id, timeline_id, name, birth, death, role, color, notes, show_on_timeline, tags, birth_certainty, death_certainty) "
            "VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
            (pid, timeline_id,
             body.get("name", ""),
             _date_str(body.get("birth")),
             _date_str(body.get("death")),
             body.get("role", ""),
             body.get("color", "#818cf8"),
             body.get("notes", ""),
             1 if body.get("showOnTimeline", True) else 0,
             json.dumps(body.get("tags", [])),
             body.get("birthCertainty", "exact"),
             body.get("deathCertainty", "exact"))
        )
        row = conn.execute("SELECT * FROM people WHERE id=? AND timeline_id=?", (pid, timeline_id)).fetchone()
    return _person_row_to_dict(row)


@app.put("/api/v1/timelines/{timeline_id}/people/{person_id}")
async def v1_update_person(timeline_id: str, person_id: str, request: Request):
    """Update a person's fields (partial update). Requires API key."""
    _validate_api_key(request)
    body = await request.json()
    with db_conn() as conn:
        row = conn.execute(
            "SELECT * FROM people WHERE id=? AND timeline_id=?", (person_id, timeline_id)
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Person not found")
        # Build update from existing + overrides
        updates = {
            "name":           body.get("name",           row["name"]),
            "birth":          _date_str(body["birth"])   if "birth"  in body else row["birth"],
            "death":          _date_str(body["death"])   if "death"  in body else row["death"],
            "role":           body.get("role",           row["role"]),
            "color":          body.get("color",          row["color"]),
            "notes":          body.get("notes",          row["notes"]),
            "show_on_timeline": 1 if body.get("showOnTimeline", bool(row["show_on_timeline"])) else 0,
            "tags":           json.dumps(body.get("tags", _j(row["tags"], []))),
            "birth_certainty": body.get("birthCertainty", row["birth_certainty"] or "exact"),
            "death_certainty": body.get("deathCertainty", row["death_certainty"] or "exact"),
        }
        conn.execute(
            "UPDATE people SET name=?, birth=?, death=?, role=?, color=?, notes=?, "
            "show_on_timeline=?, tags=?, birth_certainty=?, death_certainty=? "
            "WHERE id=? AND timeline_id=?",
            (updates["name"], updates["birth"], updates["death"], updates["role"],
             updates["color"], updates["notes"], updates["show_on_timeline"],
             updates["tags"], updates["birth_certainty"], updates["death_certainty"],
             person_id, timeline_id)
        )
        row = conn.execute("SELECT * FROM people WHERE id=? AND timeline_id=?", (person_id, timeline_id)).fetchone()
    return _person_row_to_dict(row)


@app.delete("/api/v1/timelines/{timeline_id}/people/{person_id}")
async def v1_delete_person(timeline_id: str, person_id: str, request: Request):
    """Delete a person (and their person_events links). Requires API key."""
    _validate_api_key(request)
    with db_conn() as conn:
        row = conn.execute(
            "SELECT id FROM people WHERE id=? AND timeline_id=?", (person_id, timeline_id)
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Person not found")
        conn.execute("DELETE FROM person_events WHERE person_id=? AND timeline_id=?", (person_id, timeline_id))
        conn.execute("DELETE FROM people WHERE id=? AND timeline_id=?", (person_id, timeline_id))
    return {"deleted": person_id}


# ── Events CRUD ───────────────────────────────────────────────────────────────

def _event_row_to_dict(e, pe_map: dict) -> dict:
    """Convert a SQLite Row (events table) to the API response dict."""
    ek = e.keys()
    raw_images = _j(e["images"], [])
    images = [f"/images/{img}" if img and not img.startswith("/images/") and not img.startswith("data:") else img
              for img in raw_images]
    try:
        eid = int(e["id"])
    except (ValueError, TypeError):
        eid = e["id"]
    loc_name = e["location_name"] if "location_name" in ek and e["location_name"] else ""
    loc_lat  = e["location_lat"]  if "location_lat"  in ek else None
    loc_lon  = e["location_lon"]  if "location_lon"  in ek else None
    return {
        "id":                  eid,
        "title":               e["title"] or "",
        "date_start":          _date_val(e["date_start"]),
        "date_end":            _date_val(e["date_end"]),
        "dateStartCertainty":  e["date_start_certainty"] if "date_start_certainty" in ek and e["date_start_certainty"] else "exact",
        "dateEndCertainty":    e["date_end_certainty"]   if "date_end_certainty"   in ek and e["date_end_certainty"]   else "exact",
        "category":            e["category"] or "Historical",
        "description":         e["description"] or "",
        "images":              images,
        "sources":             _j(e["sources"] if "sources" in ek else "[]", []),
        "tags":                _j(e["tags"]    if "tags"    in ek else "[]", []),
        "customFields":        _j(e["custom_fields"] if "custom_fields" in ek else "[]", []),
        "person_ids":          pe_map.get(str(e["id"]), []),
        "hidden":              bool(e["hidden"]),
        "showOnTimeline":      bool(e["show_on_timeline"]),
        "recurrence":          _j(e["recurrence"] if "recurrence" in ek else None, None),
        "progress":            int(e["progress"]) if "progress" in ek and e["progress"] is not None else 0,
        "status":              e["status"] if "status" in ek and e["status"] else "planned",
        "location":            {"name": loc_name, "lat": loc_lat, "lon": loc_lon},
        "parentEventId":       e["parent_event_id"] if "parent_event_id" in ek and e["parent_event_id"] else None,
    }


@app.get("/api/v1/timelines/{timeline_id}/events")
async def v1_list_events(timeline_id: str, request: Request):
    """List all events in a timeline. Requires API key."""
    _validate_api_key(request)
    with db_conn() as conn:
        if conn.execute("SELECT id FROM timelines WHERE id=?", (timeline_id,)).fetchone() is None:
            raise HTTPException(status_code=404, detail="Timeline not found")
        rows = conn.execute("SELECT * FROM events WHERE timeline_id=?", (timeline_id,)).fetchall()
        pe_rows = conn.execute("SELECT event_id, person_id FROM person_events WHERE timeline_id=?", (timeline_id,)).fetchall()
    pe_map = {}
    for pe in pe_rows:
        pe_map.setdefault(str(pe["event_id"]), []).append(str(pe["person_id"]))
    return [_event_row_to_dict(r, pe_map) for r in rows]


@app.post("/api/v1/timelines/{timeline_id}/events")
async def v1_create_event(timeline_id: str, request: Request):
    """Create a new event in a timeline. Requires API key."""
    _validate_api_key(request)
    body = await request.json()
    with db_conn() as conn:
        if conn.execute("SELECT id FROM timelines WHERE id=?", (timeline_id,)).fetchone() is None:
            raise HTTPException(status_code=404, detail="Timeline not found")
        eid = str(body.get("id") or uuid.uuid4().hex)
        loc = body.get("location") or {}
        loc_lat = float(loc["lat"]) if loc.get("lat") is not None else None
        loc_lon = float(loc["lon"]) if loc.get("lon") is not None else None
        recurrence_val = body.get("recurrence")
        conn.execute(
            "INSERT INTO events (id, timeline_id, title, date_start, date_end, category, description, "
            "images, sources, hidden, show_on_timeline, tags, custom_fields, recurrence, progress, status, "
            "location_name, location_lat, location_lon, date_start_certainty, date_end_certainty, parent_event_id) "
            "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (eid, timeline_id,
             body.get("title", ""),
             _date_str(body.get("date_start")),
             _date_str(body.get("date_end")),
             body.get("category", "Historical"),
             body.get("description", ""),
             json.dumps(body.get("images", [])),
             json.dumps(body.get("sources", [])),
             1 if body.get("hidden", False) else 0,
             1 if body.get("showOnTimeline", True) else 0,
             json.dumps(body.get("tags", [])),
             json.dumps(body.get("customFields", [])),
             json.dumps(recurrence_val) if recurrence_val is not None else None,
             int(body.get("progress", 0) or 0),
             body.get("status", "planned"),
             str(loc.get("name") or ""), loc_lat, loc_lon,
             body.get("dateStartCertainty", "exact"),
             body.get("dateEndCertainty", "exact"),
             str(body["parentEventId"]) if body.get("parentEventId") else None)
        )
        for pid in body.get("person_ids", []):
            try:
                conn.execute(
                    "INSERT OR IGNORE INTO person_events (person_id, event_id, timeline_id) VALUES (?,?,?)",
                    (str(pid), eid, timeline_id)
                )
            except Exception:
                pass
        row = conn.execute("SELECT * FROM events WHERE id=? AND timeline_id=?", (eid, timeline_id)).fetchone()
        pe_rows = conn.execute("SELECT event_id, person_id FROM person_events WHERE event_id=? AND timeline_id=?", (eid, timeline_id)).fetchall()
    pe_map = {str(pe["event_id"]): [str(pe["person_id"])] for pe in pe_rows}
    # Merge properly
    pe_map2 = {}
    for pe in pe_rows:
        pe_map2.setdefault(str(pe["event_id"]), []).append(str(pe["person_id"]))
    return _event_row_to_dict(row, pe_map2)


@app.put("/api/v1/timelines/{timeline_id}/events/{event_id}")
async def v1_update_event(timeline_id: str, event_id: str, request: Request):
    """Update an event's fields (partial update). Requires API key."""
    _validate_api_key(request)
    body = await request.json()
    with db_conn() as conn:
        row = conn.execute(
            "SELECT * FROM events WHERE id=? AND timeline_id=?", (event_id, timeline_id)
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Event not found")
        ek = row.keys()
        # Partial merge — only override fields present in body
        def _ev(field, default):
            return body[field] if field in body else default
        loc = body.get("location") or {}
        existing_loc_name = row["location_name"] if "location_name" in ek else ""
        existing_loc_lat  = row["location_lat"]  if "location_lat"  in ek else None
        existing_loc_lon  = row["location_lon"]  if "location_lon"  in ek else None
        loc_name = str(loc.get("name") or existing_loc_name) if "location" in body else existing_loc_name
        loc_lat  = (float(loc["lat"]) if loc.get("lat") is not None else None) if "location" in body else existing_loc_lat
        loc_lon  = (float(loc["lon"]) if loc.get("lon") is not None else None) if "location" in body else existing_loc_lon
        recurrence_val = body.get("recurrence", _j(row["recurrence"] if "recurrence" in ek else None, None))
        conn.execute(
            "UPDATE events SET title=?, date_start=?, date_end=?, category=?, description=?, "
            "sources=?, tags=?, custom_fields=?, hidden=?, show_on_timeline=?, recurrence=?, "
            "progress=?, status=?, location_name=?, location_lat=?, location_lon=?, "
            "date_start_certainty=?, date_end_certainty=?, parent_event_id=? "
            "WHERE id=? AND timeline_id=?",
            (_ev("title", row["title"]),
             _date_str(body["date_start"]) if "date_start" in body else row["date_start"],
             _date_str(body["date_end"])   if "date_end"   in body else row["date_end"],
             _ev("category", row["category"]),
             _ev("description", row["description"]),
             json.dumps(_ev("sources", _j(row["sources"] if "sources" in ek else "[]", []))),
             json.dumps(_ev("tags",    _j(row["tags"]    if "tags"    in ek else "[]", []))),
             json.dumps(_ev("customFields", _j(row["custom_fields"] if "custom_fields" in ek else "[]", []))),
             1 if _ev("hidden", bool(row["hidden"])) else 0,
             1 if _ev("showOnTimeline", bool(row["show_on_timeline"])) else 0,
             json.dumps(recurrence_val) if recurrence_val is not None else None,
             int(_ev("progress", row["progress"] or 0)),
             _ev("status", row["status"] or "planned"),
             loc_name, loc_lat, loc_lon,
             _ev("dateStartCertainty", row["date_start_certainty"] if "date_start_certainty" in ek else "exact"),
             _ev("dateEndCertainty",   row["date_end_certainty"]   if "date_end_certainty"   in ek else "exact"),
             str(body["parentEventId"]) if "parentEventId" in body and body["parentEventId"] else None,
             event_id, timeline_id)
        )
        if "person_ids" in body:
            conn.execute("DELETE FROM person_events WHERE event_id=? AND timeline_id=?", (event_id, timeline_id))
            for pid in body["person_ids"]:
                try:
                    conn.execute(
                        "INSERT OR IGNORE INTO person_events (person_id, event_id, timeline_id) VALUES (?,?,?)",
                        (str(pid), event_id, timeline_id)
                    )
                except Exception:
                    pass
        row = conn.execute("SELECT * FROM events WHERE id=? AND timeline_id=?", (event_id, timeline_id)).fetchone()
        pe_rows = conn.execute("SELECT event_id, person_id FROM person_events WHERE event_id=? AND timeline_id=?", (event_id, timeline_id)).fetchall()
    pe_map = {}
    for pe in pe_rows:
        pe_map.setdefault(str(pe["event_id"]), []).append(str(pe["person_id"]))
    return _event_row_to_dict(row, pe_map)


@app.delete("/api/v1/timelines/{timeline_id}/events/{event_id}")
async def v1_delete_event(timeline_id: str, event_id: str, request: Request):
    """Delete an event (and its person_events links). Requires API key."""
    _validate_api_key(request)
    with db_conn() as conn:
        row = conn.execute(
            "SELECT id FROM events WHERE id=? AND timeline_id=?", (event_id, timeline_id)
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Event not found")
        conn.execute("DELETE FROM person_events WHERE event_id=? AND timeline_id=?", (event_id, timeline_id))
        conn.execute("DELETE FROM events WHERE id=? AND timeline_id=?", (event_id, timeline_id))
    return {"deleted": event_id}


# ─── OpenAPI docs alias ───────────────────────────────────────────────────────
# FastAPI auto-generates /docs (Swagger UI) and /openapi.json — no extra work needed.


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8765))
    print(f"\n  Timeline App running at http://localhost:{port}")
    print(f"  Database: {DB_PATH}")
    print(f"  Images:   {IMAGES_DIR}\n")
    uvicorn.run(app, host="0.0.0.0", port=port)
