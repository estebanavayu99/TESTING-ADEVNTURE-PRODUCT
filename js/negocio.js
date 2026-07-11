(() => {
  const BIZ_USERS_KEY = 'pickmap_business_users';
  const BIZ_SESSION_KEY = 'pickmap_business_session';

  function hashStr(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h * 31 + str.charCodeAt(i)) >>> 0;
    }
    return h;
  }

  const bizEmail = localStorage.getItem(BIZ_SESSION_KEY);
  if (!bizEmail) {
    window.location.href = 'login-empresa.html';
    return;
  }
  const bizUsers = JSON.parse(localStorage.getItem(BIZ_USERS_KEY) || '[]');
  const bizAccount = bizUsers.find((u) => u.email === bizEmail);
  if (!bizAccount) {
    localStorage.removeItem(BIZ_SESSION_KEY);
    window.location.href = 'login-empresa.html';
    return;
  }

  function seedRandom(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  function getBusiness() {
    return {
      name: bizAccount.bizName,
      legalName: bizAccount.legalName,
      rut: bizAccount.bizRut,
      address: bizAccount.address,
      repName: bizAccount.repName,
      paymentMethod: 'Transferencia · pendiente de configurar',
    };
  }

  const CLIENTES = ['Javiera Muñoz', 'Tomás Reyes', 'Camila Soto', 'Benjamín Vidal', 'Constanza Pizarro', 'Matías Concha', 'Fernanda Alarcón', 'Ignacio Bravo', 'Antonia Rojas', 'Diego Fuentes', 'Valentina Araya', 'Sebastián Torres'];
  const ACTIVIDADES = ['Cabaña + tinaja caliente (2 noches)', 'Cabaña familiar junto al río', 'Cabaña + desayuno campestre', 'Cabaña romántica + cena', 'Cabaña grupo (6 personas)'];
  const HORAS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

  const RES_KEY = `pickmap_business_reservations_${bizEmail}`;

  function generateReservations() {
    const rand = seedRandom(20240711 + hashStr(bizEmail));
    const now = new Date('2026-07-11T12:00:00');
    const list = [];
    let id = 1001;

    // Historial: distribute reservations across each of the last 6 months
    // (including the current, partial month) so every period has real data.
    for (let m = 5; m >= 0; m--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const daysInMonth = m === 0 ? now.getDate() : new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
      const count = m === 0 ? 3 + Math.floor(rand() * 3) : 5 + Math.floor(rand() * 4);
      for (let i = 0; i < count; i++) {
        const day = 1 + Math.floor(rand() * daysInMonth);
        const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
        const monto = 45000 + Math.floor(rand() * 9) * 8000;
        const estado = rand() < 0.12 ? 'cancelada' : 'completada';
        list.push({
          id: id++,
          cliente: CLIENTES[Math.floor(rand() * CLIENTES.length)],
          actividad: ACTIVIDADES[Math.floor(rand() * ACTIVIDADES.length)],
          personas: 2 + Math.floor(rand() * 5),
          fecha: date,
          hora: HORAS[Math.floor(rand() * HORAS.length)],
          monto: estado === 'cancelada' ? 0 : monto,
          montoOriginal: monto,
          estado,
        });
      }
    }

    // Activas: next ~5 weeks, confirmadas / pendientes
    for (let i = 0; i < 9; i++) {
      const daysAhead = 1 + Math.floor(rand() * 34);
      const date = new Date(now);
      date.setDate(date.getDate() + daysAhead);
      const monto = 45000 + Math.floor(rand() * 9) * 8000;
      list.push({
        id: id++,
        cliente: CLIENTES[Math.floor(rand() * CLIENTES.length)],
        actividad: ACTIVIDADES[Math.floor(rand() * ACTIVIDADES.length)],
        personas: 2 + Math.floor(rand() * 5),
        fecha: date,
        hora: HORAS[Math.floor(rand() * HORAS.length)],
        monto,
        montoOriginal: monto,
        estado: rand() < 0.3 ? 'pendiente' : 'confirmada',
      });
    }

    // Día con varias reservas de personas distintas, para mostrar cómo se ve
    // el calendario y el detalle cuando un mismo día tiene más de una reserva.
    const busyDay = new Date(now.getFullYear(), now.getMonth(), 12);
    list.push(
      { id: id++, cliente: 'Javiera Muñoz', actividad: 'Cabaña + tinaja caliente (2 noches)', personas: 4, fecha: new Date(busyDay), hora: '10:00', monto: 85000, montoOriginal: 85000, estado: 'confirmada' },
      { id: id++, cliente: 'Tomás Reyes', actividad: 'Cabaña romántica + cena', personas: 2, fecha: new Date(busyDay), hora: '13:30', monto: 53000, montoOriginal: 53000, estado: 'pendiente' },
      { id: id++, cliente: 'Fernanda Alarcón', actividad: 'Cabaña grupo (6 personas)', personas: 6, fecha: new Date(busyDay), hora: '18:00', monto: 101000, montoOriginal: 101000, estado: 'confirmada' },
    );

    list.sort((a, b) => a.fecha - b.fecha);
    return list;
  }

  function getReservations() {
    let raw = JSON.parse(localStorage.getItem(RES_KEY) || 'null');
    if (!raw) {
      raw = generateReservations();
      localStorage.setItem(RES_KEY, JSON.stringify(raw));
    }
    return raw.map((r) => ({ ...r, fecha: new Date(r.fecha) }));
  }

  /* ---------- Reseñas ---------- */
  const REVIEW_COMMENTS = {
    5: ['Increíble experiencia, todo impecable.', 'Superó nuestras expectativas, volveremos seguro.', 'Atención espectacular y el lugar hermoso.', 'Perfecto para una escapada en pareja.', 'Todo salió tal cual se ofrecía, muy recomendable.'],
    4: ['Muy buena experiencia, solo el check-in fue un poco lento.', 'Nos encantó, aunque esperábamos un poco más de privacidad.', 'Buena relación precio-calidad.'],
    3: ['Estuvo bien pero nada espectacular.', 'Cumplió, aunque el lugar necesita algunas mejoras.'],
    2: ['No cumplió del todo lo que ofrecía la publicación.'],
    1: ['No fue lo que esperaba, tuvimos varios problemas.'],
  };

  function pickRating(rand) {
    const r = rand();
    if (r < 0.55) return 5;
    if (r < 0.80) return 4;
    if (r < 0.92) return 3;
    if (r < 0.97) return 2;
    return 1;
  }

  const REVIEWS_KEY = `pickmap_business_reviews_${bizEmail}`;

  function generateReviews() {
    const rand = seedRandom(88213 + hashStr(bizEmail));
    const now = new Date('2026-07-11T12:00:00');
    const list = [];
    let id = 5001;
    const count = 22 + Math.floor(rand() * 8);
    for (let i = 0; i < count; i++) {
      const rating = pickRating(rand);
      const daysAgo = 2 + Math.floor(rand() * 150);
      const date = new Date(now);
      date.setDate(date.getDate() - daysAgo);
      const comments = REVIEW_COMMENTS[rating];
      list.push({
        id: id++,
        cliente: CLIENTES[Math.floor(rand() * CLIENTES.length)],
        actividad: ACTIVIDADES[Math.floor(rand() * ACTIVIDADES.length)],
        rating,
        comentario: comments[Math.floor(rand() * comments.length)],
        fecha: date,
      });
    }
    list.sort((a, b) => b.fecha - a.fecha);
    return list;
  }

  function getReviews() {
    let raw = JSON.parse(localStorage.getItem(REVIEWS_KEY) || 'null');
    if (!raw) {
      raw = generateReviews();
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(raw));
    }
    return raw.map((r) => ({ ...r, fecha: new Date(r.fecha) }));
  }

  /* ---------- Referidos ---------- */
  function getReferralCode() {
    const base = (bizAccount.bizName || 'PICKMAP').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'PICKMAP';
    const suffix = String(100 + (hashStr(bizEmail) % 900));
    return `${base}${suffix}`;
  }

  const REFERRED_BIZ_NAMES = ['Termas del Bosque', 'Cabañas Vista Volcán', 'Kayak Aventura Sur', 'Glamping Los Coigües', 'Bike Tour Pucón', 'Spa Rural Curarrehue', 'Cabalgatas Andinas'];
  const REFERRALS_KEY = `pickmap_business_referrals_${bizEmail}`;

  function generateReferrals() {
    const rand = seedRandom(53071 + hashStr(bizEmail));
    const now = new Date('2026-07-11T12:00:00');
    const count = 2 + Math.floor(rand() * 4);
    const shuffled = [...REFERRED_BIZ_NAMES].sort(() => rand() - 0.5);
    const list = [];
    for (let i = 0; i < count; i++) {
      const daysAgo = 5 + Math.floor(rand() * 120);
      const date = new Date(now);
      date.setDate(date.getDate() - daysAgo);
      const isActiveReferral = rand() < 0.6;
      list.push({
        nombre: shuffled[i % shuffled.length],
        fecha: date,
        estado: isActiveReferral ? 'activo' : 'invitado',
        recompensa: isActiveReferral ? 20000 + Math.floor(rand() * 4) * 5000 : 0,
      });
    }
    list.sort((a, b) => b.fecha - a.fecha);
    return list;
  }

  function getReferrals() {
    let raw = JSON.parse(localStorage.getItem(REFERRALS_KEY) || 'null');
    if (!raw) {
      raw = generateReferrals();
      localStorage.setItem(REFERRALS_KEY, JSON.stringify(raw));
    }
    return raw.map((r) => ({ ...r, fecha: new Date(r.fecha) }));
  }

  const NOW = new Date('2026-07-11T12:00:00');
  const fmtMoney = (n) => '$' + Math.round(n).toLocaleString('es-CL');
  const fmtDate = (d) => d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtDateShort = (d) => d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });

  function isActive(r) {
    return r.estado === 'confirmada' || r.estado === 'pendiente';
  }

  function isPaid(r) {
    return r.estado === 'completada';
  }

  function startOfWeek(d) {
    const x = new Date(d);
    const day = x.getDay();
    x.setDate(x.getDate() - ((day + 6) % 7));
    x.setHours(0, 0, 0, 0);
    return x;
  }

  function getPaymentDate(r) {
    const paidOn = startOfWeek(r.fecha);
    paidOn.setDate(paidOn.getDate() + 9);
    return paidOn;
  }

  /* ---------- Shared reservation detail modal ---------- */
  const bizModal = document.getElementById('bizModal');
  const bizModalTitle = document.getElementById('bizModalTitle');
  const bizModalRows = document.getElementById('bizModalRows');
  const bizModalClose = document.getElementById('bizModalClose');

  function reservationRowsHTML(r) {
    const estadoLabel = { confirmada: 'Confirmada', pendiente: 'Pendiente', completada: 'Completada', cancelada: 'Cancelada' }[r.estado];
    const isCancelled = r.estado === 'cancelada';
    const paymentDateLabel = isCancelled
      ? 'No aplica (cancelada)'
      : `${fmtDate(getPaymentDate(r))}${isPaid(r) ? '' : ' (estimada)'}`;
    return `
      <div class="biz-modal__row"><span>N° reserva</span><span>#${r.id}</span></div>
      <div class="biz-modal__row"><span>Cliente</span><span>${r.cliente}</span></div>
      <div class="biz-modal__row"><span>Actividad</span><span>${r.actividad}</span></div>
      <div class="biz-modal__row"><span>Día de la actividad</span><span>${fmtDate(r.fecha)}</span></div>
      <div class="biz-modal__row"><span>Hora</span><span>${r.hora || '—'}</span></div>
      <div class="biz-modal__row"><span>Fecha de pago</span><span>${paymentDateLabel}</span></div>
      <div class="biz-modal__row"><span>Personas</span><span>${r.personas}</span></div>
      <div class="biz-modal__row"><span>Estado</span><span class="biz-modal__estado biz-modal__estado--${r.estado}">${estadoLabel}</span></div>
      <div class="biz-modal__row"><span>Monto</span><span>${fmtMoney(r.estado === 'cancelada' ? r.montoOriginal : r.monto)}${r.estado === 'cancelada' ? ' (no cobrado)' : ''}</span></div>
    `;
  }

  function openReservationModal(r) {
    if (!bizModal) return;
    if (bizModalTitle) bizModalTitle.textContent = 'Detalle de la reserva';
    bizModalRows.innerHTML = reservationRowsHTML(r);
    bizModal.hidden = false;
  }

  function openDayModal(dayReservationsIn) {
    if (!bizModal || !dayReservationsIn.length) return;
    // Order by hora so a busy day reads like a clear schedule, not a random list.
    const dayReservations = [...dayReservationsIn].sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));
    if (bizModalTitle) {
      bizModalTitle.textContent = dayReservations.length === 1
        ? 'Detalle de la reserva'
        : `Reservas del ${fmtDate(dayReservations[0].fecha)} (${dayReservations.length})`;
    }
    bizModalRows.innerHTML = dayReservations.map((r, i) => `
      ${i > 0 ? '<div class="biz-modal__divider"></div>' : ''}
      ${dayReservations.length > 1 ? `<p class="biz-modal__group-label">${r.hora || '—'} · ${r.cliente} · ${r.actividad}</p>` : ''}
      ${reservationRowsHTML(r)}
    `).join('');
    bizModal.hidden = false;
  }

  if (bizModalClose) {
    bizModalClose.addEventListener('click', () => { bizModal.hidden = true; });
    bizModal.addEventListener('click', (e) => { if (e.target === bizModal) bizModal.hidden = true; });
  }

  window.PickmapNegocio = {
    getBusiness, getReservations, fmtMoney, fmtDate, fmtDateShort, isActive, isPaid, NOW, openReservationModal, openDayModal,
    getReviews, getReferrals, getReferralCode,
  };

  /* ---------- Shared nav / logout ---------- */
  const logoutBtn = document.getElementById('bizLogoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem(BIZ_SESSION_KEY);
      window.location.href = 'index.html#alianzas';
    });
  }

  const greetEl = document.getElementById('bizGreeting');
  if (greetEl) {
    const biz = getBusiness();
    greetEl.textContent = `Hola, ${biz.name} 👋`;
  }
})();
