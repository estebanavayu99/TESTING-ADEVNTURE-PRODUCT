// POST /api/darwin/editar-dia — Endpoint 4 de la spec de Darwin.
// El usuario ya tiene un paquete armado y quiere cambiar solo un día.
const supabase = require('./_lib/supabaseRest');
const { climaHistoricoEstacional } = require('./_lib/clima');
const { llamarDarwin } = require('./_lib/claude');

const RADIO_RAZONABLE_KM = 40; // ~45 min estimados, mismo criterio de la sección 6 del prompt de Darwin

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { paquete_id: paqueteId, dia_a_editar: diaAEditar, usuario_id: usuarioId } = req.body || {};
  if (!paqueteId || diaAEditar == null || !usuarioId) {
    res.status(400).json({ error: 'Falta paquete_id, dia_a_editar o usuario_id' });
    return;
  }

  try {
    // 2. Paquete + sus días.
    const [paqueteFilas, dias] = await Promise.all([
      supabase.select('paquetes', { select: '*', id: `eq.${paqueteId}`, limit: '1' }),
      supabase.select('paquete_dias', { select: '*', paquete_id: `eq.${paqueteId}` }),
    ]);
    const paquete = paqueteFilas[0];
    if (!paquete || paquete.usuario_id !== usuarioId) {
      res.status(404).json({ error: 'Paquete no encontrado para este usuario' });
      return;
    }

    const diaObjetivo = dias.find((d) => d.dia === diaAEditar);

    // 3. Día ya confirmado -> rechazar (el frontend también debe bloquear esto, pero no confiar solo en eso).
    if (diaObjetivo && diaObjetivo.estado === 'confirmado') {
      res.status(409).json({ error: 'Este día ya está confirmado y no se puede editar' });
      return;
    }

    // 4. Punto de anclaje: alojamiento del paquete, o si no hay (paquete de
    // 1 día), la primera actividad ya asignada como "base" del itinerario.
    let anclaje = null;
    if (paquete.alojamiento_id) {
      const [alojamiento] = await supabase.select('panoramas', { select: 'id,lat,lng', id: `eq.${paquete.alojamiento_id}`, limit: '1' });
      anclaje = alojamiento;
    } else {
      const primeraActividadId = dias.flatMap((d) => d.actividades_ids || [])[0];
      if (primeraActividadId) {
        const [actividad] = await supabase.select('panoramas', { select: 'id,lat,lng', id: `eq.${primeraActividadId}`, limit: '1' });
        anclaje = actividad;
      }
    }
    if (!anclaje) {
      res.status(422).json({ error: 'No hay alojamiento ni actividad previa desde la cual anclar candidatos para este paquete' });
      return;
    }

    // Candidatos cercanos al anclaje.
    const candidatosCercanos = await supabase.rpc('candidatos_cercanos_a_punto', {
      lat_punto: anclaje.lat,
      lng_punto: anclaje.lng,
      radio_km: RADIO_RAZONABLE_KM,
    });

    // candidatos_cercanos_a_punto() no devuelve disponibilidad/destino/lat/lng
    // (y además ya filtra disponibilidad=true en su propio WHERE — ver
    // supabase/schema.sql), así que para poder marcar bloqueado="no
    // disponible" y resolver clima hace falta ir a buscar esas columnas
    // aparte. El chequeo de disponibilidad queda igual como defensa por si
    // el filtro de la función se relaja más adelante.
    const idsCandidatos = candidatosCercanos.map((c) => c.id);
    const detalles = idsCandidatos.length
      ? await supabase.select('panoramas', { select: 'id,destino,lat,lng,disponibilidad', id: `in.(${idsCandidatos.join(',')})` })
      : [];
    const detallePorId = Object.fromEntries(detalles.map((d) => [d.id, d]));

    // ids ya usados en OTRO día ya confirmado de este mismo paquete.
    const idsUsadosEnDiasConfirmados = new Set(
      dias.filter((d) => d.estado === 'confirmado' && d.dia !== diaAEditar)
        .flatMap((d) => d.actividades_ids || []),
    );

    const mesReferencia = new Date().getMonth() + 1;

    // 5. bloqueado / razon_bloqueo por candidato.
    const candidatosDia = [];
    for (const candidato of candidatosCercanos) {
      const detalle = detallePorId[candidato.id] || {};
      let bloqueado = false;
      let razonBloqueo = null;

      if (detalle.disponibilidad === false) {
        bloqueado = true; razonBloqueo = 'no disponible';
      } else if (candidato.capacidad_maxima != null && candidato.capacidad_maxima < paquete.num_personas) {
        bloqueado = true; razonBloqueo = 'sin capacidad para el grupo';
      } else if (candidato.distancia_km > RADIO_RAZONABLE_KM) {
        bloqueado = true; razonBloqueo = 'muy lejos del alojamiento';
      } else if (idsUsadosEnDiasConfirmados.has(candidato.id)) {
        bloqueado = true; razonBloqueo = 'ya está en tu itinerario otro día';
      }

      // 6. clima_estimado solo para los no bloqueados.
      let climaEstimado = null;
      if (!bloqueado && detalle.destino && detalle.lat != null && detalle.lng != null) {
        try {
          climaEstimado = await climaHistoricoEstacional({ destino: detalle.destino, lat: detalle.lat, lng: detalle.lng, mesReferencia });
        } catch (err) {
          climaEstimado = { error: String(err.message || err) };
        }
      }

      candidatosDia.push({ ...candidato, bloqueado, razon_bloqueo: razonBloqueo, clima_estimado: climaEstimado });
    }

    // 7. JSON de entrada para Darwin.
    const diasFijados = dias.filter((d) => d.dia !== diaAEditar);
    const entradaDarwin = {
      modo: 'editar_dia',
      usuario_id: usuarioId,
      paquete_actual: {
        id: paquete.id,
        alojamiento_id: paquete.alojamiento_id,
        num_personas: paquete.num_personas,
        dias_fijados: diasFijados,
      },
      dia_a_editar: diaAEditar,
      candidatos_dia: candidatosDia,
    };

    const respuestaDarwin = await llamarDarwin(entradaDarwin);

    // 9. INSERT del para_guardar. NO se toca paquete_dias todavía — esta
    // respuesta es solo de opciones; el UPDATE real pasa por
    // PATCH /api/paquetes/[id]/dias/[dia] cuando el usuario confirma.
    if (respuestaDarwin.para_guardar) {
      const filas = Array.isArray(respuestaDarwin.para_guardar) ? respuestaDarwin.para_guardar : [respuestaDarwin.para_guardar];
      await supabase.insert('historial_interacciones', filas.map((fila) => ({ usuario_id: usuarioId, ...fila })));
    }

    res.status(200).json(respuestaDarwin);
  } catch (err) {
    res.status(502).json({ error: 'darwin/editar-dia falló', message: String(err.message || err) });
  }
};
