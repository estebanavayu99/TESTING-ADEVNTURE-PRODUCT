enum PanoramaKind { simple, paquete }

/// Item de catálogo — mismo shape que `TASTE_POOL`/`COMPANY_POOL`/
/// `DEFAULT_POOL` en `js/panoramas.js` (icon/title/meta/reason/price/foto).
/// Esta primera etapa de la app usa datos de muestra locales (ver
/// [sampleCatalog]) en vez de la tabla `businesses` real — portar el motor
/// de ranking (`bot-darwin/js/motor.js`) es trabajo aparte, documentado
/// como siguiente paso.
class PanoramaItem {
  const PanoramaItem({
    required this.id,
    required this.icon,
    required this.title,
    required this.meta,
    required this.kind,
    required this.priceClp,
    required this.photo,
    this.reason,
  });

  final String id;
  final String icon;
  final String title;
  final String meta;
  final PanoramaKind kind;
  final int priceClp;
  final String photo;

  /// "Por qué Darwin te lo recomienda" — null en la pestaña General
  /// (mismo criterio del sitio: sin perfil personal detrás, no se
  /// inventa una razón).
  final String? reason;

  String get formattedPrice => '\$${_thousands(priceClp)}';

  /// Mismo texto que `kindLabel` en `js/panoramas.js` (badge visible
  /// siempre en la tarjeta y en el modal, "Simple" o "Paquete") — el
  /// sitio nunca deja ambigüedad sobre qué tipo de panorama es cada uno.
  String get kindLabel => kind == PanoramaKind.paquete ? 'Paquete' : 'Simple';

  /// Un paquete junta varias actividades en un solo título separado por
  /// " + " (ej. "Museo + almuerzo con guía") — acá se separa para poder
  /// listarlas una por una en el detalle ("Este paquete incluye"), en
  /// vez de dejar el título compuesto como un solo bloque de texto.
  List<String> get components => title.split(RegExp(r'\s*\+\s*')).map((p) => p.trim()).toList();

  static String _thousands(int n) {
    final s = n.toString();
    final buf = StringBuffer();
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buf.write('.');
      buf.write(s[i]);
    }
    return buf.toString();
  }
}
