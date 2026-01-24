/**
 * Google Apps Script - Final Project Brainstorm Form Backend
 * Saves responses to sheet AND sends confirmation email to student
 *
 * SETUP: After pasting this code, click Deploy > New deployment > Web app
 * Set "Execute as" to "Me" and "Who has access" to "Anyone"
 */

const SHEET_NAME = 'Responses';
const INSTRUCTOR_EMAIL = 'omatty@gmail.com'; // Optional: get a copy too

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = getOrCreateSheet();

    // Add row with all form data
    sheet.appendRow([
      data.timestamp,
      data.name,
      data.email,
      data.date,
      data.selectedTopics,
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

    // Send confirmation email to student
    sendConfirmationEmail(data);

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
    sheet.appendRow([
      'Timestamp',
      'Name',
      'Email',
      'Date',
      'Selected Topics',
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
    sheet.getRange(1, 1, 1, 15).setFontWeight('bold').setBackground('#f3f4f6');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function sendConfirmationEmail(data) {
  const subject = 'HIST 213 Final Project Brainstorm - Your Response';

  const body = `
Hi ${data.name},

Here's a copy of your Final Project Brainstorm submission for HIST 213.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TOPICS THAT GRABBED YOU
${data.selectedTopics || '(none selected)'}

${data.grabbed || '(no response)'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

THREE POSSIBLE TOPICS

Idea 1:
${data.idea1 || '(no response)'}

Idea 2:
${data.idea2 || '(no response)'}

Idea 3:
${data.idea3 || '(no response)'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NARROW IT DOWN
${data.narrowDown || '(no response)'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FORMAT
${data.format || '(no response)'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

THE "SO WHAT?" TEST
${data.soWhat || '(no response)'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SOURCES
${data.sources || '(no response)'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

QUESTIONS FOR DISCUSSION
${data.questions || '(no response)'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EXIT CHECKLIST: ${data.checklist || '(none checked)'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Submitted: ${new Date(data.timestamp).toLocaleString()}

Keep this email for your records. Looking forward to discussing your project!

— 마선생님
`;

  // Send to student
  if (data.email) {
    MailApp.sendEmail({
      to: data.email,
      subject: subject,
      body: body
    });
  }

  // Optionally send copy to instructor
  if (INSTRUCTOR_EMAIL) {
    MailApp.sendEmail({
      to: INSTRUCTOR_EMAIL,
      subject: `[HIST 213] Brainstorm from ${data.name}`,
      body: `New brainstorm submission from ${data.name} (${data.email})\n\n` + body
    });
  }
}

// Test function
function testSetup() {
  const sheet = getOrCreateSheet();
  Logger.log('Sheet ready: ' + sheet.getName());
}
