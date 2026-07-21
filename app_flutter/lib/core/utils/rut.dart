/// Mismo algoritmo que `cleanRut`/`formatRut`/`isValidRut` en `js/auth.js`
/// (sitio web) — portado literal para que el signup de la app valide el
/// RUT con dígito verificador real antes de crear la cuenta, en vez de
/// aceptar cualquier texto.
String cleanRut(String v) => v.replaceAll(RegExp(r'[^0-9kK]'), '').toUpperCase();

String formatRut(String v) {
  final clean = cleanRut(v);
  if (clean.length <= 1) return clean;
  final body = clean.substring(0, clean.length - 1);
  final dv = clean.substring(clean.length - 1);
  final buffer = StringBuffer();
  for (var i = 0; i < body.length; i++) {
    final posFromEnd = body.length - i;
    buffer.write(body[i]);
    if (posFromEnd > 1 && (posFromEnd - 1) % 3 == 0) buffer.write('.');
  }
  return '$buffer-$dv';
}

bool isValidRut(String v) {
  final clean = cleanRut(v);
  if (clean.length < 2) return false;
  final body = clean.substring(0, clean.length - 1);
  final dv = clean.substring(clean.length - 1);
  if (!RegExp(r'^\d+$').hasMatch(body)) return false;
  var sum = 0;
  var mul = 2;
  for (var i = body.length - 1; i >= 0; i--) {
    sum += int.parse(body[i]) * mul;
    mul = mul == 7 ? 2 : mul + 1;
  }
  final res = 11 - (sum % 11);
  final expectedDv = res == 11 ? '0' : (res == 10 ? 'K' : res.toString());
  return dv == expectedDv;
}
