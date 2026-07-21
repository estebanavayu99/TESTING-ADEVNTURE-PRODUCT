/* Pickmap — reseñas reales del viajero (pickpoints.html)
 *
 * Instrucción explícita del usuario (2026-07-20): construir un formulario
 * real donde el viajero pueda dejar una reseña (antes no existía ninguno —
 * lo que se veía en negocio-resenas.html era 100% data demo). Lee
 * `pickmap_traveler_reservations_<email>` (persistida por js/panoramas.js
 * al reservar, ver `persistRealBusinessReservations`) y muestra las que
 * todavía no tienen reseña. Al enviar una reseña real:
 *   1. Se marca reviewed:true en el historial del viajero.
 *   2. Si la reserva está vinculada a un negocio real (businessEmail), se
 *      agrega la reseña a `pickmap_business_reviews_<businessEmail>` —
 *      la MISMA key que lee js/negocio.js, así el negocio la ve en su
 *      panel real, mezclada con su historial demo.
 *   3. Se disparan los correos reales vía /api/send-notification:
 *      `cliente-dejo-resena` (al negocio, siempre), `resena-negativa`
 *      (al negocio, solo si la calificación es 1-2 estrellas — alerta
 *      prioritaria) y `nueva-resena-owner` (a contacto@pickmap.cl,
 *      siempre — instrucción explícita del usuario de enterarse de cada
 *      reseña nueva, no solo el negocio).
 *   4. Suma +15 Pick Points (mismo valor que ya prometía la lista de
 *      "Formas de ganar Pick Points" en esta misma página).
 */
