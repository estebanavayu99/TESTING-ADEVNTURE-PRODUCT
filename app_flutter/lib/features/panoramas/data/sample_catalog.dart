import 'panorama_item.dart';

/// Muestra local de catálogo para esta primera etapa de diseño (ver nota
/// en panorama_item.dart) — textos/razones tomados literalmente de
/// `TASTE_POOL`/`DEFAULT_POOL` en `js/panoramas.js` para mantener
/// consistencia de copy con el sitio web mientras no hay conexión a la
/// tabla `businesses` real.
final List<PanoramaItem> recomendados = [
  const PanoramaItem(
    id: 'canopy-cajon',
    icon: '🌲',
    title: 'Canopy en el Cajón del Maipo',
    meta: 'A 40 min · Medio día',
    kind: PanoramaKind.simple,
    priceClp: 28000,
    photo: 'https://images.unsplash.com/photo-1533230408708-8f9f91d1235a?w=500&h=380&fit=crop&q=60&auto=format',
    category: 'naturaleza',
    reason: 'Tu perfil muestra una afinidad sostenida por experiencias al aire libre y de aventura.',
  ),
  const PanoramaItem(
    id: 'tour-vinos',
    icon: '🍷',
    title: 'Tour de vinos + almuerzo maridado',
    meta: 'Paquete de un día',
    kind: PanoramaKind.paquete,
    priceClp: 52000,
    photo: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=500&h=380&fit=crop&q=60&auto=format',
    category: 'gastronomia',
    reason: 'Combinas tu interés por la gastronomía con una alta disposición a probar experiencias nuevas.',
  ),
  const PanoramaItem(
    id: 'termas-noche',
    icon: '♨️',
    title: 'Termas + alojamiento una noche',
    meta: 'Paquete de 2 días',
    kind: PanoramaKind.paquete,
    priceClp: 84000,
    photo: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=500&h=380&fit=crop&q=60&auto=format',
    category: 'relax',
    reason: 'Necesitas desconexión total, sin decisiones logísticas de por medio.',
  ),
  const PanoramaItem(
    id: 'mirador-atardecer',
    icon: '📸',
    title: 'Mirador y spots instagrameables',
    meta: 'A 30 min · Atardecer',
    kind: PanoramaKind.simple,
    priceClp: 15000,
    photo: 'https://images.unsplash.com/photo-1490682143684-14369e18dce8?w=500&h=380&fit=crop&q=60&auto=format',
    category: 'fotografia',
    reason: 'Valoras el componente visual y fotográfico de la experiencia tanto como la actividad en sí.',
  ),
];

final List<PanoramaItem> combos = [
  const PanoramaItem(
    id: 'trekking-cabana',
    icon: '🛖',
    title: 'Trekking + cabaña con tinaja',
    meta: 'Paquete de 2 días',
    kind: PanoramaKind.paquete,
    priceClp: 96000,
    photo: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=500&h=380&fit=crop&q=60&auto=format',
    category: 'naturaleza',
    reason: 'Buscas desconexión en entornos naturales, sin la carga de organizar cada detalle del viaje.',
  ),
  const PanoramaItem(
    id: 'ski-equipo',
    icon: '🎿',
    title: 'Ski + arriendo de equipo + almuerzo',
    meta: 'Paquete de un día',
    kind: PanoramaKind.paquete,
    priceClp: 68000,
    photo: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500&h=380&fit=crop&q=60&auto=format',
    category: 'nieve',
    reason: 'Te inclinas por la nieve, pero prefieres que la logística esté resuelta de antemano.',
  ),
  const PanoramaItem(
    id: 'museo-almuerzo',
    icon: '🖼️',
    title: 'Museo + almuerzo con guía',
    meta: 'Paquete de un día',
    kind: PanoramaKind.paquete,
    priceClp: 39000,
    photo: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=500&h=380&fit=crop&q=60&auto=format',
    category: 'cultura',
    reason: 'Buscas experiencias que combinen aprendizaje con desplazamiento, no solo contemplación pasiva.',
  ),
];

