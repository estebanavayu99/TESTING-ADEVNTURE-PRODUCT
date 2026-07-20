/* Pickmap — panel admin (contacto@pickmap.cl)
 *
 * Resumen agregado de TODOS los negocios aliados. Distinto de js/negocio.js
 * (que solo lee/calcula datos del negocio de la sesión actual): este
 * archivo recorre pickmap_business_users completo y calcula un rollup por
 * negocio — nunca reservas individuales cruzadas entre negocios, para no
 * violar el aislamiento de privacidad (instrucción explícita del usuario:
 * un negocio jamás debe poder ver qué más reservó un cliente en OTRO
 * negocio; el admin ve totales por negocio, no el detalle de cada reserva
 * de cada negocio ajeno).
 *
 * Duplica hashStr/seedRandom/CLIENTES/ACTIVIDADES/HORAS/generateReservations/
 * generateReviews de js/negocio.js (mismo patrón de helpers duplicados por
 * archivo ya establecido en este repo) para poder calcular el mismo dataset
 * demo determinístico de un negocio arbitrario sin depender de que ESE
 * negocio haya iniciado sesión antes. Persiste en las mismas localStorage
 * keys (pickmap_business_reservations_<email> / _reviews_<email>) así que
 * si el negocio ya generó sus datos antes, el admin ve exactamente lo mismo.
 */
(() => {
  const BIZ_USERS_KEY = 'pickmap_business_users';
  const BIZ_SESSION_KEY = 'pickmap_business_session';
  const ADMIN_EMAIL = 'contacto@pickmap.cl';

  const bizEmail = localStorage.getItem(BIZ_SESSION_KEY);
  if (bizEmail !== ADMIN_EMAIL) {
    window.location.href = bizEmail ? 'negocio.html' : 'login-empresa.html';
    return;
  }

  document.getElementById('bizLogoutBtn').addEventListener('click', () => {
    localStorage.removeItem(BIZ_SESSION_KEY);
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

  const bizUsers = JSON.parse(localStorage.getItem(BIZ_USERS_KEY) || '[]')
    .filter((u) => u.email !== ADMIN_EMAIL);

  const rows = bizUsers.map((biz) => {
    const reservations = getReservationsFor(biz.email);
    const historico = reservations.filter(isPaid).reduce((sum, r) => sum + r.monto, 0);
    const activas = reservations.filter(isActive).length;
    const ratings = getReviewRatingsFor(biz.email);
    const ratingProm = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
    return { biz, historico, activas, ratingProm, numReseñas: ratings.length };
  });
  rows.sort((a, b) => b.historico - a.historico);

  document.getElementById('adminStatNegocios').textContent = bizUsers.length;
  document.getElementById('adminStatHistorico').textContent = fmtMoney(rows.reduce((sum, r) => sum + r.historico, 0));
  document.getElementById('adminStatActivas').textContent = rows.reduce((sum, r) => sum + r.activas, 0);
  const totalReseñas = rows.reduce((sum, r) => sum + r.numReseñas, 0);
  const ratingPromPlataforma = totalReseñas
    ? rows.reduce((sum, r) => sum + (r.ratingProm || 0) * r.numReseñas, 0) / totalReseñas
    : null;
  document.getElementById('adminStatRating').textContent = ratingPromPlataforma ? `⭐ ${ratingPromPlataforma.toFixed(1)}` : '—';
  document.getElementById('adminStatRatingNote').textContent = `${totalReseñas} reseñas en total`;

  const list = document.getElementById('adminBizList');
  const empty = document.getElementById('adminEmpty');
  if (!rows.length) {
    empty.hidden = false;
    list.hidden = true;
  } else {
    list.innerHTML = rows.map(({ biz, historico, activas, ratingProm }) => `
      <li class="biz-res biz-res--static">
        <div class="biz-res__info">
          <p class="biz-res__client">${biz.bizName || biz.email}</p>
          <p class="biz-res__meta">${biz.repName || '—'} · ${biz.email}${biz.verified ? '' : ' · sin verificar'}</p>
        </div>
        <span class="biz-res__amt">${fmtMoney(historico)}</span>
        <span class="biz-res__status biz-res__status--confirmada">${activas} activas</span>
        <span class="biz-res__status biz-res__status--completada">${ratingProm ? `⭐ ${ratingProm.toFixed(1)}` : 'Sin reseñas'}</span>
      </li>
    `).join('');
  }
})();
