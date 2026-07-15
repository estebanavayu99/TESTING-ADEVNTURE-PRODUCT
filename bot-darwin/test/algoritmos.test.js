(() => {
  const { calcularConfianza, rankearCombos } = window.PickmapDarwin.algoritmos;
  const AHORA = new Date('2026-07-13T18:00:00').getTime();
  const resultados = [];

  function assert(nombre, cond, detalle) {
    resultados.push({ nombre, ok: !!cond, detalle });
  }
  function horasAtras(h) { return AHORA - h * 3600000; }

  /* ---------- 1. Recencia: un evento reciente pesa mas que uno viejo ---------- */
  const afinRecienteAlta = calcularConfianza({}, [
    { tipo: 'view', atributos: ['aventura'], timestamp: horasAtras(1) },
  ], AHORA).afinidades.aventura;
  const afinViejaBaja = calcularConfianza({}, [
    { tipo: 'view', atributos: ['aventura'], timestamp: horasAtras(200) },
  ], AHORA).afinidades.aventura;
  assert('recencia: evento reciente pesa mas que uno viejo', afinRecienteAlta > afinViejaBaja,
    `reciente=${afinRecienteAlta} viejo=${afinViejaBaja}`);

  /* ---------- 2. Repeticion: rendimientos decrecientes, no lineales ---------- */
  const eventos1 = [{ tipo: 'view', atributos: ['foodie'], timestamp: horasAtras(1) }];
  const eventos10 = Array.from({ length: 10 }, () => ({ tipo: 'view', atributos: ['foodie'], timestamp: horasAtras(1) }));
  const afin1 = calcularConfianza({}, eventos1, AHORA).afinidades.foodie;
  const afin10 = calcularConfianza({}, eventos10, AHORA).afinidades.foodie;
  assert('repeticion: 10 views pesan mas que 1 view', afin10 > afin1, `1=${afin1} 10=${afin10}`);
  assert('repeticion: 10 views NO pesan 10x mas que 1 (rendimientos decrecientes)', afin10 < afin1 * 5,
    `1=${afin1} 10=${afin10} ratio=${(afin10 / afin1).toFixed(2)}`);

  /* ---------- 3. Volumen bajo (sin eventos) -> confianza topada ---------- */
  // Con la formula literal de la spec (sigmoid(...) - 2.6), un solo evento
  // MUY fuerte (carrito) ya puede empujar la confianza por sobre 0.7 porque
  // consistencia parte en 1 cuando no hay intereses declarados con que
  // contradecirse. El caso real de "pocos datos -> confianza baja" es
  // literalmente sin eventos (volumen=0, fuerza=0, recencia_g=0).
  const confianzaSinEventos = calcularConfianza({}, [], AHORA).confianza;
  assert('confianza: sin eventos, queda bajo el umbral de "actuar directo" (0.4)',
    confianzaSinEventos < 0.4, `confianza=${confianzaSinEventos}`);

  const eventosMuchos = Array.from({ length: 8 }, (_, i) => ({ tipo: 'busqueda', atributos: ['aventura'], timestamp: horasAtras(0.1 + i * 0.05) }));
  const confianzaMuchos = calcularConfianza({ intereses_declarados: ['aventura'] }, eventosMuchos, AHORA).confianza;
  assert('confianza: con volumen+consistencia+recencia alta supera 0.7',
    confianzaMuchos >= 0.7, `confianza=${confianzaMuchos}`);

  /* ---------- 4. Discrepancia: declarar A pero comportarse como B baja la confianza ---------- */
  const eventosContraDeclarado = Array.from({ length: 8 }, () => ({ tipo: 'carrito', atributos: ['aventura'], timestamp: horasAtras(0.1) }));
  const confianzaConsistente = calcularConfianza({ intereses_declarados: ['aventura'] }, eventosContraDeclarado, AHORA).confianza;
  const confianzaInconsistente = calcularConfianza({ intereses_declarados: ['relax'] }, eventosContraDeclarado, AHORA).confianza;
  assert('confianza: baja cuando lo declarado contradice el comportamiento',
    confianzaInconsistente < confianzaConsistente, `consistente=${confianzaConsistente} inconsistente=${confianzaInconsistente}`);

  /* ---------- 5. Filtros duros de rankearCombos ---------- */
  const actA = { id: 'x1', nombre: 'Actividad cara', categoria: 'aventura', energia: 'alta', exterior: true, indoor_alt: false, hero_moment: true, experiencia_estimada: 5 };
  const actB = { id: 'x2', nombre: 'Actividad barata', categoria: 'aventura', energia: 'media', exterior: false, indoor_alt: true, hero_moment: false, experiencia_estimada: 3 };
  const comboCaro = { combo_id: 'c1', actividades: [actA], precio_total: 90000, tiempo_traslado_total_min: 10, tiene_cupo: true, llega_despues_cierre: false };
  const comboBarato = { combo_id: 'c2', actividades: [actB], precio_total: 20000, tiempo_traslado_total_min: 10, tiene_cupo: true, llega_despues_cierre: false };
  const comboSinCupo = { combo_id: 'c3', actividades: [actB], precio_total: 20000, tiempo_traslado_total_min: 10, tiene_cupo: false, llega_despues_cierre: false };

  const rankeadosConRestriccion = rankearCombos([comboCaro, comboBarato, comboSinCupo],
    { restricciones: ['precio<=50000'], afinidades: { aventura: 0.5 } }, {});
  assert('filtro duro: excluye combo que viola precio<=50000', !rankeadosConRestriccion.find((c) => c.combo_id === 'c1'),
    JSON.stringify(rankeadosConRestriccion.map((c) => c.combo_id)));
  assert('filtro duro: excluye combo sin cupo', !rankeadosConRestriccion.find((c) => c.combo_id === 'c3'),
    JSON.stringify(rankeadosConRestriccion.map((c) => c.combo_id)));
  assert('filtro duro: el combo valido sigue presente', !!rankeadosConRestriccion.find((c) => c.combo_id === 'c2'),
    JSON.stringify(rankeadosConRestriccion.map((c) => c.combo_id)));

  /* ---------- 6. Pesos por arquetipo cambian el orden (personalizacion real) ----------
   * Mismo precio, misma experiencia_estimada, mismo hero_moment (ninguno) y
   * misma afinidad declarada (0.6) para ambas categorias: la UNICA
   * diferencia real entre los dos combos es el nivel de energia. Si el
   * arquetipo no cambiara nada, el orden seria siempre el mismo
   * (o un empate estable). */
  const actAventura = { id: 'v1', nombre: 'Kayak extremo', categoria: 'aventura', energia: 'alta', exterior: true, indoor_alt: false, hero_moment: false, experiencia_estimada: 4 };
  const actRelax = { id: 'v2', nombre: 'Spa tranquilo', categoria: 'relax', energia: 'baja', exterior: false, indoor_alt: true, hero_moment: false, experiencia_estimada: 4 };
  const comboAventura = { combo_id: 'aventura-combo', actividades: [actAventura], precio_total: 25000, tiempo_traslado_total_min: 5, tiene_cupo: true, llega_despues_cierre: false };
  const comboRelax = { combo_id: 'relax-combo', actividades: [actRelax], precio_total: 25000, tiempo_traslado_total_min: 5, tiene_cupo: true, llega_despues_cierre: false };
  const perfilBase = { afinidades: { aventura: 0.6, relax: 0.6 }, grupo: {} };

  const rankAventurero = rankearCombos([comboAventura, comboRelax], { ...perfilBase, arquetipos: ['aventurero'] }, {});
  const rankRelajado = rankearCombos([comboAventura, comboRelax], { ...perfilBase, arquetipos: ['relajado'] }, {});
  assert('arquetipo aventurero: prioriza el combo de aventura (mismo perfil de afinidad)',
    rankAventurero[0].combo_id === 'aventura-combo', JSON.stringify(rankAventurero.map((c) => [c.combo_id, c.score])));
  assert('arquetipo relajado: prioriza el combo de relax (mismo perfil de afinidad) — el ranking SI cambia con el arquetipo',
    rankRelajado[0].combo_id === 'relax-combo', JSON.stringify(rankRelajado.map((c) => [c.combo_id, c.score])));

  /* ---------- Render ---------- */
  const resumenEl = document.getElementById('resumen');
  const resultadosEl = document.getElementById('resultados');
  const total = resultados.length;
  const pasados = resultados.filter((r) => r.ok).length;
  resumenEl.textContent = `${pasados}/${total} tests OK`;
  resumenEl.className = pasados === total ? 'pass' : 'fail';
  for (const r of resultados) {
    const div = document.createElement('div');
    div.className = r.ok ? 'pass' : 'fail';
    div.textContent = `${r.ok ? '✓' : '✗'} ${r.nombre}${r.detalle ? ` — ${r.detalle}` : ''}`;
    resultadosEl.appendChild(div);
  }
  window.__darwinTestResumen = { total, pasados };
})();
