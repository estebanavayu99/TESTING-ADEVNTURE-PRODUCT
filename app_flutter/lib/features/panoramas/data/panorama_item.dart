enum PanoramaKind { simple, paquete }

/// Mismo `CATEGORY_LABELS` de `js/panoramas.js` — vocabulario compartido de
/// gustos (TASTE_POOL) y tipos de compañía (COMPANY_POOL) usado tanto para
/// personalización como para el filtro "Tipo de experiencia".
const Map<String, String> categoryLabels = {
  'naturaleza': 'Naturaleza',
  'gastronomia': 'Gastronomía',
  'relax': 'Relax',
  'vidanocturna': 'Vida nocturna',
  'cultura': 'Cultura',
  'extremo': 'Extremo',
  'playa': 'Playa',
  'nieve': 'Nieve',
  'shopping': 'Shopping',
  'fotografia': 'Fotografía',
  'musica': 'Música',
  'pareja': 'En pareja',
  'familia': 'En familia',
  'amigos': 'Con amigos',
  'trabajo': 'De trabajo',
  'solo': 'Solo/a',
  'general': 'Populares',
};

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
    required this.category,
    this.reason,
  });

  final String id;
  final String icon;
  final String title;
  final String meta;
  final PanoramaKind kind;
  final int priceClp;
  final String photo;

  /// Mismo vocabulario que `categoryLabels` de arriba — usado por el
  /// filtro "Tipo de experiencia" (`js/panoramas.js`: `item.category =
  /// item.taste || item.company || 'general'`).
  final String category;

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

  /// Mismo `hashStr(title)` de `js/panoramas.js` — hash determinístico
  /// (no random real) para derivar rating/distancia/día de forma estable
  /// entre recargas, sin tener que guardar esos valores a mano por item.
  int get _h {
    var h = 0;
    for (final code in title.codeUnits) {
      h = (h * 31 + code) & 0xFFFFFFFF;
    }
    return h;
  }

  /// Mismo criterio que `enrich()` en `js/panoramas.js`: 4.3-5.0 estable
  /// por item, nunca un número al azar en cada rebuild.
  double get rating => 4.3 + (_h % 8) / 10;
  String get formattedRating => rating.toStringAsFixed(1);
  int get reviews => 60 + (_h % 900);

  /// Mismo `parseKm()` de `js/panoramas.js`: intenta leer horas/minutos
  /// desde `meta`, y si no hay ninguna mención de tiempo cae a un valor
  /// estable derivado del hash (nunca null/inventado en pantalla).
  int get km {
    final hourMatch = RegExp(r'(\d+(\.\d+)?)\s*hora', caseSensitive: false).firstMatch(meta);
    if (hourMatch != null) return (double.parse(hourMatch.group(1)!) * 45).round();
    final minMatch = RegExp(r'(\d+)\s*min', caseSensitive: false).firstMatch(meta);
    if (minMatch != null) return (int.parse(minMatch.group(1)!) * 0.7).round();
    return 8 + (_h % 40);
  }

  /// Mismo `distanceBucket()` de `js/panoramas.js`.
  String get distanceBucket {
    if (km <= 20) return 'cerca';
    if (km <= 45) return 'media';
    return 'lejos';
  }

  /// Mismo `parseDay()` de `js/panoramas.js`: bucket fijo por item
  /// ('semana'/'finde'), leído del texto de `meta` si menciona un día
  /// explícito, o derivado del hash como fallback estable.
  String get dayBucket {
    if (RegExp(r'viernes|s[aá]bado|domingo|fin de semana', caseSensitive: false).hasMatch(meta)) return 'finde';
    if (RegExp(r'lunes|martes|mi[eé]rcoles|jueves', caseSensitive: false).hasMatch(meta)) return 'semana';
    return _h % 2 == 0 ? 'semana' : 'finde';
  }

  /// Mismo `parseDias()` de `js/panoramas.js`, con el mismo fallback a
  /// '1' para paquetes cuyo `meta` no menciona una duración explícita
  /// (bug real ya corregido en el sitio, ver CLAUDE.md) — nunca deja un
  /// paquete sin bucket de duración.
  String? get packageDuration {
    if (kind != PanoramaKind.paquete) return null;
    if (RegExp(r'fin de semana', caseSensitive: false).hasMatch(meta)) return 'finde';
    if (RegExp(r'2\s*d[ií]as', caseSensitive: false).hasMatch(meta)) return '2';
    return '1';
  }

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
