import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pickmap_app/features/panoramas/data/panorama_item.dart';
import 'package:pickmap_app/features/panoramas/presentation/panorama_card.dart';

const _item = PanoramaItem(
  id: 'test-item',
  icon: '🌲',
  title: 'Panorama de prueba',
  meta: 'A 10 min',
  kind: PanoramaKind.simple,
  priceClp: 10000,
  photo: 'https://example.invalid/foto.jpg',
);

/// `PanoramaCard` siempre vive dentro de un ancho acotado en la app real
/// (`SizedBox` en las filas horizontales, celda de `GridView` en la
/// grilla) — sin eso, `AspectRatio` toma el ancho completo del viewport
/// de test y el `Column` desborda el alto disponible.
Widget _harness(Widget card) => MaterialApp(
      home: Scaffold(
        body: Align(
          alignment: Alignment.topLeft,
          child: SizedBox(width: 160, child: card),
        ),
      ),
    );

void main() {
  testWidgets('tocar el corazón dispara onFavoriteToggle, no onTap', (tester) async {
    var tapCount = 0;
    var toggleCount = 0;

    await tester.pumpWidget(_harness(PanoramaCard(
      item: _item,
      onTap: () => tapCount++,
      onFavoriteToggle: () => toggleCount++,
    )));
    await tester.pump();

    await tester.tap(find.byIcon(Icons.favorite_border));
    await tester.pump();

    expect(toggleCount, 1);
    expect(tapCount, 0);
  });

  testWidgets('tocar el resto de la tarjeta dispara onTap, no el favorito', (tester) async {
    var tapCount = 0;
    var toggleCount = 0;

    await tester.pumpWidget(_harness(PanoramaCard(
      item: _item,
      onTap: () => tapCount++,
      onFavoriteToggle: () => toggleCount++,
    )));
    await tester.pump();

    await tester.tap(find.text('Panorama de prueba'));
    await tester.pump();

    expect(tapCount, 1);
    expect(toggleCount, 0);
  });

  testWidgets('favorited:true muestra el corazón relleno', (tester) async {
    await tester.pumpWidget(_harness(PanoramaCard(item: _item, onTap: () {}, favorited: true)));
    await tester.pump();

    expect(find.byIcon(Icons.favorite), findsOneWidget);
    expect(find.byIcon(Icons.favorite_border), findsNothing);
  });
}
