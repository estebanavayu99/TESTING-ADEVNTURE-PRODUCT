import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/pickmap_colors.dart';
import '../../../core/widgets/pm_primary_button.dart';
import '../../favoritos/data/favorites_controller.dart';
import '../data/panorama_item.dart';
import '../data/sample_catalog.dart' as catalog;
import 'panorama_card.dart';
import 'panorama_detail_sheet.dart';

enum _ExploreTab { recomendado, general }

enum _PillFilter { todos, simple, paquete }

const _sortLabels = {
  'recomendado': 'Recomendado para ti',
  'rating': 'Mejor valorados',
  'price_asc': 'Precio: menor a mayor',
  'price_desc': 'Precio: mayor a menor',
};

const _priceLabels = {
  'todos': 'Cualquier precio',
  'bajo': 'Hasta \$15.000',
  'medio': '\$15.000 - \$30.000',
  'alto': 'Más de \$30.000',
};

const _distanceLabels = {
  'todas': 'Cualquier distancia',
  'cerca': 'Cerca · hasta 20 km',
  'media': 'Media · 20-45 km',
  'lejos': 'Lejos · 45+ km',
};

const _dayLabels = {
  'hoy': 'Hoy',
  'manana': 'Mañana',
  'finde_que_sigue': 'El fin de semana que sigue',
  'todos': 'Cualquiera',
};

const _diasLabels = {
  'todos': 'Cualquiera',
  '1': '1 día',
  '2': '2 días',
  'finde': 'Fin de semana',
};

/// Mirror de `panoramas.html`: filas "Combos"/"Simples" + sección
/// "Explorar" con tabs (Recomendado/General) y pills (Todos/Simples/
/// Paquetes). El pill "Todos" siempre muestra el catálogo completo sin
/// importar la pestaña activa — bug real corregido en el sitio web (ver
/// CLAUDE.md, "Filtro 'Todos'...") replicado acá desde el principio.
class PanoramasPage extends StatefulWidget {
  const PanoramasPage({super.key});

  @override
  State<PanoramasPage> createState() => _PanoramasPageState();
}

class _PanoramasPageState extends State<PanoramasPage> {
  _ExploreTab _tab = _ExploreTab.recomendado;
  _PillFilter _pill = _PillFilter.todos;

  // Mismos 6 filtros que la toolbar de `panoramas.html` (Ordenar/Tipo de
  // experiencia/Distancia/Precio/Cuándo/Duración del paquete) — antes esta
  // pantalla solo tenía Ordenar (con menos opciones) y Precio, bien por
  // detrás de la web. Viven detrás de una hoja modal ("apretar y
  // desglosar") en vez de 6 selects sueltos ocupando media pantalla.
  String _sort = 'recomendado';
  String _category = 'todas';
  String _distance = 'todas';
  String _priceFilter = 'todos';
  String _day = 'todos';
  String _dias = 'todos';

  bool get _hasActiveFilters =>
      _sort != 'recomendado' || _category != 'todas' || _distance != 'todas' || _priceFilter != 'todos' || _day != 'todos' || _dias != 'todos';

  int get _activeFilterCount => [
        _sort != 'recomendado',
        _category != 'todas',
        _distance != 'todas',
        _priceFilter != 'todos',
        _day != 'todos',
        _dias != 'todos',
      ].where((v) => v).length;

  List<String> get _availableCategories {
    final cats = catalog.todoElCatalogo.map((i) => i.category).toSet().toList();
    cats.sort((a, b) => (categoryLabels[a] ?? a).compareTo(categoryLabels[b] ?? b));
    return cats;
  }

  List<PanoramaItem> get _personalized => [
        ...catalog.recomendados,
        ...catalog.combos,
        ...catalog.simples,
      ];

  /// Mismo `diaBucketDeFecha()` de `js/panoramas.js`: cada item ya trae un
  /// `dayBucket` fijo ('semana'/'finde'); "Hoy"/"Mañana" traducen la fecha
  /// real a ese mismo bucket.
  String _diaBucketDeFecha(DateTime fecha) {
    final isWeekend = fecha.weekday == DateTime.saturday || fecha.weekday == DateTime.sunday;
    return isWeekend ? 'finde' : 'semana';
  }

