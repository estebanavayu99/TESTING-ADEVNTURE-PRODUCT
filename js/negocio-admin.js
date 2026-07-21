/* Pickmap — panel admin (contacto@pickmap.cl)
 *
 * Resumen agregado de TODOS los negocios aliados. Distinto de js/negocio.js
 * (que solo lee/calcula datos del negocio de la sesión actual): este
 * archivo recorre pickmap_business_users completo y calcula un rollup por
 * negocio — nunca reservas individuales cruzadas entre negocios, para no
 * violar el aislamiento de privacidad (instrucción explícita del usuario:
 * un negocio jamás debe poder ver qué más reservó un cliente en OTRO
 * negocio; el admin ve totales por negocio, no el detalle de cada reserva
 * de cada negocio ajeno — ni siquiera en el desglose por mes del gráfico,
 * que agrupa por NEGOCIO, no por cliente/reserva).
 *
 * Duplica hashStr/seedRandom/CLIENTES/ACTIVIDADES/HORAS/generateReservations/
 * generateReviews de js/negocio.js (mismo patrón de helpers duplicados por
 * archivo ya establecido en este repo) para poder calcular el mismo dataset
 * demo determinístico de un negocio arbitrario sin depender de que ESE
 * negocio haya iniciado sesión antes. Persiste en las mismas localStorage
 * keys (pickmap_business_reservations_<email> / _reviews_<email>) así que
 * si el negocio ya generó sus datos antes, el admin ve exactamente lo mismo.
 *
 * Comisión Pickmap: NO hay una tasa real definida en ningún lugar del sitio
 * (el `monto` de cada reserva ya es lo que el NEGOCIO recibe, neto de
 * comisión — ver terminos.html: "Pickmap recauda el pago... transfiere los
 * fondos... descontando la comisión de intermediación"). Sin una tasa real
 * documentada, se usa un 12% estimado (punto medio típico de plataformas de
 * reservas turísticas) — ajustar COMMISSION_RATE en cuanto el usuario defina
 * la tasa real de negocio.
 */
