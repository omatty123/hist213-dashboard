#!/usr/bin/env node
/**
 * Platebook Generator
 * Generates printable worksheet HTML files from plate JSON data
 *
 * Usage:
 *   node generate-platebook.js           # Generate all plates
 *   node generate-platebook.js 6         # Generate plate 6 only
 *   node generate-platebook.js 6 7 8     # Generate plates 6, 7, 8
 */

const fs = require('fs');
const path = require('path');

const PREP_DIR = path.join(__dirname, '..', 'prep');
const PRINT_DIR = __dirname;

// Format date for display (e.g., "Jan 17")
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

// Escape HTML
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Generate timeline ticks HTML
function generateTimelineTicks(count) {
  return Array(count).fill('<div class="tick"></div>').join('\n        ');
}

// Generate timeline labels HTML
function generateTimelineLabels(timeline) {
  if (!timeline || timeline.length === 0) return '';
  return timeline.map(t =>
    `<span>${esc(t.date)}<br><em>${esc(t.event)}</em></span>`
  ).join('\n        ');
}

// Generate PPT table rows
function generatePPTRows(ppt) {
  if (!ppt) return '<tr><td></td><td></td><td></td></tr>';

  const people = ppt.people || [];
  const places = ppt.places || [];
  const things = ppt.things || [];
  const maxRows = Math.max(people.length, places.length, things.length, 3);

  let rows = '';
  for (let i = 0; i < maxRows; i++) {
    const person = people[i] || '';
    const place = places[i] || '';
    const thing = things[i] || '';

    // Split on " - " or " — " to get term and description
    const formatCell = (text) => {
      if (!text) return '';
      const match = text.match(/^([^—-]+)[—-]\s*(.*)$/);
      if (match) {
        return `<strong>${esc(match[1].trim())}</strong> — ${esc(match[2].trim())}`;
      }
      return esc(text);
    };

    rows += `      <tr>
        <td class="filled">${formatCell(person)}</td>
        <td class="filled">${formatCell(place)}</td>
        <td class="filled">${formatCell(thing)}</td>
      </tr>\n`;
  }
  return rows;
}

// Generate questions rows
function generateQuestionsRows(questions) {
  if (!questions || questions.length === 0) {
    return `        <tr>
          <td class="q-num">1</td>
          <td class="question-cell"></td>
          <td class="answer-cell"></td>
        </tr>`;
  }

  return questions.slice(0, 2).map((q, i) => `        <tr>
          <td class="q-num">${i + 1}</td>
          <td class="question-cell filled">${esc(q.question)}</td>
          <td class="answer-cell filled">${esc(q.talkingPoints)}</td>
        </tr>`).join('\n');
}

// Generate connections content
function generateConnectionsContent(connections, plate) {
  if (!connections) return '';

  let content = '';
  if (connections.fromPrevious) {
    content += `<strong>From Plate ${plate - 1}:</strong> ${esc(connections.fromPrevious)}<br>\n`;
  }
  if (connections.broaderThemes) {
    content += `<strong>Context:</strong> ${esc(connections.broaderThemes)}<br>\n`;
  }
  if (connections.toNext) {
    content += `<strong>To Plate ${plate + 1}:</strong> ${esc(connections.toNext)}`;
  }
  return content;
}

// Generate teaching notes content
function generateNotesContent(notes) {
  if (!notes || notes.length === 0) return '';
  return notes.slice(0, 5).map(n => `• ${esc(n)}`).join('<br>\n              ');
}

