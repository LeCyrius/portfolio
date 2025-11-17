// script.js - lightbox and basic page interactions
document.addEventListener('DOMContentLoaded', function () {
  // Lightbox setup
  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.innerHTML = `
    <div class="lightbox-container">
      <div class="lightbox-content">
        <img src="" alt="" />
      </div>
      <div class="lightbox-caption" aria-hidden="true"></div>
    </div>
    <button class="lightbox-close" aria-label="Close image">✕</button>
    <button class="lightbox-prev" aria-label="Previous image">‹</button>
    <button class="lightbox-next" aria-label="Next image">›</button>
    <div class="lightbox-indicators" aria-hidden="true"></div>
  `;
  document.body.appendChild(overlay);

  const imgEl = overlay.querySelector('img');
  const closeBtn = overlay.querySelector('.lightbox-close');
  const prevBtn = overlay.querySelector('.lightbox-prev');
  const nextBtn = overlay.querySelector('.lightbox-next');
  const captionEl = overlay.querySelector('.lightbox-caption');
  const indicatorsEl = overlay.querySelector('.lightbox-indicators');
  let currentGroup = [];
  let currentIndex = 0;
  let currentGroupName = '';
  let fixedGalleryWidth = null;
  let fixedGalleryHeight = null;

  // Preload helper for adjacent images
  function preloadIndex(idx) {
    if (!currentGroup || currentGroup.length === 0) return;
    const i = ((idx % currentGroup.length) + currentGroup.length) % currentGroup.length;
    const src = currentGroup[i] && currentGroup[i].src;
    if (src) {
      const im = new Image();
      im.src = src;
    }
  }

  // Render clickable dot indicators
  function renderIndicators() {
    if (!indicatorsEl) return;
    indicatorsEl.innerHTML = '';
    if (!currentGroup || currentGroup.length <= 1) return;
    currentGroup.forEach((el, idx) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'lightbox-dot';
      if (idx === currentIndex) dot.classList.add('active');
      dot.addEventListener('click', (ev) => {
        ev.stopPropagation();
        showImageByIndex(idx);
      });
      indicatorsEl.appendChild(dot);
    });
  }

  function openLightbox(src, alt, type, caption) {
    // type: 'profile' or 'gallery'
    imgEl.src = src;
    imgEl.alt = alt || '';
    captionEl.textContent = caption || alt || '';
    // reset classes
    const content = overlay.querySelector('.lightbox-content');
    content.className = 'lightbox-content';
    if (type === 'profile') {
      content.classList.add('profile');
      imgEl.style.objectFit = 'cover';
    } else {
      content.classList.add('gallery');
      imgEl.style.objectFit = 'contain';
    }
    // Reset inline sizing
    content.style.width = '';
    content.style.height = '';
    imgEl.style.width = '';
    imgEl.style.height = '';

    // update indicators & caption
    if (type === 'profile') {
      if (indicatorsEl) indicatorsEl.style.display = 'none';
    } else {
      if (indicatorsEl) indicatorsEl.style.display = 'flex';
      renderIndicators();
    }

    // prepare transition
    const contentEl = content;
    contentEl.classList.add('transitioning');
    imgEl.style.opacity = '0';

    // Image load handler: compute sizing and reveal
    imgEl.onload = function () {
      try {
        if (contentEl.classList.contains('gallery')) {
          const vw = Math.max(window.innerWidth || document.documentElement.clientWidth, 320);
          const vh = Math.max(window.innerHeight || document.documentElement.clientHeight, 240);
          const maxW = Math.round(vw * 0.92);
          const maxH = Math.round(vh * 0.84);
          const naturalW = imgEl.naturalWidth || imgEl.width || maxW;
          const naturalH = imgEl.naturalHeight || imgEl.height || maxH;
          const scale = Math.min(1, maxW / naturalW, maxH / naturalH);
          const displayW = Math.round(naturalW * scale);
          const displayH = Math.round(naturalH * scale);
          
          // Store fixed dimensions on first load (index 0)
          if (currentIndex === 0 && !fixedGalleryWidth) {
            fixedGalleryWidth = displayW;
            fixedGalleryHeight = displayH;
          }
          
          // Use fixed dimensions if available, otherwise use calculated
          const w = fixedGalleryWidth || displayW;
          const h = fixedGalleryHeight || displayH;
          
          imgEl.style.width = w + 'px';
          imgEl.style.height = h + 'px';
          contentEl.style.width = w + 'px';
          contentEl.style.height = h + 'px';
        } else {
          // profile: fill circular container
          imgEl.style.width = '100%';
          imgEl.style.height = '100%';
          contentEl.style.width = '';
          contentEl.style.height = '';
        }
      } catch (err) {
        imgEl.style.maxWidth = '92vw';
        imgEl.style.maxHeight = '84vh';
        contentEl.style.width = '';
        contentEl.style.height = '';
      }

      // preload adjacent images for instant navigation
      preloadIndex(currentIndex - 1);
      preloadIndex(currentIndex + 1);

      // reveal with a tiny delay for smoothness
      setTimeout(() => {
        contentEl.classList.remove('transitioning');
        imgEl.style.opacity = '1';
      }, 40);
    };

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Show/hide nav depending on group size
    if (currentGroup && currentGroup.length > 1 && type === 'gallery') {
      prevBtn.style.display = 'inline-flex';
      nextBtn.style.display = 'inline-flex';
    } else {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
    }
  }

  function closeLightbox() {
    overlay.classList.remove('open');
    imgEl.src = '';
    captionEl.textContent = '';
    document.body.style.overflow = '';
    // Reset fixed gallery dimensions for next opening
    fixedGalleryWidth = null;
    fixedGalleryHeight = null;
  }

  function showImageByIndex(idx) {
    if (!currentGroup || currentGroup.length === 0) return;
    currentIndex = ((idx % currentGroup.length) + currentGroup.length) % currentGroup.length;
    const el = currentGroup[currentIndex];
    if (!el) return;
    // reuse openLightbox sizing path but avoid recomputing group
    // transition out
    const contentEl = overlay.querySelector('.lightbox-content');
    contentEl.classList.add('transitioning');
    imgEl.style.opacity = '0';

    imgEl.src = el.src;
    imgEl.alt = el.alt || '';
    captionEl.textContent = el.caption || el.alt || '';
    // update indicators and preload neighbors
    renderIndicators();
    preloadIndex(currentIndex - 1);
    preloadIndex(currentIndex + 1);
    // ensure gallery style
    const content = overlay.querySelector('.lightbox-content');
    content.className = 'lightbox-content gallery';
    imgEl.style.objectFit = 'contain';
    // once image loads, sizing will be applied by onload handler
    if (imgEl.complete && imgEl.naturalWidth) {
      // force sizing recalculation
      const ev = new Event('load');
      imgEl.dispatchEvent(ev);
    }
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    prevBtn.style.display = currentGroup.length > 1 ? 'inline-flex' : 'none';
    nextBtn.style.display = currentGroup.length > 1 ? 'inline-flex' : 'none';
  }

  // delegate click on images with data-lightbox
  document.body.addEventListener('click', function (e) {
    const target = e.target.closest('img[data-lightbox]');
    if (target) {
      e.preventDefault();
      const t = (target.dataset.lightbox || '').toLowerCase();
      // build group based on data-lightbox value
      currentGroupName = t || '';
      // Get all images and their captions
      currentGroup = Array.from(document.querySelectorAll(`img[data-lightbox="${currentGroupName}"]`)).map((img) => {
        const figure = img.closest('figure');
        const caption = figure ? figure.querySelector('figcaption') : null;
        return {
          img: img,
          src: img.src,
          alt: img.alt || '',
          caption: caption ? caption.textContent : ''
        };
      });
      // find index of clicked image within group
      currentIndex = currentGroup.findIndex((i) => i.src === target.src);
      if (currentIndex < 0) currentIndex = 0;
      // treat 'profile' specially, others as gallery
      const type = currentGroupName === 'profile' ? 'profile' : 'gallery';
      openLightbox(currentGroup[currentIndex].src, currentGroup[currentIndex].alt || '', type, currentGroup[currentIndex].caption);
    }
  });

  // close interactions
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay || e.target === closeBtn) closeLightbox();
  });

  // Touch / swipe support for mobile
  let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
  overlay.addEventListener('touchstart', function (e) {
    if (!e.touches || e.touches.length === 0) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
  }, { passive: true });

  overlay.addEventListener('touchend', function (e) {
    const touch = (e.changedTouches && e.changedTouches[0]) || null;
    if (!touch) return;
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    const dt = Date.now() - touchStartTime;
    // require horizontal swipe larger than vertical movement and threshold
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) && dt < 800) {
      if (dx > 0) {
        showImageByIndex(currentIndex - 1);
      } else {
        showImageByIndex(currentIndex + 1);
      }
    }
  }, { passive: true });

  // Prev/Next button handlers
  prevBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (!currentGroup || currentGroup.length === 0) return;
    showImageByIndex(currentIndex - 1);
  });
  nextBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (!currentGroup || currentGroup.length === 0) return;
    showImageByIndex(currentIndex + 1);
  });

  document.addEventListener('keydown', function (e) {
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape') return closeLightbox();
    if (e.key === 'ArrowLeft') return showImageByIndex(currentIndex - 1);
    if (e.key === 'ArrowRight') return showImageByIndex(currentIndex + 1);
  });

  // small utility: set current year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
