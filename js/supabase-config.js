/* Pickmap — configuración de Supabase (fase de backend real)
 *
 * SEGURO de comitear: la anon key de Supabase está pensada para vivir en
 * código de navegador — la seguridad real la da Row Level Security
 * (ver supabase/schema.sql), no ocultar esta key. La service role key
 * JAMÁS va acá ni en ningún archivo del repo — solo como variable de
 * entorno de scripts que corren fuera del navegador (scripts/importar_ghl_a_supabase.js).
 *
 * Reemplaza los dos valores de abajo por los de tu proyecto real
 * (Supabase → Project Settings → API). Mientras sigan con el placeholder,
 * supabase-client.js lo detecta y no intenta conectar (falla explícito,
 * no un error críptico de red).
 */
window.PICKMAP_SUPABASE_URL = 'https://igevnfsbteilvxkypgeo.supabase.co';
window.PICKMAP_SUPABASE_ANON_KEY = 'sb_publishable_4ohrbxnBqlZuac80uOs6GA_SDrozb4h';
