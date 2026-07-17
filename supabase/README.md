# Supabase + backend de Darwin

Esta carpeta y `api/darwin/` implementan la base de datos y los endpoints
que un futuro agente de IA (Darwin, corriendo en Claude API) va a
necesitar. Es infraestructura preparada **antes** de conectar el bot real
— el usuario integrará el bot más adelante; esto deja Supabase y los
endpoints listos para ese momento.

## Cómo aplicar el schema

1. Crear un proyecto en [supabase.com](https://supabase.com) si no existe
   uno ya para Pickmap.
2. Copiar todo `supabase/schema.sql` y pegarlo en el **SQL Editor** del
   proyecto (o correrlo vía el MCP de Supabase si Claude Code está
   conectado a uno). Es re-ejecutable: usa `create table/index if not
   exists` y `create or replace function`, así que correrlo de nuevo no
   rompe nada existente (no incluye ningún `drop`).
3. Confirmar que la extensión `vector` (pgvector) quedó habilitada — en
   proyectos nuevos de Supabase ya viene disponible, solo hay que
   habilitarla, lo cual hace el mismo script.

## Variables de entorno nuevas (agregarlas en Vercel, nunca en el repo)

Mismo patrón ya establecido en este proyecto (`RESEND_API_KEY`,
`GHL_API_TOKEN`, etc.): el usuario las agrega directo en Vercel → Settings
→ Environment Variables. Nunca se comparten ni se escriben acá.

| Variable | Para qué |
|---|---|
| `SUPABASE_URL` | URL del proyecto (`https://xxxx.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Key de service role (bypassea RLS — los endpoints la necesitan para leer/escribir en nombre de cualquier usuario y para escribir `panoramas`/`clima_cache`) |
| `ANTHROPIC_API_KEY` | Para que `api/darwin/_lib/claude.js` llame a la Claude API real |
| `VOYAGE_API_KEY` | Para los embeddings semánticos de `buscar_candidatos()` (Voyage AI — Anthropic no tiene API de embeddings propia) |

Y para `scripts/sync-ghl-panoramas.js` (se exportan en el shell antes de
correrlo, no van en Vercel porque es un script manual, no una función):
`GHL_API_TOKEN`, `GHL_LOCATION_ID`, `GHL_PANORAMAS_OBJECT_KEY` (opcional).

## Qué está 100% listo vs. qué queda pendiente (honesto, sin inventar)

**Listo:**
- Las 7 tablas, extensiones, índices, RLS y las 4 funciones SQL
  (`buscar_candidatos`, `candidatos_cercanos`, `candidatos_cercanos_a_punto`,
  `distancias_entre_candidatos`) — nombres de columnas exactos según la
  spec del usuario.
- Los 4 endpoints (`POST /api/darwin/recomendar`, `POST
  /api/darwin/feedback`, `GET /api/darwin/feed`, `POST
  /api/darwin/editar-dia`) + `PATCH /api/paquetes/[id]/dias/[dia]` +
  el cron de `preferencias_inferidas` (`vercel.json` → corre diario a las
  06:00 UTC).
- Clima real (Open-Meteo, gratis, mismo proveedor ya elegido en
  `bot-darwin/js/contexto.js`) con `clima_cache` y las reglas de vigencia
  pedidas (6h pronóstico / 30 días histórico estacional).
- Todos los endpoints están escritos con `fetch` plano, sin
  `@supabase/supabase-js` ni SDK de Anthropic — mismo patrón zero-config
  del resto de `api/` (no hace falta `package.json` para que Vercel las
  reconozca).

**Pendiente a propósito (no fabricado):**
- **El system prompt real de Darwin** (`api/darwin/_lib/claude.js`,
  constante `DARWIN_SYSTEM_PROMPT`): el texto completo vive en
  `pickmap_system_prompt_v4.pdf`, que en este repo solo existe traducido
  a reglas determinísticas en `bot-darwin/js/motor.js`/`plantillas.js`
  (sin LLM real, decisión de esa etapa) — nunca como texto de prompt
  literal. Hay que pegar el texto real ahí antes de que las llamadas a
  Claude API produzcan respuestas reales de Darwin.
- **El objeto de GHL donde viven los ~20.000 panoramas**
  (`scripts/sync-ghl-panoramas.js`): se asumió que es un Custom Object de
  GHL (`GHL_PANORAMAS_OBJECT_KEY`, default `'panoramas'`) porque es la
  lectura más razonable de la spec, pero no se pudo confirmar contra la
  cuenta real de GHL del usuario. Si en su cuenta viven como
  Opportunities, Products u otro objeto, solo hay que ajustar las 3
  funciones de `ghlClient` en ese script — el resto (upsert en Supabase,
  reglas de qué lado manda) no depende de esto.
- **Brackets de `presupuesto_max`** en `api/darwin/recomendar.js`
  (`PRESUPUESTO_POR_CATEGORIA`): `usuarios_perfil.presupuesto` es una
  categoría de texto, no un monto, así que se mapeó a montos CLP
  placeholder — reemplazar por las cifras reales del negocio, o preferir
  siempre que el frontend mande `presupuesto_max` explícito en el body.
- El cron de preferencias procesa usuarios secuencialmente en un solo
  request; sirve para un volumen chico/mediano de usuarios activos por
  día — si crece mucho, hace falta paginar/encolar (no implementado para
  no adivinar una arquitectura que nadie pidió todavía).

## Cómo probarlo cuando haya datos reales

1. Cargar al menos un puñado de filas en `panoramas` (vía el script de
   migración o a mano) con `lat`/`lng`/`categoria`/`disponibilidad`
   reales — sin esto `buscar_candidatos()`/`candidatos_cercanos()` no
   devuelven nada.
2. Calcular embeddings reales para esas filas (llamando
   `api/darwin/_lib/embeddings.js` desde un script aparte, o a mano vía
   la API de Voyage) — mientras `embedding` sea `null`, el `order by
   embedding <=> query_embedding` de `buscar_candidatos()` no ordena por
   similitud real.
3. Pegar el texto real de `pickmap_system_prompt_v4.pdf` en
   `DARWIN_SYSTEM_PROMPT`.
4. Recién ahí probar los 4 endpoints contra datos reales — antes de eso,
   van a fallar o devolver resultados vacíos/sin sentido, lo cual es
   esperable dado el estado "listo pero sin datos" de esta etapa.
