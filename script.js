/* Check: menú móvil + placeholders + smooth scroll + countdown + RSVP (Apps Script) */
(() => {
  "use strict";

  // 1) Menú móvil
  const navBtn = document.querySelector(".navbtn");
  const navPanel = document.querySelector(".navpanel");

  if (navBtn && navPanel) {
    navBtn.addEventListener("click", () => {
      const open = navPanel.classList.toggle("open");
      navBtn.setAttribute("aria-expanded", String(open));
      navBtn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    });

    navPanel.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener("click", () => {
        navPanel.classList.remove("open");
        navBtn.setAttribute("aria-expanded", "false");
        navBtn.setAttribute("aria-label", "Abrir menú");
      });
    });
  }

  // 2) Smooth scroll (sin romper accesibilidad)
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href || href === "#") return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });

      // Mover foco para accesibilidad sin saltos bruscos
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
      window.setTimeout(() => target.removeAttribute("tabindex"), 300);
    });
  });

  // 3) Placeholders de imágenes (si falta el archivo)
  document.querySelectorAll(".media img").forEach(img => {
    img.addEventListener("error", () => {
      const box = img.closest(".media");
      if (!box) return;
      box.classList.add("fallback");
      const ph = box.querySelector(".ph");
      if (ph && ph.dataset && ph.dataset.text) ph.textContent = ph.dataset.text;
    });
  });

  // 4) Countdown
  const countdown = document.querySelector(".countdown");
  if (countdown) {
    const targetStr = countdown.getAttribute("data-date");
    const msg = countdown.querySelector(".cd__msg");

    const units = {
      days: countdown.querySelector('[data-unit="days"]'),
      hours: countdown.querySelector('[data-unit="hours"]'),
      minutes: countdown.querySelector('[data-unit="minutes"]'),
      seconds: countdown.querySelector('[data-unit="seconds"]'),
    };

    const pad2 = (n) => String(n).padStart(2, "0");
    const target = new Date(targetStr);

    const tick = () => {
      const now = new Date();
      let diffMs = target - now;

      if (diffMs <= 0) {
        if (units.days) units.days.textContent = "00";
        if (units.hours) units.hours.textContent = "00";
        if (units.minutes) units.minutes.textContent = "00";
        if (units.seconds) units.seconds.textContent = "00";
        if (msg) msg.textContent = "¡Hoy es el día!";
        return;
      }

      const totalSeconds = Math.floor(diffMs / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      if (units.days) units.days.textContent = String(days);
      if (units.hours) units.hours.textContent = pad2(hours);
      if (units.minutes) units.minutes.textContent = pad2(minutes);
      if (units.seconds) units.seconds.textContent = pad2(seconds);
      if (msg) msg.textContent = "";
    };

    tick();
    setInterval(tick, 1000);
  }

  // 5) RSVP (toggle + guests + validación + iframe load)
  const form = document.getElementById("rsvpForm");
  const frame = document.getElementById("rsvpFrame");

  if (form) {
    const status = form.querySelector(".status");
    const segBtns = form.querySelectorAll(".seg__btn");
    const attend = form.querySelector('input[name="attend"]');

    const nameInput = form.querySelector('input[name="name"]');
    const emailInput = form.querySelector('input[name="email"]');

    const guestList = document.getElementById("guestList");
    const addGuest = document.getElementById("addGuest");

    // Toggle yes/no
    segBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        segBtns.forEach(b => {
          b.classList.remove("is-on");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("is-on");
        btn.setAttribute("aria-pressed", "true");
        const v = btn.getAttribute("data-value") || "yes";
        if (attend) attend.value = v;
      });
    });

    // Add guest
    if (addGuest && guestList) {
      addGuest.addEventListener("click", () => {
        const input = document.createElement("input");
        input.type = "text";
        input.name = "guest[]";
        input.placeholder = "Nombre del acompañante";
        guestList.appendChild(input);
        input.focus();
      });
    }

    const isEmailValid = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val || "").trim());

    form.addEventListener("submit", (e) => {
      const nameOk = nameInput && String(nameInput.value || "").trim().length > 1;
      const emailOk = emailInput && isEmailValid(emailInput.value);

      if (!nameOk || !emailOk) {
        e.preventDefault();
        if (status) status.textContent = !nameOk ? "Revisa el nombre (obligatorio)." : "Revisa el email (obligatorio).";
        if (!nameOk && nameInput) nameInput.focus();
        else if (!emailOk && emailInput) emailInput.focus();
        return;
      }

      if (status) status.textContent = "Enviando…";
    });

    // Feedback al cargar iframe
    if (frame) {
      frame.addEventListener("load", () => {
        const action = form.getAttribute("action") || "";
        const isPlaceholder = action.includes("REPLACE_WITH_APPS_SCRIPT_URL");

        if (status) {
          status.textContent = isPlaceholder
            ? "Formulario listo. Falta conectar la URL de Google Sheets."
            : "¡Gracias! Tu confirmación se ha registrado.";
        }

        if (!isPlaceholder) {
          form.reset();

          // volver a Yes por defecto
          if (attend) attend.value = "yes";
          segBtns.forEach(b => {
            const isYes = (b.getAttribute("data-value") || "") === "yes";
            b.classList.toggle("is-on", isYes);
            b.setAttribute("aria-pressed", String(isYes));
          });

          if (guestList) guestList.innerHTML = "";
        }
      });
    }
  }
})();
