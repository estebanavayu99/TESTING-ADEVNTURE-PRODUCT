import 'package:flutter/material.dart';

/// Entrada suave (fade + leve deslizamiento hacia arriba) para que las
/// tarjetas de una pantalla no aparezcan todas de golpe al abrirla — un
/// `delay` opcional permite escalonarlas (efecto cascada) cuando se listan
/// varias seguidas, patrón común en apps pulidas para que la carga se
/// sienta más "fluida" en vez de un salto brusco de contenido.
class PmFadeIn extends StatefulWidget {
  const PmFadeIn({super.key, required this.child, this.delay = Duration.zero});

  final Widget child;
  final Duration delay;

  @override
  State<PmFadeIn> createState() => _PmFadeInState();
}

class _PmFadeInState extends State<PmFadeIn> with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 380));
  late final Animation<double> _fade = CurvedAnimation(parent: _controller, curve: Curves.easeOut);
  late final Animation<Offset> _slide = Tween(begin: const Offset(0, 0.05), end: Offset.zero).animate(_fade);

  @override
  void initState() {
    super.initState();
    Future.delayed(widget.delay, () {
      if (mounted) _controller.forward();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _fade,
      child: SlideTransition(position: _slide, child: widget.child),
    );
  }
}
