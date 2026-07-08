(() => {
  const body = document.body;

  /* ---------- Cliente / Empresa toggle ---------- */
  const modeToggle = document.getElementById('modeToggle');
  const modeElements = document.querySelectorAll('[data-client]');

  function setMode(mode) {
    const isBusiness = mode === 'business';
    body.classList.toggle('mode-business', isBusiness);
    body.classList.toggle('mode-client', !isBusiness);
    modeToggle.setAttribute('aria-checked', String(isBusiness));

    modeToggle.querySelectorAll('.mode-toggle__opt').forEach(opt => {
      opt.classList.toggle('is-active', opt.dataset.mode === mode);
    });

    modeElements.forEach(el => {
      const text = isBusiness ? el.dataset.business : el.dataset.client;
      if (text) el.textContent = text;

      if (el.dataset.target) {
        const [clientHref, businessHref] = el.dataset.target.split(':');
        el.setAttribute('href', isBusiness ? businessHref : clientHref);
      }
    });
  }

  modeToggle.addEventListener('click', () => {
    const current = body.classList.contains('mode-business') ? 'business' : 'client';
    setMode(current === 'business' ? 'client' : 'business');
  });

  document.querySelectorAll('[data-mode-link]').forEach(link => {
    link.addEventListener('click', () => setMode(link.dataset.modeLink));
  });

  /* ---------- Mobile menu ---------- */
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  hamburger.addEventListener('click', () => {
    const open = body.classList.toggle('nav-open');
    hamburger.setAttribute('aria-expanded', String(open));
  });
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      body.classList.remove('nav-open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });

  /* ---------- Scroll reveal ---------- */
  const revealTargets = document.querySelectorAll(
    '.step, .card, .example, .widget, .puntos__copy, .marquee, .alianzas__cta'
  );
  revealTargets.forEach(el => el.setAttribute('data-reveal', ''));

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealTargets.forEach(el => io.observe(el));

  /* ---------- Points widget: bar fill + count up ---------- */
  const widget = document.querySelector('.widget');
  if (widget) {
    const widgetIo = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const bar = widget.querySelector('.widget__bar-fill');
        if (bar) bar.style.width = bar.dataset.fill + '%';

        const counter = widget.querySelector('.count-up');
        if (counter) {
          const target = parseInt(counter.dataset.target, 10);
          const duration = 1400;
          const start = performance.now();
          function tick(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            counter.textContent = Math.round(eased * target).toLocaleString('es-CL');
            if (progress < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        }
        widgetIo.unobserve(widget);
      });
    }, { threshold: 0.4 });
    widgetIo.observe(widget);
  }

  /* ---------- Rain: real drops on canvas ---------- */
  const rainCanvas = document.getElementById('rainCanvas');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (rainCanvas && !reduceMotion) {
    const ctx = rainCanvas.getContext('2d');
    const skyline = document.querySelector('.skyline');
    let drops = [];
    let width = 0;
    let height = 0;

    function makeDrop() {
      return {
        x: Math.random() * (width + 200) - 100,
        y: Math.random() * height,
        len: 14 + Math.random() * 16,
        speed: 6 + Math.random() * 7,
        drift: 2.2,
        opacity: 0.25 + Math.random() * 0.35,
      };
    }

    function resize() {
      const rect = skyline.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      rainCanvas.width = width * dpr;
      rainCanvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round((width * height) / 9000);
      drops = Array.from({ length: count }, makeDrop);
    }

    function tick() {
      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = 'round';
      for (const d of drops) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${d.opacity})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.drift * (d.len / 10), d.y + d.len);
        ctx.stroke();

        d.x -= d.drift;
        d.y += d.speed;
        if (d.y > height) {
          d.y = -d.len;
          d.x = Math.random() * (width + 200) - 100;
        }
      }
      requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });
    requestAnimationFrame(tick);
  }

  /* ---------- Parallax mountains on scroll ---------- */
  const back = document.querySelector('.mountains--back');
  const mid = document.querySelector('.mountains--mid');
  const front = document.querySelector('.mountains--front');
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (back) back.style.transform = `translateY(${y * 0.04}px)`;
      if (mid) mid.style.transform = `translateY(${y * 0.07}px)`;
      if (front) front.style.transform = `translateY(${y * 0.11}px)`;
      ticking = false;
    });
  }, { passive: true });
})();
