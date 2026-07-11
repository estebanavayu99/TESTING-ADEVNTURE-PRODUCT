(() => {
  const N = window.PickmapNegocio;
  const { NOW } = N;
  const reservations = N.getReservations();

  const byDay = new Map();
  reservations.forEach((r) => {
    const key = `${r.fecha.getFullYear()}-${r.fecha.getMonth()}-${r.fecha.getDate()}`;
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(r);
  });

  const MONTH_NAMES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  let viewYear = NOW.getFullYear();
  let viewMonth = NOW.getMonth();

  const monthLabel = document.getElementById('calMonthLabel');
  const grid = document.getElementById('calGrid');

  function renderMonth() {
    const monthDate = new Date(viewYear, viewMonth, 1);
    monthLabel.textContent = `${MONTH_NAMES[viewMonth].charAt(0).toUpperCase() + MONTH_NAMES[viewMonth].slice(1)} ${viewYear}`;

    const firstWeekday = (monthDate.getDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const isCurrentMonth = viewYear === NOW.getFullYear() && viewMonth === NOW.getMonth();

    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    grid.innerHTML = cells.map((day) => {
      if (!day) return '<div class="biz-cal__cell biz-cal__cell--empty"></div>';
      const key = `${viewYear}-${viewMonth}-${day}`;
      const dayReservations = byDay.get(key) || [];
      const isToday = isCurrentMonth && day === NOW.getDate();
      const dots = dayReservations.slice(0, 4).map((r) => `<span class="biz-cal__dot biz-cal__dot--${r.estado}" data-id="${r.id}" title="${r.cliente} · ${r.actividad}"></span>`).join('');
      const extra = dayReservations.length > 4 ? `<span class="biz-cal__more">+${dayReservations.length - 4}</span>` : '';
      return `
        <div class="biz-cal__cell ${isToday ? 'is-today' : ''}">
          <span class="biz-cal__day">${day}</span>
          <div class="biz-cal__dots">${dots}${extra}</div>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.biz-cal__dot[data-id]').forEach((dot) => {
      dot.addEventListener('click', () => {
        const r = reservations.find((x) => x.id === Number(dot.dataset.id));
        if (r) N.openReservationModal(r);
      });
    });
  }

  document.getElementById('calPrev').addEventListener('click', () => {
    viewMonth--;
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    renderMonth();
  });
  document.getElementById('calNext').addEventListener('click', () => {
    viewMonth++;
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    renderMonth();
  });

  renderMonth();
})();
