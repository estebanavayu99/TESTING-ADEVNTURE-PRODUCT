/* Pickmap — Darwin backend (silencioso, sin chat)
 *
 * Segunda superficie donde Darwin razona (la primera es el widget de
 * soporte general, js/beto-chat.js — no se toca acá). Esta trabaja "por
 * detrás": lee la sesión REAL de Supabase Auth, el perfil declarado en
 * onboarding y el perfil de preferencias de Darwin desde Supabase
 * (supabase/schema.sql: profiles + darwin_preferences), y llama directo
 * a D.motor.proponerCombos (sin pasar por un mensaje de chat escrito)
 * para mostrar la combinación que arma para ese cliente específico.
 *
 * PRIORIDAD 1 de la fase de backend real (instrucción explícita del
 * dueño del producto): esta es la superficie que se prueba primero,
 * antes que el widget de chat.
 *
 * Catálogo: intenta leer negocios reales desde la tabla `businesses` de
 * Supabase (poblada por scripts/importar_ghl_a_supabase.js desde el CRM
 * real). Si esa tabla todavía está vacía (import no corrido) o Supabase
 * no está configurado, cae de vuelta a bot-darwin/data/catalogo.real-sample.js
 * para no dejar la tarjeta en blanco mientras se completa la migración.
 *
 * Requiere que bot-darwin/js/*.js y js/supabase-client.js estén cargados
 * antes que este archivo (ver script tags en dashboard.html).
 */
