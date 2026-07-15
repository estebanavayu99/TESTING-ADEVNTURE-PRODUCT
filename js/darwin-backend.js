/* Pickmap — Darwin backend (silencioso, sin chat)
 *
 * Segunda superficie donde Darwin razona (la primera es el widget de
 * soporte general, js/beto-chat.js — no se toca acá). Esta trabaja "por
 * detrás": lee la sesión real del viajero (localStorage pickmap_users /
 * pickmap_current_user), traduce sus respuestas reales de onboarding.html
 * a un perfil de bot-darwin, y llama directo a D.motor.proponerCombos
 * (sin pasar por un mensaje de chat escrito) para mostrar la combinación
 * que arma para ese cliente específico.
 *
 * DATA DE TESTING: usa bot-darwin/data/catalogo.real-sample.js (negocios
 * reales, precio/duración/horario ESTIMADOS por categoría) — se
 * reemplaza por el catálogo definitivo cuando el usuario conecte su BD/
 * CRM real. Requiere que bot-darwin/js/*.js estén cargados antes que
 * este archivo (ver script tags en dashboard.html).
 */
(() => {
  const USERS_KEY = 'pickmap_users';
  const SESSION_KEY = 'pickmap_current_user';

  const email = localStorage.getItem(SESSION_KEY);
  if (!email) return; // dashboard.js ya redirige a login.html

  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  const user = users.find((u) => u.email === email);
  if (!user || !user.onboarded) return; // dashboard.js ya redirige a onboarding.html

  const D = window.PickmapDarwin;
  const cardEl = document.getElementById('darwinBackendCard');
  if (!D || !D.motor || !D.tools || !cardEl) return;

  D.tools.configurarFuenteCatalogo(() => (
    (window.PickmapDarwinData && window.PickmapDarwinData.CATALOGO_REAL_SAMPLE) || []
  ));

  // Onboarding real usa un vocabulario de gustos más simple que los 9
  // buckets de bot-darwin — mapeo honesto: "shopping" y "ymas" no tienen
  // equivalente real en el motor todavía, así que se ignoran (no se
  // inventa un bucket falso para ellos).
  const TASTE_A_BUCKET = {
    naturaleza: 'aventura', gastronomia: 'foodie', relax: 'relax',
    vidanocturna: 'fiesta', cultura: 'cultural', extremo: 'aventura',
    playa: 'aventura', nieve: 'aventura', fotografia: 'cultural', musica: 'cultural',
  };
  const BUDGET_A_BANDA = {
    bajo: [5000, 18000], medio: [15000, 35000], alto: [30000, 80000],
  };
  const SANTIAGO_CENTRO = { lat: -33.4372, lng: -70.6506, nombre: 'Santiago Centro (referencia)' };

  // Traduce las respuestas reales de onboarding.html a perfil.intereses:
  // cada bucket que aparece (por gusto declarado, reforzado si "extremo"
  // también fue elegido como nivel de exigencia) recibe una afinidad
  // directa — no pasa por el sistema de eventos/repetición de
  // calcularConfianza (pensado para señales de comportamiento en una
  // conversación, no para una declaración explícita de onboarding).
  function construirPerfilDesdeOnboarding(perfil, u) {
    const conteoPorBucket = {};
    for (const taste of u.tastes || []) {
      const bucket = TASTE_A_BUCKET[taste];
      if (bucket) conteoPorBucket[bucket] = (conteoPorBucket[bucket] || 0) + 1;
    }
    if ((u.difficulty || []).includes('extremo')) {
      conteoPorBucket.aventura = (conteoPorBucket.aventura || 0) + 1;
    }

    perfil.intereses = Object.entries(conteoPorBucket).map(([categoria, n]) => ({
      categoria, afinidad: Math.min(0.95, 0.4 + 0.15 * n),
    }));
    perfil.arquetipos = D.motor._internas.calcularArquetipos(perfil);

    perfil.grupo.tipo = (u.company || [])[0] || null;
    if (!perfil.grupo.adultos) perfil.grupo.adultos = (u.company || []).includes('pareja') ? 2 : 1;

    const banda = BUDGET_A_BANDA[(u.budget || [])[0]];
    if (banda) perfil.presupuesto.banda = banda;

    return perfil;
  }

  function obtenerOrigenReal() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) { resolve(SANTIAGO_CENTRO); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, nombre: 'tu ubicación' }),
        () => resolve(SANTIAGO_CENTRO),
        { timeout: 6000 },
      );
    });
  }

  function sessionIdDarwin() { return `real::${email}`; }

  function renderResultado(resultado) {
    if (!resultado || resultado.sinResultados) {
      cardEl.innerHTML = '<p class="darwin-backend__empty">Todavía no tengo un panorama que calce 100% con tus gustos declarados — prueba ajustando tus preferencias en "Tus datos de viajero".</p>';
      return;
    }
    const textoSeguro = resultado.texto.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const botonOferta = resultado.ofertaComplemento
      ? '<button type="button" class="btn btn--primary darwin-backend__aceptar" id="darwinAceptarOferta">Sí, arma el plan completo</button>'
      : '';
    cardEl.innerHTML = `
      <p class="darwin-backend__label">🧠 Así piensa Darwin por ti ahora mismo</p>
      <div class="darwin-backend__texto">${textoSeguro}</div>
      ${botonOferta}
    `;
    const btn = document.getElementById('darwinAceptarOferta');
    if (btn) btn.addEventListener('click', () => aceptarOferta(resultado.ofertaComplemento));
  }

  async function aceptarOferta(ofertaComplemento) {
    const sessionId = sessionIdDarwin();
    const perfil = D.motor.cargarPerfil(sessionId);
    perfil.oferta_combo = { base_id: ofertaComplemento.base_id, complemento_id: ofertaComplemento.complemento_id };
    D.motor.guardarPerfil(sessionId, perfil);
    cardEl.innerHTML = '<p class="darwin-backend__empty">Armando tu plan completo…</p>';
    const resultado = await D.motor.proponerCombos(D, perfil, false, false, true);
    renderResultado(resultado);
  }

  async function mostrarRecomendacionDarwin() {
    const sessionId = sessionIdDarwin();
    let perfil = D.motor.cargarPerfil(sessionId);
    perfil = construirPerfilDesdeOnboarding(perfil, user);
    perfil.origen = await obtenerOrigenReal();

    try {
      perfil.contexto.clima_usuario = await D.contexto.clima({ lat: perfil.origen.lat, lng: perfil.origen.lng });
    } catch {
      // Sin internet real (o el navegador negó el permiso) — se degrada
      // con honestidad, el clima simplemente no aparece en el texto.
    }

    D.motor.guardarPerfil(sessionId, perfil);
    const resultado = await D.motor.proponerCombos(D, perfil, false, false, false);
    renderResultado(resultado);
  }

  mostrarRecomendacionDarwin().catch((err) => {
    cardEl.innerHTML = `<p class="darwin-backend__empty">No pude calcular tu recomendación ahora (${err.message}). Intenta recargar la página.</p>`;
  });
})();
