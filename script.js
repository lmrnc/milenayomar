(function () {
  // ---------- Menu overlay ----------
  const menuBtn = document.getElementById("menuBtn");
  const menuOverlay = document.getElementById("menuOverlay");
  const closeEls = menuOverlay ? menuOverlay.querySelectorAll("[data-menu-close]") : [];
  const linkEls = menuOverlay ? menuOverlay.querySelectorAll("[data-menu-link]") : [];

  let menuOpen = false;
  let lastFocus = null;

  const applyHidden = (el, hide) => {
    if (!el) return;
    if (hide) {
      el.setAttribute("hidden", "");
      el.hidden = true;
    } else {
      el.hidden = false;
      el.removeAttribute("hidden");
    }
  };

  const lockScroll = (lock) => {
    document.body.classList.toggle("menu-lock", lock);
  };

  const focusableSelector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])"
  ].join(",");

  const getFocusable = (root) => {
    if (!root) return [];
    return Array.from(root.querySelectorAll(focusableSelector))
      .filter(el => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true");
  };

  const openMenu = () => {
    if (!menuBtn || !menuOverlay || menuOpen) return;

    menuOpen = true;
    lastFocus = document.activeElement;

    applyHidden(menuOverlay, false);

    // next frame -> animate in
    requestAnimationFrame(() => menuOverlay.classList.add("is-open"));

    menuBtn.setAttribute("aria-expanded", "true");
    lockScroll(true);

    // focus inside panel
    const panel = menuOverlay.querySelector(".menu-panel");
    const focusables = getFocusable(menuOverlay);
    (focusables[0] || panel || menuOverlay).focus?.({ preventScroll: true });
  };

  const closeMenu = () => {
    if (!menuBtn || !menuOverlay || !menuOpen) return;

    menuOpen = false;
    menuOverlay.classList.remove("is-open");

    menuBtn.setAttribute("aria-expanded", "false");
    lockScroll(false);

    // wait animation end, then hide
    window.setTimeout(() => applyHidden(menuOverlay, true), 260);

    // restore focus
    if (lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus({ preventScroll: true });
    } else {
      menuBtn.focus({ preventScroll: true });
    }
  };

  const toggleMenu = () => (menuOpen ? closeMenu() : openMenu());

  if (menuBtn && menuOverlay) {
    applyHidden(menuOverlay, true);

    menuBtn.addEventListener("click", (e) => {
      e.preventDefault();
      toggleMenu();
    });

    closeEls.forEach(el => el.addEventListener("click", (e) => {
      e.preventDefault();
      closeMenu();
    }));

    linkEls.forEach(el => el.addEventListener("click", () => closeMenu()));

    document.addEventListener("keydown", (e) => {
      if (!menuOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu();
        return;
      }

      // Focus trap
      if (e.key === "Tab") {
        const focusables = getFocusable(menuOverlay);
        if (!focusables.length) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  // ---------- Countdown ----------
  const cdDays = document.getElementById("cdDays");
  const cdHours = document.getElementById("cdHours");
  const cdMinutes = document.getElementById("cdMinutes");
  const cdSeconds = document.getElementById("cdSeconds");
  const cdDone = document.getElementById("cdDone");

  const targetISO = "2027-04-09T17:00:00+02:00";
  const target = new Date(targetISO).getTime();
  const pad2 = (n) => String(n).padStart(2, "0");

  function renderCountdown() {
    const now = Date.now();
    const diff = target - now;

    if (diff <= 0) {
      if (cdDone) cdDone.hidden = false;
      if (cdDays) cdDays.textContent = "0";
      if (cdHours) cdHours.textContent = "00";
      if (cdMinutes) cdMinutes.textContent = "00";
      if (cdSeconds) cdSeconds.textContent = "00";
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (cdDone) cdDone.hidden = true;
    if (cdDays) cdDays.textContent = String(days);
    if (cdHours) cdHours.textContent = pad2(hours);
    if (cdMinutes) cdMinutes.textContent = pad2(minutes);
    if (cdSeconds) cdSeconds.textContent = pad2(seconds);
  }

  renderCountdown();
  setInterval(renderCountdown, 1000);

  // ---------- RSVP (Google Apps Script via hidden iframe) ----------
  const form = document.getElementById("rsvpForm");
  const iframe = document.getElementById("rsvpHiddenFrame");

  const sending = document.getElementById("rsvpSending");
  const success = document.getElementById("rsvpSuccess");
  const error = document.getElementById("rsvpError");

  let pendingSubmit = false;

  function show(el) { if (el) el.hidden = false; }
  function hide(el) { if (el) el.hidden = true; }
  function resetStatus() { hide(sending); hide(success); hide(error); }

  if (form && iframe) {
    form.addEventListener("submit", () => {
      resetStatus();
      pendingSubmit = true;
      show(sending);
    });

    iframe.addEventListener("load", () => {
      if (!pendingSubmit) return;
      pendingSubmit = false;

      hide(sending);
      show(success);

      try { form.reset(); } catch (_) {}
      success?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });

    form.addEventListener("submit", () => {
      const action = form.getAttribute("action") || "";
      if (action.includes("REPLACE_WITH_APPS_SCRIPT_URL")) {
        hide(sending);
        show(error);
        if (error) error.textContent = "xxxxxxxxx";
        pendingSubmit = false;
      }
    }, { capture: true });
  }

  // ---------- Hero video autoplay fallback ----------
  const video = document.querySelector(".hero-video");
  const fallbackToImage = () => document.documentElement.classList.add("no-hero-video");

  if (video) {
    video.addEventListener("error", fallbackToImage, { once: true });

    const tryPlay = async () => {
      try {
        video.muted = true;
        video.playsInline = true;
        const p = video.play();
        if (p && typeof p.then === "function") await p;
        if (video.paused) fallbackToImage();
      } catch (_) {
        fallbackToImage();
      }
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", tryPlay, { once: true });
    } else {
      tryPlay();
    }
  }
})();