(() => {
  const BIZ_USERS_KEY = 'pickmap_business_users';
  const BIZ_SESSION_KEY = 'pickmap_business_session';
  const ADMIN_EMAIL = 'contacto@pickmap.cl';
  const COMMISSION_RATE = 0.12;

  const bizEmail = (localStorage.getItem(BIZ_SESSION_KEY) || '').trim().toLowerCase();
  if (bizEmail !== ADMIN_EMAIL) {
    window.location.href = bizEmail ? 'negocio.html' : 'login-empresa.html';
    return;
  }

  // Marca que quien está realmente autenticado es el super admin — se
  // mantiene aunque más abajo "Ver como" pise pickmap_business_session /
  // pickmap_current_user para entrar al panel real de un negocio o
  // viajero. js/admin-viewas.js (cargado en esas páginas) usa esta marca
  // para mostrar el banner "volver a super admin" solo cuando corresponde.
  localStorage.setItem('pickmap_admin_true_email', ADMIN_EMAIL);

  document.getElementById('bizLogoutBtn').addEventListener('click', () => {
    localStorage.removeItem(BIZ_SESSION_KEY);
    localStorage.removeItem('pickmap_admin_true_email');
    localStorage.removeItem('pickmap_admin_viewing_as');
    window.location.href = 'index.html#alianzas';
  });

  function hashStr(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h * 31 + str.charCodeAt(i)) >>> 0;
    }
    return h;
  }

  function seedRandom(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  const CLIENTES = ['Javiera Muñoz', 'Tomás Reyes', 'Camila Soto', 'Benjamín Vidal', 'Constanza Pizarro', 'Matías Concha', 'Fernanda Alarcón', 'Ignacio Bravo', 'Antonia Rojas', 'Diego Fuentes', 'Valentina Araya', 'Sebastián Torres'];
  const ACTIVIDADES = ['Cabaña + tinaja caliente (2 noches)', 'Cabaña familiar junto al río', 'Cabaña + desayuno campestre', 'Cabaña romántica + cena', 'Cabaña grupo (6 personas)'];
  const HORAS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
  const NOW = new Date('2026-07-11T12:00:00');

  function isActive(r) { return r.estado === 'confirmada' || r.estado === 'pendiente'; }
  function isPaid(r) { return r.estado === 'completada'; }
  const fmtMoney = (n) => '$' + Math.round(n).toLocaleString('es-CL');
  const fmtDateShort = (d) => d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });

  // Idéntico a generateReservations() en js/negocio.js, parametrizado por
  // email (allá vivía cerrado sobre el bizEmail de la sesión actual).
  function generateReservations(email) {
    const rand = seedRandom(20240711 + hashStr(email));
    const now = NOW;
    const list = [];
    let id = 1001;
    for (let m = 5; m >= 0; m--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const daysInMonth = m === 0 ? now.getDate() : new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
      const count = m === 0 ? 3 + Math.floor(rand() * 3) : 5 + Math.floor(rand() * 4);
      for (let i = 0; i < count; i++) {
        const day = 1 + Math.floor(rand() * daysInMonth);
        const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
        const monto = 45000 + Math.floor(rand() * 9) * 8000;
        const estado = rand() < 0.12 ? 'cancelada' : 'completada';
        list.push({ id: id++, cliente: CLIENTES[Math.floor(rand() * CLIENTES.length)], actividad: ACTIVIDADES[Math.floor(rand() * ACTIVIDADES.length)], personas: 2 + Math.floor(rand() * 5), fecha: date, hora: HORAS[Math.floor(rand() * HORAS.length)], monto: estado === 'cancelada' ? 0 : monto, montoOriginal: monto, estado });
      }
    }
    for (let i = 0; i < 9; i++) {
      const daysAhead = 1 + Math.floor(rand() * 34);
      const date = new Date(now);
      date.setDate(date.getDate() + daysAhead);
      const monto = 45000 + Math.floor(rand() * 9) * 8000;
      list.push({ id: id++, cliente: CLIENTES[Math.floor(rand() * CLIENTES.length)], actividad: ACTIVIDADES[Math.floor(rand() * ACTIVIDADES.length)], personas: 2 + Math.floor(rand() * 5), fecha: date, hora: HORAS[Math.floor(rand() * HORAS.length)], monto, montoOriginal: monto, estado: rand() < 0.3 ? 'pendiente' : 'confirmada' });
    }
    const busyDay = new Date(now.getFullYear(), now.getMonth(), 12);
    list.push(
      { id: id++, cliente: 'Javiera Muñoz', actividad: 'Cabaña + tinaja caliente (2 noches)', personas: 4, fecha: new Date(busyDay), hora: '10:00', monto: 85000, montoOriginal: 85000, estado: 'confirmada' },
      { id: id++, cliente: 'Tomás Reyes', actividad: 'Cabaña romántica + cena', personas: 2, fecha: new Date(busyDay), hora: '13:30', monto: 53000, montoOriginal: 53000, estado: 'pendiente' },
      { id: id++, cliente: 'Fernanda Alarcón', actividad: 'Cabaña grupo (6 personas)', personas: 6, fecha: new Date(busyDay), hora: '18:00', monto: 101000, montoOriginal: 101000, estado: 'confirmada' },
    );
    list.sort((a, b) => a.fecha - b.fecha);
    return list;
  }

  function getReservationsFor(email) {
    const key = `pickmap_business_reservations_${email}`;
    let raw = JSON.parse(localStorage.getItem(key) || 'null');
    if (!raw) {
      raw = generateReservations(email);
      localStorage.setItem(key, JSON.stringify(raw));
    }
    return raw.map((r) => ({ ...r, fecha: new Date(r.fecha) }));
  }

  function pickRating(rand) {
    const r = rand();
    if (r < 0.55) return 5;
    if (r < 0.80) return 4;
    if (r < 0.92) return 3;
    if (r < 0.97) return 2;
    return 1;
  }

  // Solo necesitamos el rating para el rollup del admin — se omite el resto
  // del contenido de la reseña (cliente/comentario) porque no se usa acá.
  function generateReviewRatings(email) {
    const rand = seedRandom(88213 + hashStr(email));
    const count = 22 + Math.floor(rand() * 8);
    const ratings = [];
    for (let i = 0; i < count; i++) ratings.push(pickRating(rand));
    return ratings;
  }

  function getReviewRatingsFor(email) {
    const key = `pickmap_business_reviews_${email}`;
    const raw = JSON.parse(localStorage.getItem(key) || 'null');
    if (raw) return raw.map((r) => r.rating);
    return generateReviewRatings(email);
  }

  // "Ver como" y los stats agregados necesitan la lista de TODAS las
  // cuentas reales registradas, no solo las que hayan iniciado sesión en
  // ESTE MISMO navegador del admin (limitación real de pickmap_business_users/
  // pickmap_users, que son puramente locStorage-por-navegador). Se
  // completan con una consulta a Supabase (business_profiles/profiles,
  // ambas con policy "dueño o admin lee" — ver supabase/schema.sql) y se
  // mezclan por email; si Supabase no está configurado o la consulta
  // falla, se sigue igual solo con lo que haya en este navegador (nunca
  // se rompe la página por esto).
  async function fetchRealBizUsers() {
    const S = window.PickmapSupabase;
    if (!S || !S.configured) return [];
    try {
      const rows = await S.businessProfiles.listAll();
      return rows.filter((r) => r.email).map((r) => ({
        email: r.email,
        bizName: r.biz_name,
        repName: r.rep_name,
        legalName: r.legal_name,
        bizRut: r.biz_rut,
        address: [r.street, r.comuna, r.region].filter(Boolean).join(', '),
        availability: r.availability,
        verified: !!r.verified,
        createdAt: r.created_at,
        supabase_user_id: r.user_id,
      }));
    } catch { return []; }
  }
  async function fetchRealTravelerUsers() {
    const S = window.PickmapSupabase;
    if (!S || !S.configured) return [];
    try {
      const rows = await S.profiles.listAll();
      return rows.filter((r) => r.email).map((r) => ({
        email: r.email,
        name: `${r.first_name || ''} ${r.last_name || ''}`.trim() || r.email.split('@')[0],
        rut: r.rut,
        onboarded: !!r.onboarded,
        supabase_user_id: r.user_id,
      }));
    } catch { return []; }
  }
  function mergeByEmail(localList, remoteList) {
    const map = new Map();
    localList.forEach((u) => map.set(u.email, u));
    remoteList.forEach((u) => map.set(u.email, { ...map.get(u.email), ...u }));
    return [...map.values()];
  }
  function upsertLocalUser(key, email, fields) {
    let list;
    try { list = JSON.parse(localStorage.getItem(key)) || []; } catch { list = []; }
    const idx = list.findIndex((u) => u.email === email);
    if (idx === -1) list.push(fields);
    else list[idx] = { ...list[idx], ...fields };
    localStorage.setItem(key, JSON.stringify(list));
  }

  (async () => {
  const localBizUsers = JSON.parse(localStorage.getItem(BIZ_USERS_KEY) || '[]');
  const localTravelerUsers = JSON.parse(localStorage.getItem('pickmap_users') || '[]');
  const [remoteBizUsers, remoteTravelerUsers] = await Promise.all([fetchRealBizUsers(), fetchRealTravelerUsers()]);
  const bizUsers = mergeByEmail(localBizUsers, remoteBizUsers).filter((u) => u.email !== ADMIN_EMAIL);
  // Bug real encontrado en producción: la cuenta admin (contacto@pickmap.cl)
  // tiene una fila real en `profiles` (se creó ahí antes de tener acceso a
  // negocio-admin.html, cuando todavía era una cuenta viajero normal) — sin
  // este filtro, se colaba en el picker de "Ver como viajero" como si fuera
  // un viajero real más.
  const travelerUsers = mergeByEmail(localTravelerUsers, remoteTravelerUsers).filter((u) => u.email !== ADMIN_EMAIL);

  const rows = bizUsers.map((biz) => {
    const reservations = getReservationsFor(biz.email);
    const historico = reservations.filter(isPaid).reduce((sum, r) => sum + r.monto, 0);
    const pipeline = reservations.filter(isActive).reduce((sum, r) => sum + r.monto, 0);
    const activas = reservations.filter(isActive).length;
    const completadas = reservations.filter(isPaid).length;
    const ratings = getReviewRatingsFor(biz.email);
    const ratingProm = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
    return {
      biz, reservations, historico, pipeline, activas, completadas,
      ratingProm, numReseñas: ratings.length,
      comision: historico * COMMISSION_RATE,
      comisionPipeline: pipeline * COMMISSION_RATE,
    };
  });
  rows.sort((a, b) => b.historico - a.historico);

  /* ---------- Stats agregados ---------- */
  const totalHistorico = rows.reduce((sum, r) => sum + r.historico, 0);
  const totalPipeline = rows.reduce((sum, r) => sum + r.pipeline, 0);
  const totalActivas = rows.reduce((sum, r) => sum + r.activas, 0);
  const totalComision = totalHistorico * COMMISSION_RATE;
  const verificados = bizUsers.filter((u) => u.verified).length;
  const sinVerificar = bizUsers.length - verificados;

  document.getElementById('adminStatNegocios').textContent = bizUsers.length;
  document.getElementById('adminStatNegociosNote').textContent = sinVerificar > 0 ? `${verificados} verificados · ${sinVerificar} sin verificar` : 'Todos verificados';
  document.getElementById('adminStatHistorico').textContent = fmtMoney(totalHistorico);
  document.getElementById('adminStatComision').textContent = fmtMoney(totalComision);
  document.getElementById('adminStatComisionNote').textContent = `Estimado a ${(COMMISSION_RATE * 100).toFixed(0)}% — tasa real pendiente de definir`;
  document.getElementById('adminStatPipeline').textContent = fmtMoney(totalPipeline);
  document.getElementById('adminStatActivas').textContent = totalActivas;
  const totalReseñas = rows.reduce((sum, r) => sum + r.numReseñas, 0);
  const ratingPromPlataforma = totalReseñas
    ? rows.reduce((sum, r) => sum + (r.ratingProm || 0) * r.numReseñas, 0) / totalReseñas
    : null;
  document.getElementById('adminStatRating').textContent = ratingPromPlataforma ? `⭐ ${ratingPromPlataforma.toFixed(1)}` : '—';
  document.getElementById('adminStatRatingNote').textContent = `${totalReseñas} reseñas en total`;

  /* ---------- Mejores negocios (top 5 por generado histórico) ---------- */
  const topSection = document.getElementById('adminTopSection');
  const topList = document.getElementById('adminTopList');
  const MEDALS = ['🥇', '🥈', '🥉'];
  const top = rows.filter((r) => r.historico > 0).slice(0, 5);
  if (top.length) {
    topSection.hidden = false;
    topList.innerHTML = top.map((r, i) => `
      <li class="admin-top">
        <span class="admin-top__medal">${MEDALS[i] || `#${i + 1}`}</span>
        <div class="admin-top__info">
          <p class="admin-top__name">${r.biz.bizName || r.biz.email}</p>
          <p class="admin-top__meta">${r.activas} activas · ${r.completadas} completadas${r.ratingProm ? ` · ⭐ ${r.ratingProm.toFixed(1)}` : ''}</p>
        </div>
        <span class="admin-top__amt">${fmtMoney(r.historico)}</span>
      </li>
    `).join('');
  }

  /* ---------- Negocios sin verificar ---------- */
  const unverifiedSection = document.getElementById('adminUnverifiedSection');
  const unverifiedList = document.getElementById('adminUnverifiedList');
  const unverified = rows.filter((r) => !r.biz.verified);
  if (unverified.length) {
    unverifiedSection.hidden = false;
    unverifiedList.innerHTML = unverified.map((r) => `
      <li class="biz-res biz-res--static">
        <div class="biz-res__info">
          <p class="biz-res__client">${r.biz.bizName || r.biz.email}</p>
          <p class="biz-res__meta">${r.biz.repName || '—'} · ${r.biz.email}</p>
        </div>
        <span class="biz-res__status biz-res__status--pendiente">Sin verificar</span>
      </li>
    `).join('');
  }

  /* ---------- Tabla completa ---------- */
  const list = document.getElementById('adminBizList');
  const empty = document.getElementById('adminEmpty');
  if (!rows.length) {
    empty.hidden = false;
    list.hidden = true;
  } else {
    list.innerHTML = rows.map((r) => `
      <li class="biz-res biz-res--static">
        <div class="biz-res__info">
          <p class="biz-res__client">${r.biz.bizName || r.biz.email}</p>
          <p class="biz-res__meta">${r.biz.repName || '—'} · ${r.biz.email}${r.biz.verified ? '' : ' · sin verificar'}${r.biz.createdAt ? ` · desde ${fmtDateShort(new Date(r.biz.createdAt))}` : ''}</p>
          <p class="biz-res__meta">Pipeline: ${fmtMoney(r.pipeline)} · Comisión: ${fmtMoney(r.comision)}</p>
        </div>
        <span class="biz-res__amt">${fmtMoney(r.historico)}</span>
        <span class="biz-res__status biz-res__status--confirmada">${r.activas} activas</span>
        <span class="biz-res__status biz-res__status--completada">${r.ratingProm ? `⭐ ${r.ratingProm.toFixed(1)}` : 'Sin reseñas'}</span>
      </li>
    `).join('');
  }

  /* ---------- Modal compartido (solo lectura, sin acciones) ---------- */
  const modalOverlay = document.getElementById('adminModal');
  const modalTitle = document.getElementById('adminModalTitle');
  const modalBody = document.getElementById('adminModalBody');
  document.getElementById('adminModalClose').addEventListener('click', () => { modalOverlay.hidden = true; });
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) modalOverlay.hidden = true; });

  function openMonthBreakdown(labelLargo, porNegocio) {
    modalTitle.textContent = `Detalle de ${labelLargo}`;
    const total = porNegocio.reduce((sum, x) => sum + x.monto, 0);
    modalBody.innerHTML = `
      <div class="biz-modal__rows">
        <div class="biz-modal__row"><span>Total generado (todos)</span><span>${fmtMoney(total)}</span></div>
        <div class="biz-modal__row"><span>Comisión PickMap</span><span>${fmtMoney(total * COMMISSION_RATE)}</span></div>
      </div>
      <div class="biz-modal__divider"></div>
      <p class="biz-modal__group-label">Por negocio</p>
      <div class="biz-modal__rows">
        ${porNegocio.filter((x) => x.monto > 0).sort((a, b) => b.monto - a.monto).map((x) => `
          <div class="biz-modal__row"><span>${x.nombre}</span><span>${fmtMoney(x.monto)}</span></div>
        `).join('') || '<p class="biz-res-list__empty">Sin generado este mes.</p>'}
      </div>
    `;
    modalOverlay.hidden = false;
  }

  /* ---------- Gráfico de línea agregado (últimos 6 meses) ---------- */
  const chart = document.getElementById('adminChart');
  const monthTotals = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(NOW.getFullYear(), NOW.getMonth() - i, 1);
    const porNegocio = rows.map((r) => ({
      nombre: r.biz.bizName || r.biz.email,
      monto: r.reservations.filter((x) => isPaid(x) && x.fecha.getMonth() === d.getMonth() && x.fecha.getFullYear() === d.getFullYear()).reduce((sum, x) => sum + x.monto, 0),
    }));
    const total = porNegocio.reduce((sum, x) => sum + x.monto, 0);
    monthTotals.push({
      label: d.toLocaleDateString('es-CL', { month: 'short' }),
      labelLargo: d.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' }),
      total, comision: total * COMMISSION_RATE, isCurrent: i === 0, porNegocio,
    });
  }

  const W = 600;
  const H = 130;
  const padX = 28;
  const padTop = 22;
  const padBottom = 24;
  const plotW = W - padX * 2;
  const plotH = H - padTop - padBottom;
  const max = Math.max(...monthTotals.map((m) => m.total), 1);
  const n = monthTotals.length;
  const points = monthTotals.map((m, i) => {
    const x = n === 1 ? padX : padX + (i / (n - 1)) * plotW;
    return { ...m, x, yTotal: padTop + plotH - (m.total / max) * plotH, yComision: padTop + plotH - (m.comision / max) * plotH };
  });
  const pathFor = (key) => points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p[key].toFixed(1)}`).join(' ');
  const lineTotal = pathFor('yTotal');
  const lineComision = pathFor('yComision');
  const areaPath = `${lineTotal} L${points[points.length - 1].x.toFixed(1)},${(padTop + plotH).toFixed(1)} L${points[0].x.toFixed(1)},${(padTop + plotH).toFixed(1)} Z`;

  chart.innerHTML = `
    <svg class="biz-chart__svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Ingresos de la plataforma, últimos 6 meses">
      <defs>
        <linearGradient id="adminChartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style="stop-color: var(--coral); stop-opacity: 0.18"></stop>
          <stop offset="100%" style="stop-color: var(--coral); stop-opacity: 0"></stop>
        </linearGradient>
      </defs>
      <path class="biz-chart__area" style="fill: url(#adminChartFill)" d="${areaPath}"></path>
      <path class="biz-chart__line" d="${lineTotal}"></path>
      <path class="biz-chart__line biz-chart__line--comision" d="${lineComision}"></path>
      ${points.map((p, i) => `
        <text class="biz-chart__amt" x="${p.x.toFixed(1)}" y="${(p.yTotal - 10).toFixed(1)}">${p.total > 0 ? fmtMoney(p.total) : '—'}</text>
        <text class="biz-chart__label" x="${p.x.toFixed(1)}" y="${H - 4}">${p.label}</text>
        <circle class="biz-chart__pt${p.isCurrent ? ' is-current' : ''}" id="adminChartPt${i}" cx="${p.x.toFixed(1)}" cy="${p.yTotal.toFixed(1)}" r="4"></circle>
        <circle class="biz-chart__pt biz-chart__pt--comision${p.isCurrent ? ' is-current' : ''}" cx="${p.x.toFixed(1)}" cy="${p.yComision.toFixed(1)}" r="3"></circle>
      `).join('')}
      ${points.map((p, i) => `
        <circle class="biz-chart__hit" data-mes-idx="${i}" tabindex="0" role="button" aria-label="Ver desglose de ${p.labelLargo}" cx="${p.x.toFixed(1)}" cy="${p.yTotal.toFixed(1)}" r="16"></circle>
      `).join('')}
    </svg>
  `;
  chart.querySelectorAll('.biz-chart__hit').forEach((hit) => {
    const idx = Number(hit.dataset.mesIdx);
    const pt = document.getElementById(`adminChartPt${idx}`);
    const grow = () => pt && pt.setAttribute('r', '6');
    const shrink = () => pt && pt.setAttribute('r', '4');
    hit.addEventListener('mouseenter', grow);
    hit.addEventListener('mouseleave', shrink);
    hit.addEventListener('focus', grow);
    hit.addEventListener('blur', shrink);
    hit.addEventListener('click', () => {
      const m = monthTotals[idx];
      openMonthBreakdown(m.labelLargo, m.porNegocio);
    });
    hit.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const m = monthTotals[idx];
        openMonthBreakdown(m.labelLargo, m.porNegocio);
      }
    });
  });

  /* ---------- "Ver como" (instrucción explícita del usuario) ----------
   * El admin entra al panel REAL de un negocio o de un viajero ya
   * registrado, sin cerrar su propia sesión: pisa temporalmente
   * pickmap_business_session / pickmap_current_user con el email
   * elegido y redirige a su panel normal. pickmap_admin_true_email
   * (seteado arriba) sigue marcando quién es el admin de verdad —
   * js/admin-viewas.js, cargado en esas páginas, usa esa marca para
   * mostrar el banner "volver a super admin". */
  const viewAsBizSelect = document.getElementById('adminViewAsBizSelect');
  const viewAsTravelerSelect = document.getElementById('adminViewAsTravelerSelect');

  if (viewAsBizSelect) {
    bizUsers.forEach((u) => {
      const opt = document.createElement('option');
      opt.value = u.email;
      opt.textContent = `${u.bizName || u.email} (${u.email})`;
      viewAsBizSelect.appendChild(opt);
    });
  }
  if (viewAsTravelerSelect) {
    travelerUsers.forEach((u) => {
      const opt = document.createElement('option');
      opt.value = u.email;
      opt.textContent = `${u.name || u.email} (${u.email})`;
      viewAsTravelerSelect.appendChild(opt);
    });
  }
  if (!bizUsers.length && !travelerUsers.length) {
    const empty = document.getElementById('adminViewAsEmpty');
    if (empty) empty.hidden = false;
  }

  document.getElementById('adminViewAsBizBtn').addEventListener('click', () => {
    const target = viewAsBizSelect.value;
    if (!target) return;
    // Espeja el perfil real (venga de este navegador o de Supabase) a
    // pickmap_business_users — negocio.js lee ese localStorage directo,
    // sin consultar Supabase, así que sin este paso un negocio real que
    // nunca inició sesión en ESTE navegador se vería como "cuenta no
    // encontrada" al intentar verlo como.
    const bizRecord = bizUsers.find((u) => u.email === target);
    if (bizRecord) upsertLocalUser(BIZ_USERS_KEY, target, bizRecord);
    localStorage.setItem('pickmap_admin_viewing_as', JSON.stringify({ type: 'empresa', email: target }));
    localStorage.setItem(BIZ_SESSION_KEY, target);
    window.location.href = 'negocio.html';
  });
  document.getElementById('adminViewAsTravelerBtn').addEventListener('click', () => {
    const target = viewAsTravelerSelect.value;
    if (!target) return;
    const travelerRecord = travelerUsers.find((u) => u.email === target);
    if (travelerRecord) {
      // Bug real reportado por el usuario: al completar el onboarding
      // mientras se "ve como" un viajero, esa respuesta se guarda en
      // Supabase con la sesión REAL activa (la del admin, nunca hay una
      // sesión de Supabase real para el viajero impersonado) — así que
      // profiles.onboarded del viajero de verdad nunca queda en true ahí.
      // Sin este chequeo, cada clic en "Ver como viajero" volvía a traer
      // onboarded:false desde Supabase y pisaba el true que sí había
      // quedado guardado localmente, mandando al onboarding de nuevo en
      // un loop infinito. Una vez completado una vez en este navegador,
      // se respeta ese true por sobre el dato (potencialmente desactualizado)
      // de Supabase.
      let existingLocal = null;
      try { existingLocal = (JSON.parse(localStorage.getItem('pickmap_users')) || []).find((u) => u.email === target); } catch { /* noop */ }
      if (existingLocal && existingLocal.onboarded) travelerRecord.onboarded = true;
      upsertLocalUser('pickmap_users', target, travelerRecord);
    }
    localStorage.setItem('pickmap_admin_viewing_as', JSON.stringify({ type: 'viajero', email: target }));
    localStorage.setItem('pickmap_current_user', target);
    window.location.href = 'dashboard.html';
  });
  })();
})();
