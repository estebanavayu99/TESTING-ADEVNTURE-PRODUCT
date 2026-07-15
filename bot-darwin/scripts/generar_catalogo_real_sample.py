import csv
import hashlib
import json
import os
import random
import re
import sys
import unicodedata

# Uso: python3 generar_catalogo_real_sample.py <ruta_al_csv> [ruta_salida.js]
# El CSV debe tener columnas separadas por ";": Business Name, Category,
# Region, City, Phone Number, Email, Website, Facebook, Instagram,
# Google Maps URL (mismo formato que chile_experiences_*.csv del usuario).
if len(sys.argv) < 2:
    print("Uso: python3 generar_catalogo_real_sample.py <ruta_al_csv> [ruta_salida.js]")
    sys.exit(1)
CSV_PATH = sys.argv[1]
OUT_PATH = sys.argv[2] if len(sys.argv) > 2 else os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data", "catalogo.real-sample.js",
)

PER_BUCKET_TARGET = 22  # ~9 buckets * 22 = ~198 negocios

# Mismas categorias_reales que data/taxonomia-categorias.js (copiadas para no
# depender de parsear el JS). Si se agregan categorias nuevas a ese archivo,
# actualizar acá tambien.
TAXONOMIA = {
    "enologia": ["Cata de cerveza", "Clases de coctelería", "Destilería", "Taller de cerveza artesanal", "Taller de coctelería", "Taller de destilados", "Tour de cervezas", "Tour de espumantes", "Tour de gin", "Tour de pisco", "Tour de vinos", "Tour de whisky", "Vendimia"],
    "aventura": ["Ala delta", "Arriendo de bicicletas", "Arriendo de equipos de nieve", "Autódromo / pista de karts", "Buceo", "Buceo con lobos marinos", "Buggy", "Cabalgata / paseo a caballo", "Canopy", "Ciclismo de montaña", "Cicloturismo", "Clases de equitación", "Clases de vela", "Cuatrimotos", "Escuela de equitación", "Escuela de surf", "Kartings", "Kayak en lago", "Kayak en río", "Kitesurf", "Laser tag", "Montañismo", "Motos de nieve", "Paddle surf / stand up paddle", "Paintball", "Paracaidismo", "Parapente", "Parque acuático", "Puenting / salto en bungee", "Rafting extremo", "Rocódromo / muro de escalada", "Safari fotográfico", "Ski", "Snorkel", "Snowboard", "Snowpark", "Subida a la nieve", "Surf", "Tirolesa / zipline", "Tobogán acuático", "Tour en 4x4", "Trekking", "Tubing", "Vela", "Vuelo en avioneta", "Vuelo en helicóptero", "Windsurf"],
    "relax": ["Cabañas con actividades", "Cabañas con tinaja", "Camping con baño privado", "Clases de yoga", "Domo geodésico", "Glamping con jacuzzi", "Glamping de lujo", "Golf", "Hidromasaje", "Hospedaje en árbol", "Masajes", "Masajes descontracturantes", "Masajes relajantes", "Meditación", "Piscina termal", "Retiro de bienestar", "Retiro de yoga", "Retiro espiritual", "Sauna", "Spa", "Spa termal", "Termas", "Tinaja caliente / hot tub", "Yoga en la naturaleza"],
    "cultural": ["Circo", "City tour", "Clases de baile", "Clases de fotografía", "Clases de música", "Escuela de baile", "Escuela de circo", "Estudio de grabación", "Experiencia inmersiva", "Feria artesanal", "Funicular", "Jardín botánico", "Museo interactivo", "Taller de arte", "Taller de artesanía", "Taller de cerámica", "Taller de circo", "Taller de fotografía", "Taller de música", "Taller de pintura", "Taller de tejido", "Teleférico", "Tour arquitectónico", "Tour fotográfico", "Tour histórico", "Tour patrimonial", "Turismo cultural", "Visita guiada"],
    "foodie": ["Cata de aceite de oliva", "Cata de café", "Cata de chocolate", "Cena en la oscuridad", "Cena privada", "Cena temática", "Chef a domicilio", "Clases de barismo", "Clases de cocina", "Paseo en catamarán", "Picnic experience", "Taller de cocina", "Taller de pastelería", "Taller de repostería", "Tour de aceite de oliva", "Tour de café", "Tour de chocolates", "Tour de quesos"],
    "romantico": ["Mirador turístico", "Paseo en bote", "Paseo en globo aerostático", "Tour de miel"],
    "familiar": ["Acuario", "Bowling", "Cumpleaños temáticos", "Fiesta temática infantil", "Granja interactiva", "Laberinto", "Minigolf", "Parque de cuerdas altas", "Pista de patinaje sobre hielo", "Sala de escape / escape room", "Salón de eventos infantiles", "Salón de juegos / arcade", "Trampoline park / cama elástica", "Zoológico", "Zoológico interactivo"],
    "fiesta": ["Bar temático", "Cervecería artesanal", "City tour nocturno", "Coctelería temática", "Juego de rol en vivo"],
    "explorador": ["Agroturismo", "Astroturismo", "Avistamiento de aves", "Avistamiento de ballenas", "Avistamiento de cóndores", "Avistamiento de delfines", "Centro de interpretación ambiental", "Cosecha de frutas", "Ecoturismo", "Huerto orgánico", "Observación de estrellas", "Parque nacional / reserva natural", "Paseo en tren turístico", "Pesca artesanal", "Pesca con mosca", "Pesca deportiva", "Puente colgante", "Ruta del salmón", "Senderismo", "Tour de observatorio", "Turismo indígena", "Turismo mapuche", "Turismo rural", "Turismo sustentable"],
}
CAT_TO_BUCKET = {c: b for b, cats in TAXONOMIA.items() for c in cats}

