import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'package:pickmap_app/features/auth/data/auth_controller.dart';
import 'package:pickmap_app/features/auth/data/auth_repository.dart';
import 'package:pickmap_app/features/onboarding/presentation/onboarding_page.dart';

// Bug real: ni "Finalizar" ni "Saltar" navegaban a ningún lado — no había
// una sola llamada a `context.go`/`Navigator.push` en todo `onboarding_page.dart`,
// y el `redirect` del router solo actúa al salir de `/splash`/`/auth`, nunca
// desde `/onboarding` — un viajero nuevo quedaba atrapado en el wizard para
// siempre. `_leaveOnboarding()` distingue los dos contextos reales en los
// que vive esta pantalla (empujada desde Mi Cuenta vs. ruta raíz del router
// tras signup) con `Navigator.canPop()`. Estos tests no requieren red real:
// `AuthController._loadProfile()` ya atrapa internamente el error de no
// tener sesión (currentUser nulo) y nunca vuelve a lanzarlo, así que
// `_skip()` completa igual sin necesitar un backend de verdad.
AuthController _fakeSignedInAuth() {
  // `autoRefreshToken: false` — sin esto, el `GoTrueClient` interno arranca
  // un timer periódico real que el test framework detecta como "pending
  // timer" al terminar el test y falla la corrida (no hay sesión real que
  // refrescar en este test, así que no hace falta).
  final client = SupabaseClient(
    'https://example.invalid',
    'anon-key',
    authOptions: const AuthClientOptions(autoRefreshToken: false),
  );
  final auth = AuthController(AuthRepository(client));
  auth.status = AuthStatus.signedIn;
  return auth;
}

void main() {
  testWidgets('Saltar hace pop cuando el wizard fue empujado (editar desde Mi Cuenta)', (tester) async {
    final auth = _fakeSignedInAuth();
    await tester.pumpWidget(
      ChangeNotifierProvider<AuthController>.value(
        value: auth,
        child: MaterialApp(
          home: Builder(
            builder: (context) => Scaffold(
              body: Center(
                child: ElevatedButton(
                  onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const OnboardingPage())),
                  child: const Text('abrir onboarding'),
                ),
              ),
            ),
          ),
        ),
      ),
    );

    await tester.tap(find.text('abrir onboarding'));
    await tester.pumpAndSettle();
    expect(find.text('Antes de empezar'), findsOneWidget);

    await tester.tap(find.text('Saltar'));
    await tester.pumpAndSettle();

    // Volvió a la pantalla anterior — el wizard ya no está.
    expect(find.text('Antes de empezar'), findsNothing);
    expect(find.text('abrir onboarding'), findsOneWidget);
  });

  testWidgets('Saltar navega a /home cuando el wizard es la ruta raíz (signup fresco)', (tester) async {
    final auth = _fakeSignedInAuth();
    final router = GoRouter(
      initialLocation: '/onboarding',
      routes: [
        GoRoute(path: '/onboarding', builder: (context, state) => const OnboardingPage()),
        GoRoute(path: '/home', builder: (context, state) => const Scaffold(body: Text('HOME'))),
      ],
    );

    await tester.pumpWidget(
      ChangeNotifierProvider<AuthController>.value(
        value: auth,
        child: MaterialApp.router(routerConfig: router),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Antes de empezar'), findsOneWidget);

    await tester.tap(find.text('Saltar'));
    await tester.pumpAndSettle();

    expect(find.text('HOME'), findsOneWidget);
    expect(find.text('Antes de empezar'), findsNothing);
  });
}
