-- Pickmap / Darwin — schema de Supabase.
-- Fuente: prompt del usuario para configurar la base + endpoints que va a
-- necesitar el futuro agente de IA (Darwin, corriendo en Claude API).
-- Los nombres de columnas deben quedar EXACTOS: el backend arma el JSON de
-- entrada para Darwin con estos mismos nombres, y escribe de vuelta el
-- bloque para_guardar que Darwin devuelve tal cual, sin transformarlo.
--
-- Cómo aplicar: pegar este archivo completo en el SQL Editor de Supabase
-- (o correrlo vía el MCP de Supabase si está conectado) sobre un proyecto
-- nuevo o existente. Es idempotente en lo posible (create table/index/
-- function if not exists o or replace) pero no incluye DROP de nada.

-- ============================================================
-- Extensiones necesarias
-- ============================================================
create extension if not exists vector;
create extension if not exists pgcrypto; -- gen_random_uuid()

-- ============================================================
-- Tabla 1: panoramas
-- Origen: migrados desde GHL (~20.000 registros). Ver
-- scripts/sync-ghl-panoramas.js para la migración/sync.
-- ============================================================
create table if not exists panoramas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  destino text,
  lat float8,
  lng float8,
  precio numeric,
  precio_unidad text default 'total', -- 'por_persona' | 'total'
  duracion_dias int,
  duracion_horas numeric, -- horas exactas de la actividad (ej. 2.5, 8)
  capacidad_maxima int, -- null = sin restricción de cupo
  es_alojamiento boolean default false,
  categoria text[],
  disponibilidad boolean default true,
  temporada text, -- 'alta' | 'media' | 'baja'
  imagen_urls text[],
  embedding vector(1536),
  ghl_id text,
  creado_en timestamptz default now(),
  actualizado_en timestamptz default now()
);

create index if not exists panoramas_embedding_idx on panoramas using ivfflat (embedding vector_cosine_ops);
create index if not exists panoramas_destino_idx on panoramas (destino);
create index if not exists panoramas_disponibilidad_idx on panoramas (disponibilidad);
create index if not exists panoramas_es_alojamiento_idx on panoramas (es_alojamiento);

-- Notas sobre los campos nuevos (precio_unidad, duracion_horas,
-- capacidad_maxima, es_alojamiento): se cargan primero acá y TAMBIÉN deben
-- reflejarse en GHL como custom fields — no son exclusivos de Supabase.
-- Ver scripts/sync-ghl-panoramas.js.

-- ============================================================
-- Tabla 2: usuarios_perfil
-- ============================================================
create table if not exists usuarios_perfil (
  id uuid primary key references auth.users(id),
  nombre text,
  presupuesto text,
  tipo_viaje text,
  intereses text[],
  evita text[],
  preferencias_inferidas jsonb default '{}',
  ultima_apertura_app timestamptz,
  ultima_lat float8,
  ultima_lng float8,
  ultima_comuna text,
  actualizado_en timestamptz default now()
);

-- ultima_apertura_app / ultima_lat / ultima_lng / ultima_comuna son los que
-- permiten armar contexto_momento para el modo feed_automatico (Endpoint 3).

-- ============================================================
-- Tabla 3: historial_viajes
-- ============================================================
create table if not exists historial_viajes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references usuarios_perfil(id),
  panorama_id uuid references panoramas(id),
  destino text,
  fecha date,
  rating int check (rating between 1 and 5),
  notas text,
  creado_en timestamptz default now()
);

-- ============================================================
-- Tabla 4: historial_interacciones
-- Acá escribe el backend usando el bloque para_guardar que devuelve
-- Darwin en cada respuesta — sin transformar los datos, solo insertando.
-- ============================================================
create table if not exists historial_interacciones (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references usuarios_perfil(id),
  panorama_id uuid references panoramas(id),
  accion text, -- 'recomendado' | 'recomendado_base' | 'recomendado_complemento'
               -- | 'recomendado_alojamiento' | 'recomendado_edicion_dia'
               -- | 'mostrado_feed_automatico' | 'visto' | 'guardado'
               -- | 'reservado' | 'descartado'
  match_score numeric,
  desglose_score jsonb,
  fecha timestamptz default now()
);

-- ============================================================
-- Tabla 5: paquetes y paquete_dias
-- Necesarias para el modo editar_dia: sin un identificador de paquete no
-- hay forma de saber qué días/alojamiento pertenecen al mismo viaje.
-- ============================================================
create table if not exists paquetes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references usuarios_perfil(id),
  alojamiento_id uuid references panoramas(id), -- null si no aplica (paquete de 1 día)
  num_personas int not null,
  estado text default 'tentativo', -- 'tentativo' | 'confirmado'
  precio_total_estimado numeric,
  creado_en timestamptz default now(),
  actualizado_en timestamptz default now()
);

