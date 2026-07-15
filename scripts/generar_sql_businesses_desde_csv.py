#!/usr/bin/env python3
"""Pickmap — genera SQL de upsert masivo a la tabla `businesses` de Supabase
a partir del CSV real de negocios turísticos (el mismo directorio real que
ya se usó para bot-darwin/data/catalogo.real-sample.js, pero acá se procesa
TODO el CSV, no solo una muestra de ~200).

Uso: python3 scripts/generar_sql_businesses_desde_csv.py <ruta_al_csv> [dir_salida]

Aplica la misma heurística de filtrado y estimación por categoría que
bot-darwin/scripts/generar_catalogo_real_sample.py (nombre/categoría/
ubicación reales; precio/duración/energía/accesibilidad ESTIMADOS por
categoría, marcados con datos_estimados=true en la tabla).

Salida: varios archivos supabase/data/businesses_batch_XX.sql (lotes de
~4000 filas cada uno, para pegar y correr uno por uno en el SQL Editor de
Supabase — un solo INSERT con las ~26.000 filas de golpe sería un paste
enorme y arriesgado de ejecutar en una sola transacción).
"""
import csv
import hashlib
import json
import os
import random
import re
import sys
import unicodedata

if len(sys.argv) < 2:
    print("Uso: python3 generar_sql_businesses_desde_csv.py <ruta_al_csv> [dir_salida]")
    sys.exit(1)
CSV_PATH = sys.argv[1]
OUT_DIR = sys.argv[2] if len(sys.argv) > 2 else os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "supabase", "data",
)
LOTE_SIZE = 4000

# Mismo mapeo que bot-darwin/data/taxonomia-categorias.js /
# bot-darwin/scripts/generar_catalogo_real_sample.py — copiado a propósito
# (patrón establecido del repo: duplicar en vez de compartir módulo entre
# Python y JS).
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
    "motors", "motor ", "autocentro", "car service", "car wash", "diesel",
    "torneria", "maestranza", "rodamientos", "retenes", "llantas", "frenos",
    "amortiguador", "bateria", "homocinetica", "revision tecnica",
    "planta de revision", "capacitacion", "otec ", "sence", "instituto de",
    "impresiones", "imprenta", "grafica e impresiones", "costuritas",
    "costura", "sastreria", "sindicato", "corporacion municipal",
    "seguridad industrial", "prevencion de riesgos", "extintores",
    "climatizacion", "refrigeracion industrial",
    "mecanic", "desabollad", "costur", "peluqueria", "duoc", "alzavidrios",
    "tuberia", "fitting", "electrofusion", "para autos", "auto impacto",
    "servicios mecanicos", "torque automotive", "terminal de buses",
    "mediacion", "gestion empresarial", "servicios automotri",
    "maestraza", "desarmaduria", "servicio tenico", "servicio tecnico",
    "sodimac", "derco", "rectificadora", "salon de belleza", "seremi",
    "nutricionista", "magisterio", "mallplaza", "logistica",
    "pozos profundos", "prefabricadas", "celulares", "taller motocicletas",
    "taller electrico", "musicoterapia", "maquinagro", "hyundai",
    "taller motos", "control seguridad", "telecomunicaciones", "unisex",
    "detailing", "metalmig", "new medic", "new dent", "concesionario",
    "automotora",
    "automotr", "electrocar", "radiadores", "soldador", "construcciones",
    "botox", "mesoterapia", "acido hialuronico", "armonizacion facial",
    "reparacion de autos", "reparacion automo", "taller grafico",
    " motor's", "check motor",
]


def sin_acentos(s):
    s = unicodedata.normalize("NFKC", s)
    trans = str.maketrans("áéíóúñÁÉÍÓÚÑ", "aeiounAEIOUN")
    return s.translate(trans)


def es_sospechoso(nombre):
    n = sin_acentos(nombre).lower()
    return any(kw in n for kw in NON_TOURISM_KEYWORDS)


def parse_latlng(url):
    m = MAPS_LATLNG_RE.search(url or "")
    if not m:
        return None
    return float(m.group(1)), float(m.group(2))


def seeded_rng(seed_str):
    h = hashlib.sha1(seed_str.encode("utf-8")).hexdigest()
    return random.Random(int(h[:12], 16))


def sql_str(v):
    if v is None:
        return "NULL"
    return "'" + str(v).replace("'", "''") + "'"


def sql_arr(values):
    if not values:
        return "ARRAY[]::text[]"
    return "ARRAY[" + ",".join(sql_str(v) for v in values) + "]::text[]"


