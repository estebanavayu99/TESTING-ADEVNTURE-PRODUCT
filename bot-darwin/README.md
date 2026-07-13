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

## Pendiente antes de "inyectar" en el sitio real

- [ ] Reemplazar `data/catalogo.mock.js` por la BD real del usuario.
- [ ] Reemplazar `js/afluencia.js` por datos reales de reservas/feriados.
- [ ] Definir flujo de reserva/pago real (E5 del system prompt, sigue `[COMPLETAR]`).
- [ ] Definir canal de derivación a humano (E5, sigue `[COMPLETAR]`).
- [ ] Decidir si en algún momento se conecta un LLM real (Claude) para reemplazar la detección por palabras clave — el punto de enganche son `algoritmos.js`/`tools.js` como tools.
- [ ] Probar `js/contexto.js` (Open-Meteo/OSRM) con salida a internet real — no se pudo verificar en este sandbox.
