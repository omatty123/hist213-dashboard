#!/usr/bin/env python3
"""
QA Inspector for hist213-dashboard.
Run after every change. Catches slop before the user does.

Usage: python3 qa-inspector.py [--fix]
"""

import os
import re
import json
import glob
import sys

REPO = os.path.dirname(os.path.abspath(__file__))
PRINT_DIR = os.path.join(REPO, "print")
PREP_DIR = os.path.join(REPO, "prep")

ISSUES = []  # (severity, file, message)


def issue(severity, filepath, msg):
    short = os.path.relpath(filepath, REPO)
    ISSUES.append((severity, short, msg))


def check_platebooks():
    """Check all platebook HTML files for common problems."""
    for f in sorted(glob.glob(os.path.join(PRINT_DIR, "platebook-*.html"))):
        name = os.path.basename(f)
        with open(f, "r") as fh:
            content = fh.read()

        # OLD TIMELINE: absolute positioned with fixed height
        if "height: 78px" in content and "timeline-box" in content:
            issue("CRITICAL", f, "Old timeline pattern (height:78px, absolute positioning). Use flexbox tl-row/tl-event.")

        # EMPTY MAP: map-box with no content
        if re.search(r'<div class="map-box">\s*\n?\s*</div>', content):
            issue("CRITICAL", f, "Empty map box. Must use Leaflet with real coordinates.")

        # MAP WITHOUT LEAFLET: has map content but no leaflet include
        if "map-box" in content or 'id="' in content and "map" in content:
            if "leaflet" not in content.lower() and "L.map" not in content:
                # Check if it's truly a map section (not just a CSS class reference)
                if re.search(r'<div id="[^"]*map[^"]*"', content):
                    issue("WARNING", f, "Map div found but no Leaflet.js included.")

        # MISSING CJK FONTS: has CJK characters but no Noto Sans include
        if re.search(r'[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]', content):
            if "Noto Sans" not in content and "fonts.googleapis.com" not in content:
                issue("MINOR", f, "CJK characters present but no Noto Sans font include.")

        # WIKIMEDIA HOTLINKS: blocked by Wikimedia
        if "upload.wikimedia.org" in content:
            issue("CRITICAL", f, "Wikimedia Commons hotlink (will 404). Use local images.")

        # EMOJI GRADIENT PLACEHOLDER: fake image
        if re.search(r'background:\s*linear-gradient.*emoji', content, re.IGNORECASE):
            issue("CRITICAL", f, "CSS gradient + emoji as image placeholder. Use real images.")

        # CENTERED TEXT (layout rule violation)
        centered = re.findall(r'text-align:\s*center', content)
        # Allow in small contexts (labels, map markers, timeline events) but flag if excessive
        if len(centered) > 8:
            issue("MINOR", f, f"Excessive text-align:center ({len(centered)} instances). Check layout rules.")

        # BROKEN LOCAL IMAGE REFS
        for m in re.finditer(r'(?:src|url)\s*[=\(]\s*["\']?(images/[^"\')\s]+)', content):
            img_path = os.path.join(PRINT_DIR, m.group(1))
            if not os.path.exists(img_path):
                issue("WARNING", f, f"Broken local image ref: {m.group(1)}")

        # EM DASH OVERUSE
        em_dashes = content.count("\u2014") + content.count(" — ")
        if em_dashes > 10:
            issue("MINOR", f, f"Em dash overuse ({em_dashes} instances). Use periods, commas, colons.")


def check_prep_jsons():
    """Check exec summary JSONs for completeness."""
    for f in sorted(glob.glob(os.path.join(PREP_DIR, "execsummary-*.json"))):
        name = os.path.basename(f)
        try:
            with open(f, "r") as fh:
                data = json.load(fh)
        except json.JSONDecodeError:
            issue("CRITICAL", f, "Invalid JSON.")
            continue

        # Empty or missing executive summary
        summary = data.get("executiveSummary", "") or data.get("overallSynthesis", "")
        if not summary or len(summary) < 50:
            issue("WARNING", f, "Executive summary missing or too short.")

        # Empty keywords
        if not data.get("keywords"):
            issue("MINOR", f, "No keywords defined.")

        # Empty key questions
        if not data.get("keyQuestions"):
            issue("MINOR", f, "No key questions defined.")

        # Empty timeline
        if not data.get("timeline"):
            issue("MINOR", f, "No timeline events defined.")