# Heurísticas por bucket — TODO esto es estimado con sentido para poder
# empezar a testear, no son datos reales confirmados por ningún negocio.
BUCKET_DEFAULTS = {
    "enologia":   dict(precio=(15000, 35000), duracion=(90, 150), energia="baja",  exterior=False, horarios=["11:00", "15:00", "18:00"], alcohol=True),
    "aventura":   dict(precio=(20000, 45000), duracion=(120, 240), energia="alta",  exterior=True,  horarios=["08:30", "09:30"], alcohol=False),
    "relax":      dict(precio=(15000, 40000), duracion=(60, 150), energia="baja",  exterior=False, horarios=["10:00", "12:00", "16:00"], alcohol=False),
    "cultural":   dict(precio=(8000, 20000),  duracion=(60, 120), energia="baja",  exterior=False, horarios=["10:00", "15:00", "17:00"], alcohol=False),
    "foodie":     dict(precio=(15000, 35000), duracion=(90, 150), energia="baja",  exterior=False, horarios=["12:30", "19:00", "20:30"], alcohol=False),
    "romantico":  dict(precio=(20000, 35000), duracion=(60, 120), energia="baja",  exterior=True,  horarios=["17:30", "18:30"], alcohol=False),
    "familiar":   dict(precio=(8000, 20000),  duracion=(90, 150), energia="media", exterior=False, horarios=["11:00", "15:00", "17:00"], alcohol=False),
    "fiesta":     dict(precio=(15000, 30000), duracion=(120, 180), energia="media", exterior=False, horarios=["19:30", "21:30"], alcohol=True),
    "explorador": dict(precio=(10000, 30000), duracion=(90, 180), energia="media", exterior=True,  horarios=["09:00", "15:00"], alcohol=False),
}

# Sub-categorías reales dentro de aventura/explorador que son fisicamente
# demandantes (terreno irregular, esfuerzo fisico alto) -> no accesible.
NO_ACCESIBLE_CATS = {
    "Montañismo", "Trekking", "Puenting / salto en bungee", "Paracaidismo", "Parapente",
    "Rocódromo / muro de escalada", "Tirolesa / zipline", "Canopy", "Rafting extremo",
    "Senderismo", "Puente colgante", "Buceo", "Buceo con lobos marinos", "Ala delta",
}

MAPS_LATLNG_RE = re.compile(r"!3d(-?[0-9.]+)!4d(-?[0-9.]+)")

