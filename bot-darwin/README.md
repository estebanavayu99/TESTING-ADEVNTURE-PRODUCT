# Darwin — bot inteligente (en construcción, NO conectado al sitio real)

Esta carpeta es un laboratorio aislado: nada de lo que hay acá está
enlazado desde el sitio ni desde el nav (mismo patrón que
`notificaciones-preview.html`: `noindex, nofollow`, sin links entrantes).
"Conectado al sitio" significa integrado al flujo real de usuario
(reemplazar `js/beto-chat.js` por una versión que llame a
`PickmapDarwin.motor.procesarMensaje(...)`) — eso sigue sin pasar.

**Sí está desplegado en producción** (`pickmap.cl/bot-darwin/preview.html`,
reachable por URL directa) — instrucción explícita del usuario para
poder testear "de forma real" con acceso desde cualquier navegador, no
solo con el archivo HTML descargable. Sigue sin enlace entrante ni
indexado; el catálogo real de negocios (`catalogo.real-sample.js`) sigue
sin comitear, así que lo que hay en vivo usa el catálogo mock de prueba.

Basado en los 3 documentos que armó el usuario:
- `pickmap_fuentes_a_conectar.pdf` — qué fuente conecta cada tool, por prioridad.
- `pickmap_algoritmos_spec.pdf` — matemática de `calcular_confianza` y `rankear_combos`.
- `pickmap_system_prompt_v4.pdf` — reglas de negocio/venta consultiva del agente.

## Importante: el producto final NO es un chat

El usuario aclaró esto explícitamente: la entrega final de Darwin va a
ser **una guía que ofrece la recomendación directo** (el panorama o
combinación de panoramas ya armado, con el porqué), no una interfaz de
chat de ida y vuelta. `preview.html` sigue siendo una consola de chat
porque es la forma más rápida de probar el motor turno a turno — pero
no hay que asumir que esa UI es el diseño final. Cuando se defina cómo
se ve la "guía" de verdad, `js/motor.js`/`js/plantillas.js` deberían
poder alimentarla igual (ya devuelven texto armado, no HTML de chat).

## Decisión de esta etapa: sin LLM real

El usuario eligió, para esta etapa, un motor **100% reglas/heurísticas**
(sin costo, sin API key) en vez de conectar un LLM real. Eso significa:
- Los dos algoritmos (`calcular_confianza`, `rankear_combos`) son
  matemática real, determinística, tal como pide la spec.
- El "entendimiento" del mensaje del cliente es detección por palabras
  clave (`js/motor.js`), no comprensión de lenguaje natural real.
- La "voz" de Darwin sale de plantillas (`js/plantillas.js`), no de
  generación libre.

Es una base honesta y 100% testeable. El día que se quiera conectar un
LLM real (Claude), este mismo motor se reorganiza como el set de
**tools** que el LLM invoca — `algoritmos.js` y `tools.js` ya están
separados del resto justo para eso.

## Qué está simulado / con datos de prueba, y qué es real

| Pieza | Estado |
|---|---|
| `js/algoritmos.js` — calcularConfianza, rankearCombos | **Real**, matemática de la spec |
| `data/catalogo.mock.js` | **Placeholder**. El usuario va a pasar la BD real — ver "Cómo conectar la BD real" abajo |
| `js/tools.js` — buscar/detalle/disponibilidad/traza/armar_combo | Real, pero lee del catálogo placeholder |
| `js/contexto.js` — clima, hora_solar (Open-Meteo) / calcular_ruta, optimizar_itinerario (OSRM) | **Llamadas de red reales**, gratis, sin API key. No se pueden probar en este sandbox (sin salida a internet) pero funcionan apenas el bot corra en un navegador con red. Ver "Clima: dos factores separados" abajo |
| `js/contexto.js` — hora_local | Real, cálculo local con `Intl`, sin red |
| `js/afluencia.js` — afluencia, eventos_locales | **Heurística/placeholder** — reemplazar por datos reales de reservas y calendario de feriados/festivales cuando existan |
| `js/motor.js`, `js/plantillas.js` | Reglas del system prompt v4 implementadas como código determinístico (sin LLM) |
| `data/taxonomia-categorias.js` | **Real** (taxonomía, no datos de negocios): 178 categorías reales agrupadas en 9 buckets |
| Ubicación real (`navigator.geolocation`) | **Real**, nativa del navegador, gratis, sin key. Requiere permiso del usuario y una página con internet real (no funciona en el sandbox ni en el preview alojado con CSP) |
| Distancia/tiempo real (origen→panorama, entre panoramas, plan multi-día) | **Real**, matemática haversine + velocidad por tramo (30 km/h ciudad, 80 km/h interurbano >50km) |
| Plan de varios días (`armarPlanMultiDia`) | **Real** para la secuencia demo cabaña+termas+trekking (sur de Chile); generalizar a cualquier combinación/región es trabajo pendiente (ver Pendiente) |
| "Panoramas cerca de ahí" (`sugerirRelacionados`) | **Real**, rankeo multifactorial + filtro de radio real (80 km) — no solo categoría+proximidad como el nearbyItems() actual del sitio |
| D2 Gemas locales / anti-trampa (`fraseGemaLocal`) | Real, pero solo para las actividades marcadas `es_gema_oculta`/`evita_trampa` en el catálogo placeholder — no se inventa para el resto |
| D3 Grupos con gustos divergentes (`detectarDivergencia`) | Real: detecta "a mí me gusta X pero a mi pareja Y" y fuerza un combo que cubra ambas categorías en el orden mencionado, en vez de dejar que el ranking elija solo la de mejor puntaje |
| C7 Re-enganche (`reenganche`) | Conectado — antes existía la plantilla pero nunca se llamaba desde el motor |
| D5 Ritmo conversacional (`quiereExplorar`) | Real: "cuéntame más opciones" compara 2 actividades distintas de la misma zona, en vez de la única opción directa por defecto |

