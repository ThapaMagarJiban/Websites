(function () {
  "use strict";
  const menuButton = document.querySelector("[data-menu-button]");
  const nav = document.querySelector("[data-nav]");
  function closeMenu() {
    if (!menuButton || !nav) return;
    nav.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation");
  }
  if (menuButton && nav) {
    menuButton.addEventListener("click", function () {
      const open = nav.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    });
    nav.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
    document.addEventListener("click", event => {
      if (nav.classList.contains("open") && !nav.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
    });
    document.addEventListener("keydown", event => { if (event.key === "Escape") closeMenu(); });
    window.addEventListener("resize", () => { if (window.innerWidth > 1040) closeMenu(); });
  }
  document.querySelectorAll("[data-year]").forEach(element => { element.textContent = String(new Date().getFullYear()); });
  document.querySelectorAll("[data-filter]").forEach(button => button.addEventListener("click", () => {
    document.querySelectorAll("[data-filter]").forEach(item => { item.classList.remove("selected"); item.setAttribute("aria-pressed", "false"); });
    button.classList.add("selected"); button.setAttribute("aria-pressed", "true");
    const group = button.dataset.filter;
    document.querySelectorAll("[data-portfolio]").forEach(card => { card.hidden = group !== "all" && card.dataset.portfolio !== group; });
  }));
  function closeLightbox(overlay) { overlay.remove(); document.body.style.overflow = ""; }
  document.querySelectorAll("[data-lightbox]").forEach(img => {
    img.tabIndex = 0;
    img.setAttribute("role", "button");
    img.setAttribute("aria-label", "Open image: " + (img.alt || "image"));
    function open() {
      const overlay = document.createElement("div"); overlay.className = "lightbox"; overlay.setAttribute("role", "dialog"); overlay.setAttribute("aria-modal", "true"); overlay.setAttribute("aria-label", img.alt || "Image preview");
      const close = document.createElement("button"); close.className = "lightbox-close"; close.type = "button"; close.setAttribute("aria-label", "Close image preview"); close.textContent = "×";
      const large = document.createElement("img"); large.src = img.src; large.alt = img.alt || "";
      overlay.append(close, large); document.body.append(overlay); document.body.style.overflow = "hidden"; close.focus();
      overlay.addEventListener("click", event => { if (event.target === overlay || event.target === close) closeLightbox(overlay); });
      const esc = event => { if (event.key === "Escape") { closeLightbox(overlay); document.removeEventListener("keydown", esc); img.focus(); } };
      document.addEventListener("keydown", esc);
    }
    img.addEventListener("click", open);
    img.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); } });
  });
})();
