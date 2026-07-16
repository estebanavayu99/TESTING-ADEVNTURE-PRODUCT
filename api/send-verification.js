// Vercel serverless function (zero-config, no package.json needed).
// Forwards a verification code/link to the GoHighLevel "Inbound Webhook"
// trigger configured for the Pickmap verification workflow, so GHL sends
// the real email (subject/body/branding all live in that GHL workflow, not
// here). Account creation sends `link` (magic-link confirmation, clicking
// it logs the person in directly); forgot-password still sends `code`
// (entered manually in the reset form). At least one of the two must be
// present.
// NOTE: Inbound Webhook is a GHL Premium Trigger — billed per execution
// past the first 100 free ones. Decision confirmed by the user (2026-07-16)
// after weighing the free Contact-Tag alternative.
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const webhookUrl = process.env.GHL_VERIFY_WEBHOOK_URL;
  if (!webhookUrl) {
    res.status(500).json({ error: 'Verification email service not configured' });
    return;
  }

  const { email, code, link, firstName } = req.body || {};
  if (!email || (!code && !link)) {
    res.status(400).json({ error: 'Missing email or code/link' });
    return;
  }

  try {
    const ghlResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, firstName: firstName || '', code: code || '', link: link || '' }),
    });
    if (!ghlResponse.ok) {
      res.status(502).json({ error: 'Upstream email service error' });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(502).json({ error: 'Failed to reach email service' });
  }
};
