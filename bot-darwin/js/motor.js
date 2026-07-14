/* PickMap — Darwin — Motor de dialogo (orquestador)
 *
 * Implementa las reglas de decision del system prompt v4 (PARTE A-E) de
 * forma 100% deterministica: sin LLM real (decision del usuario para
 * esta etapa), asi que "entender" al cliente es deteccion por
 * palabras clave + los dos algoritmos de pickmap_algoritmos_spec.pdf, y
 * "hablar" es plantillas.js. Es una base honesta y testeable; el dia
 * que se conecte un LLM real, este motor pasa a ser las TOOLS que el
 * LLM invoca (calcularConfianza/rankearCombos/etc ya viven separadas en
 * algoritmos.js y tools.js para eso).
 */
(() => {
  function sinAcentos(s) {
    return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  // Taxonomia real (178 categorias del listado de negocios del usuario,
  // agrupadas en 9 buckets) — ver data/taxonomia-categorias.js. Antes esto
  // era una lista de 7 categorias inventadas de juguete; ahora la deteccion
  // de intencion reconoce el vocabulario real de categorias de experiencias
  // en Chile, no solo un puñado de sinonimos genericos.
  const TAXONOMIA = window.PickmapDarwinData.TAXONOMIA_CATEGORIAS;
  const CATEGORIA_KEYWORDS = {};
  const CATEGORIA_A_ARQUETIPO = {};
  for (const [bucket, data] of Object.entries(TAXONOMIA)) {
    CATEGORIA_KEYWORDS[bucket] = data.keywords;
    CATEGORIA_A_ARQUETIPO[bucket] = data.arquetipo;
  }

  const PATRONES_EMOCION = {
    frustrado: /no funciona|p[ée]simo|malo|molesto|frustrad|enojad|esto no sirve|fatal/,
    abrumado: /no s[ée] (cu[aá]l|qu[ée])|muchas opciones|estoy perdid|no tengo idea|me confund/,
    dudando: /tal vez|no estoy segur|no s[ée] si|quiz[aá]s|lo pienso/,
    entusiasmado: /genial|me encanta|perfecto|s[uú]per|buen[ií]simo|dale no?m[aá]s/,
  };

  const PATRONES_SENAL = {
    disponibilidad_fecha: /disponib|qu[ée] d[ií]a|fecha|cu[aá]ndo/,
    precio_final: /precio final|cu[aá]nto (cuesta|sale|vale)|total/,
    me_gusta: /me gusta|me encanta esta|esa me gusta/,
    carrito: /agr[ée]galo|res[ée]rvalo|apart[aá]lo|carrito/,
    logistica: /d[oó]nde nos juntamos|punto de encuentro|c[oó]mo llego/,
  };

  const PATRON_CONFIRMACION = /confirmo|dale,? res[ée]rvalo|s[ií],? res[ée]rvalo|apart[aá]lo ya|quiero reservar/;
  const PATRON_DESCARTE = /no me gusta|quita|sac[aá]lo|elimina/;
  const PATRON_OCASION = /aniversario|cumplea[ñn]os|luna de miel|pedida de mano|propuesta de matrimonio/;
  const PATRON_OBJECION_PRECIO = /caro|muy caro|precio alto|se me pasa (del|de mi) presupuesto/;
  const PATRON_OBJECION_PIENSO = /lo pienso|despu[ée]s veo|no s[ée] a[uú]n|lo consulto/;
  // C7: re-enganche. Un saludo "vacio" (sin categoria/señal nueva) con un
  // carrito pendiente = el patron de "cliente que volvio" en una sesion
  // sin memoria entre visitas reales — se retoma en vez de preguntar desde
  // cero como si nunca hubiera pasado nada.
  const PATRON_SALUDO = /^\s*(hola|hey|buenas|holi|ola)\b/;
  // D5: ritmo conversacional. "Al apurado, dale la mejor opcion ya; al que
  // explora, acompañalo con curiosidad" — el default (1 opcion directa) ya
  // sirve al apurado; esto detecta al que quiere explorar/comparar.
  const PATRON_QUIERE_EXPLORAR = /cu[eé]ntame m[aá]s|qu[eé] opciones (tienes|hay)|dame m[aá]s opciones|mu[eé]strame opciones|quiero ver m[aá]s|comparar opciones|otras alternativas/;
  // Deteccion explicita del caso "plan de varios dias" (cabaña + termas +
  // trekking en el sur) — hoy es una demo puntual de esta secuencia
  // exacta, no un planificador general de N dias/categorias (eso necesita
  // más catálogo real para generalizar; ver README).
  const PATRON_PLAN_MULTIDIA = /caban|fin de semana.*sur|sur.*fin de semana|plan de.*dias|termas.*trekking|trekking.*termas/;
  // "Panoramas cerca de ahi": mismo patron que ya usa panoramas.js en el
  // sitio real (nearbyItems + boton "+" para agregar), pero rankeado con
  // el motor multifactorial real en vez de solo proximidad+categoria.
  const PATRON_VER_RELACIONADOS = /que mas hay cerca|algo mas cerca|otras opciones cerca|agregar algo mas|panoramas cerca|ideas relacionadas/;
  // D3 del system prompt: grupo con gustos en conflicto ("a mi me gusta X
  // pero a mi pareja/amigo Y"). Detecta la estructura contrastiva, no solo
  // que se mencionen 2 categorias (eso ya pasa cuando UNA persona quiere
  // dos cosas para si misma, que no es lo mismo que un conflicto real).
  const PATRON_DIVERGENCIA = /\bpero\b.{0,25}\ba (mi pareja|mi (amigo|amiga|marido|esposa|polola|pololo|hijo|hija)|ella|el|su)\b/;

  function detectarCategorias(texto) {
    const t = sinAcentos(texto);
    return Object.keys(CATEGORIA_KEYWORDS).filter((cat) => CATEGORIA_KEYWORDS[cat].some((kw) => t.includes(sinAcentos(kw))));
  }

  // Orden en que aparecen las categorias EN EL TEXTO (no en el orden fijo
  // de CATEGORIA_KEYWORDS) — importa para D3: quien se menciona primero es
  // quien va primero en el plan ("en la mañana lo tuyo, cerramos con lo de
  // tu pareja").
  function categoriasEnOrdenDeAparicion(texto, categoriasDetectadas) {
    const t = sinAcentos(texto);
    return categoriasDetectadas
      .map((cat) => {
        const posiciones = CATEGORIA_KEYWORDS[cat].map((kw) => t.indexOf(sinAcentos(kw))).filter((i) => i !== -1);
        return { cat, idx: posiciones.length ? Math.min(...posiciones) : Infinity };
      })
      .sort((a, b) => a.idx - b.idx)
      .map((x) => x.cat);
  }

  function detectarDivergencia(texto, categoriasDetectadas) {
    const t = sinAcentos(texto);
    const m = PATRON_DIVERGENCIA.exec(t);
    if (!m) return null;
    if (categoriasDetectadas.length < 2) return null;
    // La frase de contraste ("a mi pareja", "a mi amigo"...) puede contener
    // una palabra que TAMBIEN es keyword de una categoria (ej. "pareja" es
    // keyword de romantico) sin que el cliente este pidiendo esa categoria
    // — solo esta diciendo CON QUIEN va. Se descarta cualquier categoria
    // cuyo unico indicio caiga dentro de ese tramo del texto.
    const spanInicio = m.index;
    const spanFin = m.index + m[0].length;
    const categoriasReales = categoriasDetectadas.filter((cat) => {
      const posiciones = CATEGORIA_KEYWORDS[cat].map((kw) => t.indexOf(sinAcentos(kw))).filter((i) => i !== -1);
      return posiciones.some((p) => p < spanInicio || p >= spanFin);
    });
    if (categoriasReales.length < 2) return null;
    const ordenadas = categoriasEnOrdenDeAparicion(texto, categoriasReales);
    return [ordenadas[0], ordenadas[1]];
  }

  function detectarEstadoEmocional(texto) {
    const t = sinAcentos(texto);
    for (const [estado, patron] of Object.entries(PATRONES_EMOCION)) if (patron.test(t)) return estado;
    return null;
  }
  function detectarSenales(texto) {
    const t = sinAcentos(texto);
    return Object.keys(PATRONES_SENAL).filter((s) => PATRONES_SENAL[s].test(t));
  }
  function detectarOcasion(texto) {
    return PATRON_OCASION.test(sinAcentos(texto)) ? sinAcentos(texto).match(PATRON_OCASION)[0] : null;
  }
  function detectarObjecion(texto) {
    const t = sinAcentos(texto);
    if (PATRON_OBJECION_PRECIO.test(t)) return 'precio';
    if (PATRON_OBJECION_PIENSO.test(t)) return 'lo_pienso';
    return null;
  }
  function esConfirmacion(texto) { return PATRON_CONFIRMACION.test(sinAcentos(texto)); }
  function esDescarte(texto) { return PATRON_DESCARTE.test(sinAcentos(texto)); }
  function esSaludoVacio(texto) { return PATRON_SALUDO.test(sinAcentos(texto)); }
  function quiereExplorar(texto) { return PATRON_QUIERE_EXPLORAR.test(sinAcentos(texto)); }
  function esPlanMultiDia(texto) { return PATRON_PLAN_MULTIDIA.test(sinAcentos(texto)); }
  function pideRelacionados(texto) { return PATRON_VER_RELACIONADOS.test(sinAcentos(texto)); }

  function extraerPresupuesto(texto) {
    const m = /(\d{4,7})/.exec(texto.replace(/\./g, ''));
    return m ? Number(m[1]) : null;
  }
  function extraerFecha(texto) {
    const t = sinAcentos(texto);
    const iso = /(\d{4}-\d{2}-\d{2})/.exec(texto);
    if (iso) return iso[1];
    const hoy = new Date();
    if (/\bhoy\b/.test(t)) return hoy.toISOString().slice(0, 10);
    if (/manana/.test(t)) { const d = new Date(hoy); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); }
    return null;
  }

  function perfilPorDefecto() {
    return {
      arquetipos: [], estado_emocional: null, destino: null, fechas: null,
      origen: null, // { lat, lng, nombre } — de donde parte el cliente, para distancia real
      grupo: { adultos: null, ninos: null, tipo: null, gustos_divergentes: [] },
      presupuesto: { banda: null, sensibilidad: null, gastado_en_combo: 0 },
      intereses: [], intensidad_preferida: null, energia_acumulada_dia: 0,
      restricciones: [], motivo_viaje: null, ocasion_especial: null,
      intent_score: { que_quiere: null, confianza: 0 }, etapa_embudo: null,
      contexto: { clima: null, luz: null, eventos: null, afluencia: null },
      favoritos: [], descartados: [], historial_ids: [], carrito: [],
    };
  }

  function clavePerfil(sessionId) { return `pickmap_darwin_perfil::${sessionId || 'anon'}`; }
  function cargarPerfil(sessionId) {
    try {
      const guardado = JSON.parse(localStorage.getItem(clavePerfil(sessionId)));
      return guardado ? { ...perfilPorDefecto(), ...guardado } : perfilPorDefecto();
    } catch { return perfilPorDefecto(); }
  }
  function guardarPerfil(sessionId, perfil) {
    try { localStorage.setItem(clavePerfil(sessionId), JSON.stringify(perfil)); } catch { /* no bloquea el flujo */ }
  }

  function calcularArquetipos(perfil) {
    const ordenado = [...perfil.intereses].sort((a, b) => (b.afinidad || 0) - (a.afinidad || 0));
    const arquetipos = [];
    for (const i of ordenado) {
      const arq = CATEGORIA_A_ARQUETIPO[i.categoria];
      if (arq && !arquetipos.includes(arq)) arquetipos.push(arq);
      if (arquetipos.length >= 2) break;
    }
    return arquetipos;
  }

  function detectarEtapaEmbudo(perfil, señales, confirmacion) {
    if (confirmacion) return 'decision';
    if (perfil.etapa_embudo === 'decision') return 'post_venta';
    if (señales.length) return 'intencion';
    if (perfil.favoritos.length > 0 || perfil.intereses.length >= 2) return 'consideracion';
    return 'descubrimiento';
  }

  const ADDON_POR_CATEGORIA = {
    aventura: 'un traslado ida y vuelta', foodie: 'una copa de vino para acompañar',
    enologia: 'transporte directo desde tu hotel', romantico: 'un set de fotos profesionales',
    familiar: 'transporte con silla infantil', relax: 'un upgrade a suite privada', cultural: 'un audioguía en tu idioma',
    fiesta: 'una segunda ronda de tragos', explorador: 'un almuerzo típico del lugar',
  };

  function proponerCombos(D, perfil, explorar = false) {
    // D3: si el grupo tiene gustos en conflicto detectados esta sesión, la
    // secuencia la define QUIEN SE MENCIONÓ PRIMERO (no el score de
    // afinidad) — el objetivo es que cada persona vea que se consideró lo
    // suyo, en el orden que lo pidió, no que el motor elija por afinidad.
    const categoriasObjetivo = (perfil.grupo.gustos_divergentes && perfil.grupo.gustos_divergentes.length === 2)
      ? perfil.grupo.gustos_divergentes
      : perfil.intereses
        .filter((i) => (i.afinidad || 0) >= 0 || perfil.intereses.length <= 2)
        .sort((a, b) => (b.afinidad || 0) - (a.afinidad || 0))
        .slice(0, 2)
        .map((i) => i.categoria);

    let candidatos = D.tools.buscarActividades({ categorias: categoriasObjetivo.length ? categoriasObjetivo : undefined, excluir_ids: perfil.descartados });
    // Solo se abre a todo el catálogo si NO hay ningún candidato de la
    // categoría de interés — con 1 solo candidato real igual se prioriza
    // por sobre "traer todo" (antes esto ahogaba categorías nuevas que
    // todavía tienen pocas actividades de prueba, como fiesta/explorador).
    if (!candidatos.length) candidatos = D.tools.buscarActividades({ excluir_ids: perfil.descartados });
    if (!candidatos.length) return null;
    // buscarActividades devuelve en orden de catálogo, no de preferencia:
    // reordenamos para que la categoría con mayor afinidad quede primero.
    if (categoriasObjetivo.length) {
      candidatos = [...candidatos].sort((a, b) => categoriasObjetivo.indexOf(a.categoria) - categoriasObjetivo.indexOf(b.categoria));
    }

    const personas = (perfil.grupo.adultos || 1) + (perfil.grupo.ninos || 0);
    const opciones = { fecha: perfil.fechas, personas };

    const hayDivergencia = perfil.grupo.gustos_divergentes && perfil.grupo.gustos_divergentes.length === 2;
    const combosCompletos = [];
    const top3 = candidatos.slice(0, 3);
    if (hayDivergencia) {
      // Con gustos en conflicto, se toma UNA actividad representante de
      // CADA categoría explícitamente — candidatos.slice(0,2) no sirve
      // acá porque si hay 2+ actividades de la primera categoría, ambas
      // quedan antes que la segunda al ordenar por categoriasObjetivo, y
      // el combo terminaría siendo "lo mismo para los dos", no la
      // secuencia que pidió cada persona.
      const primera = candidatos.find((c) => c.categoria === categoriasObjetivo[0]);
      const segunda = candidatos.find((c) => c.categoria === categoriasObjetivo[1]);
      if (primera && segunda) combosCompletos.push(D.tools.armarCombo([primera.id, segunda.id], opciones));
    } else if (explorar) {
      // Comparar de verdad = actividades distintas entre si, no "A" vs
      // "A+B" (una opcion no puede contener a la otra adentro, si no no
      // hay nada que decidir). Ademas, un combo de 1 sola actividad no
      // paga el costo de traslado entre zonas (no hay "entre" que medir),
      // asi que sin filtro geografico se podia comparar un trekking en
      // Santiago contra uno a 700km en Pucon como si fueran alternativas
      // reales para el mismo fin de semana — se descarta lo que no esta
      // en la misma zona que la primera opcion.
      const RADIO_MISMA_ZONA_KM = 150;
      const ancla = candidatos[0];
      const candidatosZona = candidatos.filter((c) => D.tools._internas.haversineKm(ancla.ubicacion, c.ubicacion) <= RADIO_MISMA_ZONA_KM);
      combosCompletos.push(...candidatosZona.slice(0, 3).map((c) => D.tools.armarCombo([c.id], opciones)));
    } else {
      if (top3.length >= 2) combosCompletos.push(D.tools.armarCombo([top3[0].id, top3[1].id], opciones));
      if (top3.length >= 1) combosCompletos.push(D.tools.armarCombo([top3[0].id], opciones));
      if (top3.length >= 3) combosCompletos.push(D.tools.armarCombo([top3[0].id, top3[2].id], opciones));
    }
    const combosValidos = combosCompletos.filter(Boolean);
    if (!combosValidos.length) return null;

    const afinidadesMap = {};
    for (const i of perfil.intereses) afinidadesMap[i.categoria] = i.afinidad || 0;

    const perfilRanking = {
      arquetipos: perfil.arquetipos, afinidades: afinidadesMap, presupuesto: perfil.presupuesto,
      grupo: perfil.grupo, restricciones: perfil.restricciones, historial_ids: perfil.historial_ids,
    };
    const contexto = { tiempo_util_del_dia_min: 600, clima: perfil.contexto.clima };
    const rankeados = D.algoritmos.rankearCombos(combosValidos, perfilRanking, contexto);
    if (!rankeados.length) return { sinResultados: true };

    const mapaCompletos = new Map(combosValidos.map((c) => [c.combo_id, c]));

    // D5: "al que explora, acompañalo con curiosidad" — si pidió comparar
    // y hay 2+ opciones reales (no aplica en modo divergencia, que ya
    // fuerza una sola combinación a propósito), se comparan en vez de
    // empujar 1 sola directo.
    if (explorar && !hayDivergencia && rankeados.length >= 2) {
      const opciones = rankeados.slice(0, 2).map((r) => ({ rankeado: r, completo: mapaCompletos.get(r.combo_id) }));
      return { texto: D.plantillas.formatearOpcionesComparadas(opciones), combosRankeados: rankeados, comboElegido: opciones[0].completo, esComparacion: true };
    }

    const mejor = rankeados[0];
    const comboCompleto = mapaCompletos.get(mejor.combo_id);

    // Distancia real (haversine) desde donde parte el cliente hasta el
    // primer panorama — antes solo se calculaba el traslado ENTRE
    // panoramas de un mismo combo, nunca desde el origen del cliente.
    if (perfil.origen && comboCompleto.actividades.length) {
      const primera = comboCompleto.actividades[0];
      comboCompleto.distancia_desde_origen_km = Math.round(D.tools._internas.haversineKm(perfil.origen, primera.ubicacion) * 10) / 10;
      comboCompleto.tiempo_desde_origen_min = D.tools._internas.estimarTrasladoMin({ ubicacion: perfil.origen }, primera);
      comboCompleto.origen_nombre = perfil.origen.nombre || null;
    }

    let texto = D.plantillas.formatearCombo(mejor, comboCompleto, perfil.arquetipos, perfil.contexto.clima, perfil.grupo.gustos_divergentes);
    if (perfil.ocasion_especial) texto = `Para tu ${perfil.ocasion_especial}, esto lo hace inolvidable. ${texto}`;
    const addon = ADDON_POR_CATEGORIA[comboCompleto.actividades[0].categoria];
    if (addon && perfil.intent_score.confianza >= 0.7) texto += `\n\n(Si quieres, le sumo ${addon} 😊)`;

    return { texto, combosRankeados: rankeados, comboElegido: comboCompleto };
  }

  // Secuencia fija cabaña + termas + trekking (sur de Chile) — demuestra el
  // plan de varios días de punta a punta con datos reales del catálogo
  // (a11/a12/a13). Generalizar esto a cualquier combinación de categorías
  // y regiones es trabajo aparte para cuando exista más catálogo real.
  const IDS_PLAN_SUR = ['a11', 'a12', 'a13'];

  function proponerPlanMultiDia(D, perfil) {
    const personas = (perfil.grupo.adultos || 1) + (perfil.grupo.ninos || 0);
    const plan = D.tools.armarPlanMultiDia(IDS_PLAN_SUR, {
      fechaInicio: perfil.fechas,
      personas,
      origen: perfil.origen,
    });
    if (!plan) return null;
    if (!plan.tiene_cupo) return { sinResultados: true };

    const texto = D.plantillas.formatearPlanMultiDia(plan, perfil.arquetipos, perfil.contexto.clima);
    return { texto, plan };
  }

  // "Cerca de ahi" es una promesa de distancia, no solo de tema: 80km es
  // un radio razonable para un mismo dia de panoramas (mas que eso ya es
  // otra salida). Sin este filtro, rankearCombos podia elegir algo con
  // buena afinidad pero a cientos de km — bien puntuado, pero no "cerca".
  const RADIO_CERCA_KM = 80;

  // "Panoramas cerca de ahí": arma candidatos de 1 actividad cada uno
  // (fuera del combo ya elegido, y dentro de RADIO_CERCA_KM) y los pasa
  // por rankearCombos real — a diferencia del nearbyItems() del sitio
  // (solo proximidad+categoría complementaria), acá además pesan perfil,
  // presupuesto, energía y clima.
  function sugerirRelacionados(D, perfil) {
    const ultimoCarrito = perfil.carrito[perfil.carrito.length - 1];
    if (!ultimoCarrito) return null;
    const idsCombo = ultimoCarrito.combo_id.split('-');
    const base = D.tools.detalleActividad(idsCombo[0]);
    if (!base) return null;

    const personas = (perfil.grupo.adultos || 1) + (perfil.grupo.ninos || 0);
    const candidatos = D.tools.buscarActividades({ excluir_ids: [...idsCombo, ...perfil.descartados] })
      .filter((c) => D.tools._internas.haversineKm(base.ubicacion, c.ubicacion) <= RADIO_CERCA_KM);
    const combosCandidatos = candidatos
      .map((c) => D.tools.armarCombo([c.id], { fecha: perfil.fechas, personas }))
      .filter(Boolean);
    if (!combosCandidatos.length) return { sinResultados: true };

    const afinidadesMap = {};
    for (const i of perfil.intereses) afinidadesMap[i.categoria] = i.afinidad || 0;
    const perfilRanking = {
      arquetipos: perfil.arquetipos, afinidades: afinidadesMap, presupuesto: perfil.presupuesto,
      grupo: perfil.grupo, restricciones: perfil.restricciones, historial_ids: perfil.historial_ids,
    };
    const contexto = { tiempo_util_del_dia_min: 600, clima: perfil.contexto.clima };
    const rankeados = D.algoritmos.rankearCombos(combosCandidatos, perfilRanking, contexto);
    if (!rankeados.length) return { sinResultados: true };

    const mapaCompletos = new Map(combosCandidatos.map((c) => [c.combo_id, c]));
    const top3 = rankeados.slice(0, 3).map((r) => {
      const completo = mapaCompletos.get(r.combo_id);
      const act = completo.actividades[0];
      return {
        actividad: act,
        distancia_km: Math.round(D.tools._internas.haversineKm(base.ubicacion, act.ubicacion) * 10) / 10,
        razones: r.razones,
      };
    });
    return { texto: D.plantillas.formatearRelacionados(top3, base), relacionados: top3 };
  }

  function procesarMensaje(sessionId, textoUsuario) {
    const D = window.PickmapDarwin;
    const perfil = cargarPerfil(sessionId);

    const categorias = detectarCategorias(textoUsuario);
    const estadoEmocional = detectarEstadoEmocional(textoUsuario);
    const señales = detectarSenales(textoUsuario);
    const ocasion = detectarOcasion(textoUsuario);
    const objecionDetectada = detectarObjecion(textoUsuario);
    const confirmacion = esConfirmacion(textoUsuario);
    const descarte = esDescarte(textoUsuario);
    const presupuesto = extraerPresupuesto(textoUsuario);
    const fecha = extraerFecha(textoUsuario);
    const divergencia = detectarDivergencia(textoUsuario, categorias);

    for (const c of categorias) if (!perfil.intereses.find((i) => i.categoria === c)) perfil.intereses.push({ categoria: c, afinidad: 0 });
    if (presupuesto) perfil.presupuesto.banda = [Math.round(presupuesto * 0.8), Math.round(presupuesto * 1.2)];
    if (fecha) perfil.fechas = fecha;
    if (ocasion) perfil.ocasion_especial = ocasion;
    if (estadoEmocional) perfil.estado_emocional = estadoEmocional;
    if (divergencia) perfil.grupo.gustos_divergentes = divergencia;

    const eventosDeEsteTurno = [];
    if (categorias.length) eventosDeEsteTurno.push({ tipo: 'busqueda', atributos: categorias });
    if (señales.includes('me_gusta') && categorias.length) { eventosDeEsteTurno.push({ tipo: 'favorito', atributos: categorias }); perfil.favoritos.push(...categorias); }
    if (señales.includes('carrito') && categorias.length) eventosDeEsteTurno.push({ tipo: 'carrito', atributos: categorias });
    if ((señales.includes('disponibilidad_fecha') || señales.includes('precio_final')) && categorias.length) eventosDeEsteTurno.push({ tipo: 'click_cta', atributos: categorias });
    if (descarte && categorias.length) { eventosDeEsteTurno.push({ tipo: 'descarte', atributos: categorias }); }
    for (const ev of eventosDeEsteTurno) D.tools.registrarInteraccion(sessionId, ev);

    const eventos = D.tools.obtenerEventos(sessionId);
    const intent = D.algoritmos.calcularConfianza(
      { intereses_declarados: perfil.intereses.map((i) => i.categoria), restricciones: perfil.restricciones },
      eventos,
    );
    perfil.intent_score = { que_quiere: intent.intencion_principal, confianza: intent.confianza };
    for (const cat of Object.keys(intent.afinidades)) {
      const existente = perfil.intereses.find((i) => i.categoria === cat);
      if (existente) existente.afinidad = intent.afinidades[cat]; else perfil.intereses.push({ categoria: cat, afinidad: intent.afinidades[cat] });
    }
    perfil.restricciones = [...new Set([...(perfil.restricciones || []), ...intent.restricciones_duras])];
    perfil.arquetipos = calcularArquetipos(perfil);
    perfil.etapa_embudo = detectarEtapaEmbudo(perfil, señales, confirmacion);

    let texto;
    const debug = { intent, señales, estadoEmocional, categorias, etapa: perfil.etapa_embudo };

    if (perfil.etapa_embudo === 'post_venta') {
      texto = '¡Que lo disfrutes muchísimo! Cuando vuelvas, cuéntame cómo te fue y te tengo el próximo panorama listo 🎉';
    } else if (perfil.etapa_embudo === 'decision') {
      texto = 'Perfecto, te lo dejo apartado. En breve te llega la confirmación con el punto de encuentro y todo el detalle.';
    } else if (perfil.carrito.length && esSaludoVacio(textoUsuario) && !categorias.length && !señales.length) {
      // C7: retoma el carrito pendiente en vez de tratarlo como cliente
      // nuevo — "¿seguimos con el combo del sábado que te gustó?".
      texto = D.plantillas.reenganche(perfil.carrito[perfil.carrito.length - 1]);
    } else if (pideRelacionados(textoUsuario)) {
      const resultado = sugerirRelacionados(D, perfil);
      if (!resultado || resultado.sinResultados) {
        texto = 'No encontré más panoramas relacionados cerca de ese por ahora — cuéntame si quieres otra categoría.';
      } else {
        texto = resultado.texto;
        debug.relacionados = resultado.relacionados;
      }
    } else if (esPlanMultiDia(textoUsuario)) {
      const resultado = proponerPlanMultiDia(D, perfil);
      if (!resultado) {
        texto = 'No pude armar el plan de varios días ahora mismo — cuéntame más y lo ajusto.';
      } else if (resultado.sinResultados) {
        texto = 'Encontré el plan pero no hay cupo para alguna fecha — probemos otra semana.';
      } else {
        texto = resultado.texto;
        debug.plan = resultado.plan;
      }
    } else if (estadoEmocional === 'frustrado') {
      texto = D.plantillas.respuestaEmocional('frustrado');
    } else if (objecionDetectada) {
      texto = D.plantillas.objecion(objecionDetectada);
    } else if (intent.confianza < 0.4 && !señales.length && estadoEmocional !== 'entusiasmado') {
      // "Entusiasmado" es la excepcion: A4 pide avanzar rapido al cierre,
      // no frenarlo con una pregunta aunque la confianza numerica sea baja
      // (la propia emocion ya es una senal fuerte de que hay que actuar).
      const base = D.plantillas.preguntaClarificadora(perfil);
      texto = estadoEmocional === 'abrumado' ? `${D.plantillas.respuestaEmocional('abrumado')} ${base}` : base;
    } else {
      const resultado = proponerCombos(D, perfil, quiereExplorar(textoUsuario));
      if (!resultado) {
        texto = 'No tengo panoramas que calcen 100% con eso ahora mismo, pero cuéntame más (categoría, fecha o presupuesto) y busco la opción más cercana.';
      } else if (resultado.sinResultados) {
        texto = 'Encontré actividades pero ninguna con cupo/condiciones para armar un combo ahora — probemos con otra fecha u otra categoría.';
      } else {
        // Abrumado/dudando con confianza suficiente para proponer: igual se
        // reconoce el estado antes del combo en vez de ignorarlo (regla A4
        // del prompt) — abrumado se simplifica, dudando se refuerza con el
        // dato mas relevante + prueba social (C5).
        let prefijo = '';
        if (estadoEmocional === 'abrumado') prefijo = `${D.plantillas.respuestaEmocional('abrumado')}\n\n`;
        else if (estadoEmocional === 'dudando') prefijo = `${D.plantillas.reforzarDuda(perfil)}\n\n`;
        texto = prefijo + resultado.texto;
        debug.combos = resultado.combosRankeados;
        perfil.carrito = [{ combo_id: resultado.comboElegido.combo_id, precio: resultado.comboElegido.precio_total }];
      }
    }

    guardarPerfil(sessionId, perfil);
    return { texto, perfil, debug };
  }

  window.PickmapDarwin = window.PickmapDarwin || {};
  window.PickmapDarwin.motor = {
    procesarMensaje, cargarPerfil, guardarPerfil, perfilPorDefecto,
    _internas: { detectarCategorias, detectarEstadoEmocional, detectarSenales, calcularArquetipos, detectarEtapaEmbudo },
  };
})();
