const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.nav');

if (navToggle && nav) {
  navToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

const countdown = document.querySelector('.countdown');
if (countdown) {
  const target = countdown.getAttribute('data-date');
  const endDate = new Date(target);
  const units = {
    days: countdown.querySelector('[data-unit="days"]'),
    hours: countdown.querySelector('[data-unit="hours"]'),
    minutes: countdown.querySelector('[data-unit="minutes"]'),
    seconds: countdown.querySelector('[data-unit="seconds"]')
  };
  const message = countdown.querySelector('.countdown-message');

  const tick = () => {
    const now = new Date();
    let diff = endDate - now;

    if (Number.isNaN(diff)) {
      message.textContent = 'Fecha no válida.';
      return;
    }

    if (diff <= 0) {
      Object.values(units).forEach((el) => {
        if (el) el.textContent = '00';
      });
      message.textContent = '¡Hoy es el día!';
      return;
    }

    const seconds = Math.floor(diff / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (units.days) units.days.textContent = String(days).padStart(2, '0');
    if (units.hours) units.hours.textContent = String(hours).padStart(2, '0');
    if (units.minutes) units.minutes.textContent = String(minutes).padStart(2, '0');
    if (units.seconds) units.seconds.textContent = String(secs).padStart(2, '0');
  };

  tick();
  setInterval(tick, 1000);
}

const filterButtons = document.querySelectorAll('.filter-btn');
const galleryItems = document.querySelectorAll('.gallery-item');

filterButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const filter = btn.getAttribute('data-filter');
    filterButtons.forEach((button) => {
      button.classList.remove('active');
      button.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');

    galleryItems.forEach((item) => {
      const category = item.getAttribute('data-category');
      const shouldShow = filter === 'all' || category === filter;
      item.style.display = shouldShow ? 'block' : 'none';
    });
  });
});

const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxClose = document.querySelector('.lightbox-close');
const lightboxBackdrop = document.querySelector('.lightbox-backdrop');

const openLightbox = (src, alt) => {
  if (!lightbox || !lightboxImage) return;
  lightboxImage.src = src;
  lightboxImage.alt = alt || 'Imagen ampliada';
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
};

const closeLightbox = () => {
  if (!lightbox) return;
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
};

galleryItems.forEach((item) => {
  item.addEventListener('click', () => {
    const img = item.querySelector('img');
    if (img && img.complete && img.naturalWidth > 0) {
      openLightbox(img.src, img.alt);
    }
  });
});

if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightbox);

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && lightbox?.getAttribute('aria-hidden') === 'false') {
    closeLightbox();
  }
});

const rsvpForm = document.getElementById('rsvpForm');
const rsvpStatus = document.querySelector('.form-status');
const guestList = document.getElementById('guestList');
const addGuestBtn = document.getElementById('addGuest');
const rsvpFrame = document.getElementById('rsvpFrame');

const segments = document.querySelectorAll('.segment');
segments.forEach((segment) => {
  segment.addEventListener('click', () => {
    segments.forEach((btn) => {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    });
    segment.classList.add('active');
    segment.setAttribute('aria-pressed', 'true');
    const hidden = rsvpForm?.querySelector('input[name="attend"]');
    if (hidden) hidden.value = segment.getAttribute('data-value') || 'yes';
  });
});

if (addGuestBtn && guestList) {
  addGuestBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'guest[]';
    input.placeholder = 'Nombre del invitado';
    guestList.appendChild(input);
  });
}

if (rsvpForm && rsvpStatus && rsvpFrame) {
  rsvpForm.addEventListener('submit', (event) => {
    rsvpStatus.textContent = '';
    const name = rsvpForm.querySelector('input[name="name"]');
    const email = rsvpForm.querySelector('input[name="email"]');
    let valid = true;

    if (!name?.value.trim()) {
      valid = false;
    }

    if (!email?.value.trim()) {
      valid = false;
    }

    if (!valid) {
      event.preventDefault();
      rsvpStatus.textContent = 'Por favor, completa nombre y email antes de enviar.';
      return;
    }

    rsvpStatus.textContent = 'Enviando...';
  });

  rsvpFrame.addEventListener('load', () => {
    rsvpStatus.textContent = '¡Gracias! Tu confirmación se ha registrado.';
    rsvpForm.reset();
    segments.forEach((btn, index) => {
      if (index === 0) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      }
    });
    const hidden = rsvpForm.querySelector('input[name="attend"]');
    if (hidden) hidden.value = 'yes';
    if (guestList) guestList.innerHTML = '';
  });
}

const mediaWrappers = document.querySelectorAll('.hero-media, .events-media, .timeline-media, .avatar, .gallery-item');
mediaWrappers.forEach((wrapper) => {
  const img = wrapper.querySelector('img');
  const placeholder = wrapper.querySelector('.img-placeholder');
  if (!img || !placeholder) return;

  const showFallback = () => {
    wrapper.classList.add('media-fallback');
    placeholder.textContent = placeholder.dataset.placeholder || 'Añade una imagen en assets/';
  };

  if (img.complete && img.naturalWidth === 0) {
    showFallback();
  }

  img.addEventListener('error', showFallback);
});
