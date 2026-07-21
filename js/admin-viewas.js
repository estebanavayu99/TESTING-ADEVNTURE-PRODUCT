/* Banner "volver a super admin" — instrucción explícita del usuario: poder
 * moverse desde negocio-admin.html a la vista real de un negocio o de un
 * viajero (js/negocio-admin.js escribe pickmap_admin_viewing_as al entrar)
 * sin perder de vista que quien está realmente logueado es el admin.
 * Se carga en las páginas de negocio y de viajero (nunca en
 * negocio-admin.html, que no lo necesita). No hace nada si el admin no
 * está en modo "ver como" — así que es seguro dejarlo cargado siempre.
 */
(() => {
  if (localStorage.getItem('pickmap_admin_true_email') !== 'contacto@pickmap.cl') return;
  let viewingAs = null;
  try { viewingAs = JSON.parse(localStorage.getItem('pickmap_admin_viewing_as')); } catch { /* noop */ }
  if (!viewingAs || !viewingAs.email) return;

  const style = document.createElement('style');
  style.textContent = `
    #adminViewAsBar {
      position: sticky; top: 0; z-index: 10000;
      display: flex; align-items: center; justify-content: center; gap: 16px;
      flex-wrap: wrap;
      background: linear-gradient(90deg, #1E2D31, #273C42);
      color: #fff; font-family: 'Nunito Sans', system-ui, sans-serif;
      font-size: 0.85rem; font-weight: 700; padding: 10px 18px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.22);
    }
    #adminViewAsBar b { color: #F6CD4C; }
    #adminViewAsExit {
      font-family: inherit; font-weight: 800; font-size: 0.8rem;
      background: rgba(255,255,255,0.15); color: #fff; border: 1px solid rgba(255,255,255,0.32);
      border-radius: 999px; padding: 6px 14px; cursor: pointer;
    }
    #adminViewAsExit:hover { background: rgba(255,255,255,0.28); }
  `;
  document.head.appendChild(style);

  const bar = document.createElement('div');
  bar.id = 'adminViewAsBar';
  const tipoLabel = viewingAs.type === 'empresa' ? 'negocio' : 'viajero';
  bar.innerHTML = `
    <span>👑 Super admin viendo como <b>${tipoLabel}:</b> ${viewingAs.email}</span>
    <button type="button" id="adminViewAsExit">← Volver a super admin</button>
  `;
  document.body.prepend(bar);

  document.getElementById('adminViewAsExit').addEventListener('click', () => {
    localStorage.removeItem('pickmap_admin_viewing_as');
    localStorage.setItem('pickmap_business_session', 'contacto@pickmap.cl');
    localStorage.removeItem('pickmap_current_user');
    window.location.href = 'negocio-admin.html';
  });

  // Si el admin usa el "Cerrar sesión" propio de la página (en vez del
  // botón de salir de este banner) mientras está en modo "ver como", hay
  // que limpiar igual las marcas de impersonación — si no, quedan
  // pickmap_admin_true_email/pickmap_admin_viewing_as pisados en este
  // mismo navegador y el banner reaparecería (con datos de una sesión ya
  // cerrada) la próxima vez que alguien entre a una página de negocio o
  // viajero desde este navegador.
  ['logoutBtn', 'bizLogoutBtn'].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', () => {
        localStorage.removeItem('pickmap_admin_true_email');
        localStorage.removeItem('pickmap_admin_viewing_as');
      });
    }
  });
})();
