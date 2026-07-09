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
    const nearby = getFavorites()
      .filter((i) => i.title !== item.title)
      .sort((a, b) => Math.abs(a.km - item.km) - Math.abs(b.km - item.km))
      .slice(0, 3);
    if (!nearby.length) return '';
    return `
      <div class="pano-modal__nearby">
        <p class="pano-modal__nearby-title">Panoramas cerca de ahí</p>
        <div class="pano-modal__nearby-list">
          ${nearby.map((n) => {
            const dayLabel = DAY_LABELS[n.day] || 'Cualquier día';
            const nDifficulty = n.difficulty || 'suave';
            return `
            <div class="pano-modal__nearby-row">
              <button type="button" class="pano-modal__nearby-item" data-title="${n.title}">
                <span class="pano-modal__nearby-icon pano-modal__nearby-icon--${n.grad}">${n.icon}</span>
                <span class="pano-modal__nearby-info">
                  <b>${n.title}</b>
                  <small>${n.km} km · desde $${n.price}</small>
                </span>
              </button>
              <button type="button" class="pano-modal__nearby-toggle" aria-label="Ver más info" aria-expanded="false">+</button>
            </div>
            <div class="pano-modal__nearby-details" hidden>
              <div class="pano-modal__nearby-fact"><span>⭐</span><div><b>${n.rating} (${n.reviews} reseñas)</b><small>Calificación</small></div></div>
              <div class="pano-modal__nearby-fact"><span>📍</span><div><b>${getZone(n.category)}</b><small>Dirección aproximada</small></div></div>
              <div class="pano-modal__nearby-fact"><span>🚗</span><div><b>${n.km} km</b><small>Distancia desde tu ubicación</small></div></div>
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

  function openModal(item) {
    modalTitle = item.title;
    modalBody.innerHTML = modalHTML(item);
    modalOverlay.querySelector('.pano-modal').scrollTop = 0;
    modalOverlay.hidden = false;
    document.body.classList.add('pano-modal-open');
  }
  function closeModal() {
    modalOverlay.hidden = true;
    modalTitle = null;
    document.body.classList.remove('pano-modal-open');
  }

  modalOverlay.querySelector('.pano-modal__close').addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modalOverlay.hidden) closeModal();
  });

  document.addEventListener('click', (e) => {
    const toggleBtn = e.target.closest('.pano-modal__nearby-toggle');
    if (toggleBtn) {
      const details = toggleBtn.closest('.pano-modal__nearby-row').nextElementSibling;
      const expanded = details.hidden;
      details.hidden = !expanded;
      toggleBtn.textContent = expanded ? '−' : '+';
      toggleBtn.setAttribute('aria-expanded', String(expanded));
      return;
    }
    const nearbyBtn = e.target.closest('.pano-modal__nearby-item');
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