final List<PanoramaItem> simples = [
  const PanoramaItem(
    id: 'sendero-mirador',
    icon: '🥾',
    title: 'Sendero + mirador al atardecer',
    meta: 'A 50 min · Medio día',
    kind: PanoramaKind.simple,
    priceClp: 12000,
    photo: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=500&h=380&fit=crop&q=60&auto=format',
    category: 'naturaleza',
    reason: 'Tu perfil muestra una afinidad sostenida por experiencias al aire libre y de aventura.',
  ),
  const PanoramaItem(
    id: 'spa-masajes',
    icon: '🧖',
    title: 'Tarde de spa y masajes',
    meta: 'A 20 min',
    kind: PanoramaKind.simple,
    priceClp: 34000,
    photo: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=500&h=380&fit=crop&q=60&auto=format',
    category: 'relax',
    reason: 'Tu comportamiento reciente indica una preferencia clara por el descanso y el bienestar.',
  ),
  const PanoramaItem(
    id: 'parapente',
    icon: '🪂',
    title: 'Salto en parapente',
    meta: 'A 1 hora',
    kind: PanoramaKind.simple,
    priceClp: 65000,
    photo: 'https://images.unsplash.com/photo-1521673461164-de300ebcf2cd?w=500&h=380&fit=crop&q=60&auto=format',
    category: 'extremo',
    reason: 'Tu perfil de riesgo declarado es compatible con actividades de alta intensidad.',
  ),
];

final List<PanoramaItem> general = [
  const PanoramaItem(
    id: 'canopy-termas',
    icon: '🏔️',
    title: 'Canopy + termas',
    meta: 'A 40 min',
    kind: PanoramaKind.simple,
    priceClp: 45000,
    photo: 'https://images.unsplash.com/photo-1533760881669-80db4d7b341a?w=500&h=380&fit=crop&q=60&auto=format',
    category: 'naturaleza',
  ),
  const PanoramaItem(
    id: 'cabana-rio',
    icon: '🛶',
    title: 'Cabaña junto al río',
    meta: 'Paquete de un fin de semana',
    kind: PanoramaKind.paquete,
    priceClp: 110000,
    photo: 'https://images.unsplash.com/photo-1445308394109-4ec2920981b1?w=500&h=380&fit=crop&q=60&auto=format',
    category: 'relax',
  ),
  const PanoramaItem(
    id: 'karting-noche',
    icon: '🎡',
    title: 'Karting bajo las estrellas',
    meta: 'Viernes · Noche',
    kind: PanoramaKind.simple,
    priceClp: 22000,
    photo: 'https://images.unsplash.com/photo-1541348263662-e068662d82af?w=500&h=380&fit=crop&q=60&auto=format',
    category: 'vidanocturna',
  ),
  const PanoramaItem(
    id: 'vinos-nocturno',
    icon: '🍷',
    title: 'Tour de vinos nocturno',
    meta: 'Paquete de un día',
    kind: PanoramaKind.paquete,
    priceClp: 48000,
    photo: 'https://images.unsplash.com/photo-1528823872057-9c018a7a7553?w=500&h=380&fit=crop&q=60&auto=format',
    category: 'gastronomia',
  ),
  const PanoramaItem(
    id: 'circo-algodon',
    icon: '🎪',
    title: 'Circo + algodón de azúcar',
    meta: 'Fin de semana',
    kind: PanoramaKind.simple,
    priceClp: 18000,
    photo: 'https://images.unsplash.com/photo-1508997449629-303059a039c0?w=500&h=380&fit=crop&q=60&auto=format',
    category: 'familia',
  ),
  const PanoramaItem(
    id: 'camping-fogata',
    icon: '🏕️',
    title: 'Camping + noche de fogata',
    meta: 'Paquete de 2 días',
    kind: PanoramaKind.paquete,
    priceClp: 56000,
    photo: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=500&h=380&fit=crop&q=60&auto=format',
    category: 'naturaleza',
  ),
];

/// Catálogo completo deduplicado — mismo criterio que el pill "Todos" en
/// `js/panoramas.js` (`renderExplore`), que siempre muestra `general`
/// completo sin importar la pestaña activa.
List<PanoramaItem> get todoElCatalogo => [
      ...recomendados,
      ...combos,
      ...simples,
      ...general,
    ];
