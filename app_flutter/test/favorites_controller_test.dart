import 'package:flutter_test/flutter_test.dart';
import 'package:pickmap_app/features/favoritos/data/favorites_controller.dart';

void main() {
  group('FavoritesController', () {
    test('toggle agrega y quita del set, y notifica en cada cambio', () {
      final controller = FavoritesController();
      var notifications = 0;
      controller.addListener(() => notifications++);

      expect(controller.isFavorited('canopy-cajon'), isFalse);

      controller.toggle('canopy-cajon');
      expect(controller.isFavorited('canopy-cajon'), isTrue);
      expect(notifications, 1);

      controller.toggle('canopy-cajon');
      expect(controller.isFavorited('canopy-cajon'), isFalse);
      expect(notifications, 2);
    });

    test('ids distintos no se pisan entre sí', () {
      final controller = FavoritesController();
      controller.toggle('a');
      controller.toggle('b');
      expect(controller.isFavorited('a'), isTrue);
      expect(controller.isFavorited('b'), isTrue);

      controller.toggle('a');
      expect(controller.isFavorited('a'), isFalse);
      expect(controller.isFavorited('b'), isTrue);
    });
  });
}
