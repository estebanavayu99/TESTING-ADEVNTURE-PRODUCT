/// Mirror de la tabla `profiles` (supabase/schema.sql) — datos de viajero.
class TravelerProfile {
  final String userId;
  final String? firstName;
  final String? lastName;
  final String? rut;
  final String? phone;
  final int? age;
  final String? city;
  final List<String> company;
  final List<String> tastes;
  final List<String> difficulty;
  final List<String> budget;
  final List<String> travelDistance;
  final List<String> preferredDay;
  final bool onboarded;

  const TravelerProfile({
    required this.userId,
    this.firstName,
    this.lastName,
    this.rut,
    this.phone,
    this.age,
    this.city,
    this.company = const [],
    this.tastes = const [],
    this.difficulty = const [],
    this.budget = const [],
    this.travelDistance = const [],
    this.preferredDay = const [],
    this.onboarded = false,
  });

  /// Igual criterio que `js/dashboard.js`: el saludo solo usa el primer
  /// nombre, nunca el string completo.
  String get greetingFirstName {
    final n = (firstName ?? '').trim();
    if (n.isEmpty) return 'viajero';
    return n.split(RegExp(r'\s+')).first;
  }

  factory TravelerProfile.fromMap(Map<String, dynamic> map) {
    List<String> asStringList(dynamic v) =>
        (v as List?)?.map((e) => e.toString()).toList() ?? const [];
    return TravelerProfile(
      userId: map['user_id'] as String,
      firstName: map['first_name'] as String?,
      lastName: map['last_name'] as String?,
      rut: map['rut'] as String?,
      phone: map['phone'] as String?,
      age: map['age'] as int?,
      city: map['city'] as String?,
      company: asStringList(map['company']),
      tastes: asStringList(map['tastes']),
      difficulty: asStringList(map['difficulty']),
      budget: asStringList(map['budget']),
      travelDistance: asStringList(map['travel_distance']),
      preferredDay: asStringList(map['preferred_day']),
      onboarded: map['onboarded'] as bool? ?? false,
    );
  }
}
