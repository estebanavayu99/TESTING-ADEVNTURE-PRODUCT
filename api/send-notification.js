// Vercel serverless function (zero-config, sin package.json — mismo patrón
// que api/send-verification.js). Envía cualquiera de las 13 plantillas de
// notificación (api/_lib/email-templates.js) vía Resend, dado un `tipo` y
// los `datos` propios de esa plantilla.
//
// No reemplaza el envío ya existente de verificación de cuenta / código de
// recuperación (api/send-verification.js sigue igual) — es para el resto
// de notificaciones: hoy se usa desde el flujo de reserva de
// js/panoramas.js (tipo: 'reserva-confirmada'), y queda disponible para
// simular cualquiera de las otras 12 cuando se enganchen a un flujo real.
const { PLANTILLAS } = require('./_lib/email-templates');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'RESEND_API_KEY not set in Vercel' });
    return;
  }

  const { tipo, email, datos } = req.body || {};
  const construir = tipo && PLANTILLAS[tipo];
  if (!email || !construir) {
    res.status(400).json({ error: `Falta email, o tipo inválido. Tipos válidos: ${Object.keys(PLANTILLAS).join(', ')}` });
    return;
  }

  const { subject, html } = construir(datos || {});

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'PickMap <contacto@pickmap.cl>',
        to: [email],
        subject,
        html,
      }),
    });
    const resendBody = await resendRes.text();
    if (!resendRes.ok) {
      res.status(502).json({ error: 'Resend rejected the send', status: resendRes.status, body: resendBody });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(502).json({ error: 'Failed to reach Resend', message: String(err) });
  }
};
