(() => {
  const N = window.PickmapNegocio;
  const { fmtMoney, fmtDateShort, isActive, isPaid, NOW } = N;
  const reservations = N.getReservations();
  const business = N.getBusiness();

  const historico = reservations.filter(isPaid).reduce((sum, r) => sum + r.monto, 0);

  const thisMonth = reservations.filter((r) => isPaid(r) && r.fecha.getMonth() === NOW.getMonth() && r.fecha.getFullYear() === NOW.getFullYear());
  const mesTotal = thisMonth.reduce((sum, r) => sum + r.monto, 0);

  const activas = reservations.filter(isActive);

  document.getElementById('statHistorico').textContent = fmtMoney(historico);
  document.getElementById('statMes').textContent = fmtMoney(mesTotal);
  document.getElementById('statMesNote').textContent = `${thisMonth.length} reserva${thisMonth.length === 1 ? '' : 's'} completada${thisMonth.length === 1 ? '' : 's'}`;
  document.getElementById('statActivas').textContent = activas.length;

  // Bug real: esto era activasMonto*0.4 (40% de reservas AÚN NO
  // completadas) — un número inventado que contradice "nunca se paga por
  // adelantado". El próximo pago real es la liquidación de reservas YA
  // completadas cuyo paidOn todavía no llega (ver proximoPagoPendiente en
  // js/negocio.js, mismo agrupamiento que usa el historial de Pagos).
  const proximoPago = N.proximoPagoPendiente();
  document.getElementById('statProximoPago').textContent = fmtMoney(proximoPago ? proximoPago.total : 0);
  document.getElementById('statProximoPagoFecha').textContent = proximoPago ? fmtDateShort(proximoPago.paidOn) : 'Sin pagos pendientes';

  // Chart: last 6 months ingresos. Bug real pedido por el usuario: el
  // gráfico era solo decorativo — apretar una barra no hacía nada. Ahora
  // cada columna guarda las reservas reales de ese mes (no solo el total)
  // para poder abrir un desglose real al hacer click.
  const chart = document.getElementById('bizChart');
  const monthTotals = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(NOW.getFullYear(), NOW.getMonth() - i, 1);
    const reservasDelMes = reservations.filter((r) => isPaid(r) && r.fecha.getMonth() === d.getMonth() && r.fecha.getFullYear() === d.getFullYear());
    const total = reservasDelMes.reduce((sum, r) => sum + r.monto, 0);
    monthTotals.push({
      label: d.toLocaleDateString('es-CL', { month: 'short' }),
      labelLargo: d.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' }),
      total, isCurrent: i === 0, reservas: reservasDelMes,
    });
  }
  // Línea SVG en vez de barras — instrucción del usuario: el bar chart se
  // veía innecesariamente largo/pesado. viewBox fijo con puntos distribuidos
  // en X; cada punto sigue siendo clickeable (mismo openMonthModal de antes).
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
    const y = padTop + plotH - (m.total / max) * plotH;
    return { ...m, x, y };
  });
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${(padTop + plotH).toFixed(1)} L${points[0].x.toFixed(1)},${(padTop + plotH).toFixed(1)} Z`;

  chart.innerHTML = `
    <svg class="biz-chart__svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Ingresos de los últimos 6 meses">
      <defs>
        <linearGradient id="bizChartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style="stop-color: var(--coral); stop-opacity: 0.22"></stop>
          <stop offset="100%" style="stop-color: var(--coral); stop-opacity: 0"></stop>
        </linearGradient>
      </defs>
      <path class="biz-chart__area" d="${areaPath}"></path>
      <path class="biz-chart__line" d="${linePath}"></path>
      ${points.map((p) => `
        <text class="biz-chart__amt" x="${p.x.toFixed(1)}" y="${(p.y - 10).toFixed(1)}">${p.total > 0 ? fmtMoney(p.total) : '—'}</text>
        <text class="biz-chart__label" x="${p.x.toFixed(1)}" y="${H - 4}">${p.label}</text>
        <circle class="biz-chart__pt${p.isCurrent ? ' is-current' : ''}" id="bizChartPt${points.indexOf(p)}" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4"></circle>
      `).join('')}
      ${points.map((p, i) => `
        <circle class="biz-chart__hit" data-mes-idx="${i}" tabindex="0" role="button" aria-label="Ver desglose de ${p.labelLargo}" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="16"></circle>
      `).join('')}
    </svg>
  `;
  chart.querySelectorAll('.biz-chart__hit').forEach((hit) => {
    const idx = Number(hit.dataset.mesIdx);
    const pt = document.getElementById(`bizChartPt${idx}`);
    const grow = () => pt && pt.setAttribute('r', '6');
    const shrink = () => pt && pt.setAttribute('r', '4');
    hit.addEventListener('mouseenter', grow);
    hit.addEventListener('mouseleave', shrink);
    hit.addEventListener('focus', grow);
    hit.addEventListener('blur', shrink);
    const abrir = () => {
      const m = monthTotals[idx];
      N.openMonthModal(m.labelLargo, m.reservas);
    };
    hit.addEventListener('click', abrir);
    hit.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); } });
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
