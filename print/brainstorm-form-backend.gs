/**
 * Google Apps Script - Final Project Brainstorm Form Backend
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a new Google Sheet for responses
 * 2. Go to Extensions > Apps Script
 * 3. Paste this entire code
 * 4. Click Deploy > New deployment
 * 5. Select "Web app"
 * 6. Set "Execute as" to "Me"
 * 7. Set "Who has access" to "Anyone"
 * 8. Click Deploy and copy the URL
 * 9. Paste the URL into final-project-brainstorm-form.html (line 483)
 */

// Sheet configuration
const SHEET_NAME = 'Responses';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = getOrCreateSheet();

    // Add row with all form data
    sheet.appendRow([
      data.timestamp,
      data.name,
      data.date,
      data.grabbed,
      data.idea1,
      data.idea2,
      data.idea3,
      data.narrowDown,
      data.format,
      data.soWhat,
      data.sources,
      data.questions,
      data.checklist
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Add headers
    sheet.appendRow([
      'Timestamp',
      'Name',
      'Date',
      'What Grabbed You',
      'Idea 1',
      'Idea 2',
      'Idea 3',
      'Narrow Down',
      'Format',
      'So What?',
      'Sources',
      'Questions',
      'Checklist'
    ]);
    // Format header row
    sheet.getRange(1, 1, 1, 13).setFontWeight('bold').setBackground('#f3f4f6');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

// Test function - run this to verify setup
function testSetup() {
  const sheet = getOrCreateSheet();
  Logger.log('Sheet ready: ' + sheet.getName());
  Logger.log('URL will be available after deployment');
}
