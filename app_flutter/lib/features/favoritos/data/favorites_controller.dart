import 'package:flutter/foundation.dart';

/// Favoritos en memoria, compartidos entre Explorar y Favoritos vía
/// Provider (un solo `ChangeNotifier` a nivel de app, ver `main.dart`).
/// Es intencionalmente efímero (no persiste entre reinicios de la app)
/// mientras el catálogo siga siendo data de muestra — cuando se conecte
/// `businesses` real, este es el punto donde enganchar persistencia real
/// (Supabase) sin tener que tocar las pantallas que ya lo consumen.
class FavoritesController extends ChangeNotifier {
  final Set<String> _ids = {};

  bool isFavorited(String id) => _ids.contains(id);

  void toggle(String id) {
    if (!_ids.add(id)) _ids.remove(id);
    notifyListeners();
  }

  Set<String> get ids => _ids;
}
