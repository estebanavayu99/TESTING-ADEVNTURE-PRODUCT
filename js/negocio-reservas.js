(() => {
  const N = window.PickmapNegocio;
  const { fmtMoney, isActive, isPaid } = N;
  const reservations = N.getReservations();

  const activas = reservations.filter(isActive);
  // 'rechazada' no es activa (ya no espera acción) pero sí debe quedar
  // visible en algún lado — sin este estado en el filtro, una reserva
  // rechazada desaparecía de ambas pestañas.
  const historial = reservations.filter((r) => r.estado === 'completada' || r.estado === 'cancelada' || r.estado === 'rechazada').slice().sort((a, b) => b.fecha - a.fecha);

  const tabActivas = document.getElementById('tabActivas');
  const tabHistorial = document.getElementById('tabHistorial');
  const list = document.getElementById('bizResList');

  document.getElementById('countActivas').textContent = activas.length;
  document.getElementById('countHistorial').textContent = historial.length;

  // Bug real pedido por el usuario: aceptar/rechazar solo estaba disponible
  // dentro del modal de detalle (había que abrir la reserva primero) — acá
  // se ofrece directo en la fila de la lista para 'pendiente', con la misma
  // casilla de motivo obligatoria al rechazar (mismo mecanismo que el modal
  // compartido de js/negocio.js, vía N.actualizarEstadoReserva).
  function filaHTML(r) {
    const accionesInline = r.estado === 'pendiente'
      ? `
        <div class="biz-res__inline-acciones">
          <button type="button" class="btn btn--primary biz-res__btn-aceptar" data-id="${r.id}">Aceptar</button>
          <button type="button" class="btn btn--ghost biz-res__btn-rechazar" data-id="${r.id}">Rechazar</button>
        </div>
      `
      : `<span class="biz-res__status biz-res__status--${r.estado}">${r.estado}</span>`;
    const filaMotivo = r.estado === 'pendiente'
      ? `
        <li class="biz-res__motivo-row" data-motivo-id="${r.id}" hidden>
          <label for="lista-motivo-${r.id}">Motivo del rechazo (el cliente lo verá)</label>
          <textarea id="lista-motivo-${r.id}" class="biz-modal__motivo-input" rows="2" placeholder="Ej: no tenemos cupo disponible para esa fecha"></textarea>
          <p class="biz-modal__motivo-error" hidden>Cuéntanos el motivo antes de rechazar.</p>
          <div class="biz-modal__acciones-btns">
            <button type="button" class="btn btn--primary biz-res__btn-confirmar-rechazo" data-id="${r.id}">Confirmar rechazo</button>
            <button type="button" class="biz-linkbtn biz-res__btn-cancelar-rechazo" data-id="${r.id}">Cancelar</button>
          </div>
        </li>
      `
      : '';
    return `
      <li class="biz-res" data-id="${r.id}">
        <div class="biz-res__date">
          <span class="biz-res__date-day">${r.fecha.getDate()}</span>
          <span class="biz-res__date-mon">${r.fecha.toLocaleDateString('es-CL', { month: 'short' })}</span>
        </div>
        <div class="biz-res__info">
          <p class="biz-res__client">${r.cliente}</p>
          <p class="biz-res__meta">${r.actividad} · ${r.personas} personas</p>
        </div>
        <span class="biz-res__amt">${(r.estado === 'cancelada' || r.estado === 'rechazada') ? '—' : fmtMoney(r.monto)}</span>
        ${accionesInline}
      </li>
      ${filaMotivo}
    `;
  }

  function renderList(items, mode) {
    if (!items.length) {
      list.innerHTML = `<li class="biz-res-list__empty">${mode === 'activas' ? 'No tienes reservas activas por ahora.' : 'Todavía no hay historial.'}</li>`;
      return;
    }
    list.innerHTML = items.map(filaHTML).join('');
    list.querySelectorAll('.biz-res').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.biz-res__inline-acciones')) return; // botones propios, no abrir el modal
        const r = reservations.find((x) => x.id === Number(el.dataset.id));
        if (r) N.openReservationModal(r);
      });
    });
  }

  // Delegado una sola vez: sobrevive a cada re-render de renderList sin
  // tener que re-adjuntar listeners por fila.
  list.addEventListener('click', (e) => {
    const btnAceptar = e.target.closest('.biz-res__btn-aceptar');
    if (btnAceptar) {
      e.stopPropagation();
      N.actualizarEstadoReserva(Number(btnAceptar.dataset.id), 'confirmada');
      window.location.reload();
      return;
    }
    const btnRechazar = e.target.closest('.biz-res__btn-rechazar');
    if (btnRechazar) {
      e.stopPropagation();
      const fila = list.querySelector(`[data-motivo-id="${btnRechazar.dataset.id}"]`);
      if (fila) { fila.hidden = false; fila.querySelector('textarea').focus(); }
      return;
    }
    const btnCancelar = e.target.closest('.biz-res__btn-cancelar-rechazo');
    if (btnCancelar) {
      e.stopPropagation();
      const fila = list.querySelector(`[data-motivo-id="${btnCancelar.dataset.id}"]`);
      if (fila) fila.hidden = true;
      return;
    }
    const btnConfirmar = e.target.closest('.biz-res__btn-confirmar-rechazo');
    if (btnConfirmar) {
      e.stopPropagation();
      const id = Number(btnConfirmar.dataset.id);
      const fila = list.querySelector(`[data-motivo-id="${id}"]`);
      const motivo = (fila.querySelector('textarea').value || '').trim();
      if (!motivo) { fila.querySelector('.biz-modal__motivo-error').hidden = false; return; }
      N.actualizarEstadoReserva(id, 'rechazada', motivo);
      window.location.reload();
    }
  });

  function showTab(mode) {
    tabActivas.classList.toggle('is-active', mode === 'activas');
    tabHistorial.classList.toggle('is-active', mode === 'historial');
    renderList(mode === 'activas' ? activas : historial, mode);
  }

  tabActivas.addEventListener('click', () => showTab('activas'));
  tabHistorial.addEventListener('click', () => showTab('historial'));

  showTab('activas');
})();
