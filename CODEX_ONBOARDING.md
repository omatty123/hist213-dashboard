# HIST/EAST 213 Dashboard — Codex Onboarding

You're working on a teaching dashboard for a Modern East Asia history course. This doc tells you everything you need to operate independently.

---

## Quick Facts

- **Course**: HIST/EAST 213 — East Asia in the Modern World (Winter 2026)
- **Structure**: 25 "plates" (class sessions) across 10 weeks (Mon/Wed/Fri)
- **Students**: Susanna, Nik, Isabelle, Em, Eliel, Sam, Cole
- **Term**: January 5 – March 13, 2026

---

## Project Structure

```
~/.claude/teaching/dashboard/
├── index.html              # Main instructor dashboard
├── students.json           # Student roster data
├── prep/
│   └── execsummary-N.json  # Prep data for plate N (1-25)
├── print/
│   ├── platebook-N.html    # Printable worksheet for plate N
│   ├── *-deep-dive.html    # Enrichment/deep-dive pages
│   └── images/             # Local images for deep dives
└── enrichment/             # Additional enrichment materials
```

**GitHub repo**: `https://github.com/omatty123/hist213-dashboard`
**Live site**: `https://omatty123.github.io/hist213-dashboard/`

---

## The Two Main Artifacts

### 1. execsummary-N.json (Dashboard Data)

Location: `prep/execsummary-N.json`

The dashboard reads from these JSON files. Each contains:

```json
{
  "plate": 13,
  "topic": "Taiping and Other Rebellions",
  "date": "2026-02-04",
  "readings": ["Reading title 1", "Reading title 2"],
  "readingAnalyses": [
    {
      "title": "...",
      "summary": "...",
      "keyQuotes": [
        {
          "quote": "Exact text from source",
          "page": "p. 228",
          "verificationPath": "URL or PDF reference"
        }
      ]
    }
  ],
  "timeline": [
    { "date": "1851", "event": "Taiping uprising begins" }
  ],
  "map": {
    "center": [28, 114],
    "zoom": 5,
    "locations": [
      {
        "name": "Nanjing",
        "nameChinese": "南京",
        "lat": 32.05,
        "lng": 118.77,
        "type": "capital",
        "description": "Taiping capital 1853-1864"
      }
    ],
    "route": {
      "name": "Taiping Advance",
      "color": "#e63946",
      "points": [[lat, lng], [lat, lng], ...]
    }
  },
  "penetratingQuestions": [...],
  "connections": {...},
  "teachingNotes": [...]
}
```

### 2. platebook-N.html (Printable Worksheet)

Location: `print/platebook-N.html`

Standalone HTML files students use in class. Contains:
- Header with plate number, topic, date
- Person/Place/Thing table
- Timeline (visual)
- Leaflet map
- Penetrating questions
- Connections to previous/next plates
- Teaching notes

**Key features:**
- Self-contained (all CSS inline, Leaflet loaded from CDN)
- Print-optimized (`@media print` rules)
- Breadcrumb: `<a href="../index.html">← Dashboard</a>` (hidden when printing)

---

## Critical Rules

### 1. NEVER Fabricate Quotes or Page Numbers

Every quote needs:
- Exact verbatim text
- Real page number (not a year like "p. 1839")
- Verification path (Google Drive URL or PDF filename)

**If you can't verify a quote, don't include it.** Flag it instead.

### 2. ALWAYS Use Leaflet for Maps

Never use:
- CSS grid "maps"
- Fake positioned divs
- SVG approximations

Always use:
```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
```

Tile options:
- `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png` (dark theme)
- `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png` (light/print)

### 3. ALWAYS Push After Changes

```bash
cd ~/.claude/teaching/dashboard
git add <files>
git commit -m "Description"
git push
```

The live site won't update until you push.

### 4. Breadcrumbs on All Sub-Pages

Every platebook and deep-dive needs:
```html
<div class="breadcrumb"><a href="../index.html">← Dashboard</a></div>
```

With CSS to hide when printing:
```css
@media print {
  .breadcrumb { display: none; }
}
```

---

## Common Tasks

### Task: Update a timeline

1. Edit `prep/execsummary-N.json` → `timeline` array
2. Edit `print/platebook-N.html` → find `<!-- Timeline -->` section
3. Push both changes

### Task: Add a location to a map

1. Edit `prep/execsummary-N.json` → `map.locations` array:
```json
{
  "name": "City Name",
  "nameChinese": "中文",
  "lat": 32.05,
  "lng": 118.77,
  "type": "battle|capital|city|origin",
  "description": "Short description"
}
```

2. If it's on a route, add coordinates to `map.route.points`
3. Push

### Task: Create a new deep-dive page

1. Create `print/new-topic-deep-dive.html`
2. Use Leaflet for any maps
3. Add breadcrumb
4. Link from relevant platebook or execsummary
5. Push

### Task: Fix a merge conflict

```bash
cd ~/.claude/teaching/dashboard
git stash                    # Save local changes
git pull                     # Get remote
git stash pop                # Restore local
# Fix conflicts manually
git add .
git commit -m "Resolve conflict"
git push
```

---

## Location Types for Maps

