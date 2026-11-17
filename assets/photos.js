/* nbperrodin.com/photos — guest photo + video uploader.
   Files go to the Google Drive folder "Wedding Guest Photos" through the
   Apps Script in apps-script/PhotoUpload.gs (config.js → photoUploadEndpoint).

   For each file: ask the script for a one-time Drive upload address, then send
   the file straight to Drive ("direct"). If the phone can't reach that address,
   send the file through the script in 4 MB pieces instead ("relay"). */
(function () {
  const S = window.SITE || {};
  const endpoint = S.photoUploadEndpoint || "";
  const ready = endpoint && !endpoint.startsWith("PASTE_");

  const $ = (id) => document.getElementById(id);
  const card = $("snap");
  if (!card) return;
  const actions = $("snap-actions"), closed = $("snap-closed"), list = $("snap-list");
  const statusBox = $("snap-status"), statusText = $("snap-status-text"), barFill = $("snap-bar-fill"), retryBtn = $("snap-retry");
  const guestInput = $("snap-guest");

  /* Optional link to a Google Photos album, if one is set in config.js */
  if (S.photoAlbumUrl && !S.photoAlbumUrl.startsWith("PASTE_")) {
    $("snap-album-link").href = S.photoAlbumUrl;
    $("snap-album").hidden = false;
  }

  if (!ready) {
    actions.hidden = true;
    card.querySelector(".snap-name").hidden = true;
    closed.hidden = false;
    return;
  }

  /* Camera buttons only make sense on a phone or tablet */
  const touch = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  if (!touch) {
    card.querySelectorAll(".snap-cam").forEach((el) => { el.hidden = true; });
    $("snap-library-label").textContent = "Choose photos & videos";
    card.querySelector('label[for="snap-library"]').classList.remove("ghost");
  }

  /* Remember the guest's name between visits */
  try { guestInput.value = localStorage.getItem("snapGuest") || ""; } catch (e) {}
  guestInput.addEventListener("change", () => { try { localStorage.setItem("snapGuest", guestInput.value.trim()); } catch (e) {} });

  /* ---------- Queue ---------- */
  const CHUNK = 4 * 1024 * 1024;          // relay piece size (multiple of 256 KB)
  const TYPES = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", heic: "image/heic", heif: "image/heif", webp: "image/webp", gif: "image/gif", avif: "image/avif", dng: "image/x-adobe-dng",
                  mp4: "video/mp4", mov: "video/quicktime", m4v: "video/x-m4v", webm: "video/webm", "3gp": "video/3gpp", avi: "video/x-msvideo", mkv: "video/x-matroska" };
  const items = [];
  const seen = new Set();
  let mode = "direct";                    // switches to "relay" if direct uploads don't work on this phone
  let directWorked = false;
  let running = 0;
  let wakeLock = null;

  function mimeOf(file) {
    if (/^(image|video)\//.test(file.type)) return file.type;
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    return TYPES[ext] || "";
  }

  function addFiles(fileList) {
    Array.from(fileList || []).forEach((file) => {
      const key = [file.name, file.size, file.lastModified].join("|");
      if (seen.has(key)) return;
      seen.add(key);
      const mime = mimeOf(file);
      const it = { file, mime, status: mime && file.size ? "queued" : "skipped", progress: 0, tries: 0 };
      it.el = row(it);
      list.prepend(it.el);
      items.push(it);
      paint(it);
      thumb(it);
    });
    pump();
  }

  ["snap-photo", "snap-video", "snap-library"].forEach((id) => {
    $(id).addEventListener("change", (e) => { addFiles(e.target.files); e.target.value = ""; });
  });
  retryBtn.addEventListener("click", () => {
    items.forEach((it) => { if (it.status === "failed") { it.status = "queued"; it.progress = 0; it.tries = 0; paint(it); } });
    pump();
  });

  /* ---------- Rows ---------- */
  function row(it) {
    const li = document.createElement("li");
    li.className = "snap-item";
    li.innerHTML = '<div class="snap-thumb"></div><div class="snap-meta"><div class="snap-file"></div><div class="snap-state"></div><div class="snap-bar"><i></i></div></div>';
    li.querySelector(".snap-file").textContent = it.file.name || (it.mime.indexOf("video") === 0 ? "Video" : "Photo");
    li.querySelector(".snap-thumb").textContent = it.mime.indexOf("video") === 0 ? "Video" : "";
    return li;
  }
  function paint(it) {
    const label = { queued: "Waiting…", uploading: "Sending… " + Math.round(it.progress * 100) + "%", done: "Added ✓", failed: "Didn't go through", skipped: "Not a photo or video — skipped" }[it.status];
    it.el.dataset.status = it.status;
    it.el.querySelector(".snap-state").textContent = label + (it.status === "queued" || it.status === "uploading" ? " · " + sizeText(it.file.size) : "");
    it.el.querySelector(".snap-bar i").style.width = (it.status === "done" ? 100 : Math.round(it.progress * 100)) + "%";
    summary();
  }
  function sizeText(n) { return n > 1048576 * 1024 ? (n / 1073741824).toFixed(1) + " GB" : n > 1048576 ? Math.round(n / 1048576) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB"; }

  /* Small previews, made one at a time so a big batch doesn't swamp the phone */
  let thumbChain = Promise.resolve();
  function thumb(it) {
    if (it.mime.indexOf("image") !== 0 || !window.createImageBitmap) return;
    thumbChain = thumbChain.then(async () => {
      try {
        const bmp = await createImageBitmap(it.file, { resizeWidth: 160, resizeQuality: "low" });
        const c = document.createElement("canvas");
        c.width = bmp.width; c.height = bmp.height;
        c.getContext("2d").drawImage(bmp, 0, 0);
        if (bmp.close) bmp.close();
        it.el.querySelector(".snap-thumb").appendChild(c);
      } catch (e) { /* no preview (e.g. HEIC on some phones) — the upload still works */ }
    });
  }

  function summary() {
    const real = items.filter((i) => i.status !== "skipped");
    if (!real.length) { statusBox.hidden = true; return; }
    const done = real.filter((i) => i.status === "done").length;
    const failed = real.filter((i) => i.status === "failed").length;
    const active = real.length - done - failed;
    const bytes = real.reduce((a, i) => a + i.file.size, 0) || 1;
    const sent = real.reduce((a, i) => a + i.file.size * (i.status === "done" ? 1 : i.status === "failed" ? 0 : i.progress), 0);
    statusBox.hidden = false;
    statusBox.dataset.state = active ? "busy" : failed ? "failed" : "done";
    barFill.style.width = Math.round((sent / bytes) * 100) + "%";
    retryBtn.hidden = !(failed && !active);
    if (active) statusText.textContent = "Sending " + Math.min(done + 1, real.length) + " of " + real.length + " — keep this page open";
    else if (failed) statusText.textContent = done + " added, " + failed + " didn't go through. Check your signal and try again.";
    else statusText.textContent = (done === 1 ? "1 added" : "All " + done + " added") + " — thank you! Add more any time.";
  }

  /* ---------- Upload workers ---------- */
  function pump() {
    const limit = mode === "relay" ? 1 : 2;
    while (running < limit) {
      const it = items.find((i) => i.status === "queued");
      if (!it) break;
      it.status = "uploading"; paint(it);
      running++;
      keepAwake(true);
      send(it).then(
        () => { it.status = "done"; it.progress = 1; },
        () => { it.status = "failed"; }
      ).then(() => {
        running--; paint(it);
        if (!running && !items.some((i) => i.status === "queued")) keepAwake(false);
        pump();
      });
    }
  }

  async function send(it) {
    let lastErr;
    for (it.tries = 1; it.tries <= 3; it.tries++) {
      try {
        if (mode === "direct") {
          try {
            await direct(await open(it), it);
            directWorked = true;
            return;
          } catch (err) {
            if (err && err.fatal) throw err;
            /* Direct didn't work — send this one through the script instead. */
            it.progress = 0; paint(it);
            await relay(await open(it), it);
            if (!directWorked) mode = "relay";
            return;
          }
        }
        await relay(await open(it), it);
        return;
      } catch (err) {
        lastErr = err;
        if (err && err.fatal) break;
        it.progress = 0; paint(it);
        await wait(1500 * it.tries);
      }
    }
    throw lastErr || new Error("Upload failed");
  }

  async function api(body) {
    const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error("Server " + res.status);
    return res.json();
  }

  /* Ask the script for a one-time Drive upload address for this file */
  async function open(it) {
    const r = await api({ action: "start", name: it.file.name, mime: it.mime, size: it.file.size, guest: guestInput.value.trim() });
    if (!r.ok || !r.uploadUrl) { const e = new Error(r.error || "Could not start"); e.fatal = /closed|too large|Only photos/i.test(r.error || ""); throw e; }
    return r.uploadUrl;
  }

  function direct(url, it) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);
      xhr.setRequestHeader("Content-Type", it.mime);
      xhr.upload.onprogress = (e) => { if (e.lengthComputable) { it.progress = e.loaded / e.total; paint(it); } };
      xhr.onload = () => (xhr.status === 200 || xhr.status === 201 ? resolve() : reject(new Error("Drive " + xhr.status)));
      xhr.onerror = xhr.onabort = xhr.ontimeout = () => reject(new Error("Network"));
      xhr.send(it.file);
    });
  }

  async function relay(url, it) {
    const total = it.file.size;
    let offset = 0;
    while (offset < total) {
      const data = await base64(it.file.slice(offset, Math.min(offset + CHUNK, total)));
      let r, err;
      for (let n = 1; n <= 3; n++) {
        try { r = await api({ action: "chunk", uploadUrl: url, mime: it.mime, total, offset, data }); if (r.ok) break; err = new Error(r.error); }
        catch (e) { err = e; }
        r = null;
        await wait(1200 * n);
      }
      if (!r) throw err || new Error("Piece failed");
      if (r.done) return;
      offset = typeof r.next === "number" && r.next > 0 ? r.next : offset + CHUNK;
      it.progress = Math.min(offset / total, 0.99); paint(it);
    }
    throw new Error("Drive did not confirm the file");
  }

  function base64(blob) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result).split(",")[1] || "");
      fr.onerror = () => reject(fr.error);
      fr.readAsDataURL(blob);
    });
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /* Keep the screen on while sending, and warn before leaving mid-upload */
  async function keepAwake(on) {
    try {
      if (on && !wakeLock && navigator.wakeLock) { wakeLock = await navigator.wakeLock.request("screen"); wakeLock.addEventListener("release", () => { wakeLock = null; }); }
      if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
    } catch (e) {}
  }
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && running) keepAwake(true); });
  window.addEventListener("beforeunload", (e) => { if (running) { e.preventDefault(); e.returnValue = ""; } });
})();
