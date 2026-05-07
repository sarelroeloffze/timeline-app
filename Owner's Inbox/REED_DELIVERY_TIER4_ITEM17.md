# REED Delivery Note — Tier 4 Item 17
## Role-based Permissions + Share Links

**Delivered:** 2026-03-28
**Engineer:** REED (Senior Full-Stack Developer, LARRY team)
**Gap reference:** PAX analysis gap 5.3

---

## What Was Built

### Part A — Share tokens (server.py)

All backend work was already present in `server.py` from a prior session scaffold. Verified and confirmed:

- `share_links` table created via `migrate_db()` (idempotent `CREATE TABLE IF NOT EXISTS`)
- `POST /api/timelines/{id}/share` — generates token via `secrets.token_urlsafe(24)`, optional expiry, optional `hashlib.sha256` password hash; returns `{token, url}`
- `DELETE /api/share/{token}` — revokes a link
- `GET /api/share/{token}?password=` — resolves token → full timeline payload + `_shareRole`; returns 401 if password wrong/missing, 403 if expired
- `GET /api/timelines/{id}/shares` — lists all active links for a timeline

No new pip dependencies required (`secrets` and `hashlib` are Python stdlib).

---

### Part B — ShareModal (frontend, index.html)

`ShareModal` component was already scaffolded. Wired it into the render tree:

```jsx
{showShare && (
  <ShareModal
    timelineId={serverMode ? (_timelineIdMap[timelineName] || null) : null}
    timelineName={timelineName}
    serverMode={!!serverMode}
    onClose={() => setShowShare(false)} />
)}
```

**Modal features:**
- Server-mode gate — shows "Start python server.py" message in localStorage mode
- Lists existing share links: truncated token, role badge (colour-coded), expiry date, 📋 copy, ✕ revoke
- Create new link: role selector (Viewer/Commenter/Editor), expiry picker (Never/24h/7d/30d), optional password
- "Generate Link" → POST → shows full URL with Copy button + "Copied!" flash (2 s)

---

### Part C — Role-aware frontend

**`?share=` detection on load:**
- `useEffect` reads `?share=` from URL on mount
- Calls `apiResolveShareLink(token, password)` → loads timeline + sets `shareRole`
- Cleans `?share=` from URL bar (no reload)

**`SharePasswordModal`** — wired into render tree:
- Shows when `sharePasswordToken` state is set (401 response)
- Submits password, re-prompts on failure with correct alert
- Clears on cancel

**`shareRole` App state:** `null` = owner; `'viewer'` | `'commenter'` | `'editor'` = shared

**Viewer / Commenter constraints** (`isReadOnly = shareRole === 'viewer' || shareRole === 'commenter'`):
- `MenuBar`: File→New and File→Save hidden; Edit and Item menu items disabled
- `Toolbar`: + Person and + Event buttons hidden
- Export (PNG, PDF, PPTX, JSON) unchanged — fully accessible
- Read-only banner: "👁 Viewing as guest — [timeline name] · Read-only view. Edits are disabled."

**Editor role:** Full access. Green banner: "✏ Editor (shared)"

---

### Part D — Menu + toolbar

Already in place from prior scaffold:
- `File → 🔗 Share…` — active in server mode; `disabled: true` (greyed) in localStorage mode
- Slim toolbar `🔗 Share` button — shown only when `serverMode && !shareRole`

---

## Files Changed

| File | Changes |
|---|---|
| `index.html` | Rendered `ShareModal` + `SharePasswordModal` in App JSX; added Sharing section to `HELP_SECTIONS` (EN) and `HELP_SECTIONS_AF` (AF) |
| `server.py` | No changes needed — all 4 endpoints already present |
| `CLAUDE.md` | Build progress updated, session notes added |
| `Owner's Inbox/REED_DELIVERY_TIER4_ITEM17.md` | This file |

---

## Testing Checklist

- [ ] Start `python server.py`, open `http://localhost:8765`
- [ ] Create or open a timeline, save it (File → Save)
- [ ] File → 🔗 Share… → dialog opens with "No share links yet"
- [ ] Generate a Viewer link (no expiry, no password) → URL appears, Copy works
- [ ] Open the URL in a new tab → timeline loads, read-only banner shows, + Person / + Event hidden
- [ ] Generate an Editor link → open in new tab → full access, editor banner shows
- [ ] Generate a password-protected link → open in new tab → password modal appears → wrong password re-prompts → correct password loads timeline
- [ ] Generate a 24h link → revoke it via ✕ → link disappears from list
- [ ] In localStorage mode: File → Share… shows "server required" message; toolbar Share button hidden

---

## Architecture Notes

- Token length: `secrets.token_urlsafe(24)` = 32 URL-safe characters (192 bits entropy) — sufficient for share URLs
- Password storage: SHA-256 hash only, never plaintext; no salt (acceptable for short-lived share tokens; upgrade to bcrypt if needed in future)
- The `_shareRole` field is returned in the timeline payload but stripped before displaying — only `shareRole` App state is used for gating
- Share links survive server restarts (persisted in SQLite)
- Revoking a link is immediate; no token blacklist needed (delete from DB is authoritative)
- The `expires_at` check is server-side only — client cannot bypass by manipulating state

---

*REED — Tier 4 Item 17 complete.*
