# Fly High, Run Far: Viewing Guide Design Notes

A design audit and improvement roadmap for `fly-high-run-far-viewing-guide.html`.

---

## What This Page Is

A scene-by-scene viewing guide for Im Kwon-taek's 1991 film *Fly High, Run Far* (개벽), built for HIST/EAST 213 students at a small liberal arts college. 61 scene cards, each with a film screenshot, Korean on-screen text, English title, optional dialogue, and scholarly context. Plus five reference sections: interactive map, timeline, cast of characters, narrative arcs with a scene-map visualization, and a 39-term glossary.

**The audience**: 7 undergraduates, most with no Korean, watching a 3-hour subtitled film about 19th-century religious history. The page needs to be a companion they can scroll through during or after viewing, not a reference they consult once.

---

## Asset Map

### File Structure
```
hist213-dashboard/
  print/
    fly-high-run-far-viewing-guide.html   (2,533 lines, single-file)
    fly-high-run-far-deep-dive.html       (companion essay, linked)
    images/
      fly-high-run-far/
        scene-01-choe-cheu-teaching.png   through
        scene-61-son-and-wives.png        (61 PNG screenshots)
        still-01.jpg                       (1 header still)
```

### By the Numbers
| Asset | Count | Notes |
|-------|-------|-------|
| Scene cards | 61 | Alternating image L/R layout |
| Scene images | 62 | 61 PNGs + 1 JPG. All RGBA, 2000-2800px wide |
| Total image weight | **94 MB** | Uncompressed PNGs. Largest: 3.7 MB |
| Glossary terms | 39 | 2-column grid |
| Cast cards | 13 | 3-column grid, 4 sections |
| Narrative arc cards | 6 | Color-coded, with scene-map grid |
| Timeline boxes | 3 | Flexbox rows (1860-71, 1876-93, 1894-98) |
| Map markers | 16 | Leaflet.js, CartoDB Voyager tiles |
| CSS classes | 56 | All used, none orphaned |
| Inline styles | 84 | Mostly scene-map color coding |
| External deps | 3 | Google Fonts, Leaflet CSS, Leaflet JS |
| Breakpoints | 1 | 800px only |

### Color System
**Page chrome**: `#3a6b4a` (forest green accent), `#2d4a38` (nav), `#f5f2ec` (bg), `#2a2a28` (text), `#eae6de` (footer)

**Arc colors** (inline only, not in CSS variables):
- Gold `#c9a227` (Faith)
- Red `#e74c3c` (State)
- Blue `#6c8ebf` (Underground)
- Green `#2ecc71` (World Arrives)
- Orange `#e67e22` (Human Cost)
- Purple `#9b59b6` (Uprising)

### Typography
- **Body**: Crimson Pro 17px, line-height 1.7 (serif, literary)
- **UI/Labels**: Inter (sans-serif, all weights 400-700)
- **Korean text**: Noto Sans KR (400, 700)
- All loaded from Google Fonts CDN

---

## The Real Design Problems

### 1. 94 MB of Images, Zero Optimization

The single most urgent problem. Every image is a full-resolution RGBA PNG screenshot (2000-2800px wide, 1-3.7 MB each). On first load, a student's browser has to download 94 MB before the page is complete.

**What's wrong:**
- PNG format with alpha channel (RGBA) when no transparency is needed. These are opaque film screenshots.
- No `loading="lazy"` on any `<img>` tag. All 61 images load immediately.
- No `srcset` or responsive image sizing. A phone downloads the same 2774px image as a desktop.
- No compression whatsoever.

**What to do:**
- Convert all PNGs to WebP (or JPEG at quality 85). Expected savings: 94 MB to ~8-12 MB.
- Add `loading="lazy"` to every `<img>` except the first 3-4 scenes.
- Add `width` and `height` attributes to prevent layout shift.
- Optionally generate 800px-wide variants for mobile (`srcset`).

