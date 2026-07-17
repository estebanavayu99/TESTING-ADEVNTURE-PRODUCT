// GET /api/darwin/feed — Endpoint 3 de la spec de Darwin.
// Se llama SOLO al abrir la app, sin que el usuario escriba ni busque
// nada. Arma el modo: "feed_automatico" — el corazón de "se mete y la IA
// ya le ofrece cosas".
const supabase = require('./_lib/supabaseRest');
const { climaAhora } = require('./_lib/clima');
const { llamarDarwin } = require('./_lib/claude');

const RADIO_KM_CAMBIO_UBICACION = 2;
const MS_UNA_HORA = 60 * 60 * 1000;

function distanciaHaversineKm(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * (Math.PI / 180);
  const dLng = (b.lng - a.lng) * (Math.PI / 180);
  const lat1 = a.lat * (Math.PI / 180);
  const lat2 = b.lat * (Math.PI / 180);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { usuario_id: usuarioId, lat: latQuery, lng: lngQuery, comuna: comunaQuery } = req.query || {};
  if (!usuarioId) {
    res.status(400).json({ error: 'Falta usuario_id' });
    return;
  }

  try {
    // 2. Perfil completo + historial reciente.
    const [perfilFilas, historialViajes] = await Promise.all([
      supabase.select('usuarios_perfil', { select: '*', id: `eq.${usuarioId}`, limit: '1' }),
      supabase.select('historial_viajes', { select: '*', usuario_id: `eq.${usuarioId}`, order: 'fecha.desc', limit: '10' }),
    ]);
    const perfil = perfilFilas[0];
    if (!perfil) {
      res.status(404).json({ error: 'usuario_id no tiene fila en usuarios_perfil' });
      return;
    }

    // 1. lat/lng actuales si el frontend tiene permiso de geolocalización;
    // si no vienen, usa los últimos guardados.
    const lat = latQuery != null ? Number(latQuery) : perfil.ultima_lat;
    const lng = lngQuery != null ? Number(lngQuery) : perfil.ultima_lng;

    // 3. Determinar el trigger.
    let trigger = 'apertura_app';
    const huboUbicacionPrevia = perfil.ultima_lat != null && perfil.ultima_lng != null;
    const cambioUbicacion = latQuery != null && huboUbicacionPrevia
      && distanciaHaversineKm({ lat, lng }, { lat: perfil.ultima_lat, lng: perfil.ultima_lng }) > RADIO_KM_CAMBIO_UBICACION;
    if (cambioUbicacion) {
      trigger = 'cambio_ubicacion';
    } else if (perfil.ultima_apertura_app && (Date.now() - new Date(perfil.ultima_apertura_app).getTime()) < MS_UNA_HORA) {
      trigger = 'refresco_manual';
    }

    // 4. clima_ahora (fuente: pronostico, vigencia corta).
    let climaAhoraResultado = null;
    if (lat != null && lng != null) {
      try {
        climaAhoraResultado = await climaAhora({ destino: comunaQuery || perfil.ultima_comuna || 'ubicacion_actual', lat, lng });
      } catch (err) {
        climaAhoraResultado = { error: String(err.message || err) };
      }
    }

    // 5. Candidatos por cercanía directa al punto actual (no por destino del historial).
    const candidatos = (lat != null && lng != null)
      ? await supabase.rpc('candidatos_cercanos_a_punto', { lat_punto: lat, lng_punto: lng, radio_km: 40 })
      : [];

    // 6. contexto_momento.
    const ahora = new Date();
    const contextoMomento = {
      hora_actual: ahora.toISOString(),
      dia_semana: new Intl.DateTimeFormat('es-CL', { timeZone: 'America/Santiago', weekday: 'long' }).format(ahora),
      ubicacion_actual: lat != null && lng != null ? { lat, lng, comuna: comunaQuery || perfil.ultima_comuna || null } : null,
      clima_ahora: climaAhoraResultado,
      ultima_apertura_app: perfil.ultima_apertura_app,
      trigger,
    };

    // 7. JSON de entrada + llamada a Claude API.
    const entradaDarwin = {
      modo: 'feed_automatico',
      usuario_id: usuarioId,
      perfil: {
        nombre: perfil.nombre,
        presupuesto: perfil.presupuesto,
        tipo_viaje: perfil.tipo_viaje,
        intereses: perfil.intereses,
        evita: perfil.evita,
        preferencias_inferidas: perfil.preferencias_inferidas,
      },
      historial_viajes: historialViajes,
      candidatos,
      contexto_momento: contextoMomento,
    };

    const respuestaDarwin = await llamarDarwin(entradaDarwin);

    // 8. INSERT del para_guardar + actualizar ubicación/apertura del perfil.
    // (await secuencial en vez de fire-and-forget: ver nota en recomendar.js
    // sobre por qué no conviene depender de que el runtime siga corriendo
    // después de responder en una función serverless de Vercel.)
    if (respuestaDarwin.para_guardar) {
      const filas = Array.isArray(respuestaDarwin.para_guardar) ? respuestaDarwin.para_guardar : [respuestaDarwin.para_guardar];
      await supabase.insert('historial_interacciones', filas.map((fila) => ({ usuario_id: usuarioId, ...fila })));
    }
    await supabase.update('usuarios_perfil', { id: `eq.${usuarioId}` }, {
      ultima_apertura_app: ahora.toISOString(),
      ultima_lat: lat != null ? lat : perfil.ultima_lat,
      ultima_lng: lng != null ? lng : perfil.ultima_lng,
      ultima_comuna: comunaQuery || perfil.ultima_comuna,
    });

    res.status(200).json(respuestaDarwin);
  } catch (err) {
    res.status(502).json({ error: 'darwin/feed falló', message: String(err.message || err) });
  }
};
