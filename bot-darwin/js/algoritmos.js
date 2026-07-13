/* PickMap — Darwin — Algoritmos (musculo matematico)
 *
 * Implementa 1:1 pickmap_algoritmos_spec.pdf:
 *   - calcularConfianza(config, eventos) -> intent_score
 *   - rankearCombos(candidatos, perfil, contexto) -> combos ordenados
 *
 * Son funciones deterministicas puras (mismos inputs -> mismos outputs).
 * No dependen de DOM, red ni localStorage: se pueden testear aisladas
 * (ver test/algoritmos.test.html) y mover a un backend real sin tocarlas.
 */
(() => {
  const PESOS = {
    busqueda: 1.0,
    carrito: 0.95,
    click_cta: 0.9,
    favorito: 0.8,
    filtro: 0.7,
    dwell: 0.5,
    view: 0.25,
    reserva_pasada: 0.85,
    descarte: -0.7,
  };

  function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }
  function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }
  function recencia(edadHoras) { return Math.exp(-0.05 * Math.max(0, edadHoras)); }
  function repeticion(n) { return 1 + Math.log(Math.max(1, n)); }
  function factorDwell(ms) { return clamp((ms || 0) / 30000, 0.5, 1.5); }

  function edadHorasDesde(timestamp, ahoraMs) {
    const t = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
    if (!Number.isFinite(t)) return 0;
    return Math.max(0, (ahoraMs - t) / 3600000);
  }

  /*
   * La spec da "afinidad[a] = Σ_eventos(PESO*recencia*repeticion)" en
   * pseudocodigo, pero sumar el mismo factor de repeticion() en CADA
   * evento repetido no amortigua nada: amplifica (10 views con
   * repeticion(10)=3.3 pesarian 10x mas que sin dampening, no menos).
   * Para lograr el "rendimientos decrecientes" que pide el doc,
   * agrupamos por (tipo, atributo): cada grupo aporta una sola vez,
   * con la recencia de su evento mas reciente y repeticion(n) sobre el
   * conteo del grupo. Así 10 views quedan en ~3.3x el peso base, no en 10x.
   */
  function calcularAfinidades(eventos, ahoraMs) {
    const grupos = new Map(); // key: atributo|||tipo -> { n, masReciente, dwellMs[] }
    for (const ev of eventos || []) {
      const peso = PESOS[ev.tipo];
      if (peso === undefined) continue;
      const atributos = ev.atributos || (ev.atributo ? [ev.atributo] : []);
      for (const a of atributos) {
        const key = `${a}|||${ev.tipo}`;
        const g = grupos.get(key) || { atributo: a, tipo: ev.tipo, n: 0, masRecienteMs: -Infinity, dwellMsSum: 0 };
        g.n += 1;
        const ts = typeof ev.timestamp === 'number' ? ev.timestamp : new Date(ev.timestamp).getTime();
        if (Number.isFinite(ts) && ts > g.masRecienteMs) g.masRecienteMs = ts;
        if (ev.tipo === 'dwell') g.dwellMsSum += (ev.duracion_ms || 0);
        grupos.set(key, g);
      }
    }

    const afinidadRaw = {};
    for (const g of grupos.values()) {
      const peso = PESOS[g.tipo];
      const edad = Number.isFinite(g.masRecienteMs) ? edadHorasDesde(g.masRecienteMs, ahoraMs) : 0;
      const dwellFactor = g.tipo === 'dwell' ? factorDwell(g.dwellMsSum / g.n) : 1;
      const contribucion = peso * recencia(edad) * repeticion(g.n) * dwellFactor;
      afinidadRaw[g.atributo] = (afinidadRaw[g.atributo] || 0) + contribucion;
    }

    const afinidades = {};
    for (const a of Object.keys(afinidadRaw)) afinidades[a] = Math.tanh(afinidadRaw[a]);
    return afinidades;
  }

  function discrepancia(interesesDeclarados, afinidades) {
    if (!interesesDeclarados || !interesesDeclarados.length) return 0;
    const valores = Object.values(afinidades);
    if (!valores.length) return 0;
    const aTop = Math.max(...valores);
    const aDeclarado = Math.max(...interesesDeclarados.map((c) => afinidades[c] ?? 0));
    // afinidad vive en [-1,1]; la brecha maxima posible es 2 -> normaliza a [0,1]
    return clamp((aTop - aDeclarado) / 2, 0, 1);
  }

  /**
   * calcularConfianza(config, eventos) -> intent_score
   * config: { intereses_declarados?: string[], restricciones?: string[] }
   * eventos: { tipo, atributos?: string[], atributo?: string, timestamp, duracion_ms? }[]
   */
  function calcularConfianza(config, eventos, ahoraMs = Date.now()) {
    const cfg = config || {};
    const evs = eventos || [];
    const afinidades = calcularAfinidades(evs, ahoraMs);

    const positivas = Object.values(afinidades).filter((v) => v > 0);
    const fuerza = positivas.length ? Math.max(...positivas) : 0;

    const nRelevantes = evs.filter((e) => PESOS[e.tipo] !== undefined).length;
    const volumen = clamp(nRelevantes / 8, 0, 1);

    const consistencia = 1 - discrepancia(cfg.intereses_declarados, afinidades);

    const timestamps = evs
      .map((e) => (typeof e.timestamp === 'number' ? e.timestamp : new Date(e.timestamp).getTime()))
      .filter((t) => Number.isFinite(t));
    const recenciaG = timestamps.length ? recencia(edadHorasDesde(Math.max(...timestamps), ahoraMs)) : 0;

    const confianza = sigmoid(1.8 * fuerza + 1.2 * volumen + 1.5 * consistencia + 0.8 * recenciaG - 2.6);

    let intencionPrincipal = null;
    let mejorValor = -Infinity;
    for (const [cat, val] of Object.entries(afinidades)) {
      if (val > mejorValor) { mejorValor = val; intencionPrincipal = cat; }
    }
    if (mejorValor <= 0) intencionPrincipal = null;

    const restriccionesDuras = new Set(cfg.restricciones || []);
    for (const e of evs) {
      if (e.tipo === 'filtro' && e.es_restriccion_dura) {
        for (const a of (e.atributos || (e.atributo ? [e.atributo] : []))) restriccionesDuras.add(a);
      }
    }

    const senalNegativa = new Set();
    for (const e of evs) {
      if (e.tipo === 'descarte') {
        for (const a of (e.atributos || (e.atributo ? [e.atributo] : []))) senalNegativa.add(a);
      }
    }

    return {
      intencion_principal: intencionPrincipal,
      confianza: Math.round(confianza * 1000) / 1000,
      afinidades,
      restricciones_duras: [...restriccionesDuras],
      senal_negativa: [...senalNegativa],
    };
  }

  /* ---------------------------------------------------------------- */

  // Pesos base w1..w8 en el orden f_perfil, f_presupuesto, f_energia,
  // f_logistica, f_clima, f_valor, f_novedad, f_narrativa.
  const DIMENSIONES = ['perfil', 'presupuesto', 'energia', 'logistica', 'clima', 'valor', 'novedad', 'narrativa'];
  const PESOS_BASE = { perfil: 1, presupuesto: 1, energia: 1, logistica: 1, clima: 1, valor: 1, novedad: 1, narrativa: 1 };

  // 2.3 de la spec da direcciones (↑ / ↑↑ / →) para 5 arquetipos; los otros
  // 3 arquetipos de A3 del system prompt no estaban en la tabla y se
  // extendieron aqui con el mismo criterio (marcados abajo).
  const MULT_ARQUETIPO = {
    aventurero: { perfil: 1.3, energia: 1.3, valor: 1.0, clima: 1.3 },
    relajado: { energia: 1.3, logistica: 1.3, narrativa: 1.3, presupuesto: 1.0 },
    foodie: { perfil: 1.3, valor: 1.3, narrativa: 1.3 },
    familiar: { energia: 1.6, logistica: 1.3, clima: 1.3, presupuesto: 1.3 },
    romantico: { narrativa: 1.6, perfil: 1.3, valor: 1.0 },
    // extendidos (no venian en la spec de algoritmos, solo en A3 del prompt):
    cultural: { perfil: 1.3, narrativa: 1.3, valor: 1.0 },
    social_fiestero: { perfil: 1.3, energia: 1.3, clima: 0.8 },
    explorador_local: { novedad: 1.6, perfil: 1.3, valor: 1.3 },
  };

  function pesosParaArquetipos(arquetipos) {
    const pesos = { ...PESOS_BASE };
    for (const arq of arquetipos || []) {
      const mult = MULT_ARQUETIPO[arq];
      if (!mult) continue;
      for (const dim of Object.keys(mult)) pesos[dim] = (pesos[dim] ?? 1) * mult[dim];
    }
    return pesos;
  }

  function parseRestriccion(regla) {
    let m;
    if ((m = /^precio<=(\d+)$/.exec(regla))) return { tipo: 'precio_max', valor: Number(m[1]) };
    if ((m = /^precio<(\d+)$/.exec(regla))) return { tipo: 'precio_max_estricto', valor: Number(m[1]) };
    if ((m = /^sin_(.+)$/.exec(regla))) return { tipo: 'excluye_tag', valor: m[1] };
    if (regla === 'accesible') return { tipo: 'accesible' };
    return { tipo: 'desconocida', valor: regla };
  }

  function violaRestriccion(combo, regla) {
    const r = parseRestriccion(regla);
    const actividades = combo.actividades || [];
    switch (r.tipo) {
      case 'precio_max': return combo.precio_total > r.valor;
      case 'precio_max_estricto': return combo.precio_total >= r.valor;
      case 'excluye_tag': return actividades.some((a) => (a.tags || []).includes(r.valor));
      case 'accesible': return actividades.some((a) => a.accesible === false);
      default: return false;
    }
  }

  function climaEsIncompatible(combo, contexto) {
    const clima = contexto && contexto.clima;
    if (!clima || !clima.evento_severo) return false;
    return (combo.actividades || []).some((a) => a.exterior && !a.indoor_alt && !combo.plan_b);
  }

  const ENERGIA_VALOR = { baja: 1, media: 2, alta: 3 };

  function energiaTotal(combo) {
    return (combo.actividades || []).reduce((acc, a) => acc + (ENERGIA_VALOR[a.energia] || 1), 0);
  }

  function capacidadGrupo(perfil) {
    const grupo = (perfil && perfil.grupo) || {};
    const arquetipos = (perfil && perfil.arquetipos) || [];
    let cap = (grupo.ninos || grupo.tipo === 'adultos_mayores') ? 4 : 6;
    // El "energia↑(tolera carga)" / "energia↑(evita carga)" de 2.3 no es solo
    // un peso sobre la dimension: tambien mueve el umbral de "carga excesiva"
    // en si (sin esto, subir el peso de f_energia no cambia nada si ningun
    // combo excede la capacidad neutral).
    if (arquetipos.includes('aventurero')) cap += 2;
    if (arquetipos.includes('relajado')) cap = Math.min(cap, 2);
    return cap;
  }

  function fPerfil(combo, afinidades) {
    const actividades = combo.actividades || [];
    if (!actividades.length || !afinidades) return 0.5;
    const vals = actividades.map((a) => (afinidades[a.categoria] ?? 0));
    const prom = vals.reduce((s, v) => s + v, 0) / vals.length;
    return clamp((prom + 1) / 2, 0, 1);
  }

  function fPresupuesto(combo, perfil) {
    const banda = perfil && perfil.presupuesto && perfil.presupuesto.banda;
    if (!banda) return 0.5;
    const objetivo = Array.isArray(banda) ? (banda[0] + banda[1]) / 2 : banda;
    if (!objetivo) return 0.5;
    return clamp(1 - Math.abs(combo.precio_total - objetivo) / objetivo, 0, 1);
  }

  function fEnergia(combo, perfil) {
    const total = energiaTotal(combo);
    const cap = capacidadGrupo(perfil);
    if (total <= cap) return 1;
    return clamp(1 - (total - cap) / cap, 0, 1);
  }

  function fLogistica(combo, contexto) {
    const util = (contexto && contexto.tiempo_util_del_dia_min) || 600;
    const traslado = combo.tiempo_traslado_total_min || 0;
    return clamp(1 - traslado / util, 0, 1);
  }

  function fClima(combo, contexto) {
    const clima = contexto && contexto.clima;
    if (!clima || !clima.lluvia_prob) return 1;
    const actividades = combo.actividades || [];
    const expuestas = actividades.filter((a) => a.exterior && !a.indoor_alt);
    if (!expuestas.length) return 1;
    if (clima.lluvia_prob >= 0.6) return combo.plan_b ? 0.6 : 0.2;
    if (clima.lluvia_prob >= 0.3) return 0.7;
    return 0.9;
  }

  function fValor(combo, minMax) {
    const actividades = combo.actividades || [];
    const experiencia = actividades.reduce((s, a) => s + (a.experiencia_estimada || 3), 0);
    const valorCrudo = combo.precio_total > 0 ? experiencia / combo.precio_total : 0;
    const { min, max } = minMax;
    if (max === min) return 0.5;
    return clamp((valorCrudo - min) / (max - min), 0, 1);
  }

  function valorCrudoDeCombo(combo) {
    const actividades = combo.actividades || [];
    const experiencia = actividades.reduce((s, a) => s + (a.experiencia_estimada || 3), 0);
    return combo.precio_total > 0 ? experiencia / combo.precio_total : 0;
  }

  function fNovedad(combo, perfil) {
    const historial = new Set((perfil && perfil.historial_ids) || []);
    const actividades = combo.actividades || [];
    if (!actividades.length) return 1;
    const nuevas = actividades.filter((a) => !historial.has(a.id)).length;
    return nuevas / actividades.length;
  }

  function fNarrativa(combo) {
    const actividades = combo.actividades || [];
    if (!actividades.length) return 0.4;
    const idx = actividades.findIndex((a) => a.hero_moment);
    if (idx === -1) return 0.4;
    return idx === actividades.length - 1 ? 1 : 0.7;
  }

  function razonesPara(combo, dims, afinidades, contexto) {
    const razones = [];
    if (combo.actividades && combo.actividades.length) {
      const top = combo.actividades.reduce((best, a) => {
        const v = afinidades ? (afinidades[a.categoria] ?? 0) : 0;
        return v > best.v ? { a, v } : best;
      }, { a: null, v: -Infinity });
      if (top.a && top.v > 0) razones.push(`calza con ${top.a.categoria} (${top.v.toFixed(2)})`);
    }
    // Solo se menciona el clima si hay un dato real de la tool `clima` en
    // contexto — nunca inventar "buen clima" cuando en realidad no se
    // consultó (regla E5 del system prompt: no prometer lo que las tools
    // no confirmen).
    const hayClimaReal = !!(contexto && contexto.clima);
    if (hayClimaReal) {
      if (dims.clima >= 0.9) razones.push('buen clima para el plan');
      else if (dims.clima <= 0.3) razones.push('clima adverso, con plan B listo');
    }
    if (combo.actividades && combo.actividades.length > 1 && combo.tiempo_traslado_total_min !== undefined) {
      razones.push(`traslados ${combo.tiempo_traslado_total_min} min`);
    }
    const ultima = (combo.actividades || [])[((combo.actividades || []).length || 1) - 1];
    if (ultima && ultima.hero_moment) razones.push(`cierra con ${ultima.nombre}`);
    return razones;
  }

  /**
   * rankearCombos(candidatos, perfil, contexto) -> combos ordenados
   * candidatos: combo[] con { combo_id, actividades[], precio_total,
   *   tiempo_traslado_total_min, tiene_cupo, llega_despues_cierre, plan_b? }
   * perfil: { arquetipos, afinidades (de intent_score), presupuesto, grupo,
   *   restricciones, historial_ids }
   * contexto: { clima, tiempo_util_del_dia_min }
   */
  function rankearCombos(candidatos, perfil, contexto) {
    const p = perfil || {};
    const ctx = contexto || {};
    const restricciones = [...(p.restricciones || []), ...(p.restricciones_duras || [])];

    const sobrevivientes = (candidatos || []).filter((combo) => {
      if (combo.tiene_cupo === false) return false;
      if (combo.llega_despues_cierre) return false;
      if (restricciones.some((r) => violaRestriccion(combo, r))) return false;
      if (climaEsIncompatible(combo, ctx)) return false;
      return true;
    });

    if (!sobrevivientes.length) return [];

    const valoresCrudos = sobrevivientes.map(valorCrudoDeCombo);
    const minMax = { min: Math.min(...valoresCrudos), max: Math.max(...valoresCrudos) };
    const pesos = pesosParaArquetipos(p.arquetipos);
    const sumaPesos = DIMENSIONES.reduce((s, d) => s + pesos[d], 0);

    const evaluados = sobrevivientes.map((combo) => {
      const dims = {
        perfil: fPerfil(combo, p.afinidades),
        presupuesto: fPresupuesto(combo, p),
        energia: fEnergia(combo, p),
        logistica: fLogistica(combo, ctx),
        clima: fClima(combo, ctx),
        valor: fValor(combo, minMax),
        novedad: fNovedad(combo, p),
        narrativa: fNarrativa(combo),
      };
      const score = DIMENSIONES.reduce((s, d) => s + pesos[d] * dims[d], 0) / sumaPesos;
      return {
        combo_id: combo.combo_id,
        score: Math.round(score * 1000) / 1000,
        precio: combo.precio_total,
        razones: razonesPara(combo, dims, p.afinidades, ctx),
        plan_b: combo.plan_b || null,
        _dims: dims,
      };
    });

    evaluados.sort((a, b) => b.score - a.score);
    return evaluados;
  }

  window.PickmapDarwin = window.PickmapDarwin || {};
  window.PickmapDarwin.algoritmos = {
    calcularConfianza,
    rankearCombos,
    // exportadas para tests/depuracion:
    _internas: { PESOS, recencia, repeticion, factorDwell, sigmoid, pesosParaArquetipos, parseRestriccion },
  };
})();