## Taxonomía de categorías (ampliada con datos reales)

El usuario pasó `chile_experiences_FINAL.csv` — un listado de ~29 mil
negocios turísticos de todo Chile (aún sin confirmar como aliados, por
eso **ese archivo no vive en este repo**, solo se analizó localmente).
De ahí se sacó algo que sí es reutilizable y no es sensible: la
**taxonomía real de categorías de experiencias** (178 valores, ej.
"Trekking", "Masajes", "Tour de vinos", "Bar temático", "Turismo rural").

`data/taxonomia-categorias.js` agrupa esas 178 categorías en 9 buckets
(`enologia, aventura, relax, cultural, foodie, romantico, familiar,
fiesta, explorador`), cada uno con su arquetipo (ahora los 8 de A3 del
system prompt están cubiertos — antes `fiesta`→`social_fiestero` y
`explorador`→`explorador_local` no eran alcanzables) y una lista de
keywords para detectar la intención en el texto libre. `js/motor.js` ya
no usa una lista de 7 categorías inventadas — usa esta taxonomía.

Antes de llegar a este archivo, el CSV real necesitó dos pasadas de
limpieza (documentadas para la próxima vez que llegue un lote similar):
1. **~770 filas con columnas corridas**: el nombre del negocio en Google
   Maps traía comas internas (ej. "Taller Agustín Desabolladura,
   Pintura, Mecánica..."), lo que desalineaba todo lo de ahí en
   adelante. Se arregla buscando en qué columna aparece una región real
   de Chile y realineando desde ahí.
2. **~932 negocios con categoría mal asignada** (probablemente
   auto-asignada en el scraping, no revisada a mano) — ej. una empresa
   de grúas industriales etiquetada "Masajes", una ferretería etiquetada
   "Masajes", una veterinaria etiquetada "Zoológico". Se detectan por
   palabras clave de rubros no-turísticos (mecánica, ferretería, salud
   clínica, legal, etc.) en el nombre del negocio, sin importar la
   categoría asignada. Quedaron descartados de la base de trabajo.

Catálogo mock (`data/catalogo.mock.js`) ahora tiene 2 actividades de
ejemplo más (`a9` fiesta, `a10` explorador) para que esos dos arquetipos
nuevos sean alcanzables de punta a punta en el preview, no solo en la
detección de texto.

## Clima: dos factores separados (`clima_panorama` vs. `clima_usuario`)

Bug real reportado por el usuario tras probar el flujo de práctica: el
motor pedía el clima UNA vez para la ubicación actual del usuario
(`perfil.origen`) y mostraba ese mismo dato como si fuera el clima del
panorama recomendado — incorrecto apenas el panorama queda en otra
comuna/región. La spec (`pickmap_system_prompt_v4.pdf`) pide justamente
dos factores distintos:
1. **Clima del panorama** (dónde va a estar la actividad, en la fecha
   del plan) — el dato relevante para decidir qué ropa llevar. Es el
   factor primario, se muestra siempre primero.
2. **Clima donde está el usuario ahora** — dato secundario, solo de
   referencia (ej. si va a hacer mucho más frío/calor en destino que en
   su ubicación actual).

Implementación (`js/motor.js`):
- `perfil.contexto.clima_usuario` guarda el clima de `perfil.origen`
  (se sigue pidiendo una sola vez, vía `actualizarClimaPara` en
  `preview.js`, apenas el usuario comparte ubicación).
- `obtenerClimaPanorama(D, ubicacion, fecha)` pide el clima real de la
  ubicación del combo/actividad recién antes de responder — con
  try/catch que degrada a `null` sin romper el mensaje si la red falla.
- Esto obligó a volver `async` toda la cadena de diálogo:
  `procesarMensaje` → `proponerCombos`/`proponerPlanMultiDia` →
  `obtenerClimaPanorama`. `preview.js` ahora hace
  `await D.motor.procesarMensaje(...)`.
- `plantillas.js`/`fraseClima(climaPanorama, climaUsuario)` compone las
  dos líneas por separado: "☀️/🌧️ En el panorama: ..." (siempre, si hay
  dato) + "🌡️ Donde estás tú ahora: ... (dato secundario, para
  referencia)." (solo si también hay `climaUsuario`).
