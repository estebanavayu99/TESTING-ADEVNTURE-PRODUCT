// Vercel serverless function (zero-config, no package.json needed).
// Sends the account-verification email (a button/link) via Resend.
// Also handles the forgot-password email (a 6-digit code) since both
// share the same endpoint from js/auth.js.
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

  const { email, code, link, firstName } = req.body || {};
  if (!email || (!code && !link)) {
    res.status(400).json({ error: 'Missing email or code/link' });
    return;
  }

  const greeting = firstName ? `¡Hola ${firstName}! 👋` : '¡Hola! 👋';

  const html = link
    ? `
      <div style="max-width:480px;margin:0 auto;font-family:Arial,sans-serif;color:#1E2D31;padding:32px;">
        <h1 style="font-size:1.3rem;">${greeting}</h1>
        <p>Gracias por crear tu cuenta en Pickmap. Confirma tu correo para activarla:</p>
        <p style="text-align:center;margin:28px 0;">
          <a href="${link}" style="background:#83D061;color:#000000;font-weight:bold;text-decoration:none;padding:14px 32px;border-radius:999px;display:inline-block;">Confirmar mi correo</a>
        </p>
        <p style="font-size:0.85rem;color:#5E696C;">Si no fuiste tú quien creó esta cuenta, ignora este correo.</p>
      </div>
    `
    : `
      <div style="max-width:480px;margin:0 auto;font-family:Arial,sans-serif;color:#1E2D31;padding:32px;">
        <h1 style="font-size:1.3rem;">${greeting}</h1>
        <p>Recibimos una solicitud para recuperar tu contraseña de Pickmap. Tu código es:</p>
        <p style="text-align:center;font-size:1.8rem;font-weight:bold;letter-spacing:0.25em;color:#F55E61;margin:28px 0;">${code}</p>
        <p style="font-size:0.85rem;color:#5E696C;">Si no fuiste tú, ignora este correo.</p>
      </div>
    `;

  const subject = link ? 'Confirma tu correo en Pickmap' : 'Tu código para recuperar tu contraseña';

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'Pickmap <contacto@pickmap.cl>',
        to: [email],
        subject,
        html,
      }),
    });
    const resendBody = await resendRes.text();
    if (!resendRes.ok) {
      // Surface Resend's real error in the Vercel logs/response instead of a
      // generic 502 — this is what we were missing all along.
      res.status(502).json({ error: 'Resend rejected the send', status: resendRes.status, body: resendBody });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(502).json({ error: 'Failed to reach Resend', message: String(err) });
  }
};
