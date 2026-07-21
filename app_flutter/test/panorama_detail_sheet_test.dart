import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pickmap_app/features/panoramas/data/panorama_item.dart';
import 'package:pickmap_app/features/panoramas/presentation/panorama_detail_sheet.dart';

const _item = PanoramaItem(
  id: 'test-item',
  icon: '🌲',
  title: 'Panorama de prueba',
  meta: 'A 10 min',
  kind: PanoramaKind.simple,
  priceClp: 10000,
  photo: 'https://example.invalid/foto.jpg',
  reason: 'Porque sí.',
);

void main() {
  testWidgets('tocar Reservar cierra el sheet y avisa honesto (no finge una reserva)', (tester) async {
    await tester.pumpWidget(MaterialApp(
      home: Builder(
        builder: (context) => Scaffold(
          body: Center(
            child: ElevatedButton(
              onPressed: () => showPanoramaDetail(context, _item),
              child: const Text('abrir detalle'),
            ),
          ),
        ),
      ),
    ));

    // `pump` explícito, no `pumpAndSettle`: la foto de placeholder
    // (`PmShimmer`) anima en loop infinito mientras la imagen de red
    // sigue "cargando" (no hay red real en el entorno de test), así que
    // `pumpAndSettle` nunca terminaría de esperar.
    await tester.tap(find.text('abrir detalle'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    // El sheet muestra título, precio y el motivo de Darwin.
    expect(find.text('Panorama de prueba'), findsOneWidget);
    expect(find.text('desde \$10.000'), findsOneWidget);
    expect(find.text('Porque sí.'), findsOneWidget);

    await tester.tap(find.text('Reservar'));
    await tester.pump(); // cierra el sheet (animación)
    await tester.pump(const Duration(milliseconds: 300));

    // El sheet ya no está.
    expect(find.text('Panorama de prueba'), findsNothing);

    // Se avisa algo real (no un "reserva confirmada" inventado).
    expect(find.textContaining('Muy pronto vas a poder reservar'), findsOneWidget);
  });
}