| Type | Rendering | Use for |
|------|-----------|---------|
| `origin` | ★ star | Starting points, birthplaces |
| `capital` | Large circle with border | Capitals, major centers |
| `battle` | Red circle | Battles, sieges, captures |
| `city` | Gray circle | Other reference cities |

---

## Design Preferences

### Platebook Style
- Font: Georgia, Times New Roman, serif
- Field notes background (subtle grid pattern)
- Compact: fits on one A4 page when printed
- Tables: `border-collapse: collapse`, narrow as possible

### Color Palette
- Taiping red: `#e63946`
- Gold accent: `#fbbf24`
- Dark background: `rgba(10, 12, 16, 0.92)`
- Muted gray: `#64748b`

### CJK Fonts
```css
font-family: 'Noto Sans SC', 'Noto Sans JP', 'Noto Sans KR', sans-serif;
```

Include Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC&family=Noto+Sans+KR&family=Noto+Sans+JP&display=swap" rel="stylesheet">
```

---

## Plate Schedule Reference

| Plate | Date | Topic |
|-------|------|-------|
| 1 | Jan 5 | Introduction, Geography |
| 2 | Jan 7 | Language, Religion, Culture |
| 3 | Jan 9 | What is Modernity? |
| 4 | Jan 13 | Joseon Invaded |
| 5 | Jan 15 | Rise of Qing |
| 6 | Jan 16 | Qing & the West |
| 7 | Jan 21 | Joseon Reform |
| 8 | Jan 24 | Rise of Tokugawa |
| 9 | Jan 27 | Presentation Brainstorm |
| 10 | Jan 29 | Qing vs. the West |
| 11 | Jan 31 | Tokugawa vs. the West |
| 12 | Feb 3 | Meiji Transformation |
| 13 | Feb 4 | Taiping Rebellion |
| 14 | Feb 6 | Tonghak Rebellion |
| 15 | Feb 9 | Joseon's Slow Evolution |
| 16 | Feb 11 | Tonghak in Film |
| 17 | Feb 16 | Japanese Nationalism |
| 18 | Feb 18 | Korean Nationalism |
| 19 | Feb 20 | Chinese Nationalism |
| 20 | Feb 23 | Civil War & Revolution |
| 21 | Feb 25 | Pacific War |
| 22 | Feb 27 | Rebuilding Japan |
| 23 | Mar 2 | Mao and Beyond |
| 24 | Mar 4 | Korea Liberation/Division |
| 25 | Mar 6 | Japan Rises Again |

---

## File Locations

| What | Where |
|------|-------|
| Dashboard | `~/.claude/teaching/dashboard/` |
| Teaching CLAUDE.md | `~/.claude/teaching/CLAUDE.md` |
| Course readings PDFs | `~/Library/CloudStorage/GoogleDrive-omatty@gmail.com/My Drive/2026/2026 Winter EAST 213/` |
| Local prep notes | `~/Teaching/Prep` |

---

## Example: Full Platebook Map Script

```javascript
const map = L.map('map-id', { zoomControl: false, attributionControl: false });
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  subdomains: 'abcd', maxZoom: 10
}).addTo(map);

// Cities
const cities = [
  { name: "Nanjing", cn: "南京", lat: 32.05, lng: 118.77, color: "#f4a261", r: 7, desc: "Taiping capital" },
  { name: "Wuchang", cn: "武昌", lat: 30.55, lng: 114.35, color: "#e63946", r: 5, desc: "Captured 1853" }
];

cities.forEach(c => {
  L.circleMarker([c.lat, c.lng], {
    radius: c.r, fillColor: c.color, color: c.color, weight: 1, fillOpacity: 0.9
  }).addTo(map).bindPopup(`<b>${c.cn} ${c.name}</b><br>${c.desc}`);
});

// Route
const route = [[23.60, 110.11], [30.55, 114.35], [32.05, 118.77]];
L.polyline(route, { weight: 3, color: '#e63946' }).addTo(map);

// Fit bounds
map.fitBounds(L.latLngBounds(cities.map(c => [c.lat, c.lng])).pad(0.2));
```

---

## Historiographical Standards

**Avoid lazy comparisons.** "Japan modernized, China didn't" is wrong.

When comparing outcomes, address:
- Structural differences (scale, politics, elites)
- Obstacles to implementation (Taiping killed 20-30M during China's "reform window")
- Historical timing (Japan watched China's humiliation first)
- Different starting positions

**Never frame failure as moral/intellectual failing.** Ask: what made implementation possible in one context and impossible in another?

---

## Quick Commands

```bash
# Serve dashboard locally
cd ~/.claude/teaching/dashboard && python3 -m http.server 8081

# Check what needs pushing
cd ~/.claude/teaching/dashboard && git status

# Push everything
git add -A && git commit -m "Update" && git push

# View a specific plate's data
cat ~/.claude/teaching/dashboard/prep/execsummary-13.json | jq '.timeline'
```

---

## When in Doubt

1. Read the existing platebooks for patterns
2. Check `~/.claude/teaching/CLAUDE.md` for detailed rules
3. Always verify quotes before adding them
4. Always use Leaflet for maps
5. Always push after changes
