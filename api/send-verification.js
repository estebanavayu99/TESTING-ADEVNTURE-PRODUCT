// Vercel serverless function (zero-config, no package.json needed).
// Saves the code on the contact's custom field and adds a tag using GHL's
// standard Contacts API (free, included in every plan) instead of the
// Inbound Webhook premium trigger ($0.01/execution). The GHL workflow that
// actually sends the email is triggered by "Contact Tag Added", a normal
// (non-premium) CRM trigger.
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiToken = process.env.GHL_API_TOKEN;
  const locationId = process.env.GHL_LOCATION_ID;
  const fieldKey = process.env.GHL_VERIFY_FIELD_KEY;
  const tag = process.env.GHL_VERIFY_TAG;
  if (!apiToken || !locationId || !fieldKey || !tag) {
    res.status(500).json({ error: 'Verification email service not configured' });
    return;
  }

  const { email, code, firstName } = req.body || {};
  if (!email || !code) {
    res.status(400).json({ error: 'Missing email or code' });
    return;
  }

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
        customFields: [{ key: fieldKey, field_value: code }],
        tags: [tag],
      }),
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
