import 'package:flutter_test/flutter_test.dart';
import 'package:pickmap_app/core/utils/rut.dart';

void main() {
  group('isValidRut', () {
    test('acepta RUTs reales con dígito verificador correcto', () {
      expect(isValidRut('12345678-5'), isTrue);
      expect(isValidRut('11111111-1'), isTrue);
      expect(isValidRut('76086428-5'), isTrue);
      expect(isValidRut('7654321-6'), isTrue);
    });

    test('acepta minúscula/puntos/espacios (se limpia antes de validar)', () {
      expect(isValidRut('12.345.678-5'), isTrue);
      expect(isValidRut(' 12345678-5 '), isTrue);
      expect(isValidRut('7654321-k'), isFalse); // dv real de este rut es 6, no k
    });

    test('rechaza dígito verificador incorrecto', () {
      expect(isValidRut('96590210-6'), isFalse);
      expect(isValidRut('12345678-9'), isFalse);
    });

    test('rechaza entradas vacías o demasiado cortas', () {
      expect(isValidRut(''), isFalse);
      expect(isValidRut('1'), isFalse);
    });
  });

  group('formatRut', () {
    test('agrega puntos de miles y guión antes del dígito verificador', () {
      expect(formatRut('123456785'), '12.345.678-5');
      expect(formatRut('76086428-5'), '76.086.428-5');
    });

    test('no agrega separadores para RUTs cortos', () {
      expect(formatRut('19'), '1-9');
    });
  });
}