// Generate map section content
function generateMapContent(data) {
  const map = data.map;
  const keyPassages = data.keyPassages || [];

  let quote = '';
  if (keyPassages.length > 0) {
    quote = `"${esc(keyPassages[0].quote)}"`;
    if (keyPassages[0].source) {
      quote += ` — ${esc(keyPassages[0].source)}`;
    }
  }

  // Check for map image
  const mapImage = map?.image || 'asia-map-blank.png';

  // If map is pre-labeled, no markers or legend needed
  if (map?.labeled) {
    return { mapImage, markersHtml: '', legendHtml: '', quote };
  }

  // Generate markers if locations have coordinates
  let markersHtml = '';
  let legendHtml = '';
  if (map && map.locations && map.locations.length > 0) {
    const locsWithCoords = map.locations.filter(loc => loc.top && loc.left);
    if (locsWithCoords.length > 0) {
      markersHtml = locsWithCoords.map((loc, i) =>
        `<span class="map-marker" style="top: ${loc.top}; left: ${loc.left};">${i + 1}</span>`
      ).join('\n        ');
      legendHtml = `<div class="map-legend">
        ${locsWithCoords.map((loc, i) =>
          `<div class="legend-item"><span class="legend-num">${i + 1}</span> <strong>${esc(loc.name)}</strong>${loc.nameChinese ? ` (${esc(loc.nameChinese)})` : ''}</div>`
        ).join('\n        ')}
      </div>`;
    } else {
      // Fallback to text-only locations
      legendHtml = `<div class="map-locations">
        ${map.locations.slice(0, 6).map(loc =>
          `<div class="map-loc"><strong>${esc(loc.name)}</strong>${loc.nameChinese ? ` (${esc(loc.nameChinese)})` : ''} — ${esc(loc.description || '')}</div>`
        ).join('\n        ')}
      </div>`;
    }
  }

  return { mapImage, markersHtml, legendHtml, quote };
}

