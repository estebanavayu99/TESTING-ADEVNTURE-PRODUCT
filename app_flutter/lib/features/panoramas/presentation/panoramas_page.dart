import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/pickmap_colors.dart';
import '../../favoritos/data/favorites_controller.dart';
import '../data/panorama_item.dart';
import '../data/sample_catalog.dart' as catalog;
import 'panorama_card.dart';
import 'panorama_detail_sheet.dart';

enum _ExploreTab { recomendado, general }

enum _PillFilter { todos, simple, paquete }

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
  String _priceFilter = 'todos';
  String _sort = 'recomendado';

  List<PanoramaItem> get _personalized => [
        ...catalog.recomendados,
        ...catalog.combos,
        ...catalog.simples,
      ];

  List<PanoramaItem> get _exploreList {
    List<PanoramaItem> base;
    if (_pill == _PillFilter.todos) {
      base = catalog.todoElCatalogo;
    } else {
      base = _tab == _ExploreTab.recomendado ? _personalized : catalog.todoElCatalogo;
      final kind = _pill == _PillFilter.simple ? PanoramaKind.simple : PanoramaKind.paquete;
      base = base.where((i) => i.kind == kind).toList();
    }
    if (_priceFilter != 'todos') {
      base = base.where((i) {
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
    // dedupe por id (mismo criterio que "Todos" en js/panoramas.js)
    final seen = <String>{};
    final deduped = base.where((i) => seen.add(i.id)).toList();
    switch (_sort) {
      case 'price_asc':
        deduped.sort((a, b) => a.priceClp.compareTo(b.priceClp));
      case 'price_desc':
        deduped.sort((a, b) => b.priceClp.compareTo(a.priceClp));
      default:
        break; // 'recomendado': se respeta el orden del catálogo
    }
    return deduped;
  }

  @override
  Widget build(BuildContext context) {
    final rowPaquete = _personalized.where((i) => i.kind == PanoramaKind.paquete).take(6).toList();
    final rowSimple = _personalized.where((i) => i.kind == PanoramaKind.simple).take(6).toList();

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

  Widget _toolbar() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('🔍 Filtrar y ordenar', style: TextStyle(fontWeight: FontWeight.w700, color: PickmapColors.navy)),
          const SizedBox(height: 10),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _dropdown('↕️ Ordenar', _sort, const {
                'recomendado': 'Recomendado para ti',
                'price_asc': 'Precio: menor a mayor',
                'price_desc': 'Precio: mayor a menor',
              }, (v) => setState(() => _sort = v)),
              _dropdown('💰 Precio', _priceFilter, const {
                'todos': 'Cualquier precio',
                'bajo': 'Hasta \$15.000',
                'medio': '\$15.000 - \$30.000',
                'alto': 'Más de \$30.000',
              }, (v) => setState(() => _priceFilter = v)),
              TextButton(
                onPressed: () => setState(() {
                  _priceFilter = 'todos';
                  _sort = 'recomendado';
                  _pill = _PillFilter.todos;
                  _tab = _ExploreTab.recomendado;
                }),
                child: const Text('✕ Limpiar filtros'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _dropdown(String label, String value, Map<String, String> options, ValueChanged<String> onChanged) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10),
      decoration: BoxDecoration(
        color: PickmapColors.bg,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: PickmapColors.mist.withValues(alpha: 0.5)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          isDense: true,
          icon: const Icon(Icons.expand_more, size: 18),
          items: options.entries
              .map((e) => DropdownMenuItem(value: e.key, child: Text('$label: ${e.value}', style: const TextStyle(fontSize: 12.5))))
              .toList(),
          onChanged: (v) {
            if (v != null) onChanged(v);
          },
        ),
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
          height: 182,
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

/// Banner superior tipo "bosque" (degradado verde + silueta de árboles) —
/// reemplaza el encabezado plano sobre fondo crema, pensado para que
/// Panoramas (la pantalla más visitada) se sienta con más identidad
/// propia, en la línea del `.skyline` ilustrado del sitio web. Los
/// árboles son formas simples (círculo + tronco), sin depender de
/// ninguna imagen/asset.
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
