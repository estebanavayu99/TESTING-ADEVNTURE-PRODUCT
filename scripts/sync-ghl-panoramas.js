#!/usr/bin/env node
// Script de migración/sync entre GHL y Supabase para la tabla `panoramas`.
// Node 18+ (usa fetch global) — sin dependencias, correrlo con:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... GHL_API_TOKEN=... \
//   GHL_LOCATION_ID=... GHL_PANORAMAS_OBJECT_KEY=... node scripts/sync-ghl-panoramas.js
//
// OJO — supuesto sin confirmar con el usuario: este script asume que los
// ~20.000 panoramas viven en GHL como un Custom Object (API v2 de
// LeadConnector, endpoint /objects/{objectKey}/records). No hay forma de
// confirmar esto desde acá sin acceso a la cuenta real de GHL del
// usuario — si en su cuenta los panoramas viven como Opportunities,
// Products u otro objeto, hay que ajustar SOLO las funciones de
// `ghlClient` de abajo (listarPanoramasDeGHL / actualizarCustomFieldEnGHL /
// leerCustomFieldsDeGHL); el resto del script (upsert en Supabase, reglas
// de "quién es la fuente de verdad") no depende de esto.
//
// Modos:
//   node scripts/sync-ghl-panoramas.js migrar   -> migración inicial GHL -> Supabase (embedding en null)
//   node scripts/sync-ghl-panoramas.js sync      -> sync normal periódico (bidireccional, ver reglas abajo)

const SUPABASE_URL = requireEnv('SUPABASE_URL');
const SUPABASE_KEY = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
const GHL_API_TOKEN = requireEnv('GHL_API_TOKEN');
const GHL_LOCATION_ID = requireEnv('GHL_LOCATION_ID');
const GHL_PANORAMAS_OBJECT_KEY = process.env.GHL_PANORAMAS_OBJECT_KEY || 'panoramas';

const CAMPOS_NUEVOS = ['precio_unidad', 'duracion_horas', 'capacidad_maxima', 'es_alojamiento'];

function requireEnv(nombre) {
  const valor = process.env[nombre];
  if (!valor) {
    console.error(`Falta la variable de entorno ${nombre}`);
    process.exit(1);
  }
  return valor;
}

// ---------------------------------------------------------------
// Cliente GHL — ver nota de arriba sobre el supuesto de Custom Object.
// ---------------------------------------------------------------
const ghlClient = {
  async listarPanoramasDeGHL() {
    const registros = [];
    let cursor = null;
    do {
      const params = new URLSearchParams({ locationId: GHL_LOCATION_ID, limit: '100' });
      if (cursor) params.set('startAfter', cursor);
      const res = await fetch(`https://services.leadconnectorhq.com/objects/${GHL_PANORAMAS_OBJECT_KEY}/records?${params.toString()}`, {
        headers: { Authorization: `Bearer ${GHL_API_TOKEN}`, Version: '2021-07-28' },
      });
      if (!res.ok) throw new Error(`GHL listar panoramas respondió ${res.status}: ${await res.text()}`);
      const data = await res.json();
      registros.push(...(data.records || []));
      cursor = data.meta && data.meta.startAfter ? data.meta.startAfter : null;
    } while (cursor);
    return registros;
  },

  async leerCustomFieldsDeGHL(ghlId) {
    const res = await fetch(`https://services.leadconnectorhq.com/objects/${GHL_PANORAMAS_OBJECT_KEY}/records/${ghlId}`, {
      headers: { Authorization: `Bearer ${GHL_API_TOKEN}`, Version: '2021-07-28' },
    });
    if (!res.ok) throw new Error(`GHL leer registro ${ghlId} respondió ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return (data.record && data.record.properties) || {};
  },

  async actualizarCustomFieldEnGHL(ghlId, propiedades) {
    const res = await fetch(`https://services.leadconnectorhq.com/objects/${GHL_PANORAMAS_OBJECT_KEY}/records/${ghlId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GHL_API_TOKEN}`,
        Version: '2021-07-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ properties: propiedades }),
    });
    if (!res.ok) throw new Error(`GHL actualizar registro ${ghlId} respondió ${res.status}: ${await res.text()}`);
  },
};

// ---------------------------------------------------------------
// Cliente Supabase (REST/PostgREST) — mismo patrón que api/darwin/_lib/supabaseRest.js,
// duplicado acá porque este script corre fuera de Vercel (Node plano, sin
// require de rutas relativas a /api).
// ---------------------------------------------------------------
const supabaseHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

async function supabaseUpsertPanoramas(filas) {
  const res = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/panoramas?on_conflict=ghl_id`, {
    method: 'POST',
    headers: { ...supabaseHeaders, Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(filas),
  });
  if (!res.ok) throw new Error(`Supabase upsert panoramas respondió ${res.status}: ${await res.text()}`);
  return res.json();
}

async function supabaseSelectPanoramas(query) {
  const params = new URLSearchParams(query);
  const res = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/panoramas?${params.toString()}`, { headers: supabaseHeaders });
  if (!res.ok) throw new Error(`Supabase select panoramas respondió ${res.status}: ${await res.text()}`);
  return res.json();
}