// Main template
function generateHTML(data) {
  const plate = data.plate;
  const topic = data.topic || `Plate ${plate}`;
  const date = formatDate(data.date);
  const timeline = data.timeline || [];
  const mapContent = generateMapContent(data);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Platebook - Plate ${plate}: ${esc(topic)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: A4; margin: 8mm; }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: 11px;
      line-height: 1.35;
      padding: 8mm;
      max-width: 210mm;
      margin: 0 auto;
      background: #fff;
    }

    /* Header row */
    .header {
      display: flex;
      margin-bottom: 5px;
    }
    .plate-num {
      border: 1.5px solid #000;
      padding: 4px 10px;
      font-weight: 700;
      font-size: 12px;
    }
    .topic {
      flex: 1;
      border: 1.5px solid #000;
      border-left: none;
      padding: 4px 16px;
      font-weight: 700;
      font-size: 12px;
      text-align: center;
    }
    .date {
      border: 1.5px solid #000;
      border-left: none;
      padding: 4px 10px;
      font-weight: 700;
      font-size: 12px;
    }

    /* Section labels */
    .label {
      border: 1px solid #000;
      border-radius: 8px;
      padding: 1px 8px;
      font-weight: 600;
      font-size: 10px;
      display: inline-block;
      margin-bottom: 3px;
      background: #fff;
    }

    /* Person/Place/Thing table */
    .ppt-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 4px;
    }
    .ppt-table th {
      border: 1px solid #000;
      border-radius: 8px;
      padding: 2px 8px;
      font-weight: 600;
      font-size: 10px;
      text-align: left;
      background: #fff;
      width: 33.33%;
    }
    .ppt-table td {
      border: 1px solid #aaa;
      padding: 4px 6px;
      font-size: 10px;
      vertical-align: top;
      height: 20px;
      background-color: #fefdfb;
      background-image:
        linear-gradient(rgba(176, 161, 142, 0.08) 1px, transparent 1px),
        linear-gradient(90deg, rgba(176, 161, 142, 0.08) 1px, transparent 1px),
        linear-gradient(rgba(176, 161, 142, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(176, 161, 142, 0.05) 1px, transparent 1px);
      background-size: 50px 50px, 50px 50px, 10px 10px, 10px 10px;
    }

    /* Timeline */
    .timeline-section {
      margin-bottom: 4px;
    }
    .timeline-box {
      border: 1px solid #aaa;
      padding: 6px 16px;
      height: 78px;
      position: relative;
      background-color: #fefdfb;
    }
    .timeline-line {
      position: absolute;
      bottom: 24px;
      left: 16px;
      right: 16px;
      height: 2px;
      background: #333;
    }
    .timeline-ticks {
      position: absolute;
      bottom: 24px;
      left: 16px;
      right: 16px;
      display: flex;
      justify-content: space-between;
    }
    .tick {
      width: 2px;
      height: 12px;
      background: #333;
    }
    .timeline-labels {
      position: absolute;
      bottom: 32px;
      left: 16px;
      right: 16px;
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      text-align: center;
    }
    .timeline-labels span {
      max-width: 90px;
      line-height: 1.3;
    }

    /* Map */
    .map-section {
      margin-bottom: 4px;
    }
    .map-container {
      display: flex;
      gap: 8px;
      margin-top: 3px;
    }
    .map-box {
      position: relative;
      border: 1px solid #aaa;
      background: #f5f5f5;
      flex: 1;
      min-height: 140px;
      overflow: hidden;
    }
    .map-box img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }
    .map-marker {
      position: absolute;
      width: 16px;
      height: 16px;
      background: #c00;
      color: #fff;
      border-radius: 50%;
      font-size: 10px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: translate(-50%, -50%);
      border: 1px solid #fff;
      box-shadow: 0 1px 2px rgba(0,0,0,0.3);
    }
    .map-legend {
      width: 180px;
      font-size: 9px;
      padding: 4px;
      border: 1px solid #aaa;
      background: #fefdfb;
    }
    .legend-item {
      margin-bottom: 3px;
      line-height: 1.3;
    }
    .legend-num {
      display: inline-block;
      width: 14px;
      height: 14px;
      background: #c00;
      color: #fff;
      border-radius: 50%;
      font-size: 9px;
      font-weight: 700;
      text-align: center;
      line-height: 14px;
      margin-right: 4px;
    }
    .map-locations {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      font-size: 9px;
      padding: 8px;
    }
    .map-loc strong { font-weight: 600; }
    .map-quote {
      font-style: italic;
      font-size: 9px;
      text-align: center;
      color: #444;
      margin-top: 4px;
    }

    /* Questions table */
    .questions-section {
      margin-bottom: 4px;
    }
    .questions-table {
      width: 100%;
      border-collapse: collapse;
    }
    .questions-table th {
      border: 1px solid #000;
      border-radius: 8px;
      padding: 2px 8px;
      font-weight: 600;
      font-size: 10px;
      text-align: left;
      background: #fff;
    }
    .questions-table th:last-child {
      width: 45%;
    }
    .questions-table td {
      border: 1px solid #aaa;
      padding: 4px 6px;
      font-size: 10px;
      vertical-align: top;
      background-color: #fefdfb;
      background-image:
        linear-gradient(rgba(176, 161, 142, 0.08) 1px, transparent 1px),
        linear-gradient(90deg, rgba(176, 161, 142, 0.08) 1px, transparent 1px),
        linear-gradient(rgba(176, 161, 142, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(176, 161, 142, 0.05) 1px, transparent 1px);
      background-size: 50px 50px, 50px 50px, 10px 10px, 10px 10px;
    }
    .questions-table .q-num {
      width: 18px;
      font-weight: 700;
      text-align: center;
      background: none;
    }
    .question-cell {
      min-height: 32px;
    }
    .answer-cell {
      min-height: 32px;
    }

    /* Bottom section */
    .bottom-section {
      display: flex;
      gap: 6px;
    }
    .causes-box, .notes-box {
      flex: 1;
    }
    .bottom-table {
      width: 100%;
      border-collapse: collapse;
    }
    .bottom-table th {
      border: 1px solid #000;
      border-radius: 8px;
      padding: 2px 6px;
      font-weight: 600;
      font-size: 9px;
      text-align: left;
      background: #fff;
    }
    .bottom-table td {
      border: 1px solid #aaa;
      padding: 4px 6px;
      font-size: 9px;
      vertical-align: top;
      height: 70px;
      background-color: #fefdfb;
      background-image:
        linear-gradient(rgba(176, 161, 142, 0.08) 1px, transparent 1px),
        linear-gradient(90deg, rgba(176, 161, 142, 0.08) 1px, transparent 1px),
        linear-gradient(rgba(176, 161, 142, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(176, 161, 142, 0.05) 1px, transparent 1px);
      background-size: 50px 50px, 50px 50px, 10px 10px, 10px 10px;
    }

    /* Filled content styling */
    .filled {
      color: #000;
      font-size: 10px;
      line-height: 1.4;
    }
    .filled strong {
      font-weight: 600;
    }

    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="plate-num">Plate # ${plate}</div>
    <div class="topic">${esc(topic)}</div>
    <div class="date">${date}</div>
  </div>

  <!-- Person / Place / Thing -->
  <table class="ppt-table">
    <thead>
      <tr>
        <th><span class="label">Person</span></th>
        <th><span class="label">Place</span></th>
        <th><span class="label">Thing</span></th>
      </tr>
    </thead>
    <tbody>
${generatePPTRows(data.peopleplacesthings)}
    </tbody>
  </table>

  <!-- Timeline -->
  <div class="timeline-section">
    <span class="label">Timeline${timeline.length > 0 ? `: ${esc(data.topic)}` : ''}</span>
    <div class="timeline-box">
      <div class="timeline-labels">
        ${generateTimelineLabels(timeline)}
      </div>
      <div class="timeline-line"></div>
      <div class="timeline-ticks">
        ${generateTimelineTicks(timeline.length || 5)}
      </div>
    </div>
  </div>

  <!-- Map -->
  <div class="map-section">
    <span class="label">Map</span>
    <div class="map-container">
      <div class="map-box">
        <img src="${mapContent.mapImage}" alt="Map">
        ${mapContent.markersHtml}
      </div>
      ${mapContent.legendHtml}
    </div>
    ${mapContent.quote ? `<div class="map-quote">${mapContent.quote}</div>` : ''}
  </div>

  <!-- Penetrating Questions -->
  <div class="questions-section">
    <table class="questions-table">
      <thead>
        <tr>
          <th colspan="2"><span class="label">Penetrating Questions</span></th>
          <th><span class="label">Very short answers</span></th>
        </tr>
      </thead>
      <tbody>
${generateQuestionsRows(data.keyQuestions)}
      </tbody>
    </table>
  </div>

  <!-- Bottom: Causes/Effects + Notes -->
  <div class="bottom-section">
    <div class="causes-box">
      <table class="bottom-table">
        <thead>
          <tr><th><span class="label">Causes / Effects / Connections</span></th></tr>
        </thead>
        <tbody>
          <tr>
            <td class="filled">
              ${generateConnectionsContent(data.connections, plate)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="notes-box">
      <table class="bottom-table">
        <thead>
          <tr><th><span class="label">Notes</span></th></tr>
        </thead>
        <tbody>
          <tr>
            <td class="filled">
              ${generateNotesContent(data.teachingNotes)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

</body>
</html>
`;
}

// Generate platebook for a specific plate
function generatePlatebook(plateNum) {
  const jsonPath = path.join(PREP_DIR, `execsummary-${plateNum}.json`);

  if (!fs.existsSync(jsonPath)) {
    console.error(`  ✗ execsummary-${plateNum}.json not found`);
    return false;
  }

  try {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const html = generateHTML(data);
    const outPath = path.join(PRINT_DIR, `platebook-${plateNum}.html`);
    fs.writeFileSync(outPath, html);
    console.log(`  ✓ Generated platebook-${plateNum}.html`);
    return true;
  } catch (err) {
    console.error(`  ✗ Error generating plate ${plateNum}:`, err.message);
    return false;
  }
}

// Main
function main() {
  const args = process.argv.slice(2);

  let plates;
  if (args.length > 0) {
    plates = args.map(n => parseInt(n, 10)).filter(n => !isNaN(n) && n >= 1 && n <= 25);
  } else {
    plates = Array.from({ length: 25 }, (_, i) => i + 1);
  }

  console.log('Platebook Generator');
  console.log('===================');
  console.log(`Generating ${plates.length} platebook(s)...\n`);

  let success = 0;
  let failed = 0;

  for (const p of plates) {
    if (generatePlatebook(p)) {
      success++;
    } else {
      failed++;
    }
  }

  console.log(`\nDone: ${success} succeeded, ${failed} failed`);
}

main();
