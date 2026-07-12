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

  const POINTS_KEY = `pickmap_points_${user.email}`;
  const DEFAULT_POINTS = 1240;
  const POINT_VALUE = 10;
  function getPoints() {
    const raw = localStorage.getItem(POINTS_KEY);
    if (raw === null) { localStorage.setItem(POINTS_KEY, String(DEFAULT_POINTS)); return DEFAULT_POINTS; }
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : DEFAULT_POINTS;
  }
  function setPoints(n) { localStorage.setItem(POINTS_KEY, String(Math.max(0, n))); }

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
  function cleanRut(v) { return (v || '').replace(/[^0-9kK]/g, '').toUpperCase(); }
  function formatRut(v) {
    const clean = cleanRut(v);
    if (clean.length <= 1) return clean;
    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);
    let formatted = '';
    for (let i = 0; i < body.length; i++) {
      const posFromEnd = body.length - i;
      formatted += body[i];
      if (posFromEnd > 1 && (posFromEnd - 1) % 3 === 0) formatted += '.';
    }
    return `${formatted}-${dv}`;
  }
  function isValidRut(v) {
    const clean = cleanRut(v);
    if (clean.length < 2) return false;
    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);
    if (!/^\d+$/.test(body)) return false;
    let sum = 0;
    let mul = 2;
    for (let i = body.length - 1; i >= 0; i--) {
      sum += parseInt(body[i], 10) * mul;
      mul = mul === 7 ? 2 : mul + 1;
    }
    const res = 11 - (sum % 11);
    const expectedDv = res === 11 ? '0' : res === 10 ? 'K' : String(res);
    return dv === expectedDv;
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
  const ZONE_LANDMARKS = {
    naturaleza: ['Cajón del Maipo', 'San José de Maipo', 'El Ingenio, Cajón del Maipo'],
    extremo: ['Cajón del Maipo', 'San José de Maipo', 'El Ingenio, Cajón del Maipo'],
    nieve: ['Farellones', 'La Parva', 'Valle Nevado'],
    playa: ['Algarrobo', 'El Quisco', 'El Tabo'],
    relax: ['Termas de Colina', 'Valle de Colina'],
    gastronomia: ['Barrio Italia, Providencia', 'Av. Italia, Providencia', 'Condell, Providencia'],
    vidanocturna: ['Barrio Bellavista', 'Pío Nono, Providencia', 'Constitución, Providencia'],
    cultura: ['Barrio Lastarria', 'Villavicencio, Santiago', 'Merced, Santiago'],
    shopping: ['Providencia', 'Av. Providencia', 'Av. 11 de Septiembre, Providencia'],
    fotografia: ['Cerro San Cristóbal', 'Pedro de Valdivia Norte, Providencia'],
    musica: ["Parque O'Higgins", 'Matucana, Santiago'],
    pareja: ['Providencia', 'Manuel Montt, Providencia', 'Av. Providencia'],
    familia: ['La Reina', 'Príncipe de Gales, La Reina'],
    amigos: ['Ñuñoa', 'Plaza Ñuñoa', 'Irarrázaval, Ñuñoa'],
    trabajo: ['Las Condes', 'Apoquindo, Las Condes', 'El Golf, Las Condes'],
    solo: ['San José de Maipo', 'El Ingenio, Cajón del Maipo'],
    general: ['Santiago Centro', 'Providencia'],
  };
  function getZoneLandmark(item) {
    const pool = ZONE_LANDMARKS[item.category] || ZONE_LANDMARKS.general;
    return pool[hashStr(item.title) % pool.length];
  }
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

  // Beto also weighs the finer preferences from onboarding (exigencia física,
  // presupuesto, distancia y día) to bubble the closest matches to the top.
  const difficultyPrefs = user.difficulty || [];
  const budgetPrefs = user.budget || [];
  const distancePrefs = user.travelDistance || [];
  const dayPrefs = user.preferredDay || [];
  if (difficultyPrefs.length || budgetPrefs.length || distancePrefs.length || dayPrefs.length) {
    function matchScore(item) {
      let score = 0;
      if (difficultyPrefs.includes(item.difficulty)) score++;
      if (budgetPrefs.includes(priceBucket(item.priceNum))) score++;
      if (distancePrefs.includes(distanceBucket(item.km))) score++;
      if (dayPrefs.includes(item.day) || dayPrefs.includes('cualquiera')) score++;
      return score;
    }
    recommended = recommended
      .map((item, idx) => ({ item, idx, score: matchScore(item) }))
      .sort((a, b) => b.score - a.score || parseFloat(b.item.rating) - parseFloat(a.item.rating) || a.idx - b.idx)
      .map((x) => x.item);
  }

  // General catalog: everything, deduplicated, generic Beto blurb instead of a personal one.
  const seenTitles = new Set();
  const general = CATALOG.filter((i) => {
    if (seenTitles.has(i.title)) return false;
    seenTitles.add(i.title);
    return true;
  }).map((i) => ({ ...i, reason: null }));

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

  const SLOT_TIMES = ['09:00', '11:00', '13:00', '15:00', '17:00'];
  const WEEKDAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const MONTH_LABELS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  function isSlotAvailable(title, date, slot) {
    return hashStr(`${title}|${date}|${slot}`) % 5 !== 0;
  }

  function pad2(n) { return String(n).padStart(2, '0'); }
  function toDateStr(y, m, d) { return `${y}-${pad2(m + 1)}-${pad2(d)}`; }

  function dayAvailability(title, ds) {
    const availableCount = SLOT_TIMES.filter((s) => isSlotAvailable(title, ds, s)).length;
    if (availableCount === 0) return 'full';
    if (availableCount <= 2) return 'low';
    return 'open';
  }

  // Renders the time-slot row + availability note for a given activity title/date.
  function scheduleSlotsHTML(title, ds) {
    if (!ds) return '<p class="reserve-calendar__hint">Elige un día para ver los horarios disponibles.</p>';
    const availability = SLOT_TIMES.map((s) => ({ slot: s, available: isSlotAvailable(title, ds, s) }));
    const firstAvailable = availability.find((a) => a.available);
    const availableCount = availability.filter((a) => a.available).length;
    const slotBtns = availability.map((a) => `<button type="button" class="reserve-slot${firstAvailable && a.slot === firstAvailable.slot ? ' is-selected' : ''}${a.available ? '' : ' is-unavailable'}" data-slot="${a.slot}"${a.available ? '' : ' disabled'}>${a.slot}</button>`).join('');
    const note = availableCount === 0
      ? '<p class="reserve-activity__avail-note is-error">❌ Sin cupos disponibles ese día. Elige otra fecha.</p>'
      : availableCount <= 2
        ? `<p class="reserve-activity__avail-note is-warn">⚠️ Quedan pocos horarios disponibles (${availableCount}).</p>`
        : '<p class="reserve-activity__avail-note is-ok">✅ Buena disponibilidad para esta fecha.</p>';
    return `<div class="reserve-slots reserve-activity__slots">${slotBtns}</div>${note}`;
  }

  function calendarDaysHTML(title, year, month, selectedDate) {
    const first = new Date(year, month, 1);
    const startWeekday = (first.getDay() + 6) % 7;
    const totalDays = new Date(year, month + 1, 0).getDate();
    const todayStr = new Date().toISOString().slice(0, 10);
    let cells = '';
    for (let i = 0; i < startWeekday; i++) cells += '<span class="reserve-calendar__day reserve-calendar__day--empty"></span>';
    for (let d = 1; d <= totalDays; d++) {
      const ds = toDateStr(year, month, d);
      const isPast = ds < todayStr;
      const avail = dayAvailability(title, ds);
      const isSelected = ds === selectedDate;
      cells += `<button type="button" class="reserve-calendar__day reserve-calendar__day--${avail}${isSelected ? ' is-selected' : ''}" data-date="${ds}"${isPast ? ' disabled' : ''}>${d}</button>`;
    }
    return cells;
  }

  function calendarHTML(title, year, month, selectedDate) {
    return `
      <div class="reserve-calendar" data-title="${title}" data-year="${year}" data-month="${month}">
        <div class="reserve-calendar__head">
          <button type="button" class="reserve-calendar__nav" data-dir="-1" aria-label="Mes anterior">‹</button>
          <span class="reserve-calendar__month-label">${MONTH_LABELS[month]} ${year}</span>
          <button type="button" class="reserve-calendar__nav" data-dir="1" aria-label="Mes siguiente">›</button>
        </div>
        <div class="reserve-calendar__weekdays">${WEEKDAY_LABELS.map((w) => `<span>${w}</span>`).join('')}</div>
        <div class="reserve-calendar__days">${calendarDaysHTML(title, year, month, selectedDate)}</div>
        <input type="hidden" class="reserve-activity__date" value="${selectedDate || ''}">
        <div class="reserve-calendar__slots-wrap">${scheduleSlotsHTML(title, selectedDate)}</div>
      </div>
    `;
  }

  function minutesOf(slot) { const [h, m] = slot.split(':').map(Number); return h * 60 + m; }
  function travelBufferMinutes(km) { return Math.max(30, Math.round(km * 2)); }
  function addDaysToDate(ds, n) {
    const d = new Date(`${ds}T00:00:00`);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }

  // Some activities are naturally an evening/overnight add-on (best scheduled
  // late in the day, same day as something else), others quietly eat the whole day.
  function isOvernightActivity(it) {
    return /alojamiento|hospedaje|noche/i.test(`${it.title} ${it.meta}`);
  }
  function estimateDurationMinutes(it) {
    const meta = (it.meta || '').toLowerCase();
    if (isOvernightActivity(it)) return 240;
    if (meta.includes('fin de semana') || meta.includes('2 días')) return 60 * 24 * 2;
    if (meta.includes('paquete de un día')) return 480;
    if (meta.includes('medio día')) return 240;
    if (it.category === 'relax') return 600;
    return 120;
  }

  // Auto-suggests a date/time per activity respecting each day's availability,
  // each activity's estimated duration, and a travel buffer scaled by distance.
  function autoPlanSchedule(item) {
    const addonItems = getAddonItemsFor(item.title);
    const todayStr = new Date().toISOString().slice(0, 10);
    const plan = [];

    let mainDate = null;
    let mainSlot = null;
    for (let attempt = 0; attempt < 30 && !mainDate; attempt++) {
      const ds = addDaysToDate(todayStr, attempt);
      const avail = SLOT_TIMES.filter((s) => isSlotAvailable(item.title, ds, s));
      if (avail.length) { mainDate = ds; mainSlot = avail[0]; }
    }
    plan.push({ idx: 0, title: item.title, date: mainDate, slot: mainSlot });
    let lastDate = mainDate;
    let lastSlotEnd = mainSlot ? minutesOf(mainSlot) + estimateDurationMinutes(item) : 0;

    addonItems.forEach((add, i) => {
      const idx = i + 1;
      const buffer = travelBufferMinutes(Math.abs(add.km - item.km));
      const duration = estimateDurationMinutes(add);
      const overnight = isOvernightActivity(add);
      let placed = false;
      if (lastDate) {
        let sameDayAvail = SLOT_TIMES.filter((s) => isSlotAvailable(add.title, lastDate, s) && minutesOf(s) >= lastSlotEnd + buffer);
        if (overnight) sameDayAvail = sameDayAvail.slice().reverse();
        if (sameDayAvail.length) {
          plan.push({ idx, title: add.title, date: lastDate, slot: sameDayAvail[0] });
          lastSlotEnd = minutesOf(sameDayAvail[0]) + duration;
          placed = true;
        }
      }
      if (!placed) {
        for (let attempt = 1; attempt < 30 && !placed; attempt++) {
          const ds = addDaysToDate(lastDate || todayStr, attempt);
          let avail = SLOT_TIMES.filter((s) => isSlotAvailable(add.title, ds, s));
          if (overnight) avail = avail.slice().reverse();
          if (avail.length) {
            plan.push({ idx, title: add.title, date: ds, slot: avail[0] });
            lastDate = ds;
            lastSlotEnd = minutesOf(avail[0]) + duration;
            placed = true;
          }
        }
      }
    });
    return plan;
  }

  function formatWhen(ds, slot) {
    if (!ds) return null;
    const [y, m, d] = ds.split('-').map(Number);
    return `📅 ${d} de ${MONTH_LABELS[m - 1]} · ${slot}`;
  }

  function updateActivityWhenLabel(el) {
    if (!el) return;
    const whenEl = el.querySelector('.reserve-activity__when');
    if (!whenEl) return;
    const dateVal = el.querySelector('.reserve-activity__date').value;
    const slotBtn = el.querySelector('.reserve-slot.is-selected');
    if (dateVal) {
      whenEl.textContent = formatWhen(dateVal, slotBtn ? slotBtn.dataset.slot : '');
      whenEl.classList.add('is-set');
    } else {
      whenEl.textContent = 'Sin fecha asignada aún';
      whenEl.classList.remove('is-set');
    }
  }

  function applyAutoPlan(item) {
    const plan = autoPlanSchedule(item);
    const activityEls = Array.from(reserveModalBody.querySelectorAll('.reserve-activity'));
    plan.forEach((p) => {
      const el = activityEls[p.idx];
      if (!el || !p.date) return;
      const [y, m] = p.date.split('-').map(Number);
      const oldCalEl = el.querySelector('.reserve-calendar');
      oldCalEl.outerHTML = calendarHTML(p.title, y, m - 1, p.date);
      const newCalEl = el.querySelector('.reserve-calendar');
      if (p.slot) {
        const slotBtn = newCalEl.querySelector(`.reserve-slot[data-slot="${p.slot}"]`);
        if (slotBtn && !slotBtn.disabled) {
          newCalEl.querySelectorAll('.reserve-slot').forEach((b) => b.classList.remove('is-selected'));
          slotBtn.classList.add('is-selected');
        }
      }
      updateActivityWhenLabel(el);
    });
    renderBreakdown();
  }

  function activityRowHTML(it, idx, mainItem) {
    const isMain = idx === 0;
    const distFromMain = isMain ? it.km : Math.abs(it.km - mainItem.km);
    const today = new Date();
    return `
      <div class="reserve-activity" data-index="${idx}" data-title="${it.title}">
        <div class="reserve-activity__row">
          <span class="reserve-summary__icon reserve-summary__icon--${it.grad}">${it.icon}</span>
          <div class="reserve-summary__info">
            <b>${it.title}</b>
            <small>${isMain ? it.meta : 'Complemento agregado'}</small>
            <small class="reserve-activity__when">Sin fecha asignada aún</small>
          </div>
          <button type="button" class="reserve-activity__toggle" aria-expanded="false" aria-label="Ajustar fecha y horario"><span class="pano-modal__nearby-chevron">⌄</span></button>
        </div>
        <div class="reserve-activity__details" hidden>
          <div class="reserve-activity__facts">
            <div class="reserve-activity__fact"><span>⭐</span><div><b>${it.rating} (${it.reviews})</b><small>Calificación</small></div></div>
            <div class="reserve-activity__fact"><span>📍</span><div><b>${getZone(it.category)}</b><small>Dirección aproximada</small></div></div>
            <div class="reserve-activity__fact"><span>🚗</span><div><b>${distFromMain} km</b><small>${isMain ? 'Distancia aprox.' : 'Distancia desde la actividad principal'}</small></div></div>
            <div class="reserve-activity__fact"><span>🧭</span><div><b>${getArrival(it.category)}</b><small>Cómo llegar</small></div></div>
            <div class="reserve-activity__fact"><span>${DIFFICULTY_ICONS[it.difficulty]}</span><div><b>${DIFFICULTY_LABELS[it.difficulty]}</b><small>Nivel de exigencia física</small></div></div>
            <div class="reserve-activity__fact"><span>🎒</span><div><b>${it.gear}</b><small>Equipamiento / ropa ideal</small></div></div>
          </div>
          <div class="reserve-activity__schedule">
            ${calendarHTML(it.title, today.getFullYear(), today.getMonth(), null)}
          </div>
        </div>
      </div>
    `;
  }

  function reserveModalHTML(item) {
    const addonItems = getAddonItemsFor(item.title);
    const allItems = [item, ...addonItems];
    return `
      <h2 class="reserve-modal__title" id="reserveModalTitle">Resumen de tu reserva</h2>
      <form id="reserveForm" class="reserve-form" novalidate>
        <div class="reserve-step" id="reserveStep1">
          <p class="reserve-plan-note">🤖 Beto armó este plan según disponibilidad y distancia entre actividades. Toca <span class="reserve-plan-note__chevron">⌄</span> en cada actividad para ajustarla. <button type="button" class="reserve-plan-note__regen" id="reserveAutoPlanBtn">Generar otro plan</button></p>
          <div class="reserve-activities">
            ${allItems.map((it, idx) => activityRowHTML(it, idx, item)).join('')}
          </div>
          <div class="reserve-map" id="reserveMap"></div>
          <div class="reserve-breakdown" id="reserveBreakdown"></div>
          <div class="reserve-points" id="reservePoints">
            <div class="reserve-points__head">
              <span>💎 Pick Points disponibles</span>
              <b id="reservePointsAvailable">0</b>
            </div>
            <label class="reserve-field">
              <span>¿Cuántos quieres canjear? <small>(1 punto = $10)</small></span>
              <input type="number" id="reservePointsInput" min="0" step="10" value="0">
            </label>
            <div class="reserve-points__summary">
              <div class="reserve-points__row"><span>Descuento por Pick Points</span><b id="reservePointsDiscount">-$0</b></div>
              <div class="reserve-points__row reserve-points__row--total"><span>Total a pagar</span><b id="reservePointsFinalTotal">$0</b></div>
              <div class="reserve-points__row"><span>Saldo después de esta reserva</span><b id="reservePointsNewBalance">0</b></div>
            </div>
          </div>
          <label class="reserve-field">
            <span>Número de personas</span>
            <input type="number" name="people" min="1" value="1" required>
          </label>
          <p class="reserve-form__feedback" id="reserveStep1Feedback">&nbsp;</p>
          <button type="button" class="btn btn--primary reserve-step__next" id="reserveNextBtn">Avanzar a los datos del viajero →</button>
        </div>
        <div class="reserve-step" id="reserveStep2" hidden>
          <button type="button" class="reserve-step__back" id="reserveBackBtn">← Volver al plan</button>
          <div id="reservePassengers" class="reserve-passengers"></div>
          <p class="reserve-form__section-title">Datos de contacto</p>
          <label class="reserve-field">
            <span>Nombre completo</span>
            <input type="text" name="name" value="${user.name || ''}" required>
          </label>
          <label class="reserve-field">
            <span>RUT</span>
            <input type="text" name="rut" id="reserveContactRut" value="${user.rut || ''}" placeholder="12.345.678-9" required>
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
        </div>
      </form>
    `;
  }

  function reserveSuccessHTML(item, data) {
    const code = `PM-${(hashStr(item.title + data.schedule.map((s) => s.date + s.slot).join('')) % 900000 + 100000)}`;
    const firstName = (data.name || '').trim().split(' ')[0] || 'viajero';
    return `
      <div class="reserve-success">
        <span class="reserve-success__icon">🎉</span>
        <h2 class="reserve-modal__title">¡Todo listo, ${firstName}!</h2>
        <p class="reserve-success__sub">Tu aventura con Pickmap ya quedó confirmada. Te enviamos todos los detalles a <b>${data.email}</b> 💌</p>
        <div class="reserve-success__card">
          <div class="reserve-success__row reserve-success__row--code"><span>🎫 Código de reserva</span><b>${code}</b></div>
          ${data.schedule.map((s) => `<div class="reserve-success__row"><span>${s.icon || '📍'} ${s.title}</span><b>${s.date} · ${s.slot}</b></div>`).join('')}
          <div class="reserve-success__row"><span>👥 Pasajeros</span><b>${data.passengers.join(', ')}</b></div>
          ${data.redeemed > 0 ? `
          <div class="reserve-success__row"><span>💎 Pick Points canjeados</span><b>${data.redeemed.toLocaleString('es-CL')} (-$${data.discount.toLocaleString('es-CL')})</b></div>
          <div class="reserve-success__row"><span>💎 Nuevo saldo Pick Points</span><b>${data.newBalance.toLocaleString('es-CL')}</b></div>` : ''}
          <div class="reserve-success__row"><span>💰 Total pagado</span><b>$${data.total.toLocaleString('es-CL')}</b></div>
        </div>
        <p class="reserve-success__note">¡Que lo disfrutes muchísimo! Beto ya te está preparando la mejor experiencia 🌟🧳</p>
        <button type="button" class="btn btn--primary reserve-success__close">Listo</button>
      </div>
    `;
  }

  // An activity only counts toward the total once it has a date picked;
  // an added complement left without a date is treated as no longer wanted.
  function includedActivityIndexes(allItems, activityEls) {
    return allItems
      .map((it, idx) => idx)
      .filter((idx) => {
        if (idx === 0) return true;
        const dateInput = activityEls[idx] && activityEls[idx].querySelector('.reserve-activity__date');
        return !!(dateInput && dateInput.value);
      });
  }

  function computeDayGroups(item) {
    const addonItems = getAddonItemsFor(item.title);
    const allItems = [item, ...addonItems];
    const activityEls = Array.from(reserveModalBody.querySelectorAll('.reserve-activity'));
    const entries = includedActivityIndexes(allItems, activityEls).map((idx) => {
      const el = activityEls[idx];
      const dateInput = el.querySelector('.reserve-activity__date');
      const slotBtn = el.querySelector('.reserve-slot.is-selected');
      return { item: allItems[idx], date: dateInput.value, slot: slotBtn ? slotBtn.dataset.slot : null };
    }).filter((e) => e.date && e.slot);
    const byDate = {};
    entries.forEach((e) => { (byDate[e.date] = byDate[e.date] || []).push(e); });
    const dates = Object.keys(byDate).sort();
    dates.forEach((d) => byDate[d].sort((a, b) => minutesOf(a.slot) - minutesOf(b.slot)));
    return dates.map((d) => ({ date: d, entries: byDate[d] }));
  }

  function routeBetween(a, b) {
    const km = Math.abs(a.item.km - b.item.km);
    return { km, mins: travelBufferMinutes(km) };
  }

  // Google's key-less embed only reliably draws a single origin→destination
  // route (multi-stop "+to:" waypoints get dropped in the embedded view), so
  // every consecutive leg gets its own small, real, connected map.
  function legEmbedHTML(a, b) {
    const saddr = encodeURIComponent(`${getZoneLandmark(a.item)}, Santiago, Chile`);
    const daddr = encodeURIComponent(`${getZoneLandmark(b.item)}, Santiago, Chile`);
    const url = `https://www.google.com/maps?saddr=${saddr}&daddr=${daddr}&output=embed`;
    return `
      <div class="reserve-map__embed-leg">
        <p class="reserve-map__embed-leg-label">${a.item.icon} ${a.item.title} → ${b.item.icon} ${b.item.title}</p>
        <div class="reserve-map__embed">
          <iframe src="${url}" width="100%" height="180" style="border:0" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Ruta de ${a.item.title} a ${b.item.title}"></iframe>
        </div>
      </div>
    `;
  }

  function mapsEmbedHTML(entries) {
    if (entries.length < 2) return '';
    const legs = entries.slice(1).map((e, i) => legEmbedHTML(entries[i], e)).join('');
    return `${legs}<p class="reserve-map__embed-caption">📍 Vista referencial en Google Maps entre las zonas de tus actividades</p>`;
  }

  function mapHTML(item) {
    const groups = computeDayGroups(item);
    const entries = groups.reduce((acc, g) => acc.concat(g.entries), []);
    if (!entries.length) {
      return '<p class="reserve-map__empty">Elige fecha y horario en tus actividades para ver la ruta sugerida.</p>';
    }
    const path = entries.map((e, i) => {
      const [y, m, d] = e.date.split('-').map(Number);
      const dateLabel = `${d} de ${MONTH_LABELS[m - 1]}`;
      const stop = `
        <div class="reserve-map__stop">
          <small class="reserve-map__stop-date">${dateLabel}</small>
          <span class="reserve-summary__icon reserve-summary__icon--${e.item.grad}">${e.item.icon}</span>
          <span class="reserve-map__stop-label"><b>${e.item.title}</b><small>${e.slot}</small></span>
        </div>`;
      if (i === 0) return stop;
      const r = routeBetween(entries[i - 1], e);
      return `<div class="reserve-map__route"><span class="reserve-map__route-chip"><span>🚗 ${r.km} km</span><span>~${r.mins} min</span></span></div>${stop}`;
    }).join('');
    const routes = entries.slice(1).map((e, i) => {
      const prev = entries[i];
      const r = routeBetween(prev, e);
      return `<li>De <b>${prev.item.title}</b> a <b>${e.item.title}</b>: ${r.km} km aprox. · ~${r.mins} min de traslado</li>`;
    }).join('');
    return `
      <p class="reserve-map__title">🗺️ Tu ruta</p>
      <div class="reserve-map__day">
        <div class="reserve-map__path">${path}</div>
        ${routes ? `<ul class="reserve-map__routes">${routes}</ul>` : ''}
        ${mapsEmbedHTML(entries)}
      </div>
    `;
  }

  function renderBreakdown() {
    if (!currentModalItem) return;
    const mapEl = reserveModalBody.querySelector('#reserveMap');
    if (mapEl) mapEl.innerHTML = mapHTML(currentModalItem);
    const addonItems = getAddonItemsFor(currentModalItem.title);
    const allItems = [currentModalItem, ...addonItems];
    const activityEls = Array.from(reserveModalBody.querySelectorAll('.reserve-activity'));
    const includedItems = includedActivityIndexes(allItems, activityEls).map((idx) => allItems[idx]);
    const peopleInput = reserveModalBody.querySelector('input[name="people"]');
    const people = Math.max(1, parseInt(peopleInput && peopleInput.value, 10) || 1);
    const subtotal = includedItems.reduce((sum, it) => sum + it.priceNum, 0) * people;

    const breakdownEl = reserveModalBody.querySelector('#reserveBreakdown');
    if (breakdownEl) {
      breakdownEl.innerHTML = `
        ${includedItems.map((it) => `<div class="reserve-breakdown__row"><span>${it.title}</span><span>$${(it.priceNum * people).toLocaleString('es-CL')}</span></div>`).join('')}
        <div class="reserve-breakdown__total">
          <span>Subtotal${includedItems.length > 1 ? ` · ${includedItems.length} experiencias` : ''}${people > 1 ? ` · ${people} personas` : ''}</span>
          <b>$${subtotal.toLocaleString('es-CL')}</b>
        </div>
      `;
    }

    const pointsAvailable = getPoints();
    const pointsInput = reserveModalBody.querySelector('#reservePointsInput');
    const maxRedeemable = Math.max(0, Math.min(pointsAvailable, Math.floor(subtotal / POINT_VALUE)));
    let redeemed = Math.max(0, parseInt(pointsInput && pointsInput.value, 10) || 0);
    if (redeemed > maxRedeemable) redeemed = maxRedeemable;
    if (pointsInput) {
      pointsInput.max = String(maxRedeemable);
      if (parseInt(pointsInput.value, 10) !== redeemed) pointsInput.value = redeemed;
    }
    const discount = redeemed * POINT_VALUE;
    const finalTotal = Math.max(0, subtotal - discount);
    const pointsEl = reserveModalBody.querySelector('#reservePoints');
    if (pointsEl) {
      pointsEl.querySelector('#reservePointsAvailable').textContent = pointsAvailable.toLocaleString('es-CL');
      pointsEl.querySelector('#reservePointsDiscount').textContent = `-$${discount.toLocaleString('es-CL')}`;
      pointsEl.querySelector('#reservePointsFinalTotal').textContent = `$${finalTotal.toLocaleString('es-CL')}`;
      pointsEl.querySelector('#reservePointsNewBalance').textContent = (pointsAvailable - redeemed).toLocaleString('es-CL');
    }
  }

  function openReserveModal(item) {
    reserveModalBody.innerHTML = reserveModalHTML(item);
    applyAutoPlan(item);
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

  function showReserveStep(step) {
    const step1 = reserveModalBody.querySelector('#reserveStep1');
    const step2 = reserveModalBody.querySelector('#reserveStep2');
    if (!step1 || !step2) return;
    step1.hidden = step !== 1;
    step2.hidden = step !== 2;
    reserveModalOverlay.querySelector('.reserve-modal').scrollTop = 0;
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
    if (e.target.closest('#reserveAutoPlanBtn')) {
      if (!currentModalItem) return;
      applyAutoPlan(currentModalItem);
      reserveModalBody.querySelectorAll('.reserve-activity').forEach((el) => {
        const details = el.querySelector('.reserve-activity__details');
        const toggle = el.querySelector('.reserve-activity__toggle');
        details.hidden = false;
        if (toggle) toggle.setAttribute('aria-expanded', 'true');
      });
      return;
    }
    if (e.target.closest('#reserveNextBtn')) {
      const activityEls = Array.from(reserveModalBody.querySelectorAll('.reserve-activity'));
      const mainDateInput = activityEls[0] && activityEls[0].querySelector('.reserve-activity__date');
      const feedback = document.getElementById('reserveStep1Feedback');
      if (!mainDateInput || !mainDateInput.value) {
        if (feedback) { feedback.textContent = 'Elige fecha y horario para la actividad principal antes de continuar.'; feedback.classList.add('is-error'); }
        return;
      }
      if (feedback) { feedback.textContent = ' '; feedback.classList.remove('is-error'); }
      renderPassengerFields(reserveModalBody.querySelector('input[name="people"]'));
      showReserveStep(2);
      return;
    }
    if (e.target.closest('#reserveBackBtn')) {
      showReserveStep(1);
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
      updateActivityWhenLabel(slotBtn.closest('.reserve-activity'));
      renderBreakdown();
      return;
    }
    const calNav = e.target.closest('.reserve-calendar__nav');
    if (calNav) {
      const calEl = calNav.closest('.reserve-calendar');
      const title = calEl.dataset.title;
      let year = parseInt(calEl.dataset.year, 10);
      let month = parseInt(calEl.dataset.month, 10) + parseInt(calNav.dataset.dir, 10);
      if (month < 0) { month = 11; year -= 1; }
      if (month > 11) { month = 0; year += 1; }
      const selectedDate = calEl.querySelector('.reserve-activity__date').value || null;
      calEl.outerHTML = calendarHTML(title, year, month, selectedDate);
      return;
    }
    const calDay = e.target.closest('.reserve-calendar__day');
    if (calDay && !calDay.disabled && calDay.dataset.date) {
      const calEl = calDay.closest('.reserve-calendar');
      calEl.querySelectorAll('.reserve-calendar__day').forEach((d) => d.classList.remove('is-selected'));
      calDay.classList.add('is-selected');
      calEl.querySelector('.reserve-activity__date').value = calDay.dataset.date;
      calEl.querySelector('.reserve-calendar__slots-wrap').innerHTML = scheduleSlotsHTML(calEl.dataset.title, calDay.dataset.date);
      updateActivityWhenLabel(calEl.closest('.reserve-activity'));
      renderBreakdown();
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
    const prevNames = Array.from(container.querySelectorAll('.reserve-passenger-name')).map((i) => i.value);
    const prevRuts = Array.from(container.querySelectorAll('.reserve-passenger-rut')).map((i) => i.value);
    let html = '';
    for (let i = 2; i <= count; i++) {
      html += `
        <label class="reserve-field"><span>Nombre pasajero ${i}</span><input type="text" class="reserve-passenger-name" value="${prevNames[i - 2] || ''}" required></label>
        <label class="reserve-field"><span>RUT pasajero ${i}</span><input type="text" class="reserve-passenger-rut" value="${prevRuts[i - 2] || ''}" placeholder="12.345.678-9" required></label>
      `;
    }
    container.innerHTML = html;
  }

  document.addEventListener('input', (e) => {
    if (e.target.name === 'people' && e.target.closest('#reserveForm')) {
      renderPassengerFields(e.target);
      renderBreakdown();
      return;
    }
    if (e.target.id === 'reservePointsInput') {
      renderBreakdown();
    }
  });

  document.addEventListener('focusout', (e) => {
    if (e.target.id === 'reserveContactRut' || e.target.classList.contains('reserve-passenger-rut')) {
      if (e.target.value.trim()) e.target.value = formatRut(e.target.value);
    }
  });

  document.addEventListener('submit', (e) => {
    if (e.target.id !== 'reserveForm' || !currentModalItem) return;
    e.preventDefault();
    const form = e.target;
    const people = parseInt(form.people.value, 10) || 1;
    const name = form.name.value.trim();
    const rut = formatRut(form.rut.value);
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
    const passengerRuts = Array.from(form.querySelectorAll('.reserve-passenger-rut')).map((i) => formatRut(i.value));

    if (!mainDate || !name || !emailVal || passengerNames.some((n) => !n)) {
      feedback.textContent = 'Completa la fecha de la actividad principal, tus datos de contacto y el nombre de cada pasajero.';
      feedback.classList.add('is-error');
      return;
    }
    if (!isValidRut(rut) || passengerRuts.some((r) => !isValidRut(r))) {
      feedback.textContent = 'Revisa el RUT del contacto y el de cada pasajero — alguno no es válido.';
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

    const includedIdx = includedActivityIndexes(allItems, activityEls);
    const includedItems = includedIdx.map((idx) => allItems[idx]);
    const schedule = includedIdx.map((idx) => {
      const el = activityEls[idx];
      const dateInput = el.querySelector('.reserve-activity__date');
      const slotBtn = el.querySelector('.reserve-slot.is-selected');
      return {
        title: allItems[idx].title,
        icon: allItems[idx].icon,
        date: dateInput.value,
        slot: (slotBtn && slotBtn.dataset.slot) || '09:00',
      };
    });

    const subtotal = includedItems.reduce((sum, it) => sum + it.priceNum, 0) * people;
    const pointsAvailable = getPoints();
    const pointsInput = document.getElementById('reservePointsInput');
    const maxRedeemable = Math.max(0, Math.min(pointsAvailable, Math.floor(subtotal / POINT_VALUE)));
    const redeemed = Math.min(maxRedeemable, Math.max(0, parseInt(pointsInput && pointsInput.value, 10) || 0));
    const discount = redeemed * POINT_VALUE;
    const total = Math.max(0, subtotal - discount);
    const newBalance = pointsAvailable - redeemed;
    setPoints(newBalance);

    const passengers = [name, ...passengerNames];
    const data = { schedule, people, name, email: emailVal, phone, total, passengers, redeemed, discount, newBalance };
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