  /// Mismo `applyAdvFilters()` de `js/panoramas.js` — se aplica tanto a las
  /// filas Combos/Simples como a la grilla de Explorar, igual que en la web.
  List<PanoramaItem> _applyAdvFilters(List<PanoramaItem> base) {
    var filtered = base;
    if (_category != 'todas') filtered = filtered.where((i) => i.category == _category).toList();
    if (_distance != 'todas') filtered = filtered.where((i) => i.distanceBucket == _distance).toList();
    if (_priceFilter != 'todos') {
      filtered = filtered.where((i) {
        switch (_priceFilter) {
          case 'bajo':
            return i.priceClp <= 15000;
          case 'medio':
            return i.priceClp > 15000 && i.priceClp <= 30000;
          case 'alto':
            return i.priceClp > 30000;
          default:
            return true;
        }
      }).toList();
    }
    if (_day == 'hoy') {
      filtered = filtered.where((i) => i.dayBucket == _diaBucketDeFecha(DateTime.now())).toList();
    } else if (_day == 'manana') {
      final manana = DateTime.now().add(const Duration(days: 1));
      filtered = filtered.where((i) => i.dayBucket == _diaBucketDeFecha(manana)).toList();
    } else if (_day == 'finde_que_sigue') {
      filtered = filtered.where((i) => i.dayBucket == 'finde').toList();
    }
    if (_dias != 'todos') filtered = filtered.where((i) => i.packageDuration == _dias).toList();
    return filtered;
  }

  /// Mismo `applySort()` de `js/panoramas.js` — "Recomendado para ti" deja
  /// intacto el orden de Darwin; el resto es elección explícita del
  /// viajero.
  List<PanoramaItem> _applySort(List<PanoramaItem> list) {
    if (_sort == 'recomendado') return list;
    final sorted = [...list];
    switch (_sort) {
      case 'rating':
        sorted.sort((a, b) => b.rating.compareTo(a.rating));
      case 'price_asc':
        sorted.sort((a, b) => a.priceClp.compareTo(b.priceClp));
      case 'price_desc':
        sorted.sort((a, b) => b.priceClp.compareTo(a.priceClp));
    }
    return sorted;
  }

  List<PanoramaItem> get _exploreList {
    List<PanoramaItem> base;
    if (_pill == _PillFilter.todos) {
      base = catalog.todoElCatalogo;
    } else {
      base = _tab == _ExploreTab.recomendado ? _personalized : catalog.todoElCatalogo;
      final kind = _pill == _PillFilter.simple ? PanoramaKind.simple : PanoramaKind.paquete;
      base = base.where((i) => i.kind == kind).toList();
    }
    base = _applyAdvFilters(base);
    // dedupe por id (mismo criterio que "Todos" en js/panoramas.js)
    final seen = <String>{};
    final deduped = base.where((i) => seen.add(i.id)).toList();
    return _applySort(deduped);
  }

