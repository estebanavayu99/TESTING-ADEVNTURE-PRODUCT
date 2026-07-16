// Vercel serverless function (zero-config, no package.json needed).
// Forwards a verification code to the GoHighLevel "Inbound Webhook" trigger
// configured for the Pickmap verification workflow, so GHL sends the real
// email (subject/body/branding all live in that GHL workflow, not here).
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

  const { email, code, firstName } = req.body || {};
  if (!email || !code) {
    res.status(400).json({ error: 'Missing email or code' });
    return;
  }

  try {
    const ghlResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, firstName: firstName || '', code }),
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
