/**
 * nbperrodin.com — RSVP collector + weekly save-the-date address digest
 * ======================================================================
 * One script, two jobs, all running in Google's cloud (no laptop needed):
 *
 *   1. doPost()          Receives every RSVP from the website, adds a row to the
 *                        "Wedding RSVPs" Sheet, alerts Noah & Bethany, and emails the
 *                        guest a confirmation (sent from nowabeth@gmail.com).
 *
 *   2. sendWeeklyDigest() Every Friday at 5 PM Central: emails Noah & Bethany the
 *                        week's new RSVPs plus a ready-to-upload CSV of every accepted
 *                        guest's mailing address that still needs a save-the-date card.
 *                        The CSV has Postable's required headers, so it imports straight into
 *                        Postable (Contacts → Import spreadsheet), which prints, addresses, stamps
 *                        and mails the cards. The "Mailing List" tab in the Sheet is refreshed too.
 *
 * ---------------------------------------------------------------
 * PART A — Connect the form (already done)
 * ---------------------------------------------------------------
 *  1. The Google Sheet "Wedding RSVPs" exists (SHEET_ID below), owned by nowabeth@gmail.com.
 *  2. This code lives in a standalone Apps Script project (script.google.com), same account.
 *  3. Function dropdown → "setup" → Run. Creates/repairs the header row + Mailing List tab.
 *  4. Deploy → New deployment → gear → Web app: Execute as Me, Who has access: Anyone.
 *     The /exec URL is pasted into assets/config.js on the website as formEndpoint.
 *
 * ---------------------------------------------------------------
 * PART B — Weekly digest (already done)
 * ---------------------------------------------------------------
 *  1. Function dropdown → "setupWeeklyDigest" → Run (once). From then on, every Friday
 *     at 5 PM Central you get an email with the new RSVPs and the mailing-list CSV.
 *  2. Want it right now? Run "previewDigest" (sends the same email, doesn't move the
 *     "since last week" marker).
 *  3. Mailed someone's card? Type a date (or "yes") in that row's cardSent column on the
 *     RSVPs tab and they drop off the to-mail list.
 *  4. To pause the weekly email: run "stopWeeklyDigest".
 *
 *  If you ever change this code: Deploy → Manage deployments → pencil → New version → Deploy.
 */

var SHEET_ID = "1lB1tkCrp1VGeyig1z1_khrTo9GwFSUGR7MVLYqRZN4s"; // the "Wedding RSVPs" Google Sheet (nowabeth@gmail.com)
var SHEET_NAME = "RSVPs";
var LIST_SHEET_NAME = "Mailing List";
var NOTIFY_EMAIL = "nowabeth@gmail.com";        // where RSVP alerts + the Friday digest go (set to "" to disable)
var NOTIFY_CC = "noahvideographer@gmail.com";    // also copy Noah
var SEND_GUEST_CONFIRMATION = true;              // email each guest a confirmation (sent from the account that owns this script)
var SITE = "https://nbperrodin.com";
var TIME_ZONE = "America/Chicago";

