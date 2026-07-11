(() => {
  const N = window.PickmapNegocio;
  const { fmtMoney, fmtDateShort, isActive, isPaid, NOW } = N;
  const reservations = N.getReservations();
  const business = N.getBusiness();

  const historico = reservations.filter(isPaid).reduce((sum, r) => sum + r.monto, 0);

  const thisMonth = reservations.filter((r) => isPaid(r) && r.fecha.getMonth() === NOW.getMonth() && r.fecha.getFullYear() === NOW.getFullYear());
  const mesTotal = thisMonth.reduce((sum, r) => sum + r.monto, 0);

  const activas = reservations.filter(isActive);
  const activasMonto = activas.reduce((sum, r) => sum + r.monto, 0);

  document.getElementById('statHistorico').textContent = fmtMoney(historico);
  document.getElementById('statMes').textContent = fmtMoney(mesTotal);
  document.getElementById('statMesNote').textContent = `${thisMonth.length} reserva${thisMonth.length === 1 ? '' : 's'} completada${thisMonth.length === 1 ? '' : 's'}`;
  document.getElementById('statActivas').textContent = activas.length;

  // Próximo pago: liquidación semanal, siempre el próximo lunes
  const nextMonday = new Date(NOW);
  nextMonday.setDate(NOW.getDate() + ((8 - NOW.getDay()) % 7 || 7));
  document.getElementById('statProximoPago').textContent = fmtMoney(activasMonto * 0.4);
  document.getElementById('statProximoPagoFecha').textContent = fmtDateShort(nextMonday);

  // Chart: last 6 months ingresos
  const chart = document.getElementById('bizChart');
  const monthTotals = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(NOW.getFullYear(), NOW.getMonth() - i, 1);
    const total = reservations
      .filter((r) => isPaid(r) && r.fecha.getMonth() === d.getMonth() && r.fecha.getFullYear() === d.getFullYear())
      .reduce((sum, r) => sum + r.monto, 0);
    monthTotals.push({ label: d.toLocaleDateString('es-CL', { month: 'short' }), total, isCurrent: i === 0 });
  }
  const max = Math.max(...monthTotals.map((m) => m.total), 1);
  chart.innerHTML = monthTotals.map((m) => `
    <div class="biz-chart__col ${m.isCurrent ? 'is-current' : ''}">
      <span class="biz-chart__amt">${m.total > 0 ? fmtMoney(m.total) : '—'}</span>
      <div class="biz-chart__bar" data-h="${Math.max((m.total / max) * 100, 3)}"></div>
      <span class="biz-chart__label">${m.label}</span>
    </div>
  `).join('');
  requestAnimationFrame(() => {
    chart.querySelectorAll('.biz-chart__bar').forEach((bar) => {
      bar.style.height = bar.dataset.h + '%';
    });
  });

  // Upcoming reservations preview
  const list = document.getElementById('bizUpcomingList');
  const upcoming = activas.slice(0, 5);
  if (!upcoming.length) {
    list.innerHTML = '<li class="biz-res-list__empty">No tienes reservas activas por ahora.</li>';
  } else {
    list.innerHTML = upcoming.map((r) => `
      <li class="biz-res" data-id="${r.id}">
        <div class="biz-res__date">
          <span class="biz-res__date-day">${r.fecha.getDate()}</span>
          <span class="biz-res__date-mon">${r.fecha.toLocaleDateString('es-CL', { month: 'short' })}</span>
        </div>
        <div class="biz-res__info">
          <p class="biz-res__client">${r.cliente}</p>
          <p class="biz-res__meta">${r.actividad} · ${r.personas} personas</p>
        </div>
        <span class="biz-res__amt">${fmtMoney(r.monto)}</span>
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
})();
