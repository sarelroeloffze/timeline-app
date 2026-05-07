# REED Delivery — Tier 4, Item 19: Real-time Collaboration

**Delivered:** 2026-03-28
**Engineer:** REED (Senior Full-Stack)
**Files changed:** `server.py`, `index.html`, `CLAUDE.md`

---

## What Was Built

Full WebSocket-based real-time collaboration for the Timeline app. Broadcast + last-write-wins model. No new pip dependencies — uses FastAPI's built-in WebSocket support.

---

## Part A — Backend (`server.py`)

### `ConnectionManager` class
- Manages connections grouped by `timeline_id`: `{ timeline_id → [[ws, user_id, user_name, role], …] }`
- `connect()` — accepts WebSocket, registers slot
- `disconnect()` — removes slot, cleans up empty timelines
- `broadcast(timeline_id, message, exclude_ws)` — sends JSON to all connections on a timeline except the sender; silently prunes dead connections on send failure
- `get_users()` — returns `[{id, name, role}]` for presence list

### `/ws/{timeline_id}` WebSocket endpoint
Query params: `user_id`, `user_name` (default "Guest"), `token` (optional share link token)

**On connect:**
1. Validates share token role + expiry (if token provided); closes with code 4003 if expired
2. Accepts connection, registers with manager
3. Sends `{ type: "presence", users: [...] }` to the new joiner
4. Broadcasts `{ type: "joined", user: {id, name, role} }` to everyone else

**Message loop handles:**
- `change` — saves full timeline to SQLite + creates auto-snapshot, then broadcasts `{ type: "change", from, fromName, payload }` to all others (last-write-wins)
- `cursor` — relays `{ type: "cursor", from, fromName, payload }` to others
- `rename` — updates display name in the manager's slot, broadcasts updated presence to all
- `ping` → responds with `{ type: "pong" }`

**On disconnect:** broadcasts `{ type: "left", user: {id, name} }`

### `/api/collab/{timeline_id}/presence` REST endpoint
Returns current connected users. Useful for health-check or polling fallback.

---

## Part B — Frontend Hook (`index.html`)

### `useCollaboration(timelineId, serverMode, onRemoteChange, hasUnsavedRef)`
- **No-op** when `serverMode` is false/null — returns safe defaults
- Opens `ws://{location.host}/ws/{timelineId}?user_id=…&user_name=…`
- Stable `userId` generated once and stored in `localStorage['collab_user_id']`
- User name defaults to `localStorage['collab_user_name']` or "Guest"

**Connection lifecycle:**
- Reconnects with exponential backoff: 1 s → 2 s → 4 s → 8 s → max 30 s
- Keepalive ping every 30 s (cleared on unmount)
- `connect()` memoised with `useCallback` — safely called from `useEffect`

**Message handling:**
- `presence` → updates `users` state (initial list on join)
- `joined` → adds user to `users` list
- `left` → removes user from `users` list
- `change` → checks `hasUnsavedRef.current`:
  - If dirty: `window.confirm` "Discard / Keep editing?" — user can decline
  - If accepted (or not dirty): shows toast → calls `onRemoteChange(payload)`
- `pong` → no-op

**`sendChange(payload)` — throttled:**
- Stores pending payload; flushes immediately if ≥2 s since last send
- Otherwise schedules flush after remaining delay
- Uses `flushRef` pattern to avoid hoisting issue with `useCallback`

**`sendCursor(view, eventId)`** — fire-and-forget cursor position relay
**`rename(newName)`** — updates local name, persists to localStorage, sends `rename` message to server

### `_showCollabToast(msg)`
Imperative DOM function (no React required). Creates a fixed-position div, sets text, auto-fades after 4 s.

---

## Part C — Presence Indicator (`PresenceBar` component)

Rendered inside `Toolbar` when `serverMode === true`.

**Status badge:**
- `● Live` (green glow) — connected
- `● Reconnecting…` (yellow) — backoff retry in progress
- `● Offline` (grey) — no connection or localStorage mode

**Avatar circles:**
- One circle per peer (excludes self), max 5 shown + "+N more" overflow label
- Initials from display name (first letter of each word, up to 2)
- Colour deterministically hashed from `user.id` — same user always same colour
- Hover tooltip: `{name} ({role})`

**Popover (click badge to open):**
- Full user list with avatar, name, role badge; "(you)" marker on own entry
- "Your display name" text input + Save button → calls `collab.rename()`
- Closes on outside click (mousedown listener)

---

## Part D — App Wiring

### `hasUnsavedRef`
A `useRef(false)` in App. A `useEffect` sets it to `true` whenever `people`, `events`, `eras`, `bgSettings`, `canvasImages`, `relationships`, `customFieldDefs`, `categories`, or `dependencies` change. Reset to `false` on successful save or on remote change acceptance.

### `collabTimelineId`
Derived from `_timelineIdMap[timelineName]` — only non-null after the first server save. WebSocket connection only opens once the timeline has been saved at least once (otherwise there's no server-side timeline to sync).

### `handleRemoteChange`
`useCallback` that calls `loadTimeline(...)` with the remote payload, then resets `hasUnsavedRef.current = false`.

### `handleSave` updated
After successful save in server mode, calls `collab.sendChange(payload)` to broadcast to collaborators. The throttle ensures rapid successive saves don't flood the WebSocket.

---

## Guardrails Implemented

| Guardrail | Implementation |
|---|---|
| No-op in localStorage mode | `useCollaboration` returns early if `!serverMode` |
| Unsaved-edit warning | `window.confirm` shown if `hasUnsavedRef.current === true` on incoming change |
| No new pip deps | FastAPI `WebSocket`, `WebSocketDisconnect` — built in |
| Reconnect backoff | 1s → 2s → 4s → 8s → max 30s in `ws.onclose` |
| Keepalive | `setInterval` ping every 30s |
| Throttle | Min 2s between `sendChange` broadcasts |
| Role enforcement | Share token validated at WS connect; role stored per-slot |

---

## Help Sections Updated

- `HELP_SECTIONS` — added `{ id: 'collaboration', title: 'Real-time Collaboration' }` (English)
- `HELP_SECTIONS_AF` — added `{ id: 'collaboration', title: 'Intydse Samewerking' }` (Afrikaans)

---

## Testing Guidance

1. Start `python server.py`
2. Open `http://localhost:8765` in two browser tabs
3. In Tab 1: create a timeline, save it (this registers the server-side ID)
4. In Tab 2: open the same timeline via File → Open
5. Both tabs should show `● Live` in the toolbar
6. Click `● Live` → open popover → set different display names
7. Make changes in Tab 1, click Save → Tab 2 shows toast and updates
8. Test the unsaved-edit guard: make changes in Tab 2 without saving, then save from Tab 1 → confirm dialog appears in Tab 2
9. Kill the server → both tabs show `● Reconnecting…` → restart server → both reconnect automatically
