// Cliente mínimo de Supabase para las funciones serverless de Darwin.
// Sin @supabase/supabase-js a propósito: el repo es zero-config (sin
// package.json, sin build step — mismo patrón que api/send-verification.js
// y api/create-ghl-contact.js), así que hablamos directo con la API REST
// (PostgREST) de Supabase vía fetch, igual que con Resend/GHL.
//
// Usa siempre SUPABASE_SERVICE_ROLE_KEY (nunca la anon key) porque estas
// funciones corren en el backend y necesitan bypassear RLS para escribir
// panoramas/clima_cache y leer/escribir en nombre de cualquier usuario.

function baseUrl() {
  const url = process.env.SUPABASE_URL;
  if (!url) throw new Error('SUPABASE_URL no está configurado en Vercel');
  return url.replace(/\/$/, '');
}

function headers(extra) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurado en Vercel');
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function parseOrThrow(res, label) {
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(`${label} falló (${res.status}): ${text}`);
  }
  return body;
}

// SELECT vía PostgREST. `query` son params tal cual PostgREST espera, ej:
// { select: 'id,nombre', destino: 'eq.Pucon', order: 'creado_en.desc', limit: 20 }
async function select(tabla, query = {}) {
  const params = new URLSearchParams(query);
  const res = await fetch(`${baseUrl()}/rest/v1/${tabla}?${params.toString()}`, {
    headers: headers(),
  });
  return parseOrThrow(res, `select ${tabla}`);
}

async function insert(tabla, rows, { returning = true } = {}) {
  const res = await fetch(`${baseUrl()}/rest/v1/${tabla}`, {
    method: 'POST',
    headers: headers({ Prefer: returning ? 'return=representation' : 'return=minimal' }),
    body: JSON.stringify(rows),
  });
  return parseOrThrow(res, `insert ${tabla}`);
}

// upsert por conflicto de columnas (ej. clima_cache con unique(destino, mes_referencia, fuente))
async function upsert(tabla, rows, { onConflict } = {}) {
  const params = new URLSearchParams();
  if (onConflict) params.set('on_conflict', onConflict);
  const res = await fetch(`${baseUrl()}/rest/v1/${tabla}?${params.toString()}`, {
    method: 'POST',
    headers: headers({ Prefer: 'resolution=merge-duplicates,return=representation' }),
    body: JSON.stringify(rows),
  });
  return parseOrThrow(res, `upsert ${tabla}`);
}

// `match` son filtros PostgREST (ej. { id: 'eq.<uuid>' })
async function update(tabla, match, patch) {
  const params = new URLSearchParams(match);
  const res = await fetch(`${baseUrl()}/rest/v1/${tabla}?${params.toString()}`, {
    method: 'PATCH',
    headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify(patch),
  });
  return parseOrThrow(res, `update ${tabla}`);
}

// Llama a una función SQL expuesta como RPC (buscar_candidatos,
// candidatos_cercanos, candidatos_cercanos_a_punto, distancias_entre_candidatos).
async function rpc(nombreFuncion, args = {}) {
  const res = await fetch(`${baseUrl()}/rest/v1/rpc/${nombreFuncion}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(args),
  });
  return parseOrThrow(res, `rpc ${nombreFuncion}`);
}

module.exports = { select, insert, upsert, update, rpc };
