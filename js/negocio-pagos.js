(() => {
  const N = window.PickmapNegocio;
  const { fmtMoney, fmtDate, fmtDateShort, isPaid, NOW } = N;
  const reservations = N.getReservations();
  const business = N.getBusiness();
  const paid = reservations.filter(isPaid);

  /* ---------- Próximo pago ---------- */
  // Bug real: esto era activasMonto*0.4 (40% de reservas AÚN NO
  // completadas) — un número inventado que contradice "nunca se paga por
  // adelantado". El próximo pago real es la liquidación de reservas YA
  // completadas cuyo paidOn todavía no llega (ver proximoPagoPendiente en
  // js/negocio.js, mismo agrupamiento que el historial de liquidaciones).
  const proximoPago = N.proximoPagoPendiente();
  if (proximoPago) {
    document.getElementById('payNextAmt').textContent = fmtMoney(proximoPago.total);
    document.getElementById('payNextDate').textContent = `${proximoPago.count} reserva${proximoPago.count === 1 ? '' : 's'} · se paga el ${fmtDate(proximoPago.paidOn)}`;
  } else {
    document.getElementById('payNextAmt').textContent = fmtMoney(0);
    document.getElementById('payNextDate').textContent = 'Sin pagos pendientes por ahora';
  }
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

  // Correo real de "te pagamos" (instrucción explícita del usuario, evento =
  // liquidación semanal). El reloj de este demo es fijo (NOW = 2026-07-11),
  // así que no hay un cron real que "acabe de pagar" algo — para no
  // mandar un correo por cada semana de historial la primera vez que el
  // negocio visita esta página, solo se dispara cuando aparece una
  // liquidación MÁS NUEVA que la última que ya vimos (guardado en esta
  // misma key); la primera visita solo establece esa base, sin notificar.
  if (sorted.length) {
    const email = window.PickmapNegocio.getBusinessEmail ? window.PickmapNegocio.getBusinessEmail() : null;
    if (email) {
      const seenKey = `pickmap_business_last_liq_notified_${email}`;
      const lastSeen = Number(localStorage.getItem(seenKey) || 0);
      const latest = sorted[0];
      if (latest.start.getTime() > lastSeen) {
        if (lastSeen !== 0) {
          fetch('/api/send-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tipo: 'pago-liquidacion-empresa',
              email,
              datos: {
                periodo: `${fmtDateShort(latest.start)} al ${fmtDateShort(latest.end)}`,
                reservas: latest.count,
                monto: fmtMoney(latest.total),
                metodo: business.paymentMethod,
                link: `${window.location.origin}/negocio-pagos.html`,
              },
            }),
          }).catch(() => {});
        }
        localStorage.setItem(seenKey, String(latest.start.getTime()));
      }
    }
  }
})();
