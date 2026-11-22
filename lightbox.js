/* Tap a scanned notes page to enlarge it. Esc or a click closes. */
(function () {
  "use strict";
  var box = document.createElement("div");
  box.className = "lightbox"; box.hidden = true;
  box.innerHTML = '<img alt="">';
  document.body.appendChild(box);
  var big = box.querySelector("img");
  function close() { box.hidden = true; document.body.classList.remove("lightbox-open"); }
  document.addEventListener("click", function (e) {
    var img = e.target.closest && e.target.closest(".note-page img");
    if (img) { big.src = img.src; big.alt = img.alt; box.hidden = false; document.body.classList.add("lightbox-open"); }
    else if (!box.hidden) close();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
})();
