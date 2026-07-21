import 'package:supabase_flutter/supabase_flutter.dart';

import 'supabase_config.dart';

/// Inicializa el cliente único de Supabase para toda la app. Debe llamarse
/// una vez, antes de `runApp`, en `main.dart`.
Future<void> bootstrapSupabase() async {
  await Supabase.initialize(
    url: PickmapSupabaseConfig.url,
    publishableKey: PickmapSupabaseConfig.anonKey,
    authOptions: const FlutterAuthClientOptions(
      // PKCE es el default recomendado por Supabase para apps móviles: el
      // code_verifier vive en el mismo dispositivo/app que abre el link de
      // confirmación (a diferencia del sitio web, donde el bug de
      // confirmar desde OTRO navegador obligó a usar flujo implícito —
      // ver CLAUDE.md). Acá no aplica ese problema.
      authFlowType: AuthFlowType.pkce,
    ),
  );
}

SupabaseClient get supabase => Supabase.instance.client;
