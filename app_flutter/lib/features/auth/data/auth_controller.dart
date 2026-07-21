import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'auth_repository.dart';
import 'traveler_profile.dart';

enum AuthStatus { loading, signedOut, signedIn }

/// Estado global de sesión + perfil de viajero, expuesto como
/// [ChangeNotifier] para que `go_router` pueda redirigir según
/// `status`/`profile.onboarded` (mismo rol que el chequeo de
/// `pickmap_current_user` al principio de cada página protegida en el
/// sitio web).
class AuthController extends ChangeNotifier {
  AuthController(this._repo) {
    _sub = _repo.onAuthStateChange.listen(_onAuthStateChange);
    _bootstrap();
  }

  final AuthRepository _repo;
  late final StreamSubscription<AuthState> _sub;

  AuthStatus status = AuthStatus.loading;
  TravelerProfile? profile;
  String? lastError;

  AuthRepository get repo => _repo;
  User? get user => _repo.currentUser;

  Future<void> _bootstrap() async {
    final session = _repo.currentSession;
    if (session == null) {
      status = AuthStatus.signedOut;
      notifyListeners();
      return;
    }
    await _loadProfile();
  }

  Future<void> _onAuthStateChange(AuthState state) async {
    if (state.session == null) {
      status = AuthStatus.signedOut;
      profile = null;
      notifyListeners();
      return;
    }
    await _loadProfile();
  }

  Future<void> _loadProfile() async {
    try {
      profile = await _repo.getProfile(_repo.currentUser!.id);
      status = AuthStatus.signedIn;
    } catch (e) {
      lastError = e.toString();
      status = AuthStatus.signedIn;
    }
    notifyListeners();
  }

  Future<void> refreshProfile() => _loadProfile();

  Future<void> signOut() => _repo.signOut();

  @override
  void dispose() {
    _sub.cancel();
    super.dispose();
  }
}
