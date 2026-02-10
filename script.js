// script.js
(() => {
  "use strict";

  // Smooth scroll with offset for sticky header
  const header = document.querySelector(".site-header");
  const headerOffset = () => (header ? header.getBoundingClientRect().height : 0);

  function scrollToHash(hash) {
    const el = document.querySelector(hash);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - headerOffset() - 10;
    window.scrollTo({ top, behavior: "smooth" });
  }

  // Intercept in-page nav clicks
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;

    const href = a.getAttribute("href");
    if (!href || href === "#") return;

    e.preventDefault();
    history.pushState(null, "", href);
    scrollToHash(href);

    // Close mobile menu if open
    closeMobileMenu();
  });

  // Mobile menu toggle
  const toggleBtn = document.querySelector(".nav-toggle");
  const mobileMenu = document.getElementById("mobileMenu");

  function openMobileMenu() {
    if (!toggleBtn || !mobileMenu) return;
    toggleBtn.setAttribute("aria-expanded", "true");
    mobileMenu.hidden = false;
  }

  function closeMobileMenu() {
    if (!toggleBtn || !mobileMenu) return;
    toggleBtn.setAttribute("aria-expanded", "false");
    mobileMenu.hidden = true;
  }

  if (toggleBtn && mobileMenu) {
    toggleBtn.addEventListener("click", () => {
      const expanded = toggleBtn.getAttribute("aria-expanded") === "true";
      if (expanded) closeMobileMenu();
      else openMobileMenu();
    });

    // Close on Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMobileMenu();
    });

    // Close on resize up
    window.addEventListener("resize", () => {
      if (window.innerWidth > 720) closeMobileMenu();
    });
  }

  // COUNTDOWN: 2027-04-09T17:00:00+02:00
  const targetISO = "2027-04-09T17:00:00+02:00";
  const target = new Date(targetISO).getTime();

  const dd = document.querySelector("[data-dd]");
  const hh = document.querySelector("[data-hh]");
  const mm = document.querySelector("[data-mm]");
  const ss = document.querySelector("[data-ss]");
  const done = document.querySelector("[data-countdown-done]");
  const grid = document.querySelector("[data-countdown]");

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function tick() {
    const now = Date.now();
    let diff = target - now;

    if (!grid || !done || !dd || !hh || !mm || !ss) return;

    if (diff <= 0) {
      grid.hidden = true;
      done.hidden = false;
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    dd.textContent = String(days);
    hh.textContent = pad2(hours);
    mm.textContent = pad2(minutes);
    ss.textContent = pad2(seconds);
  }

  tick();
  setInterval(tick, 1000);

  // RSVP toggle
  const attendanceInput = document.getElementById("attendance");
  const toggleButtons = Array.from(document.querySelectorAll(".toggle-btn"));

  function setAttendance(value) {
    if (!attendanceInput) return;
    attendanceInput.value = value;

    toggleButtons.forEach((btn) => {
      const isActive = btn.dataset.value === value;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  toggleButtons.forEach((btn) => {
    btn.addEventListener("click", () => setAttendance(btn.dataset.value || "Sí"));
  });

  // RSVP submission to hidden iframe + success message on iframe load
  const form = document.getElementById("rsvpForm");
  const iframe = document.getElementById("rsvpTarget");
  const status = document.getElementById("formStatus");
  let pendingSubmit = false;

  function setStatus(msg, kind) {
    if (!status) return;
    status.textContent = msg;
    status.classList.remove("is-success", "is-error");
    if (kind) status.classList.add(kind);
  }

  function validateForm() {
    if (!form) return false;
    const name = form.querySelector('input[name="name"]');
    const email = form.querySelector('input[name="email"]');

    if (!name || !email) return false;

    const nameOk = name.value.trim().length >= 2;
    const emailOk = email.value.includes("@") && email.value.trim().length >= 5;

    if (!nameOk) {
      setStatus("Escribe tu nombre para poder confirmar.", "is-error");
      name.focus();
      return false;
    }
    if (!emailOk) {
      setStatus("Revisa el email (parece incompleto).", "is-error");
      email.focus();
      return false;
    }

    return true;
  }

if (form) {
  form.addEventListener("submit", (e) => {
    if (!validateForm()) {
      e.preventDefault();
      return;
    }
    pendingSubmit = true;
    setStatus("Enviando…", "");
  });
}


  if (iframe) {
    iframe.addEventListener("load", () => {
      if (!pendingSubmit) return;
      pendingSubmit = false;

      setStatus("¡RSVP recibido! Gracias — te contactaremos si necesitamos algún detalle.", "is-success");
      if (form) form.reset();
      setAttendance("Sí");
    });
  }

  // If page loads with hash, scroll with offset
  window.addEventListener("load", () => {
    if (location.hash) scrollToHash(location.hash);
  });
})();
