/* PickMap — Darwin — Tools de Prioridad 1 (catalogo, disponibilidad, traza)
 *
 * Todas salen de "tu BD" segun pickmap_fuentes_a_conectar.pdf. Hoy la
 * fuente es el catalogo placeholder (data/catalogo.mock.js). Para
 * conectar la BD real solo hay que llamar configurarFuenteCatalogo()
 * con una funcion que devuelva el mismo arreglo de actividades (mismo
 * contrato documentado en catalogo.mock.js) — nada mas en este archivo
 * cambia.
 */
(() => {
  let fuenteCatalogo = () => (window.PickmapDarwinData && window.PickmapDarwinData.CATALOGO_MOCK) || [];

  function configurarFuenteCatalogo(fn) {
    if (typeof fn === 'function') fuenteCatalogo = fn;
  }

  function catalogo() { return fuenteCatalogo() || []; }

  function buscarActividades(filtros = {}) {
    const { categoria, categorias, texto, precio_max, comuna, excluir_ids } = filtros;
    const cats = categorias || (categoria ? [categoria] : null);
    const excluir = new Set(excluir_ids || []);
    return catalogo()
      .filter((a) => !excluir.has(a.id))
      .filter((a) => !cats || cats.includes(a.categoria))
      .filter((a) => precio_max === undefined || a.precio <= precio_max)
      .filter((a) => !comuna || a.ubicacion.comuna.toLowerCase() === String(comuna).toLowerCase())
      .filter((a) => !texto || `${a.nombre} ${a.categoria}`.toLowerCase().includes(String(texto).toLowerCase()))
      .map((a) => ({
        id: a.id, nombre: a.nombre, categoria: a.categoria, precio: a.precio,
        ubicacion: a.ubicacion, duracion_min: a.duracion_min,
      }));
  }

  function detalleActividad(id) {
    const a = catalogo().find((x) => x.id === id);
    if (!a) return null;
    return { ...a };
  }

  function verificarDisponibilidad(id, fecha, personas = 1) {
    const a = catalogo().find((x) => x.id === id);
    if (!a) return { disponible: false, horarios_disponibles: [], motivo: 'actividad_no_existe' };
    const cuposDia = (a.cupos || {})[fecha];
    if (!cuposDia) return { disponible: false, horarios_disponibles: [], motivo: 'sin_cupos_para_fecha' };
    const horariosDisponibles = Object.entries(cuposDia)
      .filter(([, cupos]) => cupos >= personas)
      .map(([hora, cupos]) => ({ hora, cupos }));
    return { disponible: horariosDisponibles.length > 0, horarios_disponibles: horariosDisponibles };
  }

  /* ---------- Traza: registrar_interaccion ----------
   * Se guarda con la MISMA forma de evento que consume
   * algoritmos.calcularConfianza({intereses_declarados,restricciones}, eventos).
   * Namespaced por sesion para no chocar con las localStorage keys de
   * produccion (pickmap_*) mientras este bot vive aislado sin inyectar.
   */
  function claveEventos(sessionId) { return `pickmap_darwin_eventos::${sessionId || 'anon'}`; }

  function registrarInteraccion(sessionId, evento) {
    const registro = { ...evento, timestamp: evento.timestamp ?? Date.now() };
    const clave = claveEventos(sessionId);
    let eventos = [];
    try { eventos = JSON.parse(localStorage.getItem(clave)) || []; } catch { eventos = []; }
    eventos.push(registro);
    try { localStorage.setItem(clave, JSON.stringify(eventos)); } catch { /* storage llena/no disponible: no bloquea el flujo */ }
    return registro;
  }

  function obtenerEventos(sessionId) {
    try { return JSON.parse(localStorage.getItem(claveEventos(sessionId))) || []; } catch { return []; }
  }

  /* ---------- armar_combo ----------
   * Ensambla actividades del catalogo en un combo evaluable por
   * rankearCombos. El tiempo de traslado usa una estimacion sincrona
   * por distancia en linea recta (haversine) mientras no haya red; si
   * contexto.js#calcularRuta esta disponible (P2, requiere internet),
   * el motor puede recalcular tiempo_traslado_total_min con datos reales
   * antes de rankear.
   */
  function haversineKm(a, b) {
    const R = 6371;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const lat1 = a.lat * Math.PI / 180;
    const lat2 = b.lat * Math.PI / 180;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function estimarTrasladoMin(a, b) {
    const km = haversineKm(a.ubicacion, b.ubicacion);
    const VELOCIDAD_KMH = 30;
    return Math.round((km / VELOCIDAD_KMH) * 60) + 5; // +5 min de buffer de bajada/espera
  }

  function sumarMinutos(horaHHMM, minutos) {
    const [h, m] = horaHHMM.split(':').map(Number);
    const total = h * 60 + m + minutos;
    return { h: Math.floor(total / 60) % 24, m: total % 60, minutosDesdeMedianoche: total };
  }

  function buscarAlternativaIndoor(actividad) {
    return catalogo().find((a) => a.categoria === actividad.categoria && a.id !== actividad.id && !a.exterior) || null;
  }

  function armarCombo(actividadIds, opciones = {}) {
    const { fecha, personas = 1, horaCierreMin = 20 * 60 } = opciones;
    const actividades = actividadIds.map((id) => catalogo().find((a) => a.id === id)).filter(Boolean);
    if (!actividades.length) return null;

    let tieneCupo = true;
    const horariosElegidos = [];
    for (const act of actividades) {
      const disp = fecha ? verificarDisponibilidad(act.id, fecha, personas) : { disponible: true, horarios_disponibles: (act.horarios || []).map((h) => ({ hora: h, cupos: 99 })) };
      if (!disp.disponible) { tieneCupo = false; break; }
      horariosElegidos.push(disp.horarios_disponibles[0].hora);
    }

    let tiempoTrasladoTotal = 0;
    for (let i = 0; i < actividades.length - 1; i++) {
      tiempoTrasladoTotal += estimarTrasladoMin(actividades[i], actividades[i + 1]);
    }

    let llegaDespuesCierre = false;
    if (horariosElegidos.length) {
      let cursorMin = sumarMinutos(horariosElegidos[0], 0).minutosDesdeMedianoche;
      for (let i = 0; i < actividades.length; i++) {
        cursorMin += actividades[i].duracion_min;
        if (i < actividades.length - 1) cursorMin += estimarTrasladoMin(actividades[i], actividades[i + 1]);
      }
      llegaDespuesCierre = cursorMin > horaCierreMin;
    }

    const conRiesgoClimatico = actividades.find((a) => a.exterior && !a.indoor_alt);
    let planB = null;
    if (conRiesgoClimatico) {
      const alt = buscarAlternativaIndoor(conRiesgoClimatico);
      if (alt) planB = { gatillo: 'lluvia', reemplazo: alt.nombre };
    }

    return {
      combo_id: actividades.map((a) => a.id).join('-'),
      actividades,
      precio_total: actividades.reduce((s, a) => s + a.precio, 0) * personas,
      tiempo_traslado_total_min: tiempoTrasladoTotal,
      tiene_cupo: tieneCupo,
      llega_despues_cierre: llegaDespuesCierre,
      horarios_elegidos: horariosElegidos,
      plan_b: planB,
    };
  }

  window.PickmapDarwin = window.PickmapDarwin || {};
  window.PickmapDarwin.tools = {
    configurarFuenteCatalogo,
    buscarActividades,
    detalleActividad,
    verificarDisponibilidad,
    registrarInteraccion,
    obtenerEventos,
    armarCombo,
    _internas: { haversineKm, estimarTrasladoMin },
  };
})();
