(() => {
  const BIZ_KEY = 'pickmap_business';
  const RES_KEY = 'pickmap_business_reservations';

  function seedRandom(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  function getBusiness() {
    let biz = JSON.parse(localStorage.getItem(BIZ_KEY) || 'null');
    if (!biz) {
      biz = {
        name: 'Cabañas Río Claro',
        category: 'Cabañas y termas',
        since: '2024',
        paymentMethod: 'Transferencia · Banco Estado •••• 4821',
      };
      localStorage.setItem(BIZ_KEY, JSON.stringify(biz));
    }
    return biz;
  }

  const CLIENTES = ['Javiera Muñoz', 'Tomás Reyes', 'Camila Soto', 'Benjamín Vidal', 'Constanza Pizarro', 'Matías Concha', 'Fernanda Alarcón', 'Ignacio Bravo', 'Antonia Rojas', 'Diego Fuentes', 'Valentina Araya', 'Sebastián Torres'];
  const ACTIVIDADES = ['Cabaña + tinaja caliente (2 noches)', 'Cabaña familiar junto al río', 'Cabaña + desayuno campestre', 'Cabaña romántica + cena', 'Cabaña grupo (6 personas)'];

  function generateReservations() {
    const rand = seedRandom(20240711);
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
        monto,
        montoOriginal: monto,
        estado: rand() < 0.3 ? 'pendiente' : 'confirmada',
      });
    }

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

  /* ---------- Shared reservation detail modal ---------- */
  const bizModal = document.getElementById('bizModal');
  const bizModalRows = document.getElementById('bizModalRows');
  const bizModalClose = document.getElementById('bizModalClose');

  function openReservationModal(r) {
    if (!bizModal) return;
    const estadoLabel = { confirmada: 'Confirmada', pendiente: 'Pendiente', completada: 'Completada', cancelada: 'Cancelada' }[r.estado];
    bizModalRows.innerHTML = `
      <div class="biz-modal__row"><span>Cliente</span><span>${r.cliente}</span></div>
      <div class="biz-modal__row"><span>Actividad</span><span>${r.actividad}</span></div>
      <div class="biz-modal__row"><span>Fecha</span><span>${fmtDate(r.fecha)}</span></div>
      <div class="biz-modal__row"><span>Personas</span><span>${r.personas}</span></div>
      <div class="biz-modal__row"><span>Estado</span><span>${estadoLabel}</span></div>
      <div class="biz-modal__row"><span>Monto</span><span>${fmtMoney(r.estado === 'cancelada' ? r.montoOriginal : r.monto)}${r.estado === 'cancelada' ? ' (no cobrado)' : ''}</span></div>
      <div class="biz-modal__row"><span>N° reserva</span><span>#${r.id}</span></div>
    `;
    bizModal.hidden = false;
  }

  if (bizModalClose) {
    bizModalClose.addEventListener('click', () => { bizModal.hidden = true; });
    bizModal.addEventListener('click', (e) => { if (e.target === bizModal) bizModal.hidden = true; });
  }

  window.PickmapNegocio = {
    getBusiness, getReservations, fmtMoney, fmtDate, fmtDateShort, isActive, isPaid, NOW, openReservationModal,
  };

  /* ---------- Shared nav / logout ---------- */
  const logoutBtn = document.getElementById('bizLogoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      window.location.href = 'index.html#alianzas';
    });
  }

  const greetEl = document.getElementById('bizGreeting');
  if (greetEl) {
    const biz = getBusiness();
    greetEl.textContent = `Hola, ${biz.name} 👋`;
  }
})();
