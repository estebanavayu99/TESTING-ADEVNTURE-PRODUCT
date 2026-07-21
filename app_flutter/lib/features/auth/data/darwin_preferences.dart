/// Mirror de la tabla `darwin_preferences` (supabase/schema.sql) — el
/// "perfil" que consume el motor de recomendación. Esta primera etapa solo
/// escribe `grupo`/`presupuesto`/`restricciones` derivados del onboarding;
/// el resto (intereses con afinidad numérica, contexto de clima/afluencia)
/// se completa cuando se porte el motor de bot-darwin a la app.
class DarwinPreferences {
  final String userId;
  final Map<String, dynamic> grupo;
  final Map<String, dynamic> presupuesto;
  final List<String> restricciones;

  const DarwinPreferences({
    required this.userId,
    this.grupo = const {},
    this.presupuesto = const {},
    this.restricciones = const [],
  });

  Map<String, dynamic> toUpsertMap() => {
        'grupo': grupo,
        'presupuesto': presupuesto,
        'restricciones': restricciones,
      };
}
