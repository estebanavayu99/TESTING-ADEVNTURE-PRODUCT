import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/data/auth_controller.dart';
import '../../features/auth/presentation/auth_page.dart';
import '../../features/home/presentation/home_shell.dart';
import '../../features/onboarding/presentation/onboarding_page.dart';
import '../theme/pickmap_colors.dart';

/// Redirección declarativa mirror de `js/auth.js`: el chequeo de
/// `profile.onboarded` solo decide el destino en el instante de
/// login/signup/restauración de sesión (cuando se está en `/splash` o
/// `/auth`) — no como guardia permanente en cada navegación, igual que
/// el sitio (el botón "Prefiero hacerlo después" de onboarding.html
/// navega directo a dashboard sin marcar `onboarded`, y no se lo vuelve
/// a forzar hasta el próximo login).
GoRouter buildRouter(AuthController auth) {
  return GoRouter(
    refreshListenable: auth,
    initialLocation: '/splash',
    redirect: (context, state) {
      final loc = state.matchedLocation;
      switch (auth.status) {
        case AuthStatus.loading:
          return loc == '/splash' ? null : '/splash';
        case AuthStatus.signedOut:
          return loc == '/auth' ? null : '/auth';
        case AuthStatus.signedIn:
          if (loc == '/splash' || loc == '/auth') {
            final onboarded = auth.profile?.onboarded ?? false;
            return onboarded ? '/home' : '/onboarding';
          }
          return null;
      }
    },
    routes: [
      GoRoute(path: '/splash', builder: (context, state) => const _SplashPage()),
      GoRoute(path: '/auth', builder: (context, state) => const AuthPage()),
      GoRoute(path: '/onboarding', builder: (context, state) => const OnboardingPage()),
      GoRoute(path: '/home', builder: (context, state) => const HomeShell()),
    ],
  );
}

class _SplashPage extends StatelessWidget {
  const _SplashPage();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: PickmapColors.bg,
      body: Center(child: CircularProgressIndicator(color: PickmapColors.coral)),
    );
  }
}