// Système de traduction
// If user previously selected a language, use it. Otherwise determine later
// from the browser preferences (so we avoid forcing 'fr' on first visit).
let currentLanguage = localStorage.getItem("language") || null;
let translations = {};

// Charger les traductions
async function loadTranslations() {
  try {
    // Prefer inline translations (works with file://), fallback to fetch
    const inline = document.getElementById('translations');
    if (inline && inline.textContent.trim().length > 0) {
      translations = JSON.parse(inline.textContent);
      // If no language stored yet, detect browser language
      if (!currentLanguage) {
        currentLanguage = detectBrowserLanguage();
      }
      setLanguage(currentLanguage);
      return;
    }

    const response = await fetch("translations.json");
    translations = await response.json();
    if (!currentLanguage) {
      currentLanguage = detectBrowserLanguage();
    }
    setLanguage(currentLanguage);
  } catch (error) {
    console.error("Erreur lors du chargement des traductions:", error);
  }
}

// Charger et afficher le CV (si présent)
async function loadCV() {
  try {
    if (!translations || !translations[currentLanguage]) {
      console.warn('Traductions non chargées, impossible d\'afficher le CV');
      return;
    }

    const t = translations[currentLanguage];
    const container = document.getElementById('resumeSection');
    if (!container) return;
    container.innerHTML = '';

    // Nom et titre
    const name = t['cv-name'] || '';
    const title = t['cv-title'] || '';
    if (name || title) {
      const h = document.createElement('h3');
      h.className = 'resume-name';
      h.textContent = `${name}${title ? ' - ' + title : ''}`.trim();
      container.appendChild(h);
    }

    // Résumé
    if (t['cv-summary']) {
      const p = document.createElement('p');
      p.className = 'resume-summary';
      p.textContent = t['cv-summary'];
      container.appendChild(p);
    }

    // Highlights
    const highlights = [];
    for (let i = 1; i <= 4; i++) {
      const key = `cv-highlight-${i}`;
      if (t[key]) highlights.push(t[key]);
    }
    if (highlights.length > 0) {
      const ul = document.createElement('ul');
      ul.className = 'pill-list resume-highlights';
      highlights.forEach((h) => {
        const li = document.createElement('li');
        li.textContent = h;
        ul.appendChild(li);
      });
      container.appendChild(ul);
    }

    // Expériences
    const experiences = [];
    for (let i = 1; i <= 4; i++) {
      const role = t[`cv-exp-${i}-role`];
      if (!role) continue; // Skip si pas de traduction
      
      const exp = {
        role: role,
        company: t[`cv-exp-${i}-company`] || '',
        period: t[`cv-exp-${i}-period`] || '',
        details: []
      };
      
      // Détails
      for (let j = 1; j <= 4; j++) {
        const detail = t[`cv-exp-${i}-detail-${j}`];
        if (detail) exp.details.push(detail);
      }
      
      experiences.push(exp);
    }

    if (experiences.length > 0) {
      const titleEl = document.createElement('h4');
      titleEl.className = 'resume-section-title';
      titleEl.textContent = t['resume-section-experience'] || 'Expériences professionnelles';
      container.appendChild(titleEl);

      const sec = document.createElement('div');
      sec.className = 'cv-experience';
      experiences.forEach((e) => {
        const item = document.createElement('div');
        item.className = 'cv-experience-item';

        const header = document.createElement('div');
        header.className = 'cv-experience-header';
        const role = document.createElement('strong');
        role.textContent = e.role || '';
        header.appendChild(role);
        if (e.company) {
          const comp = document.createElement('span');
          comp.textContent = e.company;
          header.appendChild(comp);
        }
        item.appendChild(header);

        if (e.period) {
          const span = document.createElement('div');
          span.className = 'cv-period';
          span.textContent = e.period;
          item.appendChild(span);
        }

        if (e.details.length > 0) {
          const ul = document.createElement('ul');
          e.details.forEach((d) => {
            if (!d) return;
            const li = document.createElement('li');
            li.textContent = d;
            ul.appendChild(li);
          });
          item.appendChild(ul);
        }

        sec.appendChild(item);
      });

      container.appendChild(sec);
    }

    // Formations
    const educations = [];
    for (let i = 1; i <= 3; i++) {
      const degree = t[`cv-edu-${i}-degree`];
      if (!degree) continue; // Skip si pas de traduction
      
      educations.push({
        degree: degree,
        school: t[`cv-edu-${i}-school`] || '',
        period: t[`cv-edu-${i}-period`] || ''
      });
    }

    if (educations.length > 0) {
      const titleEl = document.createElement('h4');
      titleEl.className = 'resume-section-title';
      titleEl.textContent = t['resume-section-education'] || 'Formations';
      container.appendChild(titleEl);

      const sec = document.createElement('div');
      sec.className = 'cv-education';
      educations.forEach((e) => {
        const item = document.createElement('div');
        item.className = 'cv-education-item';

        const degree = document.createElement('strong');
        degree.textContent = e.degree || '';
        item.appendChild(degree);

        if (e.school) {
          const school = document.createElement('div');
          school.className = 'cv-school';
          school.textContent = e.school;
          item.appendChild(school);
        }

        if (e.period) {
          const period = document.createElement('div');
          period.className = 'cv-period';
          period.textContent = e.period;
          item.appendChild(period);
        }

        sec.appendChild(item);
      });

      container.appendChild(sec);
    }
  } catch (err) {
    console.error('Erreur lors du chargement du CV', err);
  }
}