create table if not exists paquete_dias (
  id uuid primary key default gen_random_uuid(),
  paquete_id uuid references paquetes(id) on delete cascade,
  dia int not null,
  actividades_ids uuid[],
  estado text default 'tentativo', -- 'tentativo' | 'confirmado'
  unique (paquete_id, dia)
);

create index if not exists paquete_dias_paquete_id_idx on paquete_dias (paquete_id);

-- El campo estado (en paquetes y por día en paquete_dias) existe porque un
-- día "sugerido" y un día "ya reservado/pagado" no deben tratarse igual: en
-- editar_dia, si un día está confirmado, el backend rechaza la edición
-- (bloquéalo también en el frontend, pero no confíes solo en eso); si está
-- tentativo, es editable libremente.

-- ============================================================
-- Tabla 6: sentimiento_usuario
-- ============================================================
create table if not exists sentimiento_usuario (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references usuarios_perfil(id),
  texto_original text,
  tono text,
  urgencia text,
  intereses_implicitos text[],
  senal_atencion boolean default false,
  fecha timestamptz default now()
);

-- ============================================================
-- Tabla 7: clima_cache
-- Cachea resultados de la API de clima externa para no golpearla en cada
-- consulta. El backend consulta esta tabla primero; si no hay dato
-- vigente, llama a la API externa y guarda el resultado acá antes de
-- armar el JSON para Darwin.
--
-- Regla de vigencia (implementada en api/darwin/_lib/clima.js, no acá):
--   fuente = 'pronostico'          -> válido por 6 horas
--   fuente = 'historico_estacional' -> válido por 30 días
-- ============================================================
create table if not exists clima_cache (
  id uuid primary key default gen_random_uuid(),
  destino text not null,
  lat float8,
  lng float8,
  mes_referencia int, -- 1-12, para históricos estacionales
  temp_promedio numeric,
  condicion text,
  probabilidad_lluvia numeric,
  fuente text, -- 'pronostico' | 'historico_estacional'
  dias_anticipacion int,
  actualizado_en timestamptz default now(),
  unique (destino, mes_referencia, fuente)
);

create index if not exists clima_cache_destino_mes_idx on clima_cache (destino, mes_referencia);

-- ============================================================
-- Función: búsqueda híbrida de candidatos
-- Ya excluye por capacidad y calcula el precio real según num_personas —
-- así el backend no le pasa a Darwin candidatos que de entrada no calzan.
-- ============================================================
create or replace function buscar_candidatos(
  query_embedding vector(1536),
  presupuesto_max numeric,
  intereses_filtro text[],
  num_personas int default 1,
  limite int default 20
)
returns setof panoramas
language sql
as $$
  select *
  from panoramas
  where disponibilidad = true
    and (capacidad_maxima is null or capacidad_maxima >= num_personas)
    and (
      (precio_unidad = 'por_persona' and precio * num_personas <= presupuesto_max)
      or (precio_unidad = 'total' and precio <= presupuesto_max)
    )
    and categoria && intereses_filtro
  order by embedding <=> query_embedding
  limit limite;
$$;

