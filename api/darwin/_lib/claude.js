// Llamada a Claude API (Anthropic Messages API) con el system prompt de
// Darwin. Fetch directo, sin @anthropic-ai/sdk, mismo patrón zero-config
// del resto de api/ (send-verification.js, create-ghl-contact.js).
//
// PENDIENTE (a propósito, no fabricado): el texto real del system prompt
// de Darwin vive en `pickmap_system_prompt_v4.pdf` (compartido por el
// usuario para /bot-darwin/, donde sus reglas de negocio/venta consultiva
// ya están traducidas a código determinístico en bot-darwin/js/motor.js +
// plantillas.js — pero NUNCA como texto de prompt literal en este repo).
// Este archivo llama a la Claude API real y arma el envelope correcto,
// pero DARWIN_SYSTEM_PROMPT de abajo es un placeholder: hay que pegar acá
// el texto completo del v4 (secciones 1-7: modos, arquetipos, reglas de
// cluster/distancia, y el contrato exacto de para_guardar) antes de que
// esto produzca respuestas reales de Darwin. Todo lo demás (schema,
// funciones SQL, endpoints, caché de clima, sync GHL) no depende de esto
// y ya está listo.
const DARWIN_SYSTEM_PROMPT = `
[PENDIENTE] Pegar acá el texto completo de pickmap_system_prompt_v4.pdf.
Debe definir, como mínimo, el contrato de salida que los 4 endpoints
esperan de cada modo:
  - recomendacion_simple / armado_paquete -> { candidatos_elegidos, texto, para_guardar, estructura_dias?, alojamiento_sugerido? }
  - analisis_sentimiento                 -> { tono, urgencia, intereses_implicitos, senal_atencion, para_guardar }
  - feed_automatico                      -> { feed, para_guardar }
  - editar_dia                           -> { opciones_dia, para_guardar }
`.trim();

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const MODEL = 'claude-sonnet-5';

async function llamarDarwin(entradaJson, { maxTokens = 4096 } = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY no está configurado en Vercel');

  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system: DARWIN_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: JSON.stringify(entradaJson) },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Claude API respondió ${res.status}: ${body}`);
  }
  const data = await res.json();
  const texto = (data.content || []).map((bloque) => bloque.text || '').join('');
  try {
    return JSON.parse(texto);
  } catch (err) {
    throw new Error(`Darwin no devolvió JSON válido: ${texto.slice(0, 500)}`);
  }
}

// Prompt simple y separado (no Darwin) para el cron de preferencias_inferidas.
async function inferirPreferencias(historialTexto) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY no está configurado en Vercel');

  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: 'Analiza el historial de interacciones y viajes de un usuario de una app de turismo y devuelve SOLO un JSON con patrones inferidos (ej. destinos preferidos, rango de presupuesto típico, qué evita). No inventes datos que no estén respaldados por el historial.',
      messages: [{ role: 'user', content: historialTexto }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Claude API (preferencias) respondió ${res.status}: ${body}`);
  }
  const data = await res.json();
  const texto = (data.content || []).map((bloque) => bloque.text || '').join('');
  try {
    return JSON.parse(texto);
  } catch (err) {
    return {};
  }
}

module.exports = { llamarDarwin, inferirPreferencias, DARWIN_SYSTEM_PROMPT };
