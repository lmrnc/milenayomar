/* Check: navegación móvil + placeholders de imágenes + countdown + RSVP + lightbox (aunque galería esté oculta) */
(() => {
  "use strict";

  // ----------------------------
  // 1) Menú móvil (toggle + cerrar al clicar)
  // ----------------------------
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");

  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      navToggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
    });

    nav.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", () => {
        if (nav.classList.contains("open")) {
          nav.classList.remove("open");
          navToggle.setAttribute("aria-expanded", "false");
          navToggle.setAttribute("aria-label", "Abrir menú");
        }
      });
    });
  }

  // ----------------------------
  // 2) Placeholders de imágenes (si el archivo no existe)
  // Usa el wrapper .media-fallback para mostrar .img-placeholder
  // ----------------------------
  document.querySelectorAll("img").forEach((img) => {
    img.addEventListener("error", () => {
      const parent = img.parentElement;
      if (parent) parent.classList.add("media-fallback");

      // Si hay data-placeholder, úsalo como texto visible dentro del placeholder
      const ph = parent ? parent.querySelector(".img-placeholder") : null;
      if (ph && ph.dataset && ph.dataset.placeholder) {
        ph.textContent = ph.dataset.placeholder;
      }
    });
  });

  // ----------------------------
  // 3) Countdown (data-date en .countdown)
  // Requisito: no negativos + mensaje "¡Hoy es el día!"
  // ----------------------------
  const countdown = document.querySelector(".countdown");
  if (countdown) {
    const targetStr = countdown.getAttribute("data-date");
    const messageEl = countdown.querySelector(".countdown-message");

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
        // Check: llegó el día
        if (units.days) units.days.textContent = "00";
        if (units.hours) units.hours.textContent = "00";
        if (units.minutes) units.minutes.textContent = "00";
        if (units.seconds) units.seconds.textContent = "00";
        if (messageEl) messageEl.textContent = "¡Hoy es el día!";
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
      if (messageEl) messageEl.textContent = "";
    };

    tick();
    setInterval(tick, 1000);
  }

  // ----------------------------
  // 4) RSVP (segmentado + añadir invitados + validación + feedback + iframe load)
  // ----------------------------
  const rsvpForm = document.getElementById("rsvpForm");
  const rsvpFrame = document.getElementById("rsvpFrame");

  if (rsvpForm) {
    const statusEl = rsvpForm.querySelector(".form-status");
    const segments = rsvpForm.querySelectorAll(".segment");
    const hiddenAttend = rsvpForm.querySelector('input[name="attend"]');

    const nameInput = rsvpForm.querySelector('input[name="name"]');
    const emailInput = rsvpForm.querySelector('input[name="email"]');

    // Segmented control
    segments.forEach((btn) => {
      btn.addEventListener("click", () => {
        segments.forEach((b) => {
          b.classList.remove("active");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-pressed", "true");

        const v = btn.getAttribute("data-value") || "yes";
        if (hiddenAttend) hiddenAttend.value = v;
      });
    });

    // Add guest inputs
    const addGuestBtn = document.getElementById("addGuest");
    const guestList = document.getElementById("guestList");

    if (addGuestBtn && guestList) {
      addGuestBtn.addEventListener("click", () => {
        const input = document.createElement("input");
        input.type = "text";
        input.name = "guest[]";
        input.placeholder = "Nombre del acompañante";
        guestList.appendChild(input);
      });
    }

    // Validación
    const isEmailValid = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val || "").trim());

    rsvpForm.addEventListener("submit", (e) => {
      // Check: validar antes de enviar
      const nameOk = nameInput && String(nameInput.value || "").trim().length > 1;
      const emailOk = emailInput && isEmailValid(emailInput.value);

      if (!nameOk || !emailOk) {
        e.preventDefault();
        if (statusEl) {
          statusEl.textContent = !nameOk
            ? "Revisa el nombre (obligatorio)."
            : "Revisa el email (obligatorio).";
        }
        // focus al primer campo inválido
        if (!nameOk && nameInput) nameInput.focus();
        else if (!emailOk && emailInput) emailInput.focus();
        return;
      }

      if (statusEl) statusEl.textContent = "Enviando…";
    });

    // Feedback al completar (cuando el iframe carga)
    if (rsvpFrame) {
      rsvpFrame.addEventListener("load", () => {
        // Si el action sigue siendo placeholder, no damos “ok” para no confundir
        const action = rsvpForm.getAttribute("action") || "";
        const isPlaceholder = action.includes("REPLACE_WITH_APPS_SCRIPT_URL");

        if (statusEl) {
          statusEl.textContent = isPlaceholder
            ? "Formulario listo. Falta conectar la URL de Google Sheets."
            : "¡Gracias! Tu confirmación se ha registrado.";
        }

        if (!isPlaceholder) {
          // reset solo si realmente enviamos a un endpoint real
          rsvpForm.reset();

          // dejar Yes por defecto
          if (hiddenAttend) hiddenAttend.value = "yes";
          segments.forEach((b) => {
            const isYes = (b.getAttribute("data-value") || "") === "yes";
            b.classList.toggle("active", isYes);
            b.setAttribute("aria-pressed", String(isYes));
          });

          // limpiar lista de invitados
          if (guestList) guestList.innerHTML = "";
        }
      });
    }
  }

  // ----------------------------
  // 5) Galería: filtros + Lightbox
  // (si la galería está oculta, no hace nada)
  // ----------------------------
  const filterButtons = document.querySelectorAll(".filter-btn");
  const galleryItems = document.querySelectorAll(".gallery-item");
  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightboxImage");
  const lightboxClose = document.querySelector(".lightbox-close");

  // Filtros
  if (filterButtons.length && galleryItems.length) {
    const setActive = (btn) => {
      filterButtons.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("active", active);
        b.setAttribute("aria-selected", active ? "true" : "false");
      });
    };

    const applyFilter = (filter) => {
      galleryItems.forEach((item) => {
        const cat = item.getAttribute("data-category");
        const show = filter === "all" || cat === filter;
        item.style.display = show ? "" : "none";
      });
    };

    filterButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const filter = btn.getAttribute("data-filter") || "all";
        setActive(btn);
        applyFilter(filter);
      });
    });
  }

  // Lightbox
  const openLightbox = (src, alt) => {
    if (!lightbox || !lightboxImage) return;
    lightboxImage.src = src;
    lightboxImage.alt = alt || "Imagen ampliada";
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    if (!lightbox || !lightboxImage) return;
    lightbox.setAttribute("aria-hidden", "true");
    lightboxImage.src = "";
    document.body.style.overflow = "";
  };

  if (galleryItems.length && lightbox) {
    galleryItems.forEach((item) => {
      item.addEventListener("click", () => {
        const img = item.querySelector("img");
        if (!img) return;
        // si la imagen no carga (placeholder), evitamos abrir
        if (!img.getAttribute("src")) return;
        openLightbox(img.src, img.alt);
      });
    });

    if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);

    lightbox.addEventListener("click", (e) => {
      const t = e.target;
      if (t && (t.dataset && t.dataset.close === "true")) closeLightbox();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lightbox.getAttribute("aria-hidden") === "false") {
        closeLightbox();
      }
    });
  }
})();
