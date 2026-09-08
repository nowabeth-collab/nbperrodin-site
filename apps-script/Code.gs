/**
 * nbperrodin.com — Save-the-Date address collector
 * ------------------------------------------------
 * Receives form submissions from the website and appends them to a
 * Google Sheet. Optional: emails Noah on every new submission.
 *
 * SETUP (one time, ~5 minutes):
 *  1. Create a new Google Sheet. Name it "Wedding Guest Addresses".
 *  2. In the Sheet: Extensions → Apps Script. Delete the sample code,
 *     paste this whole file, and save (Ctrl/Cmd+S).
 *  3. Click "Deploy" → "New deployment" → gear icon → "Web app".
 *       Description: Save the date form
 *       Execute as:  Me
 *       Who has access: Anyone            ← required so guests can submit
 *     Click Deploy, authorize when prompted (Advanced → Go to project).
 *  4. Copy the "Web app URL" (ends in /exec) and paste it into
 *     assets/config.js as formEndpoint. Re-upload the site.
 *  5. Test: submit the form on the site, then check the Sheet.
 *
 *  If you ever change this code, you must "Deploy → Manage deployments
 *  → Edit (pencil) → Version: New version → Deploy" for changes to go live.
 */

var SHEET_NAME = "Submissions";
var NOTIFY_EMAIL = "noahvideographer@gmail.com"; // set to "" to disable notifications

var COLUMNS = [
  "submittedAt", "firstName", "lastName", "householdNames", "email", "phone",
  "address1", "address2", "city", "state", "zip", "country", "note", "source",
  "mailed", "lobId"  // filled in later by the Lob script
];

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = getSheet_();
    var row = COLUMNS.map(function (c) {
      var v = data[c];
      if (c === "submittedAt") v = v || new Date().toISOString();
      if (c === "state" && v) v = String(v).trim().toUpperCase();
      if (c === "zip" && v) v = String(v).trim();
      if (c === "phone" && v) v = String(v).replace(/[^\d+]/g, "");
      return v == null ? "" : String(v).trim();
    });
    sheet.appendRow(row);

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail({
        to: NOTIFY_EMAIL,
        subject: "New save-the-date address: " + data.firstName + " " + data.lastName,
        body:
          data.firstName + " " + data.lastName +
          (data.householdNames ? " (+ " + data.householdNames + ")" : "") + "\n" +
          data.address1 + (data.address2 ? ", " + data.address2 : "") + "\n" +
          data.city + ", " + data.state + " " + data.zip + "\n\n" +
          "Email: " + data.email + "\nPhone: " + data.phone +
          (data.note ? "\n\nNote: " + data.note : "") +
          "\n\nSheet: " + SpreadsheetApp.getActiveSpreadsheet().getUrl()
      });
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// Visiting the /exec URL in a browser shows this — handy to confirm it's deployed.
function doGet() {
  return json_({ ok: true, service: "nbperrodin save-the-date", rows: getSheet_().getLastRow() - 1 });
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(COLUMNS);
    sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Run this once from the editor to create the sheet + header row before the first submission. */
function setup() { getSheet_(); }
