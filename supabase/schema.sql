-- Pickmap / Darwin — schema real de Supabase (fase de migración desde localStorage)
--
-- Cómo aplicar: pegar este archivo completo en el SQL Editor del proyecto
-- Supabase real (Project → SQL Editor → New query → pegar → Run). No
-- requiere el CLI de Supabase ni conexión desde este repo/sandbox.
--
-- Alcance de esta primera migración: viajero + catálogo + perfil de
-- preferencias de Darwin (Prioridad 1 declarada por el dueño del
-- producto: la recomendación directa sin chat, Superficie 2). Las tablas
-- de negocio/empresa aliada (reservas, pagos, reseñas propias del panel
-- negocio-*.html) quedan para una fase posterior — hoy siguen en
-- localStorage, no se tocan acá.
--
-- Principio de diseño: perfil de preferencias = una sola fuente de
-- verdad compartida entre las dos superficies de Darwin (widget de
-- chat y backend silencioso), con trazabilidad de qué evento generó
-- cada actualización (onboarding declarado / inferido de
-- comportamiento / mencionado al widget de soporte) — no un snapshot
-- que se sobrescribe sin dejar rastro.

-- ============================================================
-- 1. profiles — datos de viajero (reemplaza pickmap_users)
-- ============================================================
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  rut text,
  phone text,
  age int,
  city text,
  -- Respuestas crudas de onboarding.html, tal como las declara el cliente
  -- (vocabulario simple: naturaleza/gastronomia/relax/etc., no los buckets
  -- internos de Darwin — el mapeo a buckets vive en darwin_preferences).
  company text[] default '{}',        -- ej. {'pareja'}
  tastes text[] default '{}',         -- ej. {'naturaleza','gastronomia'}
  difficulty text[] default '{}',
  budget text[] default '{}',
  travel_distance text[] default '{}',
  preferred_day text[] default '{}',
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: el dueño lee su propio perfil"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "profiles: el dueño actualiza su propio perfil"
  on public.profiles for update
  using (auth.uid() = user_id);

create policy "profiles: el dueño crea su propio perfil"
  on public.profiles for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- 2. darwin_preferences — el "perfil" que consume motor.js
-- ============================================================
-- Mirror directo de la forma de `perfilPorDefecto()` en
-- bot-darwin/js/motor.js (intereses, arquetipos, grupo, presupuesto,
-- origen, contexto, restricciones, oferta_combo) para que la migración
-- de js/darwin-backend.js no tenga que rediseñar el shape que motor.js
-- ya entiende — solo cambia de dónde se lee/escribe.
create table if not exists public.darwin_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  intereses jsonb not null default '[]',        -- [{categoria, afinidad}]
  arquetipos jsonb not null default '[]',       -- string[]
  grupo jsonb not null default '{}',            -- {adultos, ninos, tipo, gustos_divergentes}
  presupuesto jsonb not null default '{}',      -- {banda, sensibilidad, gastado_en_combo}
  origen jsonb,                                  -- {lat, lng, nombre} — última ubicación real conocida
  contexto jsonb not null default '{}',         -- {clima_usuario, luz, eventos, afluencia}
  restricciones text[] default '{}',
  oferta_combo jsonb,                            -- {base_id, complemento_id} pendiente de aceptar
  favoritos text[] default '{}',
  descartados text[] default '{}',
  historial_ids text[] default '{}',
  updated_at timestamptz not null default now()
);

alter table public.darwin_preferences enable row level security;

create policy "darwin_preferences: el dueño lee su propio perfil"
  on public.darwin_preferences for select
  using (auth.uid() = user_id);

create policy "darwin_preferences: el dueño escribe su propio perfil"
  on public.darwin_preferences for insert
  with check (auth.uid() = user_id);

create policy "darwin_preferences: el dueño actualiza su propio perfil"
  on public.darwin_preferences for update
  using (auth.uid() = user_id);

-- ============================================================
-- 3. preference_signals — log de trazabilidad (append-only)
-- ============================================================
-- Cada fila = un evento que movió (o pudo mover) la afinidad de una
-- categoría para un cliente. Existe para poder responder "¿por qué
-- Darwin recomendó esto?" y para poder revertir una inferencia mala,
-- sin depender de que darwin_preferences.intereses sea la única memoria.
create table if not exists public.preference_signals (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  categoria text,                      -- bucket interno de Darwin (aventura, foodie, relax, ...); null si el evento no es de una sola categoría (ej. recálculo completo del perfil)
  fuente text not null check (fuente in ('onboarding', 'inferido', 'chat', 'reserva', 'resena')),
  delta_afinidad numeric,              -- cuánto ajustó (positivo o negativo), null si es solo informativo
  detalle jsonb,                       -- contexto libre: qué combo, qué mensaje, qué reserva, etc.
  created_at timestamptz not null default now()
);

alter table public.preference_signals enable row level security;

create policy "preference_signals: el dueño lee sus propias señales"
  on public.preference_signals for select
  using (auth.uid() = user_id);

create policy "preference_signals: el dueño escribe sus propias señales"
  on public.preference_signals for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- 4. businesses — catálogo real (reemplaza catalogo.real-sample.js)
-- ============================================================
-- Mismo contrato de datos documentado en bot-darwin/data/catalogo.mock.js
-- y bot-darwin/README.md, para no tener que tocar bot-darwin/js/tools.js
-- ni motor.js — solo cambia la fuente que tools.js consulta.
create table if not exists public.businesses (
  id text primary key,                 -- mismo id usado hoy en catalogo.real-sample.js
  ghl_id text unique,                  -- mapeo al registro real en GoHighLevel, para sync futura
  nombre text not null,
  categoria text not null,
  tags text[] default '{}',
  precio int,
  duracion_min int,
  lat double precision,
  lng double precision,
  comuna text,
  energia text check (energia in ('baja', 'media', 'alta')),
  exterior boolean,
  indoor_alt boolean,
  accesible boolean,
  experiencia_estimada int check (experiencia_estimada between 1 and 5),
  hero_moment boolean default false,
  horarios text[] default '{}',
  punto_encuentro text,
  incluye text[] default '{}',
  no_incluye text[] default '{}',
  restricciones text[] default '{}',
  cupos jsonb default '{}',            -- { 'YYYY-MM-DD': { 'HH:MM': numeroDeCupos } }
  tipo text,                            -- 'hospedaje' opcional, ausente = actividad de día normal
  es_gema_oculta boolean,
  evita_trampa text,
  -- Estimado vs. real: mientras la ficha operativa real del negocio no
  -- esté confirmada, precio/duracion_min/horarios/accesible pueden venir
  -- de una heurística por categoría (mismo criterio que
  -- generar_catalogo_real_sample.py) — este flag lo deja explícito en
  -- vez de mezclarlo silenciosamente con negocios ya confirmados.
  datos_estimados boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.businesses enable row level security;

create policy "businesses: lectura pública"
  on public.businesses for select
  using (true);

-- Sin policy de insert/update/delete para el rol "anon"/"authenticated":
-- el catálogo solo se escribe con la service role key, desde el script
-- de importación (scripts/importar_ghl_a_supabase.js) o el SQL Editor,
-- nunca desde el navegador del cliente.

-- ============================================================
-- 5. Trigger: updated_at automático
-- ============================================================
create or replace function public.tocar_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.tocar_updated_at();

create trigger darwin_preferences_updated_at
  before update on public.darwin_preferences
  for each row execute function public.tocar_updated_at();

create trigger businesses_updated_at
  before update on public.businesses
  for each row execute function public.tocar_updated_at();