- El ranking/filtros duros de `rankear_combos` siguen usando
  `clima_usuario` como aproximación de zona para puntuar candidatos
  ANTES de tener un combo elegido (documentado como simplificación
  conocida en el código) — la diferencia real entre panorama/usuario
  solo importa para lo que se le MUESTRA al cliente, que es donde
  estaba el bug.
- Verificado con Playwright mockeando `PickmapDarwin.contexto.clima`
  para que resuelva con valores distintos a `clima_usuario`: las dos
  líneas se muestran correctas y diferenciadas (18°–27°C panorama vs.
  5°–14°C usuario, en el caso de prueba).

## Fixes del feedback de la práctica real (screenshots del usuario)

Tras la práctica guiada, el usuario mandó screenshots de su web real
(`panoramas.js`, vista "TU RUTA" con mapas embebidos) y reportó 2 bugs
puntuales más en el mismo mensaje: "me sigue dando 1 opción y ni me
ofrece el ayuda con los buses o traslado". Los tres arreglos:

**1. "Quiero paquete" seguía dando 1 sola opción.** No existía ninguna
detección de la intención explícita de "paquete/combo" — el mensaje
"quierp paquete" no tenía categorías nuevas que detectar, así que
`proponerCombos` repetía exactamente el mismo combo de la respuesta
anterior. Además, aunque se detectara, `rankear_combos` podía igual
elegir el combo de 1 sola actividad si puntuaba más alto que las
combinaciones de 2. Fix en `js/motor.js`:
- `PATRON_QUIERE_PAQUETE` / `quierePaquete(texto)` detecta "paquete",
  "combo", "combinado", "pack", etc.
- Con la intención detectada, `proponerCombos` deja de ofrecer el combo
  de 1 sola actividad como alternativa en el ranking.
- Si la categoría de interés solo tiene 1 actividad en el catálogo (el
  caso real del bug — ninguna categoría del mock tiene 2+ actividades
  "románticas"), se complementa esa única actividad con algo cercano de
  **otra** categoría (mismo radio que "panoramas cerca de ahí",
  `RADIO_CERCA_KM = 80`) en vez de devolver 1 sola opción.

**2. Nunca se ofrecía ayuda con el traslado (bus/transfer).** Se
mostraba la distancia/tiempo pero se asumía en silencio que el cliente
maneja su propio auto. Fix: `fraseAyudaTraslado(kmOrigen,
kmEntrePanoramas)` en `js/plantillas.js` — ofrece proactivamente
coordinar bus/transfer/auto compartido apenas algún tramo (origen→primer
panorama, entre panoramas del combo, o el tramo más largo de un plan
multi-día) supera `KM_CAMINABLE` (1.2 km). Se agregó tanto a
`formatearCombo` como a `formatearPlanMultiDia`.

