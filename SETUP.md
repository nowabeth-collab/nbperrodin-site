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

The script emails you **"Invitation list: N new RSVPs this week · N addresses to mail"** with the week's new RSVPs in a table and `invitation-mailing-list.csv` — every accepted household's address that hasn't been marked as mailed. The `Mailing List` tab in the Sheet is refreshed at the same time. Nothing is sent on a week with no new RSVPs and nothing left to mail.

Households are counted once: if someone replies twice (same street address or same email), or replies again after their card was marked sent, they don't reappear on the list.

## Mailing through Postable (the 5-minute Friday routine)

Postable (account: nowabeth@gmail.com) prints, addresses, stamps and mails the cards. The invitation is saved there as the project **"Wedding Invitation (5x7)"** (kraft envelope, calligraphy addressing, no Postable logo). A 4x6 save-the-date postcard project exists too, but since guests RSVP online before anything is mailed, the plan is invitations only.

1. Save the CSV from the Friday email.
2. Postable → **Contacts → Import spreadsheet** → upload it, name the group by date (e.g. "Batch Sep 19"). The CSV already has Postable's required headers.
3. **Projects** → open the card → **Recipients** → select that group → Save and checkout → pay. They mail within 1–2 business days; USPS takes 2–6 more.
4. Back in the Sheet, type today's date in each of those guests' **cardSent** cells so they drop off next week's list.

Order one invitation to yourself first as a proof; it arrives in about a week. Then send the big batch with the `WELCOME` code.

Pricing (2026): flat card $4.59 at 20+ (+$0.25 to hide their logo) + $0.82 stamp; postcard cheaper, stamp $0.65. Codes: `WELCOME` = 25% off the first order (save it for the big batch); seasonal codes appear in the site banner.

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
- `front-postable.html` / `postable-front-6x4.25-bleed.jpg` — the same front at Postable's postcard size (6 × 4.25 in). Postable prints the address and your message on the back, so `back.html` is only for printing elsewhere.

## The formal invitation

`invitation/` has the 5x7 flat invitation:

- `invitation-5x7.pdf` — print-ready, 2 pages (front, back), 5.25 × 7.25 in including 1/8 in bleed. Order as a "5x7 flat card, full bleed, printed both sides" (Vistaprint, Shutterfly, Minted "upload your design", or a local print shop). A5/5x7 envelopes fit it.
- `preview-front.jpg`, `preview-back.jpg` — quick look.
- `front.html`, `back.html` — editable source. The RSVP-by date (October 17) and the details copy live in `back.html`; the QR code points to nbperrodin.com/rsvp (`assets/qr-rsvp.png`).
- `postable-front-5x7-bleed.png`, `postable-back-5x7-bleed.png` (from `back-postable.html`) — the uploads used in the Postable project. Postable's back layout is a 5.25 × 6.4 in image with a white strip below, which is why the back has its own variant.
- The front follows the original design by Bethany's sister (gold arch frame, Bodoni Moda names, Allura script, three-column date block) with the site's own florals. Fonts: Bodoni Moda, Allura, Cormorant Garamond, Jost (all on Google Fonts).

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
- Run the Friday routine above as addresses arrive. The first big invitation batch should go out by late September so it lands well before the October 17 reply-by date.
