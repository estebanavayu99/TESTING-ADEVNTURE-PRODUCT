import 'package:flutter/material.dart';

import '../theme/pickmap_colors.dart';

/// Wordmark "Pick**Map**" — mismo tratamiento que `.logo` en el sitio
/// (`Pick` en navy, `Map` en coral) + el ícono de `assets/logo.png`.
class PmLogo extends StatelessWidget {
  const PmLogo({super.key, this.size = 28, this.textSize = 20});

  final double size;
  final double textSize;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Image.asset('assets/images/logo.png', width: size, height: size),
        const SizedBox(width: 8),
        RichText(
          text: TextSpan(
            style: TextStyle(
              fontFamily: Theme.of(context).textTheme.titleLarge?.fontFamily,
              fontSize: textSize,
              fontWeight: FontWeight.w600,
              color: PickmapColors.navy,
            ),
            children: const [
              TextSpan(text: 'Pick'),
              TextSpan(text: 'Map', style: TextStyle(color: PickmapColors.coral)),
            ],
          ),
        ),
      ],
    );
  }
}
