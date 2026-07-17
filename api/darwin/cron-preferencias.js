// GET /api/darwin/cron-preferencias — job periódico (ver vercel.json,
// sección "crons") que cierra el loop de aprendizaje: cada interacción
// queda guardada por los otros endpoints, y este job la resume
// periódicamente en preferencias_inferidas para que Darwin la use en la
// próxima consulta.
//
// No usa el system prompt de Darwin — es un prompt separado y simple
// (ver api/darwin/_lib/claude.js -> inferirPreferencias).
//
// Nota de escala: esto recorre usuarios activos en un solo request de
// Vercel. Para pocos cientos de usuarios activos por día alcanza; si el
// volumen crece hace falta paginar/encolar en vez de un for secuencial
// (no se implementa acá para no adivinar una arquitectura de colas que
// nadie pidió todavía).
const supabase = require('./_lib/supabaseRest');
const { inferirPreferencias } = require('./_lib/claude');

const DIAS_ACTIVO = 30;

module.exports = async (req, res) => {
  // Vercel Cron llama siempre por GET. Se acepta también POST para poder
  // dispararlo a mano mientras se prueba.
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const desde = new Date(Date.now() - DIAS_ACTIVO * 24 * 60 * 60 * 1000).toISOString();
    const usuariosActivos = await supabase.select('usuarios_perfil', {
      select: 'id,nombre',
      ultima_apertura_app: `gte.${desde}`,
    });

    const resultados = [];
    for (const usuario of usuariosActivos) {
      try {
        const [interacciones, viajes] = await Promise.all([
          supabase.select('historial_interacciones', { select: '*', usuario_id: `eq.${usuario.id}`, order: 'fecha.desc', limit: '100' }),
          supabase.select('historial_viajes', { select: '*', usuario_id: `eq.${usuario.id}`, order: 'fecha.desc', limit: '50' }),
        ]);

        if (!interacciones.length && !viajes.length) continue;

        const resumenTexto = JSON.stringify({ interacciones, viajes });
        const preferencias = await inferirPreferencias(resumenTexto);

        await supabase.update('usuarios_perfil', { id: `eq.${usuario.id}` }, {
          preferencias_inferidas: preferencias,
          actualizado_en: new Date().toISOString(),
        });

        resultados.push({ usuario_id: usuario.id, ok: true });
      } catch (err) {
        resultados.push({ usuario_id: usuario.id, ok: false, error: String(err.message || err) });
      }
    }

    res.status(200).json({ procesados: resultados.length, resultados });
  } catch (err) {
    res.status(502).json({ error: 'cron-preferencias falló', message: String(err.message || err) });
  }
};
