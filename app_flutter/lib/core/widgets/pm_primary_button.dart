import 'package:flutter/material.dart';

/// Botón primario con estado de carga incorporado — evita repetir el
/// mismo `if (loading) CircularProgressIndicator else Text(...)` en cada
/// formulario (signup, login, onboarding, reseñas, etc.).
class PmPrimaryButton extends StatelessWidget {
  const PmPrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.loading = false,
    this.expand = true,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool loading;
  final bool expand;

  @override
  Widget build(BuildContext context) {
    final button = ElevatedButton(
      onPressed: loading ? null : onPressed,
      child: loading
          ? const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white),
            )
          : Text(label),
    );
    return expand ? SizedBox(width: double.infinity, child: button) : button;
  }
}