def check_dashboard():
    """Check index.html for structural issues."""
    idx = os.path.join(REPO, "index.html")
    if not os.path.exists(idx):
        issue("CRITICAL", idx, "index.html not found!")
        return

    with open(idx, "r") as f:
        content = f.read()

    # LINKS IN MAIN CONTENT: webLinks should only appear in sidebar
    # Check if webLinks are rendered in renderMainWithPrep
    main_func = re.search(r'function renderMainWithPrep\(.*?\nfunction ', content, re.DOTALL)
    if main_func:
        main_body = main_func.group(0)
        if "webLinks" in main_body and "sidebar" not in main_body.lower():
            # Only flag if it's actually rendering them (not just a comment)
            if re.search(r'p\.webLinks.*h\s*\+=', main_body):
                issue("CRITICAL", idx, "webLinks rendered in main content area instead of sidebar.")

    # Check that all plates referenced in JS exist as prep files
    plate_nums = re.findall(r'\{plate:(\d+)', content)
    for pn in plate_nums:
        prep_file = os.path.join(PREP_DIR, f"execsummary-{pn}.json")
        if not os.path.exists(prep_file):
            issue("MINOR", idx, f"Plate {pn} has no exec summary JSON (prep/execsummary-{pn}.json).")

    # Check for plates with webLinks that also have hardcoded sidebar deep dives (duplication)
    weblink_plates = set(re.findall(r'\{plate:(\d+)[^}]*webLinks:', content))
    hardcoded_sidebar = set(re.findall(r'p\.plate\s*===\s*(\d+)', content))
    dupes = weblink_plates & hardcoded_sidebar
    if dupes:
        for d in sorted(dupes, key=int):
            issue("WARNING", idx, f"Plate {d} has both webLinks AND hardcoded sidebar deep dives. Possible duplication.")


def check_missing_platebooks():
    """Ensure all 25 plates have platebook files."""
    for i in range(1, 26):
        pb = os.path.join(PRINT_DIR, f"platebook-{i}.html")
        if not os.path.exists(pb):
            issue("WARNING", pb, f"Platebook {i} does not exist.")


def check_broken_links_in_plates():
    """Check that local file references in plate config actually exist."""
    idx = os.path.join(REPO, "index.html")
    if not os.path.exists(idx):
        return

    with open(idx, "r") as f:
        content = f.read()

    # Find all local URLs in webLinks and sidebar
    for m in re.finditer(r'url:\s*"(print/[^"]+)"', content):
        ref = m.group(1)
        full = os.path.join(REPO, ref)
        if not os.path.exists(full):
            issue("CRITICAL", idx, f"Broken local link: {ref} (file does not exist).")

    # Same for hardcoded sidebar href
    for m in re.finditer(r'href="(print/[^"]+)"', content):
        ref = m.group(1)
        full = os.path.join(REPO, ref)
        if not os.path.exists(full):
            issue("CRITICAL", idx, f"Broken sidebar link: {ref} (file does not exist).")


def report():
    """Print the report."""
    if not ISSUES:
        print("\n  ALL CLEAR. No issues found.\n")
        return 0

    crits = [i for i in ISSUES if i[0] == "CRITICAL"]
    warns = [i for i in ISSUES if i[0] == "WARNING"]
    minors = [i for i in ISSUES if i[0] == "MINOR"]

    print(f"\n  QA INSPECTOR REPORT")
    print(f"  {'='*60}")
    print(f"  {len(crits)} critical | {len(warns)} warnings | {len(minors)} minor\n")

    for severity in ["CRITICAL", "WARNING", "MINOR"]:
        items = [i for i in ISSUES if i[0] == severity]
        if items:
            label = {"CRITICAL": "CRITICAL", "WARNING": "WARNING", "MINOR": "MINOR"}[severity]
            print(f"  [{label}]")
            for _, filepath, msg in items:
                print(f"    {filepath}: {msg}")
            print()

    return 1 if crits else 0


def main():
    print("  Running QA Inspector on hist213-dashboard...")

    check_platebooks()
    check_prep_jsons()
    check_dashboard()
    check_missing_platebooks()
    check_broken_links_in_plates()

    exit_code = report()
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
