import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'pickmap_colors.dart';

/// `--radius`/`--radius-sm`/`--shadow` de css/styles.css, mismos valores.
class PickmapRadius {
  PickmapRadius._();
  static const card = 18.0;
  static const small = 12.0;
}

class PickmapShadows {
  PickmapShadows._();
  static const card = [
    BoxShadow(
      color: Color.fromRGBO(30, 45, 49, 0.12),
      blurRadius: 30,
      offset: Offset(0, 12),
    ),
  ];
}

/// `--font-display: 'Fredoka'` para títulos, `--font-body: 'Nunito Sans'`
/// para el resto — mismo par tipográfico que el sitio (cargado ahí vía
/// Google Fonts CDN, acá vía el paquete google_fonts).
class PickmapTheme {
  PickmapTheme._();

  static ThemeData light() {
    final base = ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: PickmapColors.coral,
        primary: PickmapColors.coral,
        secondary: PickmapColors.sun,
        surface: PickmapColors.white,
        error: PickmapColors.deepRed,
        brightness: Brightness.light,
      ),
      scaffoldBackgroundColor: PickmapColors.bg,
      fontFamily: GoogleFonts.nunitoSans().fontFamily,
    );

    final displayFont = GoogleFonts.fredokaTextTheme(base.textTheme);
    final bodyFont = GoogleFonts.nunitoSansTextTheme(base.textTheme);

    final textTheme = bodyFont.copyWith(
      displayLarge: displayFont.displayLarge?.copyWith(color: PickmapColors.navy),
      displayMedium: displayFont.displayMedium?.copyWith(color: PickmapColors.navy),
      displaySmall: displayFont.displaySmall?.copyWith(color: PickmapColors.navy),
      headlineLarge: displayFont.headlineLarge?.copyWith(color: PickmapColors.navy, fontWeight: FontWeight.w600),
      headlineMedium: displayFont.headlineMedium?.copyWith(color: PickmapColors.navy, fontWeight: FontWeight.w600),
      headlineSmall: displayFont.headlineSmall?.copyWith(color: PickmapColors.navy, fontWeight: FontWeight.w600),
      titleLarge: displayFont.titleLarge?.copyWith(color: PickmapColors.navy, fontWeight: FontWeight.w600),
      titleMedium: displayFont.titleMedium?.copyWith(color: PickmapColors.navy, fontWeight: FontWeight.w600),
      titleSmall: displayFont.titleSmall?.copyWith(color: PickmapColors.navy, fontWeight: FontWeight.w600),
      bodyLarge: bodyFont.bodyLarge?.copyWith(color: PickmapColors.navy),
      bodyMedium: bodyFont.bodyMedium?.copyWith(color: PickmapColors.slate),
      bodySmall: bodyFont.bodySmall?.copyWith(color: PickmapColors.slate),
      labelLarge: bodyFont.labelLarge?.copyWith(color: PickmapColors.navy, fontWeight: FontWeight.w700),
    );

    return base.copyWith(
      textTheme: textTheme,
      appBarTheme: AppBarTheme(
        backgroundColor: PickmapColors.bg.withValues(alpha: 0.9),
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        foregroundColor: PickmapColors.navy,
        titleTextStyle: textTheme.titleLarge,
      ),
      cardTheme: CardThemeData(
        color: PickmapColors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(PickmapRadius.card)),
        margin: EdgeInsets.zero,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: PickmapColors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(PickmapRadius.small),
          borderSide: BorderSide(color: PickmapColors.mist.withValues(alpha: 0.6)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(PickmapRadius.small),
          borderSide: BorderSide(color: PickmapColors.mist.withValues(alpha: 0.6)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(PickmapRadius.small),
          borderSide: const BorderSide(color: PickmapColors.coral, width: 1.6),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(PickmapRadius.small),
          borderSide: const BorderSide(color: PickmapColors.deepRed, width: 1.4),
        ),
        labelStyle: const TextStyle(color: PickmapColors.slate),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        // OJO: no fijar `textStyle` acá sin `fontFamily` — un TextStyle sin
        // fontFamily explícito gana por completo sobre el default (no se
        // mergea campo a campo) y el botón cae al fallback "Roboto" del
        // motor en vez de heredar la tipografía de marca (`textTheme`,
        // más abajo) — invisible en Flutter Web si el fallback no llega a
        // cargar por red (bug real encontrado con Playwright: texto del
        // botón desaparecía por completo). fontWeight/tamaño ya vienen de
        // `labelLarge` en el textTheme de arriba.
        style: ElevatedButton.styleFrom(
          backgroundColor: PickmapColors.coral,
          foregroundColor: Colors.white,
          disabledBackgroundColor: PickmapColors.coral.withValues(alpha: 0.45),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(PickmapRadius.small)),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(foregroundColor: PickmapColors.navy),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: PickmapColors.navy,
          side: BorderSide(color: PickmapColors.mist.withValues(alpha: 0.8)),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(PickmapRadius.small)),
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: PickmapColors.white,
        selectedItemColor: PickmapColors.coral,
        unselectedItemColor: PickmapColors.slate,
        type: BottomNavigationBarType.fixed,
        showUnselectedLabels: true,
      ),
      dividerTheme: DividerThemeData(color: PickmapColors.mist.withValues(alpha: 0.4)),
    );
  }
}
