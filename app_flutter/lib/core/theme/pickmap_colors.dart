import 'package:flutter/material.dart';

/// Paleta oficial de PickMap — copiada 1:1 de las variables `:root` de
/// `css/styles.css` en el sitio web, para que la app se sienta parte de la
/// misma marca. Si el sitio web cambia esa paleta, replicar el cambio acá.
class PickmapColors {
  PickmapColors._();

  static const navy = Color(0xFF1E2D31);
  static const navy2 = Color(0xFF273C42);
  static const slate = Color(0xFF5E696C);
  static const mist = Color(0xFFBFC7CA);
  static const white = Color(0xFFFFFFFF);
  static const sun = Color(0xFFF6CD4C);
  static const coral = Color(0xFFF55E61);
  static const pink = Color(0xFFF58F8F);
  static const deepRed = Color(0xFFAF4345);
  static const green = Color(0xFF83D061);

  static const accent = coral;
  static const bg = Color(0xFFFBF8F3);

  // Estados de reserva (negocio.css / panoramas.js)
  static const estadoConfirmada = green;
  static const estadoPendiente = sun;
  static const estadoCancelada = deepRed;
}
