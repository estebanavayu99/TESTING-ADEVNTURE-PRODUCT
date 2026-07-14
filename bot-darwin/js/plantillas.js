/* PickMap — Darwin — Plantillas de salida (E4 del system prompt v4)
 *
 * Sin LLM real (decision del usuario: motor 100% reglas/heuristicas),
 * asi que la "voz" de Darwin sale de plantillas con variacion por
 * arquetipo y estado emocional, no de generacion libre.
 */
(() => {
  const TONO_ARQUETIPO = {
    aventurero: { intro: '¡Esto te va a subir la adrenalina!', cierre: '¿Nos lanzamos?' },
    relajado: { intro: 'Te armé algo con ritmo tranquilo, sin apuro.', cierre: '¿Te lo dejo listo para que solo aparezcas?' },
    foodie: { intro: 'Esto tiene sabores que no te vas a querer perder.', cierre: '¿Te lo aparto?' },
    cultural: { intro: 'Esto tiene historia real detrás, no es la típica trampa turística.', cierre: '¿Seguimos con esto?' },
    romantico: { intro: 'Esto se siente hecho para ustedes dos.', cierre: '¿Te lo dejo apartado para esa fecha especial?' },
    familiar: { intro: 'Pensado para que todos, grandes y chicos, la pasen bien.', cierre: '¿Lo reservamos?' },
    social_fiestero: { intro: 'Esto tiene la energía que buscas.', cierre: '¿Vamos con esto?' },
    explorador_local: { intro: 'Esto casi nadie lo conoce todavía.', cierre: '¿Te tinca?' },
  };
  const TONO_DEFAULT = { intro: 'Te armé esto pensando en lo que me has contado.', cierre: '¿Te lo dejo apartado?' };

  function tonoPara(arquetipos) {
    return TONO_ARQUETIPO[(arquetipos || [])[0]] || TONO_DEFAULT;
  }

  function emojiCategoria(categoria) {
    const mapa = {
      enologia: '🍷', aventura: '🏔️', relax: '🧖', cultural: '🏛️',
      foodie: '🍲', romantico: '🌅', familiar: '👨‍👩‍👧',
      fiesta: '🍹', explorador: '🧭',
    };
    return mapa[categoria] || '📍';
  }

  // Mismo patrón que ya usa panoramas.js en el sitio real (ARRIVAL_BY_CATEGORY):
  // una guía de cómo llegar/estacionamiento por categoría, no un dato preciso
  // por negocio (eso no existe todavía en el catálogo placeholder). Cuando la
  // BD real traiga estacionamiento por local, esto se reemplaza por el dato
  // real; mientras tanto da la misma utilidad honesta que ya tiene el sitio.
  const LLEGADA_POR_CATEGORIA = {
    aventura: 'En auto por camino hasta el sector; conviene ir con auto propio o coordinar transporte compartido.',
    relax: 'En auto propio; el recinto suele tener estacionamiento gratuito para huéspedes.',
    cultural: 'A pie desde el punto más cercano o en auto; zona con buena conectividad.',
    foodie: 'A pie o en auto dentro del barrio; hay estacionamientos públicos cercanos.',
    enologia: 'En auto propio (zona rural/viñas); el lugar cuenta con estacionamiento para visitantes.',
    romantico: 'En auto o Uber/taxi; conviene reservar con anticipación.',
    familiar: 'En auto propio; el lugar cuenta con estacionamiento y acceso apto para niños.',
    fiesta: 'Conviene llegar en Uber/taxi; el sector tiene alta demanda de estacionamiento los fines de semana.',
    explorador: 'En auto o transporte público hasta el punto de inicio; es zona rural, revisa el estado del camino.',
  };
  function fraseLlegada(categoria) {
    return LLEGADA_POR_CATEGORIA[categoria] || 'Te confirmamos la dirección exacta y accesos al reservar.';
  }

  function formatoPrecio(n) {
    return `$${n.toLocaleString('es-CL')}`;
  }

  function formatoDuracion(min) {
    if (min < 60) return `${min} min`;
    const horas = Math.floor(min / 60);
    const resto = min % 60;
    return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
  }

  const ENERGIA_HUMANA = { baja: 'tranquilo', media: 'moderado', alta: 'exigente' };

  // Nunca mostrarle al cliente el numero crudo de afinidad (0.76, etc): eso
  // es dato de debug interno. Acá se traduce cada bucket de la taxonomía a
  // una frase humana, sin jerga ni decimales.
  const FRASE_AFINIDAD = {
    enologia: 'te gusta el vino y la buena mesa',
    aventura: 'te gusta la aventura',
    relax: 'quieres desconectar y relajarte',
    cultural: 'te gusta la cultura y la historia',
    foodie: 'te gusta la buena comida',
    romantico: 'quieres algo especial en pareja',
    familiar: 'buscas algo para disfrutar en familia',
    fiesta: 'quieres buena onda y ambiente',
    explorador: 'quieres algo auténtico, poco turístico',
  };
  function fraseAfinidad(categoria) {
    return FRASE_AFINIDAD[categoria] || 'calza con lo que me has contado';
  }

  // Compone UNA frase humana a partir de las razones estructuradas de
  // rankearCombos (algoritmos.js) — separa el dato (que) de la voz (como se
  // dice), y evita que se filtren fragmentos tecnicos (afinidad en decimal,
  // minutos de traslado) a la respuesta que lee el cliente.
  function frasePorQue(razones) {
    const lista = razones || [];
    const afin = lista.find((r) => r.tipo === 'afinidad');
    const cierre = lista.find((r) => r.tipo === 'cierre_hero');
    const climaAdverso = lista.find((r) => r.tipo === 'clima_adverso');
    let frase = `Porque ${fraseAfinidad(afin && afin.categoria)}`;
    if (cierre) frase += `, y cierra con ${cierre.nombre} — tu momento cumbre`;
    frase += '.';
    if (climaAdverso) frase += ' Ojo que el pronóstico está incierto, por eso ya tiene plan B.';
    return frase;
  }

  // Mismo patrón que ya usa panoramas.js en el sitio real: un "simple" se
  // nombra por su propio título, un "paquete" (2+ panoramas) se nombra
  // encadenando los títulos con " + " (ej. "Trekking + cabaña con tinaja"),
  // para que Darwin entregue el panorama ya armado con nombre propio, no un
  // combo genérico sin identidad.
  function tituloCombo(acts) {
    return acts.map((a) => a.nombre).join(' + ');
  }

  // Bajo esta distancia el traslado se ofrece caminando en vez de en auto
  // (~15 min a paso normal). Es una estimacion en linea recta (haversine),
  // no una ruta real caminable — cuando calcularRuta/optimizarItinerarioReal
  // esten disponibles con internet real, esto se puede afinar con la
  // distancia real de caminata en vez de esta aproximacion.
  const KM_CAMINABLE = 1.2;

  function modoTraslado(km) {
    return (km !== undefined && km <= KM_CAMINABLE)
      ? { emoji: '🚶', modo: 'caminando' }
      : { emoji: '🚗', modo: 'en auto' };
  }

  function fraseTraslado(minutos, km) {
    const { emoji, modo } = modoTraslado(km);
    return modo === 'caminando'
      ? `${emoji} Entre panoramas se puede ir caminando: ~${minutos} min (~${km} km).`
      : `${emoji} Traslado entre panoramas: ~${minutos} min ${modo} (~${km ?? '?'} km).`;
  }

  function fraseTrasladoDesde(nombre, minutos, km) {
    const { emoji, modo } = modoTraslado(km);
    return `${emoji} Desde ${nombre}: ~${minutos} min ${modo} (~${km ?? '?'} km).`;
  }

  // Solo se muestra si hay un dato REAL de la tool `clima` (regla E5: no
  // prometer lo que las tools no confirman) — sin esto, no se inventa nada.
  function fraseClima(clima) {
    if (!clima) return null;
    const emoji = (clima.lluvia_prob || 0) >= 0.4 ? '🌧️' : '☀️';
    return `${emoji} Para esa fecha: ${clima.temp_min}°–${clima.temp_max}°C, ${Math.round((clima.lluvia_prob || 0) * 100)}% de probabilidad de lluvia.`;
  }

  function formatearCombo(comboRankeado, comboCompleto, arquetipos, clima) {
    const tono = tonoPara(arquetipos);
    const acts = comboCompleto.actividades || [];
    const emoji = emojiCategoria(acts[0] && acts[0].categoria);

    const bloques = acts.map((a, i) => {
      const hora = (comboCompleto.horarios_elegidos || [])[i] || a.horarios[0];
      const cumbre = a.hero_moment ? ' ☀️ tu momento cumbre' : '';
      return [
        `🕐 ${hora} · ${a.nombre} (${formatoDuracion(a.duracion_min)}, ritmo ${ENERGIA_HUMANA[a.energia] || a.energia})${cumbre}`,
        `📍 ${a.punto_encuentro}`,
        `🅿️ ${fraseLlegada(a.categoria)}`,
      ].join('\n');
    });

    const lineaTraslado = acts.length > 1 && comboCompleto.tiempo_traslado_total_min !== undefined
      ? fraseTraslado(comboCompleto.tiempo_traslado_total_min, comboCompleto.distancia_traslado_total_km)
      : null;

    const lineaOrigen = comboCompleto.distancia_desde_origen_km !== undefined
      ? `📌 Desde ${comboCompleto.origen_nombre || 'tu ubicación'}: ~${comboCompleto.tiempo_desde_origen_min} min (~${comboCompleto.distancia_desde_origen_km} km).`
      : null;

    const lineaClima = fraseClima(clima);

    const planB = comboCompleto.plan_b
      ? `Si ${comboCompleto.plan_b.gatillo === 'lluvia' ? 'llueve' : comboCompleto.plan_b.gatillo}, lo cambiamos por ${comboCompleto.plan_b.reemplazo} — ya tienes plan B.`
      : null;

    return [
      tono.intro,
      ``,
      `${emoji} ${tituloCombo(acts)}`,
      `${formatoPrecio(comboCompleto.precio_total)} por persona`,
      ``,
      ...(lineaOrigen ? [lineaOrigen, ``] : []),
      ...bloques.flatMap((b) => [b, ``]),
      ...(lineaTraslado ? [lineaTraslado, ``] : []),
      ...(lineaClima ? [lineaClima, ``] : []),
      ...(planB ? [planB, ``] : []),
      frasePorQue(comboRankeado.razones),
      tono.cierre,
    ].join('\n').replace(/\n{3,}/g, '\n\n');
  }

  // Plan de varios días (ej. cabaña + termas + trekking): cada día es una
  // actividad ancla (una de ellas puede ser `tipo: 'hospedaje'`), con
  // traslado real desde el día anterior (o desde el origen del cliente
  // para el día 1).
  function formatearPlanMultiDia(plan, arquetipos, clima) {
    const tono = tonoPara(arquetipos);
    const titulo = plan.dias.map((d) => d.actividad.nombre).join(' + ');

    const bloquesDias = plan.dias.map((dia) => {
      const act = dia.actividad;
      const encabezado = act.tipo === 'hospedaje'
        ? `🛏️ Día ${dia.numero}${dia.fecha ? ` (${dia.fecha})` : ''}: ${act.nombre}`
        : `${emojiCategoria(act.categoria)} Día ${dia.numero}${dia.fecha ? ` (${dia.fecha})` : ''}: ${act.nombre}`;
      const traslado = dia.distancia_desde_anterior_km !== null && dia.distancia_desde_anterior_km !== undefined
        ? fraseTrasladoDesde(dia.desde_nombre || 'el día anterior', dia.tiempo_desde_anterior_min, dia.distancia_desde_anterior_km)
        : null;
      const cumbre = act.hero_moment ? ' ☀️ el momento cumbre del plan' : '';
      const lineaHorario = act.tipo === 'hospedaje'
        ? `🕐 Check-in ${dia.hora}`
        : `🕐 ${dia.hora} · ${formatoDuracion(act.duracion_min)}, ritmo ${ENERGIA_HUMANA[act.energia] || act.energia}${cumbre}`;
      return [
        encabezado,
        traslado,
        lineaHorario,
        `📍 ${act.punto_encuentro}`,
        `🅿️ ${fraseLlegada(act.categoria)}`,
      ].filter(Boolean).join('\n');
    });

    const lineaClima = fraseClima(clima);

    return [
      tono.intro,
      ``,
      `🗺️ Plan de ${plan.dias.length} días: ${titulo}`,
      `${formatoPrecio(plan.precio_total)} total por persona`,
      ``,
      ...bloquesDias.flatMap((b) => [b, ``]),
      ...(lineaClima ? [lineaClima, ``] : []),
      `¿Te lo dejo apartado completo, con alojamiento y las ${plan.dias.length - 1} actividades incluidas?`,
    ].join('\n').replace(/\n{3,}/g, '\n\n');
  }

  // "Panoramas cerca de ahí" — mismo nombre y espíritu que la sección del
  // sitio real, pero las razones vienen del ranking multifactorial, no de
  // solo categoría+cercanía.
  function formatearRelacionados(relacionados, base) {
    const filas = relacionados.map(({ actividad, distancia_km, razones }) => {
      const razon = (razones && razones.find((r) => r.tipo === 'afinidad'))
        ? fraseAfinidad(razones.find((r) => r.tipo === 'afinidad').categoria)
        : 'complementa bien tu plan';
      return `• ${actividad.nombre} — a ${distancia_km} km de ahí, ${formatoPrecio(actividad.precio)} p/p (${razon})`;
    });
    return [
      `📎 Panoramas cerca de ${base.nombre}:`,
      ``,
      ...filas,
      ``,
      '¿Agrego alguno a tu plan?',
    ].join('\n');
  }

  function preguntaClarificadora(perfil) {
    if (!perfil.intereses || !perfil.intereses.length) return '¿Qué tipo de plan te tinca más: aventura, relax, algo de comida y vinos, cultura, o algo romántico?';
    if (!perfil.presupuesto || !perfil.presupuesto.banda) return '¿Como cuánto tienes pensado gastar por persona?';
    if (!perfil.fechas) return '¿Para qué fecha lo estás pensando?';
    return 'Cuéntame un poco más de lo que buscas y te armo algo a la medida.';
  }

  function respuestaEmocional(estado) {
    switch (estado) {
      case 'frustrado': return 'Perdona la mala experiencia — cuéntame exactamente qué pasó y lo resolvemos primero, antes de seguir viendo panoramas.';
      case 'abrumado': return 'Tranquilo, yo te simplifico esto: te dejo 1 sola opción bien redonda, no necesitas comparar mil cosas.';
      default: return null;
    }
  }

  // C5 del prompt: prueba social contextual (no generica) + el dato de
  // afinidad mas fuerte del propio cliente, para el estado "dudando" de A4.
  function reforzarDuda(perfil) {
    const intereses = (perfil.intereses || []).slice().sort((a, b) => (b.afinidad || 0) - (a.afinidad || 0));
    const top = intereses[0];
    if (!top || (top.afinidad || 0) <= 0) {
      return 'Entiendo la duda — es una decisión más, no te compliques: los viajeros que reservan con poca info igual terminan felices, la mayoría repite.';
    }
    return `Entiendo la duda. Por lo que me has contado, ${fraseAfinidad(top.categoria)} — los viajeros con ese mismo perfil que reservan esto, vuelven encantados.`;
  }

  function objecion(tipo) {
    if (tipo === 'precio') return 'Entiendo, el precio importa. Este vale lo que cuesta por lo que incluye — pero si prefieres, tengo una versión más económica con la misma esencia.';
    if (tipo === 'lo_pienso') return 'Sin apuro, te lo dejo guardado. Ojo que el cupo de ese horario es limitado, así que si te convence, mejor confirmar pronto.';
    return null;
  }

  function reenganche(comboGuardado) {
    return `¿Seguimos con el combo que te gustó (${formatoPrecio(comboGuardado.precio)})? Sigue apartable.`;
  }

  window.PickmapDarwin = window.PickmapDarwin || {};
  window.PickmapDarwin.plantillas = {
    formatearCombo, formatearPlanMultiDia, formatearRelacionados, preguntaClarificadora, respuestaEmocional, reforzarDuda, objecion, reenganche, tonoPara,
  };
})();
