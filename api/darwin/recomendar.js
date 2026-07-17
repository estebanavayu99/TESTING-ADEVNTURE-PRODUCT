// POST /api/darwin/recomendar — Endpoint 1 de la spec de Darwin.
// modos soportados acá: recomendacion_simple | armado_paquete | analisis_sentimiento
// (feed_automatico vive en GET /api/darwin/feed, editar_dia en POST /api/darwin/editar-dia).
const supabase = require('./_lib/supabaseRest');
const { climaHistoricoEstacional } = require('./_lib/clima');
const { embeddingDeTexto } = require('./_lib/embeddings');
const { llamarDarwin } = require('./_lib/claude');

// Brackets placeholder mientras no exista un valor numérico real de
// presupuesto en el perfil (usuarios_perfil.presupuesto es una categoría
// de texto, no un monto) — reemplazar por las cifras reales del negocio
// cuando existan, o preferir siempre presupuesto_max si el frontend lo manda.
const PRESUPUESTO_POR_CATEGORIA = {
  economico: 150000,
  medio: 350000,
  alto: 800000,
  premium: 2000000,
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const {
    usuario_id: usuarioId,
    modo,
    num_personas: numPersonas = 1,
    mensaje = '',
    busqueda = '',
    fecha_viaje_estimada: fechaViajeEstimada,
    presupuesto_max: presupuestoMaxBody,
    intereses: interesesBody,
  } = req.body || {};

  if (!usuarioId || !modo) {
    res.status(400).json({ error: 'Falta usuario_id o modo' });
    return;
  }

  try {
    // 2. Perfil + historial de viajes reciente.
    const [perfilFilas, historialViajes] = await Promise.all([
      supabase.select('usuarios_perfil', { select: '*', id: `eq.${usuarioId}`, limit: '1' }),
      supabase.select('historial_viajes', { select: '*', usuario_id: `eq.${usuarioId}`, order: 'fecha.desc', limit: '10' }),
    ]);
    const perfil = perfilFilas[0];
    if (!perfil) {
      res.status(404).json({ error: 'usuario_id no tiene fila en usuarios_perfil' });
      return;
    }

    const intereses = interesesBody || perfil.intereses || [];
    const presupuestoMax = presupuestoMaxBody || PRESUPUESTO_POR_CATEGORIA[perfil.presupuesto] || PRESUPUESTO_POR_CATEGORIA.medio;

    // 3. Embedding de la búsqueda/intereses.
    const textoBusqueda = busqueda || mensaje || intereses.join(', ') || perfil.tipo_viaje || '';
    const queryEmbedding = await embeddingDeTexto(textoBusqueda, { inputType: 'query' });

    // 4. buscar_candidatos()
    const candidatos = await supabase.rpc('buscar_candidatos', {
      query_embedding: queryEmbedding,
      presupuesto_max: presupuestoMax,
      intereses_filtro: intereses,
      num_personas: numPersonas,
      limite: 20,
    });

    // 5. Clima por candidato (histórico estacional: son viajes futuros,
    // Open-Meteo solo pronostica ~16 días reales).
    const mesReferencia = fechaViajeEstimada ? new Date(fechaViajeEstimada).getMonth() + 1 : new Date().getMonth() + 1;
    const climaPorCandidato = {};
    for (const candidato of candidatos) {
      if (!candidato.destino || candidato.lat == null || candidato.lng == null) continue;
      try {
        climaPorCandidato[candidato.id] = await climaHistoricoEstacional({
          destino: candidato.destino,
          lat: candidato.lat,
          lng: candidato.lng,
          mesReferencia,
        });
      } catch (err) {
        climaPorCandidato[candidato.id] = { error: String(err.message || err) };
      }
    }

    // 6. armado_paquete: candidatos cercanos a la base + distancias_cluster.
    let candidatosCercanos = null;
    let distanciasCluster = null;
    if (modo === 'armado_paquete' && candidatos.length) {
      const base = candidatos[0];
      candidatosCercanos = await supabase.rpc('candidatos_cercanos', { panorama_id_base: base.id, radio_km: 40 });
      const idsCluster = [base.id, ...candidatosCercanos.map((c) => c.id)];
      distanciasCluster = await supabase.rpc('distancias_entre_candidatos', { ids: idsCluster });
    }

    // 7. JSON de entrada exacto para Darwin + llamada a Claude API.
    const entradaDarwin = {
      modo,
      num_personas: numPersonas,
      usuario_id: usuarioId,
      mensaje: mensaje || null,
      perfil: {
        nombre: perfil.nombre,
        presupuesto: perfil.presupuesto,
        tipo_viaje: perfil.tipo_viaje,
        intereses: perfil.intereses,
        evita: perfil.evita,
        preferencias_inferidas: perfil.preferencias_inferidas,
      },
      historial_viajes: historialViajes,
      candidatos: candidatos.map((c) => ({ ...c, clima: climaPorCandidato[c.id] || null })),
      candidatos_cercanos: candidatosCercanos,
      distancias_cluster: distanciasCluster,
    };

    const respuestaDarwin = await llamarDarwin(entradaDarwin);

    // 9. INSERT del bloque para_guardar tal cual, sin transformar.
    // Nota: la spec pide hacer esto "en paralelo, sin bloquear la
    // respuesta al usuario" — acá se espera (await) de todos modos porque
    // en una función serverless de Vercel no hay garantía de que un
    // fire-and-forget siga corriendo después de responder (el runtime
    // puede congelar/matar el contenedor apenas se envía la respuesta).
    // Await secuencial es la forma confiable de que el INSERT realmente
    // pase, al costo de unos ms más de latencia para el usuario.
    const tablaDestino = modo === 'analisis_sentimiento' ? 'sentimiento_usuario' : 'historial_interacciones';
    if (respuestaDarwin.para_guardar) {
      const filas = Array.isArray(respuestaDarwin.para_guardar) ? respuestaDarwin.para_guardar : [respuestaDarwin.para_guardar];
      await supabase.insert(tablaDestino, filas.map((fila) => ({ usuario_id: usuarioId, ...fila })));
    }

    // 10. armado_paquete con estructura_dias -> crear paquetes + paquete_dias.
    if (modo === 'armado_paquete' && respuestaDarwin.estructura_dias) {
      const alojamientoId = respuestaDarwin.alojamiento_sugerido ? respuestaDarwin.alojamiento_sugerido.id : null;
      const [paquete] = await supabase.insert('paquetes', [{
        usuario_id: usuarioId,
        alojamiento_id: alojamientoId,
        num_personas: numPersonas,
        estado: 'tentativo',
        precio_total_estimado: respuestaDarwin.precio_total_estimado || null,
      }]);
      const diasFilas = respuestaDarwin.estructura_dias.map((dia) => ({
        paquete_id: paquete.id,
        dia: dia.dia,
        actividades_ids: dia.actividades_ids || [],
        estado: 'tentativo',
      }));
      await supabase.insert('paquete_dias', diasFilas);
      respuestaDarwin.paquete_id = paquete.id;
    }

    // 8. Responder al frontend.
    res.status(200).json(respuestaDarwin);
  } catch (err) {
    res.status(502).json({ error: 'darwin/recomendar falló', message: String(err.message || err) });
  }
};
