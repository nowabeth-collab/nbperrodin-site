/* nbperrodin.com — shared behavior. Reads window.SITE from config.js. */
(function () {
  const S = window.SITE;
  const page = document.body.dataset.page;

  /* ---------- Header + footer (same on every page) ---------- */
  const NAV = [
    ["index.html", "Welcome"],
    ["save-the-date.html", "Save the Date"],
    ["venue.html", "The Venue"],
    ["wedding-party.html", "Wedding Party"],
    ["registry.html", "Registry"],
    ["gallery.html", "Gallery"],
    ["photos.html", "Share Photos"],
  ];
  const header = document.getElementById("site-header");
  if (header) {
    header.className = "site-header";
    header.innerHTML = `
      <div class="wrap">
        <a class="brand" href="index.html">${S.couple.partner1} <em>&amp;</em> ${S.couple.partner2}</a>
        <button class="nav-toggle" aria-expanded="false" aria-controls="nav">Menu</button>
        <ul class="nav" id="nav">
          ${NAV.map(([href, label]) => `<li><a href="${href}" ${href === page ? 'aria-current="page"' : ""}>${label}</a></li>`).join("")}
        </ul>
      </div>`;
    const btn = header.querySelector(".nav-toggle"), nav = header.querySelector(".nav");
    btn.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
    });
  }
  const footer = document.getElementById("site-footer");
  if (footer) {
    footer.className = "site-footer";
    footer.innerHTML = `
      <div class="wrap">
        <div class="names">${S.couple.partner1} &amp; ${S.couple.partner2}</div>
        <div>${S.event.dateText} · ${S.event.city}</div>
        ${S.couple.hashtag ? `<div class="hashtag">${S.couple.hashtag}</div>` : ""}
      </div>`;
  }

  /* ---------- Fill in text from config ---------- */
  document.querySelectorAll("[data-fill]").forEach((el) => {
    const path = el.dataset.fill.split(".");
    let v = S; for (const k of path) v = v ? v[k] : "";
    if (v !== undefined) el.textContent = v;
  });
  document.querySelectorAll("[data-href]").forEach((el) => {
    const path = el.dataset.href.split(".");
    let v = S; for (const k of path) v = v ? v[k] : "";
    if (v) el.href = v;
  });

  /* ---------- Hero image ---------- */
  const heroPhoto = document.querySelector(".hero-photo");
  if (heroPhoto) {
    const img = new Image();
    img.alt = `${S.couple.partner1} and ${S.couple.partner2}`;
    img.onload = () => { heroPhoto.innerHTML = ""; heroPhoto.appendChild(img); };
    img.src = S.heroImage;
  }

  /* ---------- Countdown ---------- */
  const cd = document.getElementById("countdown");
  if (cd) {
    const target = new Date(`${S.event.dateISO}T${S.event.ceremonyTime}:00-06:00`);
    const tick = () => {
      let ms = target - Date.now();
      if (ms <= 0) { cd.innerHTML = `<div><b>Today</b><span>is the day</span></div>`; return; }
      const d = Math.floor(ms / 864e5); ms -= d * 864e5;
      const h = Math.floor(ms / 36e5);  ms -= h * 36e5;
      const m = Math.floor(ms / 6e4);
      cd.innerHTML = `<div><b>${d}</b><span>days</span></div><div><b>${h}</b><span>hours</span></div><div><b>${m}</b><span>minutes</span></div>`;
    };
    tick(); setInterval(tick, 30000);
  }

  /* ---------- Calendar links ---------- */
  const gcal = document.getElementById("gcal-link");
  if (gcal) {
    const d = S.event.dateISO.replace(/-/g, "");
    const st = S.event.ceremonyTime.replace(":", "") + "00";
    const en = S.event.endTime.replace(":", "") + "00";
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: `${S.couple.fullNames} — Wedding`,
      dates: `${d}T${st}/${d}T${en}`,
      ctz: "America/Chicago",
      details: `${S.event.timeText}. Details and updates at https://nbperrodin.com`,
      location: `${S.event.venueName}, ${S.event.venueAddress}`,
    });
    gcal.href = "https://calendar.google.com/calendar/render?" + params.toString();
  }
  const ics = document.getElementById("ics-link");
  if (ics) ics.href = S.event.icsPath;

  /* ---------- Save-the-date form ---------- */
  const form = document.getElementById("std-form");
  if (form) {
    const status = document.getElementById("form-status");
    const submitBtn = form.querySelector('button[type="submit"]');
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (form.website.value) return; // honeypot filled → bot
      // Required-field check with a friendly message (form has novalidate)
      const missing = [...form.querySelectorAll("[required]")].filter((f) => !f.value.trim());
      const emailBad = form.email.value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.value.trim());
      status.className = "form-status";
      if (missing.length || emailBad) {
        missing.forEach((f) => f.setAttribute("aria-invalid", "true"));
        status.textContent = missing.length ? "Please fill in the highlighted fields." : "That email address doesn't look right.";
        status.classList.add("err"); (missing[0] || form.email).focus(); return;
      }
      form.querySelectorAll("[aria-invalid]").forEach((f) => f.removeAttribute("aria-invalid"));
      const data = Object.fromEntries(new FormData(form).entries());
      delete data.website;
      data.submittedAt = new Date().toISOString();
      data.source = location.href;
      if (!S.formEndpoint || S.formEndpoint.startsWith("PASTE_")) {
        status.textContent = "The form isn't connected yet — the Apps Script URL still needs to be added to config.js.";
        status.classList.add("err"); return;
      }
      submitBtn.disabled = true; submitBtn.textContent = "Sending…";
      try {
        await fetch(S.formEndpoint, {
          method: "POST", mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(data),
        });
        if (form.dataset.redirect) {
          submitBtn.textContent = "Saved — one more step…";
          const url = form.dataset.redirect.replace("?thanks=1", "?thanks=" + encodeURIComponent(data.firstName));
          location.href = url; return;
        }
        form.hidden = true;
        status.innerHTML = `<strong>Thank you, ${escapeHtml(data.firstName)}!</strong> We have your address — watch your mailbox for the save the date. Don't forget to add the day to your calendar above.`;
        status.classList.add("ok");
        status.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch (err) {
        status.textContent = "Something went wrong sending your info. Please try again, or text us your address instead.";
        status.classList.add("err");
        submitBtn.disabled = false; submitBtn.textContent = "Send my address";
      }
    });
  }

  /* ---------- "Thanks" banner after the standalone form ---------- */
  const thanks = new URLSearchParams(location.search).get("thanks");
  const cal = document.getElementById("calendar");
  if (thanks && cal) {
    const name = thanks === "1" ? "" : ", " + thanks;
    cal.insertAdjacentHTML("beforebegin", `<div class="form-status ok thanks-banner" role="status">Thank you${escapeHtml(name)}! Your address is in. One last thing — add the day to your calendar below.</div>`);
    setTimeout(() => cal.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
  }

  /* ---------- Venue page ---------- */
  const venueRoot = document.getElementById("venue");
  if (venueRoot && S.venue) {
    const V = S.venue;
    const lead = V.photos[0];
    const rest = V.photos.slice(1);
    venueRoot.innerHTML = `
      <div class="venue-lead">
        ${lead ? `<figure><img src="${lead.src}" alt="${escapeHtml(lead.caption || V.name)}">${lead.caption ? `<figcaption>${escapeHtml(lead.caption)}</figcaption>` : ""}</figure>`
               : `<div class="photo-placeholder venue-placeholder">Venue photo coming soon</div>`}
      </div>
      <div class="venue-about">
        <p class="eyebrow">About the venue</p>
        <h2>The chapel, the hall, and the lake</h2>
        <p class="venue-loc">${escapeHtml(V.location)}</p>
        ${V.about.map((t) => `<p>${escapeHtml(t)}</p>`).join("")}
        <div class="btn-row">
          <a class="btn" href="${S.event.mapsUrl}" target="_blank" rel="noopener">Directions</a>
          <a class="btn ghost" href="${V.website}" target="_blank" rel="noopener">Venue website</a>
        </div>
      </div>
      ${rest.length ? `<div class="venue-grid">${rest.map((p) => `<figure><img src="${p.src}" alt="${escapeHtml(p.caption || V.name)}" loading="lazy">${p.caption ? `<figcaption>${escapeHtml(p.caption)}</figcaption>` : ""}</figure>`).join("")}</div>` : ""}
      ${V.youtubeId ? `
      <div class="venue-video">
        <p class="eyebrow center">Take a look around</p>
        <div class="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/${V.youtubeId}?rel=0" title="${escapeHtml(V.name)} video" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>
        ${V.youtubeCaption ? `<p class="video-cap">${escapeHtml(V.youtubeCaption)}</p>` : ""}
      </div>` : ""}
      ${V.links.length ? `
      <div class="venue-links">
        <p class="eyebrow center">See more</p>
        <div class="link-grid">
          ${V.links.map((l) => `<a class="link-card" href="${l.url}" target="_blank" rel="noopener"><span class="lc-label">${escapeHtml(l.label)}</span>${l.note ? `<span class="lc-note">${escapeHtml(l.note)}</span>` : ""}<span class="lc-arrow">→</span></a>`).join("")}
        </div>
      </div>` : ""}`;
  }

  /* ---------- Wedding party ---------- */
  const partyRoot = document.getElementById("party");
  if (partyRoot) {
    const group = (title, eyebrow, list, cls) => `
      <section class="party-group">
        <p class="eyebrow center">${eyebrow}</p>
        <h2 class="center">${title}</h2>
        <div class="party-grid">
          ${list.map((p) => `
            <div class="person ${cls}">
              <div class="pic">${p.photo ? `<img src="${p.photo}" alt="${escapeHtml(p.name)}">` : `<span class="initials">${initials(p.name)}</span>`}</div>
              <h3>${escapeHtml(p.name)}</h3>
              <div class="role">${escapeHtml(p.role)}</div>
              ${p.note ? `<p>${escapeHtml(p.note)}</p>` : ""}
            </div>`).join("")}
        </div>
      </section>`;
    partyRoot.innerHTML =
      group("The Bridesmaids", `Standing with ${S.couple.partner2}`, S.bridesmaids, "bride") +
      group("The Groomsmen", `Standing with ${S.couple.partner1}`, S.groomsmen, "groom");
  }

  /* ---------- Registry ---------- */
  const regRoot = document.getElementById("registry");
  if (regRoot) {
    regRoot.innerHTML = S.registry.map((r) => `
      <div class="registry-card has-corner">
        <div class="corner-br" data-floral="br"></div>
        <h3>${escapeHtml(r.name)}</h3>
        <p>${escapeHtml(r.blurb || "")}</p>
        <a class="btn" href="${r.url}" target="_blank" rel="noopener">View ${escapeHtml(r.name)} registry</a>
      </div>`).join("");
  }

  /* ---------- Gallery + lightbox ---------- */
  const galRoot = document.getElementById("gallery");
  if (galRoot) {
    galRoot.innerHTML = S.gallery.map((g, i) => `
      <figure>
        <img src="${g.src}" alt="${escapeHtml(g.caption || `Photo ${i + 1}`)}" loading="lazy" data-full="${g.src}">
        ${g.caption ? `<figcaption>${escapeHtml(g.caption)}</figcaption>` : ""}
      </figure>`).join("");
    const lb = document.createElement("div");
    lb.className = "lightbox"; lb.innerHTML = `<button type="button" aria-label="Close">Close ✕</button><img alt="">`;
    document.body.appendChild(lb);
    galRoot.addEventListener("click", (e) => {
      const img = e.target.closest("img"); if (!img) return;
      lb.querySelector("img").src = img.dataset.full; lb.classList.add("open");
    });
    const close = () => lb.classList.remove("open");
    lb.addEventListener("click", close);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  }

  /* ---------- Photo share page ---------- */
  const albumBtn = document.getElementById("album-link");
  if (albumBtn) {
    const ok = S.photoAlbumUrl && !S.photoAlbumUrl.startsWith("PASTE_");
    albumBtn.href = ok ? S.photoAlbumUrl : "#";
    if (!ok) { albumBtn.textContent = "Album link coming soon"; albumBtn.classList.add("ghost"); }
  }

  function initials(n) { return n.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase(); }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
})();
