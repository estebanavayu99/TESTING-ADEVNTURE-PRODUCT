/* PickMap — Darwin — Tools de Prioridad 3 (afinamiento, no bloqueantes)
 *
 * afluencia: heuristica por hora/dia (PLACEHOLDER). El doc de fuentes
 * dice reemplazarla por datos reales de reservas o "popular times" del
 * negocio ni bien existan.
 * eventos_locales: calendario de feriados fijos de Chile (PLACEHOLDER,
 * solo feriados de fecha fija para no arriesgar errores con los moviles).
 * Reemplazar por un calendario real de feriados/festivales por ciudad.
 */
(() => {
  function nivelDesdeScore(score) {
    if (score >= 0.66) return 'alto';
    if (score >= 0.33) return 'medio';
    return 'bajo';
  }

  function afluencia({ fecha, hora, categoria } = {}) {
    const horaNum = hora ? Number(hora.split(':')[0]) : 12;
    let score;
    if (horaNum >= 12 && horaNum <= 14) score = 0.8;
    else if (horaNum >= 18 && horaNum <= 20) score = 0.75;
    else if ((horaNum >= 9 && horaNum <= 11) || (horaNum >= 15 && horaNum <= 17)) score = 0.45;
    else score = 0.2;

    if (fecha) {
      const dia = new Date(`${fecha}T12:00:00`).getDay(); // 0=domingo, 6=sabado
      if (dia === 0 || dia === 6) score = Math.min(1, score + 0.15);
    }
    if (categoria === 'cultural' || categoria === 'foodie') score = Math.min(1, score + 0.05);

    return { nivel: nivelDesdeScore(score), score: Math.round(score * 100) / 100 };
  }

  function mejorHorarioBajaAfluencia(horariosDisponibles, fecha, categoria) {
    return horariosDisponibles
      .map((h) => ({ ...h, afluencia: afluencia({ fecha, hora: h.hora, categoria }) }))
      .sort((a, b) => a.afluencia.score - b.afluencia.score)[0] || null;
  }

  // Solo feriados chilenos de fecha fija (no depende del año: valen para cualquier fecha real).
  const FERIADOS_FIJOS_CL = [
    { mes: 1, dia: 1, nombre: 'Año Nuevo' },
    { mes: 5, dia: 1, nombre: 'Día del Trabajo' },
    { mes: 5, dia: 21, nombre: 'Día de las Glorias Navales' },
    { mes: 9, dia: 18, nombre: 'Fiestas Patrias' },
    { mes: 9, dia: 19, nombre: 'Día de las Glorias del Ejército' },
    { mes: 12, dia: 25, nombre: 'Navidad' },
  ];

  function eventosLocales({ fechaInicio, fechaFin } = {}) {
    const inicio = fechaInicio ? new Date(`${fechaInicio}T00:00:00`) : new Date();
    const fin = fechaFin ? new Date(`${fechaFin}T23:59:59`) : new Date(inicio.getTime() + 30 * 86400000);
    const eventos = [];
    for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
      const feriado = FERIADOS_FIJOS_CL.find((f) => f.mes === d.getMonth() + 1 && f.dia === d.getDate());
      if (feriado) eventos.push({ fecha: d.toISOString().slice(0, 10), nombre: feriado.nombre, tipo: 'feriado' });
    }
    return eventos;
  }

  window.PickmapDarwin = window.PickmapDarwin || {};
  window.PickmapDarwin.prioridad3 = { afluencia, mejorHorarioBajaAfluencia, eventosLocales };
})();
