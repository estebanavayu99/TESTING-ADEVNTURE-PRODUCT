// PATCH /api/paquetes/:id/dias/:dia — confirma la opción de día que el
// usuario eligió después de POST /api/darwin/editar-dia. No vuelve a
// llamar a Darwin, solo actualiza la fila (mismo patrón que el Endpoint 2
// de feedback: la decisión ya se tomó, esto solo la persiste).
const supabase = require('../../../darwin/_lib/supabaseRest');

module.exports = async (req, res) => {
  if (req.method !== 'PATCH') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { id: paqueteId, dia } = req.query || {};
  const { actividades_ids: actividadesIds, usuario_id: usuarioId, confirmar = true } = req.body || {};

  if (!paqueteId || dia == null || !usuarioId || !Array.isArray(actividadesIds)) {
    res.status(400).json({ error: 'Falta id/dia en la ruta, o usuario_id/actividades_ids en el body' });
    return;
  }

  try {
    const [paquete] = await supabase.select('paquetes', { select: 'id,usuario_id', id: `eq.${paqueteId}`, limit: '1' });
    if (!paquete || paquete.usuario_id !== usuarioId) {
      res.status(404).json({ error: 'Paquete no encontrado para este usuario' });
      return;
    }

    const actualizado = await supabase.update('paquete_dias', { paquete_id: `eq.${paqueteId}`, dia: `eq.${dia}` }, {
      actividades_ids: actividadesIds,
      estado: confirmar ? 'confirmado' : 'tentativo',
    });

    if (!actualizado.length) {
      res.status(404).json({ error: 'Ese día no existe en el paquete' });
      return;
    }

    res.status(200).json({ ok: true, dia: actualizado[0] });
  } catch (err) {
    res.status(502).json({ error: 'PATCH paquetes/dias falló', message: String(err.message || err) });
  }
};