var COLUMNS = [
  "submittedAt", "attending", "firstName", "lastName", "guestCount", "guestNames", "email", "phone",
  "address1", "address2", "city", "state", "zip", "country", "note", "source",
  "cardSent"   // you fill this in by hand once a save-the-date card has gone out
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
      if (c === "cardSent") v = "";
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
        cc: NOTIFY_CC,
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
    if (SEND_GUEST_CONFIRMATION && data.email) {
      try { sendGuestConfirmation_(data); } catch (mailErr) { Logger.log("Guest email failed: " + mailErr); }
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/** Confirmation email to the guest. Goes out from the Google account that owns this script. */
function sendGuestConfirmation_(d) {
  var yes = d.attending === "yes";
  var first = d.firstName || "there";
  var subject = yes ? "You're on the list — Noah & Bethany, November 28" : "Thank you, " + first + " — Noah & Bethany";
  var opts = { name: "Noah & Bethany", htmlBody: confirmationHtml_(first, yes), replyTo: NOTIFY_EMAIL };
  if (yes) opts.attachments = [Utilities.newBlob(ics_(), "text/calendar", "Noah-and-Bethany-Wedding.ics")];
  var plain = yes
    ? "Thank you for your RSVP, " + first + " — we can't wait to celebrate with you!\n\nSaturday, November 28, 2026 · Ceremony at 5:00 PM, reception to follow\nCamp Hosea · 17476 FM 3090, Anderson, TX 77830\n\nCalendar invite attached. Everything else is at " + SITE + "\n\nWith love,\nNoah & Bethany"
    : "Thank you for letting us know, " + first + ". We're sorry you can't be there on November 28 — you'll be missed.\n\nWith love,\nNoah & Bethany";
  MailApp.sendEmail(d.email, subject, plain, opts);
}

/** Sends both versions of the confirmation email to NOTIFY_CC so you can see them. Run from the editor. */
function sendTestConfirmation() {
  sendGuestConfirmation_({ firstName: "Noah", attending: "yes", email: NOTIFY_CC });
  sendGuestConfirmation_({ firstName: "Noah", attending: "no", email: NOTIFY_CC });
}

var CALENDAR_LINK = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
  "&text=" + encodeURIComponent("Noah & Bethany's Wedding") +
  "&dates=20261128T230000Z%2F20261129T050000Z" +
  "&details=" + encodeURIComponent("Ceremony at 5:00 PM, reception to follow. Details and updates at https://nbperrodin.com") +
  "&location=" + encodeURIComponent("Camp Hosea, 17476 FM 3090, Anderson, TX 77830");
var MAPS_LINK = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("Camp Hosea, 17476 FM 3090, Anderson, TX 77830");

/** The branded HTML email (tables + inline styles so it looks right in Gmail, Apple Mail and Outlook). */
function confirmationHtml_(first, yes) {
  var img = SITE + "/assets/email/";
  var serif = "font-family:'Cormorant Garamond',Georgia,'Times New Roman',serif;";
  var sans = "font-family:Jost,'Helvetica Neue',Helvetica,Arial,sans-serif;";
  var pine = "#4E5B44", mauve = "#B98E8C", ink = "#3A3833", soft = "#7A736A", paper = "#F4F0E9", line = "#E5DED3";
  var button = function (href, label, filled) {
    return "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" align=\"center\" style=\"display:inline-table;margin:6px 6px\"><tr>" +
      "<td align=\"center\" bgcolor=\"" + (filled ? pine : "#FFFFFF") + "\" style=\"border-radius:999px;border:1px solid " + pine + ";\">" +
      "<a href=\"" + href + "\" style=\"display:inline-block;padding:12px 24px;" + sans + "font-size:14px;letter-spacing:0.06em;text-transform:uppercase;text-decoration:none;color:" + (filled ? "#FFFFFF" : pine) + ";\">" + label + "</a></td></tr></table>";
  };
  var body = yes
    ? "<p style=\"margin:0 0 14px;" + sans + "font-size:16px;line-height:1.6;color:" + ink + ";\">Hi " + esc_(first) + ",</p>" +
      "<p style=\"margin:0 0 22px;" + sans + "font-size:16px;line-height:1.6;color:" + ink + ";\">Thank you for your RSVP &mdash; we can&rsquo;t wait to celebrate with you! Here&rsquo;s everything you need for the day.</p>" +
      // details card
      "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background:" + paper + ";border-radius:12px;\"><tr><td align=\"center\" style=\"padding:26px 24px 24px;\">" +
      "<div style=\"" + sans + "font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:" + mauve + ";margin-bottom:8px;\">The day</div>" +
      "<div style=\"" + serif + "font-size:26px;line-height:1.2;color:" + pine + ";\">Saturday, November 28, 2026</div>" +
      "<div style=\"" + sans + "font-size:15px;line-height:1.6;color:" + ink + ";margin-top:6px;\">Ceremony at 5:00 PM &middot; Reception to follow</div>" +
      "<div style=\"" + serif + "font-size:20px;color:" + pine + ";margin-top:16px;\">Camp Hosea</div>" +
      "<div style=\"" + sans + "font-size:14px;line-height:1.6;color:" + soft + ";\"><a href=\"" + MAPS_LINK + "\" style=\"color:" + soft + ";text-decoration:underline;\">17476 FM 3090, Anderson, TX 77830</a><br>About 1 hr 20 min north of Houston</div>" +
      "</td></tr></table>" +
      "<div style=\"text-align:center;padding:22px 0 6px;\">" + button(CALENDAR_LINK, "Add to calendar", true) + button(SITE, "Visit nbperrodin.com", false) + "</div>" +
      "<p style=\"margin:18px 0 0;" + sans + "font-size:15px;line-height:1.7;color:" + ink + ";\">" +
      "<strong style=\"color:" + pine + ";\">What&rsquo;s next:</strong> a save-the-date card and your formal invitation will arrive in the mail. " +
      "Directions, our registry and the story of how it all started are on the website, and if anything changes on your end, just reply to this email.</p>"
    : "<p style=\"margin:0 0 14px;" + sans + "font-size:16px;line-height:1.6;color:" + ink + ";\">Hi " + esc_(first) + ",</p>" +
      "<p style=\"margin:0 0 14px;" + sans + "font-size:16px;line-height:1.6;color:" + ink + ";\">Thank you for letting us know. We&rsquo;re sorry you can&rsquo;t be there on November 28 &mdash; you&rsquo;ll be missed, and we&rsquo;re grateful you took the time to respond.</p>" +
      "<p style=\"margin:0;" + sans + "font-size:16px;line-height:1.6;color:" + ink + ";\">If plans change, just reply to this email and we&rsquo;ll save you a seat.</p>" +
      "<div style=\"text-align:center;padding:22px 0 6px;\">" + button(SITE, "Visit nbperrodin.com", false) + "</div>";

  return "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width\"><title>Noah &amp; Bethany</title></head>" +
    "<body style=\"margin:0;padding:0;background:" + paper + ";\">" +
    "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background:" + paper + ";\"><tr><td align=\"center\" style=\"padding:28px 12px;\">" +
    "<table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"max-width:600px;width:100%;background:#FFFFFF;border:1px solid " + line + ";border-radius:16px;overflow:hidden;\">" +
    // header
    "<tr><td align=\"center\" style=\"padding:30px 32px 0;\">" +
    "<img src=\"" + img + "arch.png\" width=\"340\" alt=\"\" style=\"display:block;width:340px;max-width:80%;height:auto;border:0;\">" +
    "<div style=\"" + sans + "font-size:11px;letter-spacing:0.32em;text-transform:uppercase;color:" + mauve + ";margin-top:14px;\">" + (yes ? "You&rsquo;re on the list" : "Thank you") + "</div>" +
    "<div style=\"" + serif + "font-size:34px;line-height:1.15;color:" + pine + ";margin-top:8px;\">Noah <span style=\"color:" + mauve + ";font-style:italic;\">&amp;</span> Bethany</div>" +
    "<div style=\"width:44px;height:1px;background:" + mauve + ";margin:16px auto 0;\"></div>" +
    "</td></tr>" +
    // photo
    "<tr><td style=\"padding:24px 32px 0;\"><img src=\"" + img + "photo.jpg\" width=\"536\" alt=\"Noah and Bethany\" style=\"display:block;width:100%;height:auto;border:0;border-radius:12px;\"></td></tr>" +
    // body
    "<tr><td style=\"padding:26px 32px 8px;\">" + body + "</td></tr>" +
    // sign-off
    "<tr><td align=\"center\" style=\"padding:8px 32px 30px;\">" +
    "<img src=\"" + img + "garland.png\" width=\"210\" alt=\"\" style=\"display:block;width:210px;max-width:60%;height:auto;border:0;margin:0 auto 10px;\">" +
    "<div style=\"" + serif + "font-size:19px;font-style:italic;color:" + pine + ";\">With love,</div>" +
    "<div style=\"" + serif + "font-size:22px;color:" + pine + ";\">Noah &amp; Bethany</div>" +
    "<div style=\"" + sans + "font-size:12px;color:" + soft + ";margin-top:18px;\">November 28, 2026 &middot; Camp Hosea, Anderson, Texas &middot; <a href=\"" + SITE + "\" style=\"color:" + soft + ";\">nbperrodin.com</a></div>" +
    "</td></tr>" +
    "</table>" +
    "<div style=\"" + sans + "font-size:11px;color:" + soft + ";margin-top:14px;\">You&rsquo;re receiving this because you replied at nbperrodin.com/rsvp.</div>" +
    "</td></tr></table></body></html>";
}

/** The calendar invite, generated here so it never depends on the website being reachable. */
function ics_() {
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//nbperrodin.com//Wedding//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VTIMEZONE", "TZID:America/Chicago", "BEGIN:STANDARD", "DTSTART:20261101T020000",
    "TZOFFSETFROM:-0500", "TZOFFSETTO:-0600", "TZNAME:CST", "END:STANDARD", "END:VTIMEZONE",
    "BEGIN:VEVENT",
    "UID:wedding-2026-11-28@nbperrodin.com",
    "DTSTAMP:" + Utilities.formatDate(new Date(), "UTC", "yyyyMMdd'T'HHmmss'Z'"),
    "DTSTART;TZID=America/Chicago:20261128T170000",
    "DTEND;TZID=America/Chicago:20261128T230000",
    "SUMMARY:Noah & Bethany's Wedding",
    "DESCRIPTION:Ceremony at 5:00 PM\\, reception to follow. Details and updates at " + SITE,
    "LOCATION:Camp Hosea\\, 17476 FM 3090\\, Anderson\\, TX 77830",
    "URL:" + SITE, "STATUS:CONFIRMED",
    "BEGIN:VALARM", "TRIGGER:-P7D", "ACTION:DISPLAY", "DESCRIPTION:Noah & Bethany's wedding is one week away", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR", ""
  ].join("\r\n");
}

function esc_(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

// Visiting the /exec URL in a browser shows totals — handy to confirm it's deployed.
// The website's "Who will be there" section calls /exec?list=guests (names only, accepted guests).
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.list === "guests") return json_({ ok: true, guests: guestNames_(), updated: new Date().toISOString() });
  return json_({ ok: true, service: "nbperrodin RSVP", totals: totals_(), cardsToMail: pendingCards_().length });
}