  void _openFiltersSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _FiltersSheet(
        sort: _sort,
        category: _category,
        distance: _distance,
        price: _priceFilter,
        day: _day,
        dias: _dias,
        categories: _availableCategories,
        onApply: (sort, category, distance, price, day, dias) => setState(() {
          _sort = sort;
          _category = category;
          _distance = distance;
          _priceFilter = price;
          _day = day;
          _dias = dias;
        }),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filteredPersonalized = _applySort(_applyAdvFilters(_personalized));
    final rowPaquete = filteredPersonalized.where((i) => i.kind == PanoramaKind.paquete).take(6).toList();
    final rowSimple = filteredPersonalized.where((i) => i.kind == PanoramaKind.simple).take(6).toList();

    return SafeArea(
      child: Column(
        children: [
          const _ForestBanner(),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 18, 16, 32),
              children: [
                _toolbar(),
                const SizedBox(height: 22),
                _rowSection('Combos', rowPaquete, () => setState(() {
                      _tab = _ExploreTab.recomendado;
                      _pill = _PillFilter.paquete;
                    })),
                const SizedBox(height: 22),
                _rowSection('Simples', rowSimple, () => setState(() {
                      _tab = _ExploreTab.recomendado;
                      _pill = _PillFilter.simple;
                    })),
                const SizedBox(height: 26),
                _exploreSection(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// Toolbar compacta ("apretar y desglosar"): en vez de 6 selects sueltos
  /// ocupando media pantalla (como una primera versión más plana), acá
  /// solo vive un botón "Filtros" con contador de filtros activos que abre
  /// una hoja modal con las mismas 6 categorías de `panoramas.html`
  /// (Ordenar/Tipo de experiencia/Distancia/Precio/Cuándo/Duración del
  /// paquete) — igual o más completo que la web, pero sin saturar la
  /// pantalla principal. Los filtros ya aplicados quedan como chips
  /// removibles debajo, cada uno con su propia ✕.
  Widget _toolbar() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: const [BoxShadow(color: Color.fromRGBO(30, 45, 49, 0.06), blurRadius: 14, offset: Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text('🔍 Filtrar y ordenar', style: TextStyle(fontWeight: FontWeight.w700, color: PickmapColors.navy)),
              ),
              _filtersButton(),
            ],
          ),
          if (_hasActiveFilters) ...[
            const SizedBox(height: 12),
            Wrap(spacing: 8, runSpacing: 8, children: _activeFilterChips()),
          ],
        ],
      ),
    );
  }

  Widget _filtersButton() {
    return Material(
      color: _hasActiveFilters ? PickmapColors.coral : PickmapColors.bg,
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        borderRadius: BorderRadius.circular(999),
        onTap: _openFiltersSheet,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.tune_rounded, size: 16, color: _hasActiveFilters ? Colors.white : PickmapColors.navy),
              const SizedBox(width: 6),
              Text(
                _activeFilterCount > 0 ? 'Filtros ($_activeFilterCount)' : 'Filtros',
                style: TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w700,
                  color: _hasActiveFilters ? Colors.white : PickmapColors.navy,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _activeFilterChips() {
    final chips = <Widget>[];
    void addChip(String label, VoidCallback onClear) => chips.add(_filterChip(label, onClear));

    if (_sort != 'recomendado') addChip(_sortLabels[_sort]!, () => setState(() => _sort = 'recomendado'));
    if (_category != 'todas') {
      addChip(categoryLabels[_category] ?? _category, () => setState(() => _category = 'todas'));
    }
    if (_distance != 'todas') addChip(_distanceLabels[_distance]!, () => setState(() => _distance = 'todas'));
    if (_priceFilter != 'todos') addChip(_priceLabels[_priceFilter]!, () => setState(() => _priceFilter = 'todos'));
    if (_day != 'todos') addChip(_dayLabels[_day]!, () => setState(() => _day = 'todos'));
    if (_dias != 'todos') addChip(_diasLabels[_dias]!, () => setState(() => _dias = 'todos'));
    return chips;
  }

  Widget _filterChip(String label, VoidCallback onClear) {
    return Container(
      padding: const EdgeInsets.only(left: 12, right: 6, top: 6, bottom: 6),
      decoration: BoxDecoration(
        color: PickmapColors.coral.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: PickmapColors.coral.withValues(alpha: 0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label, style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: PickmapColors.coral)),
          const SizedBox(width: 4),
          GestureDetector(
            onTap: onClear,
            child: const Icon(Icons.close_rounded, size: 14, color: PickmapColors.coral),
          ),
        ],
      ),
    );
  }

