# nbperrodin.com — Setup Guide

Everything below is one-time setup. Total time: about 45 minutes, most of it waiting on DNS.

## What's in this folder

| Path | What it is |
|---|---|
| `index.html`, `save-the-date.html`, `wedding-party.html`, `registry.html`, `gallery.html`, `photos.html` | The six pages |
| `assets/config.js` | **The only file you normally edit.** Names, date, venue, registry links, wedding party, photo album link, form endpoint |
| `assets/styles.css` | Colors and fonts (top of file) |
| `assets/photos/` | Hero image, gallery photos, card-front crop |
| `nbperrodin-wedding.ics` | Calendar invite guests download |
| `netlify.toml` | Clean URLs (`/save-the-date` instead of `/save-the-date.html`) |
| `apps-script/Code.gs` | The Google Sheet backend that receives guest addresses |
| `lob/` | Script + card design to mail physical save-the-dates |
| `qr/` | QR codes (PNG/SVG) and print-ready photo-sharing signs (PDF) |

## 1. Buy the domain (5 min)

Go to **cloudflare.com/products/registrar** or **namecheap.com**, search `nbperrodin.com`, and buy it (about $10–15/year). Cloudflare sells at cost and has the simplest DNS panel; either works. Skip any "hosting", "email", or "website builder" upsells.

## 2. Put the site on Netlify (10 min)

1. Create a free account at **app.netlify.com** (sign up with email or GitHub).
2. On the Sites page, drag the **entire `nbperrodin-site` folder** onto the "Drag and drop your site folder here" box. It deploys in ~30 seconds to a random `something.netlify.app` URL. Open it and click around — everything except the form works already.
3. **Domain management → Add a domain → `nbperrodin.com`** → Verify → Add domain. Netlify shows you DNS records to create.
4. At your registrar's DNS page, add what Netlify asks for. Typically:
   - `A` record, host `@`, value `75.2.60.5`
   - `CNAME` record, host `www`, value `<your-site>.netlify.app`
   
   (Or choose "Use Netlify DNS" and change nameservers at the registrar — either is fine.)
5. Wait 10–60 minutes. Netlify auto-issues the HTTPS certificate once DNS resolves. Set `nbperrodin.com` as the primary domain so `www` redirects to it.

**Updating the site later:** edit files, then drag the folder onto Netlify again (Deploys tab → drag-and-drop). Takes 30 seconds.

## 3. Connect the address form (5 min)

Open `apps-script/Code.gs` — the instructions are at the top of the file. Short version:

1. New Google Sheet → Extensions → Apps Script → paste the code → save.
2. Run the `setup` function once (authorize it) to create the header row.
3. Deploy → New deployment → Web app → Execute as **Me**, access **Anyone** → Deploy.
4. Copy the `/exec` URL into `assets/config.js` → `formEndpoint`. Re-upload to Netlify.
5. Submit the form yourself to test. You'll get an email and a new row.

Every submission emails you and lands in the sheet with columns ready for the Lob script.

## 4. Fill in the details (5 min)

In `assets/config.js`:
- `event.venueName`, `event.venueAddress`, `event.mapsUrl`, ceremony time
- `bridesmaids` / `groomsmen` — names, roles, one-line notes, and photos (drop square-ish JPGs in `assets/photos/party/` and set `photo: "assets/photos/party/name.jpg"`)
- `couple.hashtag` (or set it to `""`)
- Any extra registries (Target, honeymoon fund…) in the `registry` array

If you change the ceremony time, also update `nbperrodin-wedding.ics` (the `DTSTART`/`DTEND` lines; format is `YYYYMMDDTHHMMSS` in Central time).

## 5. Guest photo album (3 min)

1. Google Photos → **Albums → Create album** → name it "Noah & Bethany's Wedding".
2. Open the album → Share → **Create link**. Make sure "Collaborate" is **on** so guests can add photos.
3. Paste that link into `assets/config.js` → `photoAlbumUrl`. Re-upload.

The QR codes in `qr/` point to `nbperrodin.com/photos`, not directly at Google — so if you ever change albums, you only change config.js, and every printed sign still works.

**Print:** `qr/photo-sign-5x7.pdf` fits a standard frame for tables; `photo-sign-8x10.pdf` for an easel at the entrance; `photo-sign-4x6.pdf` for tent cards. `qr-photos.png` / `.svg` are the bare code if you want to put it on a custom design.

## 6. Mail the save-the-dates (Lob)

See the top of `lob/send_save_the_dates.py` for the full walk-through. In short:

1. Sign up at **lob.com** (free account; you pay per card, about $1–1.50 each incl. postage for 4x6).
2. Fill in your return address at the top of the script.
3. Export the Google Sheet as CSV → `lob/guests.csv`.
4. Dry-run with the `test_` key. Open the proof PDFs Lob generates — check the photo, text, and that the address block is clean.
5. Run with the `live_` key and `--send`. Cards go out in 1–2 business days; USPS First Class takes 3–5 more.

The card front uses `assets/photos/card-front.jpg` from the live site and the back has the site QR code, so deploy the site *before* the live run.

### Timing note

The wedding is Nov 28, 2026 — under 12 weeks out. Save-the-dates normally go 4–6 months ahead, so consider: collect addresses for ~2 weeks, mail cards in one batch, and send formal invitations right behind them (6–8 weeks out, i.e. by early-to-mid October). The same Sheet + Lob flow works for invitations too — just swap the card HTML.

## Notes on the photos

Of the 92 proposal photos on the site, only 10 came through at full resolution; the rest are ~360px previews (they look fine in the grid but soft when enlarged). When you get the full-size exports from your photographer, drop them into `assets/photos/gallery/` with the same file names and re-upload — nothing else changes.
