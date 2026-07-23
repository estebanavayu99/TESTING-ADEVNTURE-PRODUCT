import 'package:flutter/material.dart';

/// Transición compartida para todo `Navigator.push` de la app: fade +
/// leve deslizamiento desde abajo, más rápida (260ms) y más suave que el
/// slide-from-right por defecto de `MaterialPageRoute` — mismo criterio
/// "pro" en toda la navegación interna entre pantallas (Mi Cuenta → Pick
/// Points/Onboarding, Pick Points/Invita → Panoramas, etc.), no solo en
/// pantallas puntuales.
class PmPageRoute<T> extends PageRouteBuilder<T> {
  PmPageRoute({required WidgetBuilder builder})
      : super(
          pageBuilder: (context, animation, secondaryAnimation) => builder(context),
          transitionDuration: const Duration(milliseconds: 260),
          reverseTransitionDuration: const Duration(milliseconds: 200),
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            final curved = CurvedAnimation(parent: animation, curve: Curves.easeOutCubic);
            return FadeTransition(
              opacity: curved,
              child: SlideTransition(
                position: Tween(begin: const Offset(0, 0.04), end: Offset.zero).animate(curved),
                child: child,
              ),
            );
          },
        );
}
