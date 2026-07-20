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

  // La cuenta admin de Pickmap (contacto@pickmap.cl) no usa el panel de un
  // negocio individual — si llega acá por URL directa, la mandamos a su
  // propio resumen agregado (negocio-admin.html). Evita que el admin vea un
  // panel de negocio "vacío"/sin sentido a su propio nombre.
  if (bizEmail === 'contacto@pickmap.cl') {
    window.location.href = 'negocio-admin.html';
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

  // El panel no tenía forma de responder una reseña — instrucción
  // explícita del usuario. Persiste la respuesta directo en REVIEWS_KEY
  // (mismo patrón que actualizarEstadoReserva para reservas).
  function responderResena(id, respuesta) {
    const raw = JSON.parse(localStorage.getItem(REVIEWS_KEY) || '[]');
    const actualizado = raw.map((r) => (r.id === id ? { ...r, respuesta, respuestaFecha: new Date().toISOString() } : r));
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(actualizado));
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
        // $50.000 fijo — mismo monto que ahora promete el título de la
        // tarjeta ("Trae a otro negocio y gana $50.000"), antes era un
        // rango variable que no calzaba con ese texto.
        recompensa: isActiveReferral ? 50000 : 0,
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

  // Bug real: tanto negocio-resumen.js como negocio-pagos.js mostraban
  // "Próximo pago" como activasMonto*0.4 (40% del monto de reservas
  // confirmadas/pendientes, AÚN NO completadas) — un número inventado sin
  // respaldo real que además contradice el modelo de pago ya establecido
  // en el sitio (0% riesgo, nunca se paga por adelantado; el pago real
  // llega recién 9 días después de la semana en que se completó cada
  // reserva, ver getPaymentDate). El "próximo pago" de verdad es la
  // liquidación de reservas YA completadas cuyo paidOn todavía no llega —
  // mismo agrupamiento por semana que ya usa el historial de
  // liquidaciones, solo que acá se toma la más próxima aún NO pagada.
  function proximoPagoPendiente() {
    const pagadas = getReservations().filter(isPaid);
    const grupos = new Map();
    pagadas.forEach((r) => {
      const ws = startOfWeek(r.fecha).getTime();
      if (!grupos.has(ws)) grupos.set(ws, { total: 0, count: 0, start: new Date(ws) });
      const g = grupos.get(ws);
      g.total += r.monto;
      g.count += 1;
    });
    const pendientes = [...grupos.values()]
      .map((g) => ({ ...g, paidOn: getPaymentDate({ fecha: g.start }) }))
      .filter((g) => g.paidOn > NOW)
      .sort((a, b) => a.paidOn - b.paidOn);
    return pendientes[0] || null;
  }

  /* ---------- Shared reservation detail modal ---------- */
  const bizModal = document.getElementById('bizModal');
  const bizModalTitle = document.getElementById('bizModalTitle');
  const bizModalRows = document.getElementById('bizModalRows');
  const bizModalClose = document.getElementById('bizModalClose');

  function escapeHTML(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Instrucción explícita del usuario: avisarle a él (owner de Pickmap, no
  // al negocio ni al cliente) por correo real cada vez que una empresa
  // acepta o rechaza una reserva pendiente. El cliente de esta reserva es
  // 100% de prueba (CLIENTES en este mismo archivo son solo nombres, sin
  // email real) — sin un correo real al que llegarle, ese aviso queda sin
  // mandar a propósito hasta que el panel se conecte a reservas reales.
  const OWNER_NOTIFICATION_EMAIL = 'contacto@pickmap.cl';
  function notificarOwnerAccionReserva(reservaOriginal, nuevoEstado, motivo) {
    const biz = getBusiness();
    fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'accion-empresa-reserva-owner',
        email: OWNER_NOTIFICATION_EMAIL,
        datos: {
          negocio: biz.name,
          accion: nuevoEstado === 'confirmada' ? 'aceptada' : 'rechazada',
          cliente: reservaOriginal.cliente,
          actividad: reservaOriginal.actividad,
          fecha: fmtDate(new Date(reservaOriginal.fecha)),
          personas: reservaOriginal.personas,
          monto: fmtMoney(reservaOriginal.montoOriginal != null ? reservaOriginal.montoOriginal : reservaOriginal.monto),
          motivo: motivo || '',
        },
      }),
    }).catch(() => { /* fire-and-forget: nunca debe bloquear la acción del negocio */ });
  }

  // Persiste aceptar/rechazar una reserva pendiente directo en el RES_KEY de
  // localStorage (no en el arreglo ya cargado en memoria de cada página —
  // negocio-reservas.js/negocio-pagos.js/etc cachean su propia copia al
  // cargar). Tras guardar se recarga la página para que TODAS las vistas
  // (lista, calendario, pagos) queden consistentes con el nuevo estado, en
  // vez de sincronizar cada módulo a mano.
  function actualizarEstadoReserva(id, nuevoEstado, motivo) {
    const raw = JSON.parse(localStorage.getItem(RES_KEY) || '[]');
    const original = raw.find((r) => r.id === id);
    const actualizado = raw.map((r) => {
      if (r.id !== id) return r;
      const cambio = { ...r, estado: nuevoEstado };
      // Mismo criterio que ya usa 'cancelada' en generateReservations: monto
      // en 0 (montoOriginal se conserva para mostrarlo tachado/informativo),
      // así cualquier suma futura de r.monto que no filtre por estado no
      // cuenta por error una reserva que nunca se cobró.
      if (nuevoEstado === 'rechazada') { cambio.monto = 0; cambio.motivoRechazo = motivo || ''; }
      return cambio;
    });
    localStorage.setItem(RES_KEY, JSON.stringify(actualizado));
    if (original) notificarOwnerAccionReserva(original, nuevoEstado, motivo);
  }

  // Botones de acción solo para reservas 'pendiente' — aceptar la confirma
  // directo; rechazar exige un motivo (el cliente lo verá) antes de
  // persistir el cambio. En empresas cuidado: nunca se paga por adelantado,
  // así que una reserva rechazada nunca generó pago que revertir.
  function accionesHTML(r) {
    if (r.estado !== 'pendiente') return '';
    return `
      <div class="biz-modal__acciones">
        <div class="biz-modal__acciones-btns">
          <button type="button" class="btn btn--primary biz-modal__btn-aceptar" data-id="${r.id}">Aceptar reserva</button>
          <button type="button" class="btn btn--ghost biz-modal__btn-rechazar" data-id="${r.id}">Rechazar</button>
        </div>
        <div class="biz-modal__motivo-form" data-motivo-id="${r.id}" hidden>
          <label for="biz-motivo-${r.id}">Motivo del rechazo (el cliente lo verá)</label>
          <textarea id="biz-motivo-${r.id}" class="biz-modal__motivo-input" rows="3" placeholder="Ej: no tenemos cupo disponible para esa fecha"></textarea>
          <p class="biz-modal__motivo-error" hidden>Cuéntanos el motivo antes de rechazar.</p>
          <div class="biz-modal__acciones-btns">
            <button type="button" class="btn btn--primary biz-modal__btn-confirmar-rechazo" data-id="${r.id}">Confirmar rechazo</button>
            <button type="button" class="auth-link biz-modal__btn-cancelar-rechazo" data-id="${r.id}">Cancelar</button>
          </div>
        </div>
      </div>
    `;
  }

  function reservationRowsHTML(r) {
    const estadoLabel = { confirmada: 'Confirmada', pendiente: 'Pendiente', completada: 'Completada', cancelada: 'Cancelada', rechazada: 'Rechazada' }[r.estado];
    const sinPago = r.estado === 'cancelada' || r.estado === 'rechazada';
    const paymentDateLabel = sinPago
      ? `No aplica (${r.estado})`
      : `${fmtDate(getPaymentDate(r))}${isPaid(r) ? '' : ' (estimada)'}`;
    const filaMotivo = r.estado === 'rechazada' && r.motivoRechazo
      ? `<div class="biz-modal__row"><span>Motivo del rechazo</span><span>${escapeHTML(r.motivoRechazo)}</span></div>`
      : '';
    return `
      <div class="biz-modal__row"><span>N° reserva</span><span>#${r.id}</span></div>
      <div class="biz-modal__row"><span>Cliente</span><span>${r.cliente}</span></div>
      <div class="biz-modal__row"><span>Actividad</span><span>${r.actividad}</span></div>
      <div class="biz-modal__row"><span>Día de la actividad</span><span>${fmtDate(r.fecha)}</span></div>
      <div class="biz-modal__row"><span>Hora</span><span>${r.hora || '—'}</span></div>
      <div class="biz-modal__row"><span>Fecha de pago</span><span>${paymentDateLabel}</span></div>
      <div class="biz-modal__row"><span>Personas</span><span>${r.personas}</span></div>
      <div class="biz-modal__row"><span>Estado</span><span class="biz-modal__estado biz-modal__estado--${r.estado}">${estadoLabel}</span></div>
      <div class="biz-modal__row"><span>Monto</span><span>${fmtMoney(sinPago ? r.montoOriginal : r.monto)}${sinPago ? ' (no cobrado)' : ''}</span></div>
      ${filaMotivo}
      ${accionesHTML(r)}
    `;
  }

  if (bizModalRows) {
    bizModalRows.addEventListener('click', (e) => {
      const btnAceptar = e.target.closest('.biz-modal__btn-aceptar');
      if (btnAceptar) {
        actualizarEstadoReserva(Number(btnAceptar.dataset.id), 'confirmada');
        window.location.reload();
        return;
      }
      const btnRechazar = e.target.closest('.biz-modal__btn-rechazar');
      if (btnRechazar) {
        const form = bizModalRows.querySelector(`[data-motivo-id="${btnRechazar.dataset.id}"]`);
        if (form) { form.hidden = false; form.querySelector('textarea').focus(); }
        return;
      }
      const btnCancelar = e.target.closest('.biz-modal__btn-cancelar-rechazo');
      if (btnCancelar) {
        const form = bizModalRows.querySelector(`[data-motivo-id="${btnCancelar.dataset.id}"]`);
        if (form) form.hidden = true;
        return;
      }
      const btnConfirmar = e.target.closest('.biz-modal__btn-confirmar-rechazo');
      if (btnConfirmar) {
        const id = Number(btnConfirmar.dataset.id);
        const form = bizModalRows.querySelector(`[data-motivo-id="${id}"]`);
        const input = form.querySelector('textarea');
        const motivo = (input.value || '').trim();
        if (!motivo) { form.querySelector('.biz-modal__motivo-error').hidden = false; return; }
        actualizarEstadoReserva(id, 'rechazada', motivo);
        window.location.reload();
      }
    });
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

  // Desglose de un mes del gráfico de ingresos ("Ingresos de los últimos 6
  // meses" en Resumen) — instrucción explícita del usuario: poder apretar
  // un mes y ver el detalle, no solo el total decorativo de la barra.
  function openMonthModal(mesLabel, reservasDelMes) {
    if (!bizModal) return;
    const total = reservasDelMes.reduce((s, r) => s + r.monto, 0);
    if (bizModalTitle) bizModalTitle.textContent = `Detalle de ${mesLabel}`;
    const filas = reservasDelMes.length
      ? [...reservasDelMes].sort((a, b) => a.fecha - b.fecha).map((r) => `
        <div class="biz-modal__row">
          <span>${fmtDateShort(r.fecha)} · ${escapeHTML(r.cliente)}</span>
          <span>${fmtMoney(r.monto)}</span>
        </div>
      `).join('')
      : '<p style="color:var(--slate);font-size:0.88rem;margin:0;">No hay reservas completadas y pagadas este mes.</p>';
    bizModalRows.innerHTML = `
      <div class="biz-modal__row"><span>Total generado</span><span>${fmtMoney(total)}</span></div>
      <div class="biz-modal__row"><span>Reservas completadas</span><span>${reservasDelMes.length}</span></div>
      <div class="biz-modal__divider"></div>
      ${filas}
    `;
    bizModal.hidden = false;
  }

  if (bizModalClose) {
    bizModalClose.addEventListener('click', () => { bizModal.hidden = true; });
    bizModal.addEventListener('click', (e) => { if (e.target === bizModal) bizModal.hidden = true; });
  }

  window.PickmapNegocio = {
    getBusiness, getReservations, fmtMoney, fmtDate, fmtDateShort, isActive, isPaid, NOW, openReservationModal, openDayModal, openMonthModal,
    getReviews, getReferrals, getReferralCode, actualizarEstadoReserva, proximoPagoPendiente, responderResena,
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