### 2. No Internal Navigation

61 scenes across 14 acts, plus 5 reference sections, in a single scroll. There is no way to jump to a specific scene, act, or section. The only nav is a sticky bar with "Dashboard" and "Film Deep Dive."

**What's wrong:**
- A student who wants to re-read Scene 47 has to scroll through 46 scenes to find it.
- No anchor IDs on act breaks or scene cards.
- No table of contents or section index.
- No "back to top" affordance.

**What to do:**
- Add `id` attributes to each act break (e.g., `id="act-ix"`) and each scene card (e.g., `id="scene-42"`).
- Build a compact TOC, either as a collapsible sidebar or a dropdown in the sticky nav. Acts and reference sections as entries, scenes as sub-entries.
- Add a floating "back to top" button or keyboard shortcut.
- Consider adding act/scene to the URL hash on scroll (`#scene-42`) so students can share links to specific scenes.

### 3. The Glossary Is at the Bottom

39 Korean terms, defined in a grid at the very end of the page. A student encountering 시천주 in Scene 1 has to scroll past 60 more scenes, a map, a timeline, a cast section, and a narrative arcs section to find the definition.

**What's wrong:**
- The glossary is useful but inaccessible during actual reading.
- Term links (`.term-link` class) point to external Wikipedia articles, not to the glossary itself.
- No tooltips, popovers, or inline definitions.

**What to do (pick one):**
- **Tooltip approach**: On hover/tap of any `.term-link`, show a popover with the glossary entry. Keeps the page clean, makes the glossary immediately useful.
- **Sidebar approach**: Float the glossary as a collapsible sidebar on desktop. Pin it. Let students read scenes and glossary simultaneously.
- **At minimum**: Link internal term references to their glossary entries with anchor IDs.

### 4. Scene Cards Don't Show Their Arc

The scene-map visualization at the bottom color-codes all 61 scenes by narrative arc. But when you're actually reading through the scene cards, every card looks identical: white background, green accent. There's no visual hint whether you're in a "Faith" scene or a "State" scene.

