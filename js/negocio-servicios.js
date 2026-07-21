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
          <p class="biz-res__client">${r.nombre}</p>
          <p class="biz-res__meta">${r.precioSugerido ? N.fmtMoney(r.precioSugerido) + ' · ' : ''}${N.fmtDate(new Date(r.fecha))}</p>
        </div>
        <span class="biz-res__status biz-res__status--pendiente">Pendiente de revisión</span>
      </li>
    `).join('');
  }

  renderServicios();
  renderSolicitudes();

  const form = document.getElementById('servicioRequestForm');
  const feedback = document.getElementById('servicioFeedback');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = document.getElementById('servicioNombre').value.trim();
    const descripcion = document.getElementById('servicioDescripcion').value.trim();
    const precioSugerido = Number(document.getElementById('servicioPrecio').value) || null;
    if (!nombre || !descripcion) {
      feedback.textContent = 'Escribe al menos el nombre y la descripción del servicio.';
      feedback.classList.add('is-error');
      return;
    }
    N.solicitarNuevoServicio(nombre, descripcion, precioSugerido);
    form.reset();
    feedback.textContent = '¡Listo! Te avisamos por correo cuando lo revisemos.';
    feedback.classList.remove('is-error');
    renderSolicitudes();
  });
})();