**3. Falta el panel "Tu Ruta" con mapas reales** (el usuario mandó
captura de cómo se ve hoy en `panoramas.js`: chips de día/tramo + mapas
de Google Maps embebidos entre las zonas de las actividades). Se replicó
el mismo truco sin API key que ya usa el sitio real
(`legEmbedHTML`/`mapsEmbedHTML` en `js/panoramas.js`:
`https://www.google.com/maps?saddr=...&daddr=...&output=embed` en un
`<iframe>`), con una diferencia: acá se usan coordenadas `lat,lng` reales
del catálogo de Darwin en vez de nombres de calle/comuna (el catálogo
mock de panoramas.js no trae lat/lng reales, el de Darwin sí). Nuevo
panel `#darwinRuta` en `preview.html`/`preview.css`/`preview.js`
(tercera sección, no en `js/motor.js`/`js/plantillas.js` porque es
puramente de presentación — el motor solo expone `debug.comboCompleto` /
`debug.plan` con los datos de actividades+ubicación, y `preview.js` arma
el HTML con los tramos origen→actividad→actividad). No se puede ver el
mapa real renderizado en este sandbox sin internet, pero se verificó con
Playwright que la estructura (labels, distancias/tiempos, URLs de los
`iframe` con las coordenadas correctas) es correcta — apenas se abra en
un navegador con red, el mapa se ve real.

## Flujo real confirmado: recomendación única → oferta opcional → combo con mapas

