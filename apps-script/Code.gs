/**
 * nbperrodin.com — RSVP collector + automatic save-the-date mailing
 * =================================================================
 * One script, two jobs:
 *   1. doPost(): receives every RSVP from the website and adds a row to the Sheet
 *      (and emails Noah).
 *   2. mailPendingCards(): every Friday at 5 PM, mails a physical save-the-date
 *      postcard (via Lob) to everyone who RSVP'd that week and hasn't been mailed yet.
 *      Runs in Google's cloud — no laptop needed.
 *
 * ---------------------------------------------------------------
 * PART A — Connect the form (5 minutes)
 * ---------------------------------------------------------------
 *  1. The Google Sheet "Wedding RSVPs" already exists (SHEET_ID below).
 *  2. This code lives in a standalone Apps Script project (script.google.com).
 *  3. Left sidebar → Project Settings (gear) → Time zone: "(GMT-06:00) Central Time".
 *  4. Back in the editor: pick "setup" in the function dropdown → Run. Authorize when
 *     asked (Advanced → Go to project → Allow). This creates the header row.
 *  5. Deploy → New deployment → gear → Web app:
 *        Execute as: Me      Who has access: Anyone
 *     → Deploy. Copy the Web app URL (ends in /exec) and send it to Claude.
 *
 * ---------------------------------------------------------------
 * PART B — Automatic postcards via Lob (10 minutes)
 * ---------------------------------------------------------------
 *  1. Create an account at lob.com and add a payment method.
 *     Dashboard → Settings → API Keys: copy the TEST secret key (test_...) for now.
 *  2. In Apps Script: Project Settings → Script Properties → Add script property:
 *        LOB_API_KEY      test_xxxxxxxx           (switch to live_... when ready)
 *        FROM_NAME        Noah & Bethany
 *        FROM_ADDRESS1    your street address
 *        FROM_CITY        your city
 *        FROM_STATE       TX
 *        FROM_ZIP         your zip
 *  3. Function dropdown → "mailPendingCards" → Run. With a test_ key nothing is printed
 *     or charged; you'll get an email with proof links for every card. Check them.
 *  4. Happy? Change LOB_API_KEY to your live_ key.
 *  5. Function dropdown → "setupWeeklyMailing" → Run (once). From then on, every
 *     Friday at 5 PM Central, new RSVPs get a card and you get a summary email.
 *
 *  Cost: about $1–1.50 per 4x6 postcard incl. postage. Declines are never mailed.
 *  To pause: run "stopWeeklyMailing". To mail right now: run "mailPendingCards".
 *
 *  If you ever change this code: Deploy → Manage deployments → pencil → New version → Deploy.
 */

var SHEET_ID = "1zZr3qCmm7XdjP0VpEJq-rjNCkj0rogKU8Je23eU5yLU"; // the "Wedding RSVPs" Google Sheet
var SHEET_NAME = "RSVPs";
var NOTIFY_EMAIL = "noahvideographer@gmail.com"; // set to "" to disable per-RSVP emails
var SITE = "https://nbperrodin.com";

var COLUMNS = [
  "submittedAt", "attending", "firstName", "lastName", "guestCount", "guestNames", "email", "phone",
  "address1", "address2", "city", "state", "zip", "country", "note", "source",
  "mailedAt", "lobId", "lobProof", "mailError"
];

/* ================================================================
 * PART A — RSVP intake
 * ================================================================ */
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
      var yes = data.attending === "yes";
      MailApp.sendEmail({
        to: NOTIFY_EMAIL,
        subject: (yes ? "RSVP YES (" + (data.guestCount || 1) + "): " : "RSVP no: ") + data.firstName + " " + data.lastName,
        body:
          (yes ? "ACCEPTS — " + (data.guestCount || 1) + " attending" + (data.guestNames ? ": " + data.guestNames : "") : "DECLINES") + "\n\n" +
          data.firstName + " " + data.lastName + "\n" +
          data.address1 + (data.address2 ? ", " + data.address2 : "") + "\n" +
          data.city + ", " + data.state + " " + data.zip + "\n\n" +
          "Email: " + data.email + "\nPhone: " + data.phone +
          (data.note ? "\n\nNote: " + data.note : "") +
          "\n\nTotals so far: " + totals_() +
          "\nSheet: " + SpreadsheetApp.openById(SHEET_ID).getUrl()
      });
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// Visiting the /exec URL in a browser shows this — handy to confirm it's deployed.
function doGet() {
  return json_({ ok: true, service: "nbperrodin RSVP", totals: totals_() });
}

/** Run once from the editor: creates the sheet + header row. */
function setup() { getSheet_(); }

/* ================================================================
 * PART B — Weekly postcard mailing through Lob
 * ================================================================ */
var LOB_API = "https://api.lob.com/v1";
var POSTCARD_SIZE = "4x6";
var MAIL_TYPE = "usps_first_class";

