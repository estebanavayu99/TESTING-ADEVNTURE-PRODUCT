// POST /api/darwin/feedback — Endpoint 2 de la spec de Darwin.
// Se llama cuando el usuario interactúa con una recomendación ya
// mostrada (ve, guarda, reserva, descarta).
const supabase = require('./_lib/supabaseRest');

const ACCIONES_VALIDAS = ['visto', 'guardado', 'reservado', 'descartado'];

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const {
    usuario_id: usuarioId,
    panorama_id: panoramaId,
    accion,
    rating,
    fecha_viaje: fechaViaje,
    destino,
    notas,
  } = req.body || {};

  if (!usuarioId || !panoramaId || !ACCIONES_VALIDAS.includes(accion)) {
    res.status(400).json({ error: 'Falta usuario_id/panorama_id, o accion inválida' });
    return;
  }

  try {
    // 2. Actualiza la interacción más reciente para este par usuario/panorama,
    // o inserta una nueva si no existía ninguna todavía.
    const existentes = await supabase.select('historial_interacciones', {
      select: 'id',
      usuario_id: `eq.${usuarioId}`,
      panorama_id: `eq.${panoramaId}`,
      order: 'fecha.desc',
      limit: '1',
    });

    if (existentes.length) {
      await supabase.update('historial_interacciones', { id: `eq.${existentes[0].id}` }, {
        accion,
        fecha: new Date().toISOString(),
      });
    } else {
      await supabase.insert('historial_interacciones', [{ usuario_id: usuarioId, panorama_id: panoramaId, accion }]);
    }

    // 3. accion=reservado con rating post-viaje -> historial_viajes.
    if (accion === 'reservado' && rating != null) {
      await supabase.insert('historial_viajes', [{
        usuario_id: usuarioId,
        panorama_id: panoramaId,
        destino: destino || null,
        fecha: fechaViaje || null,
        rating,
        notas: notas || null,
      }]);
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(502).json({ error: 'darwin/feedback falló', message: String(err.message || err) });
  }
};
