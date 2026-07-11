(() => {
  const N = window.PickmapNegocio;
  const { fmtMoney, isActive, isPaid } = N;
  const reservations = N.getReservations();

  const activas = reservations.filter(isActive);
  const historial = reservations.filter((r) => r.estado === 'completada' || r.estado === 'cancelada').slice().sort((a, b) => b.fecha - a.fecha);

  const tabActivas = document.getElementById('tabActivas');
  const tabHistorial = document.getElementById('tabHistorial');
  const list = document.getElementById('bizResList');

  document.getElementById('countActivas').textContent = activas.length;
  document.getElementById('countHistorial').textContent = historial.length;

  function renderList(items, mode) {
    if (!items.length) {
      list.innerHTML = `<li class="biz-res-list__empty">${mode === 'activas' ? 'No tienes reservas activas por ahora.' : 'Todavía no hay historial.'}</li>`;
      return;
    }
    list.innerHTML = items.map((r) => `
      <li class="biz-res" data-id="${r.id}">
        <div class="biz-res__date">
          <span class="biz-res__date-day">${r.fecha.getDate()}</span>
          <span class="biz-res__date-mon">${r.fecha.toLocaleDateString('es-CL', { month: 'short' })}</span>
        </div>
        <div class="biz-res__info">
          <p class="biz-res__client">${r.cliente}</p>
          <p class="biz-res__meta">${r.actividad} · ${r.personas} personas</p>
        </div>
        <span class="biz-res__amt">${r.estado === 'cancelada' ? '—' : fmtMoney(r.monto)}</span>
        <span class="biz-res__status biz-res__status--${r.estado}">${r.estado}</span>
      </li>
    `).join('');
    list.querySelectorAll('.biz-res').forEach((el) => {
      el.addEventListener('click', () => {
        const r = reservations.find((x) => x.id === Number(el.dataset.id));
        if (r) N.openReservationModal(r);
      });
    });
  }

  function showTab(mode) {
    tabActivas.classList.toggle('is-active', mode === 'activas');
    tabHistorial.classList.toggle('is-active', mode === 'historial');
    renderList(mode === 'activas' ? activas : historial, mode);
  }

  tabActivas.addEventListener('click', () => showTab('activas'));
  tabHistorial.addEventListener('click', () => showTab('historial'));

  showTab('activas');
})();