(() => {
  const D = window.PickmapDarwin;
  const S = window.PickmapSupabase;
  const cardEl = document.getElementById('darwinBackendCard');
  if (!D || !D.motor || !D.tools || !cardEl) return;

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

  // Mapea una fila de la tabla `businesses` (snake_case, columnas SQL)
  // al mismo contrato de objeto que ya consumen tools.js/motor.js (ver
  // header de bot-darwin/data/catalogo.mock.js) — así no hay que tocar
  // ni una línea del motor para cambiar la fuente del catálogo.
  function filaANegocio(fila) {
    return {
      id: fila.id, nombre: fila.nombre, categoria: fila.categoria, tags: fila.tags || [],
      precio: fila.precio, duracion_min: fila.duracion_min,
      ubicacion: { lat: fila.lat, lng: fila.lng, comuna: fila.comuna },
      energia: fila.energia, exterior: fila.exterior, indoor_alt: fila.indoor_alt,
      accesible: fila.accesible, experiencia_estimada: fila.experiencia_estimada,
      hero_moment: fila.hero_moment, horarios: fila.horarios || [],
      punto_encuentro: fila.punto_encuentro, incluye: fila.incluye || [],
      no_incluye: fila.no_incluye || [], restricciones: fila.restricciones || [],
      cupos: fila.cupos || {}, tipo: fila.tipo || undefined,
      es_gema_oculta: fila.es_gema_oculta || undefined, evita_trampa: fila.evita_trampa || undefined,
    };
  }

  async function configurarCatalogo() {
    let negociosSupabase = [];
    if (S && S.configured) {
      try {
        const filas = await S.businesses.listAll();
        negociosSupabase = filas.map(filaANegocio);
      } catch {
        // Tabla `businesses` sin permisos/aún no migrada — cae al fallback local.
      }
    }
    const catalogoFallback = () => (
      (window.PickmapDarwinData && window.PickmapDarwinData.CATALOGO_REAL_SAMPLE) || []
    );
    D.tools.configurarFuenteCatalogo(() => (
      negociosSupabase.length ? negociosSupabase : catalogoFallback()
    ));
  }

  // Traduce las respuestas reales de onboarding (fila `profiles`) a
  // perfil.intereses: cada bucket que aparece (por gusto declarado,
  // reforzado si "extremo" también fue elegido como nivel de exigencia)
  // recibe una afinidad directa — no pasa por el sistema de eventos/
  // repetición de calcularConfianza (pensado para señales de
  // comportamiento en una conversación, no para una declaración
  // explícita de onboarding).
  function construirPerfilDesdeOnboarding(perfil, profile) {
    const conteoPorBucket = {};
    for (const taste of profile.tastes || []) {
      const bucket = TASTE_A_BUCKET[taste];
      if (bucket) conteoPorBucket[bucket] = (conteoPorBucket[bucket] || 0) + 1;
    }
    if ((profile.difficulty || []).includes('extremo')) {
      conteoPorBucket.aventura = (conteoPorBucket.aventura || 0) + 1;
    }

    // Bug real: esto sobreescribía perfil.intereses ENTERO con solo lo
    // derivado de onboarding — hoy es inofensivo (nada más escribe en
    // darwin_preferences.intereses todavía), pero el día que se conecte
    // cualquier otra señal real (chat/reserva/reseña — infraestructura ya
    // documentada en preference_signals), cada recálculo del dashboard
    // borraría en silencio lo aprendido por esas señales. Ahora se combina:
    // onboarding aporta un piso por bucket declarado sin bajar una afinidad
    // ya más alta, y sin borrar categorías aprendidas por fuera de onboarding.
    const interesesPrevios = new Map((perfil.intereses || []).map((i) => [i.categoria, i.afinidad]));
    for (const [categoria, n] of Object.entries(conteoPorBucket)) {
      const desdeOnboarding = Math.min(0.95, 0.4 + 0.15 * n);
      const previa = interesesPrevios.has(categoria) ? interesesPrevios.get(categoria) : -Infinity;
      interesesPrevios.set(categoria, Math.max(desdeOnboarding, previa));
    }
    perfil.intereses = [...interesesPrevios.entries()].map(([categoria, afinidad]) => ({ categoria, afinidad }));
    perfil.arquetipos = D.motor._internas.calcularArquetipos(perfil);

    perfil.grupo.tipo = (profile.company || [])[0] || null;
    if (!perfil.grupo.adultos) perfil.grupo.adultos = (profile.company || []).includes('pareja') ? 2 : 1;

    const banda = BUDGET_A_BANDA[(profile.budget || [])[0]];
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

  let sessionIdActual = null;
  let userIdActual = null;

  async function guardarPerfilPersistente(perfil) {
    D.motor.guardarPerfil(sessionIdActual, perfil);
    if (!S || !S.configured || !userIdActual) return;
    try {
      await S.darwinPreferences.upsert(userIdActual, {
        intereses: perfil.intereses, arquetipos: perfil.arquetipos, grupo: perfil.grupo,
        presupuesto: perfil.presupuesto, origen: perfil.origen, contexto: perfil.contexto,
        restricciones: perfil.restricciones, oferta_combo: perfil.oferta_combo,
        favoritos: perfil.favoritos, descartados: perfil.descartados, historial_ids: perfil.historial_ids,
      });
    } catch { /* la sesión local (motor.guardarPerfil) ya quedó al día; persistencia cross-device queda pendiente hasta que Supabase responda */ }
  }

  async function aceptarOferta(ofertaComplemento) {
    const perfil = D.motor.cargarPerfil(sessionIdActual);
    perfil.oferta_combo = { base_id: ofertaComplemento.base_id, complemento_id: ofertaComplemento.complemento_id };
    await guardarPerfilPersistente(perfil);
    cardEl.innerHTML = '<p class="darwin-backend__empty">Armando tu plan completo…</p>';
    const resultado = await D.motor.proponerCombos(D, perfil, false, false, true);
    renderResultado(resultado);
  }

  async function mostrarRecomendacionDarwin() {
    if (!S || !S.configured) {
      cardEl.innerHTML = '<p class="darwin-backend__empty">Supabase todavía no está configurado (js/supabase-config.js) — Darwin no puede calcular tu recomendación real todavía.</p>';
      return;
    }
    const session = await S.auth.getSession();
    if (!session || !session.user) return; // dashboard.js ya redirige a login.html si no hay sesión

    const profile = await S.profiles.get(session.user.id);
    if (!profile || !profile.onboarded) return; // dashboard.js ya redirige a onboarding.html si falta

    userIdActual = session.user.id;
    sessionIdActual = `real::${session.user.id}`;

    await configurarCatalogo();

    const existente = await S.darwinPreferences.get(userIdActual);
    let perfil = D.motor.cargarPerfil(sessionIdActual);
    if (existente) perfil = { ...perfil, ...existente };
    perfil = construirPerfilDesdeOnboarding(perfil, profile);
    perfil.origen = await obtenerOrigenReal();

    try {
      perfil.contexto.clima_usuario = await D.contexto.clima({ lat: perfil.origen.lat, lng: perfil.origen.lng });
    } catch {
      // Sin internet real (o el navegador negó el permiso) — se degrada
      // con honestidad, el clima simplemente no aparece en el texto.
    }

    await guardarPerfilPersistente(perfil);
    if (S.configured) {
      try {
        await S.preferenceSignals.log(userIdActual, null, 'onboarding', null, {
          evento: 'recalculo_dashboard', intereses: perfil.intereses,
        });
      } catch { /* el log de trazabilidad no debe bloquear la recomendación */ }
    }

    const resultado = await D.motor.proponerCombos(D, perfil, false, false, false);
    renderResultado(resultado);
  }

  mostrarRecomendacionDarwin().catch((err) => {
    cardEl.innerHTML = `<p class="darwin-backend__empty">No pude calcular tu recomendación ahora (${err.message}). Intenta recargar la página.</p>`;
  });
})();
