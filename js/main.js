(() => {
  const body = document.body;

  /* ---------- Cliente / Empresa toggle ---------- */
  const modeToggle = document.getElementById('modeToggle');
  const modeElements = document.querySelectorAll('[data-client]');
  /* Stats del hero (+1.352.112 / 100%) no usan data-client/data-business
     (ese loop genérico solo hace un swap de texto instantáneo) porque
     además corren un count-up animado al cargar la página — ver más
     abajo, después de declarar `reduceMotion`. */
  const heroCountUps = document.querySelectorAll('.hero__stats .count-up-hero');

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

    // Los stats del hero ya corrieron su count-up animado al cargar la
    // página (ver abajo, cerca de `reduceMotion`) — un cambio de modo
    // posterior solo actualiza el valor mostrado al instante, sin
    // reanimar, mismo criterio que el widgetCounter de arriba.
    heroCountUps.forEach(el => {
      const target = Number(isBusiness ? el.dataset.targetBusiness : el.dataset.targetClient);
      const prefix = el.dataset.prefix || '';
      const suffix = el.dataset.suffix || '';
      el.textContent = prefix + target.toLocaleString('es-CL') + suffix;
    });

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

  /* ---------- User menu: account icon -> iniciar sesión / crear cuenta -> viajero / empresa ---------- */
  const userMenu = document.getElementById('userMenu');
  if (userMenu) {
    const trigger = document.getElementById('userMenuTrigger');
    const panel = document.getElementById('userMenuPanel');
    const step1 = document.getElementById('userMenuStep1');
    const step2 = document.getElementById('userMenuStep2');
    const backBtn = document.getElementById('userMenuBack');
    let pendingAction = null;

    function closeMenu() {
      panel.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      step1.hidden = false;
      step2.hidden = true;
      pendingAction = null;
    }

    function openMenu() {
      panel.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
    }

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      if (panel.hidden) openMenu();
      else closeMenu();
    });

    step1.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        pendingAction = btn.dataset.action;
        step1.hidden = true;
        step2.hidden = false;
      });
    });

    backBtn.addEventListener('click', () => {
      step1.hidden = false;
      step2.hidden = true;
      pendingAction = null;
    });

    step2.querySelectorAll('[data-type]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const isBusinessType = btn.dataset.type === 'business';
        const base = isBusinessType ? 'login-empresa.html' : 'login.html';
        window.location.href = pendingAction === 'signup' ? `${base}?tab=signup` : base;
      });
    });

    document.addEventListener('click', (e) => {
      if (!userMenu.contains(e.target)) closeMenu();
    });
  }

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

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Hero stats: count-up animado al cargar la página ----------
     Mismo patrón que el widget de Pick Points de arriba (ease-out cúbico,
     1400ms, IntersectionObserver que se dispara una sola vez) — como el
     hero está arriba del fold, dispara casi de inmediato al cargar. Si
     `prefers-reduced-motion`, se deja el valor final estático (ya viene
     así en el HTML) sin animar nada. */
  if (heroCountUps.length && !reduceMotion) {
    const heroIo = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const duration = 1400;
        const start = performance.now();
        function tick(now) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const isBiz = body.classList.contains('mode-business');
          const target = Number(isBiz ? el.dataset.targetBusiness : el.dataset.targetClient);
          const prefix = el.dataset.prefix || '';
          const suffix = el.dataset.suffix || '';
          el.textContent = prefix + Math.round(eased * target).toLocaleString('es-CL') + suffix;
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        heroIo.unobserve(el);
      });
    }, { threshold: 0.3 });
    heroCountUps.forEach(el => heroIo.observe(el));
  }

  /* ---------- Rain: real drops on canvas ---------- */
  const rainCanvas = document.getElementById('rainCanvas');
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

  /* ---------- Weather cycle tied to scroll, not a time loop ----------
     Starts sunny at the top of the page and moves through sunset / night /
     storm the further down the page the user scrolls, so the background
     doesn't keep shifting on its own while someone is reading (which read
     as "mareador" on a fixed 15s auto-loop). Mirrors the same phase timing
     the old CSS keyframes used, just driven by scroll progress (0-100)
     instead of animation time. */
  if (!reduceMotion) {
    const sunEl = document.querySelector('.sun');
    const nightEl = document.querySelector('.sky-night');
    const starsEl = document.querySelector('.stars');
    const weatherEl = document.querySelector('.weather-overlay');
    const stormClouds = document.querySelectorAll('.cloud--storm');

    const SUN_STOPS = [
      { p: 0, top: 58, left: 6, opacity: 1, scale: 0.85 },
      { p: 16, top: 10, left: 30, opacity: 1, scale: 1.08 },
      { p: 30, top: 8, left: 45, opacity: 1, scale: 1 },
      { p: 33.33, top: 20, left: 55, opacity: 0.6, scale: 0.95 },
      { p: 40, top: 60, left: 60, opacity: 0, scale: 0.8 },
      { p: 60, top: 68, left: 68, opacity: 0, scale: 0.8 },
      { p: 66.67, top: 32, left: 76, opacity: 0.3, scale: 0.9 },
      { p: 80, top: 20, left: 84, opacity: 0.35, scale: 0.92 },
      { p: 93, top: 18, left: 90, opacity: 0.6, scale: 0.95 },
      { p: 100, top: 58, left: 6, opacity: 1, scale: 0.85 },
    ];
    const NIGHT_STOPS = [[0, 0], [33.33, 0], [40, 1], [60, 1], [66.67, 0], [100, 0]];
    const WEATHER_STOPS = [[0, 0], [66.67, 0], [73, 0.7], [93, 0.7], [100, 0]];
    const RAIN_STOPS = [[0, 0], [66.67, 0], [73, 0.9], [93, 0.9], [100, 0]];
    const STORM_STOPS = [[0, 0], [63, 0], [73, 0.85], [93, 0.85], [100, 0]];

    function interpOpacity(stops, pct) {
      for (let i = 0; i < stops.length - 1; i++) {
        const [p0, v0] = stops[i];
        const [p1, v1] = stops[i + 1];
        if (pct >= p0 && pct <= p1) {
          const t = p1 === p0 ? 0 : (pct - p0) / (p1 - p0);
          return v0 + (v1 - v0) * t;
        }
      }
      return stops[stops.length - 1][1];
    }

    function interpSun(pct) {
      for (let i = 0; i < SUN_STOPS.length - 1; i++) {
        const a = SUN_STOPS[i];
        const b = SUN_STOPS[i + 1];
        if (pct >= a.p && pct <= b.p) {
          const t = b.p === a.p ? 0 : (pct - a.p) / (b.p - a.p);
          return {
            top: a.top + (b.top - a.top) * t,
            left: a.left + (b.left - a.left) * t,
            opacity: a.opacity + (b.opacity - a.opacity) * t,
            scale: a.scale + (b.scale - a.scale) * t,
          };
        }
      }
      const last = SUN_STOPS[SUN_STOPS.length - 1];
      return last;
    }

    function updateWeatherByScroll() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const pct = scrollable > 0 ? Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100)) : 0;

      if (sunEl) {
        const s = interpSun(pct);
        sunEl.style.top = s.top + '%';
        sunEl.style.left = s.left + '%';
        sunEl.style.opacity = s.opacity;
        sunEl.style.transform = `scale(${s.scale})`;
      }
      const nightOpacity = interpOpacity(NIGHT_STOPS, pct);
      if (nightEl) nightEl.style.opacity = nightOpacity;
      if (starsEl) starsEl.style.opacity = nightOpacity;
      if (weatherEl) weatherEl.style.opacity = interpOpacity(WEATHER_STOPS, pct);
      if (rainCanvas) rainCanvas.style.opacity = interpOpacity(RAIN_STOPS, pct);
      const stormOpacity = interpOpacity(STORM_STOPS, pct);
      stormClouds.forEach((el) => { el.style.opacity = stormOpacity; });
    }

    let weatherTicking = false;
    function onScrollWeather() {
      if (weatherTicking) return;
      weatherTicking = true;
      requestAnimationFrame(() => { updateWeatherByScroll(); weatherTicking = false; });
    }

    updateWeatherByScroll();
    window.addEventListener('scroll', onScrollWeather, { passive: true });
    window.addEventListener('resize', onScrollWeather, { passive: true });
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
        combo: 'PickMap IA armó un combo para tu grupo',
      },
      {
        weather: '🌧️ 15°',
        points: '1.310',
        cardA: { icon: '🎳', title: 'Bowling + pizza bar', sub: 'A 12 min · Plan bajo techo', meta: '⭐ 4.6 · $14.000' },
        cardB: { icon: '🎪', title: 'Circo + chocolate caliente', sub: 'Familia · Ideal para la lluvia', meta: '⭐ 4.9 · $18.000' },
        combo: 'PickMap IA cambió el plan por la lluvia',
      },
      {
        weather: '🌙 18°',
        points: '1.385',
        cardA: { icon: '🍷', title: 'Tour de vinos nocturno', sub: 'A 25 min · Grupo de amigos', meta: '⭐ 4.7 · $32.000' },
        cardB: { icon: '🎡', title: 'Karting bajo las estrellas', sub: 'Viernes · Después de las 8pm', meta: '⭐ 4.8 · $16.000' },
        combo: 'PickMap IA armó otro combo para ti',
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