El usuario mandó 2 screenshots más de su web real (modal de detalle de un
panorama solo, con "Panoramas cerca de ahí" abajo; y "Resumen de tu
reserva" con el plan completo + "Tu Ruta") y lo resumió así: *"en primer
lugar muestra recomendaciones según tu expertis, para luego incluso
ofrecer combos a elección (solo si el cliente quiere). En caso de
escogerlo, salen todos los mapas."* Esto reveló que el motor por defecto
estaba armando un combo de 2 actividades de entrada (`top3[0]+top3[1]`),
sin dar el paso intermedio de "ofrecer, no imponer". Se restructuró
`proponerCombos` en `js/motor.js`:

1. **Default (sin señal de paquete/explorar/divergencia)**: se arman
   combos de **1 sola actividad** para el top 3 de candidatos y se
   rankean entre sí — la "recomendación según expertise" es elegir la
   MEJOR opción individual (multi-factor: afinidad, presupuesto, clima,
   energía, arquetipo), no forzar ya una combinación.
2. Tras esa recomendación, si hay una actividad complementaria real cerca
   (mismo radio que "panoramas cerca de ahí", `RADIO_CERCA_KM = 80`), se
   agrega una frase de oferta (`plantillas.ofertaComplemento`) y se guarda
   `perfil.oferta_combo = { base_id, complemento_id }` — sin armar el
   combo todavía.
3. El combo de 2 actividades (y el panel "Tu Ruta" con mapas) **solo se
   arma si el cliente**: (a) pide explícitamente un paquete (detección ya
   existente de la Fase 26), o (b) **acepta la oferta** con una
   afirmación simple ("sí", "dale", "agrégalo"...) — `PATRON_ACEPTA_OFERTA`
   + `aceptaOfertaCombo()`. La aceptación solo cuenta si hay una
   `perfil.oferta_combo` pendiente Y el mensaje no trae una categoría
   nueva (para no confundir un "sí" que en realidad es el inicio de otro
   tema). Al aceptar, se arma EXACTAMENTE el combo ofrecido (mismo
   base+complemento), no uno recalculado, para que la respuesta sea
   consistente con lo que ya vio.
4. `preview.js` (`mostrarRuta`) ahora exige `debug.plan` o
   `debug.comboCompleto.actividades.length >= 2` antes de poblar el panel
   de mapas — una recomendación única solo muestra el dato de distancia
   como texto (`📌 Desde tu ubicación: ...`), igual que el modal de
   detalle de un panorama solo en el sitio real (sin mapa embebido); el
   mapa aparece recién en el "Resumen de tu reserva" equivalente.

Verificado con Playwright: turno 1 (recomendación + oferta, 0 mapas) →
turno 2 ("sí, dale" → combo completo + 2 mapas + `oferta_combo` vuelve a
`null`). Regresión completa sin cambios: 11/11 algoritmos + todos los
escenarios (aniversario, relacionados, plan multi-día, divergencia,
reenganche, explorar, clima dual, paquete explícito) siguen correctos.

## Pasada de "arregla todo lo que puedas" — bugs reales encontrados probando

El usuario pidió una pasada libre para arreglar y mejorar todo lo posible
del bot (sin tocar código del sitio real, eso es otra sesión). Probando
sistemáticamente cada quick-reply y variación de mensaje del preview
aparecieron 5 bugs reales, todos corregidos y verificados con Playwright:

1. **Precio total mal etiquetado con 2+ personas**: `precio_total` (ya
   multiplicado por `personas`) se mostraba con la etiqueta "por persona" —
   con 2 personas, un panorama de $22.000 pp aparecía como "$44.000 por
   persona" (el doble de lo real). `armarCombo`/`armarPlanMultiDia`
   (`js/tools.js`) ahora exponen también `precio_por_persona` y `personas`;
   `plantillas.js` (`fraseTotal`/`fraseTotalCompacta`) muestra 1 sola línea
   cuando personas≤1 (caso más común, sin cambios visuales) y desglosa
   total + por-persona + cantidad de personas cuando son 2+.
2. **"¿Cuánto cuesta en total?" / "¿Dónde nos juntamos?" no se
   respondían**: estas 2 preguntas son quick-replies literales del
   preview, pero las señales `precio_final`/`logistica` solo se
   registraban como evento de scoring (y solo si el mensaje también traía
   una categoría) — nunca generaban una respuesta propia, así que el
   motor volvía a proponer un combo desde cero e ignoraba la pregunta.
   Ahora responden directo con el precio/punto de encuentro real del
   carrito actual (`plantillas.respuestaPrecio`/`respuestaLogistica`).
3. **"No me gusta esa, sácala" no excluía nada**: `esDescarte()` detectaba
   el rechazo pero `perfil.descartados` nunca se poblaba en ningún lado —
   Darwin volvía a recomendar EXACTAMENTE la misma actividad rechazada en
   el turno siguiente. Ahora, al detectar descarte, se agregan las
   actividades del carrito actual a `perfil.descartados`, se infiere la
   categoría rechazada del catálogo si el mensaje no la nombra (para que
   la señal negativa de `calcularConfianza` no se pierda), y se limpian
   `perfil.carrito`/`perfil.oferta_combo` (ya no son "lo que te gustó").
4. **"Me gusta esa, resérvala" (quick-reply exacto) no confirmaba nada**:
   `PATRON_CONFIRMACION` solo reconocía la forma masculina "resérvalo" y
   encima solo tras el prefijo "dale,"/"sí,". Se agregó la forma femenina
   ("resérvala"/"apártala") y una versión suelta (sin prefijo obligatorio)
   para que un cliente real que solo escribe "resérvala" también confirme.
5. **"No me gusta" registraba una señal positiva**: `me_gusta` hacía
   match por substring simple con "me gusta", así que "no me gusta esa"
   activaba la señal `me_gusta` (favorito) en el mismo mensaje que la
   rechaza. Se agregó un lookbehind negativo (`(?<!no )me gusta`) para el
   caso de negación más común, sin tocar frases reales como "me gusta
   esta" o "esa me gusta".

Además se restructuró el flujo por defecto (ver sección de arriba: Darwin
ahora recomienda 1 sola actividad primero, según expertise, y ofrece
combinar en vez de imponer un combo de entrada). Regresión completa sin
cambios tras los 5 fixes: 11/11 algoritmos + todos los escenarios previos.

## Orden de la información: precio al final, no al principio

El usuario mandó 2 screenshots más comparando la respuesta de Darwin con
el "Resumen de tu reserva" real de su sitio, y fue explícito: *"el precio
va de último. Primero que entiendas cuáles y cuántos panoramas te estoy
ofreciendo, cuánto dura cada uno y cuán lejos están entre ellos. No mucho
texto ni cosas que molesten visualmente."* Aclaró que esto es sobre el
**orden de las ideas**, no un pedido de rediseñar la UI de chat (el
producto final no es un chat, ver sección de arriba) — el texto de
`plantillas.js` es donde se piensa esa jerarquía antes de que exista la
UI visual real.

Se reordenó `formatearCombo` y `formatearPlanMultiDia` en
`js/plantillas.js`:
1. Intro breve + título (con conteo explícito si son 2+ panoramas, ej.
   "🏔️ 2 panoramas: Trekking cascada escondida + Cata guiada en viña
   boutique" — antes no se decía cuántos, solo se encadenaban los
   nombres).
2. Bloque de cada actividad (hora, duración, punto de encuentro, cómo
   llegar, dato de local si aplica).
3. Distancia/tiempo **entre** los panoramas del combo — el dato que pidió
   explícitamente ver temprano, porque "es parte de lo que hace el bot,
   combinaciones posibles".
4. Distancia desde el origen del cliente, ayuda de traslado, clima, plan B
   (secundarios, después de entender el plan en sí).
5. **Precio al final**, justo antes del "porque..." y la pregunta de
   cierre — antes aparecía inmediatamente después del título, muy arriba.

Verificado con Playwright en los 5 escenarios existentes (aniversario,
paquete de 2 actividades, plan multi-día, divergencia, grupo de 2
personas, clima dual) — mismo contenido, nuevo orden, sin regresiones
(11/11 algoritmos + todos los escenarios previos).

## Restricciones reales: accesibilidad y exclusiones (bug de seguridad/usabilidad)

Preguntando "qué más podemos reforzar", se probó sistemáticamente el
manejo de restricciones y apareció un gap real y serio: un cliente que
escribía *"voy en silla de ruedas, necesito que sea accesible"* igual
recibía "Trekking cascada escondida" — una actividad marcada
`accesible: false` en el catálogo. El filtro duro correspondiente
(`violaRestriccion` en `js/algoritmos.js`, tipo `'accesible'`/`'sin_<tag>'`)
ya existía y funcionaba bien, pero **nada en la capa de NLU de
`js/motor.js` poblaba `perfil.restricciones` desde texto real** — el
mecanismo estaba construido pero desconectado del cliente.

Fix:
- `detectarRestricciones(texto)` (nuevo, en `js/motor.js`) reconoce
  necesidad de accesibilidad ("silla de ruedas", "accesible",
  "movilidad reducida") y exclusión de alcohol ("sin alcohol", "no
  tomamos/bebemos/consumimos alcohol"), devolviendo los strings en el
  formato exacto que ya esperaba `parseRestriccion` (`'accesible'`,
  `'sin_contiene_alcohol'`).
- Se descubrió un segundo problema al verificar: el filtro duro de
  `rankear_combos` solo corría sobre los candidatos armados en
  `proponerCombos` — pero las 3 búsquedas de "complemento cercano" (oferta
  después de la recomendación única, fallback de "quiero paquete" con 1
  sola actividad en categoría, y "panoramas cerca de ahí") usaban
  `buscarActividades` directo, sin pasar por ese filtro. Un cliente podía
  pedir algo accesible, recibir la actividad correcta, y aun así que se le
  **ofreciera agregar** un complemento no accesible. Se agregó soporte de
  `restricciones` directo a `buscarActividades` (`js/tools.js`,
  `actividadViolaRestriccion`) y se pasó `perfil.restricciones` en los 5
  puntos donde se buscan actividades.
- Efecto secundario bueno no buscado: como ninguna de las 3 actividades
  `aventura` del catálogo mock es accesible, pedir "aventura accesible"
  ahora activa honestamente el fallback a todo el catálogo (ya filtrado
  por restricción) y ofrece otra categoría que sí califica, en vez de
  fallar en seco o (peor) recomendar igual la no-accesible.

Verificado con Playwright: pedir "aventura, accesible" sin alternativa
accesible en esa categoría → recomienda otra categoría real y accesible;
pedir "relax, accesible" (con alternativa disponible) → recomienda
correctamente y la oferta de complemento también es accesible; pedir
"enología, sin alcohol" → excluye la única cata de vinos del catálogo
(tag `contiene_alcohol`) y recomienda otra cosa. Regresión completa sin
cambios: 11/11 algoritmos + todos los escenarios previos.

**Limitación conocida**: `armarPlanMultiDia` (la secuencia demo fija
cabaña+termas+trekking) todavía no aplica `restricciones` — es un plan
hardcodeado documentado como demo de punta a punta, no un buscador
dinámico; aplicar restricciones ahí espera a que se generalice (ver
Pendiente).

## Catálogo de muestra con negocios reales (testing, NO comiteado a git)

El usuario pasó un directorio real de negocios turísticos chilenos
(`chile_experiences_OK_1.csv`: ~28.220 negocios, 178 categorías reales, las
17 regiones de Chile) para poder testear con nombres/ubicaciones reales en
vez del catálogo placeholder de 13 actividades inventadas. Decisiones
confirmadas por el usuario:

1. **Estimar** precio/duración/horario/energía/accesibilidad por categoría
   (con heurísticas razonables, no al azar), marcado explícitamente como
   estimado — el nombre del negocio, la categoría real y la ubicación
   (lat/lng, extraídas de la URL de Google Maps del negocio) sí son reales.
2. **NO comitear** estos datos reales a git todavía (instrucción explícita:
   "no quiero que la subas" / "mantenerlo solo en esta sesión"). El archivo
   generado (`data/catalogo.real-sample.js`) vive en `.gitignore` — **nunca
   se sube**, y por eso este README tampoco lista nombres de negocios
   reales, ni siquiera como ejemplo.
3. **Muestra representativa** de ~200 negocios (≈22 por cada uno de los 9
   buckets/arquetipos), no el CSV completo — un motor 100% cliente sin
   backend/paginación no tiene por qué cargar 28 mil filas para poder
   testear el flujo completo.

**Cómo se genera**: `bot-darwin/scripts/generar_catalogo_real_sample.py`
(sí está comiteado — es solo lógica/heurísticas, no contiene ningún dato
real de negocios) lee el CSV, mapea cada categoría real a su bucket usando
la misma tabla que `data/taxonomia-categorias.js`, filtra negocios
sospechosos de estar mal categorizados (ver abajo), muestrea ~22 por
bucket con diversidad de región, y escribe el JS con el mismo contrato
que `catalogo.mock.js`. Se corre así: `python3
bot-darwin/scripts/generar_catalogo_real_sample.py <ruta_al_csv>`.

**Filtro de negocios mal categorizados**: igual que con el CSV anterior de
esta misma sesión, el scraping original mezcla negocios no-turísticos
bajo categorías de turismo (ej. talleres mecánicos bajo "Taller de
cerámica", universidades bajo "Escuela de equitación", clínicas bajo
"Masajes"). El script filtra por ~90 palabras clave de rubros no
turísticos (automotriz, salud/estética, gobierno/municipal, capacitación,
construcción, etc.), incluyendo variantes/plurales y texto con símbolos
Unicode "estilizados" (ej. nombres en negrita de Instagram que evaden un
filtro de texto plano simple — se normalizan con NFKC antes de comparar).
Aun así, en una muestra de ~200 sobre 28 mil filas sin curar a mano,
**queda un residual pequeño de ambigüedad** (nombres genéricos tipo
"Comercial X SpA" o "Taller de Juan" que podrían ser legítimos o no) — es
una limitación esperada de un filtro por palabras clave, no un bug; se
puede seguir afinando la lista de palabras si aparece algo obvio al
testear.

**Cómo probarlo**: en `preview.html`, botón "🗂️ Catálogo: prueba" (junto a
"Reiniciar sesión") cambia en caliente entre el catálogo placeholder y la
muestra real vía `configurarFuenteCatalogo` — sin recargar la página. Si
el archivo no existe en el checkout (ej. sesión nueva sin regenerar), el
botón avisa en vez de fallar en silencio. El botón queda embebido también
en el HTML autocontenido que se le manda al usuario, siempre que el
archivo exista al momento de generarlo.

## Cómo probarlo localmente

```bash
python3 -m http.server 8811   # desde la raíz del repo
```
Abrir `http://localhost:8811/bot-darwin/preview.html` — chat de prueba +
panel de debug con el perfil interno (`E1`), el `intent_score` y los
combos rankeados en cada turno. Botón "Reiniciar sesión" limpia el
estado de esa sesión de prueba (localStorage namespaced, no toca las
keys `pickmap_*` de producción).

Tests de los algoritmos: `http://localhost:8811/bot-darwin/test/algoritmos.test.html`
(recencia, repetición con rendimientos decrecientes, confianza por
volumen/consistencia, filtros duros, cambio de ranking por arquetipo).

## Cómo conectar la BD real cuando el usuario la pase

`js/tools.js` expone `configurarFuenteCatalogo(fn)`: `fn` debe devolver un
arreglo de actividades con la misma forma que documenta
`data/catalogo.mock.js` (id, nombre, categoria, tags, precio,
duracion_min, ubicacion{lat,lng,comuna}, energia, exterior, indoor_alt,
accesible, experiencia_estimada, hero_moment, horarios, punto_encuentro,
incluye, no_incluye, restricciones, cupos por fecha/hora, y los opcionales
tipo/es_gema_oculta/evita_trampa). Con eso enchufado, nada más en el motor
cambia.

## Fases (según pickmap_fuentes_a_conectar.pdf)

- [x] Fase 1 — catálogo + disponibilidad + traza + calcular_confianza (con datos placeholder)
- [x] Fase 2 — clima + rutas + horarios (código real, pendiente de probar con internet real)
- [~] Fase 3 — afluencia + eventos locales (heurística/placeholder) + rankear_combos (completo)
- [ ] Fase 4 — memoria entre sesiones real + bucle de aprendizaje de pesos w1..w8 (sección 3 de la spec de algoritmos; no implementado, queda para cuando haya datos reales de conversión)

## Disponibilidad multi-negocio: decisión tomada (aún sin implementar)

Cómo `verificar_disponibilidad` va a manejar la disponibilidad real de
"muchos negocios de distintos rubros y ubicaciones" (A1 del system
prompt), inspirado en cómo lo resuelve Booking.com (verificado, no de
memoria — ver fuentes abajo):

- **Pickmap es la única fuente de verdad** de disponibilidad (no cada
  negocio sincronizado desde su propio sistema externo, salvo que a
  futuro se justifique un "channel manager" para negocios grandes que ya
  tengan uno — eso queda como v2 opcional, no bloquea el lanzamiento).
- **El negocio configura una plantilla, no un calendario diario**: cupos
  por día de semana + horario, una sola vez. Solo vuelve a entrar para
  marcar **excepciones** (bloquear un día, subir/bajar cupos puntuales) —
  equivalente al Extranet de Booking, donde la carga es baja y los
  cambios quedan reflejados en el momento.
- **Cada reserva que hace el propio bot descuenta cupo automático** — el
  negocio no tiene que avisar nada por lo que se vende a través de
  Pickmap (igual que el "pool allotment" de Booking: el inventario se
  descuenta solo desde el canal de venta).
- **Puntaje de confiabilidad por negocio** alimentando `rankear_combos`
  como una dimensión más: si un negocio cancela reservas ya confirmadas
  por su lado (no si el cliente cancela bajo una política válida — ese
  matiz importa y así lo hace Booking), el bot le baja prioridad de forma
  automática. Es el mecanismo real de "hacer que lo cumplan": conviene
  económicamente mantenerlo al día, no depende de fiscalizar a nadie.
- **Confirmación instantánea por defecto.** Un modo "solicitud de
  reserva" (el negocio confirma en una ventana corta antes de cobrar) se
  deja como fallback solo para negocios nuevos sin historial — este
  último punto es una propuesta razonable por analogía con Airbnb
  Experiences, no algo verificado específicamente para Booking.

Falta: definir el modelo de datos exacto (`negocio_id` en cada slot de
cupos), la UI de la plantilla+excepciones en `negocio-calendario.html`
(hoy esa página solo *muestra* reservas, no deja definir cupos), y cómo
se calcula/expone el puntaje de confiabilidad. No implementar hasta
tener la BD real conectada.

Fuentes consultadas: [Booking.com Extranet Guide](https://phptravels.com/booking-com-extranet),
[Updating rates and availability — Booking.com for Partners](https://partner.booking.com/en-us/help/rates-availability/extranet-calendar/updating-your-rates-and-availability),
[Extranet in Travel Booking Systems — AltexSoft](https://www.altexsoft.com/blog/extranet-in-travel-booking-systems/),
[Booking.com Ranking Algorithm Explained](https://www.smartorder.ai/resources/blog/booking-com-ranking-algorithm/),
[Understanding Cancellation Policies — Booking.com developers](https://developers.booking.com/connectivity/docs/policies-api/understanding-cancellation-policy).

## Pendiente antes de "inyectar" en el sitio real

- [ ] Reemplazar `data/catalogo.mock.js` por la BD real del usuario.
- [ ] Implementar disponibilidad multi-negocio según la sección de arriba (plantilla+excepciones, descuento automático, puntaje de confiabilidad).
- [ ] Reemplazar `js/afluencia.js` por datos reales de reservas/feriados.
- [ ] Definir flujo de reserva/pago real (E5 del system prompt, sigue `[COMPLETAR]`).
- [ ] Definir canal de derivación a humano (E5, sigue `[COMPLETAR]`).
- [ ] Decidir si en algún momento se conecta un LLM real (Claude) para reemplazar la detección por palabras clave — el punto de enganche son `algoritmos.js`/`tools.js` como tools.
- [ ] Probar `js/contexto.js` y `navigator.geolocation` (Open-Meteo/OSRM/ubicación real) con salida a internet real — no se pudo verificar en este sandbox ni en el preview alojado (CSP bloquea red externa); sí se puede probar abriendo el archivo local en un navegador normal.
- [ ] Generalizar `armarPlanMultiDia`: hoy es una secuencia fija de demo (cabaña+termas+trekking, sur de Chile) para probar el concepto de punta a punta — falta que arme planes de N días para cualquier combinación de categorías/regiones una vez haya más catálogo real.
- [ ] Agregar estacionamiento/cómo-llegar real por negocio al contrato de datos — hoy `fraseLlegada()` es una guía genérica por categoría (mismo criterio que ya usa el sitio real en `ARRIVAL_BY_CATEGORY`), no un dato preciso por local.
