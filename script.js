/* Check: menú móvil + placeholders + scroll suave + RSVP (Apps Script) */
(() => {
  "use strict";

  // Menú móvil
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

  // Scroll suave
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href || href === "#") return;
      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });

      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
      window.setTimeout(() => target.removeAttribute("tabindex"), 300);
    });
  });

  // Placeholders de imágenes
  document.querySelectorAll(".media img").forEach(img => {
    img.addEventListener("error", () => {
      const box = img.closest(".media");
      if (!box) return;
      box.classList.add("fallback");
      const ph = box.querySelector(".ph");
      if (ph && ph.dataset && ph.dataset.text) ph.textContent = ph.dataset.text;
    });
  });

  // RSVP: toggle + guests + validación + iframe load
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
