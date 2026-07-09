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

  const FAVORITES_KEY = `pickmap_favorites_${user.email}`;
  function getFavorites() {
    try { return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || []; } catch { return []; }
  }
  function saveFavorites(list) { localStorage.setItem(FAVORITES_KEY, JSON.stringify(list)); }
  function isFavorited(title) { return getFavorites().some((f) => f.title === title); }

  const ADDONS_KEY = `pickmap_addons_${user.email}`;
  function getAddons() {
    try { return JSON.parse(localStorage.getItem(ADDONS_KEY)) || []; } catch { return []; }
  }
  function saveAddons(list) { localStorage.setItem(ADDONS_KEY, JSON.stringify(list)); }
  function addonKey(parent, child) { return `${parent}|||${child}`; }
  function isAddedOn(parent, child) { return getAddons().includes(addonKey(parent, child)); }
  function parseAddonKey(key) {
    const [parent, child] = key.split('|||');
    return { parent, child };
  }
  function getAddonItemsFor(parentTitle) {
    return getAddons()
      .map(parseAddonKey)
      .filter((k) => k.parent === parentTitle)
      .map((k) => CATALOG.find((i) => i.title === k.child))
      .filter(Boolean);
  }

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
    { taste: 'extremo', kind: 'simple', icon: '🪂', title: 'Paracaidismo en tándem', meta: 'A 1.2 horas', reason: 'te gustan los deportes extremos' },
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

  // Deterministic "real-looking" rating/reviews/price/km/day + a photo-card gradient per item.
  const GRADIENTS = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6'];
  function hashStr(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h;
  }
  function parseKm(meta, h) {
    const hourMatch = meta.match(/(\d+(\.\d+)?)\s*hora/i);
    if (hourMatch) return Math.round(parseFloat(hourMatch[1]) * 45);
    const minMatch = meta.match(/(\d+)\s*min/i);
    if (minMatch) return Math.round(parseInt(minMatch[1], 10) * 0.7);
    return 8 + (h % 40);
  }
  function parseDay(meta, h) {
    if (/viernes|s[aá]bado|domingo|fin de semana/i.test(meta)) return 'finde';
    if (/lunes|martes|mi[eé]rcoles|jueves/i.test(meta)) return 'semana';
    return h % 2 === 0 ? 'semana' : 'finde';
  }
  const DIFFICULTY_OVERRIDES = {
    'Salto en parapente': 'extremo',
    'Paracaidismo en tándem': 'extremo',
    'Downhill + almuerzo campestre': 'extremo',
    'Canopy en el Cajón del Maipo': 'moderado',
    'Trekking + cabaña con tinaja': 'moderado',
    'Subida a la nieve por el día': 'moderado',
    'Ski + arriendo de equipo + almuerzo': 'moderado',
    'Ruta de senderismo autoguiada': 'moderado',
    'Team building al aire libre': 'moderado',
    'Canopy + termas': 'moderado',
    'Karting bajo las estrellas': 'moderado',
  };
  function getDifficulty(title) {
    return DIFFICULTY_OVERRIDES[title] || 'suave';
  }
  const GEAR_OVERRIDES = {
    'Salto en parapente': 'Ropa deportiva, zapatillas cerradas y chaqueta cortavientos',
    'Paracaidismo en tándem': 'Ropa deportiva ajustada, zapatillas cerradas (el casco y arnés los provee el operador)',
    'Downhill + almuerzo campestre': 'Ropa deportiva, guantes y zapatillas cerradas',
    'Subida a la nieve por el día': 'Ropa térmica, gorro, guantes y bloqueador solar',
    'Ski + arriendo de equipo + almuerzo': 'Ropa térmica y bloqueador solar (equipo de ski incluido)',
  };
  const GEAR_BY_CATEGORY = {
    naturaleza: 'Ropa cómoda, zapatillas cerradas y bloqueador solar',
    extremo: 'Ropa deportiva y zapatillas cerradas',
    playa: 'Traje de baño, toalla y bloqueador solar',
    nieve: 'Ropa térmica, gorro y guantes',
    gastronomia: 'Ropa casual',
    relax: 'Ropa cómoda (traje de baño si hay tinaja o piscina)',
    vidanocturna: 'Ropa de salida',
    cultura: 'Ropa cómoda para caminar',
    shopping: 'Ropa cómoda',
    fotografia: 'Ropa cómoda y batería cargada para la cámara',
    musica: 'Ropa cómoda para bailar',
    pareja: 'Ropa casual',
    familia: 'Ropa cómoda para toda la familia',
    amigos: 'Ropa casual',
    trabajo: 'Ropa cómoda para actividades al aire libre',
    solo: 'Ropa cómoda y zapatillas de trekking',
    general: 'Ropa cómoda',
  };
  function getGear(title, category) {
    return GEAR_OVERRIDES[title] || GEAR_BY_CATEGORY[category] || 'Ropa cómoda';
  }
  const ZONE_BY_CATEGORY = {
    naturaleza: 'Cajón del Maipo', extremo: 'Cajón del Maipo', nieve: 'Farellones, Lo Barnechea',
    playa: 'Algarrobo, Litoral Central', relax: 'Valle de Colina', gastronomia: 'Barrio Italia, Providencia',
    vidanocturna: 'Barrio Bellavista', cultura: 'Barrio Lastarria', shopping: 'Providencia',
    fotografia: 'Cerro San Cristóbal', musica: "Parque O'Higgins", pareja: 'Providencia',
    familia: 'La Reina', amigos: 'Ñuñoa', trabajo: 'Las Condes', solo: 'Cajón del Maipo',
    general: 'Región Metropolitana',
  };
  function getZone(category) { return ZONE_BY_CATEGORY[category] || ZONE_BY_CATEGORY.general; }
  const ARRIVAL_BY_CATEGORY = {
    naturaleza: 'En auto por camino pavimentado hasta el sector; Pickmap también ofrece transporte compartido opcional.',
    extremo: 'Punto de encuentro con el operador; se recomienda auto propio o combi compartida coordinada al reservar.',
    nieve: 'En auto con cadenas (obligatorias en invierno) o bus de acceso a la montaña; estacionamiento pagado en el lugar.',
    playa: 'En auto por ruta costera o en buses directos desde el centro de Santiago.',
    relax: 'En auto propio; el recinto cuenta con estacionamiento gratuito para huéspedes.',
    gastronomia: 'A pie o en auto dentro del barrio; hay estacionamientos públicos cercanos.',
    vidanocturna: 'Se recomienda llegar en Uber/taxi; el barrio tiene alta demanda de estacionamiento los fines de semana.',
    cultura: 'A pie desde el metro más cercano o en auto; zona con buena conectividad de transporte público.',
    shopping: 'En metro o en auto; hay estacionamiento disponible en el sector.',
    fotografia: 'Acceso peatonal o en auto hasta el mirador; hay estacionamiento en la base del cerro.',
    musica: 'Según el recinto del evento; revisa tu entrada para conocer accesos y estacionamiento.',
    pareja: 'En auto o Uber/taxi; se recomienda reservar con anticipación.',
    familia: 'En auto propio; el lugar cuenta con estacionamiento y acceso apto para niños.',
    amigos: 'En auto o transporte compartido con el grupo; hay estacionamiento cercano.',
    trabajo: 'Transporte coordinado por la empresa o en auto propio hasta el recinto.',
    solo: 'Acceso en auto o transporte público hasta el punto de inicio del sendero.',
    general: 'Te enviamos la dirección exacta y las indicaciones de acceso al confirmar tu reserva.',
  };
  function getArrival(category) { return ARRIVAL_BY_CATEGORY[category] || ARRIVAL_BY_CATEGORY.general; }
  function enrich(item, i) {
    const h = hashStr(item.title);
    const rating = (4.3 + (h % 8) / 10).toFixed(1);
    const reviews = 60 + (h % 900);
    const priceNum = (8 + (h % 30)) * 1000;
    const category = item.taste || item.company || 'general';
    return {
      ...item,
      rating,
      reviews,
      priceNum,
      price: priceNum.toLocaleString('es-CL'),
      km: parseKm(item.meta, h),
      day: parseDay(item.meta, h),
      difficulty: getDifficulty(item.title),
      gear: getGear(item.title, category),
      category,
      grad: GRADIENTS[i % GRADIENTS.length],
    };
  }
  function distanceBucket(km) {
    if (km <= 20) return 'cerca';
    if (km <= 45) return 'media';
    return 'lejos';
  }
  function priceBucket(priceNum) {
    if (priceNum <= 15000) return 'bajo';
    if (priceNum <= 30000) return 'medio';
    return 'alto';
  }
  const DIFFICULTY_LABELS = { suave: 'Suave', moderado: 'Moderado', extremo: 'Extremo' };
  const DIFFICULTY_ICONS = { suave: '🟢', moderado: '🟡', extremo: '🔴' };
  const CATEGORY_LABELS = {
    naturaleza: 'Naturaleza', gastronomia: 'Gastronomía', relax: 'Relax', vidanocturna: 'Vida nocturna',
    cultura: 'Cultura', extremo: 'Extremo', playa: 'Playa', nieve: 'Nieve', shopping: 'Shopping',
    fotografia: 'Fotografía', musica: 'Música',
    pareja: 'En pareja', familia: 'En familia', amigos: 'Con amigos', trabajo: 'De trabajo', solo: 'Solo/a',
    general: 'Populares',
  };
  // What pairs well as an add-on to each type of plan (e.g. a cabin trip pairs well with hot springs).
  const COMPLEMENT_BY_CATEGORY = {
    naturaleza: 'relax', extremo: 'gastronomia', nieve: 'relax', playa: 'gastronomia',
    relax: 'gastronomia', gastronomia: 'vidanocturna', vidanocturna: 'gastronomia',
    cultura: 'gastronomia', shopping: 'gastronomia', fotografia: 'naturaleza', musica: 'gastronomia',
    pareja: 'gastronomia', familia: 'relax', amigos: 'vidanocturna', trabajo: 'relax', solo: 'naturaleza',
    general: 'gastronomia',
  };
  function getComplementCategory(category) {
    return COMPLEMENT_BY_CATEGORY[category] || COMPLEMENT_BY_CATEGORY.general;
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
    const firstName = user.name ? user.name.trim().split(' ')[0] : 'viajero';
    sub.textContent = `Beto procesó tu edad, tu compañía y tus gustos en tiempo real junto con el clima y la hora, y su algoritmo decidió que esto es justo lo ideal para ti, ${firstName}.`;
  }

  const kindLabel = { simple: 'Simple', paquete: 'Paquete' };

  function cardHTML(item) {
    const whyBox = item.reason
      ? `<p class="pano-card__why">✨ <b>Por qué Beto lo eligió:</b> nos contaste que ${item.reason}.</p>`
      : `<p class="pano-card__why pano-card__why--general">🤖 Beto dice: uno de los panoramas más populares de Pickmap ahora mismo.</p>`;
    const liked = isFavorited(item.title);
    return `
      <article class="pano-card" data-title="${item.title}" tabindex="0" role="button" aria-haspopup="dialog">
        <div class="pano-card__photo pano-card__photo--${item.grad}">
          <span class="pano-card__emoji">${item.icon}</span>
          <span class="pano-card__tag">${item.meta}</span>
          <span class="pano-card__heart${liked ? ' is-liked' : ''}" data-title="${item.title}">${liked ? '♥' : '♡'}</span>
          <span class="pano-card__badges">
            <span class="pano-card__kind pano-card__kind--${item.kind}">${kindLabel[item.kind]}</span>
            <span class="pano-card__difficulty pano-card__difficulty--${item.difficulty}" title="Nivel de exigencia física: ${DIFFICULTY_LABELS[item.difficulty]}">${DIFFICULTY_ICONS[item.difficulty]} ${DIFFICULTY_LABELS[item.difficulty]}</span>
          </span>
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
    el.innerHTML = list.length
      ? list.map((item) => cardHTML(item)).join('')
      : '<p class="pano-empty pano-empty--row">Sin resultados con estos filtros.</p>';
  }

  document.addEventListener('click', (e) => {
    const heart = e.target.closest('.pano-card__heart');
    if (!heart) return;
    const title = heart.dataset.title;
    const nowLiked = !heart.classList.contains('is-liked');
    const favorites = getFavorites();
    if (nowLiked) {
      const full = CATALOG.find((i) => i.title === title);
      if (full && !favorites.some((f) => f.title === title)) favorites.push(full);
    } else {
      const idx = favorites.findIndex((f) => f.title === title);
      if (idx !== -1) favorites.splice(idx, 1);
    }
    saveFavorites(favorites);
    document.querySelectorAll(`.pano-card__heart[data-title="${CSS.escape(title)}"]`).forEach((h) => {
      h.classList.toggle('is-liked', nowLiked);
      h.textContent = nowLiked ? '♥' : '♡';
    });
  });

  /* ---------- Detail modal: what you see after clicking a card ---------- */
  const DAY_LABELS = { semana: 'Entre semana', finde: 'Fin de semana o feriado' };

  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'pano-modal-overlay';
  modalOverlay.id = 'panoModalOverlay';
  modalOverlay.hidden = true;
  modalOverlay.innerHTML = `
    <div class="pano-modal" role="dialog" aria-modal="true" aria-labelledby="panoModalTitle">
      <button type="button" class="pano-modal__close" id="panoModalClose" aria-label="Cerrar">✕</button>
      <div id="panoModalBody"></div>
    </div>
  `;
  document.body.appendChild(modalOverlay);
  const modalBody = document.getElementById('panoModalBody');

  function nearbyItems(item) {
    const pool = CATALOG.filter((i) => i.title !== item.title);
    const complementCategory = getComplementCategory(item.category);
    const byProximity = (a, b) => Math.abs(a.km - item.km) - Math.abs(b.km - item.km);
    const complements = pool.filter((i) => i.category === complementCategory).sort(byProximity);
    const rest = pool.filter((i) => i.category !== complementCategory).sort(byProximity);
    return [...complements, ...rest].slice(0, 3);
  }

  function nearbyHTML(item) {
    const nearby = nearbyItems(item);
    if (!nearby.length) return '';
    return `
      <div class="pano-modal__nearby">
        <p class="pano-modal__nearby-title">Panoramas cerca de ahí</p>
        <div class="pano-modal__nearby-list">
          ${nearby.map((n) => {
            const dayLabel = DAY_LABELS[n.day] || 'Cualquier día';
            const distFromPlace = Math.abs(n.km - item.km);
            const added = isAddedOn(item.title, n.title);
            return `
            <div class="pano-modal__nearby-row">
              <div class="pano-modal__nearby-item">
                <button type="button" class="pano-modal__nearby-open" data-title="${n.title}">
                  <span class="pano-modal__nearby-icon pano-modal__nearby-icon--${n.grad}">${n.icon}</span>
                  <span class="pano-modal__nearby-info">
                    <b>${n.title}</b>
                    <small>A ${distFromPlace} km de ahí · desde $${n.price}</small>
                  </span>
                </button>
                <button type="button" class="pano-modal__nearby-toggle" aria-label="Ver más info" aria-expanded="false"><span class="pano-modal__nearby-chevron">⌄</span></button>
              </div>
              <button type="button" class="pano-modal__nearby-add${added ? ' is-added' : ''}" data-parent="${item.title}" data-title="${n.title}" aria-pressed="${added}" aria-label="${added ? 'Quitar de tu panorama' : 'Agregar a tu panorama'}">${added ? '✓' : '+'}</button>
            </div>
            <div class="pano-modal__nearby-details" hidden>
              <div class="pano-modal__nearby-fact"><span>⭐</span><div><b>${n.rating} (${n.reviews} reseñas)</b><small>Calificación</small></div></div>
              <div class="pano-modal__nearby-fact"><span>📍</span><div><b>${getZone(n.category)}</b><small>Dirección aproximada</small></div></div>
              <div class="pano-modal__nearby-fact"><span>🚗</span><div><b>${distFromPlace} km</b><small>Distancia desde este panorama</small></div></div>
              <div class="pano-modal__nearby-fact"><span>🧭</span><div><b>${getArrival(n.category)}</b><small>Cómo llegar</small></div></div>
              <div class="pano-modal__nearby-fact"><span>📅</span><div><b>${dayLabel}</b><small>Cuándo</small></div></div>
              <div class="pano-modal__nearby-fact"><span>${DIFFICULTY_ICONS[n.difficulty]}</span><div><b>${DIFFICULTY_LABELS[n.difficulty]}</b><small>Nivel de exigencia física</small></div></div>
              <div class="pano-modal__nearby-fact"><span>🎒</span><div><b>${n.gear}</b><small>Vestimenta / equipamiento ideal</small></div></div>
            </div>
          `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function modalHTML(item) {
    const liked = isFavorited(item.title);
    const categoryLabel = CATEGORY_LABELS[item.category] || 'Popular';
    const dayLabel = DAY_LABELS[item.day] || 'Cualquier día';
    return `
      <div class="pano-modal__photo pano-modal__photo--${item.grad}">
        <span class="pano-modal__emoji">${item.icon}</span>
        <span class="pano-modal__badges">
          <span class="pano-modal__kind pano-modal__kind--${item.kind}">${kindLabel[item.kind]}</span>
          <span class="pano-card__difficulty pano-modal__difficulty pano-card__difficulty--${item.difficulty}" title="Nivel de exigencia física: ${DIFFICULTY_LABELS[item.difficulty]}">${DIFFICULTY_ICONS[item.difficulty]} ${DIFFICULTY_LABELS[item.difficulty]}</span>
        </span>
        <span class="pano-card__heart${liked ? ' is-liked' : ''} pano-modal__heart" data-title="${item.title}">${liked ? '♥' : '♡'}</span>
      </div>
      <div class="pano-modal__content">
        <h2 class="pano-modal__title" id="panoModalTitle">${item.title}</h2>
        <p class="pano-modal__rating">⭐ ${item.rating} <span>(${item.reviews} reseñas)</span></p>
        <div class="pano-modal__facts">
          <div class="pano-modal__fact"><span>📍</span><div><b>${item.meta}</b><small>Ubicación / duración</small></div></div>
          <div class="pano-modal__fact"><span>🚗</span><div><b>${item.km} km</b><small>Distancia aprox.</small></div></div>
          <div class="pano-modal__fact"><span>📅</span><div><b>${dayLabel}</b><small>Cuándo</small></div></div>
          <div class="pano-modal__fact"><span>🏷️</span><div><b>${categoryLabel}</b><small>Tipo de experiencia</small></div></div>
          <div class="pano-modal__fact"><span>${DIFFICULTY_ICONS[item.difficulty]}</span><div><b>${DIFFICULTY_LABELS[item.difficulty]}</b><small>Nivel de exigencia física</small></div></div>
          <div class="pano-modal__fact"><span>🧭</span><div><b>${getZone(item.category)}</b><small>Zona / cómo llegar</small></div></div>
          <div class="pano-modal__fact pano-modal__fact--wide"><span>🎒</span><div><b>${item.gear}</b><small>Equipamiento / ropa ideal</small></div></div>
        </div>
        <p class="pano-modal__desc">Un panorama tipo <b>${kindLabel[item.kind].toLowerCase()}</b>, pensado para quienes disfrutan ${categoryLabel.toLowerCase()}. ${item.meta} y a unos ${item.km} km de tu ubicación. ${getArrival(item.category)}</p>
        ${nearbyHTML(item)}
        <div class="pano-modal__footer">
          <p class="pano-modal__price">Desde <b>$${item.price}</b> <span>por persona</span></p>
          <button type="button" class="btn btn--primary pano-modal__reserve">Reservar este panorama</button>
        </div>
      </div>
    `;
  }

  let currentModalItem = null;
  function openModal(item) {
    currentModalItem = item;
    modalBody.innerHTML = modalHTML(item);
    modalOverlay.querySelector('.pano-modal').scrollTop = 0;
    modalOverlay.hidden = false;
    document.body.classList.add('pano-modal-open');
  }
  function closeModal() {
    modalOverlay.hidden = true;
    currentModalItem = null;
    document.body.classList.remove('pano-modal-open');
  }

  document.getElementById('panoModalClose').addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  /* ---------- Reserve modal: date/time/contact/payment summary ---------- */
  const reserveModalOverlay = document.createElement('div');
  reserveModalOverlay.className = 'reserve-modal-overlay';
  reserveModalOverlay.hidden = true;
  reserveModalOverlay.innerHTML = `
    <div class="reserve-modal" role="dialog" aria-modal="true" aria-labelledby="reserveModalTitle">
      <button type="button" class="reserve-modal__close" aria-label="Cerrar">✕</button>
      <div id="reserveModalBody"></div>
    </div>
  `;
  document.body.appendChild(reserveModalOverlay);
  const reserveModalBody = reserveModalOverlay.querySelector('#reserveModalBody');

  function activityScheduleSlotsHTML() {
    return ['09:00', '11:00', '13:00', '15:00', '17:00']
      .map((s) => `<button type="button" class="reserve-slot${s === '09:00' ? ' is-selected' : ''}" data-slot="${s}">${s}</button>`)
      .join('');
  }

  function isSlotAvailable(title, date, slot) {
    return hashStr(`${title}|${date}|${slot}`) % 5 !== 0;
  }

  function activityRowHTML(it, idx, mainItem) {
    const isMain = idx === 0;
    const distFromMain = isMain ? it.km : Math.abs(it.km - mainItem.km);
    return `
      <div class="reserve-activity" data-index="${idx}" data-title="${it.title}">
        <div class="reserve-activity__row">
          <span class="reserve-summary__icon reserve-summary__icon--${it.grad}">${it.icon}</span>
          <div class="reserve-summary__info">
            <b>${it.title}</b>
            <small>${isMain ? it.meta : 'Complemento agregado'}</small>
          </div>
          <button type="button" class="reserve-activity__toggle" aria-expanded="${isMain ? 'true' : 'false'}" aria-label="Ver detalle y horario"><span class="pano-modal__nearby-chevron">⌄</span></button>
        </div>
        <div class="reserve-activity__details"${isMain ? '' : ' hidden'}>
          <div class="reserve-activity__facts">
            <div class="reserve-activity__fact"><span>⭐</span><div><b>${it.rating} (${it.reviews})</b><small>Calificación</small></div></div>
            <div class="reserve-activity__fact"><span>📍</span><div><b>${getZone(it.category)}</b><small>Dirección aproximada</small></div></div>
            <div class="reserve-activity__fact"><span>🚗</span><div><b>${distFromMain} km</b><small>${isMain ? 'Distancia aprox.' : 'Distancia desde la actividad principal'}</small></div></div>
            <div class="reserve-activity__fact"><span>🧭</span><div><b>${getArrival(it.category)}</b><small>Cómo llegar</small></div></div>
            <div class="reserve-activity__fact"><span>${DIFFICULTY_ICONS[it.difficulty]}</span><div><b>${DIFFICULTY_LABELS[it.difficulty]}</b><small>Nivel de exigencia física</small></div></div>
            <div class="reserve-activity__fact"><span>🎒</span><div><b>${it.gear}</b><small>Equipamiento / ropa ideal</small></div></div>
          </div>
          <div class="reserve-activity__schedule">
            <label class="reserve-field">
              <span>Fecha</span>
              <input type="date" class="reserve-activity__date"${isMain ? ' required' : ''}>
            </label>
            <div class="reserve-field">
              <span>Horario</span>
              <div class="reserve-slots reserve-activity__slots">${activityScheduleSlotsHTML()}</div>
              <p class="reserve-activity__avail-note">&nbsp;</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function reserveModalHTML(item) {
    const addonItems = getAddonItemsFor(item.title);
    const allItems = [item, ...addonItems];
    const total = allItems.reduce((sum, it) => sum + it.priceNum, 0);
    return `
      <h2 class="reserve-modal__title" id="reserveModalTitle">Resumen de tu reserva</h2>
      <div class="reserve-activities">
        ${allItems.map((it, idx) => activityRowHTML(it, idx, item)).join('')}
      </div>
      <div class="reserve-breakdown">
        ${allItems.map((it) => `<div class="reserve-breakdown__row"><span>${it.title}</span><span>$${it.price}</span></div>`).join('')}
        <div class="reserve-breakdown__total">
          <span>Total estimado${allItems.length > 1 ? ` · ${allItems.length} experiencias` : ''}</span>
          <b>$${total.toLocaleString('es-CL')}</b>
        </div>
      </div>

      <form id="reserveForm" class="reserve-form" novalidate>
        <label class="reserve-field">
          <span>Número de personas</span>
          <input type="number" name="people" min="1" value="1" required>
        </label>
        <div id="reservePassengers" class="reserve-passengers"></div>
        <p class="reserve-form__section-title">Datos de contacto</p>
        <label class="reserve-field">
          <span>Nombre completo</span>
          <input type="text" name="name" value="${user.name || ''}" required>
        </label>
        <label class="reserve-field">
          <span>Correo</span>
          <input type="email" name="email" value="${user.email || ''}" required>
        </label>
        <label class="reserve-field">
          <span>Teléfono</span>
          <input type="tel" name="phone" value="${user.phone || ''}" placeholder="+56 9 1234 5678">
        </label>
        <p class="reserve-form__section-title">Método de pago</p>
        <label class="reserve-pay">
          <input type="radio" name="pay" value="visa" checked>
          <span>VISA •••• 4231</span>
        </label>
        <label class="reserve-pay">
          <input type="radio" name="pay" value="mc">
          <span>Mastercard •••• 8890</span>
        </label>
        <p class="reserve-form__feedback" id="reserveFeedback">&nbsp;</p>
        <button type="submit" class="btn btn--primary reserve-form__submit">Confirmar reserva</button>
      </form>
    `;
  }

  function reserveSuccessHTML(item, data) {
    const code = `PM-${(hashStr(item.title + data.schedule.map((s) => s.date + s.slot).join('')) % 900000 + 100000)}`;
    return `
      <div class="reserve-success">
        <span class="reserve-success__icon">✅</span>
        <h2 class="reserve-modal__title">¡Reserva confirmada!</h2>
        <p class="reserve-success__sub">Te enviamos los detalles a <b>${data.email}</b>.</p>
        <div class="reserve-success__card">
          <div class="reserve-success__row"><span>Código de reserva</span><b>${code}</b></div>
          ${data.schedule.map((s) => `<div class="reserve-success__row"><span>${s.title}</span><b>${s.date} · ${s.slot}</b></div>`).join('')}
          <div class="reserve-success__row"><span>Pasajeros</span><b>${data.passengers.join(', ')}</b></div>
          <div class="reserve-success__row"><span>Total</span><b>$${data.total.toLocaleString('es-CL')}</b></div>
        </div>
        <button type="button" class="btn btn--primary reserve-success__close">Listo</button>
      </div>
    `;
  }

  function openReserveModal(item) {
    reserveModalBody.innerHTML = reserveModalHTML(item);
    reserveModalOverlay.querySelector('.reserve-modal').scrollTop = 0;
    modalOverlay.hidden = true;
    reserveModalOverlay.hidden = false;
    document.body.classList.add('pano-modal-open');
  }
  function closeReserveModal() {
    reserveModalOverlay.hidden = true;
    if (currentModalItem) modalOverlay.hidden = false;
    else document.body.classList.remove('pano-modal-open');
  }
  function finishReserveModal() {
    reserveModalOverlay.hidden = true;
    modalOverlay.hidden = true;
    currentModalItem = null;
    document.body.classList.remove('pano-modal-open');
  }

  reserveModalOverlay.querySelector('.reserve-modal__close').addEventListener('click', closeReserveModal);
  reserveModalOverlay.addEventListener('click', (e) => {
    if (e.target === reserveModalOverlay) closeReserveModal();
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('.pano-modal__reserve')) {
      if (currentModalItem) openReserveModal(currentModalItem);
      return;
    }
    const actToggle = e.target.closest('.reserve-activity__toggle');
    if (actToggle) {
      const details = actToggle.closest('.reserve-activity').querySelector('.reserve-activity__details');
      const expanded = details.hidden;
      details.hidden = !expanded;
      actToggle.setAttribute('aria-expanded', String(expanded));
      return;
    }
    const slotBtn = e.target.closest('.reserve-slot');
    if (slotBtn) {
      if (slotBtn.disabled) return;
      slotBtn.parentElement.querySelectorAll('.reserve-slot').forEach((b) => b.classList.remove('is-selected'));
      slotBtn.classList.add('is-selected');
      return;
    }
    if (e.target.closest('.reserve-success__close')) {
      finishReserveModal();
    }
  });

  function renderPassengerFields(peopleInput) {
    const form = peopleInput.closest('#reserveForm');
    const container = form && form.querySelector('#reservePassengers');
    if (!container) return;
    const count = Math.max(1, parseInt(peopleInput.value, 10) || 1);
    const prevValues = Array.from(container.querySelectorAll('.reserve-passenger-name')).map((i) => i.value);
    let html = '';
    for (let i = 2; i <= count; i++) {
      html += `<label class="reserve-field"><span>Nombre pasajero ${i}</span><input type="text" class="reserve-passenger-name" value="${prevValues[i - 2] || ''}" required></label>`;
    }
    container.innerHTML = html;
  }

  document.addEventListener('input', (e) => {
    if (e.target.name === 'people' && e.target.closest('#reserveForm')) {
      renderPassengerFields(e.target);
      return;
    }
    if (e.target.classList.contains('reserve-activity__date')) {
      const activityEl = e.target.closest('.reserve-activity');
      const title = activityEl.dataset.title;
      const date = e.target.value;
      const slotBtns = activityEl.querySelectorAll('.reserve-slot');
      let availableCount = 0;
      let selectedStillAvailable = false;
      slotBtns.forEach((btn) => {
        const available = !date || isSlotAvailable(title, date, btn.dataset.slot);
        btn.classList.toggle('is-unavailable', !available);
        btn.disabled = !available;
        btn.title = available ? '' : 'Sin cupos para este horario';
        if (available) availableCount++;
        if (available && btn.classList.contains('is-selected')) selectedStillAvailable = true;
      });
      if (date && !selectedStillAvailable) {
        slotBtns.forEach((b) => b.classList.remove('is-selected'));
        const firstAvail = Array.from(slotBtns).find((b) => !b.disabled);
        if (firstAvail) firstAvail.classList.add('is-selected');
      }
      const note = activityEl.querySelector('.reserve-activity__avail-note');
      if (note) {
        if (!date) {
          note.textContent = ' ';
          note.className = 'reserve-activity__avail-note';
        } else if (availableCount === 0) {
          note.textContent = '❌ Sin cupos disponibles ese día. Prueba otra fecha.';
          note.className = 'reserve-activity__avail-note is-error';
        } else if (availableCount <= 2) {
          note.textContent = `⚠️ Quedan pocos horarios disponibles (${availableCount}) para esta fecha.`;
          note.className = 'reserve-activity__avail-note is-warn';
        } else {
          note.textContent = '✅ Buena disponibilidad para esta fecha.';
          note.className = 'reserve-activity__avail-note is-ok';
        }
      }
    }
  });

  document.addEventListener('submit', (e) => {
    if (e.target.id !== 'reserveForm' || !currentModalItem) return;
    e.preventDefault();
    const form = e.target;
    const people = parseInt(form.people.value, 10) || 1;
    const name = form.name.value.trim();
    const emailVal = form.email.value.trim();
    const phone = form.phone.value.trim();
    const feedback = document.getElementById('reserveFeedback');

    const addonItems = getAddonItemsFor(currentModalItem.title);
    const allItems = [currentModalItem, ...addonItems];
    const activityEls = Array.from(reserveModalBody.querySelectorAll('.reserve-activity'));
    const mainDateInput = activityEls[0] ? activityEls[0].querySelector('.reserve-activity__date') : null;
    const mainDate = mainDateInput ? mainDateInput.value : '';
    const passengerInputs = Array.from(form.querySelectorAll('.reserve-passenger-name'));
    const passengerNames = passengerInputs.map((i) => i.value.trim());

    if (!mainDate || !name || !emailVal || passengerNames.some((n) => !n)) {
      feedback.textContent = 'Completa la fecha de la actividad principal, tus datos de contacto y el nombre de cada pasajero.';
      feedback.classList.add('is-error');
      return;
    }
    const unavailableSlot = activityEls.some((el) => {
      const selected = el.querySelector('.reserve-slot.is-selected');
      return selected && selected.disabled;
    });
    if (unavailableSlot) {
      feedback.textContent = 'Uno de los horarios elegidos ya no tiene cupos. Revisa la disponibilidad marcada en rojo.';
      feedback.classList.add('is-error');
      return;
    }

    const schedule = allItems.map((it, idx) => {
      const el = activityEls[idx];
      const dateInput = el ? el.querySelector('.reserve-activity__date') : null;
      const slotBtn = el ? el.querySelector('.reserve-slot.is-selected') : null;
      return {
        title: it.title,
        date: (dateInput && dateInput.value) || mainDate,
        slot: (slotBtn && slotBtn.dataset.slot) || '09:00',
      };
    });
    const total = allItems.reduce((sum, it) => sum + it.priceNum, 0) * people;
    const passengers = [name, ...passengerNames];
    const data = { schedule, people, name, email: emailVal, phone, total, passengers };
    reserveModalBody.innerHTML = reserveSuccessHTML(currentModalItem, data);
    reserveModalOverlay.querySelector('.reserve-modal').scrollTop = 0;
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!reserveModalOverlay.hidden) { closeReserveModal(); return; }
    if (!modalOverlay.hidden) closeModal();
  });

  document.addEventListener('click', (e) => {
    const addBtn = e.target.closest('.pano-modal__nearby-add');
    if (addBtn) {
      const parent = addBtn.dataset.parent;
      const title = addBtn.dataset.title;
      const key = addonKey(parent, title);
      const addons = getAddons();
      const idx = addons.indexOf(key);
      const nowAdded = idx === -1;
      if (nowAdded) addons.push(key); else addons.splice(idx, 1);
      saveAddons(addons);
      addBtn.classList.toggle('is-added', nowAdded);
      addBtn.textContent = nowAdded ? '✓' : '+';
      addBtn.setAttribute('aria-pressed', String(nowAdded));
      addBtn.setAttribute('aria-label', nowAdded ? 'Quitar de tu panorama' : 'Agregar a tu panorama');
      return;
    }
    const toggleBtn = e.target.closest('.pano-modal__nearby-toggle');
    if (toggleBtn) {
      const details = toggleBtn.closest('.pano-modal__nearby-row').nextElementSibling;
      const expanded = details.hidden;
      details.hidden = !expanded;
      toggleBtn.setAttribute('aria-expanded', String(expanded));
      return;
    }
    const nearbyBtn = e.target.closest('.pano-modal__nearby-open');
    if (nearbyBtn) {
      const item = CATALOG.find((i) => i.title === nearbyBtn.dataset.title);
      if (item) openModal(item);
      return;
    }
    if (e.target.closest('.pano-card__heart')) return;
    const card = e.target.closest('.pano-card');
    if (!card) return;
    const item = CATALOG.find((i) => i.title === card.dataset.title);
    if (item) openModal(item);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('.pano-card');
    if (!card) return;
    e.preventDefault();
    const item = CATALOG.find((i) => i.title === card.dataset.title);
    if (item) openModal(item);
  });

  /* ---------- Filters (shared by rows + explore grid) ---------- */
  const grid = document.getElementById('panoGrid');
  let activeTab = 'recomendado';
  let activeFilter = 'todos';
  let activeCategory = 'todas';
  let activeDistance = 'todas';
  let activePrice = 'todos';
  let activeDay = 'todos';

  const categorySelect = document.getElementById('filterCategory');
  if (categorySelect) {
    const seenCats = new Set(CATALOG.map((i) => i.category));
    [...seenCats]
      .sort((a, b) => (CATEGORY_LABELS[a] || a).localeCompare(CATEGORY_LABELS[b] || b))
      .forEach((cat) => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = CATEGORY_LABELS[cat] || cat;
        categorySelect.appendChild(opt);
      });
  }

  function applyAdvFilters(list) {
    let filtered = list;
    if (activeCategory !== 'todas') filtered = filtered.filter((i) => i.category === activeCategory);
    if (activeDistance !== 'todas') filtered = filtered.filter((i) => distanceBucket(i.km) === activeDistance);
    if (activePrice !== 'todos') filtered = filtered.filter((i) => priceBucket(i.priceNum) === activePrice);
    if (activeDay !== 'todos') filtered = filtered.filter((i) => i.day === activeDay);
    return filtered;
  }

  function renderRows() {
    const filteredRecommended = applyAdvFilters(recommended);
    renderRow('rowSimple', filteredRecommended.filter((i) => i.kind === 'simple').slice(0, 8));
    renderRow('rowPaquete', filteredRecommended.filter((i) => i.kind === 'paquete').slice(0, 8));
    renderRow('rowTodos', filteredRecommended.slice(0, 8));
  }

  function renderExplore() {
    const source = activeTab === 'recomendado' ? recommended : general;
    const kindFiltered = activeFilter === 'todos' ? source : source.filter((i) => i.kind === activeFilter);
    const filtered = applyAdvFilters(kindFiltered);
    if (filtered.length === 0) {
      grid.innerHTML = '<p class="pano-empty">Todavía no tenemos panoramas con esos filtros. Prueba ajustar alguno.</p>';
      return;
    }
    grid.innerHTML = filtered.map((item) => cardHTML(item)).join('');
  }

  function renderAll() {
    renderRows();
    renderExplore();
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
      activeCategory = 'todas';
      activeDistance = 'todas';
      activePrice = 'todos';
      activeDay = 'todos';
      document.querySelectorAll('.pano-filter').forEach((b) => b.classList.toggle('is-active', b.dataset.filter === filter));
      document.querySelectorAll('.pano-tab').forEach((b) => b.classList.toggle('is-active', b.dataset.tab === 'recomendado'));
      if (categorySelect) categorySelect.value = 'todas';
      document.getElementById('filterDistance').value = 'todas';
      document.getElementById('filterPrice').value = 'todos';
      document.getElementById('filterDay').value = 'todos';
      renderAll();
      document.getElementById('explorar').scrollIntoView({ behavior: 'smooth' });
    });
  });

  if (categorySelect) categorySelect.addEventListener('change', (e) => { activeCategory = e.target.value; renderAll(); });
  document.getElementById('filterDistance').addEventListener('change', (e) => { activeDistance = e.target.value; renderAll(); });
  document.getElementById('filterPrice').addEventListener('change', (e) => { activePrice = e.target.value; renderAll(); });
  document.getElementById('filterDay').addEventListener('change', (e) => { activeDay = e.target.value; renderAll(); });
  document.getElementById('resetFilters').addEventListener('click', () => {
    activeCategory = 'todas';
    activeDistance = 'todas';
    activePrice = 'todos';
    activeDay = 'todos';
    if (categorySelect) categorySelect.value = 'todas';
    document.getElementById('filterDistance').value = 'todas';
    document.getElementById('filterPrice').value = 'todos';
    document.getElementById('filterDay').value = 'todos';
    renderAll();
  });

  renderAll();

  if (window.location.hash === '#explorar') {
    document.getElementById('explorar').scrollIntoView();
  }
})();