/** First + last names of everyone who accepted, plus the extra guests they listed. Nothing else leaves the sheet. */
function guestNames_() {
  var seen = {}, out = [];
  readRows_().forEach(function (r) {
    if (r.attending !== "yes") return;
    var names = [(r.firstName + " " + r.lastName).trim()];
    String(r.guestNames || "").split(/\s*(?:,|;|\n|&|\band\b)\s*/i).forEach(function (n) { if (n && n.trim()) names.push(n.trim()); });
    names.forEach(function (n) {
      n = n.replace(/\s+/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); });
      var key = n.toLowerCase();
      if (!seen[key]) { seen[key] = true; out.push(n); }
    });
  });
  return out.sort(function (a, b) { return a.localeCompare(b); });
}

/** Run once from the editor: creates/repairs the header row and the Mailing List tab. */
function setup() {
  var sheet = getSheet_();
  var width = Math.max(sheet.getLastColumn(), COLUMNS.length);
  sheet.getRange(1, 1, 1, width).clearContent().setFontWeight("normal");
  sheet.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS]).setFontWeight("bold");
  sheet.setFrozenRows(1);
  buildMailingList();
}

/* ================================================================
 * PART B — Friday digest + mailing list
 * ================================================================ */
var LIST_HEADER = ["First Name", "Last Name", "Guests", "Guest Names", "Address 1", "Address 2", "City", "State", "Zip", "Country", "Email", "Phone", "Card sent", "RSVP'd"];

