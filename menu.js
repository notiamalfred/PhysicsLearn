const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");
const header = document.querySelector(".site-header");

menuToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("nav-open");
  menuToggle.classList.toggle("active", isOpen);
  menuToggle.setAttribute("aria-expanded", isOpen);
  document.body.classList.toggle("menu-open", isOpen);
});

// Add a shadow + darker background when the user scrolls past 10px
if (header) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 10) {
      header.classList.add("site-header--scrolled");
    } else {
      header.classList.remove("site-header--scrolled");
    }
  }, { passive: true });
}

/* ---------- Mobile menu height: keep every link reachable by scrolling inside the open menu ---------- */
(function () {
  if (!nav) return;
  const mobile = window.matchMedia("(max-width: 768px)");
  function fitMenu() {
    if (!nav.classList.contains("nav-open") || !mobile.matches) { nav.style.maxHeight = ""; return; }
    const top = nav.getBoundingClientRect().top;
    const h = (window.visualViewport ? window.visualViewport.height : window.innerHeight) - Math.max(top, 0) - 8;
    nav.style.maxHeight = Math.max(140, h) + "px";
  }
  menuToggle.addEventListener("click", () => { fitMenu(); if (nav.classList.contains("nav-open")) nav.scrollTop = 0; });
  window.addEventListener("resize", fitMenu);
  window.addEventListener("orientationchange", fitMenu);
  if (window.visualViewport) window.visualViewport.addEventListener("resize", fitMenu);
  if (mobile.addEventListener) mobile.addEventListener("change", fitMenu);
})();

/* ---------- Back-to-top button ---------- */
(function () {
  const btn = document.createElement("button");
  btn.type = "button"; btn.className = "to-top"; btn.setAttribute("aria-label", "Back to top"); btn.title = "Back to top";
  btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="6 15 12 9 18 15"></polyline></svg>';
  document.body.appendChild(btn);
  const update = () => btn.classList.toggle("is-visible", window.scrollY > Math.max(400, window.innerHeight * 0.6));
  window.addEventListener("scroll", update, { passive: true }); update();
  btn.addEventListener("click", () => {
    const calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: calm ? "auto" : "smooth" });
    const logo = document.querySelector(".logo"); if (logo) logo.focus({ preventScroll: true });
  });
})();

/* ---------- Wide tables: show a "swipe sideways" hint when a table is wider than the screen ---------- */
(function () {
  function sync() {
    document.querySelectorAll(".table-wrap").forEach((wrap) => {
      let hint = wrap.previousElementSibling && wrap.previousElementSibling.classList.contains("table-hint") ? wrap.previousElementSibling : null;
      const wide = wrap.scrollWidth > wrap.clientWidth + 4;
      if (wide && !hint) {
        hint = document.createElement("p"); hint.className = "table-hint"; hint.textContent = "← Swipe sideways to see the whole table →";
        wrap.parentNode.insertBefore(hint, wrap);
        wrap.addEventListener("scroll", () => hint.classList.remove("is-on"), { passive: true, once: true });
      }
      if (hint && !wide) hint.classList.remove("is-on");
      else if (hint && wide && !hint.dataset.done) hint.classList.add("is-on");
      if (hint) wrap.addEventListener("scroll", () => { hint.dataset.done = "1"; }, { passive: true, once: true });
    });
  }
  window.addEventListener("load", sync); window.addEventListener("resize", sync);
  window.addEventListener("load", () => setTimeout(sync, 600)); // after lazy images settle
})();
