# nbperrodin.com — How it all fits together

Everything is live. This is the map for when you want to change something.

## Where things run

| Piece | Where | Account |
|---|---|---|
| The website | GitHub Pages, from the `nowabeth-collab/nbperrodin-site` repo (branch `main`) | GitHub user **nowabeth-collab** |
| Domain | GoDaddy DNS → GitHub Pages (`A` records + `www` CNAME) | GoDaddy |
| RSVPs | Google Sheet **"Wedding RSVPs"** (tabs: `RSVPs`, `Mailing List`) | **nowabeth@gmail.com** |
| Form backend + emails | Apps Script project **"Wedding RSVP + Save the Dates"** (`apps-script/Code.gs`) | nowabeth@gmail.com |
| Guest photo album | Google Photos shared album (link goes in `assets/config.js` → `photoAlbumUrl`) | nowabeth@gmail.com |

The same files also live on Noah's Mac in `Desktop/Noah Bethany Website/nbperrodin-site` — that folder is a working copy of the GitHub repo.

## Links to hand out

- **nbperrodin.com** — the website.
- **nbperrodin.com/rsvp** (also `/std` and `/savethedate`) — the standalone RSVP page. Text or email this one to guests. After they submit, it drops them on the save-the-date page with the calendar buttons.
- **nbperrodin.com/photos** — where the QR codes in `qr/` point. Guests land on a page with a button to the shared album.

## What happens when a guest RSVPs

1. The form posts to the Apps Script web app (`formEndpoint` in `assets/config.js`).
2. A row is added to the `RSVPs` tab of the Sheet.
3. nowabeth@gmail.com (cc noahvideographer@gmail.com) gets an alert email with the reply, the address, and running totals.
4. The guest gets a confirmation from "Noah & Bethany" (sent from nowabeth@gmail.com, replies come back there). Accepts get the calendar invite attached.

## Every Friday at 5 PM Central

The script emails you **"Save-the-date list: N new RSVPs this week · N addresses to mail"** with:

- the week's new RSVPs in a table, and
- `save-the-date-mailing-list.csv` — every accepted guest's address that hasn't been marked as mailed. Upload it to Minted / Zola / Shutterfly's address book, or print labels from it.

The `Mailing List` tab in the Sheet is refreshed at the same time (File → Download → CSV works too).

**When you've mailed someone's card**, type a date in their `cardSent` cell on the `RSVPs` tab. They drop off the CSV and the tab. Declines are never included.

Nothing is sent on a week with no new RSVPs and nothing left to mail.

Handy functions in the Apps Script editor (function dropdown → Run):

| Function | What it does |
|---|---|
| `previewDigest` | Sends the Friday email right now (marked `[preview]`, doesn't move the "since last week" marker) |
| `buildMailingList` | Rebuilds the `Mailing List` tab from the `RSVPs` tab |
| `stopWeeklyDigest` / `setupWeeklyDigest` | Pause / resume the Friday email |
| `setup` | Repairs the header row if it ever gets messed up |

Visiting the web app URL (the `formEndpoint`) in a browser shows the current totals as a quick health check.

## The save-the-date card

`save-the-date-card/` has the 4x6 postcard design:

- `save-the-date-card-4x6.pdf` — print-ready, 2 pages (front, back), 6.25 × 4.25 in including 1/8 in bleed. Upload it to Vistaprint / Shutterfly / any print shop as a "4x6 postcard, full bleed", or use it as the artwork on Minted's "upload your own design" cards.
- `preview-front.jpg`, `preview-back.jpg` — quick look.
- `front.html`, `back.html` — the editable source. Change the text, open the file in a browser to check it, and ask Claude to re-export the PDF.

The back has a stamp box and address lines, so cards can be hand-addressed or take a label printed from the mailing-list CSV.

## The formal invitation

`invitation/` has the 5x7 flat invitation:

- `invitation-5x7.pdf` — print-ready, 2 pages (front, back), 5.25 × 7.25 in including 1/8 in bleed. Order as a "5x7 flat card, full bleed, printed both sides" (Vistaprint, Shutterfly, Minted "upload your design", or a local print shop). A5/5x7 envelopes fit it.
- `preview-front.jpg`, `preview-back.jpg` — quick look.
- `front.html`, `back.html` — editable source. The RSVP-by date (November 1) and the details copy live in `back.html`; the QR code points to nbperrodin.com/rsvp (`assets/qr-rsvp.png`).

Mail invitations 6–8 weeks before the wedding (early-to-mid October).

## Changing the website

Everything a normal edit needs is in **`assets/config.js`**: names, date, venue, registry links, wedding party (names, roles, photos in `assets/photos/party/`), the photo-album link, gallery photo list, and the hero image. Colors and fonts are at the top of `assets/styles.css`.

To publish a change: commit and push to `main` on GitHub (Noah's Mac folder is set up for this; GitHub Pages redeploys in about a minute). Photos are cached hard by browsers, so give a replaced photo a **new file name**.

If you change the ceremony time, also update `nbperrodin-wedding.ics` (`DTSTART`/`DTEND`, Central time, format `YYYYMMDDTHHMMSS`) and the `ics_()` function in `apps-script/Code.gs`.

## Changing the backend

Edit `apps-script/Code.gs`, paste it into the Apps Script editor, save, then **Deploy → Manage deployments → pencil → Version: New version → Deploy**. The web app URL stays the same, so the website doesn't need to change.

## Still to do

- Paste the Google Photos shared-album link into `assets/config.js` → `photoAlbumUrl` (Photos → Albums → the album → Share → Create link, with "Collaborate" on).
- Wedding party photos: drop square-ish JPGs in `assets/photos/party/` and set each person's `photo` in `config.js`.
- Order the save-the-dates as soon as the address list has filled in, then the invitations 6–8 weeks out (early-to-mid October). Both PDFs are ready.
