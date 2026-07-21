import 'package:flutter_test/flutter_test.dart';
import 'package:pickmap_app/features/panoramas/data/panorama_item.dart';

const _paquete = PanoramaItem(
  id: 'p1',
  icon: '🖼️',
  title: 'Museo + almuerzo con guía',
  meta: 'Paquete de un día',
  kind: PanoramaKind.paquete,
  priceClp: 39000,
  photo: 'https://example.invalid/foto.jpg',
);

const _simple = PanoramaItem(
  id: 's1',
  icon: '🥾',
  title: 'Sendero + mirador al atardecer',
  meta: 'A 50 min · Medio día',
  kind: PanoramaKind.simple,
  priceClp: 12000,
  photo: 'https://example.invalid/foto.jpg',
);

void main() {
  group('kindLabel', () {
    test('paquete -> Paquete, simple -> Simple', () {
      expect(_paquete.kindLabel, 'Paquete');
      expect(_simple.kindLabel, 'Simple');
    });
  });

  group('components', () {
    test('separa el título compuesto por " + " en partes individuales', () {
      expect(_paquete.components, ['Museo', 'almuerzo con guía']);
    });

    test('un título sin "+" queda como un solo componente', () {
      const item = PanoramaItem(
        id: 'x',
        icon: '🌲',
        title: 'Canopy en el Cajón del Maipo',
        meta: 'A 40 min',
        kind: PanoramaKind.simple,
        priceClp: 28000,
        photo: 'https://example.invalid/foto.jpg',
      );
      expect(item.components, ['Canopy en el Cajón del Maipo']);
    });
  });
}
