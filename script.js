/* =========================
   Minimal interactions
   - Mobile nav toggle (under 740px)
   - Mobile header auto-hide on scroll (under 740px)
   - Countdown to 2027-04-09T17:00:00+02:00
   - RSVP hidden iframe success
   - Hero video autoplay fallback
   ========================= */

(function () {
  const header = document.querySelector(".site-header");

  // ---------- Helper: set header height CSS var ----------
  const setHeaderHeightVar = () => {
    if (!header) return;
    const h = Math.round(header.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--header-h", `${h}px`);
  };
  setHeaderHeightVar();
  window.addEventListener("resize", setHeaderHeightVar, { passive: true });

  // ---------- Mobile nav ----------
  const toggleBtn = document.querySelector(".nav-toggle");
  const navPanel = document.getElementById("navPanel");

  const isMobile = () => window.matchMedia("(max-width: 740px)").matches;

  const setMenuOpen = (open) => {
    if (!toggleBtn || !navPanel) return;
    toggleBtn.setAttribute("aria-expanded", String(open));
    navPanel.hidden = !open;

    if (header) {
      header.classList.toggle("menu-open", open);
    }
    document.body.classList.toggle("lock-scroll", open && isMobile());
  };

  if (toggleBtn && navPanel) {
    setMenuOpen(false);

    toggleBtn.addEventListener("click", () => {
      const open = toggleBtn.getAttribute("aria-expanded") !== "true";
      setMenuOpen(open);
    });

    navPanel.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (a) setMenuOpen(false);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    });

    window.addEventListener("resize", () => {
      // al pasar a desktop, cerramos panel y desbloqueamos scroll
      if (!isMobile()) setMenuOpen(false);
      setHeaderHeightVar();
    }, { passive: true });
  }

  // ---------- Mobile header auto-hide on scroll ----------
  let lastY = window.scrollY || 0;

  const onScroll = () => {
    if (!header) return;
    if (!isMobile()) {
      header.classList.remove("header-hidden");
      return;
    }

    // si menú abierto, no ocultar
    if (header.classList.contains("menu-open")) {
      header.classList.remove("header-hidden");
      return;
    }

    const y = window.scrollY || 0;
    const delta = y - lastY;

    // cerca del top, siempre visible
    if (y < 20) {
      header.classList.remove("header-hidden");
      lastY = y;
      return;
    }

    // umbral para evitar parpadeo
    if (Math.abs(delta) < 8) return;

    if (delta > 0) {
      // scrollea hacia abajo -> ocultar
      header.classList.add("header-hidden");
    } else {
      // hacia arriba -> mostrar
      header.classList.remove("header-hidden");
    }
    lastY = y;
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

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

  function resetStatus() {
    hide(sending);
    hide(success);
    hide(error);
  }

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
