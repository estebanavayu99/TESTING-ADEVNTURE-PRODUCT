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
  if (!user || !user.onboarded) {
    window.location.href = 'onboarding.html';
    return;
  }

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = 'index.html';
  });

  const FAVORITES_KEY = `pickmap_favorites_${user.email}`;
  function getFavorites() {
    try { return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || []; } catch { return []; }
  }
  function saveFavorites(list) { localStorage.setItem(FAVORITES_KEY, JSON.stringify(list)); }

  const kindLabel = { simple: 'Simple', paquete: 'Paquete' };

  function cardHTML(item) {
    const whyBox = item.reason
      ? `<p class="pano-card__why">✨ <b>Por qué Beto lo eligió:</b> nos contaste que ${item.reason}.</p>`
      : `<p class="pano-card__why pano-card__why--general">🤖 Beto dice: uno de los panoramas más populares de Pickmap ahora mismo.</p>`;
    return `
      <article class="pano-card">
        <div class="pano-card__photo pano-card__photo--${item.grad}">
          <span class="pano-card__emoji">${item.icon}</span>
          <span class="pano-card__tag">${item.meta}</span>
          <span class="pano-card__heart is-liked" data-title="${item.title}">♥</span>
          <span class="pano-card__kind pano-card__kind--${item.kind}">${kindLabel[item.kind]}</span>
        </div>
        <div class="pano-card__body">
          <p class="pano-card__title">${item.title}</p>
          <p class="pano-card__rating">⭐ ${item.rating} <span>(${item.reviews})</span></p>
          <p class="pano-card__price">Desde <b>$${item.price}</b> por persona</p>
          ${whyBox}
        </div>
      </article>
    `;
  }

  const grid = document.getElementById('favGrid');
  const empty = document.getElementById('favEmpty');

  function render() {
    const favorites = getFavorites();
    if (!favorites.length) {
      grid.hidden = true;
      empty.hidden = false;
      return;
    }
    grid.hidden = false;
    empty.hidden = true;
    grid.innerHTML = favorites.map((item) => cardHTML(item)).join('');
  }

  document.addEventListener('click', (e) => {
    const heart = e.target.closest('.pano-card__heart');
    if (!heart) return;
    const title = heart.dataset.title;
    saveFavorites(getFavorites().filter((f) => f.title !== title));
    render();
  });

  render();
})();