-- ============================================================
-- Función: candidatos cercanos a un panorama base (para armado_paquete)
-- limite en 8 (subido de 5): Darwin necesita separar candidatos de
-- actividad de candidatos de alojamiento dentro del mismo set — con 5
-- corría el riesgo de quedarse sin opciones de alojamiento si las 5 más
-- cercanas eran todas actividades.
-- ============================================================
create or replace function candidatos_cercanos(
  panorama_id_base uuid,
  radio_km float8 default 40
)
returns table (
  id uuid,
  nombre text,
  distancia_km float8,
  tipo text,
  precio numeric,
  precio_unidad text,
  duracion_horas numeric,
  capacidad_maxima int
)
language sql
as $$
  with calculado as (
    select
      p2.id,
      p2.nombre,
      ( 6371 * acos(
          least(1.0, greatest(-1.0,
            cos(radians(p1.lat)) * cos(radians(p2.lat)) *
              cos(radians(p2.lng) - radians(p1.lng)) +
            sin(radians(p1.lat)) * sin(radians(p2.lat))
          ))
        ) as distancia_km,
      case when p2.es_alojamiento then 'alojamiento' else p2.categoria[1] end as tipo,
      p2.precio,
      p2.precio_unidad,
      p2.duracion_horas,
      p2.capacidad_maxima
    from panoramas p1, panoramas p2
    where p1.id = panorama_id_base
      and p2.id != panorama_id_base
      and p2.disponibilidad = true
  )
  select id, nombre, distancia_km, tipo, precio, precio_unidad, duracion_horas, capacidad_maxima
  from calculado
  where distancia_km <= radio_km
  order by distancia_km asc
  limit 8;
$$;

-- ============================================================
-- Función: candidatos cercanos a un punto suelto (para el Endpoint 3,
-- GET /darwin/feed, donde no hay panorama_id_base porque el usuario no
-- partió de ningún panorama, solo abrió la app). Misma lógica de
-- haversine que candidatos_cercanos, pero contra lat/lng sueltos.
-- ============================================================
create or replace function candidatos_cercanos_a_punto(
  lat_punto float8,
  lng_punto float8,
  radio_km float8 default 40
)
returns table (
  id uuid,
  nombre text,
  distancia_km float8,
  tipo text,
  precio numeric,
  precio_unidad text,
  duracion_horas numeric,
  capacidad_maxima int
)
language sql
as $$
  with calculado as (
    select
      p2.id,
      p2.nombre,
      ( 6371 * acos(
          least(1.0, greatest(-1.0,
            cos(radians(lat_punto)) * cos(radians(p2.lat)) *
              cos(radians(p2.lng) - radians(lng_punto)) +
            sin(radians(lat_punto)) * sin(radians(p2.lat))
          ))
        ) as distancia_km,
      case when p2.es_alojamiento then 'alojamiento' else p2.categoria[1] end as tipo,
      p2.precio,
      p2.precio_unidad,
      p2.duracion_horas,
      p2.capacidad_maxima
    from panoramas p2
    where p2.disponibilidad = true
  )
  select id, nombre, distancia_km, tipo, precio, precio_unidad, duracion_horas, capacidad_maxima
  from calculado
  where distancia_km <= radio_km
  order by distancia_km asc
  limit 8;
$$;

-- ============================================================
-- Función: matriz de distancias entre candidatos (para cluster de
-- paquete). Darwin necesita validar que los complementos de un paquete
-- estén cerca ENTRE SÍ, no solo cerca de la base.
-- El backend debe llamarla con TODOS los ids de candidatos + la base +
-- el/los candidatos de alojamiento, y sumar el resultado como el bloque
-- distancias_cluster (array de {id_a, id_b, distancia_km}) en el JSON
-- de entrada de Darwin.
-- ============================================================
create or replace function distancias_entre_candidatos(ids uuid[])
returns table (
  id_a uuid,
  id_b uuid,
  distancia_km float8
)
language sql
as $$
  select
    p1.id as id_a,
    p2.id as id_b,
    ( 6371 * acos(
        least(1.0, greatest(-1.0,
          cos(radians(p1.lat)) * cos(radians(p2.lat)) *
            cos(radians(p2.lng) - radians(p1.lng)) +
          sin(radians(p1.lat)) * sin(radians(p2.lat))
        ))
      )
    ) as distancia_km
  from panoramas p1
  join panoramas p2 on p2.id != p1.id
  where p1.id = any(ids)
    and p2.id = any(ids)
$$;

-- ============================================================
-- Row Level Security
-- Cada usuario solo lee/escribe sus propios datos (auth.uid() = usuario_id).
-- paquete_dias hereda el acceso a través de paquete_id (no tiene
-- usuario_id propio). panoramas y clima_cache son de lectura pública,
-- escritura solo por el backend (service role, que bypassea RLS).
-- ============================================================
alter table usuarios_perfil enable row level security;
alter table historial_viajes enable row level security;
alter table historial_interacciones enable row level security;
alter table sentimiento_usuario enable row level security;
alter table paquetes enable row level security;
alter table paquete_dias enable row level security;
alter table panoramas enable row level security;
alter table clima_cache enable row level security;

drop policy if exists usuarios_perfil_self on usuarios_perfil;
create policy usuarios_perfil_self on usuarios_perfil
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists historial_viajes_self on historial_viajes;
create policy historial_viajes_self on historial_viajes
  for all using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

drop policy if exists historial_interacciones_self on historial_interacciones;
create policy historial_interacciones_self on historial_interacciones
  for all using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

drop policy if exists sentimiento_usuario_self on sentimiento_usuario;
create policy sentimiento_usuario_self on sentimiento_usuario
  for all using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

drop policy if exists paquetes_self on paquetes;
create policy paquetes_self on paquetes
  for all using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

drop policy if exists paquete_dias_via_paquete on paquete_dias;
create policy paquete_dias_via_paquete on paquete_dias
  for all using (
    exists (
      select 1 from paquetes
      where paquetes.id = paquete_dias.paquete_id
        and paquetes.usuario_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from paquetes
      where paquetes.id = paquete_dias.paquete_id
        and paquetes.usuario_id = auth.uid()
    )
  );

drop policy if exists panoramas_public_read on panoramas;
create policy panoramas_public_read on panoramas
  for select using (true);

drop policy if exists clima_cache_public_read on clima_cache;
create policy clima_cache_public_read on clima_cache
  for select using (true);

-- panoramas/clima_cache no tienen policy de insert/update/delete: solo el
-- service role (que bypassea RLS) puede escribirlas, que es exactamente
-- lo que hacen los endpoints del backend con SUPABASE_SERVICE_ROLE_KEY.
