---
from: PAX (Senior Researcher, LARRY team)
to: Owner
date: 2026-03-28
re: Timeline app — research findings and what we need to build next
---

# Research Summary — What the App Needs to Become World-Class

Here is what I found after reviewing the current app against every major class of timeline tool on the market.

**The app is further along than most competitors at this stage.** Six distinct views, rich media support, AI integration, era backgrounds, a working Electron build — this is genuinely impressive for a prototype. Most tools at this price point do one or two views. You are doing six.

**But the app currently serves one market well: visual biographical and historical timelines.** It does not yet serve genealogists, lawyers, project managers, journalists, scientists, or medical professionals — and those are where the money is.

**The five biggest gaps, in order of urgency:**

1. **Visual export (PNG, PDF, PowerPoint) is not built.** Every single competing tool has this. It is the first thing new users try and the first reason they leave. This should be the next thing that gets built, full stop.

2. **There is no source/citation system.** Every professional use case — legal, genealogy, journalism, history — requires that each fact be traceable to a document or source. Without this, serious researchers cannot use the app.

3. **localStorage is a dead end for storage.** Images stored as base64 will fill the browser's storage limit after about 15-20 photos. The SQLite backend planned for Stage 3 needs to move up the priority list, and the Electron build should write images to disk instead of embedding them in JSON.

4. **GEDCOM support would unlock the entire genealogy market overnight.** Genealogy is one of the largest hobbyist software markets in the world. GEDCOM is the universal file standard every genealogy app supports. Adding import/export would let users bring their existing family trees in and take them out again — and that is table stakes for that audience.

5. **The app needs a slide/narrative view to compete in the journalistic and educational markets.** Knight Lab's TimelineJS is free and used by 250,000+ organisations precisely because it presents one event as a full-screen card with big media. That format is what teachers, journalists, and presenters need.

**What kind of developer do you need to hire:**
A full-stack React + Python developer who has built data-export features before (PDF, PowerPoint, SVG). Experience with vis.js or D3 is a bonus. The person needs to be comfortable working in a large single-file codebase (for now) and then migrating it to a proper Vite/component structure as Stage 2 matures. A developer who has worked on a genealogy, legal, or project management tool would be ideal — those domains teach you the data model discipline this app needs next.

The full gap analysis with 28 specific items grouped by category is in the team folder: `team/PAX_TIMELINE_GAP_ANALYSIS.md`.

— PAX
