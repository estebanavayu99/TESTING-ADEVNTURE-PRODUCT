/* PickMap — Darwin — Catálogo de MUESTRA con negocios reales (ESTIMADO)
 *
 * Generado desde un directorio real de negocios turísticos chilenos que
 * pasó el usuario, para poder testear con nombres/categorías/ubicaciones
 * reales mientras se define la integración con la BD/CRM real definitiva.
 *
 * QUÉ ES REAL: nombre del negocio, categoría real, comuna/ciudad, y las
 * coordenadas lat/lng (extraídas de la URL de Google Maps del negocio).
 *
 * QUÉ ES ESTIMADO (no confirmado por el negocio, solo para poder probar
 * el motor con datos de aspecto real): precio, duración, horarios,
 * energía, exterior/interior, accesibilidad, punto de encuentro exacto,
 * experiencia_estimada y hero_moment — todos estimados con heurísticas
 * por categoría (ver build_real_sample.py en el scratchpad de la sesión
 * que generó este archivo). Cuando el usuario conecte su CRM/BD real,
 * este archivo se reemplaza por esos datos confirmados.
 *
 * SÍ ESTÁ COMITEADO A GIT — el usuario autorizó explícitamente subir
 * estos datos reales para poder testear el motor de punta a punta en el
 * sitio real ("si es necesario subir a GitHub los negocios reales para
 * poder testear bien y real, hagámoslo"). Es DATA TEMPORAL DE TESTING:
 * el usuario va a reemplazarla por los negocios ya firmados más adelante
 * (antes de eso, este archivo no debería quedar como catálogo definitivo
 * de producción). Regenerar con
 * `bot-darwin/scripts/generar_catalogo_real_sample.py <csv>`.
 */