function mapearRegistroGhlAPanorama(registro) {
  const p = registro.properties || {};
  return {
    ghl_id: registro.id,
    nombre: p.nombre || p.name || '',
    descripcion: p.descripcion || null,
    destino: p.destino || null,
    lat: p.lat != null ? Number(p.lat) : null,
    lng: p.lng != null ? Number(p.lng) : null,
    precio: p.precio != null ? Number(p.precio) : null,
    duracion_dias: p.duracion_dias != null ? Number(p.duracion_dias) : null,
    categoria: p.categoria ? String(p.categoria).split(',').map((c) => c.trim()).filter(Boolean) : null,
    disponibilidad: p.disponibilidad != null ? Boolean(p.disponibilidad) : true,
    temporada: p.temporada || null,
    imagen_urls: p.imagen_urls ? String(p.imagen_urls).split(',').map((u) => u.trim()).filter(Boolean) : null,
    // Los 4 campos nuevos (precio_unidad, duracion_horas, capacidad_maxima,
    // es_alojamiento) se resuelven aparte en sincronizarCamposNuevos(),
    // porque su regla de "quién manda" es distinta a la de los campos
    // migrados 1:1 de arriba.
  };
}

// ---------------------------------------------------------------
// Migración inicial: GHL -> Supabase, embedding queda en null (se calcula
// en un paso aparte, no acá).
// ---------------------------------------------------------------
async function migrarInicial() {
  const registros = await ghlClient.listarPanoramasDeGHL();
  console.log(`GHL devolvió ${registros.length} registros de panoramas`);

  const LOTE = 200;
  for (let i = 0; i < registros.length; i += LOTE) {
    const lote = registros.slice(i, i + LOTE).map((r) => ({ ...mapearRegistroGhlAPanorama(r), embedding: null }));
    await supabaseUpsertPanoramas(lote);
    console.log(`Migrados ${Math.min(i + LOTE, registros.length)}/${registros.length}`);
  }
}

// ---------------------------------------------------------------
// Sync de los 4 campos nuevos, en ambas direcciones:
//  - Supabase -> GHL: si el panorama se creó/editó en Supabase, hace PATCH
//    del custom field en GHL vía ghl_id.
//  - GHL -> Supabase: en el sync periódico normal, si el custom field ya
//    existe en GHL con un valor, se respeta como fuente de verdad (no se
//    pisa una edición hecha directo en GHL por operaciones). Si el
//    registro de GHL no tiene aún estos custom fields creados (migrado
//    antes de este cambio), se deja null en Supabase y NO se sobrescribe
//    con un valor por defecto.
// ---------------------------------------------------------------
async function sincronizarCamposNuevos() {
  const panoramas = await supabaseSelectPanoramas({ select: 'id,ghl_id,precio_unidad,duracion_horas,capacidad_maxima,es_alojamiento' });

  for (const panorama of panoramas) {
    if (!panorama.ghl_id) continue;

    let propiedadesGhl;
    try {
      propiedadesGhl = await ghlClient.leerCustomFieldsDeGHL(panorama.ghl_id);
    } catch (err) {
      console.error(`No se pudo leer ${panorama.ghl_id} desde GHL: ${err.message}`);
      continue;
    }

    const tieneAlgunCampoEnGhl = CAMPOS_NUEVOS.some((campo) => propiedadesGhl[campo] !== undefined && propiedadesGhl[campo] !== null);

    if (tieneAlgunCampoEnGhl) {
      // GHL manda: reflejar sus valores en Supabase.
      const patchSupabase = {};
      for (const campo of CAMPOS_NUEVOS) {
        if (propiedadesGhl[campo] !== undefined && propiedadesGhl[campo] !== null) {
          patchSupabase[campo] = campo === 'es_alojamiento' ? Boolean(propiedadesGhl[campo]) : Number(propiedadesGhl[campo]);
        }
      }
      if (Object.keys(patchSupabase).length) {
        await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/panoramas?id=eq.${panorama.id}`, {
          method: 'PATCH',
          headers: { ...supabaseHeaders, Prefer: 'return=minimal' },
          body: JSON.stringify(patchSupabase),
        });
      }
    } else if (CAMPOS_NUEVOS.some((campo) => panorama[campo] !== null && panorama[campo] !== undefined)) {
      // Supabase tiene valores que GHL todavía no conoce: reflejarlos allá.
      const propiedadesParaGhl = {};
      for (const campo of CAMPOS_NUEVOS) {
        if (panorama[campo] !== null && panorama[campo] !== undefined) propiedadesParaGhl[campo] = panorama[campo];
      }
      try {
        await ghlClient.actualizarCustomFieldEnGHL(panorama.ghl_id, propiedadesParaGhl);
      } catch (err) {
        console.error(`No se pudo actualizar ${panorama.ghl_id} en GHL: ${err.message}`);
      }
    }
    // Si ninguno de los dos lados tiene valor todavía, se deja en null a
    // propósito — hace falta cargarlo a mano o vía un proceso de
    // enriquecimiento aparte, no se inventa un default.
  }
}

async function main() {
  const modo = process.argv[2];
  if (modo === 'migrar') {
    await migrarInicial();
  } else if (modo === 'sync') {
    await sincronizarCamposNuevos();
  } else {
    console.error('Uso: node scripts/sync-ghl-panoramas.js migrar|sync');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
