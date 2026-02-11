(function () {
  // ---------------- i18n ----------------
  const LANG_KEY = "wedding_lang";
  const SUPPORTED = ["es", "ca", "en"];

  const STRINGS = {
    es: {
      "skip": "Saltar al contenido",

      "menu.open": "Abrir menú",
      "menu.language": "Idioma",
      "menu.hint": "09 . 04 . 27 · Can Ribas de Montbui",

      "nav.home": "Inicio",
      "nav.story": "Nuestra historia",
      "nav.transport": "Transporte",
      "nav.contact": "Contacto",
      "nav.rsvp": "RSVP",

      "hero.kicker": "¡Nos casamos!",
      "hero.place": "Can Ribas de Montbui · xxxxxxxxx",
      "hero.ctaPrimary": "RSVP",
      "hero.ctaSecondary": "Nuestra historia",

      "countdown.label": "Cuenta atrás",
      "countdown.days": "días",
      "countdown.hours": "h",
      "countdown.minutes": "min",
      "countdown.seconds": "s",
      "countdown.done": "¡Hoy es el día!",

      "events.title": "El día",
      "events.subtitle": "Dos momentos. Un mismo sí.",
      "events.ceremony.title": "Ceremonia",
      "events.reception.title": "Celebración",
      "events.map": "Mapa",

      "story.title": "Nuestra historia",
      "story.subtitle": "Tres momentos que nos trajeron hasta aquí.",
      "story.m1.kicker": "Hito 01",
      "story.m1.title": "xxxxxxxxx",
      "story.m1.text": "xxxxxxxxx",
      "story.m2.kicker": "Hito 02",
      "story.m2.title": "xxxxxxxxx",
      "story.m2.text": "xxxxxxxxx",
      "story.m3.kicker": "Hito 03",
      "story.m3.title": "xxxxxxxxx",
      "story.m3.text": "xxxxxxxxx",
      "story.portrait1": "Milena",
      "story.portrait2": "Omar",

      "transport.title": "Transporte",
      "transport.subtitle": "Cómo llegar y moverse con calma.",
      "transport.car.title": "Coche",
      "transport.car.text": "xxxxxxxxx",
      "transport.car.meta": "Parking: xxxxxxxxx",
      "transport.public.title": "Transporte público",
      "transport.public.text": "xxxxxxxxx",
      "transport.public.meta": "Parada cercana: xxxxxxxxx",
      "transport.bus.title": "Bus",
      "transport.bus.text": "xxxxxxxxx",
      "transport.bus.meta": "Horario: xxxxxxxxx",

      "contact.title": "Contacto",
      "contact.subtitle": "Preguntas, logística, detalles",
      "contact.plannerTitle": "Wedding planner",
      "contact.text": "Para cualquier duda o consulta, puedes contar con:",
      "contact.nameLabel": "Nombre",
      "contact.phoneLabel": "Teléfono",
      "contact.emailLabel": "Email",

      "rsvp.subtitle": "Una respuesta breve, todo claro.",
      "rsvp.attendLegend": "¿Asistirás?",
      "rsvp.yes": "Sí",
      "rsvp.no": "No",
      "rsvp.nameLabel": "Nombre y apellidos",
      "rsvp.emailLabel": "Email",
      "rsvp.guestsLabel": "Invitados",
      "rsvp.notesLabel": "Notas",
      "rsvp.namePh": "Tu nombre",
      "rsvp.emailPh": "tu@email.com",
      "rsvp.notesPh": "Alergias, preferencias, etc.",
      "rsvp.submit": "Enviar RSVP",
      "rsvp.hint": "Recibirás una confirmación al enviar.",
      "rsvp.sending": "Enviando…",
      "rsvp.success": "¡Gracias! Te hemos enviado una confirmación por email."
    },

    ca: {
      "skip": "Salta al contingut",

      "menu.open": "Obrir menú",
      "menu.language": "Idioma",
      "menu.hint": "09 . 04 . 27 · Can Ribas de Montbui",

      "nav.home": "Inici",
      "nav.story": "La nostra història",
      "nav.transport": "Transport",
      "nav.contact": "Contacte",
      "nav.rsvp": "RSVP",

      "hero.kicker": "Ens casem!",
      "hero.place": "Can Ribas de Montbui · xxxxxxxxx",
      "hero.ctaPrimary": "RSVP",
      "hero.ctaSecondary": "La nostra història",

      "countdown.label": "Compte enrere",
      "countdown.days": "dies",
      "countdown.hours": "h",
      "countdown.minutes": "min",
      "countdown.seconds": "s",
      "countdown.done": "Avui és el dia!",

      "events.title": "El dia",
      "events.subtitle": "Dos moments. Un mateix sí.",
      "events.ceremony.title": "Cerimònia",
      "events.reception.title": "Celebració",
      "events.map": "Mapa",

      "story.title": "La nostra història",
      "story.subtitle": "Tres moments que ens han portat fins aquí.",
      "story.m1.kicker": "Fita 01",
      "story.m1.title": "xxxxxxxxx",
      "story.m1.text": "xxxxxxxxx",
      "story.m2.kicker": "Fita 02",
      "story.m2.title": "xxxxxxxxx",
      "story.m2.text": "xxxxxxxxx",
      "story.m3.kicker": "Fita 03",
      "story.m3.title": "xxxxxxxxx",
      "story.m3.text": "xxxxxxxxx",
      "story.portrait1": "Milena",
      "story.portrait2": "Omar",

      "transport.title": "Transport",
      "transport.subtitle": "Com arribar-hi i moure’s amb calma.",
      "transport.car.title": "Cotxe",
      "transport.car.text": "xxxxxxxxx",
      "transport.car.meta": "Pàrquing: xxxxxxxxx",
      "transport.public.title": "Transport públic",
      "transport.public.text": "xxxxxxxxx",
      "transport.public.meta": "Parada propera: xxxxxxxxx",
      "transport.bus.title": "Bus",
      "transport.bus.text": "xxxxxxxxx",
      "transport.bus.meta": "Horari: xxxxxxxxx",

      "contact.title": "Contacte",
      "contact.subtitle": "Preguntes, logística, detalls",
      "contact.plannerTitle": "Wedding planner",
      "contact.text": "Per a qualsevol dubte o consulta, pots comptar amb:",
      "contact.nameLabel": "Nom",
      "contact.phoneLabel": "Telèfon",
      "contact.emailLabel": "Email",

      "rsvp.subtitle": "Una resposta breu, tot clar.",
      "rsvp.attendLegend": "Vindràs?",
      "rsvp.yes": "Sí",
      "rsvp.no": "No",
      "rsvp.nameLabel": "Nom i cognoms",
      "rsvp.emailLabel": "Email",
      "rsvp.guestsLabel": "Convidats",
      "rsvp.notesLabel": "Notes",
      "rsvp.namePh": "El teu nom",
      "rsvp.emailPh": "tu@email.com",
      "rsvp.notesPh": "Al·lèrgies, preferències, etc.",
      "rsvp.submit": "Enviar RSVP",
      "rsvp.hint": "Rebràs una confirmació en enviar-ho.",
      "rsvp.sending": "Enviant…",
      "rsvp.success": "Gràcies! T’hem enviat una confirmació per email."
    },

    en: {
      "skip": "Skip to content",

      "menu.open": "Open menu",
      "menu.language": "Language",
      "menu.hint": "09 . 04 . 27 · Can Ribas de Montbui",

      "nav.home": "Home",
      "nav.story": "Our story",
      "nav.transport": "Travel",
      "nav.contact": "Contact",
      "nav.rsvp": "RSVP",

      "hero.kicker": "We’re getting married!",
      "hero.place": "Can Ribas de Montbui · xxxxxxxxx",
      "hero.ctaPrimary": "RSVP",
      "hero.ctaSecondary": "Our story",

      "countdown.label": "Countdown",
      "countdown.days": "days",
      "countdown.hours": "h",
      "countdown.minutes": "min",
      "countdown.seconds": "s",
      "countdown.done": "It’s today!",

      "events.title": "The day",
      "events.subtitle": "Two moments. One yes.",
      "events.ceremony.title": "Ceremony",
      "events.reception.title": "Reception",
      "events.map": "Map",

      "story.title": "Our story",
      "story.subtitle": "Three moments that brought us here.",
      "story.m1.kicker": "Moment 01",
      "story.m1.title": "xxxxxxxxx",
      "story.m1.text": "xxxxxxxxx",
      "story.m2.kicker": "Moment 02",
      "story.m2.title": "xxxxxxxxx",
      "story.m2.text": "xxxxxxxxx",
      "story.m3.kicker": "Moment 03",
      "story.m3.title": "xxxxxxxxx",
      "story.m3.text": "xxxxxxxxx",
      "story.portrait1": "Milena",
      "story.portrait2": "Omar",

      "transport.title": "Travel",
      "transport.subtitle": "How to get there, calmly.",
      "transport.car.title": "By car",
      "transport.car.text": "xxxxxxxxx",
      "transport.car.meta": "Parking: xxxxxxxxx",
      "transport.public.title": "Public transport",
      "transport.public.text": "xxxxxxxxx",
      "transport.public.meta": "Nearest stop: xxxxxxxxx",
      "transport.bus.title": "Bus",
      "transport.bus.text": "xxxxxxxxx",
      "transport.bus.meta": "Schedule: xxxxxxxxx",

      "contact.title": "Contact",
      "contact.subtitle": "Questions, logistics, details",
      "contact.plannerTitle": "Wedding planner",
      "contact.text": "For any questions, you can reach:",
      "contact.nameLabel": "Name",
      "contact.phoneLabel": "Phone",
      "contact.emailLabel": "Email",

      "rsvp.subtitle": "A quick reply, everything clear.",
      "rsvp.attendLegend": "Will you attend?",
      "rsvp.yes": "Yes",
      "rsvp.no": "No",
      "rsvp.nameLabel": "Full name",
      "rsvp.emailLabel": "Email",
      "rsvp.guestsLabel": "Guests",
      "rsvp.notesLabel": "Notes",
      "rsvp.namePh": "Your name",
      "rsvp.emailPh": "you@email.com",
      "rsvp.notesPh": "Allergies, preferences, etc.",
      "rsvp.submit": "Send RSVP",
      "rsvp.hint": "You’ll receive an email confirmation after sending.",
      "rsvp.sending": "Sending…",
      "rsvp.success": "Thank you! We’ve sent you an email confirmation."
    }
  };

  function getInitialLang() {
    const stored = (localStorage.getItem(LANG_KEY) || "").toLowerCase();
    if (SUPPORTED.includes(stored)) return stored;

    const htmlLang = (document.documentElement.getAttribute("lang") || "").toLowerCase();
    if (SUPPORTED.includes(htmlLang)) return htmlLang;

    const nav = (navigator.language || "es").slice(0, 2).toLowerCase();
    if (SUPPORTED.includes(nav)) return nav;

    return "es";
  }

  function t(lang, key) {
    return (STRINGS[lang] && STRINGS[lang][key]) || (STRINGS.es && STRINGS.es[key]) || key;
  }

  function applyLang(lang) {
    if (!SUPPORTED.includes(lang)) lang = "es";
    document.documentElement.setAttribute("lang", lang);
    localStorage.setItem(LANG_KEY, lang);

    // text nodes
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      el.textContent = t(lang, key);
    });

    // placeholders
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      const key = el.getAttribute("data-i18n-placeholder");
      el.setAttribute("placeholder", t(lang, key));
    });

    // update segment buttons state (if present)
    document.querySelectorAll("[data-lang]").forEach(btn => {
      const isActive = (btn.getAttribute("data-lang") === lang);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  const currentLang = getInitialLang();
  applyLang(currentLang);

  // Language selector events
  document.addEventListener("click", (e) => {
    const btn = e.target && e.target.closest && e.target.closest("[data-lang]");
    if (!btn) return;
    const lang = (btn.getAttribute("data-lang") || "").toLowerCase();
    applyLang(lang);
  });

  // ---------------- Menu overlay ----------------
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
    requestAnimationFrame(() => menuOverlay.classList.add("is-open"));

    menuBtn.setAttribute("aria-expanded", "true");
    lockScroll(true);

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

    window.setTimeout(() => applyHidden(menuOverlay, true), 260);

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

    // keep menu open when switching languages, close when navigating
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

  // ---------------- Countdown ----------------
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

  // ---------------- RSVP ----------------
  // Nota: El envío real de confirmación por email lo hará el endpoint (Apps Script / backend).
  // Aquí dejamos UX sólida y validación básica.
  const form = document.getElementById("rsvpForm");
  const iframe = document.getElementById("rsvpHiddenFrame");

  const sending = document.getElementById("rsvpSending");
  const success = document.getElementById("rsvpSuccess");
  const error = document.getElementById("rsvpError");

  let pendingSubmit = false;

  function show(el) { if (el) el.hidden = false; }
  function hide(el) { if (el) el.hidden = true; }
  function resetStatus() { hide(sending); hide(success); hide(error); }

  function setError(msg) {
    if (!error) return;
    error.textContent = msg;
    show(error);
  }

  if (form && iframe) {
    form.addEventListener("submit", (e) => {
      resetStatus();

      // basic client validation (name + email)
      const name = (form.querySelector("input[name='name']")?.value || "").trim();
      const email = (form.querySelector("input[name='email']")?.value || "").trim();

      if (!name) {
        e.preventDefault();
        setError("xxxxxxxxx");
        return;
      }
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        e.preventDefault();
        setError("xxxxxxxxx");
        return;
      }

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

    // guard: placeholder endpoint
    form.addEventListener("submit", () => {
      const action = form.getAttribute("action") || "";
      if (action.includes("REPLACE_WITH_APPS_SCRIPT_URL")) {
        hide(sending);
        setError("xxxxxxxxx");
        pendingSubmit = false;
      }
    }, { capture: true });
  }

  // ---------------- Hero video autoplay fallback ----------------
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
