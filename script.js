/* =========================
   Minimal interactions
   - Mobile nav toggle (only matters under 740px)
   - Countdown to 2027-04-09T17:00:00+02:00
   - RSVP hidden iframe success
   ========================= */

(function () {
  // ---------- Mobile nav ----------
  const toggleBtn = document.querySelector(".nav-toggle");
  const navPanel = document.getElementById("navPanel");

  if (toggleBtn && navPanel) {
    const setPanel = (open) => {
      toggleBtn.setAttribute("aria-expanded", String(open));
      navPanel.hidden = !open;
    };

    // Ensure closed on load
    setPanel(false);

    toggleBtn.addEventListener("click", () => {
      const open = toggleBtn.getAttribute("aria-expanded") !== "true";
      setPanel(open);
    });

    navPanel.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (a) setPanel(false);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setPanel(false);
    });

    // If user resizes to desktop, keep panel closed
    window.addEventListener("resize", () => {
      if (window.matchMedia("(min-width: 741px)").matches) {
        setPanel(false);
      }
    }, { passive: true });
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
})();