**What's wrong:**
- The arc information exists (it's in the scene map) but isn't surfaced where it matters (on the cards themselves).
- A student reading sequentially can't see the narrative weave. They only see it in the abstract visualization at the bottom.

**What to do:**
- Add a small arc badge to each scene card. A colored dot or pill with the arc name, matching the scene-map colors. Position it near the scene number.
- Or: tint the scene card border-left with the arc color (the way the arc-card component already does).
- Keep it subtle. The arc coding should be visible but not dominant.

### 5. The Map Is Disconnected from the Scenes

The Leaflet map appears once in the reference section. When reading about Paeksan in Scene 42, you can't see where Paeksan is without scrolling down to the map. The map markers reference scenes ("Scene 42-43") but scenes don't reference the map.

**What's wrong:**
- Location names in scene descriptions aren't linked to the map.
- The map popups are text-only, no way to jump from a popup to the scene.
- On a phone, the map is a separate scroll destination entirely.

**What to do:**
- Add a small "📍 Map" link next to each scene's location that scrolls to the map and opens the relevant popup.
- Or: add a mini-map (static image, SVG, or a small fixed Leaflet instance) in the page margin that highlights the current scene's location as you scroll.
- In map popups, make scene numbers clickable links back to the scene cards.

### 6. Single Breakpoint, No Print Stylesheet

One media query at 800px. No intermediate tablet breakpoint. No `@media print`.

**What's wrong:**
- On an iPad (1024px), the 2-column scene cards work but the 3-column cast grid is tight.
- If a student prints the page, they get the sticky nav, the interactive map (which prints as a grey box), and all 94 MB of images rendered at full size.
- The `direction: rtl` alternating layout may confuse screen readers.

**What to do:**
- Add a print stylesheet: hide nav, hide map (or replace with a static image), force single-column, add page breaks before act headings.
- Add an intermediate breakpoint (~1024px) for the cast and arcs grids.
- For accessibility: consider using CSS `order` instead of `direction: rtl` for the alternating card layout.

### 7. No Progressive Disclosure

All 61 scenes are rendered in the DOM at once. On a slow connection or older device, this is heavy. There's also no way to collapse or expand sections.

**What's wrong:**
- Long scroll fatigue. 61 identical-looking cards is a lot.
- Students who've already watched through Scene 30 have to scroll past familiar material.
- Act breaks exist visually but don't function as navigation anchors or collapsible sections.

**What to do:**
- Make acts collapsible. Click an act heading to expand/collapse its scenes. Default: all expanded (or: only the last unwatched act expanded).
- Or: add a "progress" feature. Student clicks a "Watched through Scene X" toggle, and earlier scenes collapse to title-only view.
- At minimum: put act numbers in the sticky nav that highlight as you scroll (scroll spy).

---

## What's Working Well

Not everything needs fixing. Some things are genuinely good:

- **The alternating layout** creates visual rhythm across 61 cards. It prevents the "wall of same" problem most scene-by-scene guides have.
- **Korean on-screen text as the scene label** is the right call. Students see the hangul, then the translation. The page teaches reading alongside viewing.
- **The narrative arc visualization** (scene map + colored grid) is a genuinely useful analytical tool. It makes the film's structure visible in a way the film itself can't.
- **The flexbox timeline** works cleanly across three historical periods. No fixed-height hacks, labels wrap naturally.
- **The forest/mountain color theme** suits the content. Donghak's geography was mountains, forests, rural Korea. The page's palette echoes that.
- **The cast section's grouping** (Leaders / Authority / Women / Supporters) maps to how the film actually organizes its characters, not to a generic alphabetical list.
- **The scholarly context** in each scene card is dense but not academic. It explains what students are seeing without lecturing.

---

## Priority Ranking

If you can only do three things:

1. **Compress images.** Convert to WebP, add `loading="lazy"`. This takes the page from unusable on mobile to functional. (Impact: massive. Effort: low.)

2. **Add internal navigation.** Anchor IDs on acts/scenes, a TOC in the sticky nav, scroll-to links. (Impact: high. Effort: medium.)

3. **Surface the glossary.** Tooltips on term links, or at minimum anchor-link them to the glossary entries. (Impact: high for non-Korean readers. Effort: medium.)

Everything else (arc badges on cards, map integration, print stylesheet, progressive disclosure) is genuinely valuable but secondary to these three.

---

## Technical Notes for Codex

- The file is a **single self-contained HTML page** with inline CSS and inline JS. No build system, no framework, no bundler. Changes are made directly to the HTML.
- **Deployment**: `git push` to `~/hist213-dashboard/` auto-deploys to GitHub Pages at `https://omatty123.github.io/hist213-dashboard/print/fly-high-run-far-viewing-guide.html`.
- **Image directory**: `~/hist213-dashboard/print/images/fly-high-run-far/` (62 files, 94 MB).
- **Companion page**: `fly-high-run-far-deep-dive.html` (linked from nav and footer).
- **Map library**: Leaflet 1.9.4 via unpkg CDN. Markers initialized in a `<script>` block at the end of `<body>`.
- **No JavaScript framework.** The only JS is the Leaflet map initialization (46 lines). Any interactivity (tooltips, collapsible sections, scroll spy) would need to be vanilla JS or a lightweight library.
- **The `direction: rtl` trick** on even scene cards flips the grid column order. This is CSS-only, no JS. But it means the DOM order is always image-then-text, and CSS reverses it visually for even cards.
- **Arc colors are hardcoded inline**, not in CSS custom properties or variables. Any arc-aware feature (badges, tinting) would need to either read from the scene map data or duplicate the color assignments.
- **After any change**: run `python3 ~/hist213-dashboard/qa-inspector.py` to check for broken links, orphaned pages, and em dash overuse.
