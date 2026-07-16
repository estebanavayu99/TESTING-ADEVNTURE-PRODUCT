// Vercel serverless function (zero-config, no package.json needed).
// Upserts the contact into GoHighLevel via its standard Contacts API (free,
// included in every plan). Called from js/auth.js ONLY after a real
// verification succeeds (magic link clicked) — not on signup attempt — so
// GHL only ends up with confirmed, real users, not every abandoned or test
// signup.
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiToken = process.env.GHL_API_TOKEN;
  const locationId = process.env.GHL_LOCATION_ID;
  if (!apiToken || !locationId) {
    res.status(500).json({ error: 'GHL contact service not configured' });
    return;
  }

  const { email, name, phone } = req.body || {};
  if (!email) {
    res.status(400).json({ error: 'Missing email' });
    return;
  }

  const [firstName, ...rest] = (name || '').trim().split(' ');
  const lastName = rest.join(' ');

  try {
    const ghlResponse = await fetch('https://services.leadconnectorhq.com/contacts/upsert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiToken}`,
        Version: '2021-07-28',
      },
      body: JSON.stringify({
        locationId,
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        phone: phone || '',
        tags: ['viajero-verificado'],
      }),
    });
    if (!ghlResponse.ok) {
      res.status(502).json({ error: 'Upstream GHL error' });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(502).json({ error: 'Failed to reach GHL' });
  }
};