function mailPendingCards() {
  var props = PropertiesService.getScriptProperties();
  var key = props.getProperty("LOB_API_KEY");
  if (!key) throw new Error("Add LOB_API_KEY in Project Settings → Script Properties first.");
  var live = key.indexOf("live_") === 0;
  var from = {
    name: props.getProperty("FROM_NAME") || "Noah & Bethany",
    address_line1: props.getProperty("FROM_ADDRESS1"),
    address_city: props.getProperty("FROM_CITY"),
    address_state: props.getProperty("FROM_STATE"),
    address_zip: props.getProperty("FROM_ZIP"),
  };
  if (!from.address_line1 || !from.address_city || !from.address_state || !from.address_zip) {
    throw new Error("Fill in FROM_ADDRESS1, FROM_CITY, FROM_STATE, FROM_ZIP in Script Properties.");
  }

  // Card artwork lives on the website so it's always the current design.
  var front = UrlFetchApp.fetch(SITE + "/lob/card_front.html").getContentText();
  var back  = UrlFetchApp.fetch(SITE + "/lob/card_back.html").getContentText();

  var sheet = getSheet_();
  var values = sheet.getDataRange().getValues();
  var header = values[0];
  var col = {}; header.forEach(function (h, i) { col[h] = i; });

  var sent = [], skipped = [], failed = [];
  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var get = function (name) { return String(row[col[name]] == null ? "" : row[col[name]]).trim(); };
    var name = (get("firstName") + " " + get("lastName")).trim();
    if (!name || !get("address1")) continue;
    if (get("mailedAt")) continue;                          // already mailed
    if (get("attending").toLowerCase() === "no") { skipped.push(name + " (declined)"); continue; }
    if (get("mailError") && get("mailError").indexOf("undeliverable") === 0) { skipped.push(name + " (bad address — fix it in the sheet and clear mailError)"); continue; }

    try {
      var addr = verifyAddress_(key, get("address1"), get("address2"), get("city"), get("state"), get("zip"));
      var payload = {
        description: "Save the date — " + name,
        to: { name: name.substring(0, 40), address_line1: addr.address_line1, address_line2: addr.address_line2,
              address_city: addr.address_city, address_state: addr.address_state, address_zip: addr.address_zip },
        from: from,
        front: front,
        back: back,
        size: POSTCARD_SIZE,
        mail_type: MAIL_TYPE,
        merge_variables: { first_name: get("firstName") },
        metadata: { email: get("email"), row: String(r + 1) },
      };
      var res = lob_(key, "/postcards", payload);
      sheet.getRange(r + 1, col.mailedAt + 1).setValue(live ? new Date() : "TEST " + new Date().toISOString());
      sheet.getRange(r + 1, col.lobId + 1).setValue(res.id);
      sheet.getRange(r + 1, col.lobProof + 1).setValue(res.url || "");
      sheet.getRange(r + 1, col.mailError + 1).setValue("");
      sent.push(name + (res.url ? " — proof: " + res.url : ""));
    } catch (err) {
      sheet.getRange(r + 1, col.mailError + 1).setValue(String(err.message || err));
      failed.push(name + " — " + (err.message || err));
    }
    Utilities.sleep(300);
  }

  var summary =
    (live ? "LIVE — cards were mailed." : "TEST MODE — nothing was printed or charged. Open the proof links to check the design.") + "\n\n" +
    "Mailed (" + sent.length + "):\n" + (sent.join("\n") || "none") + "\n\n" +
    "Skipped (" + skipped.length + "):\n" + (skipped.join("\n") || "none") + "\n\n" +
    "Problems (" + failed.length + "):\n" + (failed.join("\n") || "none") + "\n\n" +
    "Sheet: " + SpreadsheetApp.openById(SHEET_ID).getUrl();
  if (NOTIFY_EMAIL) {
    MailApp.sendEmail({ to: NOTIFY_EMAIL, subject: (live ? "Save-the-dates mailed: " : "Save-the-date TEST run: ") + sent.length + " cards", body: summary });
  }
  Logger.log(summary);
  return summary;
}

/** Run once: mails pending cards every Friday at 5 PM (script time zone = Central). */
function setupWeeklyMailing() {
  stopWeeklyMailing();
  ScriptApp.newTrigger("mailPendingCards").timeBased().onWeekDay(ScriptApp.WeekDay.FRIDAY).atHour(17).create();
  Logger.log("Weekly mailing scheduled: Fridays at 5 PM.");
}

/** Removes the weekly schedule (RSVPs still come in; nothing is mailed). */
function stopWeeklyMailing() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "mailPendingCards") ScriptApp.deleteTrigger(t);
  });
}

function verifyAddress_(key, line1, line2, city, state, zip) {
  var v = lob_(key, "/us_verifications", { primary_line: line1, secondary_line: line2 || "", city: city, state: state, zip_code: zip });
  if (v.deliverability === "undeliverable") throw new Error("undeliverable address");
  var c = v.components || {};
  return {
    address_line1: v.primary_line,
    address_line2: v.secondary_line || "",
    address_city: c.city || city,
    address_state: c.state || state,
    address_zip: c.zip_code ? c.zip_code + (c.zip_code_plus_4 ? "-" + c.zip_code_plus_4 : "") : zip,
  };
}

function lob_(key, path, payload) {
  var res = UrlFetchApp.fetch(LOB_API + path, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    headers: { Authorization: "Basic " + Utilities.base64Encode(key + ":") },
    muteHttpExceptions: true,
  });
  var body = JSON.parse(res.getContentText() || "{}");
  if (res.getResponseCode() >= 300) throw new Error((body.error && body.error.message) || ("Lob error " + res.getResponseCode()));
  return body;
}

/* ================================================================
 * helpers
 * ================================================================ */
function getSheet_() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(COLUMNS);
    sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function totals_() {
  var values = getSheet_().getDataRange().getValues();
  var header = values[0], col = {}; header.forEach(function (h, i) { col[h] = i; });
  var yes = 0, no = 0, guests = 0;
  for (var r = 1; r < values.length; r++) {
    var a = String(values[r][col.attending] || "").toLowerCase();
    if (a === "yes") { yes++; guests += Number(values[r][col.guestCount]) || 1; }
    else if (a === "no") no++;
  }
  return yes + " accepted (" + guests + " guests), " + no + " declined";
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
