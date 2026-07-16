// Vercel serverless function (zero-config, no package.json needed).
// Fires the GoHighLevel "Inbound Webhook" trigger (POST to
// GHL_VERIFY_WEBHOOK_URL) so the real workflow/email actually sends — that
// part is a GHL Premium Trigger, billed per execution past the first 100
// free ones, decision confirmed by the user (2026-07-16) after weighing the
// free Contact-Tag alternative.
//
// It also (best-effort, non-blocking) upserts the contact via GHL's
// standard Contacts API and writes the code/link into a custom field
// (GHL_VERIFY_FIELD_KEY). This is NOT for triggering anything — it's so the
// email can reliably use the merge tag {{contact.verification_code}}
// instead of depending on the Inbound Webhook's "Fetch sample requests" UI
// to map the raw payload, which turned out to be unreliable in practice.
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

  const apiToken = process.env.GHL_API_TOKEN;
  const locationId = process.env.GHL_LOCATION_ID;
  const fieldKey = process.env.GHL_VERIFY_FIELD_KEY;
  if (apiToken && locationId && fieldKey) {
    try {
      await fetch('https://services.leadconnectorhq.com/contacts/upsert', {
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
        }),
      });
    } catch (err) {
      // Best-effort: if this fails, the workflow still fires below — the
      // merge tag will just come out blank, same as before this change.
    }
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
