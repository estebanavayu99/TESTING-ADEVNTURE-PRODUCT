/* PickMap — Darwin — Taxonomia de categorias reales (Prioridad 1 ampliada)
 *
 * Generada a partir de las 178 categorias reales que aparecieron en el
 * listado de negocios que pasó el usuario (chile_experiences_FINAL.csv,
 * ya limpio de filas rotas y de negocios mal categorizados). Este archivo
 * solo guarda la TAXONOMIA de categorias (nombres de rubros de experiencias,
 * sin ningun dato de negocios/contactos) — el listado real de negocios
 * sigue sin subirse al repo, tal como pidio el usuario.
 *
 * Cada bucket es una categoria "gruesa" que ya usa el motor/algoritmos
 * (afinidad, pesos por arquetipo); `categorias_reales` son los valores
 * tal como vienen del catalogo real, para cuando se pueda mapear 1:1 cada
 * actividad real a su bucket; `keywords` alimenta la deteccion de intencion
 * en el texto libre del cliente (js/motor.js).
 */
(() => {
  const ARQUETIPO_POR_BUCKET = {
      "enologia": "foodie",
      "foodie": "foodie",
      "aventura": "aventurero",
      "relax": "relajado",
      "cultural": "cultural",
      "romantico": "romantico",
      "familiar": "familiar",
      "fiesta": "social_fiestero",
      "explorador": "explorador_local"
  };

  const TAXONOMIA = {
    enologia: {
      arquetipo: 'foodie',
      categorias_reales: ["Cata de cerveza", "Clases de coctelería", "Destilería", "Taller de cerveza artesanal", "Taller de coctelería", "Taller de destilados", "Tour de cervezas", "Tour de espumantes", "Tour de gin", "Tour de pisco", "Tour de vinos", "Tour de whisky", "Vendimia"],
      keywords: ["cata de cerveza", "cerveza", "cerveza artesanal", "cervezas", "clases de cocteleria", "cocteleria", "destilados", "destileria", "enologia", "espumantes", "pisco", "taller de cerveza artesanal", "taller de cocteleria", "taller de destilados", "tour de cervezas", "tour de espumantes", "tour de gin", "tour de pisco", "tour de vinos", "tour de whisky", "vendimia", "vina", "vino", "vinos", "viña", "whisky"],
    },
    aventura: {
      arquetipo: 'aventurero',
      categorias_reales: ["Ala delta", "Arriendo de bicicletas", "Arriendo de equipos de nieve", "Autódromo / pista de karts", "Buceo", "Buceo con lobos marinos", "Buggy", "Cabalgata / paseo a caballo", "Canopy", "Ciclismo de montaña", "Cicloturismo", "Clases de equitación", "Clases de vela", "Cuatrimotos", "Escuela de equitación", "Escuela de surf", "Kartings", "Kayak en lago", "Kayak en río", "Kitesurf", "Laser tag", "Montañismo", "Motos de nieve", "Paddle surf / stand up paddle", "Paintball", "Paracaidismo", "Parapente", "Parque acuático", "Puenting / salto en bungee", "Rafting extremo", "Rocódromo / muro de escalada", "Safari fotográfico", "Ski", "Snorkel", "Snowboard", "Snowpark", "Subida a la nieve", "Surf", "Tirolesa / zipline", "Tobogán acuático", "Tour en 4x4", "Trekking", "Tubing", "Vela", "Vuelo en avioneta", "Vuelo en helicóptero", "Windsurf"],
      keywords: ["adrenalina", "ala delta", "arriendo de bicicletas", "arriendo de equipos de nieve", "autodromo", "aventura", "avioneta", "buceo", "buceo con lobos marinos", "buggy", "cabalgata", "canopy", "ciclismo de montana", "cicloturismo", "clases de equitacion", "clases de vela", "cuatrimotos", "equitacion", "escuela de equitacion", "escuela de surf", "extrema", "extremo", "helicoptero", "kartings", "kayak en lago", "kayak en rio", "kitesurf", "laser tag", "montanismo", "motos de nieve", "muro de escalada", "paddle surf", "paintball", "paracaidismo", "parapente", "parque acuatico", "paseo a caballo", "pista de karts", "puenting", "rafting extremo", "rocodromo", "safari fotografico", "salto en bungee", "ski", "snorkel", "snowboard", "snowpark", "stand up paddle", "subida a la nieve", "surf", "tirolesa", "tobogan acuatico", "tour en 4x4", "trekking", "tubing", "vela", "vuelo en avioneta", "vuelo en helicoptero", "windsurf", "zipline"],
    },
    relax: {
      arquetipo: 'relajado',
      categorias_reales: ["Cabañas con actividades", "Cabañas con tinaja", "Camping con baño privado", "Clases de yoga", "Domo geodésico", "Glamping con jacuzzi", "Glamping de lujo", "Golf", "Hidromasaje", "Hospedaje en árbol", "Masajes", "Masajes descontracturantes", "Masajes relajantes", "Meditación", "Piscina termal", "Retiro de bienestar", "Retiro de yoga", "Retiro espiritual", "Sauna", "Spa", "Spa termal", "Termas", "Tinaja caliente / hot tub", "Yoga en la naturaleza"],
      keywords: ["cabanas con actividades", "cabanas con tinaja", "camping con bano privado", "clases de yoga", "descansar", "desconectar", "domo geodesico", "glamping con jacuzzi", "glamping de lujo", "golf", "hidromasaje", "hospedaje en arbol", "hot tub", "masajes", "masajes descontracturantes", "masajes relajantes", "meditacion", "piscina termal", "relajante", "relajarme", "relax", "retiro de bienestar", "retiro de yoga", "retiro espiritual", "sauna", "spa", "spa termal", "termas", "tinaja caliente", "tranquilo", "yoga", "yoga en la naturaleza"],
    },
    cultural: {
      arquetipo: 'cultural',
      categorias_reales: ["Circo", "City tour", "Clases de baile", "Clases de fotografía", "Clases de música", "Escuela de baile", "Escuela de circo", "Estudio de grabación", "Experiencia inmersiva", "Feria artesanal", "Funicular", "Jardín botánico", "Museo interactivo", "Taller de arte", "Taller de artesanía", "Taller de cerámica", "Taller de circo", "Taller de fotografía", "Taller de música", "Taller de pintura", "Taller de tejido", "Teleférico", "Tour arquitectónico", "Tour fotográfico", "Tour histórico", "Tour patrimonial", "Turismo cultural", "Visita guiada"],
      keywords: ["arte", "artesania", "baile", "ceramica", "circo", "city tour", "clases de baile", "clases de fotografia", "clases de musica", "cultura", "escuela de baile", "escuela de circo", "estudio de grabacion", "experiencia inmersiva", "feria artesanal", "fotografia", "funicular", "historia", "jardin botanico", "museo interactivo", "musica", "patrimonio", "pintura", "taller de arte", "taller de artesania", "taller de ceramica", "taller de circo", "taller de fotografia", "taller de musica", "taller de pintura", "taller de tejido", "tejido", "teleferico", "tour arquitectonico", "tour fotografico", "tour historico", "tour patrimonial", "turismo cultural", "visita guiada"],
    },
    foodie: {
      arquetipo: 'foodie',
      categorias_reales: ["Cata de aceite de oliva", "Cata de café", "Cata de chocolate", "Cena en la oscuridad", "Cena privada", "Cena temática", "Chef a domicilio", "Clases de barismo", "Clases de cocina", "Paseo en catamarán", "Picnic experience", "Taller de cocina", "Taller de pastelería", "Taller de repostería", "Tour de aceite de oliva", "Tour de café", "Tour de chocolates", "Tour de quesos"],
      keywords: ["aceite de oliva", "barismo", "cafe", "cata de aceite de oliva", "cata de cafe", "cata de chocolate", "catamaran", "cena en la oscuridad", "cena privada", "cena tematica", "chef a domicilio", "chocolate", "chocolates", "clases de barismo", "clases de cocina", "cocina", "comer", "comida", "foodie", "gastronomia", "paseo en catamaran", "pasteleria", "picnic experience", "quesos", "reposteria", "sabores", "taller de cocina", "taller de pasteleria", "taller de reposteria", "tour de aceite de oliva", "tour de cafe", "tour de chocolates", "tour de quesos"],
    },
    romantico: {
      arquetipo: 'romantico',
      categorias_reales: ["Mirador turístico", "Paseo en bote", "Paseo en globo aerostático", "Tour de miel"],
      keywords: ["aniversario", "atardecer", "bote", "globo aerostatico", "luna de miel", "miel", "mirador turistico", "novia", "novio", "pareja", "paseo en bote", "paseo en globo aerostatico", "romantica", "romantico", "tour de miel"],
    },
    familiar: {
      arquetipo: 'familiar',
      categorias_reales: ["Acuario", "Bowling", "Cumpleaños temáticos", "Fiesta temática infantil", "Granja interactiva", "Laberinto", "Minigolf", "Parque de cuerdas altas", "Pista de patinaje sobre hielo", "Sala de escape / escape room", "Salón de eventos infantiles", "Salón de juegos / arcade", "Trampoline park / cama elástica", "Zoológico", "Zoológico interactivo"],
      keywords: ["acuario", "arcade", "bowling", "cama elastica", "cumpleanos tematicos", "escape room", "familia", "familiar", "fiesta tematica infantil", "granja interactiva", "hijos", "laberinto", "minigolf", "ninos", "niñas", "niños", "parque de cuerdas altas", "pista de patinaje sobre hielo", "sala de escape", "salon de eventos infantiles", "salon de juegos", "trampoline park", "zoologico", "zoologico interactivo"],
    },
    fiesta: {
      arquetipo: 'social_fiestero',
      categorias_reales: ["Bar temático", "Cervecería artesanal", "City tour nocturno", "Coctelería temática", "Juego de rol en vivo"],
      keywords: ["bar", "bar tematico", "carrete", "cerveceria artesanal", "city tour nocturno", "cocteleria tematica", "fiesta", "juego de rol en vivo", "noche", "previa", "trago", "tragos"],
    },
    explorador: {
      arquetipo: 'explorador_local',
      categorias_reales: ["Agroturismo", "Astroturismo", "Avistamiento de aves", "Avistamiento de ballenas", "Avistamiento de cóndores", "Avistamiento de delfines", "Centro de interpretación ambiental", "Cosecha de frutas", "Ecoturismo", "Huerto orgánico", "Observación de estrellas", "Parque nacional / reserva natural", "Paseo en tren turístico", "Pesca artesanal", "Pesca con mosca", "Pesca deportiva", "Puente colgante", "Ruta del salmón", "Senderismo", "Tour de observatorio", "Turismo indígena", "Turismo mapuche", "Turismo rural", "Turismo sustentable"],
      keywords: ["agroturismo", "astroturismo", "autentico", "avistamiento de aves", "avistamiento de ballenas", "avistamiento de condores", "avistamiento de delfines", "centro de interpretacion ambiental", "cosecha de frutas", "ecoturismo", "gemas ocultas", "huerto organico", "naturaleza", "observacion de estrellas", "observatorio", "parque nacional", "paseo en tren turistico", "pesca artesanal", "pesca con mosca", "pesca deportiva", "poco turistico", "puente colgante", "reserva natural", "rural", "ruta del salmon", "senderismo", "tour de observatorio", "tren turistico", "turismo indigena", "turismo mapuche", "turismo rural", "turismo sustentable"],
    },
  };

  window.PickmapDarwinData = window.PickmapDarwinData || {};
  window.PickmapDarwinData.TAXONOMIA_CATEGORIAS = TAXONOMIA;
})();
