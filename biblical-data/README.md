# Biblical Genealogy Data — Timeline App Import Files

Three CSV files ready for import into the Timeline app.

---

## Files

### 01-adam-to-12-tribes-people.csv
**53 people** — Adam to Moses, following the main covenant line.

Covers:
- Antediluvian patriarchs (Adam through Noah)
- Noah's three sons (Shem, Ham, Japheth)
- Post-flood Shemite line to Abraham (Arphaxad through Terah)
- The Covenant family (Abraham, Sarah, Hagar, Isaac, Rebekah, Jacob, Leah, Rachel, Bilhah, Zilpah)
- Jacob's 12 sons (the 12 Tribes)
- The Moses/Aaron branch (Kohath, Amram, Jochebed, Miriam, Aaron, Moses)

### 02-table-of-nations-people.csv
**73 people** — Genesis 10 Table of Nations (all 70 named nations plus Noah, Shem, Ham, Japheth as anchors).

Covers:
- Japheth's 7 sons and 7 grandsons (Indo-European/northern peoples)
- Ham's 4 sons, their descendants, and all 11 sons of Canaan (African/Canaanite/Egyptian peoples)
- Shem's 5 sons, Aram's 4 sons, and Joktan's 13 sons (Semitic/Arabian peoples)

### 03-key-events.csv
**16 events** — Major biblical milestones from Creation to the giving of the Law.

---

## How to Import

1. Open the Timeline app (`http://localhost:8765` or open `index.html`)
2. Create or open a timeline
3. Go to **File → Import CSV…** (or press the Import button in the Data view)
4. **Import people first** — select the People tab, then drag-and-drop or pick the people CSV file
5. Choose **Merge** (to add to existing data) or **Replace** (to start fresh)
6. Click **Import**
7. Repeat steps 3–6 for the events CSV, using the Events tab
8. Switch to any view (Horizontal, Vertical, Flow) to see the data

**Tip:** Import `01-adam-to-12-tribes-people.csv` before `03-key-events.csv` so the people references in the events file resolve correctly.

---

## Chronology Notes

All dates use the **Ussher Chronology** (Bishop James Ussher, *Annales Mundi*, 1658), which assigns Creation to 4004 BC.

**Anno Mundi (AM) to BC conversion:** `BC year = 4004 − AM year`
Example: AM 1 = 4004 BC, AM 1656 = 2348 BC (the Flood)

**App date format:** Dates are stored as plain integers.
- BC dates: negative integers (e.g. 4004 BC = `-4004`)
- AD dates: positive integers (e.g. 33 AD = `33`)
- Unknown dates: `0`

**Approximations:** Where Ussher gives no explicit date (e.g. Ham, Japheth, wives, and most Table of Nations descendants), approximate dates are assigned based on generational position relative to the Flood (~2348 BC). These are marked with `0` for death when unknown.

**Table of Nations generations:**
- Direct sons of Noah: birth ~2300 BC
- Grandsons of Noah: birth ~2250 BC
- Great-grandsons of Noah: birth ~2200 BC