// Appliquer une langue
function setLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem("language", lang);
  
  // Mettre à jour tous les éléments avec data-i18n
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (translations[lang] && translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });

  // Mettre à jour les placeholders
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    if (translations[lang] && translations[lang][key]) {
      el.placeholder = translations[lang][key];
    }
  });

  // Mettre à jour les aria-label
  document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
    const key = el.dataset.i18nAriaLabel;
    if (translations[lang] && translations[lang][key]) {
      el.setAttribute("aria-label", translations[lang][key]);
    }
  });

  // Mettre à jour les alt
  document.querySelectorAll("[data-i18n-alt]").forEach((el) => {
    const key = el.dataset.i18nAlt;
    if (translations[lang] && translations[lang][key]) {
      el.setAttribute("alt", translations[lang][key]);
    }
  });

  // Mettre à jour le bouton actif
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.remove("active");
    if (btn.dataset.lang === lang) {
      btn.classList.add("active");
    }
  });

  document.documentElement.lang = lang;
  
  // Recharger le CV avec la nouvelle langue
  loadCV();
}

// Detect browser language (prefer 'fr' or 'en')
function detectBrowserLanguage() {
  const nav = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || navigator.userLanguage || 'en'];
  for (const l of nav) {
    const code = (l || '').toLowerCase();
    if (code.startsWith('fr')) return 'fr';
    if (code.startsWith('en')) return 'en';
  }
  // fallback
  return 'fr';
}

// Événements des boutons de langue
function setupLanguageSwitcher() {
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      setLanguage(btn.dataset.lang);
    });
  });
}

// (Contact form removed) no client-side mailto assembly required anymore

// Afficher l'année dans le footer
document.addEventListener("DOMContentLoaded", () => {
  const yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // Charger les traductions
    loadTranslations().then(() => {
    setupLanguageSwitcher();
    // Load CV data if present
    loadCV();
  });

  // Animation fade-in on scroll
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.18,
    }
  );

  document.querySelectorAll(".fade-in").forEach((el) => observer.observe(el));

  // Mobile nav
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");

  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      nav.classList.toggle("open");
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
      });
    });
  }
});
