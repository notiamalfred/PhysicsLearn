/* Original scanned notes: only shown to signed-in students.
   The images are NOT in this repository. They live in a private Supabase Storage bucket ("notes-scans"),
   and only a signed-in user gets short-lived links to them (see supabase-scans-storage.sql). */
(function () {
  "use strict";
  const details = document.getElementById("part-scans"), box = document.getElementById("scan-pages"), status = document.getElementById("scan-status");
  if (!details || !box || !status) return;
  const BUCKET = "notes-scans", first = parseInt(box.dataset.first, 10), last = parseInt(box.dataset.last, 10);
  const pad = (n) => String(n).padStart(2, "0");
  let loaded = false, loading = false;

  function showSignIn(text) {
    box.textContent = ""; loaded = false;
    status.textContent = text || "The original scanned pages are only available to signed-in students.";
    const next = encodeURIComponent(location.pathname.split("/").pop() + "#part-scans");
    const a = document.createElement("a"); a.className = "btn"; a.href = "login.html?next=" + next; a.textContent = "Sign in to view the scans";
    box.appendChild(a);
  }
  async function load() {
    if (loading || loaded) return; loading = true;
    try {
      if (!window.PL) { showSignIn("Accounts aren't set up on this site yet."); return; }
      const { data: u, error } = await window.PL.db.auth.getUser();   // asks the server, so a stale session is caught
      if (error || !u || !u.user) { showSignIn(); return; }
      status.textContent = "Loading the scanned pages…";
      const pages = []; for (let n = first; n <= last; n++) pages.push(n);
      const { data, error: e2 } = await window.PL.db.storage.from(BUCKET).createSignedUrls(pages.map((n) => "page-" + pad(n) + ".jpg"), 3600);
      if (e2 || !data) throw e2 || new Error("no data");
      box.textContent = "";
      data.forEach((row, i) => {
        if (!row.signedUrl) return;
        const n = pages[i], f = document.createElement("figure"); f.className = "note-page"; f.id = "page-" + n;
        const img = document.createElement("img"); img.src = row.signedUrl; img.alt = "Scanned notes, page " + n; img.loading = "lazy";
        const c = document.createElement("figcaption"); c.textContent = "Notes page " + n;
        f.append(img, c); box.appendChild(f);
      });
      status.textContent = "Tap any page to enlarge."; loaded = true;
    } catch (err) {
      console.error("Couldn't load the scans:", err);
      status.textContent = "We couldn't load the scanned pages. Please refresh and try again."; box.textContent = "";
    } finally { loading = false; }
  }
  details.addEventListener("toggle", () => { if (details.open) load(); });
  document.querySelectorAll('a[href="#part-scans"]').forEach((a) => a.addEventListener("click", () => { details.open = true; }));
  if (location.hash === "#part-scans") details.open = true;
})();
