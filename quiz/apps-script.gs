// Google Apps Script for the Live Updates Calibration Quiz.
// Paste into the results Sheet (Extensions → Apps Script), then Deploy → New deployment → Web app,
// Execute as: Me, Who has access: Anyone. Copy the web app URL into RESULTS_URL in quiz/index.html.
const SHEET_NAME = "Quiz results";
const HEADERS = ["Submitted at", "Agent", "Team", "Score", "Total", "Result", "Time (s)", "Missed", "Answers"];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
    // Cap free-text fields so a bad request can't flood the sheet.
    const clip = (v, n) => String(v == null ? "" : v).slice(0, n);
    sheet.appendRow([
      new Date(d.submittedAt || Date.now()), clip(d.agent, 60), clip(d.team, 20), Number(d.score) || 0, Number(d.total) || 0,
      clip(d.passed, 20), Number(d.secs) || 0, clip(d.missed, 300), clip(d.answers, 200),
    ]);
    return ContentService.createTextOutput("ok");
  } finally {
    lock.releaseLock();
  }
}
