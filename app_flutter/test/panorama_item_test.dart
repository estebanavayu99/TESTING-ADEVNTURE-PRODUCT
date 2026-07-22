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
  category: 'cultura',
);

const _simple = PanoramaItem(
  id: 's1',
  icon: '🥾',
  title: 'Sendero + mirador al atardecer',
  meta: 'A 50 min · Medio día',
  kind: PanoramaKind.simple,
  priceClp: 12000,
  photo: 'https://example.invalid/foto.jpg',
  category: 'naturaleza',
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
        category: 'naturaleza',
      );
      expect(item.components, ['Canopy en el Cajón del Maipo']);
    });
  });

  group('rating/reviews', () {
    test('quedan siempre dentro del rango 4.3-5.0, estables entre llamadas', () {
      expect(_paquete.rating, greaterThanOrEqualTo(4.3));
      expect(_paquete.rating, lessThanOrEqualTo(5.0));
      expect(_paquete.rating, _paquete.rating); // determinístico, no random real
      expect(_paquete.reviews, greaterThanOrEqualTo(60));
    });
  });

  group('distanceBucket', () {
    test('clasifica km en cerca/media/lejos con los mismos cortes que la web (20/45)', () {
      const cerca = PanoramaItem(
        id: 'd1', icon: '📍', title: 'A', meta: 'A 10 min', kind: PanoramaKind.simple,
        priceClp: 1000, photo: 'x', category: 'naturaleza',
      );
      const lejos = PanoramaItem(
        id: 'd2', icon: '📍', title: 'B', meta: 'A 2 horas', kind: PanoramaKind.simple,
        priceClp: 1000, photo: 'x', category: 'naturaleza',
      );
      expect(cerca.km, lessThanOrEqualTo(20));
      expect(cerca.distanceBucket, 'cerca');
      expect(lejos.km, greaterThan(45));
      expect(lejos.distanceBucket, 'lejos');
    });
  });

  group('dayBucket', () {
    test('detecta "fin de semana"/viernes-domingo en el meta como finde', () {
      const finde = PanoramaItem(
        id: 'w1', icon: '📅', title: 'C', meta: 'Fin de semana', kind: PanoramaKind.simple,
        priceClp: 1000, photo: 'x', category: 'naturaleza',
      );
      expect(finde.dayBucket, 'finde');
    });

    test('detecta lunes-jueves en el meta como semana', () {
      const semana = PanoramaItem(
        id: 'w2', icon: '📅', title: 'D', meta: 'Todos los jueves', kind: PanoramaKind.simple,
        priceClp: 1000, photo: 'x', category: 'naturaleza',
      );
      expect(semana.dayBucket, 'semana');
    });
  });

  group('packageDuration', () {
    test('simple siempre queda en null (sin duración de varios días)', () {
      expect(_simple.packageDuration, isNull);
    });

    test('paquete sin mención explícita de días cae a "1" (bug real ya corregido en la web)', () {
      const sinDias = PanoramaItem(
        id: 'pd1', icon: '🎉', title: 'Paquete nocturno', meta: 'Bar + transporte de vuelta incluido',
        kind: PanoramaKind.paquete, priceClp: 1000, photo: 'x', category: 'vidanocturna',
      );
      expect(sinDias.packageDuration, '1');
    });

    test('paquete de "2 días" y "fin de semana" se leen del meta', () {
      const dosDias = PanoramaItem(
        id: 'pd2', icon: '🏕️', title: 'E', meta: 'Paquete de 2 días',
        kind: PanoramaKind.paquete, priceClp: 1000, photo: 'x', category: 'naturaleza',
      );
      const finde = PanoramaItem(
        id: 'pd3', icon: '🏕️', title: 'F', meta: 'Paquete de un fin de semana',
        kind: PanoramaKind.paquete, priceClp: 1000, photo: 'x', category: 'naturaleza',
      );
      expect(dosDias.packageDuration, '2');
      expect(finde.packageDuration, 'finde');
    });
  });
}