/** Trigger handler — Fridays at 5 PM Central. */
function sendWeeklyDigest() { digest_(true); }

/** Same email, right now, without moving the "since last time" marker. */
function previewDigest() { digest_(false); }

function digest_(advanceMarker) {
  var props = PropertiesService.getScriptProperties();
  var now = new Date();
  var since = new Date(props.getProperty("LAST_DIGEST_AT") || (now.getTime() - 7 * 864e5));
  var rows = readRows_();
  var fresh = rows.filter(function (r) { var d = parseDate_(r.submittedAt); return d && d > since; });
  var pending = pendingCards_(rows);
  var url = SpreadsheetApp.openById(SHEET_ID).getUrl();

  buildMailingList(rows);
  if (advanceMarker) props.setProperty("LAST_DIGEST_AT", now.toISOString());
  if (!fresh.length && !pending.length) { Logger.log("Nothing new and no cards waiting — no digest sent."); return; }
  if (!NOTIFY_EMAIL) return;

  var freshYes = fresh.filter(function (r) { return r.attending === "yes"; });
  var freshNo = fresh.filter(function (r) { return r.attending === "no"; });
  var sinceText = Utilities.formatDate(since, TIME_ZONE, "EEE, MMM d");
  var subject = (advanceMarker ? "" : "[preview] ") +
    "Save-the-date list: " + fresh.length + " new RSVP" + (fresh.length === 1 ? "" : "s") + " this week · " +
    pending.length + " address" + (pending.length === 1 ? "" : "es") + " to mail";

  var html = "<div style=\"font-family:Georgia,serif;color:#3A3833;max-width:640px\">" +
    "<h2 style=\"font-weight:normal;margin:0 0 6px\">This week's RSVPs</h2>" +
    "<p style=\"margin:0 0 14px;color:#7A736A\">Since " + sinceText + ": <strong>" + freshYes.length + " accepted</strong>, " + freshNo.length + " declined. " +
    "Overall: " + totals_(rows) + ".</p>" +
    (fresh.length ? table_(fresh) : "<p><em>No new RSVPs this week.</em></p>") +
    "<h2 style=\"font-weight:normal;margin:22px 0 6px\">Save-the-date cards still to mail: " + pending.length + "</h2>" +
    "<p style=\"margin:0 0 10px\">The attached CSV has every accepted guest's address that hasn't been marked <code>cardSent</code> yet — " +
    "import it into Postable (Contacts → Import spreadsheet → pick the saved card → send). The same list lives in the " +
    "<a href=\"" + url + "\">“Mailing List” tab of the Sheet</a>.</p>" +
    "<p style=\"color:#7A736A;font-size:13px\">Once you've sent a batch through Postable, type a date in each guest's cardSent column on the RSVPs tab so they drop off next week's list. " +
    "Declines are never included.</p></div>";

  var text = "This week's RSVPs (since " + sinceText + "): " + freshYes.length + " accepted, " + freshNo.length + " declined. Overall: " + totals_(rows) + ".\n\n" +
    fresh.map(function (r) { return line_(r); }).join("\n") + "\n\n" +
    "Save-the-date cards still to mail: " + pending.length + " (CSV attached)\nSheet: " + url;

  MailApp.sendEmail({
    to: NOTIFY_EMAIL, cc: NOTIFY_CC, subject: subject, body: text, htmlBody: html, name: "nbperrodin.com",
    attachments: [Utilities.newBlob(csv_([LIST_HEADER].concat(pending.map(listRow_))), "text/csv", "save-the-date-mailing-list.csv")]
  });
  Logger.log("Digest sent: " + subject);
}