  Widget _rowSection(String title, List<PanoramaItem> items, VoidCallback onSeeAll) {
    if (items.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: PickmapColors.navy)),
            TextButton(
              onPressed: onSeeAll,
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('Ver todo'),
                  SizedBox(width: 2),
                  Icon(Icons.arrow_forward_rounded, size: 16),
                ],
              ),
            ),
          ],
        ),
        SizedBox(
          // 186, no 182: un widget test con la fuente de prueba de Flutter
          // (no la Nunito Sans/Fredoka real) detectó un overflow real de
          // 0.667px acá — el margen extra lo evita sin cambiar el look en
          // producción (mismo criterio que otros ajustes por-pixel del
          // repo: nunca ignorar un overflow real solo porque es chico).
          height: 186,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: items.length,
            separatorBuilder: (context, i) => const SizedBox(width: 10),
            itemBuilder: (context, i) {
              final favorites = context.watch<FavoritesController>();
              final item = items[i];
              return SizedBox(
                width: 112,
                child: PanoramaCard(
                  item: item,
                  onTap: () => showPanoramaDetail(context, item),
                  compact: true,
                  favorited: favorites.isFavorited(item.id),
                  onFavoriteToggle: () => favorites.toggle(item.id),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _exploreSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            _tabButton('Recomendado para ti', _tab == _ExploreTab.recomendado, () => setState(() => _tab = _ExploreTab.recomendado)),
            const SizedBox(width: 8),
            _tabButton('General', _tab == _ExploreTab.general, () => setState(() => _tab = _ExploreTab.general)),
          ],
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          children: [
            _pillButton('Todos', _pill == _PillFilter.todos, () => setState(() => _pill = _PillFilter.todos)),
            _pillButton('Simples', _pill == _PillFilter.simple, () => setState(() => _pill = _PillFilter.simple)),
            _pillButton('Paquetes', _pill == _PillFilter.paquete, () => setState(() => _pill = _PillFilter.paquete)),
          ],
        ),
        const SizedBox(height: 14),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _exploreList.length,
          gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
            maxCrossAxisExtent: 130,
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 0.60,
          ),
          itemBuilder: (context, i) {
            final favorites = context.watch<FavoritesController>();
            final item = _exploreList[i];
            return PanoramaCard(
              item: item,
              onTap: () => showPanoramaDetail(context, item),
              compact: true,
              favorited: favorites.isFavorited(item.id),
              onFavoriteToggle: () => favorites.toggle(item.id),
            );
          },
        ),
      ],
    );
  }

  Widget _tabButton(String label, bool active, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: active ? PickmapColors.navy : Colors.white,
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(label, style: TextStyle(color: active ? Colors.white : PickmapColors.navy, fontWeight: FontWeight.w700, fontSize: 13)),
      ),
    );
  }

  Widget _pillButton(String label, bool active, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: active ? PickmapColors.coral.withValues(alpha: 0.14) : Colors.transparent,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: active ? PickmapColors.coral : PickmapColors.mist.withValues(alpha: 0.6)),
        ),
        child: Text(label, style: TextStyle(color: active ? PickmapColors.coral : PickmapColors.slate, fontWeight: FontWeight.w600, fontSize: 12.5)),
      ),
    );
  }
}

/// Hoja modal con las 6 categorías de filtro de `panoramas.html` — se edita
/// en un estado local ("borrador") y solo se aplica al tocar "Aplicar
/// filtros", igual que el patrón estándar de filtros en apps de reservas
/// (Airbnb/Booking): el usuario puede tocar varias opciones sin que la
/// grilla de atrás salte con cada tap individual.
class _FiltersSheet extends StatefulWidget {
  const _FiltersSheet({
    required this.sort,
    required this.category,
    required this.distance,
    required this.price,
    required this.day,
    required this.dias,
    required this.categories,
    required this.onApply,
  });

  final String sort;
  final String category;
  final String distance;
  final String price;
  final String day;
  final String dias;
  final List<String> categories;
  final void Function(String sort, String category, String distance, String price, String day, String dias) onApply;

  @override
  State<_FiltersSheet> createState() => _FiltersSheetState();
}

class _FiltersSheetState extends State<_FiltersSheet> {
  late String _sort = widget.sort;
  late String _category = widget.category;
  late String _distance = widget.distance;
  late String _price = widget.price;
  late String _day = widget.day;
  late String _dias = widget.dias;

  void _clearAll() {
    setState(() {
      _sort = 'recomendado';
      _category = 'todas';
      _distance = 'todas';
      _price = 'todos';
      _day = 'todos';
      _dias = 'todos';
    });
  }

