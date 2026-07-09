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
  if (!user || !user.onboarded) {
    window.location.href = 'onboarding.html';
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
      .map((k) => getFavorites().find((i) => i.title === k.child))
      .filter(Boolean);
  }
  function hashStr(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h;
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

  const kindLabel = { simple: 'Simple', paquete: 'Paquete' };
  const CATEGORY_LABELS = {
    naturaleza: 'Naturaleza', gastronomia: 'Gastronomía', relax: 'Relax', vidanocturna: 'Vida nocturna',
    cultura: 'Cultura', extremo: 'Extremo', playa: 'Playa', nieve: 'Nieve', shopping: 'Shopping',
    fotografia: 'Fotografía', musica: 'Música',
    pareja: 'En pareja', familia: 'En familia', amigos: 'Con amigos', trabajo: 'De trabajo', solo: 'Solo/a',
    general: 'Populares',
  };
  const DAY_LABELS = { semana: 'Entre semana', finde: 'Fin de semana o feriado' };
  const DIFFICULTY_LABELS = { suave: 'Suave', moderado: 'Moderado', extremo: 'Extremo' };
  const DIFFICULTY_ICONS = { suave: '🟢', moderado: '🟡', extremo: '🔴' };
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

  function cardHTML(item) {
    const whyBox = item.reason
      ? `<p class="pano-card__why">✨ <b>Por qué Beto lo eligió:</b> nos contaste que ${item.reason}.</p>`
      : `<p class="pano-card__why pano-card__why--general">🤖 Beto dice: uno de los panoramas más populares de Pickmap ahora mismo.</p>`;
    const difficulty = item.difficulty || 'suave';
    return `
      <article class="pano-card" data-title="${item.title}" tabindex="0" role="button" aria-haspopup="dialog">
        <div class="pano-card__photo pano-card__photo--${item.grad}">
          <span class="pano-card__emoji">${item.icon}</span>
          <span class="pano-card__tag">${item.meta}</span>
          <span class="pano-card__heart is-liked" data-title="${item.title}">♥</span>
          <span class="pano-card__badges">
            <span class="pano-card__kind pano-card__kind--${item.kind}">${kindLabel[item.kind]}</span>
            <span class="pano-card__difficulty pano-card__difficulty--${difficulty}" title="Nivel de exigencia física: ${DIFFICULTY_LABELS[difficulty]}">${DIFFICULTY_ICONS[difficulty]} ${DIFFICULTY_LABELS[difficulty]}</span>
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

  const grid = document.getElementById('favGrid');
  const empty = document.getElementById('favEmpty');

  function render() {
    const favorites = getFavorites();
    if (!favorites.length) {
      grid.hidden = true;
      empty.hidden = false;
      return;
    }
    grid.hidden = false;
    empty.hidden = true;
    grid.innerHTML = favorites.map((item) => cardHTML(item)).join('');
  }

  /* ---------- Detail modal ---------- */
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'pano-modal-overlay';
  modalOverlay.hidden = true;
  modalOverlay.innerHTML = `
    <div class="pano-modal" role="dialog" aria-modal="true" aria-labelledby="panoModalTitle">
      <button type="button" class="pano-modal__close" aria-label="Cerrar">✕</button>
      <div id="panoModalBody"></div>
    </div>
  `;
  document.body.appendChild(modalOverlay);
  const modalBody = modalOverlay.querySelector('#panoModalBody');
  let modalTitle = null;

  function nearbyHTML(item) {
    const pool = getFavorites().filter((i) => i.title !== item.title);
    const complementCategory = getComplementCategory(item.category);
    const byProximity = (a, b) => Math.abs(a.km - item.km) - Math.abs(b.km - item.km);
    const complements = pool.filter((i) => i.category === complementCategory).sort(byProximity);
    const rest = pool.filter((i) => i.category !== complementCategory).sort(byProximity);
    const nearby = [...complements, ...rest].slice(0, 3);
    if (!nearby.length) return '';
    return `
      <div class="pano-modal__nearby">
        <p class="pano-modal__nearby-title">Panoramas cerca de ahí</p>
        <div class="pano-modal__nearby-list">
          ${nearby.map((n) => {
            const dayLabel = DAY_LABELS[n.day] || 'Cualquier día';
            const nDifficulty = n.difficulty || 'suave';
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
              <div class="pano-modal__nearby-fact"><span>${DIFFICULTY_ICONS[nDifficulty]}</span><div><b>${DIFFICULTY_LABELS[nDifficulty]}</b><small>Nivel de exigencia física</small></div></div>
              <div class="pano-modal__nearby-fact"><span>🎒</span><div><b>${n.gear || 'Ropa cómoda'}</b><small>Vestimenta / equipamiento ideal</small></div></div>
            </div>
          `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function modalHTML(item) {
    const categoryLabel = CATEGORY_LABELS[item.category] || 'Popular';
    const dayLabel = DAY_LABELS[item.day] || 'Cualquier día';
    const difficulty = item.difficulty || 'suave';
    return `
      <div class="pano-modal__photo pano-modal__photo--${item.grad}">
        <span class="pano-modal__emoji">${item.icon}</span>
        <span class="pano-modal__badges">
          <span class="pano-modal__kind pano-modal__kind--${item.kind}">${kindLabel[item.kind]}</span>
          <span class="pano-card__difficulty pano-modal__difficulty pano-card__difficulty--${difficulty}" title="Nivel de exigencia física: ${DIFFICULTY_LABELS[difficulty]}">${DIFFICULTY_ICONS[difficulty]} ${DIFFICULTY_LABELS[difficulty]}</span>
        </span>
        <span class="pano-card__heart is-liked pano-modal__heart" data-title="${item.title}">♥</span>
      </div>
      <div class="pano-modal__content">
        <h2 class="pano-modal__title" id="panoModalTitle">${item.title}</h2>
        <p class="pano-modal__rating">⭐ ${item.rating} <span>(${item.reviews} reseñas)</span></p>
        <div class="pano-modal__facts">
          <div class="pano-modal__fact"><span>📍</span><div><b>${item.meta}</b><small>Ubicación / duración</small></div></div>
          <div class="pano-modal__fact"><span>🚗</span><div><b>${item.km} km</b><small>Distancia aprox.</small></div></div>
          <div class="pano-modal__fact"><span>📅</span><div><b>${dayLabel}</b><small>Cuándo</small></div></div>
          <div class="pano-modal__fact"><span>🏷️</span><div><b>${categoryLabel}</b><small>Tipo de experiencia</small></div></div>
          <div class="pano-modal__fact"><span>${DIFFICULTY_ICONS[difficulty]}</span><div><b>${DIFFICULTY_LABELS[difficulty]}</b><small>Nivel de exigencia física</small></div></div>
          <div class="pano-modal__fact"><span>🧭</span><div><b>${getZone(item.category)}</b><small>Zona / cómo llegar</small></div></div>
          <div class="pano-modal__fact pano-modal__fact--wide"><span>🎒</span><div><b>${item.gear || 'Ropa cómoda'}</b><small>Equipamiento / ropa ideal</small></div></div>
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
    modalTitle = item.title;
    currentModalItem = item;
    modalBody.innerHTML = modalHTML(item);
    modalOverlay.querySelector('.pano-modal').scrollTop = 0;
    modalOverlay.hidden = false;
    document.body.classList.add('pano-modal-open');
  }
  function closeModal() {
    modalOverlay.hidden = true;
    modalTitle = null;
    currentModalItem = null;
    document.body.classList.remove('pano-modal-open');
  }

  modalOverlay.querySelector('.pano-modal__close').addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

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

  const ACTIVITY_DURATION_MIN = 120;
  function minutesOf(slot) { const [h, m] = slot.split(':').map(Number); return h * 60 + m; }
  function travelBufferMinutes(km) { return Math.max(30, Math.round(km * 2)); }
  function addDaysToDate(ds, n) {
    const d = new Date(`${ds}T00:00:00`);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }

  // Auto-suggests a date/time per activity respecting each day's availability and
  // leaving enough travel buffer (scaled by distance) between same-day activities.
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
    let lastSlotEnd = mainSlot ? minutesOf(mainSlot) + ACTIVITY_DURATION_MIN : 0;

    addonItems.forEach((add, i) => {
      const idx = i + 1;
      const buffer = travelBufferMinutes(Math.abs(add.km - item.km));
      let placed = false;
      if (lastDate) {
        const sameDayAvail = SLOT_TIMES.filter((s) => isSlotAvailable(add.title, lastDate, s) && minutesOf(s) >= lastSlotEnd + buffer);
        if (sameDayAvail.length) {
          plan.push({ idx, title: add.title, date: lastDate, slot: sameDayAvail[0] });
          lastSlotEnd = minutesOf(sameDayAvail[0]) + ACTIVITY_DURATION_MIN;
          placed = true;
        }
      }
      if (!placed) {
        for (let attempt = 1; attempt < 30 && !placed; attempt++) {
          const ds = addDaysToDate(lastDate || todayStr, attempt);
          const avail = SLOT_TIMES.filter((s) => isSlotAvailable(add.title, ds, s));
          if (avail.length) {
            plan.push({ idx, title: add.title, date: ds, slot: avail[0] });
            lastDate = ds;
            lastSlotEnd = minutesOf(avail[0]) + ACTIVITY_DURATION_MIN;
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
    const itDifficulty = it.difficulty || 'suave';
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
            <div class="reserve-activity__fact"><span>${DIFFICULTY_ICONS[itDifficulty]}</span><div><b>${DIFFICULTY_LABELS[itDifficulty]}</b><small>Nivel de exigencia física</small></div></div>
            <div class="reserve-activity__fact"><span>🎒</span><div><b>${it.gear || 'Ropa cómoda'}</b><small>Equipamiento / ropa ideal</small></div></div>
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

  function schematicSvgHTML(entries) {
    if (entries.length < 2) return '';
    const width = 260;
    const height = 90;
    const marginX = 26;
    const marginY = 22;
    const kms = entries.map((e) => e.item.km);
    const minKm = Math.min(...kms);
    const spread = Math.max(...kms) - minKm;
    const pts = entries.map((e, i) => {
      const t = spread ? (e.item.km - minKm) / spread : (entries.length > 1 ? i / (entries.length - 1) : 0.5);
      const x = marginX + t * (width - marginX * 2);
      const y = marginY + ((hashStr(e.item.title) % 100) / 100) * (height - marginY * 2);
      return { x, y };
    });
    const linePoints = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const dots = pts.map((p, i) => `
      <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="11" fill="#F55E61" stroke="#fff" stroke-width="2"></circle>
      <text x="${p.x.toFixed(1)}" y="${(p.y + 4).toFixed(1)}" text-anchor="middle" font-size="11">${entries[i].item.icon}</text>
    `).join('');
    return `
      <svg class="reserve-map__svg" viewBox="0 0 ${width} ${height}" width="100%" height="${height}" preserveAspectRatio="xMidYMid meet">
        <polyline points="${linePoints}" fill="none" stroke="#F55E61" stroke-width="2" stroke-dasharray="5 5" opacity="0.6"></polyline>
        ${dots}
      </svg>
      <p class="reserve-map__svg-caption">Ruta esquemática (no a escala real)</p>
    `;
  }

  function mapHTML(item) {
    const groups = computeDayGroups(item);
    if (!groups.length) {
      return '<p class="reserve-map__empty">Elige fecha y horario en tus actividades para ver la ruta sugerida.</p>';
    }
    return `<p class="reserve-map__title">🗺️ Tu ruta</p>${groups.map((g) => {
      const [y, m, d] = g.date.split('-').map(Number);
      const dayLabel = `${d} de ${MONTH_LABELS[m - 1]}`;
      const path = g.entries.map((e, i) => {
        const stop = `
          <div class="reserve-map__stop">
            <span class="reserve-summary__icon reserve-summary__icon--${e.item.grad}">${e.item.icon}</span>
            <span class="reserve-map__stop-label"><b>${e.item.title}</b><small>${e.slot}</small></span>
          </div>`;
        if (i === 0) return stop;
        const r = routeBetween(g.entries[i - 1], e);
        return `<div class="reserve-map__route"><span>🚗 ${r.km} km · ~${r.mins} min</span></div>${stop}`;
      }).join('');
      const routes = g.entries.slice(1).map((e, i) => {
        const prev = g.entries[i];
        const r = routeBetween(prev, e);
        return `<li>De <b>${prev.item.title}</b> a <b>${e.item.title}</b>: ${r.km} km aprox. · ~${r.mins} min de traslado</li>`;
      }).join('');
      return `
        <div class="reserve-map__day">
          <p class="reserve-map__day-label">${dayLabel}</p>
          <div class="reserve-map__path">${path}</div>
          ${routes ? `<ul class="reserve-map__routes">${routes}</ul>` : ''}
          ${schematicSvgHTML(g.entries)}
        </div>
      `;
    }).join('')}`;
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
    modalTitle = null;
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
      if (feedback) { feedback.textContent = ' '; feedback.classList.remove('is-error'); }
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
      renderBreakdown();
      return;
    }
    if (e.target.id === 'reservePointsInput') {
      renderBreakdown();
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
      const item = getFavorites().find((f) => f.title === nearbyBtn.dataset.title);
      if (item) openModal(item);
      return;
    }
    const heart = e.target.closest('.pano-card__heart');
    if (heart) {
      const title = heart.dataset.title;
      saveFavorites(getFavorites().filter((f) => f.title !== title));
      if (title === modalTitle) closeModal();
      render();
      return;
    }
    const card = e.target.closest('.pano-card');
    if (!card) return;
    const item = getFavorites().find((f) => f.title === card.dataset.title);
    if (item) openModal(item);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('.pano-card');
    if (!card || modalOverlay.contains(card)) return;
    e.preventDefault();
    const item = getFavorites().find((f) => f.title === card.dataset.title);
    if (item) openModal(item);
  });

  render();
})();
