(() => {
  const USERS_KEY = 'pickmap_users';
  const SESSION_KEY = 'pickmap_current_user';

  const email = localStorage.getItem(SESSION_KEY);
  if (!email) {
    window.location.href = 'login.html';
    return;
  }

  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  const user = users.find((u) => u.email === email);
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = 'index.html';
  });

  const TASTE_POOL = [
    { taste: 'naturaleza', kind: 'simple', icon: '🌲', title: 'Canopy en el Cajón del Maipo', meta: 'A 40 min · Medio día', reason: 'te gusta la naturaleza y la aventura' },
    { taste: 'naturaleza', kind: 'paquete', icon: '🛖', title: 'Trekking + cabaña con tinaja', meta: 'Paquete de 2 días', reason: 'te gusta la naturaleza y quieres desconectarte sin organizar nada' },
    { taste: 'naturaleza', kind: 'simple', icon: '🥾', title: 'Sendero + mirador al atardecer', meta: 'A 50 min · Medio día', reason: 'te gusta la naturaleza y la aventura' },
    { taste: 'gastronomia', kind: 'simple', icon: '🍽️', title: 'Ruta de restoranes de autor', meta: 'Centro · Noche', reason: 'te gusta la buena mesa' },
    { taste: 'gastronomia', kind: 'paquete', icon: '🍷', title: 'Tour de vinos + almuerzo maridado', meta: 'Paquete de un día', reason: 'te gusta la gastronomía y probar cosas nuevas' },
    { taste: 'gastronomia', kind: 'simple', icon: '🧀', title: 'Picnic gourmet con productos locales', meta: 'A 30 min', reason: 'te gusta la buena mesa' },
    { taste: 'relax', kind: 'simple', icon: '🧖', title: 'Tarde de spa y masajes', meta: 'A 20 min', reason: 'te gusta el relax y el spa' },
    { taste: 'relax', kind: 'paquete', icon: '♨️', title: 'Termas + alojamiento una noche', meta: 'Paquete de 2 días', reason: 'buscas relajarte sin pensar en nada' },
    { taste: 'vidanocturna', kind: 'simple', icon: '🌃', title: 'Bar con música en vivo', meta: 'Viernes · Noche', reason: 'te gusta la vida nocturna' },
    { taste: 'vidanocturna', kind: 'paquete', icon: '🎶', title: 'Bar + transporte de vuelta incluido', meta: 'Paquete nocturno', reason: 'te gusta salir de noche sin preocuparte de cómo volver' },
    { taste: 'cultura', kind: 'simple', icon: '🎭', title: 'Tour por el barrio histórico', meta: 'Medio día', reason: 'te gusta la cultura y los tours' },
    { taste: 'cultura', kind: 'paquete', icon: '🖼️', title: 'Museo + almuerzo con guía', meta: 'Paquete de un día', reason: 'te gusta aprender mientras paseas' },
    { taste: 'extremo', kind: 'simple', icon: '🪂', title: 'Salto en parapente', meta: 'A 1 hora', reason: 'te gustan los deportes extremos' },
    { taste: 'extremo', kind: 'paquete', icon: '🚵', title: 'Downhill + almuerzo campestre', meta: 'Paquete de un día', reason: 'te gusta la adrenalina' },
    { taste: 'playa', kind: 'simple', icon: '🏖️', title: 'Día de playa y atardecer', meta: 'A 1.5 horas', reason: 'te gusta la playa' },
    { taste: 'playa', kind: 'paquete', icon: '🌅', title: 'Escapada de playa 2 días + hospedaje', meta: 'Paquete de fin de semana', reason: 'te gusta la playa y quieres quedarte a dormir' },
    { taste: 'nieve', kind: 'simple', icon: '❄️', title: 'Subida a la nieve por el día', meta: 'A 1 hora', reason: 'te gusta la nieve' },
    { taste: 'nieve', kind: 'paquete', icon: '🎿', title: 'Ski + arriendo de equipo + almuerzo', meta: 'Paquete de un día', reason: 'te gusta la nieve y quieres tener todo resuelto' },
    { taste: 'shopping', kind: 'simple', icon: '🛍️', title: 'Ruta de tiendas y diseño local', meta: 'Medio día', reason: 'te gusta el shopping' },
    { taste: 'fotografia', kind: 'simple', icon: '📸', title: 'Mirador y spots instagrameables', meta: 'A 30 min · Atardecer', reason: 'te gustan los panoramas instagrameables' },
    { taste: 'musica', kind: 'simple', icon: '🎶', title: 'Festival o show en vivo', meta: 'Según cartelera', reason: 'te gusta la música y los festivales' },
    { taste: 'musica', kind: 'paquete', icon: '🎤', title: 'Entradas + previa con amigos', meta: 'Paquete para grupo', reason: 'te gusta la música y armar previa' },
  ];

  const COMPANY_POOL = [
    { company: 'pareja', kind: 'simple', icon: '💑', title: 'Cena romántica con vista', meta: 'Noche · Para 2', reason: 'sueles ir en pareja' },
    { company: 'familia', kind: 'paquete', icon: '👨‍👩‍👧', title: 'Cabaña familiar + actividades para niños', meta: 'Paquete de fin de semana', reason: 'sueles ir en familia' },
    { company: 'amigos', kind: 'simple', icon: '🎳', title: 'Bowling + pizza con la junta', meta: 'Sábado · Noche', reason: 'sueles ir con amigos' },
    { company: 'trabajo', kind: 'paquete', icon: '🏢', title: 'Team building al aire libre', meta: 'Paquete para equipos', reason: 'sueles ir con compañeros de trabajo' },
    { company: 'solo', kind: 'simple', icon: '🧍', title: 'Ruta de senderismo autoguiada', meta: 'Medio día · Solo/a', reason: 'a veces prefieres ir solo/a' },
  ];

  const DEFAULT_POOL = [
    { kind: 'simple', icon: '🏔️', title: 'Canopy + termas', meta: 'A 40 min', reason: 'es uno de los panoramas mejor evaluados cerca de ti' },
    { kind: 'paquete', icon: '🛶', title: 'Cabaña junto al río', meta: 'Paquete de un fin de semana', reason: 'es ideal para desconectarte sin planificar nada' },
    { kind: 'simple', icon: '🎡', title: 'Karting bajo las estrellas', meta: 'Viernes · Noche', reason: 'es un plan espontáneo que le gusta a la mayoría' },
    { kind: 'paquete', icon: '🍷', title: 'Tour de vinos nocturno', meta: 'Paquete de un día', reason: 'combina bien con casi cualquier grupo' },
    { kind: 'simple', icon: '🎪', title: 'Circo + algodón de azúcar', meta: 'Fin de semana', reason: 'es uno de los favoritos de la temporada' },
    { kind: 'paquete', icon: '🏕️', title: 'Camping + noche de fogata', meta: 'Paquete de 2 días', reason: 'es de los paquetes más pedidos del mes' },
  ];

  // Deterministic "real-looking" rating/reviews/price + a photo-card gradient per item.
  const GRADIENTS = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6'];
  function hashStr(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h;
  }
  function enrich(item, i) {
    const h = hashStr(item.title);
    const rating = (4.3 + (h % 8) / 10).toFixed(1);
    const reviews = 60 + (h % 900);
    const price = (8 + (h % 30)) * 1000;
    return {
      ...item,
      rating,
      reviews,
      price: price.toLocaleString('es-CL'),
      grad: GRADIENTS[i % GRADIENTS.length],
    };
  }

  const ALL_TASTE = TASTE_POOL.map(enrich);
  const ALL_COMPANY = COMPANY_POOL.map(enrich);
  const ALL_DEFAULT = DEFAULT_POOL.map(enrich);
  const CATALOG = [...ALL_TASTE, ...ALL_COMPANY, ...ALL_DEFAULT];

  const taste = user.tastes || [];
  const company = user.company || [];

  let recommended = [
    ...ALL_TASTE.filter((i) => taste.includes(i.taste)),
    ...ALL_COMPANY.filter((i) => company.includes(i.company)),
  ];
  // Guarantee at least 6 real cards, backfilling from the general catalog.
  if (recommended.length < 6) {
    const used = new Set(recommended.map((i) => i.title));
    for (const item of ALL_DEFAULT) {
      if (recommended.length >= 6) break;
      if (!used.has(item.title)) {
        recommended.push(item);
        used.add(item.title);
      }
    }
  }

  // General catalog: everything, deduplicated, generic Beto blurb instead of a personal one.
  const seenTitles = new Set();
  const general = CATALOG.filter((i) => {
    if (seenTitles.has(i.title)) return false;
    seenTitles.add(i.title);
    return true;
  }).map((i) => ({ ...i, reason: null }));

  const sub = document.getElementById('panoramasSub');
  if (sub && (taste.length || company.length)) {
    sub.textContent = 'Beto, la IA de Pickmap, los armó cruzando tu edad, con quién sueles ir y lo que nos contaste que te gusta.';
  }

  const kindLabel = { simple: 'Simple', paquete: 'Paquete' };

  function cardHTML(item) {
    const whyBox = item.reason
      ? `<p class="pano-card__why">✨ <b>Por qué Beto lo eligió:</b> nos contaste que ${item.reason}.</p>`
      : `<p class="pano-card__why pano-card__why--general">🤖 Beto dice: uno de los panoramas más populares de Pickmap ahora mismo.</p>`;
    return `
      <article class="pano-card">
        <div class="pano-card__photo pano-card__photo--${item.grad}">
          <span class="pano-card__emoji">${item.icon}</span>
          <span class="pano-card__tag">${item.meta}</span>
          <span class="pano-card__heart">♡</span>
          <span class="pano-card__kind pano-card__kind--${item.kind}">${kindLabel[item.kind]}</span>
        </div>
        <div class="pano-card__body">
          <p class="pano-card__title">${item.title}</p>
          <p class="pano-card__rating">⭐ ${item.rating} <span>(${item.reviews})</span></p>
          <p class="pano-card__price">Desde <b>$${item.price}</b> por persona</p>
          ${whyBox}
        </div>
      </article>
    `;
  }

  function renderRow(elId, list) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.innerHTML = list.map((item) => cardHTML(item)).join('');
  }

  document.addEventListener('click', (e) => {
    const heart = e.target.closest('.pano-card__heart');
    if (!heart) return;
    const liked = heart.classList.toggle('is-liked');
    heart.textContent = liked ? '♥' : '♡';
  });

  renderRow('rowSimple', recommended.filter((i) => i.kind === 'simple').slice(0, 8));
  renderRow('rowPaquete', recommended.filter((i) => i.kind === 'paquete').slice(0, 8));
  renderRow('rowTodos', recommended.slice(0, 8));

  /* ---------- Explore section: tabs + filters ---------- */
  const grid = document.getElementById('panoGrid');
  let activeTab = 'recomendado';
  let activeFilter = 'todos';

  function renderExplore() {
    const source = activeTab === 'recomendado' ? recommended : general;
    const filtered = activeFilter === 'todos' ? source : source.filter((i) => i.kind === activeFilter);
    if (filtered.length === 0) {
      grid.innerHTML = '<p class="pano-empty">Todavía no tenemos panoramas de este tipo. Prueba otro filtro.</p>';
      return;
    }
    grid.innerHTML = filtered.map((item) => cardHTML(item)).join('');
  }

  document.querySelectorAll('.pano-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pano-tab').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      activeTab = btn.dataset.tab;
      renderExplore();
    });
  });

  document.querySelectorAll('.pano-filter').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pano-filter').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      activeFilter = btn.dataset.filter;
      renderExplore();
    });
  });

  document.querySelectorAll('.pano-row__seeall').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const filter = link.dataset.targetFilter;
      activeFilter = filter;
      activeTab = 'recomendado';
      document.querySelectorAll('.pano-filter').forEach((b) => b.classList.toggle('is-active', b.dataset.filter === filter));
      document.querySelectorAll('.pano-tab').forEach((b) => b.classList.toggle('is-active', b.dataset.tab === 'recomendado'));
      renderExplore();
      document.getElementById('explorar').scrollIntoView({ behavior: 'smooth' });
    });
  });

  renderExplore();

  if (window.location.hash === '#explorar') {
    document.getElementById('explorar').scrollIntoView();
  }
})();