(() => {
  const SESSION_KEY = 'pickmap_current_user';
  const USERS_KEY = 'pickmap_users';
  const OWNER_EMAIL = 'contacto@pickmap.cl';

  const email = localStorage.getItem(SESSION_KEY);
  if (!email) return; // js/dashboard.js ya redirige a login.html si no hay sesión
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  const user = users.find((u) => u.email === email);
  if (!user) return;

  const TRAVELER_KEY = `pickmap_traveler_reservations_${email}`;
  function getTravelerReservations() {
    try { return JSON.parse(localStorage.getItem(TRAVELER_KEY)) || []; } catch { return []; }
  }
  function saveTravelerReservations(list) { localStorage.setItem(TRAVELER_KEY, JSON.stringify(list)); }

  // Cuenta demo genérica de viajero (instrucción explícita del usuario,
  // 2026-07-21: "quiero poder ver TODO lo que ellos ven... agrégale un
  // historial al viajero"). Esta cuenta se crea directo por SQL para
  // probar el panel de super admin, así que nunca reservó nada de verdad
  // — sin esto, el historial le saldría vacío por más que la función ya
  // exista. Solo aplica a este correo puntual, nunca a un viajero real
  // (mismo criterio que ADMIN_EMAIL/OWNER_NOTIFICATION_EMAIL hardcodeados
  // en otros archivos: no se fabrica historial para nadie más).
  const DEMO_TRAVELER_EMAIL = 'viajero.demo@pickmap.cl';
  function seedDemoHistoryIfNeeded() {
    if (email !== DEMO_TRAVELER_EMAIL) return;
    if (getTravelerReservations().length) return;
    const now = Date.now();
    const day = 86400000;
    saveTravelerReservations([
      {
        id: 'demo-1', title: 'Cabaña + tinaja caliente (2 noches)', icon: '🏕️',
        businessEmail: 'negocio.demo@pickmap.cl', businessName: 'Negocio Demo',
        fecha: new Date(now - 21 * day).toISOString(), slot: '15:00', personas: 2, monto: 85000,
        reviewed: true, rating: 5, comentario: 'Increíble la tinaja con vista, volveríamos altiro.',
      },
      {
        id: 'demo-2', title: 'Cabaña romántica + cena', icon: '🍽️',
        businessEmail: 'negocio.demo@pickmap.cl', businessName: 'Negocio Demo',
        fecha: new Date(now - 10 * day).toISOString(), slot: '20:00', personas: 2, monto: 53000,
        reviewed: true, rating: 4, comentario: 'Muy rica la cena, el servicio se demoró un poco.',
      },
      {
        id: 'demo-3', title: 'Cabaña grupo (6 personas)', icon: '👥',
        businessEmail: 'negocio.demo@pickmap.cl', businessName: 'Negocio Demo',
        fecha: new Date(now - 3 * day).toISOString(), slot: '12:00', personas: 6, monto: 101000,
        reviewed: false,
      },
    ]);
  }
  seedDemoHistoryIfNeeded();

  const POINTS_KEY = `pickmap_points_${email}`;
  const DEFAULT_POINTS = 1240;
  function getPoints() {
    const raw = localStorage.getItem(POINTS_KEY);
    if (raw === null) { localStorage.setItem(POINTS_KEY, String(DEFAULT_POINTS)); return DEFAULT_POINTS; }
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : DEFAULT_POINTS;
  }
  function setPoints(n) { localStorage.setItem(POINTS_KEY, String(Math.max(0, n))); }

  function escapeHTML(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function fmtDateShort(iso) {
    return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
  }

  const card = document.getElementById('reviewsPendingCard');
  const list = document.getElementById('reviewsPendingList');
  const emptyEl = document.getElementById('reviewsEmpty');
  if (!card || !list) return;

  function allReservations() {
    return [...getTravelerReservations()].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }

  function pendingRowHTML(r) {
    return `
      <li class="dash__review-pending" data-id="${r.id}">
        <span class="dash__history-icon">${r.icon || '📍'}</span>
        <div class="dash__history-info">
          <p class="dash__history-title">${escapeHTML(r.title)}</p>
          <p class="dash__history-time">${fmtDateShort(r.fecha)}${r.businessName ? ` · ${escapeHTML(r.businessName)}` : ''}</p>
        </div>
        <button type="button" class="btn btn--primary dash__review-btn" data-id="${r.id}">Dejar reseña</button>
      </li>
      <li class="dash__review-form" data-form-id="${r.id}" hidden>
        <div class="dash__star-input" data-id="${r.id}">
          ${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="dash__star" data-value="${n}" aria-label="${n} estrellas">☆</button>`).join('')}
        </div>
        <textarea class="dash__review-textarea" rows="3" placeholder="Cuéntanos cómo te fue..."></textarea>
        <p class="dash__review-error" hidden>Elige una calificación y escribe un comentario antes de enviar.</p>
        <div class="dash__review-form-actions">
          <button type="button" class="btn btn--primary dash__review-submit" data-id="${r.id}">Enviar reseña</button>
          <button type="button" class="dash__linkbtn dash__review-cancel" data-id="${r.id}">Cancelar</button>
        </div>
      </li>
    `;
  }

  function doneRowHTML(r) {
    return `
      <li class="dash__review-done" data-id="${r.id}">
        <span class="dash__history-icon">${r.icon || '📍'}</span>
        <div class="dash__history-info">
          <p class="dash__history-title">${escapeHTML(r.title)}</p>
          <p class="dash__history-time">${fmtDateShort(r.fecha)}${r.businessName ? ` · ${escapeHTML(r.businessName)}` : ''}</p>
          ${r.comentario ? `<p class="dash__review-done-comment">"${escapeHTML(r.comentario)}"</p>` : ''}
        </div>
        <span class="dash__review-done-stars">${'★'.repeat(r.rating || 0)}${'☆'.repeat(5 - (r.rating || 0))}</span>
      </li>
    `;
  }

  function render() {
    const items = allReservations();
    if (emptyEl) emptyEl.hidden = items.length > 0;
    list.innerHTML = items.map((r) => (r.reviewed ? doneRowHTML(r) : pendingRowHTML(r))).join('');
  }
  render();

  function sendNotification(tipo, targetEmail, datos) {
    fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, email: targetEmail, datos }),
    }).catch(() => {});
  }

  function submitReview(id, rating, comentario) {
    const all = getTravelerReservations();
    const idx = all.findIndex((r) => String(r.id) === String(id));
    if (idx === -1) return;
    const reserva = all[idx];
    all[idx] = { ...reserva, reviewed: true, rating, comentario };
    saveTravelerReservations(all);

    if (reserva.businessEmail) {
      const reviewsKey = `pickmap_business_reviews_${reserva.businessEmail}`;
      const reviews = JSON.parse(localStorage.getItem(reviewsKey) || '[]');
      const nextId = reviews.length ? Math.max(...reviews.map((r) => r.id)) + 1 : 9001;
      reviews.unshift({
        id: nextId,
        cliente: user.name,
        actividad: reserva.title,
        rating,
        comentario,
        fecha: new Date().toISOString(),
      });
      localStorage.setItem(reviewsKey, JSON.stringify(reviews));

      const linkNegocio = `${window.location.origin}/negocio-resenas.html`;
      sendNotification('cliente-dejo-resena', reserva.businessEmail, {
        estrellas: rating, comentario, cliente: user.name, link: linkNegocio,
      });
      if (rating <= 2) {
        sendNotification('resena-negativa', reserva.businessEmail, {
          estrellas: rating, comentario, cliente: user.name, link: linkNegocio,
        });
      }
      sendNotification('nueva-resena-owner', OWNER_EMAIL, {
        negocio: reserva.businessName || reserva.businessEmail,
        cliente: user.name, actividad: reserva.title, estrellas: rating, comentario,
      });
    }

    setPoints(getPoints() + 15);
    render();
  }

  list.addEventListener('click', (e) => {
    const openBtn = e.target.closest('.dash__review-btn');
    if (openBtn) {
      const form = list.querySelector(`.dash__review-form[data-form-id="${openBtn.dataset.id}"]`);
      if (form) form.hidden = false;
      return;
    }
    const cancelBtn = e.target.closest('.dash__review-cancel');
    if (cancelBtn) {
      const form = list.querySelector(`.dash__review-form[data-form-id="${cancelBtn.dataset.id}"]`);
      if (form) form.hidden = true;
      return;
    }
    const star = e.target.closest('.dash__star');
    if (star) {
      const group = star.closest('.dash__star-input');
      const value = Number(star.dataset.value);
      group.dataset.selected = value;
      group.querySelectorAll('.dash__star').forEach((s) => {
        s.textContent = Number(s.dataset.value) <= value ? '★' : '☆';
        s.classList.toggle('is-selected', Number(s.dataset.value) <= value);
      });
      return;
    }
    const submitBtn = e.target.closest('.dash__review-submit');
    if (submitBtn) {
      const id = submitBtn.dataset.id;
      const form = list.querySelector(`.dash__review-form[data-form-id="${id}"]`);
      const starGroup = form.querySelector('.dash__star-input');
      const rating = Number(starGroup.dataset.selected || 0);
      const comentario = form.querySelector('.dash__review-textarea').value.trim();
      const errorEl = form.querySelector('.dash__review-error');
      if (!rating || !comentario) {
        errorEl.hidden = false;
        return;
      }
      errorEl.hidden = true;
      submitReview(id, rating, comentario);
    }
  });
})();
