#!/usr/bin/env python3
"""
Mail physical save-the-date postcards through Lob (https://lob.com).

WORKFLOW
  1. Guests submit addresses on nbperrodin.com/save-the-date → Google Sheet.
  2. In the Sheet: File → Download → CSV. Save it as guests.csv next to this script.
  3. Create a Lob account, add a payment method, copy your API keys
     (Settings → API Keys). Test keys start with test_, live keys with live_.
  4. Dry run with the TEST key (nothing is printed, nothing is charged):
         LOB_API_KEY=test_xxx python3 send_save_the_dates.py guests.csv
     Open the "url" printed for each card — Lob renders a PDF proof you can check.
  5. When the proofs look right, run with the LIVE key and --send:
         LOB_API_KEY=live_xxx python3 send_save_the_dates.py guests.csv --send
  6. results.csv is written with the Lob id + tracking URL for every row. Paste the
     "lobId" column back into the Sheet (or just keep results.csv) so re-runs skip them.

Re-running is safe: any row whose email already appears in results.csv is skipped.

COST (as of 2026, check lob.com/pricing): a 4x6 postcard is roughly $1–1.50 each
including postage; 6x9 and 6x11 cost more. 150 cards ≈ $200.

Requires:  pip install requests
"""
import csv, os, sys, json, time, pathlib
import requests

API = "https://api.lob.com/v1"
HERE = pathlib.Path(__file__).parent
FRONT_HTML = (HERE / "card_front.html").read_text()
BACK_HTML  = (HERE / "card_back.html").read_text()

# Return address printed on every card
FROM_ADDRESS = {
    "name": "Noah & Bethany",
    "address_line1": "YOUR STREET ADDRESS",
    "address_city": "Houston",
    "address_state": "TX",
    "address_zip": "77000",
}
POSTCARD_SIZE = "4x6"          # "4x6", "6x9", or "6x11"
MAIL_TYPE = "usps_first_class" # or "usps_standard" (cheaper, slower, min 200 pieces)


def die(msg):
    print("ERROR:", msg, file=sys.stderr); sys.exit(1)


def verify_address(auth, row):
    """Ask Lob to standardize the address. Returns (ok, dict_or_reason)."""
    r = requests.post(f"{API}/us_verifications", auth=auth, json={
        "primary_line": row["address1"],
        "secondary_line": row.get("address2", ""),
        "city": row["city"], "state": row["state"], "zip_code": row["zip"],
    })
    v = r.json()
    if r.status_code != 200:
        return False, v.get("error", {}).get("message", r.text)
    if v.get("deliverability") in ("undeliverable",):
        return False, "undeliverable"
    comps = v["components"]
    return True, {
        "address_line1": v["primary_line"],
        "address_line2": v.get("secondary_line", ""),
        "address_city": comps["city"],
        "address_state": comps["state"],
        "address_zip": comps["zip_code"] + ("-" + comps["zip_code_plus_4"] if comps.get("zip_code_plus_4") else ""),
    }


def main():
    if len(sys.argv) < 2:
        die("usage: send_save_the_dates.py guests.csv [--send]")
    key = os.environ.get("LOB_API_KEY") or die("set LOB_API_KEY (test_… or live_…)")
    send = "--send" in sys.argv
    live = key.startswith("live_")
    if live and not send:
        die("You're using a LIVE key without --send. Add --send to actually mail cards, or use a test_ key.")
    auth = (key, "")

    if "YOUR STREET" in FROM_ADDRESS["address_line1"]:
        die("Fill in FROM_ADDRESS at the top of this script first.")

    results_path = HERE / "results.csv"
    already = set()
    if results_path.exists():
        with open(results_path) as f:
            already = {r["email"].lower() for r in csv.DictReader(f) if r.get("lobId")}

    with open(sys.argv[1], newline="") as f:
        rows = list(csv.DictReader(f))
    print(f"{len(rows)} rows in sheet, {len(already)} already mailed, mode = {'LIVE MAIL' if live else 'TEST (no mail)'}")

    out_exists = results_path.exists()
    with open(results_path, "a", newline="") as out:
        w = csv.DictWriter(out, fieldnames=["email", "name", "status", "lobId", "url", "expected_delivery", "reason"])
        if not out_exists: w.writeheader()

        for row in rows:
            email = (row.get("email") or "").strip().lower()
            name = f"{row.get('firstName','').strip()} {row.get('lastName','').strip()}".strip()
            if not name or not row.get("address1"):
                continue
            if email in already or (row.get("mailed") or "").strip().lower() in ("y", "yes", "true"):
                print(f"  skip  {name} (already mailed)"); continue

            ok, addr = verify_address(auth, row)
            if not ok:
                print(f"  !!    {name}: address problem — {addr}")
                w.writerow({"email": email, "name": name, "status": "address_problem", "reason": addr}); continue

            if (row.get("attending") or "").strip().lower() == "no":
                print(f"  skip  {name} (declined)"); continue
            to_name = name[:40]
            payload = {
                "description": f"Save the date — {name}",
                "to": {"name": to_name, **addr},
                "from": FROM_ADDRESS,
                "front": FRONT_HTML,
                "back": BACK_HTML,
                "size": POSTCARD_SIZE,
                "mail_type": MAIL_TYPE,
                "merge_variables": {"first_name": row.get("firstName", "").strip()},
                "metadata": {"email": email},
            }
            r = requests.post(f"{API}/postcards", auth=auth, json=payload)
            res = r.json()
            if r.status_code != 200:
                msg = res.get("error", {}).get("message", r.text)
                print(f"  !!    {name}: Lob error — {msg}")
                w.writerow({"email": email, "name": name, "status": "error", "reason": msg}); continue
            print(f"  sent  {name} → {res['id']}  proof: {res.get('url','')}")
            w.writerow({"email": email, "name": name, "status": "sent" if live else "test",
                        "lobId": res["id"], "url": res.get("url", ""), "expected_delivery": res.get("expected_delivery_date", "")})
            time.sleep(0.25)  # be polite to the API

    print(f"\nDone. See {results_path}")


if __name__ == "__main__":
    main()
