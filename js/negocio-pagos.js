(() => {
  const N = window.PickmapNegocio;
  const { fmtMoney, fmtDate, fmtDateShort, isActive, isPaid, NOW } = N;
  const reservations = N.getReservations();
  const business = N.getBusiness();
  const paid = reservations.filter(isPaid);

  /* ---------- Próximo pago ---------- */
  const activasMonto = reservations.filter(isActive).reduce((sum, r) => sum + r.monto, 0);
  const nextMonday = new Date(NOW);
  nextMonday.setDate(NOW.getDate() + ((8 - NOW.getDay()) % 7 || 7));
  document.getElementById('payNextAmt').textContent = fmtMoney(activasMonto * 0.4);
  document.getElementById('payNextDate').textContent = `Se paga el ${fmtDate(nextMonday)}`;
  document.getElementById('payNextMethod').textContent = business.paymentMethod;

  /* ---------- Generado por período ---------- */
  function startOfWeek(d) {
    const x = new Date(d);
    const day = x.getDay();
    x.setDate(x.getDate() - ((day + 6) % 7));
    x.setHours(0, 0, 0, 0);
    return x;
  }
  const weekStart = startOfWeek(NOW);

  const periods = {
    semana: paid.filter((r) => r.fecha >= weekStart).reduce((s, r) => s + r.monto, 0),
    mes: paid.filter((r) => r.fecha.getMonth() === NOW.getMonth() && r.fecha.getFullYear() === NOW.getFullYear()).reduce((s, r) => s + r.monto, 0),
    historico: paid.reduce((s, r) => s + r.monto, 0),
  };
  const periodCounts = {
    semana: paid.filter((r) => r.fecha >= weekStart).length,
    mes: paid.filter((r) => r.fecha.getMonth() === NOW.getMonth() && r.fecha.getFullYear() === NOW.getFullYear()).length,
    historico: paid.length,
  };

  const periodAmt = document.getElementById('payPeriodAmt');
  const periodNote = document.getElementById('payPeriodNote');
  const periodBtns = document.querySelectorAll('.biz-period-btn');

  function showPeriod(key) {
    periodBtns.forEach((b) => b.classList.toggle('is-active', b.dataset.period === key));
    periodAmt.textContent = fmtMoney(periods[key]);
    const n = periodCounts[key];
    periodNote.textContent = `${n} reserva${n === 1 ? '' : 's'} completada${n === 1 ? '' : 's'}`;
  }
  periodBtns.forEach((b) => b.addEventListener('click', () => showPeriod(b.dataset.period)));
  showPeriod('mes');

  /* ---------- Historial de liquidaciones (agrupado por semana) ---------- */
  const groups = new Map();
  paid.forEach((r) => {
    const ws = startOfWeek(r.fecha).getTime();
    if (!groups.has(ws)) groups.set(ws, { total: 0, count: 0, start: new Date(ws) });
    const g = groups.get(ws);
    g.total += r.monto;
    g.count += 1;
  });

  const liqList = document.getElementById('bizLiqList');
  const sorted = [...groups.values()]
    .map((g) => {
      const end = new Date(g.start);
      end.setDate(end.getDate() + 6);
      const paidOn = new Date(end);
      paidOn.setDate(paidOn.getDate() + 3);
      return { ...g, end, paidOn };
    })
    .filter((g) => g.paidOn <= NOW)
    .sort((a, b) => b.start - a.start);

  if (!sorted.length) {
    liqList.innerHTML = '<li class="biz-res-list__empty">Todavía no hay liquidaciones pagadas.</li>';
  } else {
    liqList.innerHTML = sorted.map((g) => `
        <li class="biz-liq">
          <span class="biz-liq__icon">💰</span>
          <div class="biz-liq__info">
            <p class="biz-liq__period">Semana del ${fmtDateShort(g.start)} al ${fmtDateShort(g.end)}</p>
            <p class="biz-liq__sub">${g.count} reserva${g.count === 1 ? '' : 's'} · pagada el ${fmtDateShort(g.paidOn)}</p>
          </div>
          <span class="biz-liq__amt">${fmtMoney(g.total)}</span>
        </li>
    `).join('');
  }
})();
