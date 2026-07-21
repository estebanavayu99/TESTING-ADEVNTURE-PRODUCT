(() => {
  const N = window.PickmapNegocio;
  if (!N) return;

  const biz = N.getBusiness();
  const avatarEl = document.getElementById('bizAvatar');
  const navAvatarEl = document.getElementById('bizNavAvatar');
  const AVATAR_COLORS = ['var(--coral)', 'var(--navy)', 'var(--green)', 'var(--deep-red)'];
  function initialsOf(name) {
    const parts = (name || '').trim().split(/\s+/);
    return ((parts[0] || '')[0] || '') + ((parts[1] || '')[0] || '');
  }
  [avatarEl, navAvatarEl].forEach((el) => {
    if (!el) return;
    const initials = initialsOf(biz.name).toUpperCase() || 'PM';
    el.textContent = initials;
    el.style.background = AVATAR_COLORS[Math.abs(initials.charCodeAt(0) || 0) % AVATAR_COLORS.length];
    el.title = biz.name;
    el.hidden = false;
  });

  document.getElementById('bizLogoutBtn').addEventListener('click', () => {
    localStorage.removeItem('pickmap_business_session');
    window.location.href = 'index.html#alianzas';
  });

  const ICONS = ['🏕️', '🛖', '🔥', '🍽️', '🌅', '🚣'];

  function renderServicios() {
    const services = N.getServices();
    const list = document.getElementById('serviciosList');
    const empty = document.getElementById('serviciosEmpty');
    if (!services.length) {
      empty.hidden = false;
      list.innerHTML = '';
      return;
    }
    empty.hidden = true;
    list.innerHTML = services.map((s, i) => `
      <li class="biz-service">
        <span class="biz-service__icon">${ICONS[i % ICONS.length]}</span>
        <div class="biz-service__info">
          <p class="biz-service__name">${s.nombre}</p>
          <p class="biz-service__meta">Hasta ${s.capacidad} personas · Inscrito</p>
        </div>
        <span class="biz-service__amt">${N.fmtMoney(s.precio)}</span>
      </li>
    `).join('');
  }

  function renderSolicitudes() {
    const requests = N.getServiceRequests();
    const section = document.getElementById('solicitudesSection');
    const list = document.getElementById('solicitudesList');
    if (!requests.length) {
      section.hidden = true;
      return;
    }
    section.hidden = false;
    list.innerHTML = requests.map((r) => `
      <li class="biz-res">
        <div class="biz-res__info">
          <p class="biz-res__client">${r.tipo === 'edicion' ? `Editar: ${r.servicioOriginalNombre || '—'} → ${r.nombre}` : r.nombre}</p>
          <p class="biz-res__meta">${r.precioSugerido ? N.fmtMoney(r.precioSugerido) + ' · ' : ''}${N.fmtDate(new Date(r.fecha))}</p>
        </div>
        <span class="biz-res__status biz-res__status--pendiente">Pendiente de revisión</span>
      </li>
    `).join('');
  }

  renderServicios();
  renderSolicitudes();

  // Toggle "agregar nuevo" vs "editar existente" — instrucción explícita
  // del usuario: la solicitud no es solo para servicios nuevos, también
  // para pedir cambios a uno ya inscrito. El picker de "servicio a editar"
  // se puebla desde N.getServices() (los mismos servicios ya listados
  // arriba); los campos nombre/descripción pasan a representar el "cambio
  // propuesto", no una réplica del servicio actual (no se auto-rellenan,
  // para no parecer que ya quedó guardado así).
  const tipoNuevo = document.getElementById('servicioTipoNuevo');
  const tipoEdicion = document.getElementById('servicioTipoEdicion');
  const editarField = document.getElementById('servicioAEditarField');
  const editarSelect = document.getElementById('servicioAEditar');
  const nombreLabel = document.getElementById('servicioNombreLabel');
  const descripcionLabel = document.getElementById('servicioDescripcionLabel');
  const nombreInput = document.getElementById('servicioNombre');

  const services = N.getServices();
  editarSelect.innerHTML = services.map((s) => `<option value="${s.id}">${s.nombre}</option>`).join('');

  function applyTipoUI() {
    const esEdicion = tipoEdicion.checked;
    editarField.hidden = !esEdicion;
    editarSelect.required = esEdicion;
    nombreLabel.textContent = esEdicion ? 'Nuevo nombre (si cambia)' : 'Nombre del servicio';
    descripcionLabel.textContent = esEdicion ? 'Qué quieres cambiar' : 'Descripción';
    nombreInput.placeholder = esEdicion ? 'Deja el nombre actual si no cambia' : 'Ej: Tour nocturno de estrellas';
  }
  tipoNuevo.addEventListener('change', applyTipoUI);
  tipoEdicion.addEventListener('change', applyTipoUI);
  applyTipoUI();

  const form = document.getElementById('servicioRequestForm');
  const feedback = document.getElementById('servicioFeedback');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const tipo = tipoEdicion.checked ? 'edicion' : 'nuevo';
    const nombre = nombreInput.value.trim();
    const descripcion = document.getElementById('servicioDescripcion').value.trim();
    const precioSugerido = Number(document.getElementById('servicioPrecio').value) || null;
    if (!nombre || !descripcion) {
      feedback.textContent = 'Escribe al menos el nombre y la descripción del servicio.';
      feedback.classList.add('is-error');
      return;
    }
    if (tipo === 'edicion' && !editarSelect.value) {
      feedback.textContent = 'Selecciona qué servicio quieres editar.';
      feedback.classList.add('is-error');
      return;
    }
    const servicioOriginal = tipo === 'edicion'
      ? services.find((s) => String(s.id) === editarSelect.value)
      : null;
    N.solicitarServicio(tipo, nombre, descripcion, precioSugerido, servicioOriginal);
    form.reset();
    applyTipoUI();
    feedback.textContent = '¡Listo! Te avisamos por correo cuando lo revisemos.';
    feedback.classList.remove('is-error');
    renderSolicitudes();
  });
})();
