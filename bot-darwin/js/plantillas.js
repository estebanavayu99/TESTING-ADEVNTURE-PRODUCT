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

  function formatoPrecio(n) {
    return `$${n.toLocaleString('es-CL')}`;
  }

  function formatearCombo(comboRankeado, comboCompleto, arquetipos) {
    const tono = tonoPara(arquetipos);
    const acts = comboCompleto.actividades || [];
    const emoji = emojiCategoria(acts[0] && acts[0].categoria);
    const lineas = acts.map((a, i) => {
      const hora = (comboCompleto.horarios_elegidos || [])[i] || a.horarios[0];
      const cumbre = a.hero_moment ? ' — el momento cumbre ☀️' : '';
      return `• ${hora} — ${a.nombre} (${a.duracion_min} min, energía ${a.energia})${cumbre}`;
    });
    const razones = comboRankeado.razones && comboRankeado.razones.length
      ? comboRankeado.razones.join(', ')
      : 'calza con lo que me has contado';
    const planB = comboCompleto.plan_b
      ? `Si ${comboCompleto.plan_b.gatillo === 'lluvia' ? 'llueve' : comboCompleto.plan_b.gatillo}, lo cambiamos por ${comboCompleto.plan_b.reemplazo}.`
      : 'Traslados calzan sin apuro.';

    return [
      `${tono.intro}`,
      ``,
      `${emoji} Combo — ${formatoPrecio(comboCompleto.precio_total)} p/p`,
      ...lineas,
      ``,
      planB,
      `Te lo armé así porque ${razones}.`,
      tono.cierre,
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
    formatearCombo, preguntaClarificadora, respuestaEmocional, objecion, reenganche, tonoPara,
  };
})();
