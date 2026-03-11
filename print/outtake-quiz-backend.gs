/**
 * Google Apps Script — EAST 213 Outtake Quiz Backend
 *
 * SETUP:
 * 1. Create a new Google Sheet (or use the one from the brainstorm form)
 * 2. Extensions > Apps Script
 * 3. Paste this code
 * 4. Click Deploy > New deployment > Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the deployment URL
 * 6. Paste it into outtake-quiz.html (the SCRIPT_URL variable at the top of the <script>)
 *
 * SENDING QUIZ LINKS:
 * - Run sendQuizLinks() from the script editor to email every student their personal link
 */

const SPREADSHEET_ID = '1ZT1WTjEu-SHEnI-vd6LiLV6jDY5gAWkzmbP4ri1lRWY';
const SHEET_NAME = 'Outtake Results';
const INSTRUCTOR_EMAIL = 'omatty@gmail.com';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // Generic sheet write: { action: "writeSheet", sheetName: "...", rows: [[...], ...], clear: true/false }
    if (data.action === 'writeSheet') {
      return writeToSheet(data);
    }

    // Default: outtake quiz submission
    const sheet = getOrCreateSheet();
    const correct = data.quizCorrect || [];
    const answers = data.quizAnswers || [];

    // Match intake format: Name, Q1 answer, Q1 grade, Q2 answer, Q2 grade, ..., TOTAL
    const row = [data.name];
    for (let i = 0; i < 10; i++) {
      row.push(answers[i] || '');
      row.push(correct[i] ? '✓' : '✗');
    }
    row.push(data.selfScore);

    sheet.appendRow(row);

    sendInstructorEmail(data);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Generic sheet writer. POST this JSON to write anything:
 * { "action": "writeSheet", "sheetName": "My Sheet", "rows": [["A1","B1"],["A2","B2"]], "clear": true }
 */
function writeToSheet(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(data.sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(data.sheetName);
  }
  if (data.clear) sheet.clear();
  if (data.rows && data.rows.length > 0) {
    sheet.getRange(1, 1, data.rows.length, data.rows[0].length).setValues(data.rows);
    // Bold header row
    sheet.getRange(1, 1, 1, data.rows[0].length).setFontWeight('bold').setBackground('#f3f4f6');
    sheet.setFrozenRows(1);
  }
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, sheet: data.sheetName, rows: data.rows.length }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'Timestamp', 'Name', 'Email', 'Self Score',
      'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10',
      'Correct/Incorrect'
    ]);
    sheet.getRange(1, 1, 1, 15).setFontWeight('bold').setBackground('#f3f4f6');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function sendInstructorEmail(data) {
  const questions = [
    'What cataclysmic event ended the 16th century in East Asia?',
    'Which empire was the world\'s largest economy in the 18th century?',
    'What Western nation forced Japan to open its ports in the 1850s?',
    'What European power fought the Opium Wars with China in the mid-nineteenth century?',
    'What was the name of the Korean dynasty that ruled the peninsula from 1392 until Japanese annexation in 1910?',
    'What event in 1868 marked the end of the Tokugawa shogunate and the beginning of rapid modernization in Japan?',
    'Name one major rebellion or revolution in nineteenth-century East Asia.',
    'Who were the two main parties fighting in the Chinese Civil War?',
    'What philosopher\'s re-interpretation of Confucianism created a cultural movement across East Asia that persists to this day?',
    'Which East Asian country had a movement calling for their country to "Escape Asia"?'
  ];

  const answerKey = [
    'Imjin War (Japanese invasion of Joseon)',
    'Qing Empire',
    'United States (Commodore Perry)',
    'Great Britain',
    'Joseon Dynasty',
    'Meiji Restoration',
    'Taiping Rebellion, Boxer Rebellion, Tonghak, etc.',
    'Chinese Communist Party (CPC) and Kuomintang (KMT)',
    'Zhu Xi (Neo-Confucianism)',
    'Japan (Datsu-A / "Escape Asia")'
  ];

  let body = `Outtake quiz from ${data.name}\n`;
  body += `Self-assessed score: ${data.selfScore}/10\n\n`;
  body += 'QUIZ ANSWERS\n';
  body += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';

  for (let i = 0; i < 10; i++) {
    body += `\n${i + 1}. ${questions[i]}\n`;
    body += `   Wrote: ${data.quizAnswers[i] || '(blank)'}\n`;
    body += `   Key:   ${answerKey[i]}\n`;
  }

  const correct = data.quizCorrect || [];
  body += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  body += `Self-checked: ${correct.filter(c => c).length} marked correct\n`;

  MailApp.sendEmail({
    to: INSTRUCTOR_EMAIL,
    subject: `[EAST 213] Outtake Quiz — ${data.name} (${data.selfScore}/10)`,
    body: body
  });
}

/**
 * Run this ONCE from the script editor to email every student their personal quiz link.
 * Click the play button (▶) next to this function name.
 */
function sendQuizLinks() {
  const QUIZ_URL = 'https://omatty123.github.io/hist213-dashboard/print/outtake-quiz.html';

  const students = [
    { key: 'susanna',  name: 'Susanna',  email: 'susanna.d.good@lawrence.edu' },
    { key: 'jessy',    name: 'Jessy',    email: 'yunji.jeong@lawrence.edu' },
    { key: 'nik',      name: 'Nik',      email: 'nikolaos.a.kypriotis@lawrence.edu' },
    { key: 'isabelle', name: 'Isabelle', email: 'isabelle.d.pick@lawrence.edu' },
    { key: 'em',       name: 'Em',       email: 'em.sweeney@lawrence.edu' },
    { key: 'eliel',    name: 'Eliel',    email: 'eliel.a.valdez@lawrence.edu' },
    { key: 'sam',      name: 'Sam',      email: 'samuel.g.williams@lawrence.edu' },
    { key: 'juchan',   name: 'Juchan',   email: 'juchan.yang@lawrence.edu' }
  ];

  students.forEach(s => {
    const link = QUIZ_URL + '?s=' + s.key;

    MailApp.sendEmail({
      to: s.email,
      subject: 'EAST 213 – Final Outtake Quiz',
      body: `Hi ${s.name},\n\nAs we wrap up the term, here's your personal link for the final outtake quiz. Same 10 questions from the first day of class.\n\n${link}\n\nSee you in class!\n\n— 마선생님`
    });
  });

  Logger.log('All 8 quiz links sent!');
}

function testSetup() {
  const sheet = getOrCreateSheet();
  Logger.log('Sheet ready: ' + sheet.getName());
}