NON_TOURISM_KEYWORDS = [
    "mecanica", "ferreteria", "notaria", "veterinaria", "clinica",
    "gasfiteria", "electricista", "abogado", "contador", "inmobiliaria",
    "farmacia", "grua", "desabolladura", "serviteca", "universidad",
    "neumatico", "automotriz", "gimnasio", "colegio", "liceo", "banco",
    "autoservicio", "repuestos", "lubricentro", "constructora",
    "jardin infantil", "municipalidad", "carabineros", "bomberos",
    "cementerio", "funeraria", "electricidad", "estetica", "dental",
    "kinesiologia", "consultorio", "hospital", "aseguradora", "correduria",
    "isapre", "afp", "notario", "corredora de seguros",
    # Ronda 2: talleres/servicios automotrices y de oficina que se colaban
    # bajo categorias tipo "Taller de X" por match de palabra generico.
    "motors", "motor ", "autocentro", "car service", "car wash", "diesel",
    "torneria", "maestranza", "rodamientos", "retenes", "llantas", "frenos",
    "amortiguador", "bateria", "homocinetica", "revision tecnica",
    "planta de revision", "capacitacion", "otec ", "sence", "instituto de",
    "impresiones", "imprenta", "grafica e impresiones", "costuritas",
    "costura", "sastreria", "sindicato", "corporacion municipal",
    "seguridad industrial", "prevencion de riesgos", "extintores",
    "climatizacion", "refrigeracion industrial",
    # Ronda 3: variantes/plurales que el stem exacto no cachaba (mecanica ->
    # mecanico/mecanicos), mas rubros nuevos que aparecieron en la 2da pasada.
    "mecanic", "desabollad", "costur", "peluqueria", "duoc", "alzavidrios",
    "tuberia", "fitting", "electrofusion", "para autos", "auto impacto",
    "servicios mecanicos", "torque automotive", "terminal de buses",
    "mediacion", "gestion empresarial", "servicios automotri",
    # Ronda 4: marcas/rubros grandes (dealerships, retail) + variantes que
    # seguían pasando (maestranza mal escrito, autopartes, etc.).
    "maestraza", "desarmaduria", "servicio tenico", "servicio tecnico",
    "sodimac", "derco", "rectificadora", "salon de belleza", "seremi",
    "nutricionista", "magisterio", "mallplaza", "logistica",
    "pozos profundos", "prefabricadas", "celulares", "taller motocicletas",
    # Ronda 5: ultimos casos claros encontrados en la 4ta pasada — salud/
    # estetica, automotriz de marca, telecom/seguridad.
    "taller electrico", "musicoterapia", "maquinagro", "hyundai",
    "taller motos", "control seguridad", "telecomunicaciones", "unisex",
    "detailing", "metalmig", "new medic", "new dent", "concesionario",
    "automotora",
    # Ronda 6: "automotriz" no cachaba plurales/variantes (automotrices,
    # electrocar, radiadores) — stem mas corto "automotr" cubre toda la
    # familia; mas medicina estetica y construccion.
    "automotr", "electrocar", "radiadores", "soldador", "construcciones",
    "botox", "mesoterapia", "acido hialuronico", "armonizacion facial",
    "reparacion de autos", "reparacion automo", "taller grafico",
    " motor's", "check motor",
]


def sin_acentos(s):
    # NFKC primero: pliega texto "estilizado" con símbolos alfanuméricos
    # matemáticos de Unicode (ej. nombres de negocio en 𝗻𝗲𝗴𝗿𝗶𝘁𝗮 de
    # Instagram/Facebook) de vuelta a letras ASCII normales — sin esto,
    # un nombre estilizado evade el filtro de palabras sospechosas por
    # completo aunque diga literalmente "Taller Mecanico".
    s = unicodedata.normalize("NFKC", s)
    trans = str.maketrans("áéíóúñÁÉÍÓÚÑ", "aeiounAEIOUN")
    return s.translate(trans)


def parse_latlng(url):
    m = MAPS_LATLNG_RE.search(url or "")
    if not m:
        return None
    return float(m.group(1)), float(m.group(2))


def es_sospechoso(nombre):
    n = sin_acentos(nombre).lower()
    return any(kw in n for kw in NON_TOURISM_KEYWORDS)


def seeded_rng(seed_str):
    h = hashlib.sha1(seed_str.encode("utf-8")).hexdigest()
    return random.Random(int(h[:12], 16))


def cargar_filas():
    with open(CSV_PATH, encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f, delimiter=";")
        return list(reader)


