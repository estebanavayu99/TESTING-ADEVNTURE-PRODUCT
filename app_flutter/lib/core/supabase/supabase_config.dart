/// Mismo proyecto real de Supabase que usa el sitio web
/// (`js/supabase-config.js`) — una sola fuente de verdad de auth/perfil
/// para viajero, compartida entre pickmap.cl y esta app. La anon key es
/// segura de commitear: la seguridad real la da RLS (ver
/// supabase/schema.sql en la raíz del repo), no ocultar esta key.
class PickmapSupabaseConfig {
  PickmapSupabaseConfig._();

  static const url = 'https://igevnfsbteilvxkypgeo.supabase.co';
  static const anonKey = 'sb_publishable_4ohrbxnBqlZuac80uOs6GA_SDrozb4h';

  /// Deep link al que Supabase redirige tras confirmar el correo o el
  /// reset de contraseña. Requiere:
  ///  - Android: intent-filter para el scheme `pickmap` en AndroidManifest.xml.
  ///  - iOS: CFBundleURLTypes para `pickmap` en Info.plist.
  ///  - Agregar `pickmap://login-callback` a Authentication → URL
  ///    Configuration → Redirect URLs en el dashboard de Supabase (mismo
  ///    lugar donde ya está `https://*.vercel.app/**` para el sitio web).
  static const authCallbackUrl = 'pickmap://login-callback';
}