/** Rebuilds the "Mailing List" tab: every accepted guest with an address, newest last. */
function buildMailingList(rows) {
  rows = rows || readRows_();
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var list = ss.getSheetByName(LIST_SHEET_NAME) || ss.insertSheet(LIST_SHEET_NAME);
  var accepted = rows.filter(function (r) { return r.attending === "yes" && r.address1; });
  var values = [LIST_HEADER].concat(accepted.map(listRow_));
  list.clearContents();
  list.getRange(1, 1, values.length, LIST_HEADER.length).setValues(values);
  list.getRange(1, 1, 1, LIST_HEADER.length).setFontWeight("bold");
  list.setFrozenRows(1);
  return accepted.length;
}

/** Accepted guests with an address and no cardSent yet. */
function pendingCards_(rows) {
  return (rows || readRows_()).filter(function (r) { return r.attending === "yes" && r.address1 && !r.cardSent; });
}

function listRow_(r) {
  return [r.firstName, r.lastName, r.guestCount || 1, r.guestNames, r.address1, r.address2, r.city, r.state, r.zip, r.country || "USA",
          r.email, r.phone, r.cardSent, fmt_(r.submittedAt)];
}

function table_(rows) {
  var cell = function (s, extra) { return "<td style=\"padding:6px 10px;border-bottom:1px solid #EAE3D8;vertical-align:top;" + (extra || "") + "\">" + esc_(s == null ? "" : s) + "</td>"; };
  return "<table style=\"border-collapse:collapse;width:100%;font-size:14px\">" +
    "<tr style=\"text-align:left;color:#7A736A\"><th style=\"padding:6px 10px\">Guest</th><th style=\"padding:6px 10px\">Reply</th><th style=\"padding:6px 10px\">Address</th><th style=\"padding:6px 10px\">Note</th></tr>" +
    rows.map(function (r) {
      var yes = r.attending === "yes";
      return "<tr>" + cell(r.firstName + " " + r.lastName + (r.email ? "\n" + r.email : ""), "white-space:pre-line") +
        cell(yes ? "Yes · " + (r.guestCount || 1) + (Number(r.guestCount) > 1 && r.guestNames ? " (" + r.guestNames + ")" : "") : "No", yes ? "color:#4E5B44" : "color:#B98E8C") +
        cell([r.address1, r.address2, [r.city, r.state].filter(Boolean).join(", ") + " " + (r.zip || "")].filter(function (s) { return s && s.trim(); }).join("\n"), "white-space:pre-line") +
        cell(r.note) + "</tr>";
    }).join("") + "</table>";
}

