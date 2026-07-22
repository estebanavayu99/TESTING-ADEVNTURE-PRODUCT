import 'package:flutter/material.dart';

import '../../../core/widgets/pm_bottom_nav.dart';
import '../../dashboard/presentation/dashboard_page.dart';
import '../../favoritos/presentation/favoritos_page.dart';
import '../../invita/presentation/invita_page.dart';
import '../../panoramas/presentation/panoramas_page.dart';
import '../../pickpoints/presentation/pickpoints_page.dart';

/// Shell con navegación inferior — mismo orden que `.nav__links` en las
/// páginas logueadas del sitio: Panoramas, Favoritos, Pick Points,
/// Invita a un amig@, Mi cuenta. Sin AppBar propio: cada página ya trae
/// su propio encabezado (eyebrow + título), así el contenido arranca
/// directo desde arriba — patrón más cercano a apps nativas modernas que
/// duplicar el logo en una barra superior separada.
class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> with SingleTickerProviderStateMixin {
  int _index = 0;

  // Fade suave al cambiar de tab — se anima por encima del mismo
  // `IndexedStack` (nunca se recrea), así que el estado de cada página
  // (ej. los controllers de Mi Cuenta) sigue intacto; solo cambia la
  // opacidad, no el árbol de widgets.
  late final AnimationController _fade = AnimationController(vsync: this, duration: const Duration(milliseconds: 200), value: 1);

  void _onTap(int i) {
    if (i == _index) return;
    setState(() => _index = i);
    _fade
      ..value = 0
      ..forward();
  }

  @override
  void dispose() {
    _fade.dispose();
    super.dispose();
  }

  static const _pages = [
    PanoramasPage(),
    FavoritosPage(),
    PickpointsPage(),
    InvitaPage(),
    DashboardPage(),
  ];

  // Etiquetas abreviadas respecto al `.nav__links` del sitio (Panoramas /
  // Favoritos / Pick Points / Invita a un amig@ / Mi cuenta) — a 5 tabs en
  // ~390px de ancho el texto completo se corta; se prioriza una palabra
  // corta por tab (patrón estándar de bottom nav nativo), el título
  // completo de cada sección sigue viviendo en el encabezado de su propia
  // página.
  static const _items = [
    PmNavItem(Icons.map_outlined, Icons.map, 'Explorar'),
    PmNavItem(Icons.favorite_border, Icons.favorite, 'Favoritos'),
    PmNavItem(Icons.star_border, Icons.star, 'Points'),
    PmNavItem(Icons.group_add_outlined, Icons.group_add, 'Invita'),
    PmNavItem(Icons.person_outline, Icons.person, 'Cuenta'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: FadeTransition(
        opacity: CurvedAnimation(parent: _fade, curve: Curves.easeOut),
        child: IndexedStack(index: _index, children: _pages),
      ),
      bottomNavigationBar: PmBottomNav(
        items: _items,
        currentIndex: _index,
        onTap: _onTap,
      ),
    );
  }
}
