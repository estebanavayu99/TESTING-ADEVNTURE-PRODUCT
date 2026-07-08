(() => {
  const USERS_KEY = 'pickmap_users';
  const SESSION_KEY = 'pickmap_current_user';

  const email = localStorage.getItem(SESSION_KEY);
  if (!email) {
    window.location.href = 'login.html';
    return;
  }

  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  const user = users.find((u) => u.email === email);
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = 'index.html';
  });

  const TASTE_POOL = [
    { taste: 'naturaleza', kind: 'simple', icon: '🌲', title: 'Canopy en el Cajón del Maipo', meta: 'A 40 min · Medio día', reason: 'te gusta la naturaleza y la aventura' },
    { taste: 'naturaleza', kind: 'paquete', icon: '🛖', title: 'Trekking + cabaña con tinaja', meta: 'Paquete de 2 días', reason: 'te gusta la naturaleza y quieres desconectarte sin organizar nada' },
    { taste: 'gastronomia', kind: 'simple', icon: '🍽️', title: 'Ruta de restoranes de autor', meta: 'Centro · Noche', reason: 'te gusta la buena mesa' },
    { taste: 'gastronomia', kind: 'paquete', icon: '🍷', title: 'Tour de vinos + almuerzo maridado', meta: 'Paquete de un día', reason: 'te gusta la gastronomía y probar cosas nuevas' },
    { taste: 'relax', kind: 'simple', icon: '🧖', title: 'Tarde de spa y masajes', meta: 'A 20 min', reason: 'te gusta el relax y el spa' },
    { taste: 'relax', kind: 'paquete', icon: '♨️', title: 'Termas + alojamiento una noche', meta: 'Paquete de 2 días', reason: 'buscas relajarte sin pensar en nada' },
    { taste: 'vidanocturna', kind: 'simple', icon: '🌃', title: 'Bar con música en vivo', meta: 'Viernes · Noche', reason: 'te gusta la vida nocturna' },
    { taste: 'vidanocturna', kind: 'paquete', icon: '🎶', title: 'Bar + transporte de vuelta incluido', meta: 'Paquete nocturno', reason: 'te gusta salir de noche sin preocuparte de cómo volver' },
    { taste: 'cultura', kind: 'simple', icon: '🎭', title: 'Tour por el barrio histórico', meta: 'Medio día', reason: 'te gusta la cultura y los tours' },
    { taste: 'cultura', kind: 'paquete', icon: '🖼️', title: 'Museo + almuerzo con guía', meta: 'Paquete de un día', reason: 'te gusta aprender mientras paseas' },
    { taste: 'extremo', kind: 'simple', icon: '🪂', title: 'Salto en parapente', meta: 'A 1 hora', reason: 'te gustan los deportes extremos' },
    { taste: 'extremo', kind: 'paquete', icon: '🚵', title: 'Downhill + almuerzo campestre', meta: 'Paquete de un día', reason: 'te gusta la adrenalina' },
  ];

  const COMPANY_POOL = [
    { company: 'pareja', kind: 'simple', icon: '💑', title: 'Cena romántica con vista', meta: 'Noche · Para 2', reason: 'sueles ir en pareja' },
    { company: 'familia', kind: 'paquete', icon: '👨‍👩‍👧', title: 'Cabaña familiar + actividades para niños', meta: 'Paquete de fin de semana', reason: 'sueles ir en familia' },
    { company: 'amigos', kind: 'simple', icon: '🎳', title: 'Bowling + pizza con la junta', meta: 'Sábado · Noche', reason: 'sueles ir con amigos' },
    { company: 'trabajo', kind: 'paquete', icon: '🏢', title: 'Team building al aire libre', meta: 'Paquete para equipos', reason: 'sueles ir con compañeros de trabajo' },
    { company: 'solo', kind: 'simple', icon: '🧍', title: 'Ruta de senderismo autoguiada', meta: 'Medio día · Solo/a', reason: 'a veces prefieres ir solo/a' },
  ];

  const DEFAULT_POOL = [
    { kind: 'simple', icon: '🏔️', title: 'Canopy + termas', meta: 'A 40 min', reason: 'es uno de los panoramas mejor evaluados cerca de ti' },
    { kind: 'paquete', icon: '🛶', title: 'Cabaña junto al río', meta: 'Paquete de un fin de semana', reason: 'es ideal para desconectarte sin planificar nada' },
    { kind: 'simple', icon: '🎡', title: 'Karting bajo las estrellas', meta: 'Viernes · Noche', reason: 'es un plan espontáneo que le gusta a la mayoría' },
    { kind: 'paquete', icon: '🍷', title: 'Tour de vinos nocturno', meta: 'Paquete de un día', reason: 'combina bien con casi cualquier grupo' },
  ];

  const taste = user.tastes || [];
  const company = user.company || [];

  let items = [
    ...TASTE_POOL.filter((i) => taste.includes(i.taste)),
    ...COMPANY_POOL.filter((i) => company.includes(i.company)),
  ];
  if (items.length === 0) items = DEFAULT_POOL;

  const sub = document.getElementById('panoramasSub');
  if (sub && (taste.length || company.length)) {
    sub.textContent = 'Los armamos cruzando tu edad, con quién sueles ir y lo que nos contaste que te gusta.';
  }

  const grid = document.getElementById('panoGrid');
  const kindLabel = { simple: 'Simple', paquete: 'Paquete' };

  function render(filter) {
    const filtered = filter === 'todos' ? items : items.filter((i) => i.kind === filter);
    grid.innerHTML = '';
    if (filtered.length === 0) {
      grid.innerHTML = '<p class="pano-empty">Todavía no tenemos panoramas de este tipo para ti. Prueba otro filtro.</p>';
      return;
    }
    filtered.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'pano-card';
      card.innerHTML = `
        <div class="pano-card__top">
          <div class="pano-card__icon">${item.icon}</div>
          <span class="pano-card__kind pano-card__kind--${item.kind}">${kindLabel[item.kind]}</span>
        </div>
        <p class="pano-card__title">${item.title}</p>
        <p class="pano-card__meta">${item.meta}</p>
        <p class="pano-card__why">✨ <b>Por qué te lo recomendamos:</b> nos contaste que ${item.reason}.</p>
      `;
      grid.appendChild(card);
    });
  }

  const params = new URLSearchParams(window.location.search);
  const initialFilter = params.get('filtro') || 'todos';

  document.querySelectorAll('.pano-filter').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.filter === initialFilter);
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pano-filter').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      render(btn.dataset.filter);
    });
  });

  render(initialFilter);
})();
