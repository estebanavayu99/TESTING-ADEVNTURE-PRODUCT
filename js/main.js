(() => {
  const body = document.body;

  /* ---------- Cliente / Empresa toggle ---------- */
  const modeToggle = document.getElementById('modeToggle');
  const modeElements = document.querySelectorAll('[data-client]');

  /* ---------- Business hero mock: animated earnings chart ---------- */
  const BIZ_TOAST_MESSAGES = [
    '🎉 Nueva reserva confirmada +$45.000',
    '💸 Pago recibido +$69.000',
    '📅 Cabaña reservada para el finde',
    '⭐ Nueva reseña de 5 estrellas',
  ];
  let bizToastInterval = null;

  function animateBizChart() {
    const bars = document.querySelectorAll('.biz-chart-card__bars span');
    bars.forEach((bar, i) => {
      const h = bar.style.getPropertyValue('--h');
      bar.style.height = '0';
      setTimeout(() => { bar.style.height = h; }, i * 80);
    });

    const totalEl = document.getElementById('bizChartTotal');
    if (totalEl) {
      const target = parseInt(totalEl.dataset.target, 10);
      const duration = 1400;
      const start = performance.now();
      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        totalEl.textContent = '$' + Math.round(eased * target).toLocaleString('es-CL');
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
  }

  function startBizToast() {
    const toast = document.getElementById('bizChartToast');
    if (!toast || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let i = 0;
    function showNext() {
      toast.textContent = BIZ_TOAST_MESSAGES[i % BIZ_TOAST_MESSAGES.length];
      toast.classList.add('is-visible');
      setTimeout(() => toast.classList.remove('is-visible'), 2600);
      i++;
    }
    showNext();
    if (bizToastInterval) clearInterval(bizToastInterval);
    bizToastInterval = setInterval(showNext, 4200);
  }

  function stopBizToast() {
    if (bizToastInterval) {
      clearInterval(bizToastInterval);
      bizToastInterval = null;
    }
    const toast = document.getElementById('bizChartToast');
    if (toast) toast.classList.remove('is-visible');
  }

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

    const widgetCounter = document.querySelector('.widget .count-up');
    if (widgetCounter) {
      const target = isBusiness ? widgetCounter.dataset.targetBusiness : widgetCounter.dataset.targetClient;
      const prefix = (isBusiness ? widgetCounter.dataset.prefixBusiness : widgetCounter.dataset.prefixClient) || '';
      widgetCounter.dataset.target = target;
      widgetCounter.textContent = prefix + Number(target).toLocaleString('es-CL');
    }

    if (isBusiness) {
      animateBizChart();
      startBizToast();
    } else {
      stopBizToast();
    }
  }

  modeToggle.addEventListener('click', () => {
    const current = body.classList.contains('mode-business') ? 'business' : 'client';
    setMode(current === 'business' ? 'client' : 'business');
  });

  document.querySelectorAll('[data-mode-link]').forEach(link => {
    link.addEventListener('click', () => setMode(link.dataset.modeLink));
  });

  /* Point the auth-buttons connector stem at the exact center of each toggle pill */
  function updateStemOffsets() {
    const toggleBox = modeToggle.getBoundingClientRect();
    const toggleCenter = toggleBox.left + toggleBox.width / 2;
    const clientOpt = modeToggle.querySelector('.mode-toggle__opt[data-mode="client"]');
    const bizOpt = modeToggle.querySelector('.mode-toggle__opt[data-mode="business"]');
    if (!clientOpt || !bizOpt) return;
    const clientBox = clientOpt.getBoundingClientRect();
    const bizBox = bizOpt.getBoundingClientRect();
    const clientOffset = (clientBox.left + clientBox.width / 2) - toggleCenter;
    const bizOffset = (bizBox.left + bizBox.width / 2) - toggleCenter;
    document.documentElement.style.setProperty('--stem-client-x', `${clientOffset}px`);
    document.documentElement.style.setProperty('--stem-business-x', `${bizOffset}px`);
  }
  updateStemOffsets();
  window.addEventListener('load', updateStemOffsets);
  window.addEventListener('resize', updateStemOffsets, { passive: true });

  /* ---------- "Quiero ser aliado" CTA: switch to empresa + reveal login/signup ---------- */
  const aliadoCtaBtn = document.getElementById('aliadoCtaBtn');
  if (aliadoCtaBtn) {
    aliadoCtaBtn.addEventListener('click', () => {
      setMode('business');
      aliadoCtaBtn.hidden = true;
      document.getElementById('alianzasCtaNote').hidden = true;
      document.getElementById('alianzasAuthOptions').hidden = false;
    });
  }

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
          const duration = 1400;
          const start = performance.now();
          function tick(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            // Re-read target/prefix every frame so a mode switch mid-animation
            // (client <-> business) redirects the count instead of being stomped.
            const target = parseInt(counter.dataset.target, 10);
            const isBiz = body.classList.contains('mode-business');
            const prefix = (isBiz ? counter.dataset.prefixBusiness : counter.dataset.prefixClient) || '';
            counter.textContent = prefix + Math.round(eased * target).toLocaleString('es-CL');
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

  /* ---------- Phone mockup: slow content crossfade ---------- */
  const appContent = document.getElementById('appContent');
  if (appContent && !reduceMotion) {
    const scenes = [
      {
        weather: '☀️ 22°',
        points: '1.240',
        cardA: { icon: '🏔️', title: 'Canopy + termas', sub: 'A 40 min · Ideal con este sol', meta: '⭐ 4.8 · $29.000' },
        cardB: { icon: '🛶', title: 'Cabaña junto al río', sub: 'Pareja · Escapada express', meta: '⭐ 4.7 · $54.000' },
        combo: 'Pickmap IA armó un combo para tu grupo',
      },
      {
        weather: '🌧️ 15°',
        points: '1.310',
        cardA: { icon: '🎳', title: 'Bowling + pizza bar', sub: 'A 12 min · Plan bajo techo', meta: '⭐ 4.6 · $14.000' },
        cardB: { icon: '🎪', title: 'Circo + chocolate caliente', sub: 'Familia · Ideal para la lluvia', meta: '⭐ 4.9 · $18.000' },
        combo: 'Pickmap IA cambió el plan por la lluvia',
      },
      {
        weather: '🌙 18°',
        points: '1.385',
        cardA: { icon: '🍷', title: 'Tour de vinos nocturno', sub: 'A 25 min · Grupo de amigos', meta: '⭐ 4.7 · $32.000' },
        cardB: { icon: '🎡', title: 'Karting bajo las estrellas', sub: 'Viernes · Después de las 8pm', meta: '⭐ 4.8 · $16.000' },
        combo: 'Pickmap IA armó otro combo para ti',
      },
    ];

    const el = {
      weather: document.getElementById('appWeather'),
      points: document.getElementById('appPoints'),
      wave: document.getElementById('appWave'),
      cardAIcon: document.getElementById('cardAIcon'),
      cardATitle: document.getElementById('cardATitle'),
      cardASub: document.getElementById('cardASub'),
      cardAMeta: document.getElementById('cardAMeta'),
      cardBIcon: document.getElementById('cardBIcon'),
      cardBTitle: document.getElementById('cardBTitle'),
      cardBSub: document.getElementById('cardBSub'),
      cardBMeta: document.getElementById('cardBMeta'),
      combo: document.getElementById('comboText'),
    };

    let sceneIndex = 0;
    setInterval(() => {
      sceneIndex = (sceneIndex + 1) % scenes.length;
      const s = scenes[sceneIndex];

      appContent.classList.add('is-fading');
      setTimeout(() => {
        el.weather.textContent = s.weather;
        el.points.textContent = s.points;
        el.cardAIcon.textContent = s.cardA.icon;
        el.cardATitle.textContent = s.cardA.title;
        el.cardASub.textContent = s.cardA.sub;
        el.cardAMeta.textContent = s.cardA.meta;
        el.cardBIcon.textContent = s.cardB.icon;
        el.cardBTitle.textContent = s.cardB.title;
        el.cardBSub.textContent = s.cardB.sub;
        el.cardBMeta.textContent = s.cardB.meta;
        el.combo.textContent = s.combo;
        appContent.classList.remove('is-fading');

        el.wave.classList.remove('is-waving');
        void el.wave.offsetWidth;
        el.wave.classList.add('is-waving');
      }, 500);
    }, 5500);
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
