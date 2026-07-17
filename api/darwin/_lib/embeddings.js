// Embeddings semánticos para buscar_candidatos() (columna panoramas.embedding
// vector(1536)). Claude/Anthropic no expone una API de embeddings propia —
// Voyage AI es el proveedor que Anthropic recomienda para esto. Se usa
// voyage-3-large con output_dimension: 1536 para calzar EXACTO con
// vector(1536) del schema (soporta dimensión configurable vía Matryoshka).
//
// Requiere VOYAGE_API_KEY en Vercel (el usuario la agrega directo ahí,
// mismo patrón que RESEND_API_KEY/GHL_API_TOKEN).
const VOYAGE_URL = 'https://api.voyageai.com/v1/embeddings';

async function embeddingDeTexto(texto, { inputType = 'query' } = {}) {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error('VOYAGE_API_KEY no está configurado en Vercel');

  const res = await fetch(VOYAGE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: texto,
      model: 'voyage-3-large',
      input_type: inputType, // 'query' al buscar, 'document' al indexar panoramas
      output_dimension: 1536,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Voyage AI respondió ${res.status}: ${body}`);
  }
  const data = await res.json();
  return data.data[0].embedding;
}

module.exports = { embeddingDeTexto };
