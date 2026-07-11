(() => {
  const N = window.PickmapNegocio;
  const { fmtDate } = N;
  const reviews = N.getReviews();

  const total = reviews.length;
  const avg = total ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
  const positive = reviews.filter((r) => r.rating >= 4).length;
  const positivePct = total ? Math.round((positive / total) * 100) : 0;

  document.getElementById('reviewAvg').textContent = `${avg.toFixed(1)} ⭐`;
  document.getElementById('reviewTotal').textContent = total;
  document.getElementById('reviewPositive').textContent = `${positivePct}%`;

  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => { counts[r.rating]++; });
  const maxCount = Math.max(...Object.values(counts), 1);

  const breakdown = document.getElementById('reviewBreakdown');
  breakdown.innerHTML = [5, 4, 3, 2, 1].map((star) => `
    <div class="biz-rating-row">
      <span class="biz-rating-row__label">${star} ⭐</span>
      <div class="biz-rating-row__track"><span class="biz-rating-row__fill" style="width: ${(counts[star] / maxCount) * 100}%"></span></div>
      <span class="biz-rating-row__count">${counts[star]}</span>
    </div>
  `).join('');

  const list = document.getElementById('reviewList');
  if (!reviews.length) {
    list.innerHTML = '<li class="biz-res-list__empty">Todavía no tienes reseñas.</li>';
  } else {
    list.innerHTML = reviews.map((r) => `
      <li class="biz-review">
        <div class="biz-review__head">
          <p class="biz-review__client">${r.cliente}</p>
          <span class="biz-review__stars">${'⭐'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
        </div>
        <p class="biz-review__meta">${r.actividad} · ${fmtDate(r.fecha)}</p>
        <p class="biz-review__comment">${r.comentario}</p>
      </li>
    `).join('');
  }
})();