def main():
    filas = cargar_filas()
    print(f"Filas totales en CSV: {len(filas)}")

    por_bucket = {b: [] for b in TAXONOMIA}
    sin_bucket = set()
    for r in filas:
        cat = (r.get("Category") or "").strip()
        bucket = CAT_TO_BUCKET.get(cat)
        if not bucket:
            sin_bucket.add(cat)
            continue
        if es_sospechoso(r.get("Business Name") or ""):
            continue
        latlng = parse_latlng(r.get("Google Maps URL") or "")
        if not latlng:
            continue
        por_bucket[bucket].append(r)

    print("Categorías reales sin bucket asignado (revisar taxonomía si son muchas):", len(sin_bucket))
    if sin_bucket:
        print("  ", sorted(sin_bucket)[:20])

    seleccion = []
    rng_global = random.Random(20240711)
    for bucket, filas_bucket in por_bucket.items():
        rng_global.shuffle(filas_bucket)
        # Diversidad de región: recorre round-robin por región en vez de
        # tomar los primeros N (que podrían ser todos de la misma región).
        por_region = {}
        for r in filas_bucket:
            por_region.setdefault(r.get("Region", ""), []).append(r)
        regiones = list(por_region.keys())
        rng_global.shuffle(regiones)
        elegidos = []
        i = 0
        while len(elegidos) < min(PER_BUCKET_TARGET, len(filas_bucket)):
            region = regiones[i % len(regiones)]
            lote = por_region[region]
            if lote:
                elegidos.append(lote.pop())
            i += 1
            if all(not v for v in por_region.values()):
                break
        print(f"  bucket {bucket}: {len(elegidos)} elegidos (de {len(filas_bucket)} candidatos reales)")
        for r in elegidos:
            seleccion.append((bucket, r))

    actividades = []
    for idx, (bucket, r) in enumerate(seleccion, start=1):
        nombre = (r.get("Business Name") or "").strip()
        cat_real = (r.get("Category") or "").strip()
        city = (r.get("City") or r.get("Region") or "").strip()
        lat, lng = parse_latlng(r.get("Google Maps URL") or "")
        defaults = BUCKET_DEFAULTS[bucket]
        rng = seeded_rng(f"{nombre}|{cat_real}|{idx}")

        precio = rng.randrange(defaults["precio"][0], defaults["precio"][1] + 1, 1000)
        duracion = rng.choice(range(defaults["duracion"][0], defaults["duracion"][1] + 1, 15))
        exterior = defaults["exterior"]
        accesible = not (cat_real in NO_ACCESIBLE_CATS or bucket == "aventura")
        hero_moment = rng.random() < 0.15
        experiencia_estimada = rng.choice([3, 3, 4, 4, 5])
        tags = [bucket]
        if defaults["alcohol"]:
            tags.append("contiene_alcohol")

        actividades.append({
            "id": f"r{idx}",
            "nombre": nombre,
            "categoria": bucket,
            "categoria_real": cat_real,
            "tags": tags,
            "precio": precio,
            "duracion_min": duracion,
            "lat": lat,
            "lng": lng,
            "comuna": city,
            "energia": defaults["energia"],
            "exterior": exterior,
            "indoor_alt": not exterior,
            "accesible": accesible,
            "experiencia_estimada": experiencia_estimada,
            "hero_moment": hero_moment,
            "horarios": defaults["horarios"],
        })

    print(f"\nTotal actividades generadas: {len(actividades)}")

    # --- Escribir el archivo JS con el mismo contrato que catalogo.mock.js ---
    lineas = []
    lineas.append("/* PickMap — Darwin — Catálogo de MUESTRA con negocios reales (ESTIMADO)")
    lineas.append(" *")
    lineas.append(" * Generado desde un directorio real de negocios turísticos chilenos que")
    lineas.append(" * pasó el usuario, para poder testear con nombres/categorías/ubicaciones")
    lineas.append(" * reales mientras se define la integración con la BD/CRM real definitiva.")
    lineas.append(" *")
    lineas.append(" * QUÉ ES REAL: nombre del negocio, categoría real, comuna/ciudad, y las")
    lineas.append(" * coordenadas lat/lng (extraídas de la URL de Google Maps del negocio).")
    lineas.append(" *")
    lineas.append(" * QUÉ ES ESTIMADO (no confirmado por el negocio, solo para poder probar")
    lineas.append(" * el motor con datos de aspecto real): precio, duración, horarios,")
    lineas.append(" * energía, exterior/interior, accesibilidad, punto de encuentro exacto,")
    lineas.append(" * experiencia_estimada y hero_moment — todos estimados con heurísticas")
    lineas.append(" * por categoría (ver build_real_sample.py en el scratchpad de la sesión")
    lineas.append(" * que generó este archivo). Cuando el usuario conecte su CRM/BD real,")
    lineas.append(" * este archivo se reemplaza por esos datos confirmados.")
    lineas.append(" *")
    lineas.append(" * SÍ ESTÁ COMITEADO A GIT — el usuario autorizó explícitamente subir")
    lineas.append(" * estos datos reales para testear el motor de punta a punta en el sitio")
    lineas.append(" * real. Es DATA TEMPORAL DE TESTING: se reemplaza por los negocios ya")
    lineas.append(" * firmados más adelante. Regenerar con este mismo script + el CSV.")
    lineas.append(" */")
    lineas.append("(() => {")
    lineas.append("  const hoy = new Date();")
    lineas.append("  function fechaISO(offsetDias) {")
    lineas.append("    const d = new Date(hoy);")
    lineas.append("    d.setDate(d.getDate() + offsetDias);")
    lineas.append("    return d.toISOString().slice(0, 10);")
    lineas.append("  }")
    lineas.append("  function cuposParaProximosDias(porHorario) {")
    lineas.append("    const cupos = {};")
    lineas.append("    for (let i = 0; i <= 10; i++) cupos[fechaISO(i)] = { ...porHorario };")
    lineas.append("    return cupos;")
    lineas.append("  }")
    lineas.append("")
    lineas.append("  const CATALOGO_REAL_SAMPLE = [")

    for a in actividades:
        cupos_horario = {h: rng_cupos_val(a["id"], h) for h in a["horarios"]}
        lineas.append("    {")
        lineas.append(f"      id: {json.dumps(a['id'])},")
        lineas.append(f"      nombre: {json.dumps(a['nombre'], ensure_ascii=False)},")
        lineas.append(f"      categoria: {json.dumps(a['categoria'])},")
        lineas.append(f"      categoria_real: {json.dumps(a['categoria_real'], ensure_ascii=False)}, // dato real, informativo")
        lineas.append(f"      tags: {json.dumps(a['tags'])},")
        lineas.append(f"      precio: {a['precio']}, // ESTIMADO")
        lineas.append(f"      duracion_min: {a['duracion_min']}, // ESTIMADO")
        lineas.append(f"      ubicacion: {{ lat: {a['lat']}, lng: {a['lng']}, comuna: {json.dumps(a['comuna'], ensure_ascii=False)} }}, // lat/lng reales")
        lineas.append(f"      energia: {json.dumps(a['energia'])}, // ESTIMADO")
        lineas.append(f"      exterior: {json.dumps(a['exterior'])}, // ESTIMADO")
        lineas.append(f"      indoor_alt: {json.dumps(a['indoor_alt'])}, // ESTIMADO")
        lineas.append(f"      accesible: {json.dumps(a['accesible'])}, // ESTIMADO (heurística por categoría, no confirmado)")
        lineas.append(f"      experiencia_estimada: {a['experiencia_estimada']}, // ESTIMADO")
        lineas.append(f"      hero_moment: {json.dumps(a['hero_moment'])}, // ESTIMADO")
        lineas.append(f"      horarios: {json.dumps(a['horarios'])}, // ESTIMADO")
        punto_encuentro = "Coordinar punto de encuentro directo con {} en {} al reservar".format(a["nombre"], a["comuna"])
        lineas.append(f"      punto_encuentro: {json.dumps(punto_encuentro, ensure_ascii=False)}, // placeholder honesto, no hay dirección exacta")
        lineas.append("      incluye: [],")
        lineas.append("      no_incluye: [],")
        lineas.append("      restricciones: [],")
        lineas.append(f"      cupos: cuposParaProximosDias({json.dumps(cupos_horario)}),")
        lineas.append("    },")

    lineas.append("  ];")
    lineas.append("")
    lineas.append("  window.PickmapDarwinData = window.PickmapDarwinData || {};")
    lineas.append("  window.PickmapDarwinData.CATALOGO_REAL_SAMPLE = CATALOGO_REAL_SAMPLE;")
    lineas.append("})();")

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(lineas) + "\n")
    print(f"\nEscrito: {OUT_PATH}")


def rng_cupos_val(seed_id, hora):
    rng = seeded_rng(f"{seed_id}|{hora}")
    return rng.choice([4, 5, 6, 8])


if __name__ == "__main__":
    main()