function line_(r) {
  return (r.attending === "yes" ? "YES (" + (r.guestCount || 1) + ") " : "NO  ") + r.firstName + " " + r.lastName +
    " — " + [r.address1, r.address2, r.city, r.state, r.zip].filter(Boolean).join(", ") + (r.note ? " — note: " + r.note : "");
}

/** Run once: sends the digest every Friday at 5 PM Central. */
function setupWeeklyDigest() {
  stopWeeklyDigest();
  ScriptApp.newTrigger("sendWeeklyDigest").timeBased().onWeekDay(ScriptApp.WeekDay.FRIDAY).atHour(17).inTimezone(TIME_ZONE).create();
  Logger.log("Weekly digest scheduled: Fridays at 5 PM Central.");
}

/** Removes the weekly schedule (RSVPs still come in; no Friday email). */
function stopWeeklyDigest() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "sendWeeklyDigest") ScriptApp.deleteTrigger(t);
  });
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

/** Every RSVP row as an object keyed by header name (strings trimmed, attending lower-cased). */
function readRows_() {
  var values = getSheet_().getDataRange().getValues();
  if (values.length < 2) return [];
  var header = values[0].map(String);
  return values.slice(1).map(function (row) {
    var o = {};
    header.forEach(function (h, i) { var v = row[i]; o[h] = v instanceof Date ? v : String(v == null ? "" : v).trim(); });
    o.attending = String(o.attending || "").toLowerCase();
    return o;
  }).filter(function (o) { return o.firstName || o.lastName || o.email; });
}

function totals_(rows) {
  rows = rows || readRows_();
  var yes = 0, no = 0, guests = 0;
  rows.forEach(function (r) {
    if (r.attending === "yes") { yes++; guests += Number(r.guestCount) || 1; }
    else if (r.attending === "no") no++;
  });
  return yes + " accepted (" + guests + " guests), " + no + " declined";
}

function parseDate_(v) {
  if (v instanceof Date) return isNaN(v) ? null : v;
  var d = new Date(String(v || ""));
  return isNaN(d) ? null : d;
}

function fmt_(v) {
  var d = parseDate_(v);
  return d ? Utilities.formatDate(d, TIME_ZONE, "MMM d, yyyy") : String(v || "");
}

function csv_(rows) {
  return rows.map(function (row) {
    return row.map(function (v) {
      var s = v instanceof Date ? fmt_(v) : String(v == null ? "" : v);
      return /[",\n\r]/.test(s) ? "\"" + s.replace(/"/g, "\"\"") + "\"" : s;
    }).join(",");
  }).join("\r\n") + "\r\n";
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
