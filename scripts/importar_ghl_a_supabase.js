#!/usr/bin/env node
/* Pickmap — importar negocios reales desde GoHighLevel (CRM) a Supabase
 *
 * QUÉ HACE: lee los negocios reales que el dueño del producto ya subió
 * a su cuenta de GoHighLevel y hace upsert en la tabla `businesses` de
 * Supabase (supabase/schema.sql), con el mismo criterio de estimación
 * de precio/duración/horario por categoría que
 * bot-darwin/scripts/generar_catalogo_real_sample.py usó para el
 * catálogo de muestra ya comiteado — la diferencia es que este script
 * lee de la fuente real (GHL), no de un CSV suelto.
 *
 * NO SE PUEDE CORRER DESDE EL SANDBOX DE DESARROLLO: este entorno no
 * tiene salida a internet real (confirmado — ni GoHighLevel ni Supabase
 * son alcanzables desde acá). Este script lo corre el dueño del
 * producto en su propia máquina (con internet real), o se adapta a un
 * job/función serverless con acceso a internet más adelante.
 *
 * CÓMO CORRERLO:
 *   GHL_API_KEY=pit-xxxx \
 *   SUPABASE_URL=https://tu-proyecto.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=xxxx \
 *   node scripts/importar_ghl_a_supabase.js
 *
 * NUNCA se comitean estos valores — solo como variables de entorno al
 * momento de ejecutar (ver .gitignore: .env* está excluido).
 *
 * SUPUESTO A CONFIRMAR (TODO del dueño del producto antes de correrlo
 * en serio): no sabemos todavía si los "negocios" en tu cuenta GHL están
 * guardados como Custom Objects (lo más natural para un directorio de
 * negocios) o como Contacts con un tag (ej. "negocio-turistico"). Este
 * script intenta Custom Objects primero; si tu cuenta no tiene ese
 * schema, cambia GHL_ORIGEN abajo a 'contacts' y ajusta GHL_TAG_FILTRO.
 */

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID; // requerido por la mayoría de endpoints v2 de GHL
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const GHL_ORIGEN = process.env.GHL_ORIGEN || 'custom_objects'; // 'custom_objects' | 'contacts'
const GHL_CUSTOM_OBJECT_KEY = process.env.GHL_CUSTOM_OBJECT_KEY || 'custom_objects.negocios';
const GHL_TAG_FILTRO = process.env.GHL_TAG_FILTRO || 'negocio-turistico';

if (!GHL_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Faltan variables de entorno: GHL_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY son obligatorias.');
  process.exit(1);
}

const GHL_BASE = 'https://services.leadconnectorhq.com';
const GHL_VERSION = '2021-07-28';

// ============================================================
// Heurística de estimación por categoría — mismo criterio que
// bot-darwin/scripts/generar_catalogo_real_sample.py (mantener ambas en
// sync a mano si se ajusta una; son independientes porque una corre en
// Python sobre el CSV original y esta en Node sobre la API de GHL).
// ============================================================
const TAXONOMIA = {
  'restaurant': 'foodie', 'restaurante': 'foodie', 'cafe': 'foodie', 'bar': 'fiesta',
  'winery': 'foodie', 'vineyard': 'foodie', 'brewery': 'fiesta',
  'hiking': 'aventura', 'trekking': 'aventura', 'adventure': 'aventura', 'outdoor': 'aventura',
  'spa': 'relax', 'wellness': 'relax', 'hot spring': 'relax', 'termas': 'relax',
  'museum': 'cultural', 'gallery': 'cultural', 'historic': 'cultural', 'tour': 'cultural',
  'nightclub': 'fiesta', 'club': 'fiesta', 'lounge': 'fiesta',
  'hotel': 'hospedaje', 'lodge': 'hospedaje', 'cabin': 'hospedaje', 'hostel': 'hospedaje',
};

const BUCKET_DEFAULTS = {
  foodie: { precio: [15000, 35000], duracion_min: 90, energia: 'baja', exterior: false, indoor_alt: true, tags: ['gastronomia'] },
  fiesta: { precio: [10000, 25000], duracion_min: 180, energia: 'alta', exterior: false, indoor_alt: true, tags: ['vidanocturna'] },
  aventura: { precio: [20000, 45000], duracion_min: 180, energia: 'alta', exterior: true, indoor_alt: false, tags: ['naturaleza', 'aventura'] },
  relax: { precio: [25000, 50000], duracion_min: 120, energia: 'baja', exterior: false, indoor_alt: true, tags: ['relax'] },
  cultural: { precio: [8000, 20000], duracion_min: 90, energia: 'baja', exterior: false, indoor_alt: true, tags: ['cultura'] },
  hospedaje: { precio: [40000, 90000], duracion_min: null, energia: 'baja', exterior: false, indoor_alt: true, tags: ['hospedaje'] },
  explorador: { precio: [15000, 30000], duracion_min: 150, energia: 'media', exterior: true, indoor_alt: false, tags: [] },
};