def main():
    with open(CSV_PATH, encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f, delimiter=";")
        filas = list(reader)
    print(f"Filas totales en CSV: {len(filas)}")

    calificados = []
    for r in filas:
        cat = (r.get("Category") or "").strip()
        bucket = CAT_TO_BUCKET.get(cat)
        if not bucket:
            continue
        nombre = (r.get("Business Name") or "").strip()
        if not nombre or es_sospechoso(nombre):
            continue
        latlng = parse_latlng(r.get("Google Maps URL") or "")
        if not latlng:
            continue
        calificados.append((bucket, cat, nombre, r, latlng))

    print(f"Negocios calificados (reales, filtrados): {len(calificados)}")

    filas_sql = []
    vistos_id = set()
    for idx, (bucket, cat_real, nombre, r, (lat, lng)) in enumerate(calificados, start=1):
        comuna = (r.get("City") or r.get("Region") or "").strip()
        defaults = BUCKET_DEFAULTS[bucket]
        rng = seeded_rng(f"{nombre}|{cat_real}|{comuna}|{idx}")

        precio = rng.randrange(defaults["precio"][0], defaults["precio"][1] + 1, 1000)
        duracion = rng.choice(range(defaults["duracion"][0], defaults["duracion"][1] + 1, 15))
        exterior = defaults["exterior"]
        accesible = not (cat_real in NO_ACCESIBLE_CATS or bucket == "aventura")
        hero_moment = rng.random() < 0.15
        experiencia_estimada = rng.choice([3, 3, 4, 4, 5])
        tags = [bucket] + (["contiene_alcohol"] if defaults["alcohol"] else [])
        horarios = defaults["horarios"]

        biz_id = f"real_{idx:06d}"
        vistos_id.add(biz_id)
        punto_encuentro = f"Coordinar punto de encuentro directo con {nombre} en {comuna} al reservar"

        valores = (
            f"({sql_str(biz_id)}, NULL, {sql_str(nombre)}, {sql_str(bucket)}, "
            f"{sql_arr(tags)}, {precio}, {duracion}, {lat}, {lng}, {sql_str(comuna)}, "
            f"{sql_str(defaults['energia'])}, {str(exterior).upper()}, {str(not exterior).upper()}, "
            f"{str(accesible).upper()}, {experiencia_estimada}, {str(hero_moment).upper()}, "
            f"{sql_arr(horarios)}, {sql_str(punto_encuentro)}, "
            f"ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], '{{}}'::jsonb, "
            f"NULL, NULL, NULL, true)"
        )
        filas_sql.append(valores)

    print(f"Filas SQL generadas: {len(filas_sql)} (ids únicos: {len(vistos_id)})")

    os.makedirs(OUT_DIR, exist_ok=True)
    columnas = (
        "id, ghl_id, nombre, categoria, tags, precio, duracion_min, lat, lng, comuna, "
        "energia, exterior, indoor_alt, accesible, experiencia_estimada, hero_moment, "
        "horarios, punto_encuentro, incluye, no_incluye, restricciones, cupos, "
        "tipo, es_gema_oculta, evita_trampa, datos_estimados"
    )

    total_lotes = (len(filas_sql) + LOTE_SIZE - 1) // LOTE_SIZE
    for i in range(total_lotes):
        lote = filas_sql[i * LOTE_SIZE:(i + 1) * LOTE_SIZE]
        out_path = os.path.join(OUT_DIR, f"businesses_batch_{i + 1:02d}_de_{total_lotes:02d}.sql")
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(f"-- Lote {i + 1} de {total_lotes} — {len(lote)} negocios reales (datos_estimados=true)\n")
            f.write("-- Pegar completo en el SQL Editor de Supabase y darle Run.\n")
            f.write(f"insert into public.businesses ({columnas}) values\n")
            f.write(",\n".join(lote))
            f.write("\non conflict (id) do update set\n")
            f.write("  nombre = excluded.nombre, categoria = excluded.categoria, tags = excluded.tags,\n")
            f.write("  precio = excluded.precio, duracion_min = excluded.duracion_min,\n")
            f.write("  lat = excluded.lat, lng = excluded.lng, comuna = excluded.comuna,\n")
            f.write("  energia = excluded.energia, exterior = excluded.exterior, indoor_alt = excluded.indoor_alt,\n")
            f.write("  accesible = excluded.accesible, experiencia_estimada = excluded.experiencia_estimada,\n")
            f.write("  hero_moment = excluded.hero_moment, horarios = excluded.horarios,\n")
            f.write("  punto_encuentro = excluded.punto_encuentro, datos_estimados = excluded.datos_estimados;\n")
        print(f"Escrito: {out_path} ({len(lote)} filas)")


if __name__ == "__main__":
    main()
