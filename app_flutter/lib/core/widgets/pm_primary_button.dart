import 'package:flutter/material.dart';

/// Botón primario con estado de carga incorporado — evita repetir el
/// mismo `if (loading) CircularProgressIndicator else Text(...)` en cada
/// formulario (signup, login, onboarding, reseñas, etc.). Incluye un
/// leve "press-scale" táctil (se achica un poco al mantener presionado)
/// para que se sienta más responsivo que el estado plano de Material.
class PmPrimaryButton extends StatefulWidget {
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
  State<PmPrimaryButton> createState() => _PmPrimaryButtonState();
}

class _PmPrimaryButtonState extends State<PmPrimaryButton> {
  bool _pressed = false;

  void _setPressed(bool value) {
    if (widget.onPressed == null || widget.loading) return;
    setState(() => _pressed = value);
  }

  @override
  Widget build(BuildContext context) {
    final button = ElevatedButton(
      onPressed: widget.loading ? null : widget.onPressed,
      child: widget.loading
          ? const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white),
            )
          : Text(widget.label),
    );
    // `Listener` (no `GestureDetector`) a propósito: solo observa punteros
    // sin competir en el gesture arena, así el `onPressed` real del botón
    // sigue disparando normal — un GestureDetector con callbacks de tap
    // acá arriba podría ganarle el tap al botón interno.
    final scaled = Listener(
      onPointerDown: (_) => _setPressed(true),
      onPointerUp: (_) => _setPressed(false),
      onPointerCancel: (_) => _setPressed(false),
      child: AnimatedScale(
        scale: _pressed ? 0.97 : 1,
        duration: const Duration(milliseconds: 100),
        child: button,
      ),
    );
    return widget.expand ? SizedBox(width: double.infinity, child: scaled) : scaled;
  }
}