function bucketDeCategoria(categoriaGhl) {
  const key = (categoriaGhl || '').toLowerCase();
  for (const [needle, bucket] of Object.entries(TAXONOMIA)) {
    if (key.includes(needle)) return bucket;
  }
  return 'explorador';
}

function estimarPrecio([min, max]) {
  return Math.round((min + (max - min) * Math.random()) / 1000) * 1000;
}

function negocioDesdeGhl(registro) {
  // registro: forma normalizada, ver mapearRegistroGhl() más abajo según
  // GHL_ORIGEN. Acá solo se aplica la heurística de estimación.
  const bucket = bucketDeCategoria(registro.categoria);
  const defaults = BUCKET_DEFAULTS[bucket] || BUCKET_DEFAULTS.explorador;
  return {
    id: `ghl_${registro.ghl_id}`,
    ghl_id: registro.ghl_id,
    nombre: registro.nombre,
    categoria: bucket,
    tags: defaults.tags,
    precio: estimarPrecio(defaults.precio),
    duracion_min: defaults.duracion_min,
    lat: registro.lat ?? null,
    lng: registro.lng ?? null,
    comuna: registro.comuna || null,
    energia: defaults.energia,
    exterior: defaults.exterior,
    indoor_alt: defaults.indoor_alt,
    accesible: bucket !== 'aventura',
    experiencia_estimada: 3,
    hero_moment: false,
    horarios: ['10:00', '15:00', '18:00'],
    punto_encuentro: registro.direccion || null,
    incluye: [],
    no_incluye: [],
    restricciones: [],
    cupos: {},
    tipo: bucket === 'hospedaje' ? 'hospedaje' : null,
    es_gema_oculta: null,
    evita_trampa: null,
    datos_estimados: true,
  };
}

// ============================================================
// GHL — lectura de negocios reales
// ============================================================
async function ghlFetch(path, params) {
  const url = new URL(GHL_BASE + path);
  if (GHL_LOCATION_ID) url.searchParams.set('locationId', GHL_LOCATION_ID);
  for (const [k, v] of Object.entries(params || {})) url.searchParams.set(k, v);
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GHL_API_KEY}`,
      Version: GHL_VERSION,
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error(`GHL ${path} respondió ${res.status}: ${await res.text()}`);
  return res.json();
}

async function leerNegociosDesdeCustomObjects() {
  // TODO confirmar el nombre exacto de los campos custom del objeto en
  // tu cuenta GHL (Settings → Objects) — este mapeo asume nombres
  // razonables (name/category/address/city/latitude/longitude) y hay
  // que ajustarlo si tu schema usa otros keys.
  const data = await ghlFetch(`/objects/${GHL_CUSTOM_OBJECT_KEY}/records`, { limit: 100 });
  return (data.records || []).map((r) => ({
    ghl_id: r.id,
    nombre: r.properties?.name || r.name,
    categoria: r.properties?.category || '',
    direccion: r.properties?.address || '',
    comuna: r.properties?.city || '',
    lat: r.properties?.latitude ? Number(r.properties.latitude) : null,
    lng: r.properties?.longitude ? Number(r.properties.longitude) : null,
  }));
}

async function leerNegociosDesdeContacts() {
  const data = await ghlFetch('/contacts/', { limit: 100 });
  return (data.contacts || [])
    .filter((c) => (c.tags || []).includes(GHL_TAG_FILTRO))
    .map((c) => ({
      ghl_id: c.id,
      nombre: c.companyName || c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim(),
      categoria: (c.customFields || []).find((f) => f.key === 'category')?.value || '',
      direccion: c.address1 || '',
      comuna: c.city || '',
      lat: null,
      lng: null,
    }));
}

// ============================================================
// Supabase — upsert vía REST (PostgREST), sin dependencias npm
// ============================================================
async function upsertBusinesses(negocios) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/businesses?on_conflict=id`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(negocios),
  });
  if (!res.ok) throw new Error(`Supabase upsert respondió ${res.status}: ${await res.text()}`);
}

async function main() {
  console.log(`Leyendo negocios reales desde GHL (origen: ${GHL_ORIGEN})…`);
  const registros = GHL_ORIGEN === 'contacts'
    ? await leerNegociosDesdeContacts()
    : await leerNegociosDesdeCustomObjects();
  console.log(`  → ${registros.length} negocios encontrados en GHL.`);

  const negocios = registros.map(negocioDesdeGhl);

  const LOTE = 50;
  for (let i = 0; i < negocios.length; i += LOTE) {
    const lote = negocios.slice(i, i + LOTE);
    await upsertBusinesses(lote);
    console.log(`  → upsert de ${lote.length} negocios (${i + lote.length}/${negocios.length})`);
  }

  console.log('Listo. Recarga dashboard.html con una cuenta real para ver a Darwin recomendando sobre estos negocios.');
}

main().catch((err) => {
  console.error('Import falló:', err.message);
  process.exit(1);
});
