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

  function detectarCategorias(texto) {
    const t = sinAcentos(texto);
    return Object.keys(CATEGORIA_KEYWORDS).filter((cat) => CATEGORIA_KEYWORDS[cat].some((kw) => t.includes(sinAcentos(kw))));
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

  function proponerCombos(D, perfil) {
    const categoriasObjetivo = perfil.intereses
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

    const combosCompletos = [];
    const top3 = candidatos.slice(0, 3);
    if (top3.length >= 2) combosCompletos.push(D.tools.armarCombo([top3[0].id, top3[1].id], opciones));
    if (top3.length >= 1) combosCompletos.push(D.tools.armarCombo([top3[0].id], opciones));
    if (top3.length >= 3) combosCompletos.push(D.tools.armarCombo([top3[0].id, top3[2].id], opciones));
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
    const mejor = rankeados[0];
    const comboCompleto = mapaCompletos.get(mejor.combo_id);

    let texto = D.plantillas.formatearCombo(mejor, comboCompleto, perfil.arquetipos);
    if (perfil.ocasion_especial) texto = `Para tu ${perfil.ocasion_especial}, esto lo hace inolvidable. ${texto}`;
    const addon = ADDON_POR_CATEGORIA[comboCompleto.actividades[0].categoria];
    if (addon && perfil.intent_score.confianza >= 0.7) texto += `\n\n(Si quieres, le sumo ${addon} 😊)`;

    return { texto, combosRankeados: rankeados, comboElegido: comboCompleto };
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

    for (const c of categorias) if (!perfil.intereses.find((i) => i.categoria === c)) perfil.intereses.push({ categoria: c, afinidad: 0 });
    if (presupuesto) perfil.presupuesto.banda = [Math.round(presupuesto * 0.8), Math.round(presupuesto * 1.2)];
    if (fecha) perfil.fechas = fecha;
    if (ocasion) perfil.ocasion_especial = ocasion;
    if (estadoEmocional) perfil.estado_emocional = estadoEmocional;

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
    } else if (estadoEmocional === 'frustrado') {
      texto = D.plantillas.respuestaEmocional('frustrado');
    } else if (objecionDetectada) {
      texto = D.plantillas.objecion(objecionDetectada);
    } else if (intent.confianza < 0.4 && !señales.length) {
      const base = D.plantillas.preguntaClarificadora(perfil);
      texto = estadoEmocional === 'abrumado' ? `${D.plantillas.respuestaEmocional('abrumado')} ${base}` : base;
    } else {
      const resultado = proponerCombos(D, perfil);
      if (!resultado) {
        texto = 'No tengo panoramas que calcen 100% con eso ahora mismo, pero cuéntame más (categoría, fecha o presupuesto) y busco la opción más cercana.';
      } else if (resultado.sinResultados) {
        texto = 'Encontré actividades pero ninguna con cupo/condiciones para armar un combo ahora — probemos con otra fecha u otra categoría.';
      } else {
        // Abrumado con confianza media/alta: igual se simplifica a 1 sola
        // opción (ya lo hace proponerCombos), pero se reconoce el estado
        // antes de proponer en vez de ignorarlo (regla A4 del prompt).
        texto = estadoEmocional === 'abrumado' ? `${D.plantillas.respuestaEmocional('abrumado')}\n\n${resultado.texto}` : resultado.texto;
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