  void _apply() {
    widget.onApply(_sort, _category, _distance, _price, _day, _dias);
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.82,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      expand: false,
      builder: (context, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 12, 8),
                child: Row(
                  children: [
                    const Expanded(
                      child: Text('Filtrar y ordenar', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: PickmapColors.navy)),
                    ),
                    IconButton(
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const Icon(Icons.close_rounded, color: PickmapColors.slate),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                  children: [
                    _section('↕️ Ordenar por', _sortLabels, _sort, (v) => setState(() => _sort = v)),
                    _section(
                      '🏷️ Tipo de experiencia',
                      {'todas': 'Cualquiera', for (final c in widget.categories) c: categoryLabels[c] ?? c},
                      _category,
                      (v) => setState(() => _category = v),
                    ),
                    _section('📍 Distancia', _distanceLabels, _distance, (v) => setState(() => _distance = v)),
                    _section('💰 Precio', _priceLabels, _price, (v) => setState(() => _price = v)),
                    _section('📅 Cuándo', _dayLabels, _day, (v) => setState(() => _day = v)),
                    _section('🧳 Duración del paquete', _diasLabels, _dias, (v) => setState(() => _dias = v)),
                  ],
                ),
              ),
              DecoratedBox(
                decoration: BoxDecoration(border: Border(top: BorderSide(color: PickmapColors.mist.withValues(alpha: 0.3)))),
                child: SafeArea(
                  top: false,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 14, 20, 14),
                    child: Row(
                      children: [
                        TextButton(onPressed: _clearAll, child: const Text('Limpiar todo')),
                        const SizedBox(width: 12),
                        Expanded(child: PmPrimaryButton(label: 'Aplicar filtros', onPressed: _apply)),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _section(String label, Map<String, String> options, String value, ValueChanged<String> onSelect) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontWeight: FontWeight.w700, color: PickmapColors.navy, fontSize: 13.5)),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: options.entries.map((e) {
              final active = e.key == value;
              return GestureDetector(
                onTap: () => onSelect(e.key),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                  decoration: BoxDecoration(
                    color: active ? PickmapColors.coral : PickmapColors.bg,
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: active ? PickmapColors.coral : PickmapColors.mist.withValues(alpha: 0.6)),
                  ),
                  child: Text(
                    e.value,
                    style: TextStyle(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w600,
                      color: active ? Colors.white : PickmapColors.navy,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

/// Banner superior tipo "bosque" (degradado verde + montañas + siluetas de
/// árboles) — reemplaza el encabezado plano sobre fondo crema, pensado
/// para que Panoramas (la pantalla más visitada) se sienta con más
/// identidad propia, en la línea del `.skyline` ilustrado del sitio web.
/// Las montañas son el mismo recurso que `.mountains--back`/`--front` de
/// `css/styles.css` (silueta dentada en capas, cada una más oscura y más
/// baja que la anterior) pero implementado con `CustomPaint` en vez de
/// `clip-path` (Flutter no tiene equivalente directo) y a escala mucho
/// más chica, a pedido explícito del usuario — los árboles siguen siendo
/// el elemento en primer plano, las montañas quedan detrás como telón de
/// fondo. Ninguno de los dos depende de ninguna imagen/asset.
class _ForestBanner extends StatelessWidget {
  const _ForestBanner();

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: const BorderRadius.vertical(bottom: Radius.circular(28)),
      child: Container(
        width: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF3E7A57), Color(0xFF2A5A3E)],
          ),
        ),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            const Positioned(bottom: 0, left: 0, right: 0, child: _MountainRange(height: 92)),
            const Positioned(bottom: -14, left: -14, child: _Tree(size: 56, tone: 0)),
            const Positioned(bottom: -22, left: 30, child: _Tree(size: 76, tone: 1)),
            const Positioned(bottom: -8, left: 94, child: _Tree(size: 42, tone: 0)),
            const Positioned(bottom: -20, right: 66, child: _Tree(size: 62, tone: 1)),
            const Positioned(bottom: -6, right: 22, child: _Tree(size: 40, tone: 0)),
            const Positioned(bottom: -24, right: -16, child: _Tree(size: 72, tone: 1)),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 18, 16, 42),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('🤖 Darwin · tu IA de panoramas',
                      style: TextStyle(color: PickmapColors.sun, fontWeight: FontWeight.w700, fontSize: 13)),
                  const SizedBox(height: 6),
                  const Text(
                    'Darwin armó estos planes especialmente para ti',
                    style: TextStyle(color: Colors.white, fontSize: 21, fontWeight: FontWeight.w700, height: 1.25),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Tree extends StatelessWidget {
  const _Tree({required this.size, required this.tone});

  final double size;
  /// Alterna 2 tonos de verde en el follaje para dar sensación de
  /// profundidad entre árboles (no es más que eso — no representa nada).
  final int tone;

  @override
  Widget build(BuildContext context) {
    final canopy = tone == 0 ? const Color(0xFF6FA97C) : const Color(0xFF4F8F62);
    return SizedBox(
      width: size,
      height: size * 1.15,
      child: Stack(
        alignment: Alignment.bottomCenter,
        children: [
          Container(width: size * 0.16, height: size * 0.4, color: const Color(0xFF4A3323)),
          Positioned(
            bottom: size * 0.22,
            child: Container(
              width: size,
              height: size,
              decoration: BoxDecoration(color: canopy, shape: BoxShape.circle),
            ),
          ),
        ],
      ),
    );
  }
}

/// Cordillera caricaturizada de fondo, a pedido explícito del usuario tras
/// ver este mismo banner ("¿pueden ser montañas caricaturizadas? igual que
/// en la web, pero más pequeño") — mismo recurso visual que
/// `.mountains--back`/`.mountains--front` del sitio (silueta dentada en 2
/// capas, cada una más oscura/opaca y más baja que la anterior, dando
/// sensación de profundidad) pero pintado con `CustomPainter` en vez de
/// `clip-path` (sin equivalente directo en Flutter) y a una escala mucho
/// más chica, ya que acá es solo un detalle de fondo detrás de los
/// árboles, no el elemento protagonista como en el skyline de la web.
class _MountainRange extends StatelessWidget {
  const _MountainRange({required this.height});

  final double height;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: height,
      child: CustomPaint(painter: _MountainPainter(), size: Size.infinite),
    );
  }
}

class _MountainPainter extends CustomPainter {
  Path _peaks(Size size, List<List<double>> fractions) {
    final path = Path()..moveTo(0, size.height);
    for (final f in fractions) {
      path.lineTo(f[0] * size.width, f[1] * size.height);
    }
    path.lineTo(size.width, size.height);
    path.close();
    return path;
  }

  @override
  void paint(Canvas canvas, Size size) {
    // Capa de atrás: más alta, más translúcida, tono azulado-verde para
    // leerse "más lejos" (mismo truco de perspectiva de color que un
    // paisaje ilustrado real).
    final back = _peaks(size, const [
      [0.0, 0.72],
      [0.11, 0.28],
      [0.23, 0.60],
      [0.35, 0.14],
      [0.49, 0.52],
      [0.63, 0.22],
      [0.77, 0.58],
      [0.90, 0.32],
      [1.0, 0.55],
    ]);
    canvas.drawPath(back, Paint()..color = const Color(0xFF9FCBAE).withValues(alpha: 0.55));

    // Capa de adelante: más baja, más sólida — hace de base justo antes
    // de que empiecen los árboles.
    final front = _peaks(size, const [
      [0.0, 0.92],
      [0.15, 0.42],
      [0.29, 0.78],
      [0.43, 0.34],
      [0.57, 0.74],
      [0.71, 0.38],
      [0.85, 0.76],
      [1.0, 0.48],
    ]);
    canvas.drawPath(front, Paint()..color = const Color(0xFF234639).withValues(alpha: 0.9));
  }

  @override
  bool shouldRepaint(covariant _MountainPainter oldDelegate) => false;
}
