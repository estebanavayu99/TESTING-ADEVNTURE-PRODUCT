// Vercel serverless function (zero-config, no package.json needed).
// Sends the verification email directly via Resend — no GoHighLevel
// involved in this step at all, so we control the HTML completely (no
// editor stripping button styles) and don't create a GHL contact just from
// an unverified signup attempt. GHL contact creation happens separately,
// only after a real verification succeeds (see api/create-ghl-contact.js).
//
// Account creation sends `link` (magic-link confirmation button); forgot
// password sends `code` (6-digit, entered manually). Exactly one of the
// two is expected per call.
const BRAND = {
  navy: '#1E2D31',
  navy2: '#273C42',
  slate: '#5E696C',
  coral: '#F55E61',
  green: '#83D061',
  greenInk: '#3f7a2c',
};

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function shell({ badge, title, bodyHtml }) {
  return `<!DOCTYPE html><html lang="es"><body style="margin:0;padding:0;background:#FAF7F1;">
  <div style="max-width:600px;margin:0 auto;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:${BRAND.navy};padding:0 0 40px;">
    <div style="height:6px;background:${BRAND.navy2};"></div>
    <div style="padding:28px 32px 20px;">
      <div style="font-family:ui-rounded,'SF Pro Rounded','Century Gothic',Futura,system-ui,sans-serif;font-weight:700;font-size:1.4rem;">
        Pick<b style="color:${BRAND.greenInk};">Map</b>
      </div>
      <div style="display:inline-block;margin-top:14px;padding:5px 12px;border-radius:999px;font-size:0.72rem;font-weight:800;letter-spacing:.02em;background:${BRAND.navy2}22;color:${BRAND.navy2};">
        ${badge}
      </div>
    </div>
    <div style="background:#fff;margin:0 24px;border-radius:16px;padding:32px 32px 34px;box-shadow:0 10px 30px rgba(30,45,49,0.08);">
      <h1 style="font-size:1.3rem;margin:0 0 14px;line-height:1.35;">${title}</h1>
      ${bodyHtml}
    </div>
    <div style="padding:26px 32px 0;font-size:0.76rem;color:${BRAND.slate};line-height:1.6;">
      Pickmap SpA · Santiago, Chile<br>
      Recibiste este correo porque tienes una cuenta en pickmap.cl.
    </div>
  </div>
  </body></html>`;
}

function verifyLinkHtml(firstName, link) {
  const greeting = firstName ? `¡Hola ${escapeHtml(firstName)}! 👋` : '¡Hola! 👋';
  return shell({
    badge: 'VERIFICACIÓN DE CUENTA',
    title: greeting,
    bodyHtml: `
      <p style="font-size:0.95rem;line-height:1.65;color:${BRAND.navy2};margin:0 0 8px;">Gracias por crear tu cuenta en Pickmap.</p>
      <p style="font-size:0.95rem;line-height:1.65;color:${BRAND.navy2};margin:0 0 26px;">Solo falta un paso: confirma tu correo para activarla y empezar a armar tus primeros panoramas.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 26px;">
        <tr>
          <td style="background-color:${BRAND.green};border-radius:999px;">
            <a href="${link}" style="display:inline-block;padding:15px 36px;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;color:#000000;text-decoration:none;">Confirmar mi correo</a>
          </td>
        </tr>
      </table>
      <hr style="border:none;border-top:1px solid rgba(30,45,49,0.1);margin:0 0 20px;">
      <p style="font-size:0.82rem;line-height:1.6;color:${BRAND.slate};margin:0;">¿No fuiste tú quien creó esta cuenta? Puedes ignorar este correo con tranquilidad — no se activará nada sin confirmar el link.</p>
    `,
  });
}

function resetCodeHtml(firstName, code) {
  const greeting = firstName ? `¡Hola ${escapeHtml(firstName)}! 👋` : '¡Hola! 👋';
  return shell({
    badge: 'RECUPERAR CONTRASEÑA',
    title: greeting,
    bodyHtml: `
      <p style="font-size:0.95rem;line-height:1.65;color:${BRAND.navy2};margin:0 0 22px;">Recibimos una solicitud para recuperar tu contraseña de Pickmap. Usa este código:</p>
      <div style="text-align:center;margin:0 0 22px;">
        <span style="display:inline-block;font-family:ui-rounded,'SF Pro Rounded',system-ui,sans-serif;font-size:1.8rem;font-weight:800;letter-spacing:0.25em;color:${BRAND.coral};background:${BRAND.coral}14;padding:14px 24px;border-radius:14px;">${escapeHtml(code)}</span>
      </div>
      <p style="font-size:0.82rem;line-height:1.6;color:${BRAND.slate};margin:0;">Si no fuiste tú quien solicitó esto, puedes ignorar este correo — tu contraseña actual sigue funcionando.</p>
    `,
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Verification email service not configured' });
    return;
  }

  const { email, code, link, firstName } = req.body || {};
  if (!email || (!code && !link)) {
    res.status(400).json({ error: 'Missing email or code/link' });
    return;
  }

  const subject = link ? 'Confirma tu correo en Pickmap 🔑' : 'Tu código para recuperar tu contraseña — Pickmap';
  const html = link ? verifyLinkHtml(firstName, link) : resetCodeHtml(firstName, code);

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'Equipo PickMap <contacto@pickmap.cl>',
        to: [email],
        subject,
        html,
      }),
    });
    if (!r.ok) {
      res.status(502).json({ error: 'Upstream email service error' });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(502).json({ error: 'Failed to reach email service' });
  }
};
