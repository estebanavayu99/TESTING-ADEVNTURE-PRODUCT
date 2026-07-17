(() => {
  const N = window.PickmapNegocio;
  const { fmtDate } = N;
  const reviews = N.getReviews();

  function escapeHTML(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

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

  // Instrucción explícita del usuario: el panel no tenía forma de
  // responder una reseña — solo se podían mirar. Reseñas sin respuesta
  // muestran un botón "Responder" que abre un textarea inline (mismo
  // patrón que el motivo de rechazo de reservas); reseñas ya respondidas
  // muestran la respuesta en vez del botón.
  function filaHTML(r) {
    const respuestaHTML = r.respuesta
      ? `
        <div class="biz-review__respuesta">
          <p class="biz-review__respuesta-label">Tu respuesta${r.respuestaFecha ? ` · ${fmtDate(new Date(r.respuestaFecha))}` : ''}</p>
          <p class="biz-review__respuesta-texto">${escapeHTML(r.respuesta)}</p>
        </div>
      `
      : `
        <button type="button" class="auth-link biz-review__btn-responder" data-id="${r.id}">Responder</button>
        <div class="biz-review__respuesta-form" data-form-id="${r.id}" hidden>
          <textarea class="biz-modal__motivo-input" rows="3" placeholder="Escribe tu respuesta pública a este cliente..."></textarea>
          <p class="biz-modal__motivo-error" hidden>Escribe algo antes de enviar tu respuesta.</p>
          <div class="biz-modal__acciones-btns">
            <button type="button" class="btn btn--primary biz-review__btn-enviar" data-id="${r.id}">Enviar respuesta</button>
            <button type="button" class="auth-link biz-review__btn-cancelar" data-id="${r.id}">Cancelar</button>
          </div>
        </div>
      `;
    return `
      <li class="biz-review" data-id="${r.id}">
        <div class="biz-review__head">
          <p class="biz-review__client">${r.cliente}</p>
          <span class="biz-review__stars">${'⭐'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
        </div>
        <p class="biz-review__meta">${r.actividad} · ${fmtDate(r.fecha)}</p>
        <p class="biz-review__comment">${r.comentario}</p>
        ${respuestaHTML}
      </li>
    `;
  }

  const list = document.getElementById('reviewList');
  if (!reviews.length) {
    list.innerHTML = '<li class="biz-res-list__empty">Todavía no tienes reseñas.</li>';
  } else {
    list.innerHTML = reviews.map(filaHTML).join('');
    list.addEventListener('click', (e) => {
      const btnResponder = e.target.closest('.biz-review__btn-responder');
      if (btnResponder) {
        const form = list.querySelector(`[data-form-id="${btnResponder.dataset.id}"]`);
        if (form) { form.hidden = false; form.querySelector('textarea').focus(); }
        return;
      }
      const btnCancelar = e.target.closest('.biz-review__btn-cancelar');
      if (btnCancelar) {
        const form = list.querySelector(`[data-form-id="${btnCancelar.dataset.id}"]`);
        if (form) form.hidden = true;
        return;
      }
      const btnEnviar = e.target.closest('.biz-review__btn-enviar');
      if (btnEnviar) {
        const id = Number(btnEnviar.dataset.id);
        const form = list.querySelector(`[data-form-id="${id}"]`);
        const texto = (form.querySelector('textarea').value || '').trim();
        if (!texto) { form.querySelector('.biz-modal__motivo-error').hidden = false; return; }
        N.responderResena(id, texto);
        window.location.reload();
      }
    });
  }
})();
