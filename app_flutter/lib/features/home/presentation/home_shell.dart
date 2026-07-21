import 'package:flutter/material.dart';

import '../../../core/widgets/pm_logo.dart';
import '../../dashboard/presentation/dashboard_page.dart';
import '../../favoritos/presentation/favoritos_page.dart';
import '../../invita/presentation/invita_page.dart';
import '../../panoramas/presentation/panoramas_page.dart';
import '../../pickpoints/presentation/pickpoints_page.dart';

/// Shell con navegación inferior — mismo orden que `.nav__links` en las
/// páginas logueadas del sitio: Panoramas, Favoritos, Pick Points,
/// Invita a un amig@, Mi cuenta.
class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  static const _pages = [
    PanoramasPage(),
    FavoritosPage(),
    PickpointsPage(),
    InvitaPage(),
    DashboardPage(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const PmLogo(size: 26, textSize: 18),
        centerTitle: false,
      ),
      body: IndexedStack(index: _index, children: _pages),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _index,
        onTap: (i) => setState(() => _index = i),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.map_outlined), activeIcon: Icon(Icons.map), label: 'Panoramas'),
          BottomNavigationBarItem(icon: Icon(Icons.favorite_border), activeIcon: Icon(Icons.favorite), label: 'Favoritos'),
          BottomNavigationBarItem(icon: Icon(Icons.star_border), activeIcon: Icon(Icons.star), label: 'Pick Points'),
          BottomNavigationBarItem(icon: Icon(Icons.group_add_outlined), activeIcon: Icon(Icons.group_add), label: 'Invita'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline), activeIcon: Icon(Icons.person), label: 'Mi cuenta'),
        ],
      ),
    );
  }
}
