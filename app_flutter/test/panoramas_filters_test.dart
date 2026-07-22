import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:pickmap_app/features/favoritos/data/favorites_controller.dart';
import 'package:pickmap_app/features/panoramas/presentation/panoramas_page.dart';

// Bug real: la toolbar de filtros de Panoramas solo tenía "Ordenar" (3
// opciones) y "Precio" — muy por detrás de las 6 categorías de filtro que
// ya tiene `panoramas.html` (Ordenar/Tipo de experiencia/Distancia/Precio/
// Cuándo/Duración del paquete). Estos tests cubren el flujo nuevo: abrir la
// hoja de filtros, elegir una opción, aplicar, y ver el chip resultante —
// más "Limpiar todo" restableciendo todo de una.
//
// `pump()` explícito, no `pumpAndSettle()`: el shimmer de las fotos en
// carga (`PmShimmer`) anima en loop infinito mientras la imagen de red
// sigue "cargando" (sin red real en el entorno de test) — mismo motivo ya
// documentado en `panorama_detail_sheet_test.dart`. Las selecciones de
// prueba usan "Mejor valorados" (sección "Ordenar por", la primera,
// siempre visible sin scrollear dentro de la hoja) para no depender de
// cuánto scroll hace falta para llegar a secciones más abajo.
Widget _harness() => ChangeNotifierProvider<FavoritesController>(
      create: (_) => FavoritesController(),
      child: const MaterialApp(home: Scaffold(body: PanoramasPage())),
    );

Future<void> _settle(WidgetTester tester) async {
  await tester.pump();
  await tester.pump(const Duration(milliseconds: 350));
}

void main() {
  testWidgets('abrir la hoja de filtros, elegir un orden y aplicar deja un chip activo', (tester) async {
    await tester.pumpWidget(_harness());
    await _settle(tester);

    expect(find.text('Filtros'), findsOneWidget);

    await tester.tap(find.text('Filtros'));
    await _settle(tester);

    expect(find.text('Filtrar y ordenar'), findsOneWidget);
    expect(find.text('↕️ Ordenar por'), findsOneWidget);

    await tester.tap(find.text('Mejor valorados'));
    await _settle(tester);

    await tester.tap(find.text('Aplicar filtros'));
    await _settle(tester);

    // La hoja se cerró y quedó un chip con el filtro aplicado + contador.
    expect(find.text('Filtrar y ordenar'), findsNothing);
    expect(find.text('Filtros (1)'), findsOneWidget);
    expect(find.text('Mejor valorados'), findsOneWidget);
  });

  testWidgets('el chip activo se puede quitar directo con su ✕, sin volver a abrir la hoja', (tester) async {
    await tester.pumpWidget(_harness());
    await _settle(tester);

    await tester.tap(find.text('Filtros'));
    await _settle(tester);
    await tester.tap(find.text('Mejor valorados'));
    await _settle(tester);
    await tester.tap(find.text('Aplicar filtros'));
    await _settle(tester);

    expect(find.text('Filtros (1)'), findsOneWidget);

    await tester.tap(find.byIcon(Icons.close_rounded).first);
    await _settle(tester);

    expect(find.text('Filtros'), findsOneWidget);
    expect(find.text('Filtros (1)'), findsNothing);
    expect(find.text('Mejor valorados'), findsNothing);
  });

  testWidgets('"Limpiar todo" dentro de la hoja resetea la selección', (tester) async {
    await tester.pumpWidget(_harness());
    await _settle(tester);

    await tester.tap(find.text('Filtros'));
    await _settle(tester);
    await tester.tap(find.text('Mejor valorados'));
    await _settle(tester);

    await tester.tap(find.text('Limpiar todo'));
    await _settle(tester);
    await tester.tap(find.text('Aplicar filtros'));
    await _settle(tester);

    expect(find.text('Filtros'), findsOneWidget);
    expect(find.textContaining('Filtros ('), findsNothing);
  });
}
