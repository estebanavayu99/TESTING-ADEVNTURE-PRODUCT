import 'package:flutter/material.dart';

import '../theme/pickmap_colors.dart';

/// Placeholder "shimmer" (barrido de brillo diagonal) para fotos en
/// carga — reemplaza el rectángulo gris plano, misma técnica que usan la
/// mayoría de apps con listas de imágenes (Airbnb, LinkedIn, etc.) para
/// que la carga se sienta activa en vez de "rota".
class PmShimmer extends StatefulWidget {
  const PmShimmer({super.key});

  @override
  State<PmShimmer> createState() => _PmShimmerState();
}

class _PmShimmerState extends State<PmShimmer> with SingleTickerProviderStateMixin {
  late final AnimationController _controller =
      AnimationController(vsync: this, duration: const Duration(milliseconds: 1400))..repeat();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final base = PickmapColors.mist.withValues(alpha: 0.22);
    final highlight = PickmapColors.mist.withValues(alpha: 0.4);
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        return ShaderMask(
          blendMode: BlendMode.srcATop,
          shaderCallback: (rect) {
            final t = _controller.value;
            return LinearGradient(
              begin: Alignment(-1 - t * 2, 0),
              end: Alignment(1 - t * 2, 0),
              colors: [base, highlight, base],
              stops: const [0.35, 0.5, 0.65],
            ).createShader(rect);
          },
          child: Container(color: base),
        );
      },
    );
  }
}
