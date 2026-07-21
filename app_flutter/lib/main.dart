import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'core/router/app_router.dart';
import 'core/supabase/supabase_bootstrap.dart';
import 'core/theme/pickmap_theme.dart';
import 'features/auth/data/auth_controller.dart';
import 'features/auth/data/auth_repository.dart';
import 'features/favoritos/data/favorites_controller.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await bootstrapSupabase();
  runApp(const PickmapApp());
}

class PickmapApp extends StatefulWidget {
  const PickmapApp({super.key});

  @override
  State<PickmapApp> createState() => _PickmapAppState();
}

class _PickmapAppState extends State<PickmapApp> {
  late final AuthController _auth;
  late final FavoritesController _favorites;
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    _auth = AuthController(AuthRepository(supabase));
    _favorites = FavoritesController();
    // `buildRouter` se crea UNA sola vez con `refreshListenable: _auth` —
    // GoRouter ya se re-evalúa solo cuando _auth notifica, no hace falta
    // (ni conviene) reconstruirlo en cada rebuild del árbol.
    _router = buildRouter(_auth);
  }

  @override
  void dispose() {
    _auth.dispose();
    _favorites.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<AuthController>.value(value: _auth),
        ChangeNotifierProvider<FavoritesController>.value(value: _favorites),
      ],
      child: MaterialApp.router(
        title: 'PickMap',
        debugShowCheckedModeBanner: false,
        theme: PickmapTheme.light(),
        routerConfig: _router,
      ),
    );
  }
}
