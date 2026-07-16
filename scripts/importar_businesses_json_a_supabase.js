#!/usr/bin/env node
/* Pickmap — sube supabase/data/businesses.json (negocios reales ya
 * procesados) a la tabla `businesses` de Supabase vía su REST API
 * (PostgREST), en lotes chicos — evita el límite de tamaño de consulta
 * del SQL Editor (confirmado: un solo INSERT de 4.000 filas ya lo excede).
 *
 * Requiere Node.js 18+ (usa fetch nativo, sin dependencias que instalar).
 *
 * Uso (en la carpeta donde tengas businesses.json y este script):
 *
 *   SUPABASE_URL=https://igevnfsbteilvxkypgeo.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=tu_secret_key_de_supabase \
 *   node importar_businesses_json_a_supabase.js
 *
 * La SUPABASE_SERVICE_ROLE_KEY se saca de Supabase → Project Settings →
 * API → "service_role" / "secret" key. NUNCA se comitea a git ni se
 * comparte — solo vive en tu terminal al correr este comando.
 */
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LOTE = 500;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Faltan variables de entorno: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son obligatorias.');
  process.exit(1);
}

const jsonPath = path.join(__dirname, 'businesses.json');
if (!fs.existsSync(jsonPath)) {
  console.error(`No encontré ${jsonPath} — asegúrate de que businesses.json esté en la misma carpeta que este script.`);
  process.exit(1);
}

async function subirLote(lote, intento = 1) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/businesses?on_conflict=id`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(lote),
  });
  if (!res.ok) {
    const texto = await res.text();
    if (intento < 3) {
      console.warn(`  lote falló (intento ${intento}), reintentando en 2s...`);
      await new Promise((r) => setTimeout(r, 2000));
      return subirLote(lote, intento + 1);
    }
    throw new Error(`Supabase respondió ${res.status}: ${texto}`);
  }
}

async function main() {
  const negocios = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`Negocios a subir: ${negocios.length}`);

  for (let i = 0; i < negocios.length; i += LOTE) {
    const lote = negocios.slice(i, i + LOTE);
    await subirLote(lote);
    console.log(`  subido ${Math.min(i + LOTE, negocios.length)}/${negocios.length}`);
  }

  console.log('Listo. Recarga el dashboard con una cuenta real para ver a Darwin recomendando sobre estos negocios.');
}

main().catch((err) => {
  console.error('Import falló:', err.message);
  process.exit(1);
});
