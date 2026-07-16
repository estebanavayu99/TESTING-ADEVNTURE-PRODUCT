// Vercel serverless function (zero-config, no package.json needed).
// Uses GHL's standard Contacts API (free, included in every plan) instead
// of the Inbound Webhook Premium Trigger — that trigger got permanently
// stuck behind "A Mapping Reference is required" with no sample ever
// captured despite confirmed 200 responses, so we gave up on it and
// reverted to this proven-working approach (2026-07-16).
//
// Flow: upsert the contact with the code/link in a custom field
// (GHL_VERIFY_FIELD_KEY) and add a tag (GHL_VERIFY_TAG). The GHL workflow's
// trigger is "Contact Tag" → Tag Added on that same tag, and its Email step
// uses the merge tag {{contact.verification_code}} (or whatever the field
// key is) to show the code/link.
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

  const { email, code, link, firstName } = req.body || {};
  if (!email || (!code && !link)) {
    res.status(400).json({ error: 'Missing email or code/link' });
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
        customFields: [{ key: fieldKey, field_value: link || code }],
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