(() => {
  const hoy = new Date();
  function fechaISO(offsetDias) {
    const d = new Date(hoy);
    d.setDate(d.getDate() + offsetDias);
    return d.toISOString().slice(0, 10);
  }
  function cuposParaProximosDias(porHorario) {
    const cupos = {};
    for (let i = 0; i <= 10; i++) cupos[fechaISO(i)] = { ...porHorario };
    return cupos;
  }

  const CATALOGO_REAL_SAMPLE = [
    {
      id: "r1",
      nombre: "Kumon La Florida - Walker Martínez Poniente",
      categoria: "enologia",
      categoria_real: "Taller de coctelería", // dato real, informativo
      tags: ["enologia", "contiene_alcohol"],
      precio: 30000, // ESTIMADO
      duracion_min: 120, // ESTIMADO
      ubicacion: { lat: -33.52305, lng: -70.59527, comuna: "La Florida" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 5, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["11:00", "15:00", "18:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Kumon La Florida - Walker Martínez Poniente en La Florida al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 4, "15:00": 6, "18:00": 6}),
    },
    {
      id: "r2",
      nombre: "Viña Gonzalez Bastias",
      categoria: "enologia",
      categoria_real: "Tour de vinos", // dato real, informativo
      tags: ["enologia", "contiene_alcohol"],
      precio: 34000, // ESTIMADO
      duracion_min: 120, // ESTIMADO
      ubicacion: { lat: -35.4510392, lng: -72.023866, comuna: "San Javier" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["11:00", "15:00", "18:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Viña Gonzalez Bastias en San Javier al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 4, "15:00": 6, "18:00": 5}),
    },
    {
      id: "r3",
      nombre: "Soc Importadora J P T",
      categoria: "enologia",
      categoria_real: "Taller de destilados", // dato real, informativo
      tags: ["enologia", "contiene_alcohol"],
      precio: 33000, // ESTIMADO
      duracion_min: 150, // ESTIMADO
      ubicacion: { lat: -20.2057385, lng: -70.1388256, comuna: "Iquique" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["11:00", "15:00", "18:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Soc Importadora J P T en Iquique al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 4, "15:00": 8, "18:00": 4}),
    },
    {
      id: "r4",
      nombre: "Academia De Drones De Chile - Antofagasta",
      categoria: "enologia",
      categoria_real: "Taller de coctelería", // dato real, informativo
      tags: ["enologia", "contiene_alcohol"],
      precio: 34000, // ESTIMADO
      duracion_min: 105, // ESTIMADO
      ubicacion: { lat: -23.6512552, lng: -70.3990467, comuna: "Antofagasta" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: true, // ESTIMADO
      horarios: ["11:00", "15:00", "18:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Academia De Drones De Chile - Antofagasta en Antofagasta al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 6, "15:00": 6, "18:00": 6}),
    },
    {
      id: "r5",
      nombre: "Erase Un Taller",
      categoria: "enologia",
      categoria_real: "Taller de coctelería", // dato real, informativo
      tags: ["enologia", "contiene_alcohol"],
      precio: 20000, // ESTIMADO
      duracion_min: 120, // ESTIMADO
      ubicacion: { lat: -38.7347226, lng: -72.6327395, comuna: "Temuco" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["11:00", "15:00", "18:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Erase Un Taller en Temuco al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 4, "15:00": 5, "18:00": 5}),
    },
    {
      id: "r6",
      nombre: "Trekan Valdivia",
      categoria: "enologia",
      categoria_real: "Taller de coctelería", // dato real, informativo
      tags: ["enologia", "contiene_alcohol"],
      precio: 27000, // ESTIMADO
      duracion_min: 105, // ESTIMADO
      ubicacion: { lat: -39.8185618, lng: -73.2443376, comuna: "Valdivia" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["11:00", "15:00", "18:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Trekan Valdivia en Valdivia al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 6, "15:00": 5, "18:00": 8}),
    },
    {
      id: "r7",
      nombre: "Tattersall Leasing",
      categoria: "enologia",
      categoria_real: "Taller de coctelería", // dato real, informativo
      tags: ["enologia", "contiene_alcohol"],
      precio: 33000, // ESTIMADO
      duracion_min: 120, // ESTIMADO
      ubicacion: { lat: -45.574719, lng: -72.0697169, comuna: "Coyhaique" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["11:00", "15:00", "18:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Tattersall Leasing en Coyhaique al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 4, "15:00": 4, "18:00": 4}),
    },
    {
      id: "r8",
      nombre: "GEOROCK S.A.",
      categoria: "enologia",
      categoria_real: "Taller de coctelería", // dato real, informativo
      tags: ["enologia", "contiene_alcohol"],
      precio: 19000, // ESTIMADO
      duracion_min: 120, // ESTIMADO
      ubicacion: { lat: -34.1899392, lng: -70.7463882, comuna: "Rancagua" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: true, // ESTIMADO
      horarios: ["11:00", "15:00", "18:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con GEOROCK S.A. en Rancagua al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 4, "15:00": 5, "18:00": 8}),
    },
    {
      id: "r9",
      nombre: "PETITT MIRRÔ",
      categoria: "enologia",
      categoria_real: "Clases de coctelería", // dato real, informativo
      tags: ["enologia", "contiene_alcohol"],
      precio: 32000, // ESTIMADO
      duracion_min: 150, // ESTIMADO
      ubicacion: { lat: -53.1674605, lng: -70.9279649, comuna: "Punta Arenas" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["11:00", "15:00", "18:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con PETITT MIRRÔ en Punta Arenas al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 6, "15:00": 5, "18:00": 5}),
    },
    {
      id: "r10",
      nombre: "E-learnica",
      categoria: "enologia",
      categoria_real: "Clases de coctelería", // dato real, informativo
      tags: ["enologia", "contiene_alcohol"],
      precio: 28000, // ESTIMADO
      duracion_min: 150, // ESTIMADO
      ubicacion: { lat: -29.909402, lng: -71.2504146, comuna: "La Serena" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["11:00", "15:00", "18:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con E-learnica en La Serena al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 8, "15:00": 4, "18:00": 8}),
    },
    {
      id: "r11",
      nombre: "Comercial Neumaval",
      categoria: "enologia",
      categoria_real: "Taller de coctelería", // dato real, informativo
      tags: ["enologia", "contiene_alcohol"],
      precio: 34000, // ESTIMADO
      duracion_min: 150, // ESTIMADO
      ubicacion: { lat: -33.0461679, lng: -71.6099075, comuna: "Valparaíso" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["11:00", "15:00", "18:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Comercial Neumaval en Valparaíso al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 5, "15:00": 5, "18:00": 8}),
    },
    {
      id: "r12",
      nombre: "Centro MB2 para la Experimentación de las Artes",
      categoria: "enologia",
      categoria_real: "Taller de coctelería", // dato real, informativo
      tags: ["enologia", "contiene_alcohol"],
      precio: 25000, // ESTIMADO
      duracion_min: 90, // ESTIMADO
      ubicacion: { lat: -18.4749155, lng: -70.2998106, comuna: "Arica" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["11:00", "15:00", "18:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Centro MB2 para la Experimentación de las Artes en Arica al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 4, "15:00": 6, "18:00": 6}),
    },
    {
      id: "r13",
      nombre: "Taller Poiesis Arquitectos",
      categoria: "enologia",
      categoria_real: "Taller de coctelería", // dato real, informativo
      tags: ["enologia", "contiene_alcohol"],
      precio: 32000, // ESTIMADO
      duracion_min: 120, // ESTIMADO
      ubicacion: { lat: -37.4590644, lng: -72.3363002, comuna: "Los Ángeles" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["11:00", "15:00", "18:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Taller Poiesis Arquitectos en Los Ángeles al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 4, "15:00": 5, "18:00": 4}),
    },
    {
      id: "r14",
      nombre: "CECAL Centro de Extensión Cultural Alfonso Lagos",
      categoria: "enologia",
      categoria_real: "Taller de coctelería", // dato real, informativo
      tags: ["enologia", "contiene_alcohol"],
      precio: 29000, // ESTIMADO
      duracion_min: 120, // ESTIMADO
      ubicacion: { lat: -36.6066925, lng: -72.0991338, comuna: "Chillán" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["11:00", "15:00", "18:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con CECAL Centro de Extensión Cultural Alfonso Lagos en Chillán al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 5, "15:00": 4, "18:00": 5}),
    },
    {
      id: "r15",
      nombre: "Atelier Grabados Digitales",
      categoria: "enologia",
      categoria_real: "Taller de coctelería", // dato real, informativo
      tags: ["enologia", "contiene_alcohol"],
      precio: 24000, // ESTIMADO
      duracion_min: 150, // ESTIMADO
      ubicacion: { lat: -27.3685213, lng: -70.3350905, comuna: "Copiapó" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["11:00", "15:00", "18:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Atelier Grabados Digitales en Copiapó al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 4, "15:00": 5, "18:00": 5}),
    },
    {
      id: "r16",
      nombre: "AutoCare Chile",
      categoria: "enologia",
      categoria_real: "Taller de coctelería", // dato real, informativo
      tags: ["enologia", "contiene_alcohol"],
      precio: 32000, // ESTIMADO
      duracion_min: 105, // ESTIMADO
      ubicacion: { lat: -40.5707932, lng: -73.1429797, comuna: "Osorno" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["11:00", "15:00", "18:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con AutoCare Chile en Osorno al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 4, "15:00": 6, "18:00": 4}),
    },
    {
      id: "r17",
      nombre: "Taller de Bicicletas CamollBike",
      categoria: "enologia",
      categoria_real: "Taller de coctelería", // dato real, informativo
      tags: ["enologia", "contiene_alcohol"],
      precio: 29000, // ESTIMADO
      duracion_min: 90, // ESTIMADO
      ubicacion: { lat: -33.4666883, lng: -70.5919757, comuna: "Ñuñoa" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 5, // ESTIMADO
      hero_moment: true, // ESTIMADO
      horarios: ["11:00", "15:00", "18:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Taller de Bicicletas CamollBike en Ñuñoa al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 4, "15:00": 4, "18:00": 8}),
    },
    {
      id: "r18",
      nombre: "Botillería y Licorería Ibiza en Talca",
      categoria: "enologia",
      categoria_real: "Tour de cervezas", // dato real, informativo
      tags: ["enologia", "contiene_alcohol"],
      precio: 25000, // ESTIMADO
      duracion_min: 150, // ESTIMADO
      ubicacion: { lat: -35.430333, lng: -71.6586437, comuna: "Talca" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 5, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["11:00", "15:00", "18:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Botillería y Licorería Ibiza en Talca en Talca al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 4, "15:00": 8, "18:00": 4}),
    },
    {
      id: "r19",
      nombre: "Conservatorio Mozart",
      categoria: "enologia",
      categoria_real: "Taller de coctelería", // dato real, informativo
      tags: ["enologia", "contiene_alcohol"],
      precio: 27000, // ESTIMADO
      duracion_min: 90, // ESTIMADO
      ubicacion: { lat: -20.2529775, lng: -70.1331959, comuna: "Iquique" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["11:00", "15:00", "18:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Conservatorio Mozart en Iquique al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 4, "15:00": 8, "18:00": 6}),
    },
    {
      id: "r20",
      nombre: "Taller De Hojalateria",
      categoria: "enologia",
      categoria_real: "Taller de coctelería", // dato real, informativo
      tags: ["enologia", "contiene_alcohol"],
      precio: 30000, // ESTIMADO
      duracion_min: 150, // ESTIMADO
      ubicacion: { lat: -22.4581736, lng: -68.9361259, comuna: "Calama" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 5, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["11:00", "15:00", "18:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Taller De Hojalateria en Calama al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 8, "15:00": 6, "18:00": 4}),
    },
    {
      id: "r21",
      nombre: "Licorería La Previa Andes",
      categoria: "enologia",
      categoria_real: "Taller de destilados", // dato real, informativo
      tags: ["enologia", "contiene_alcohol"],
      precio: 22000, // ESTIMADO
      duracion_min: 150, // ESTIMADO
      ubicacion: { lat: -38.7342405, lng: -72.6225663, comuna: "Temuco" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["11:00", "15:00", "18:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Licorería La Previa Andes en Temuco al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 5, "15:00": 6, "18:00": 4}),
    },
    {
      id: "r22",
      nombre: "The 360 Bike Shop",
      categoria: "enologia",
      categoria_real: "Taller de coctelería", // dato real, informativo
      tags: ["enologia", "contiene_alcohol"],
      precio: 33000, // ESTIMADO
      duracion_min: 150, // ESTIMADO
      ubicacion: { lat: -39.8113692, lng: -73.2414653, comuna: "Valdivia" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["11:00", "15:00", "18:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con The 360 Bike Shop en Valdivia al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 8, "15:00": 5, "18:00": 6}),
    },
    {
      id: "r23",
      nombre: "PiscoElquiChile Turismo & Experiencias en Valle de Elqui",
      categoria: "aventura",
      categoria_real: "Canopy", // dato real, informativo
      tags: ["aventura"],
      precio: 43000, // ESTIMADO
      duracion_min: 135, // ESTIMADO
      ubicacion: { lat: -30.1240177, lng: -70.492868, comuna: "Pisco Elqui" }, // lat/lng reales
      energia: "alta", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: false, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 5, // ESTIMADO
      hero_moment: true, // ESTIMADO
      horarios: ["08:30", "09:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con PiscoElquiChile Turismo & Experiencias en Valle de Elqui en Pisco Elqui al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"08:30": 8, "09:30": 5}),
    },
    {
      id: "r24",
      nombre: "Dojo Kyokushin Coyhaique",
      categoria: "aventura",
      categoria_real: "Escuela de equitación", // dato real, informativo
      tags: ["aventura"],
      precio: 28000, // ESTIMADO
      duracion_min: 150, // ESTIMADO
      ubicacion: { lat: -45.5818389, lng: -72.0473233, comuna: "Coyhaique" }, // lat/lng reales
      energia: "alta", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: false, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["08:30", "09:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Dojo Kyokushin Coyhaique en Coyhaique al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"08:30": 4, "09:30": 5}),
    },
    {
      id: "r25",
      nombre: "Escuela Punto Surf",
      categoria: "aventura",
      categoria_real: "Paddle surf / stand up paddle", // dato real, informativo
      tags: ["aventura"],
      precio: 27000, // ESTIMADO
      duracion_min: 150, // ESTIMADO
      ubicacion: { lat: -32.9189556, lng: -71.5114986, comuna: "Valparaíso" }, // lat/lng reales
      energia: "alta", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: false, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["08:30", "09:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Escuela Punto Surf en Valparaíso al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"08:30": 4, "09:30": 5}),
    },
    {
      id: "r26",
      nombre: "Cabalgata Cerro Dorotea",
      categoria: "aventura",
      categoria_real: "Cabalgata / paseo a caballo", // dato real, informativo
      tags: ["aventura"],
      precio: 29000, // ESTIMADO
      duracion_min: 135, // ESTIMADO
      ubicacion: { lat: -51.6904582, lng: -72.3947378, comuna: "Puerto Natales" }, // lat/lng reales
      energia: "alta", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: false, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["08:30", "09:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Cabalgata Cerro Dorotea en Puerto Natales al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"08:30": 8, "09:30": 5}),
    },
    {
      id: "r27",
      nombre: "Escuela de Surf Matanzas - STORM",
      categoria: "aventura",
      categoria_real: "Escuela de surf", // dato real, informativo
      tags: ["aventura"],
      precio: 35000, // ESTIMADO
      duracion_min: 195, // ESTIMADO
      ubicacion: { lat: -33.9613127, lng: -71.8746183, comuna: "Matanzas" }, // lat/lng reales
      energia: "alta", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: false, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["08:30", "09:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Escuela de Surf Matanzas - STORM en Matanzas al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"08:30": 6, "09:30": 8}),
    },
    {
      id: "r28",
      nombre: "Hostal Oreko",
      categoria: "aventura",
      categoria_real: "Tirolesa / zipline", // dato real, informativo
      tags: ["aventura"],
      precio: 44000, // ESTIMADO
      duracion_min: 165, // ESTIMADO
      ubicacion: { lat: -27.1629425, lng: -109.4391674, comuna: "Hanga Roa" }, // lat/lng reales
      energia: "alta", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: false, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 5, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["08:30", "09:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Hostal Oreko en Hanga Roa al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"08:30": 8, "09:30": 6}),
    },
    {
      id: "r29",
      nombre: "Parque Paleontologico Los Dedos",
      categoria: "aventura",
      categoria_real: "Tirolesa / zipline", // dato real, informativo
      tags: ["aventura"],
      precio: 23000, // ESTIMADO
      duracion_min: 165, // ESTIMADO
      ubicacion: { lat: -27.1450651, lng: -70.8828835, comuna: "Bahía Inglesa" }, // lat/lng reales
      energia: "alta", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: false, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["08:30", "09:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Parque Paleontologico Los Dedos en Bahía Inglesa al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"08:30": 6, "09:30": 4}),
    },
    {
      id: "r30",
      nombre: "Vertical Iquique",
      categoria: "aventura",
      categoria_real: "Surf", // dato real, informativo
      tags: ["aventura"],
      precio: 34000, // ESTIMADO
      duracion_min: 225, // ESTIMADO
      ubicacion: { lat: -20.2247289, lng: -70.1499285, comuna: "Iquique" }, // lat/lng reales
      energia: "alta", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: false, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 5, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["08:30", "09:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Vertical Iquique en Iquique al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"08:30": 5, "09:30": 5}),
    },
    {
      id: "r31",
      nombre: "Wimavi Paintball",
      categoria: "aventura",
      categoria_real: "Paintball", // dato real, informativo
      tags: ["aventura"],
      precio: 28000, // ESTIMADO
      duracion_min: 195, // ESTIMADO
      ubicacion: { lat: -36.6062618, lng: -72.1023351, comuna: "Chillán" }, // lat/lng reales
      energia: "alta", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: false, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["08:30", "09:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Wimavi Paintball en Chillán al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"08:30": 8, "09:30": 6}),
    },
    {
      id: "r32",
      nombre: "Paintball Budi",
      categoria: "aventura",
      categoria_real: "Paintball", // dato real, informativo
      tags: ["aventura"],
      precio: 20000, // ESTIMADO
      duracion_min: 120, // ESTIMADO
      ubicacion: { lat: -38.6562658, lng: -72.7005042, comuna: "Temuco" }, // lat/lng reales
      energia: "alta", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: false, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["08:30", "09:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Paintball Budi en Temuco al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"08:30": 6, "09:30": 6}),
    },
    {
      id: "r33",
      nombre: "RocaNorte Climb Center",
      categoria: "aventura",
      categoria_real: "Rocódromo / muro de escalada", // dato real, informativo
      tags: ["aventura"],
      precio: 27000, // ESTIMADO
      duracion_min: 135, // ESTIMADO
      ubicacion: { lat: -18.4719857, lng: -70.314146, comuna: "Arica" }, // lat/lng reales
      energia: "alta", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: false, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["08:30", "09:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con RocaNorte Climb Center en Arica al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"08:30": 4, "09:30": 6}),
    },
    {
      id: "r34",
      nombre: "Rangers de Talca",
      categoria: "aventura",
      categoria_real: "Escuela de equitación", // dato real, informativo
      tags: ["aventura"],
      precio: 32000, // ESTIMADO
      duracion_min: 165, // ESTIMADO
      ubicacion: { lat: -35.4257774, lng: -71.6647263, comuna: "Talca" }, // lat/lng reales
      energia: "alta", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: false, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["08:30", "09:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Rangers de Talca en Talca al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"08:30": 6, "09:30": 8}),
    },
    {
      id: "r35",
      nombre: "Club Ecuestre La Dehesa",
      categoria: "aventura",
      categoria_real: "Escuela de equitación", // dato real, informativo
      tags: ["aventura"],
      precio: 30000, // ESTIMADO
      duracion_min: 135, // ESTIMADO
      ubicacion: { lat: -39.7521536, lng: -73.2289664, comuna: "Valdivia" }, // lat/lng reales
      energia: "alta", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: false, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["08:30", "09:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Club Ecuestre La Dehesa en Valdivia al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"08:30": 6, "09:30": 5}),
    },
    {
      id: "r36",
      nombre: "La Picá de los Colonos",
      categoria: "aventura",
      categoria_real: "Trekking", // dato real, informativo
      tags: ["aventura"],
      precio: 20000, // ESTIMADO
      duracion_min: 165, // ESTIMADO
      ubicacion: { lat: -43.1869466, lng: -71.863426, comuna: "Futaleufú" }, // lat/lng reales
      energia: "alta", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: false, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["08:30", "09:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con La Picá de los Colonos en Futaleufú al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"08:30": 6, "09:30": 4}),
    },
    {
      id: "r37",
      nombre: "Piscinas Anakena",
      categoria: "aventura",
      categoria_real: "Parque acuático", // dato real, informativo
      tags: ["aventura"],
      precio: 21000, // ESTIMADO
      duracion_min: 195, // ESTIMADO
      ubicacion: { lat: -33.4274641, lng: -70.5325739, comuna: "Las Condes" }, // lat/lng reales
      energia: "alta", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: false, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["08:30", "09:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Piscinas Anakena en Las Condes al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"08:30": 8, "09:30": 4}),
    },
    {
      id: "r38",
      nombre: "Parque Acuático",
      categoria: "aventura",
      categoria_real: "Parque acuático", // dato real, informativo
      tags: ["aventura"],
      precio: 35000, // ESTIMADO
      duracion_min: 165, // ESTIMADO
      ubicacion: { lat: -22.4603907, lng: -68.9196141, comuna: "Calama" }, // lat/lng reales
      energia: "alta", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: false, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["08:30", "09:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Parque Acuático en Calama al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"08:30": 4, "09:30": 4}),
    },
    {
      id: "r39",
      nombre: "Senderos Biobío indumentaria outdoor",
      categoria: "aventura",
      categoria_real: "Ciclismo de montaña", // dato real, informativo
      tags: ["aventura"],
      precio: 26000, // ESTIMADO
      duracion_min: 210, // ESTIMADO
      ubicacion: { lat: -36.8143372, lng: -73.0612294, comuna: "Concepción" }, // lat/lng reales
      energia: "alta", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: false, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 5, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["08:30", "09:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Senderos Biobío indumentaria outdoor en Concepción al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"08:30": 5, "09:30": 5}),
    },
    {
      id: "r40",
      nombre: "Kam-Per / Carpas de Techo",
      categoria: "aventura",
      categoria_real: "Canopy", // dato real, informativo
      tags: ["aventura"],
      precio: 30000, // ESTIMADO
      duracion_min: 165, // ESTIMADO
      ubicacion: { lat: -29.9295317, lng: -71.2578457, comuna: "La Serena" }, // lat/lng reales
      energia: "alta", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: false, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 5, // ESTIMADO
      hero_moment: true, // ESTIMADO
      horarios: ["08:30", "09:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Kam-Per / Carpas de Techo en La Serena al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"08:30": 5, "09:30": 4}),
    },
    {
      id: "r41",
      nombre: "Estudio Imugi Do Coyhaique",
      categoria: "aventura",
      categoria_real: "Escuela de equitación", // dato real, informativo
      tags: ["aventura"],
      precio: 35000, // ESTIMADO
      duracion_min: 225, // ESTIMADO
      ubicacion: { lat: -45.5736946, lng: -72.058462, comuna: "Coyhaique" }, // lat/lng reales
      energia: "alta", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: false, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["08:30", "09:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Estudio Imugi Do Coyhaique en Coyhaique al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"08:30": 8, "09:30": 5}),
    },
    {
      id: "r42",
      nombre: "Cabañas Olmué",
      categoria: "aventura",
      categoria_real: "Tirolesa / zipline", // dato real, informativo
      tags: ["aventura"],
      precio: 20000, // ESTIMADO
      duracion_min: 135, // ESTIMADO
      ubicacion: { lat: -32.9887051, lng: -71.1625586, comuna: "Olmué" }, // lat/lng reales
      energia: "alta", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: false, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["08:30", "09:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Cabañas Olmué en Olmué al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"08:30": 5, "09:30": 4}),
    },
    {
      id: "r43",
      nombre: "Trekking por la Sierra Baguales desde Puerto Natales con recogida en el hotel",
      categoria: "aventura",
      categoria_real: "Trekking", // dato real, informativo
      tags: ["aventura"],
      precio: 31000, // ESTIMADO
      duracion_min: 195, // ESTIMADO
      ubicacion: { lat: -51.72665, lng: -72.505098, comuna: "Puerto Natales" }, // lat/lng reales
      energia: "alta", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: false, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["08:30", "09:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Trekking por la Sierra Baguales desde Puerto Natales con recogida en el hotel en Puerto Natales al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"08:30": 8, "09:30": 4}),
    },
    {
      id: "r44",
      nombre: "HELILOG",
      categoria: "aventura",
      categoria_real: "Vuelo en helicóptero", // dato real, informativo
      tags: ["aventura"],
      precio: 20000, // ESTIMADO
      duracion_min: 195, // ESTIMADO
      ubicacion: { lat: -34.1405277, lng: -70.7705701, comuna: "Rancagua" }, // lat/lng reales
      energia: "alta", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: false, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["08:30", "09:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con HELILOG en Rancagua al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"08:30": 4, "09:30": 5}),
    },
    {
      id: "r45",
      nombre: "Domos Maitencillo - Tent",
      categoria: "relax",
      categoria_real: "Domo geodésico", // dato real, informativo
      tags: ["relax"],
      precio: 35000, // ESTIMADO
      duracion_min: 150, // ESTIMADO
      ubicacion: { lat: -32.6356392, lng: -71.4188308, comuna: "Maitencillo" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 5, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["10:00", "12:00", "16:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Domos Maitencillo - Tent en Maitencillo al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 8, "12:00": 6, "16:00": 4}),
    },
    {
      id: "r46",
      nombre: "Mecal Spa.",
      categoria: "relax",
      categoria_real: "Masajes", // dato real, informativo
      tags: ["relax"],
      precio: 27000, // ESTIMADO
      duracion_min: 120, // ESTIMADO
      ubicacion: { lat: -18.4731839, lng: -70.2892708, comuna: "Arica" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["10:00", "12:00", "16:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Mecal Spa. en Arica al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 5, "12:00": 5, "16:00": 8}),
    },
    {
      id: "r47",
      nombre: "Frutas Austral Spa",
      categoria: "relax",
      categoria_real: "Hidromasaje", // dato real, informativo
      tags: ["relax"],
      precio: 17000, // ESTIMADO
      duracion_min: 105, // ESTIMADO
      ubicacion: { lat: -36.6044983, lng: -72.0948778, comuna: "Chillán" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["10:00", "12:00", "16:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Frutas Austral Spa en Chillán al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 4, "12:00": 8, "16:00": 4}),
    },
    {
      id: "r48",
      nombre: "Mandala Andino",
      categoria: "relax",
      categoria_real: "Tinaja caliente / hot tub", // dato real, informativo
      tags: ["relax"],
      precio: 21000, // ESTIMADO
      duracion_min: 150, // ESTIMADO
      ubicacion: { lat: -51.7280766, lng: -72.5082831, comuna: "Puerto Natales" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 5, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["10:00", "12:00", "16:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Mandala Andino en Puerto Natales al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 6, "12:00": 8, "16:00": 8}),
    },
    {
      id: "r49",
      nombre: "Cabañas Sol de Montaña",
      categoria: "relax",
      categoria_real: "Cabañas con tinaja", // dato real, informativo
      tags: ["relax"],
      precio: 31000, // ESTIMADO
      duracion_min: 60, // ESTIMADO
      ubicacion: { lat: -43.3389319, lng: -72.0198855, comuna: "Futaleufú" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["10:00", "12:00", "16:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Cabañas Sol de Montaña en Futaleufú al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 5, "12:00": 6, "16:00": 5}),
    },
    {
      id: "r50",
      nombre: "Cabañas del Bosque Huilo Huilo",
      categoria: "relax",
      categoria_real: "Camping con baño privado", // dato real, informativo
      tags: ["relax"],
      precio: 36000, // ESTIMADO
      duracion_min: 105, // ESTIMADO
      ubicacion: { lat: -39.8692363, lng: -71.9144796, comuna: "Panguipulli" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: true, // ESTIMADO
      horarios: ["10:00", "12:00", "16:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Cabañas del Bosque Huilo Huilo en Panguipulli al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 8, "12:00": 4, "16:00": 8}),
    },
    {
      id: "r51",
      nombre: "Camping El Tofino",
      categoria: "relax",
      categoria_real: "Cabañas con actividades", // dato real, informativo
      tags: ["relax"],
      precio: 19000, // ESTIMADO
      duracion_min: 120, // ESTIMADO
      ubicacion: { lat: -30.005114, lng: -70.528476, comuna: "Vicuña" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: true, // ESTIMADO
      horarios: ["10:00", "12:00", "16:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Camping El Tofino en Vicuña al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 6, "12:00": 4, "16:00": 8}),
    },
    {
      id: "r52",
      nombre: "Equipment chile spa",
      categoria: "relax",
      categoria_real: "Spa", // dato real, informativo
      tags: ["relax"],
      precio: 33000, // ESTIMADO
      duracion_min: 75, // ESTIMADO
      ubicacion: { lat: -27.3803279, lng: -70.3353304, comuna: "Copiapó" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["10:00", "12:00", "16:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Equipment chile spa en Copiapó al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 4, "12:00": 4, "16:00": 6}),
    },
    {
      id: "r53",
      nombre: "Hilton Garden Inn Iquique",
      categoria: "relax",
      categoria_real: "Hidromasaje", // dato real, informativo
      tags: ["relax"],
      precio: 40000, // ESTIMADO
      duracion_min: 135, // ESTIMADO
      ubicacion: { lat: -20.237077, lng: -70.1468136, comuna: "Iquique" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["10:00", "12:00", "16:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Hilton Garden Inn Iquique en Iquique al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 4, "12:00": 4, "16:00": 5}),
    },
    {
      id: "r54",
      nombre: "sociedad de inversiones mundo spa",
      categoria: "relax",
      categoria_real: "Masajes", // dato real, informativo
      tags: ["relax"],
      precio: 31000, // ESTIMADO
      duracion_min: 105, // ESTIMADO
      ubicacion: { lat: -33.5594887, lng: -70.5840215, comuna: "La Florida" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: true, // ESTIMADO
      horarios: ["10:00", "12:00", "16:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con sociedad de inversiones mundo spa en La Florida al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 8, "12:00": 4, "16:00": 8}),
    },
    {
      id: "r55",
      nombre: "Ngahu",
      categoria: "relax",
      categoria_real: "Hospedaje en árbol", // dato real, informativo
      tags: ["relax"],
      precio: 16000, // ESTIMADO
      duracion_min: 60, // ESTIMADO
      ubicacion: { lat: -27.1495285, lng: -109.4321744, comuna: "Hanga Roa" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["10:00", "12:00", "16:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Ngahu en Hanga Roa al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 4, "12:00": 8, "16:00": 8}),
    },
    {
      id: "r56",
      nombre: "Deuman Austral SpA",
      categoria: "relax",
      categoria_real: "Masajes", // dato real, informativo
      tags: ["relax"],
      precio: 19000, // ESTIMADO
      duracion_min: 150, // ESTIMADO
      ubicacion: { lat: -45.5877005, lng: -72.0738316, comuna: "Coyhaique" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 5, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["10:00", "12:00", "16:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Deuman Austral SpA en Coyhaique al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 6, "12:00": 4, "16:00": 6}),
    },
    {
      id: "r57",
      nombre: "Arturo Aurelio Guajardo Laport",
      categoria: "relax",
      categoria_real: "Sauna", // dato real, informativo
      tags: ["relax"],
      precio: 21000, // ESTIMADO
      duracion_min: 150, // ESTIMADO
      ubicacion: { lat: -35.4151213, lng: -71.6575751, comuna: "Talca" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["10:00", "12:00", "16:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Arturo Aurelio Guajardo Laport en Talca al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 6, "12:00": 5, "16:00": 4}),
    },
    {
      id: "r58",
      nombre: "Paisajismo y servicios oasis Spa",
      categoria: "relax",
      categoria_real: "Spa", // dato real, informativo
      tags: ["relax"],
      precio: 38000, // ESTIMADO
      duracion_min: 105, // ESTIMADO
      ubicacion: { lat: -22.4619887, lng: -68.9288633, comuna: "Calama" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 5, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["10:00", "12:00", "16:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Paisajismo y servicios oasis Spa en Calama al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 8, "12:00": 6, "16:00": 4}),
    },
    {
      id: "r59",
      nombre: "Altos de Pichilemu",
      categoria: "relax",
      categoria_real: "Camping con baño privado", // dato real, informativo
      tags: ["relax"],
      precio: 40000, // ESTIMADO
      duracion_min: 105, // ESTIMADO
      ubicacion: { lat: -34.4115658, lng: -72.0230274, comuna: "Pichilemu" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["10:00", "12:00", "16:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Altos de Pichilemu en Pichilemu al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 8, "12:00": 8, "16:00": 4}),
    },
    {
      id: "r60",
      nombre: "Tiny Home Pucón",
      categoria: "relax",
      categoria_real: "Tinaja caliente / hot tub", // dato real, informativo
      tags: ["relax"],
      precio: 38000, // ESTIMADO
      duracion_min: 105, // ESTIMADO
      ubicacion: { lat: -39.308261, lng: -71.9211193, comuna: "Pucón" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["10:00", "12:00", "16:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Tiny Home Pucón en Pucón al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 8, "12:00": 5, "16:00": 6}),
    },
    {
      id: "r61",
      nombre: "Udumbara, centro de terapias naturales",
      categoria: "relax",
      categoria_real: "Masajes relajantes", // dato real, informativo
      tags: ["relax"],
      precio: 28000, // ESTIMADO
      duracion_min: 150, // ESTIMADO
      ubicacion: { lat: -36.8213936, lng: -73.0377164, comuna: "Concepción" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["10:00", "12:00", "16:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Udumbara, centro de terapias naturales en Concepción al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 5, "12:00": 8, "16:00": 6}),
    },
    {
      id: "r62",
      nombre: "Encasadepatricia",
      categoria: "relax",
      categoria_real: "Spa", // dato real, informativo
      tags: ["relax"],
      precio: 25000, // ESTIMADO
      duracion_min: 90, // ESTIMADO
      ubicacion: { lat: -33.1077503, lng: -71.6951548, comuna: "Valparaíso" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["10:00", "12:00", "16:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Encasadepatricia en Valparaíso al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 8, "12:00": 8, "16:00": 4}),
    },
    {
      id: "r63",
      nombre: "Marbella Bienestar",
      categoria: "relax",
      categoria_real: "Masajes", // dato real, informativo
      tags: ["relax"],
      precio: 16000, // ESTIMADO
      duracion_min: 75, // ESTIMADO
      ubicacion: { lat: -18.4745837, lng: -70.2897252, comuna: "Arica" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["10:00", "12:00", "16:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Marbella Bienestar en Arica al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 6, "12:00": 4, "16:00": 4}),
    },
    {
      id: "r64",
      nombre: "Cabañas Cacique Pissero",
      categoria: "relax",
      categoria_real: "Cabañas con tinaja", // dato real, informativo
      tags: ["relax"],
      precio: 39000, // ESTIMADO
      duracion_min: 150, // ESTIMADO
      ubicacion: { lat: -36.1371996, lng: -72.7996911, comuna: "Cobquecura" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 5, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["10:00", "12:00", "16:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Cabañas Cacique Pissero en Cobquecura al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 4, "12:00": 8, "16:00": 6}),
    },
    {
      id: "r65",
      nombre: "Puerto Masajes",
      categoria: "relax",
      categoria_real: "Retiro espiritual", // dato real, informativo
      tags: ["relax"],
      precio: 39000, // ESTIMADO
      duracion_min: 120, // ESTIMADO
      ubicacion: { lat: -51.7261915, lng: -72.4972419, comuna: "Puerto Natales" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["10:00", "12:00", "16:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Puerto Masajes en Puerto Natales al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 6, "12:00": 8, "16:00": 5}),
    },
    {
      id: "r66",
      nombre: "Cabañas Ancud - Two-Bedroom Apartment",
      categoria: "relax",
      categoria_real: "Cabañas con actividades", // dato real, informativo
      tags: ["relax"],
      precio: 24000, // ESTIMADO
      duracion_min: 75, // ESTIMADO
      ubicacion: { lat: -41.8717308, lng: -73.8058014, comuna: "Ancud" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["10:00", "12:00", "16:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Cabañas Ancud - Two-Bedroom Apartment en Ancud al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 8, "12:00": 8, "16:00": 6}),
    },
    {
      id: "r67",
      nombre: "Bergsport",
      categoria: "cultural",
      categoria_real: "Tour histórico", // dato real, informativo
      tags: ["cultural"],
      precio: 20000, // ESTIMADO
      duracion_min: 105, // ESTIMADO
      ubicacion: { lat: -20.2448162, lng: -70.1388493, comuna: "Iquique" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: true, // ESTIMADO
      horarios: ["10:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Bergsport en Iquique al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 4, "15:00": 4, "17:00": 8}),
    },
    {
      id: "r68",
      nombre: "La Tienda Fotoshop",
      categoria: "cultural",
      categoria_real: "Taller de fotografía", // dato real, informativo
      tags: ["cultural"],
      precio: 18000, // ESTIMADO
      duracion_min: 75, // ESTIMADO
      ubicacion: { lat: -33.5110834, lng: -70.7570949, comuna: "Maipú" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: true, // ESTIMADO
      horarios: ["10:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con La Tienda Fotoshop en Maipú al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 4, "15:00": 6, "17:00": 4}),
    },
    {
      id: "r69",
      nombre: "La Parra Cerámica",
      categoria: "cultural",
      categoria_real: "Taller de cerámica", // dato real, informativo
      tags: ["cultural"],
      precio: 13000, // ESTIMADO
      duracion_min: 90, // ESTIMADO
      ubicacion: { lat: -38.7429678, lng: -72.6492259, comuna: "Temuco" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["10:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con La Parra Cerámica en Temuco al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 5, "15:00": 8, "17:00": 4}),
    },
    {
      id: "r70",
      nombre: "Kaufmann Arica",
      categoria: "cultural",
      categoria_real: "Taller de arte", // dato real, informativo
      tags: ["cultural"],
      precio: 9000, // ESTIMADO
      duracion_min: 90, // ESTIMADO
      ubicacion: { lat: -18.4655096, lng: -70.2923903, comuna: "Arica" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: true, // ESTIMADO
      horarios: ["10:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Kaufmann Arica en Arica al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 5, "15:00": 4, "17:00": 5}),
    },
    {
      id: "r71",
      nombre: "Rayun Montessori",
      categoria: "cultural",
      categoria_real: "Escuela de circo", // dato real, informativo
      tags: ["cultural"],
      precio: 8000, // ESTIMADO
      duracion_min: 60, // ESTIMADO
      ubicacion: { lat: -27.3629832, lng: -70.3280179, comuna: "Copiapó" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: true, // ESTIMADO
      horarios: ["10:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Rayun Montessori en Copiapó al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 5, "15:00": 5, "17:00": 8}),
    },
    {
      id: "r72",
      nombre: "Puuy Producciones",
      categoria: "cultural",
      categoria_real: "Experiencia inmersiva", // dato real, informativo
      tags: ["cultural"],
      precio: 20000, // ESTIMADO
      duracion_min: 120, // ESTIMADO
      ubicacion: { lat: -53.1417673, lng: -70.9062672, comuna: "Punta Arenas" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["10:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Puuy Producciones en Punta Arenas al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 6, "15:00": 8, "17:00": 4}),
    },
    {
      id: "r73",
      nombre: "Parabrisas Partavic",
      categoria: "cultural",
      categoria_real: "Taller de cerámica", // dato real, informativo
      tags: ["cultural"],
      precio: 16000, // ESTIMADO
      duracion_min: 90, // ESTIMADO
      ubicacion: { lat: -23.6186695, lng: -70.3841232, comuna: "Antofagasta" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 5, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["10:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Parabrisas Partavic en Antofagasta al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 8, "15:00": 6, "17:00": 5}),
    },
    {
      id: "r74",
      nombre: "Taller de Artes y Diseño",
      categoria: "cultural",
      categoria_real: "Taller de cerámica", // dato real, informativo
      tags: ["cultural"],
      precio: 16000, // ESTIMADO
      duracion_min: 60, // ESTIMADO
      ubicacion: { lat: -34.9854967, lng: -71.2317825, comuna: "Curicó" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["10:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Taller de Artes y Diseño en Curicó al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 6, "15:00": 5, "17:00": 5}),
    },
    {
      id: "r75",
      nombre: "ESCUELA DE MÚSICA Y ARTES INTEGRADAS DE COYHAIQUE",
      categoria: "cultural",
      categoria_real: "Clases de música", // dato real, informativo
      tags: ["cultural"],
      precio: 13000, // ESTIMADO
      duracion_min: 90, // ESTIMADO
      ubicacion: { lat: -45.5819507, lng: -72.0673822, comuna: "Coyhaique" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["10:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con ESCUELA DE MÚSICA Y ARTES INTEGRADAS DE COYHAIQUE en Coyhaique al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 4, "15:00": 5, "17:00": 5}),
    },
    {
      id: "r76",
      nombre: "....",
      categoria: "cultural",
      categoria_real: "Escuela de circo", // dato real, informativo
      tags: ["cultural"],
      precio: 20000, // ESTIMADO
      duracion_min: 75, // ESTIMADO
      ubicacion: { lat: -39.8228661, lng: -73.2490827, comuna: "Valdivia" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["10:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con .... en Valdivia al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 5, "15:00": 5, "17:00": 5}),
    },
    {
      id: "r77",
      nombre: "Academia de Música Bemol",
      categoria: "cultural",
      categoria_real: "Clases de música", // dato real, informativo
      tags: ["cultural"],
      precio: 19000, // ESTIMADO
      duracion_min: 90, // ESTIMADO
      ubicacion: { lat: -36.6020492, lng: -72.0953284, comuna: "Chillán" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 5, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["10:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Academia de Música Bemol en Chillán al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 5, "15:00": 4, "17:00": 8}),
    },
    {
      id: "r78",
      nombre: "Romero Estudio Fotografico",
      categoria: "cultural",
      categoria_real: "Clases de fotografía", // dato real, informativo
      tags: ["cultural"],
      precio: 18000, // ESTIMADO
      duracion_min: 120, // ESTIMADO
      ubicacion: { lat: -34.15317, lng: -70.7646199, comuna: "Rancagua" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["10:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Romero Estudio Fotografico en Rancagua al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 8, "15:00": 8, "17:00": 6}),
    },
    {
      id: "r79",
      nombre: "NEUMOTOR",
      categoria: "cultural",
      categoria_real: "Taller de arte", // dato real, informativo
      tags: ["cultural"],
      precio: 11000, // ESTIMADO
      duracion_min: 120, // ESTIMADO
      ubicacion: { lat: -37.4642395, lng: -72.3534993, comuna: "Los Ángeles" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["10:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con NEUMOTOR en Los Ángeles al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 5, "15:00": 4, "17:00": 4}),
    },
    {
      id: "r80",
      nombre: "Fundación Cades - Puerto Montt",
      categoria: "cultural",
      categoria_real: "Escuela de circo", // dato real, informativo
      tags: ["cultural"],
      precio: 17000, // ESTIMADO
      duracion_min: 75, // ESTIMADO
      ubicacion: { lat: -41.4603558, lng: -72.9419175, comuna: "Puerto Montt" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["10:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Fundación Cades - Puerto Montt en Puerto Montt al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 8, "15:00": 8, "17:00": 5}),
    },
    {
      id: "r81",
      nombre: "Estudio El Muro",
      categoria: "cultural",
      categoria_real: "Clases de baile", // dato real, informativo
      tags: ["cultural"],
      precio: 10000, // ESTIMADO
      duracion_min: 90, // ESTIMADO
      ubicacion: { lat: -33.027729, lng: -71.5409698, comuna: "Valparaíso" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["10:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Estudio El Muro en Valparaíso al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 5, "15:00": 6, "17:00": 5}),
    },
    {
      id: "r82",
      nombre: "Mar de Estrellas",
      categoria: "cultural",
      categoria_real: "Tour histórico", // dato real, informativo
      tags: ["cultural"],
      precio: 13000, // ESTIMADO
      duracion_min: 75, // ESTIMADO
      ubicacion: { lat: -30.6595348, lng: -70.7631966, comuna: "Coquimbo" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["10:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Mar de Estrellas en Coquimbo al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 4, "15:00": 6, "17:00": 4}),
    },
    {
      id: "r83",
      nombre: "Pintor automovil el joselito",
      categoria: "cultural",
      categoria_real: "Taller de pintura", // dato real, informativo
      tags: ["cultural"],
      precio: 10000, // ESTIMADO
      duracion_min: 90, // ESTIMADO
      ubicacion: { lat: -20.2115147, lng: -70.1340838, comuna: "Iquique" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["10:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Pintor automovil el joselito en Iquique al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 4, "15:00": 8, "17:00": 6}),
    },
    {
      id: "r84",
      nombre: "Cerrajería Guzmán",
      categoria: "cultural",
      categoria_real: "Taller de pintura", // dato real, informativo
      tags: ["cultural"],
      precio: 10000, // ESTIMADO
      duracion_min: 60, // ESTIMADO
      ubicacion: { lat: -33.5100164, lng: -70.7926627, comuna: "Maipú" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["10:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Cerrajería Guzmán en Maipú al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 8, "15:00": 4, "17:00": 5}),
    },
    {
      id: "r85",
      nombre: "Valentina - Estudio de Fotografía",
      categoria: "cultural",
      categoria_real: "Taller de fotografía", // dato real, informativo
      tags: ["cultural"],
      precio: 17000, // ESTIMADO
      duracion_min: 120, // ESTIMADO
      ubicacion: { lat: -38.7390529, lng: -72.6183465, comuna: "Temuco" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["10:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Valentina - Estudio de Fotografía en Temuco al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 8, "15:00": 5, "17:00": 8}),
    },
    {
      id: "r86",
      nombre: "Museo Arqueológico San Miguel de Azapa",
      categoria: "cultural",
      categoria_real: "Museo interactivo", // dato real, informativo
      tags: ["cultural"],
      precio: 9000, // ESTIMADO
      duracion_min: 75, // ESTIMADO
      ubicacion: { lat: -18.5164739, lng: -70.1811489, comuna: "Arica" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["10:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Museo Arqueológico San Miguel de Azapa en Arica al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 6, "15:00": 8, "17:00": 6}),
    },
    {
      id: "r87",
      nombre: "Studio Pole Fitness",
      categoria: "cultural",
      categoria_real: "Escuela de circo", // dato real, informativo
      tags: ["cultural"],
      precio: 18000, // ESTIMADO
      duracion_min: 105, // ESTIMADO
      ubicacion: { lat: -27.3670887, lng: -70.331482, comuna: "Copiapó" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: true, // ESTIMADO
      horarios: ["10:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Studio Pole Fitness en Copiapó al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 5, "15:00": 4, "17:00": 5}),
    },
    {
      id: "r88",
      nombre: "Tienda Mundo Manual",
      categoria: "cultural",
      categoria_real: "Taller de circo", // dato real, informativo
      tags: ["cultural"],
      precio: 19000, // ESTIMADO
      duracion_min: 90, // ESTIMADO
      ubicacion: { lat: -53.1567958, lng: -70.904635, comuna: "Punta Arenas" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: true, // ESTIMADO
      horarios: ["10:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Tienda Mundo Manual en Punta Arenas al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"10:00": 6, "15:00": 5, "17:00": 5}),
    },
    {
      id: "r89",
      nombre: "El Supremo Chef II",
      categoria: "foodie",
      categoria_real: "Chef a domicilio", // dato real, informativo
      tags: ["foodie"],
      precio: 17000, // ESTIMADO
      duracion_min: 120, // ESTIMADO
      ubicacion: { lat: -41.4605516, lng: -72.9540378, comuna: "Puerto Montt" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 5, // ESTIMADO
      hero_moment: true, // ESTIMADO
      horarios: ["12:30", "19:00", "20:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con El Supremo Chef II en Puerto Montt al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"12:30": 5, "19:00": 4, "20:30": 6}),
    },
    {
      id: "r90",
      nombre: "Varsovienne",
      categoria: "foodie",
      categoria_real: "Tour de chocolates", // dato real, informativo
      tags: ["foodie"],
      precio: 15000, // ESTIMADO
      duracion_min: 90, // ESTIMADO
      ubicacion: { lat: -35.4334781, lng: -71.629633, comuna: "Talca" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["12:30", "19:00", "20:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Varsovienne en Talca al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"12:30": 5, "19:00": 5, "20:30": 6}),
    },
    {
      id: "r91",
      nombre: "DULCE ESTRELLA",
      categoria: "foodie",
      categoria_real: "Taller de pastelería", // dato real, informativo
      tags: ["foodie"],
      precio: 23000, // ESTIMADO
      duracion_min: 150, // ESTIMADO
      ubicacion: { lat: -27.3681685, lng: -70.3245578, comuna: "Copiapó" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["12:30", "19:00", "20:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con DULCE ESTRELLA en Copiapó al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"12:30": 4, "19:00": 8, "20:30": 8}),
    },
    {
      id: "r92",
      nombre: "Parrilla & Restaurant El Corralero",
      categoria: "foodie",
      categoria_real: "Cena en la oscuridad", // dato real, informativo
      tags: ["foodie"],
      precio: 17000, // ESTIMADO
      duracion_min: 135, // ESTIMADO
      ubicacion: { lat: -38.7414959, lng: -72.5924612, comuna: "Temuco" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["12:30", "19:00", "20:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Parrilla & Restaurant El Corralero en Temuco al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"12:30": 6, "19:00": 8, "20:30": 5}),
    },
    {
      id: "r93",
      nombre: "Ficus Restaurante",
      categoria: "foodie",
      categoria_real: "Cena en la oscuridad", // dato real, informativo
      tags: ["foodie"],
      precio: 26000, // ESTIMADO
      duracion_min: 120, // ESTIMADO
      ubicacion: { lat: -36.603014, lng: -72.109585, comuna: "Chillán" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 5, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["12:30", "19:00", "20:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Ficus Restaurante en Chillán al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"12:30": 8, "19:00": 6, "20:30": 8}),
    },
    {
      id: "r94",
      nombre: "Pastas La Ruffina",
      categoria: "foodie",
      categoria_real: "Chef a domicilio", // dato real, informativo
      tags: ["foodie"],
      precio: 29000, // ESTIMADO
      duracion_min: 135, // ESTIMADO
      ubicacion: { lat: -33.4348917, lng: -70.6172669, comuna: "Providencia" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["12:30", "19:00", "20:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Pastas La Ruffina en Providencia al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"12:30": 6, "19:00": 8, "20:30": 5}),
    },
    {
      id: "r95",
      nombre: "Casadochocolateiqq",
      categoria: "foodie",
      categoria_real: "Tour de chocolates", // dato real, informativo
      tags: ["foodie"],
      precio: 28000, // ESTIMADO
      duracion_min: 120, // ESTIMADO
      ubicacion: { lat: -20.277025, lng: -70.126101, comuna: "Iquique" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 5, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["12:30", "19:00", "20:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Casadochocolateiqq en Iquique al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"12:30": 8, "19:00": 5, "20:30": 8}),
    },
    {
      id: "r96",
      nombre: "Caféteria La Vida Es Bella",
      categoria: "foodie",
      categoria_real: "Cata de café", // dato real, informativo
      tags: ["foodie"],
      precio: 27000, // ESTIMADO
      duracion_min: 90, // ESTIMADO
      ubicacion: { lat: -34.1590965, lng: -70.7381824, comuna: "Rancagua" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: true, // ESTIMADO
      horarios: ["12:30", "19:00", "20:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Caféteria La Vida Es Bella en Rancagua al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"12:30": 8, "19:00": 6, "20:30": 6}),
    },
    {
      id: "r97",
      nombre: "Quila Café",
      categoria: "foodie",
      categoria_real: "Cata de café", // dato real, informativo
      tags: ["foodie"],
      precio: 21000, // ESTIMADO
      duracion_min: 150, // ESTIMADO
      ubicacion: { lat: -39.8173103, lng: -73.2425938, comuna: "Valdivia" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["12:30", "19:00", "20:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Quila Café en Valdivia al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"12:30": 4, "19:00": 4, "20:30": 5}),
    },
    {
      id: "r98",
      nombre: "RESTAURANT UMAMI LA SERENA",
      categoria: "foodie",
      categoria_real: "Cena en la oscuridad", // dato real, informativo
      tags: ["foodie"],
      precio: 30000, // ESTIMADO
      duracion_min: 120, // ESTIMADO
      ubicacion: { lat: -29.9270044, lng: -71.2460693, comuna: "La Serena" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["12:30", "19:00", "20:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con RESTAURANT UMAMI LA SERENA en La Serena al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"12:30": 8, "19:00": 8, "20:30": 5}),
    },
    {
      id: "r99",
      nombre: "Patio 511 Club Español de Reñaca",
      categoria: "foodie",
      categoria_real: "Cena en la oscuridad", // dato real, informativo
      tags: ["foodie"],
      precio: 22000, // ESTIMADO
      duracion_min: 150, // ESTIMADO
      ubicacion: { lat: -32.9708747, lng: -71.5313491, comuna: "Viña del Mar" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["12:30", "19:00", "20:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Patio 511 Club Español de Reñaca en Viña del Mar al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"12:30": 6, "19:00": 6, "20:30": 5}),
    },
    {
      id: "r100",
      nombre: "La oveja Cooking class",
      categoria: "foodie",
      categoria_real: "Clases de cocina", // dato real, informativo
      tags: ["foodie"],
      precio: 15000, // ESTIMADO
      duracion_min: 105, // ESTIMADO
      ubicacion: { lat: -37.0608324, lng: -88.1804, comuna: "Punta Arenas" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["12:30", "19:00", "20:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con La oveja Cooking class en Punta Arenas al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"12:30": 5, "19:00": 5, "20:30": 6}),
    },
    {
      id: "r101",
      nombre: "Experiencia Brava",
      categoria: "foodie",
      categoria_real: "Tour de café", // dato real, informativo
      tags: ["foodie"],
      precio: 35000, // ESTIMADO
      duracion_min: 120, // ESTIMADO
      ubicacion: { lat: -45.8255799, lng: -72.6214936, comuna: "Coyhaique" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["12:30", "19:00", "20:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Experiencia Brava en Coyhaique al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"12:30": 5, "19:00": 5, "20:30": 4}),
    },
    {
      id: "r102",
      nombre: "Confitería Mazapan Chocolates",
      categoria: "foodie",
      categoria_real: "Cata de chocolate", // dato real, informativo
      tags: ["foodie"],
      precio: 16000, // ESTIMADO
      duracion_min: 150, // ESTIMADO
      ubicacion: { lat: -18.4782288, lng: -70.3205923, comuna: "Arica" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["12:30", "19:00", "20:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Confitería Mazapan Chocolates en Arica al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"12:30": 5, "19:00": 5, "20:30": 8}),
    },
    {
      id: "r103",
      nombre: "DERKAFFIE Coffeeshop",
      categoria: "foodie",
      categoria_real: "Clases de barismo", // dato real, informativo
      tags: ["foodie"],
      precio: 33000, // ESTIMADO
      duracion_min: 105, // ESTIMADO
      ubicacion: { lat: -23.5915572, lng: -70.384178, comuna: "Antofagasta" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["12:30", "19:00", "20:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con DERKAFFIE Coffeeshop en Antofagasta al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"12:30": 6, "19:00": 8, "20:30": 5}),
    },
    {
      id: "r104",
      nombre: "Raúl Antonio Muñoz Muñoz reparación de arranques y alternadores",
      categoria: "foodie",
      categoria_real: "Taller de pastelería", // dato real, informativo
      tags: ["foodie"],
      precio: 27000, // ESTIMADO
      duracion_min: 105, // ESTIMADO
      ubicacion: { lat: -37.4529521, lng: -72.3289281, comuna: "Los Ángeles" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["12:30", "19:00", "20:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Raúl Antonio Muñoz Muñoz reparación de arranques y alternadores en Los Ángeles al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"12:30": 8, "19:00": 4, "20:30": 6}),
    },
    {
      id: "r105",
      nombre: "PANADERIA Y PASTELERIA TENEB",
      categoria: "foodie",
      categoria_real: "Taller de pastelería", // dato real, informativo
      tags: ["foodie"],
      precio: 16000, // ESTIMADO
      duracion_min: 135, // ESTIMADO
      ubicacion: { lat: -40.5807437, lng: -73.163829, comuna: "Osorno" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["12:30", "19:00", "20:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con PANADERIA Y PASTELERIA TENEB en Osorno al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"12:30": 6, "19:00": 8, "20:30": 8}),
    },
    {
      id: "r106",
      nombre: "Primates Tostadores",
      categoria: "foodie",
      categoria_real: "Clases de barismo", // dato real, informativo
      tags: ["foodie"],
      precio: 20000, // ESTIMADO
      duracion_min: 90, // ESTIMADO
      ubicacion: { lat: -35.4290162, lng: -71.6259895, comuna: "Talca" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["12:30", "19:00", "20:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Primates Tostadores en Talca al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"12:30": 4, "19:00": 8, "20:30": 5}),
    },
    {
      id: "r107",
      nombre: "Copa dorada",
      categoria: "foodie",
      categoria_real: "Tour de café", // dato real, informativo
      tags: ["foodie"],
      precio: 32000, // ESTIMADO
      duracion_min: 90, // ESTIMADO
      ubicacion: { lat: -27.37168, lng: -70.33152, comuna: "Copiapó" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["12:30", "19:00", "20:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Copa dorada en Copiapó al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"12:30": 8, "19:00": 4, "20:30": 4}),
    },
    {
      id: "r108",
      nombre: "BEAKERS",
      categoria: "foodie",
      categoria_real: "Cena en la oscuridad", // dato real, informativo
      tags: ["foodie"],
      precio: 26000, // ESTIMADO
      duracion_min: 90, // ESTIMADO
      ubicacion: { lat: -38.739204, lng: -72.6104497, comuna: "Temuco" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["12:30", "19:00", "20:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con BEAKERS en Temuco al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"12:30": 8, "19:00": 8, "20:30": 6}),
    },
    {
      id: "r109",
      nombre: "Restaurante Pensión Valdés",
      categoria: "foodie",
      categoria_real: "Cena en la oscuridad", // dato real, informativo
      tags: ["foodie"],
      precio: 22000, // ESTIMADO
      duracion_min: 135, // ESTIMADO
      ubicacion: { lat: -36.6109309, lng: -72.0992906, comuna: "Chillán" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: true, // ESTIMADO
      horarios: ["12:30", "19:00", "20:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Restaurante Pensión Valdés en Chillán al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"12:30": 4, "19:00": 8, "20:30": 4}),
    },
    {
      id: "r110",
      nombre: "Ecordua - Adventures & Ecotourism",
      categoria: "foodie",
      categoria_real: "Tour de café", // dato real, informativo
      tags: ["foodie"],
      precio: 33000, // ESTIMADO
      duracion_min: 105, // ESTIMADO
      ubicacion: { lat: -33.4300168, lng: -70.6079782, comuna: "Santiago" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["12:30", "19:00", "20:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Ecordua - Adventures & Ecotourism en Santiago al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"12:30": 5, "19:00": 6, "20:30": 4}),
    },
    {
      id: "r111",
      nombre: "Mieles del Sur",
      categoria: "romantico",
      categoria_real: "Tour de miel", // dato real, informativo
      tags: ["romantico"],
      precio: 35000, // ESTIMADO
      duracion_min: 120, // ESTIMADO
      ubicacion: { lat: -41.10363, lng: -73.0767059, comuna: "Frutillar" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 5, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["17:30", "18:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Mieles del Sur en Frutillar al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"17:30": 6, "18:30": 6}),
    },
    {
      id: "r112",
      nombre: "Rauco Mirador",
      categoria: "romantico",
      categoria_real: "Mirador turístico", // dato real, informativo
      tags: ["romantico"],
      precio: 35000, // ESTIMADO
      duracion_min: 60, // ESTIMADO
      ubicacion: { lat: -34.9251901, lng: -71.3285546, comuna: "Curicó" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: true, // ESTIMADO
      horarios: ["17:30", "18:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Rauco Mirador en Curicó al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"17:30": 8, "18:30": 8}),
    },
    {
      id: "r113",
      nombre: "AGENCIA DE TURISMO AYA TRAVEL TOUR SPA",
      categoria: "romantico",
      categoria_real: "Tour de miel", // dato real, informativo
      tags: ["romantico"],
      precio: 24000, // ESTIMADO
      duracion_min: 75, // ESTIMADO
      ubicacion: { lat: -36.8290079, lng: -73.050789, comuna: "Concepción" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["17:30", "18:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con AGENCIA DE TURISMO AYA TRAVEL TOUR SPA en Concepción al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"17:30": 8, "18:30": 6}),
    },
    {
      id: "r114",
      nombre: "Nautica Rapanui",
      categoria: "romantico",
      categoria_real: "Paseo en bote", // dato real, informativo
      tags: ["romantico"],
      precio: 24000, // ESTIMADO
      duracion_min: 90, // ESTIMADO
      ubicacion: { lat: -27.1467834, lng: -109.4309017, comuna: "Hanga Roa" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["17:30", "18:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Nautica Rapanui en Hanga Roa al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"17:30": 8, "18:30": 5}),
    },
    {
      id: "r115",
      nombre: "Club Aéreo de Pichilemu",
      categoria: "romantico",
      categoria_real: "Paseo en globo aerostático", // dato real, informativo
      tags: ["romantico"],
      precio: 33000, // ESTIMADO
      duracion_min: 75, // ESTIMADO
      ubicacion: { lat: -34.3937223, lng: -72.0181383, comuna: "Pichilemu" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["17:30", "18:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Club Aéreo de Pichilemu en Pichilemu al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"17:30": 5, "18:30": 4}),
    },
    {
      id: "r116",
      nombre: "Cooperativa Apicola Mishkihue",
      categoria: "romantico",
      categoria_real: "Tour de miel", // dato real, informativo
      tags: ["romantico"],
      precio: 34000, // ESTIMADO
      duracion_min: 60, // ESTIMADO
      ubicacion: { lat: -39.0988222, lng: -72.6717626, comuna: "Santiago" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["17:30", "18:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Cooperativa Apicola Mishkihue en Santiago al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"17:30": 5, "18:30": 5}),
    },
    {
      id: "r117",
      nombre: "Apiturismo Ulmorayen",
      categoria: "romantico",
      categoria_real: "Tour de miel", // dato real, informativo
      tags: ["romantico"],
      precio: 27000, // ESTIMADO
      duracion_min: 75, // ESTIMADO
      ubicacion: { lat: -39.289653, lng: -71.9479379, comuna: "Pucón" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 5, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["17:30", "18:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Apiturismo Ulmorayen en Pucón al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"17:30": 6, "18:30": 4}),
    },
    {
      id: "r118",
      nombre: "Globogonia",
      categoria: "romantico",
      categoria_real: "Paseo en globo aerostático", // dato real, informativo
      tags: ["romantico"],
      precio: 28000, // ESTIMADO
      duracion_min: 90, // ESTIMADO
      ubicacion: { lat: -53.1631099, lng: -70.8993001, comuna: "Punta Arenas" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: true, // ESTIMADO
      horarios: ["17:30", "18:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Globogonia en Punta Arenas al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"17:30": 8, "18:30": 5}),
    },
    {
      id: "r119",
      nombre: "Cabañas el Mirador",
      categoria: "romantico",
      categoria_real: "Mirador turístico", // dato real, informativo
      tags: ["romantico"],
      precio: 26000, // ESTIMADO
      duracion_min: 120, // ESTIMADO
      ubicacion: { lat: -36.8525159, lng: -71.6381404, comuna: "Chillán" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["17:30", "18:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Cabañas el Mirador en Chillán al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"17:30": 4, "18:30": 5}),
    },
    {
      id: "r120",
      nombre: "Empanadas Miel Maitencillo",
      categoria: "romantico",
      categoria_real: "Tour de miel", // dato real, informativo
      tags: ["romantico"],
      precio: 34000, // ESTIMADO
      duracion_min: 120, // ESTIMADO
      ubicacion: { lat: -32.7208554, lng: -71.4098841, comuna: "Maitencillo" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["17:30", "18:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Empanadas Miel Maitencillo en Maitencillo al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"17:30": 4, "18:30": 8}),
    },
    {
      id: "r121",
      nombre: "Mieles de Panguipulli",
      categoria: "romantico",
      categoria_real: "Tour de miel", // dato real, informativo
      tags: ["romantico"],
      precio: 34000, // ESTIMADO
      duracion_min: 120, // ESTIMADO
      ubicacion: { lat: -39.6648554, lng: -72.3636499, comuna: "Panguipulli" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["17:30", "18:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Mieles de Panguipulli en Panguipulli al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"17:30": 5, "18:30": 4}),
    },
    {
      id: "r122",
      nombre: "Molantur Atacama Tours",
      categoria: "romantico",
      categoria_real: "Tour de miel", // dato real, informativo
      tags: ["romantico"],
      precio: 26000, // ESTIMADO
      duracion_min: 105, // ESTIMADO
      ubicacion: { lat: -22.9113452, lng: -68.2001658, comuna: "San Pedro de Atacama" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["17:30", "18:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Molantur Atacama Tours en San Pedro de Atacama al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"17:30": 6, "18:30": 6}),
    },
    {
      id: "r123",
      nombre: "Mirador Morro de Arica",
      categoria: "romantico",
      categoria_real: "Mirador turístico", // dato real, informativo
      tags: ["romantico"],
      precio: 23000, // ESTIMADO
      duracion_min: 75, // ESTIMADO
      ubicacion: { lat: -38.2424327, lng: -72.6568425, comuna: "Arica" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["17:30", "18:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Mirador Morro de Arica en Arica al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"17:30": 5, "18:30": 6}),
    },
    {
      id: "r124",
      nombre: "Club de Yates La Herradura",
      categoria: "romantico",
      categoria_real: "Paseo en bote", // dato real, informativo
      tags: ["romantico"],
      precio: 20000, // ESTIMADO
      duracion_min: 105, // ESTIMADO
      ubicacion: { lat: -29.9843675, lng: -71.3629962, comuna: "La Serena" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: true, // ESTIMADO
      horarios: ["17:30", "18:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Club de Yates La Herradura en La Serena al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"17:30": 6, "18:30": 6}),
    },
    {
      id: "r125",
      nombre: "Angostura Lacustre ~ Paseos en Barco",
      categoria: "romantico",
      categoria_real: "Paseo en bote", // dato real, informativo
      tags: ["romantico"],
      precio: 21000, // ESTIMADO
      duracion_min: 90, // ESTIMADO
      ubicacion: { lat: -40.78188, lng: -71.657049, comuna: "Puyehue" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: true, // ESTIMADO
      horarios: ["17:30", "18:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Angostura Lacustre ~ Paseos en Barco en Puyehue al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"17:30": 5, "18:30": 8}),
    },
    {
      id: "r126",
      nombre: "Werlinger Travel SouthAmerican Experience",
      categoria: "romantico",
      categoria_real: "Tour de miel", // dato real, informativo
      tags: ["romantico"],
      precio: 28000, // ESTIMADO
      duracion_min: 75, // ESTIMADO
      ubicacion: { lat: -36.833089, lng: -73.0571428, comuna: "Concepción" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["17:30", "18:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Werlinger Travel SouthAmerican Experience en Concepción al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"17:30": 6, "18:30": 4}),
    },
    {
      id: "r127",
      nombre: "Viajes Eurosol",
      categoria: "romantico",
      categoria_real: "Tour de miel", // dato real, informativo
      tags: ["romantico"],
      precio: 20000, // ESTIMADO
      duracion_min: 75, // ESTIMADO
      ubicacion: { lat: -33.4258762, lng: -70.6167004, comuna: "Santiago" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["17:30", "18:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Viajes Eurosol en Santiago al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"17:30": 4, "18:30": 5}),
    },
    {
      id: "r128",
      nombre: "Granja Apícola Araucanía",
      categoria: "romantico",
      categoria_real: "Tour de miel", // dato real, informativo
      tags: ["romantico"],
      precio: 20000, // ESTIMADO
      duracion_min: 60, // ESTIMADO
      ubicacion: { lat: -38.73398, lng: -72.58696, comuna: "Temuco" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["17:30", "18:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Granja Apícola Araucanía en Temuco al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"17:30": 8, "18:30": 8}),
    },
    {
      id: "r129",
      nombre: "Excursión a Torres del Paine + Paseo en barco por el lago Grey desde Punta Arenas con recogida en hotel",
      categoria: "romantico",
      categoria_real: "Paseo en bote", // dato real, informativo
      tags: ["romantico"],
      precio: 24000, // ESTIMADO
      duracion_min: 90, // ESTIMADO
      ubicacion: { lat: -53.162237, lng: -70.9008879, comuna: "Punta Arenas" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["17:30", "18:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Excursión a Torres del Paine + Paseo en barco por el lago Grey desde Punta Arenas con recogida en hotel en Punta Arenas al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"17:30": 8, "18:30": 6}),
    },
    {
      id: "r130",
      nombre: "cabañas Mirador Los Colihues",
      categoria: "romantico",
      categoria_real: "Mirador turístico", // dato real, informativo
      tags: ["romantico"],
      precio: 28000, // ESTIMADO
      duracion_min: 120, // ESTIMADO
      ubicacion: { lat: -36.6333873, lng: -72.2361299, comuna: "Chillán" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["17:30", "18:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con cabañas Mirador Los Colihues en Chillán al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"17:30": 8, "18:30": 8}),
    },
    {
      id: "r131",
      nombre: "Yate_Ike",
      categoria: "romantico",
      categoria_real: "Paseo en bote", // dato real, informativo
      tags: ["romantico"],
      precio: 28000, // ESTIMADO
      duracion_min: 60, // ESTIMADO
      ubicacion: { lat: -33.0407296, lng: -71.6102138, comuna: "Viña del Mar" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: true, // ESTIMADO
      horarios: ["17:30", "18:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Yate_Ike en Viña del Mar al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"17:30": 6, "18:30": 8}),
    },
    {
      id: "r132",
      nombre: "Cabañas Mirador al Río Valdivia",
      categoria: "romantico",
      categoria_real: "Mirador turístico", // dato real, informativo
      tags: ["romantico"],
      precio: 34000, // ESTIMADO
      duracion_min: 75, // ESTIMADO
      ubicacion: { lat: -39.8344321, lng: -73.2684346, comuna: "Valdivia" }, // lat/lng reales
      energia: "baja", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 5, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["17:30", "18:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Cabañas Mirador al Río Valdivia en Valdivia al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"17:30": 6, "18:30": 5}),
    },
    {
      id: "r133",
      nombre: "Kid Center",
      categoria: "familiar",
      categoria_real: "Trampoline park / cama elástica", // dato real, informativo
      tags: ["familiar"],
      precio: 10000, // ESTIMADO
      duracion_min: 105, // ESTIMADO
      ubicacion: { lat: -34.1731032, lng: -70.7230558, comuna: "Rancagua" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["11:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Kid Center en Rancagua al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 6, "15:00": 4, "17:00": 5}),
    },
    {
      id: "r134",
      nombre: "Caballero",
      categoria: "familiar",
      categoria_real: "Salón de eventos infantiles", // dato real, informativo
      tags: ["familiar"],
      precio: 17000, // ESTIMADO
      duracion_min: 150, // ESTIMADO
      ubicacion: { lat: -18.4852929, lng: -70.3129473, comuna: "Arica" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 5, // ESTIMADO
      hero_moment: true, // ESTIMADO
      horarios: ["11:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Caballero en Arica al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 8, "15:00": 6, "17:00": 5}),
    },
    {
      id: "r135",
      nombre: "Zonaplay caribe",
      categoria: "familiar",
      categoria_real: "Trampoline park / cama elástica", // dato real, informativo
      tags: ["familiar"],
      precio: 10000, // ESTIMADO
      duracion_min: 135, // ESTIMADO
      ubicacion: { lat: -20.2841562, lng: -70.1247471, comuna: "Iquique" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["11:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Zonaplay caribe en Iquique al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 6, "15:00": 6, "17:00": 8}),
    },
    {
      id: "r136",
      nombre: "Mercado Artesanal",
      categoria: "familiar",
      categoria_real: "Laberinto", // dato real, informativo
      tags: ["familiar"],
      precio: 8000, // ESTIMADO
      duracion_min: 90, // ESTIMADO
      ubicacion: { lat: -27.1483919, lng: -109.424206, comuna: "Hanga Roa" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["11:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Mercado Artesanal en Hanga Roa al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 8, "15:00": 4, "17:00": 4}),
    },
    {
      id: "r137",
      nombre: "KANEDA GAMING HOUSE",
      categoria: "familiar",
      categoria_real: "Salón de juegos / arcade", // dato real, informativo
      tags: ["familiar"],
      precio: 8000, // ESTIMADO
      duracion_min: 150, // ESTIMADO
      ubicacion: { lat: -33.5652312, lng: -70.6632606, comuna: "La Florida" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 5, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["11:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con KANEDA GAMING HOUSE en La Florida al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 8, "15:00": 8, "17:00": 8}),
    },
    {
      id: "r138",
      nombre: "Sociedad Confecciones Y Disfraces Maria Elena Riva",
      categoria: "familiar",
      categoria_real: "Fiesta temática infantil", // dato real, informativo
      tags: ["familiar"],
      precio: 8000, // ESTIMADO
      duracion_min: 150, // ESTIMADO
      ubicacion: { lat: -41.4588728, lng: -72.9430089, comuna: "Puerto Montt" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["11:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Sociedad Confecciones Y Disfraces Maria Elena Riva en Puerto Montt al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 4, "15:00": 6, "17:00": 5}),
    },
    {
      id: "r139",
      nombre: "CRAM EVENTOS",
      categoria: "familiar",
      categoria_real: "Cumpleaños temáticos", // dato real, informativo
      tags: ["familiar"],
      precio: 13000, // ESTIMADO
      duracion_min: 135, // ESTIMADO
      ubicacion: { lat: -35.0096597, lng: -71.2133288, comuna: "Curicó" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["11:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con CRAM EVENTOS en Curicó al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 6, "15:00": 5, "17:00": 5}),
    },
    {
      id: "r140",
      nombre: "Fun Times",
      categoria: "familiar",
      categoria_real: "Salón de juegos / arcade", // dato real, informativo
      tags: ["familiar"],
      precio: 10000, // ESTIMADO
      duracion_min: 150, // ESTIMADO
      ubicacion: { lat: -53.1555594, lng: -70.8927466, comuna: "Punta Arenas" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["11:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Fun Times en Punta Arenas al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 8, "15:00": 4, "17:00": 4}),
    },
    {
      id: "r141",
      nombre: "tippikids.creaeventos",
      categoria: "familiar",
      categoria_real: "Fiesta temática infantil", // dato real, informativo
      tags: ["familiar"],
      precio: 15000, // ESTIMADO
      duracion_min: 105, // ESTIMADO
      ubicacion: { lat: -29.8956197, lng: -71.2582929, comuna: "La Serena" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 5, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["11:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con tippikids.creaeventos en La Serena al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 6, "15:00": 6, "17:00": 5}),
    },
    {
      id: "r142",
      nombre: "Vive Bowl",
      categoria: "familiar",
      categoria_real: "Bowling", // dato real, informativo
      tags: ["familiar"],
      precio: 11000, // ESTIMADO
      duracion_min: 150, // ESTIMADO
      ubicacion: { lat: -36.6034425, lng: -72.0906661, comuna: "Chillán" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["11:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Vive Bowl en Chillán al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 8, "15:00": 5, "17:00": 6}),
    },
    {
      id: "r143",
      nombre: "Cerro Cinchao",
      categoria: "familiar",
      categoria_real: "Zoológico", // dato real, informativo
      tags: ["familiar"],
      precio: 15000, // ESTIMADO
      duracion_min: 90, // ESTIMADO
      ubicacion: { lat: -45.514876, lng: -72.0288847, comuna: "Coyhaique" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["11:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Cerro Cinchao en Coyhaique al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 8, "15:00": 8, "17:00": 4}),
    },
    {
      id: "r144",
      nombre: "Tantanakuy",
      categoria: "familiar",
      categoria_real: "Salón de juegos / arcade", // dato real, informativo
      tags: ["familiar"],
      precio: 14000, // ESTIMADO
      duracion_min: 90, // ESTIMADO
      ubicacion: { lat: -27.4149317, lng: -70.2902367, comuna: "Copiapó" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["11:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Tantanakuy en Copiapó al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 5, "15:00": 4, "17:00": 5}),
    },
    {
      id: "r145",
      nombre: "Diverty Kids",
      categoria: "familiar",
      categoria_real: "Cumpleaños temáticos", // dato real, informativo
      tags: ["familiar"],
      precio: 9000, // ESTIMADO
      duracion_min: 90, // ESTIMADO
      ubicacion: { lat: -39.8247416, lng: -73.222538, comuna: "Valdivia" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["11:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Diverty Kids en Valdivia al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 4, "15:00": 6, "17:00": 8}),
    },
    {
      id: "r146",
      nombre: "djjproducciones",
      categoria: "familiar",
      categoria_real: "Cumpleaños temáticos", // dato real, informativo
      tags: ["familiar"],
      precio: 11000, // ESTIMADO
      duracion_min: 120, // ESTIMADO
      ubicacion: { lat: -36.7305322, lng: -73.1070265, comuna: "Talcahuano" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["11:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con djjproducciones en Talcahuano al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 4, "15:00": 8, "17:00": 6}),
    },
    {
      id: "r147",
      nombre: "Cotillon",
      categoria: "familiar",
      categoria_real: "Fiesta temática infantil", // dato real, informativo
      tags: ["familiar"],
      precio: 17000, // ESTIMADO
      duracion_min: 150, // ESTIMADO
      ubicacion: { lat: -33.0472574, lng: -71.6085944, comuna: "Valparaíso" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: true, // ESTIMADO
      horarios: ["11:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Cotillon en Valparaíso al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 5, "15:00": 6, "17:00": 5}),
    },
    {
      id: "r148",
      nombre: "Todo Fiesta antofagasta",
      categoria: "familiar",
      categoria_real: "Fiesta temática infantil", // dato real, informativo
      tags: ["familiar"],
      precio: 17000, // ESTIMADO
      duracion_min: 90, // ESTIMADO
      ubicacion: { lat: -23.6191815, lng: -70.381566, comuna: "Antofagasta" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 5, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["11:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Todo Fiesta antofagasta en Antofagasta al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 4, "15:00": 8, "17:00": 4}),
    },
    {
      id: "r149",
      nombre: "PRODUCTORA DE EVENTOS BAHIA BLANCA",
      categoria: "familiar",
      categoria_real: "Cumpleaños temáticos", // dato real, informativo
      tags: ["familiar"],
      precio: 20000, // ESTIMADO
      duracion_min: 150, // ESTIMADO
      ubicacion: { lat: -38.7322985, lng: -72.6397413, comuna: "Temuco" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["11:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con PRODUCTORA DE EVENTOS BAHIA BLANCA en Temuco al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 5, "15:00": 8, "17:00": 6}),
    },
    {
      id: "r150",
      nombre: "Monticello",
      categoria: "familiar",
      categoria_real: "Bowling", // dato real, informativo
      tags: ["familiar"],
      precio: 15000, // ESTIMADO
      duracion_min: 90, // ESTIMADO
      ubicacion: { lat: -33.9224854, lng: -70.7209924, comuna: "Rancagua" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 5, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["11:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Monticello en Rancagua al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 4, "15:00": 5, "17:00": 4}),
    },
    {
      id: "r151",
      nombre: "Librería Fran-Alex",
      categoria: "familiar",
      categoria_real: "Salón de juegos / arcade", // dato real, informativo
      tags: ["familiar"],
      precio: 18000, // ESTIMADO
      duracion_min: 90, // ESTIMADO
      ubicacion: { lat: -18.485592, lng: -70.2930456, comuna: "Arica" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["11:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Librería Fran-Alex en Arica al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 5, "15:00": 5, "17:00": 8}),
    },
    {
      id: "r152",
      nombre: "Fiesta sensorial",
      categoria: "familiar",
      categoria_real: "Cumpleaños temáticos", // dato real, informativo
      tags: ["familiar"],
      precio: 19000, // ESTIMADO
      duracion_min: 150, // ESTIMADO
      ubicacion: { lat: -20.2448162, lng: -70.1388493, comuna: "Iquique" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 5, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["11:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Fiesta sensorial en Iquique al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 6, "15:00": 6, "17:00": 8}),
    },
    {
      id: "r153",
      nombre: "Nayara Hangaroa",
      categoria: "familiar",
      categoria_real: "Laberinto", // dato real, informativo
      tags: ["familiar"],
      precio: 10000, // ESTIMADO
      duracion_min: 105, // ESTIMADO
      ubicacion: { lat: -27.1509399, lng: -109.4390029, comuna: "Hanga Roa" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["11:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Nayara Hangaroa en Hanga Roa al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 8, "15:00": 6, "17:00": 6}),
    },
    {
      id: "r154",
      nombre: "Centro De Eventos El Barrancon",
      categoria: "familiar",
      categoria_real: "Cumpleaños temáticos", // dato real, informativo
      tags: ["familiar"],
      precio: 10000, // ESTIMADO
      duracion_min: 105, // ESTIMADO
      ubicacion: { lat: -33.6183534, lng: -70.7215421, comuna: "Santiago" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["11:00", "15:00", "17:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Centro De Eventos El Barrancon en Santiago al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"11:00": 5, "15:00": 4, "17:00": 6}),
    },
    {
      id: "r155",
      nombre: "La Esquina Tropera",
      categoria: "fiesta",
      categoria_real: "Bar temático", // dato real, informativo
      tags: ["fiesta", "contiene_alcohol"],
      precio: 26000, // ESTIMADO
      duracion_min: 120, // ESTIMADO
      ubicacion: { lat: -45.5698572, lng: -72.0690944, comuna: "Coyhaique" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 5, // ESTIMADO
      hero_moment: true, // ESTIMADO
      horarios: ["19:30", "21:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con La Esquina Tropera en Coyhaique al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"19:30": 8, "21:30": 8}),
    },
    {
      id: "r156",
      nombre: "Por Siempre Bohemios",
      categoria: "fiesta",
      categoria_real: "Bar temático", // dato real, informativo
      tags: ["fiesta", "contiene_alcohol"],
      precio: 29000, // ESTIMADO
      duracion_min: 135, // ESTIMADO
      ubicacion: { lat: -33.0454093, lng: -71.6215522, comuna: "Valparaíso" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: true, // ESTIMADO
      horarios: ["19:30", "21:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Por Siempre Bohemios en Valparaíso al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"19:30": 6, "21:30": 4}),
    },
    {
      id: "r157",
      nombre: "Cascais Marisqueria",
      categoria: "fiesta",
      categoria_real: "Bar temático", // dato real, informativo
      tags: ["fiesta", "contiene_alcohol"],
      precio: 21000, // ESTIMADO
      duracion_min: 180, // ESTIMADO
      ubicacion: { lat: -34.985078, lng: -71.2308992, comuna: "Curicó" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["19:30", "21:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Cascais Marisqueria en Curicó al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"19:30": 6, "21:30": 4}),
    },
    {
      id: "r158",
      nombre: "Tequilas Club Lounge",
      categoria: "fiesta",
      categoria_real: "Coctelería temática", // dato real, informativo
      tags: ["fiesta", "contiene_alcohol"],
      precio: 16000, // ESTIMADO
      duracion_min: 135, // ESTIMADO
      ubicacion: { lat: -40.5732349, lng: -73.1401576, comuna: "Osorno" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["19:30", "21:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Tequilas Club Lounge en Osorno al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"19:30": 4, "21:30": 5}),
    },
    {
      id: "r159",
      nombre: "Botilleria \"Newen\"",
      categoria: "fiesta",
      categoria_real: "Cervecería artesanal", // dato real, informativo
      tags: ["fiesta", "contiene_alcohol"],
      precio: 26000, // ESTIMADO
      duracion_min: 120, // ESTIMADO
      ubicacion: { lat: -38.7363693, lng: -72.6285212, comuna: "Temuco" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 5, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["19:30", "21:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Botilleria \"Newen\" en Temuco al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"19:30": 4, "21:30": 8}),
    },
    {
      id: "r160",
      nombre: "Érase una vez",
      categoria: "fiesta",
      categoria_real: "Bar temático", // dato real, informativo
      tags: ["fiesta", "contiene_alcohol"],
      precio: 30000, // ESTIMADO
      duracion_min: 135, // ESTIMADO
      ubicacion: { lat: -53.1478689, lng: -70.8979039, comuna: "Punta Arenas" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["19:30", "21:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Érase una vez en Punta Arenas al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"19:30": 5, "21:30": 8}),
    },
    {
      id: "r161",
      nombre: "Cake Boutique por Andrea Escobar",
      categoria: "fiesta",
      categoria_real: "Coctelería temática", // dato real, informativo
      tags: ["fiesta", "contiene_alcohol"],
      precio: 21000, // ESTIMADO
      duracion_min: 180, // ESTIMADO
      ubicacion: { lat: -34.1739996, lng: -70.7305223, comuna: "Rancagua" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["19:30", "21:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Cake Boutique por Andrea Escobar en Rancagua al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"19:30": 8, "21:30": 6}),
    },
    {
      id: "r162",
      nombre: "Mozza Bar",
      categoria: "fiesta",
      categoria_real: "Coctelería temática", // dato real, informativo
      tags: ["fiesta", "contiene_alcohol"],
      precio: 21000, // ESTIMADO
      duracion_min: 150, // ESTIMADO
      ubicacion: { lat: -27.3646057, lng: -70.338392, comuna: "Copiapó" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["19:30", "21:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Mozza Bar en Copiapó al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"19:30": 6, "21:30": 8}),
    },
    {
      id: "r163",
      nombre: "Cerveza Artesanal Vegana Revolt",
      categoria: "fiesta",
      categoria_real: "Cervecería artesanal", // dato real, informativo
      tags: ["fiesta", "contiene_alcohol"],
      precio: 28000, // ESTIMADO
      duracion_min: 135, // ESTIMADO
      ubicacion: { lat: -36.6066558, lng: -72.1001713, comuna: "Chillán" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["19:30", "21:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Cerveza Artesanal Vegana Revolt en Chillán al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"19:30": 4, "21:30": 4}),
    },
    {
      id: "r164",
      nombre: "BordeExterior.cl",
      categoria: "fiesta",
      categoria_real: "Juego de rol en vivo", // dato real, informativo
      tags: ["fiesta", "contiene_alcohol"],
      precio: 27000, // ESTIMADO
      duracion_min: 120, // ESTIMADO
      ubicacion: { lat: -23.6539729, lng: -70.4006392, comuna: "Antofagasta" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["19:30", "21:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con BordeExterior.cl en Antofagasta al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"19:30": 8, "21:30": 6}),
    },
    {
      id: "r165",
      nombre: "BANQUETERIA BUEN SABOR",
      categoria: "fiesta",
      categoria_real: "Coctelería temática", // dato real, informativo
      tags: ["fiesta", "contiene_alcohol"],
      precio: 20000, // ESTIMADO
      duracion_min: 180, // ESTIMADO
      ubicacion: { lat: -37.4662309, lng: -72.3524896, comuna: "Los Ángeles" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: true, // ESTIMADO
      horarios: ["19:30", "21:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con BANQUETERIA BUEN SABOR en Los Ángeles al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"19:30": 5, "21:30": 4}),
    },
    {
      id: "r166",
      nombre: "cervecería Tata´s beer",
      categoria: "fiesta",
      categoria_real: "Cervecería artesanal", // dato real, informativo
      tags: ["fiesta", "contiene_alcohol"],
      precio: 15000, // ESTIMADO
      duracion_min: 180, // ESTIMADO
      ubicacion: { lat: -39.814492, lng: -73.2025459, comuna: "Valdivia" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["19:30", "21:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con cervecería Tata´s beer en Valdivia al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"19:30": 5, "21:30": 6}),
    },
    {
      id: "r167",
      nombre: "Almacén Cervecero Casa Matriz",
      categoria: "fiesta",
      categoria_real: "Cervecería artesanal", // dato real, informativo
      tags: ["fiesta", "contiene_alcohol"],
      precio: 15000, // ESTIMADO
      duracion_min: 135, // ESTIMADO
      ubicacion: { lat: -33.4022059, lng: -70.7706558, comuna: "Las Condes" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["19:30", "21:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Almacén Cervecero Casa Matriz en Las Condes al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"19:30": 4, "21:30": 6}),
    },
    {
      id: "r168",
      nombre: "Cali Tours Chile",
      categoria: "fiesta",
      categoria_real: "City tour nocturno", // dato real, informativo
      tags: ["fiesta", "contiene_alcohol"],
      precio: 22000, // ESTIMADO
      duracion_min: 180, // ESTIMADO
      ubicacion: { lat: -18.1979337, lng: -69.5586159, comuna: "Arica" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 5, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["19:30", "21:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Cali Tours Chile en Arica al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"19:30": 4, "21:30": 6}),
    },
    {
      id: "r169",
      nombre: "Restaurante Estación",
      categoria: "fiesta",
      categoria_real: "Bar temático", // dato real, informativo
      tags: ["fiesta", "contiene_alcohol"],
      precio: 28000, // ESTIMADO
      duracion_min: 135, // ESTIMADO
      ubicacion: { lat: -29.929657, lng: -71.2801921, comuna: "La Serena" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["19:30", "21:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Restaurante Estación en La Serena al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"19:30": 6, "21:30": 6}),
    },
    {
      id: "r170",
      nombre: "Valhalla - Paraíso Vikingo",
      categoria: "fiesta",
      categoria_real: "Bar temático", // dato real, informativo
      tags: ["fiesta", "contiene_alcohol"],
      precio: 25000, // ESTIMADO
      duracion_min: 180, // ESTIMADO
      ubicacion: { lat: -20.2461628, lng: -70.1393645, comuna: "Iquique" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["19:30", "21:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Valhalla - Paraíso Vikingo en Iquique al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"19:30": 6, "21:30": 8}),
    },
    {
      id: "r171",
      nombre: "Duendecito De La Eme",
      categoria: "fiesta",
      categoria_real: "Bar temático", // dato real, informativo
      tags: ["fiesta", "contiene_alcohol"],
      precio: 28000, // ESTIMADO
      duracion_min: 150, // ESTIMADO
      ubicacion: { lat: -45.5723613, lng: -72.0639785, comuna: "Coyhaique" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["19:30", "21:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Duendecito De La Eme en Coyhaique al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"19:30": 4, "21:30": 5}),
    },
    {
      id: "r172",
      nombre: "Bar La Playa Valparaíso",
      categoria: "fiesta",
      categoria_real: "Bar temático", // dato real, informativo
      tags: ["fiesta", "contiene_alcohol"],
      precio: 29000, // ESTIMADO
      duracion_min: 135, // ESTIMADO
      ubicacion: { lat: -33.0347619, lng: -71.6299787, comuna: "Valparaíso" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 5, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["19:30", "21:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Bar La Playa Valparaíso en Valparaíso al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"19:30": 4, "21:30": 8}),
    },
    {
      id: "r173",
      nombre: "Lungo Restaurante y Cafetería",
      categoria: "fiesta",
      categoria_real: "Bar temático", // dato real, informativo
      tags: ["fiesta", "contiene_alcohol"],
      precio: 22000, // ESTIMADO
      duracion_min: 150, // ESTIMADO
      ubicacion: { lat: -34.9854289, lng: -71.2250875, comuna: "Curicó" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["19:30", "21:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Lungo Restaurante y Cafetería en Curicó al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"19:30": 8, "21:30": 5}),
    },
    {
      id: "r174",
      nombre: "Onyx Club",
      categoria: "fiesta",
      categoria_real: "Coctelería temática", // dato real, informativo
      tags: ["fiesta", "contiene_alcohol"],
      precio: 25000, // ESTIMADO
      duracion_min: 180, // ESTIMADO
      ubicacion: { lat: -41.4711255, lng: -72.9408321, comuna: "Puerto Montt" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 5, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["19:30", "21:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Onyx Club en Puerto Montt al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"19:30": 5, "21:30": 8}),
    },
    {
      id: "r175",
      nombre: "Fabrica Cervecería Sturnella - SoyCervecero",
      categoria: "fiesta",
      categoria_real: "Cervecería artesanal", // dato real, informativo
      tags: ["fiesta", "contiene_alcohol"],
      precio: 23000, // ESTIMADO
      duracion_min: 120, // ESTIMADO
      ubicacion: { lat: -38.7048166, lng: -72.6960098, comuna: "Temuco" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["19:30", "21:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Fabrica Cervecería Sturnella - SoyCervecero en Temuco al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"19:30": 6, "21:30": 6}),
    },
    {
      id: "r176",
      nombre: "Cerveceria Coiron Punta Arenas",
      categoria: "fiesta",
      categoria_real: "Cervecería artesanal", // dato real, informativo
      tags: ["fiesta", "contiene_alcohol"],
      precio: 19000, // ESTIMADO
      duracion_min: 135, // ESTIMADO
      ubicacion: { lat: -53.1594052, lng: -70.9005969, comuna: "Punta Arenas" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: false, // ESTIMADO
      indoor_alt: true, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["19:30", "21:30"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Cerveceria Coiron Punta Arenas en Punta Arenas al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"19:30": 8, "21:30": 8}),
    },
    {
      id: "r177",
      nombre: "Cabañas El Sueño De Laura",
      categoria: "explorador",
      categoria_real: "Turismo rural", // dato real, informativo
      tags: ["explorador"],
      precio: 19000, // ESTIMADO
      duracion_min: 105, // ESTIMADO
      ubicacion: { lat: -39.642817, lng: -72.336027, comuna: "Panguipulli" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 5, // ESTIMADO
      hero_moment: true, // ESTIMADO
      horarios: ["09:00", "15:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Cabañas El Sueño De Laura en Panguipulli al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"09:00": 5, "15:00": 4}),
    },
    {
      id: "r178",
      nombre: "Gatica Deportes",
      categoria: "explorador",
      categoria_real: "Pesca deportiva", // dato real, informativo
      tags: ["explorador"],
      precio: 10000, // ESTIMADO
      duracion_min: 165, // ESTIMADO
      ubicacion: { lat: -51.7296622, lng: -72.496249, comuna: "Puerto Natales" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: true, // ESTIMADO
      horarios: ["09:00", "15:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Gatica Deportes en Puerto Natales al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"09:00": 6, "15:00": 6}),
    },
    {
      id: "r179",
      nombre: "Vivero El Pecano",
      categoria: "explorador",
      categoria_real: "Huerto orgánico", // dato real, informativo
      tags: ["explorador"],
      precio: 25000, // ESTIMADO
      duracion_min: 150, // ESTIMADO
      ubicacion: { lat: -30.0279464, lng: -70.7086944, comuna: "Vicuña" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["09:00", "15:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Vivero El Pecano en Vicuña al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"09:00": 5, "15:00": 8}),
    },
    {
      id: "r180",
      nombre: "Cabañas Costa Horizonte",
      categoria: "explorador",
      categoria_real: "Turismo rural", // dato real, informativo
      tags: ["explorador"],
      precio: 16000, // ESTIMADO
      duracion_min: 105, // ESTIMADO
      ubicacion: { lat: -34.4041385, lng: -72.026289, comuna: "Pichilemu" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["09:00", "15:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Cabañas Costa Horizonte en Pichilemu al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"09:00": 5, "15:00": 8}),
    },
    {
      id: "r181",
      nombre: "Arte Pin",
      categoria: "explorador",
      categoria_real: "Centro de interpretación ambiental", // dato real, informativo
      tags: ["explorador"],
      precio: 27000, // ESTIMADO
      duracion_min: 90, // ESTIMADO
      ubicacion: { lat: -27.0998986, lng: -70.863612, comuna: "Bahía Inglesa" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 5, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["09:00", "15:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Arte Pin en Bahía Inglesa al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"09:00": 8, "15:00": 4}),
    },
    {
      id: "r182",
      nombre: "Los Chañares 451",
      categoria: "explorador",
      categoria_real: "Turismo rural", // dato real, informativo
      tags: ["explorador"],
      precio: 11000, // ESTIMADO
      duracion_min: 105, // ESTIMADO
      ubicacion: { lat: -22.9111067, lng: -68.1923227, comuna: "San Pedro de Atacama" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 5, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["09:00", "15:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Los Chañares 451 en San Pedro de Atacama al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"09:00": 5, "15:00": 6}),
    },
    {
      id: "r183",
      nombre: "KATRIMAKY OUTDOORS",
      categoria: "explorador",
      categoria_real: "Pesca deportiva", // dato real, informativo
      tags: ["explorador"],
      precio: 12000, // ESTIMADO
      duracion_min: 135, // ESTIMADO
      ubicacion: { lat: -33.5822361, lng: -70.7030873, comuna: "Santiago" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 5, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["09:00", "15:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con KATRIMAKY OUTDOORS en Santiago al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"09:00": 6, "15:00": 5}),
    },
    {
      id: "r184",
      nombre: "Casa del Turista, Rio Puelo",
      categoria: "explorador",
      categoria_real: "Ecoturismo", // dato real, informativo
      tags: ["explorador"],
      precio: 30000, // ESTIMADO
      duracion_min: 105, // ESTIMADO
      ubicacion: { lat: -41.664151, lng: -72.296431, comuna: "Puerto Montt" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["09:00", "15:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Casa del Turista, Rio Puelo en Puerto Montt al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"09:00": 4, "15:00": 8}),
    },
    {
      id: "r185",
      nombre: "Pescadores Industriales del Biobío A.G.",
      categoria: "explorador",
      categoria_real: "Pesca artesanal", // dato real, informativo
      tags: ["explorador"],
      precio: 17000, // ESTIMADO
      duracion_min: 135, // ESTIMADO
      ubicacion: { lat: -36.8261978, lng: -73.046057, comuna: "Concepción" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["09:00", "15:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Pescadores Industriales del Biobío A.G. en Concepción al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"09:00": 8, "15:00": 6}),
    },
    {
      id: "r186",
      nombre: "Reserva de Bosque Nativo Los Maquis",
      categoria: "explorador",
      categoria_real: "Agroturismo", // dato real, informativo
      tags: ["explorador"],
      precio: 24000, // ESTIMADO
      duracion_min: 105, // ESTIMADO
      ubicacion: { lat: -36.0917422, lng: -72.7760724, comuna: "Cobquecura" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["09:00", "15:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Reserva de Bosque Nativo Los Maquis en Cobquecura al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"09:00": 6, "15:00": 8}),
    },
    {
      id: "r187",
      nombre: "Posada la Piedra",
      categoria: "explorador",
      categoria_real: "Agroturismo", // dato real, informativo
      tags: ["explorador"],
      precio: 16000, // ESTIMADO
      duracion_min: 120, // ESTIMADO
      ubicacion: { lat: -35.3374439, lng: -72.406244, comuna: "Constitución" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: true, // ESTIMADO
      horarios: ["09:00", "15:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Posada la Piedra en Constitución al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"09:00": 4, "15:00": 4}),
    },
    {
      id: "r188",
      nombre: "Cabaña Vairoa",
      categoria: "explorador",
      categoria_real: "Turismo sustentable", // dato real, informativo
      tags: ["explorador"],
      precio: 25000, // ESTIMADO
      duracion_min: 165, // ESTIMADO
      ubicacion: { lat: -27.1461081, lng: -109.4224967, comuna: "Hanga Roa" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["09:00", "15:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Cabaña Vairoa en Hanga Roa al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"09:00": 5, "15:00": 4}),
    },
    {
      id: "r189",
      nombre: "Taberna La Breva",
      categoria: "explorador",
      categoria_real: "Agroturismo", // dato real, informativo
      tags: ["explorador"],
      precio: 21000, // ESTIMADO
      duracion_min: 90, // ESTIMADO
      ubicacion: { lat: -33.3063823, lng: -71.4002502, comuna: "Casablanca" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["09:00", "15:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Taberna La Breva en Casablanca al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"09:00": 6, "15:00": 6}),
    },
    {
      id: "r190",
      nombre: "Alojamientos Techo Azul",
      categoria: "explorador",
      categoria_real: "Agroturismo", // dato real, informativo
      tags: ["explorador"],
      precio: 21000, // ESTIMADO
      duracion_min: 105, // ESTIMADO
      ubicacion: { lat: -38.4588357, lng: -71.7274823, comuna: "Malalcahuello" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["09:00", "15:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Alojamientos Techo Azul en Malalcahuello al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"09:00": 8, "15:00": 4}),
    },
    {
      id: "r191",
      nombre: "Humedal urbano Bahía Panguipulli",
      categoria: "explorador",
      categoria_real: "Avistamiento de aves", // dato real, informativo
      tags: ["explorador"],
      precio: 15000, // ESTIMADO
      duracion_min: 90, // ESTIMADO
      ubicacion: { lat: -39.6462653, lng: -72.3267609, comuna: "Panguipulli" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: true, // ESTIMADO
      horarios: ["09:00", "15:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Humedal urbano Bahía Panguipulli en Panguipulli al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"09:00": 8, "15:00": 8}),
    },
    {
      id: "r192",
      nombre: "Magallanes Fly Fishing",
      categoria: "explorador",
      categoria_real: "Pesca deportiva", // dato real, informativo
      tags: ["explorador"],
      precio: 23000, // ESTIMADO
      duracion_min: 150, // ESTIMADO
      ubicacion: { lat: -53.1466408, lng: -70.9066648, comuna: "Punta Arenas" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["09:00", "15:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Magallanes Fly Fishing en Punta Arenas al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"09:00": 5, "15:00": 8}),
    },
    {
      id: "r193",
      nombre: "Telescopios Elqui",
      categoria: "explorador",
      categoria_real: "Astroturismo", // dato real, informativo
      tags: ["explorador"],
      precio: 16000, // ESTIMADO
      duracion_min: 180, // ESTIMADO
      ubicacion: { lat: -29.9058535, lng: -71.2451855, comuna: "La Serena" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["09:00", "15:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Telescopios Elqui en La Serena al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"09:00": 6, "15:00": 6}),
    },
    {
      id: "r194",
      nombre: "Reserva Nacional Laguna Torca",
      categoria: "explorador",
      categoria_real: "Parque nacional / reserva natural", // dato real, informativo
      tags: ["explorador"],
      precio: 27000, // ESTIMADO
      duracion_min: 180, // ESTIMADO
      ubicacion: { lat: -34.7699294, lng: -72.060676, comuna: "Santa Cruz" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["09:00", "15:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Reserva Nacional Laguna Torca en Santa Cruz al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"09:00": 4, "15:00": 8}),
    },
    {
      id: "r195",
      nombre: "Tienda Pescapasión",
      categoria: "explorador",
      categoria_real: "Pesca deportiva", // dato real, informativo
      tags: ["explorador"],
      precio: 17000, // ESTIMADO
      duracion_min: 120, // ESTIMADO
      ubicacion: { lat: -27.067522, lng: -70.8233701, comuna: "Bahía Inglesa" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 5, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["09:00", "15:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Tienda Pescapasión en Bahía Inglesa al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"09:00": 4, "15:00": 6}),
    },
    {
      id: "r196",
      nombre: "Cabañas Casa Sutar",
      categoria: "explorador",
      categoria_real: "Agroturismo", // dato real, informativo
      tags: ["explorador"],
      precio: 29000, // ESTIMADO
      duracion_min: 135, // ESTIMADO
      ubicacion: { lat: -22.9065734, lng: -68.1926255, comuna: "San Pedro de Atacama" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["09:00", "15:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Cabañas Casa Sutar en San Pedro de Atacama al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"09:00": 6, "15:00": 4}),
    },
    {
      id: "r197",
      nombre: "La strada del vino",
      categoria: "explorador",
      categoria_real: "Turismo rural", // dato real, informativo
      tags: ["explorador"],
      precio: 23000, // ESTIMADO
      duracion_min: 90, // ESTIMADO
      ubicacion: { lat: -33.5848966, lng: -70.5812811, comuna: "San José de Maipo" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 3, // ESTIMADO
      hero_moment: true, // ESTIMADO
      horarios: ["09:00", "15:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con La strada del vino en San José de Maipo al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"09:00": 8, "15:00": 8}),
    },
    {
      id: "r198",
      nombre: "Futa House",
      categoria: "explorador",
      categoria_real: "Turismo rural", // dato real, informativo
      tags: ["explorador"],
      precio: 30000, // ESTIMADO
      duracion_min: 165, // ESTIMADO
      ubicacion: { lat: -43.1826677, lng: -71.8703205, comuna: "Futaleufú" }, // lat/lng reales
      energia: "media", // ESTIMADO
      exterior: true, // ESTIMADO
      indoor_alt: false, // ESTIMADO
      accesible: true, // ESTIMADO (heurística por categoría, no confirmado)
      experiencia_estimada: 4, // ESTIMADO
      hero_moment: false, // ESTIMADO
      horarios: ["09:00", "15:00"], // ESTIMADO
      punto_encuentro: "Coordinar punto de encuentro directo con Futa House en Futaleufú al reservar", // placeholder honesto, no hay dirección exacta
      incluye: [],
      no_incluye: [],
      restricciones: [],
      cupos: cuposParaProximosDias({"09:00": 8, "15:00": 8}),
    },
  ];

  window.PickmapDarwinData = window.PickmapDarwinData || {};
  window.PickmapDarwinData.CATALOGO_REAL_SAMPLE = CATALOGO_REAL_SAMPLE;
})();
