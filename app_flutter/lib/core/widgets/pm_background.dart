import 'package:flutter/material.dart';

import '../theme/pickmap_colors.dart';

/// Fondo degradado suave (cielo cálido → crema) usado detrás de las
/// pantallas de auth/onboarding — versión simplificada, sin animar, del
/// `.skyline` ilustrado del sitio web (montañas/sol/nubes en CSS puro).
/// Para las pantallas logueadas (Explorar/Mi cuenta/etc.) se usa el fondo
/// plano `--bg` del tema en vez de este degradado, igual que
/// `css/dashboard.css` no repite el skyline completo en cada tarjeta.
class PmBackground extends StatelessWidget {
  const PmBackground({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Color(0xFFFFE9C7),
            PickmapColors.bg,
          ],
        ),
      ),
      child: child,
    );
  }
}
