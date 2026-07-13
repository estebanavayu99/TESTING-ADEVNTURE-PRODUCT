# Darwin — bot inteligente (en construcción, NO conectado al sitio)

Esta carpeta es un laboratorio aislado. Nada de lo que hay acá está
enlazado desde el sitio ni se inyecta en producción — es a propósito,
por instrucción del usuario ("no metemos nada hasta estar 100% listo").
Cuando esté listo, "inyectar" significa: cargar estos mismos `<script>`
desde una página real y reemplazar `js/beto-chat.js` por una versión que
llame a `PickmapDarwin.motor.procesarMensaje(...)`.

Basado en los 3 documentos que armó el usuario:
- `pickmap_fuentes_a_conectar.pdf` — qué fuente conecta cada tool, por prioridad.
- `pickmap_algoritmos_spec.pdf` — matemática de `calcular_confianza` y `rankear_combos`.
- `pickmap_system_prompt_v4.pdf` — reglas de negocio/venta consultiva del agente.

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
| `js/contexto.js` — clima, hora_solar (Open-Meteo) / calcular_ruta, optimizar_itinerario (OSRM) | **Llamadas de red reales**, gratis, sin API key. No se pueden probar en este sandbox (sin salida a internet) pero funcionan apenas el bot corra en un navegador con red |
| `js/contexto.js` — hora_local | Real, cálculo local con `Intl`, sin red |
| `js/afluencia.js` — afluencia, eventos_locales | **Heurística/placeholder** — reemplazar por datos reales de reservas y calendario de feriados/festivales cuando existan |
| `js/motor.js`, `js/plantillas.js` | Reglas del system prompt v4 implementadas como código determinístico (sin LLM) |

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
incluye, no_incluye, restricciones, cupos por fecha/hora). Con eso
enchufado, nada más en el motor cambia.

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
- [ ] Probar `js/contexto.js` (Open-Meteo/OSRM) con salida a internet real — no se pudo verificar en este sandbox.
