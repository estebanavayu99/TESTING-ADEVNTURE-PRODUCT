# Pickmap — notas para trabajar en este repo

Sitio de marketing + demo funcional de "Pickmap" (app de panoramas/turismo).
Público objetivo: viajeros ("Soy viajero") y negocios turísticos aliados
("Soy empresa"). Producción: pickmap.cl.

## Stack y arquitectura

- Sitio estático, sin build step. HTML/CSS/JS planos servidos tal cual.
- `<script>` compartidos entre páginas; funciones helper (fmtMoney, fmtDate,
  etc.) están duplicadas literalmente en cada archivo que las necesita — es
  el patrón establecido, no "arreglar" moviéndolas a un módulo compartido
  sin que te lo pidan.
- Auth y persistencia son 100% falsas, vía `localStorage`:
  - viajero: sesión de cliente normal.
  - empresa: `pickmap_business_users`, `pickmap_business_session`,
    `pickmap_business_reservations_${email}`, `pickmap_business_reviews_${email}`,
    `pickmap_business_referrals_${email}`.
- Datos demo del panel de empresa se generan con un LCG (`seedRandom(seed)`)
  sembrado por `20240711 + hashStr(bizEmail)` (u otros offsets), para que
  cada cuenta tenga datos distintos pero estables entre recargas.
- `js/negocio.js` es el módulo compartido de las 6 páginas `negocio-*.html`
  (Resumen, Reservas, Pagos, Reseñas, Referidos, Calendario) y expone
  `window.PickmapNegocio` con getters + helpers de modal.
- **La IA se llama "Darwin"** en todo el texto visible del sitio (antes
  "Beto"). Los identificadores internos de código quedaron sin tocar a
  propósito — clases (`.beto-chat`, `.beto__profile`), IDs
  (`betoChatFab`, `betoChatPanel`) y el archivo `js/beto-chat.js` siguen
  usando "beto" en minúscula. Si agregas texto visible nuevo sobre la IA,
  usa "Darwin"; si tocas el widget de chat en código, sigue usando el
  prefijo `beto` en selectores/IDs para no romper referencias existentes.

## Gotchas conocidos

- **CSS `[hidden]` vs. cascada de autor**: cualquier componente nuevo que
  use el atributo `hidden` para mostrar/ocultar necesita explícitamente
  `.mi-componente[hidden] { display: none; }` en el CSS, porque reglas de
  autor con `display:` pueden ganarle a `[hidden]` en la cascada. Ya pasó
  varias veces en este repo — escribirlo desde el principio en componentes
  nuevos (chat de Darwin, menú de usuario, modales, etc.).
- **Especificidad CSS con badges de estado**: reglas tipo
  `.biz-modal__row span:last-child { color: ... }` (0,2,1) le ganan a
  overrides ingenuos tipo `.biz-modal__estado--confirmada { color: ... }`
  (0,1,0). Hay que escribir el override combinando ambos selectores
  (`.biz-modal__row span:last-child.biz-modal__estado--confirmada`) para
  que gane.
- **Shell: nunca encadenar `pkill ... && algo`**: `pkill` devuelve código de
  salida distinto de cero (144) cuando no encuentra el proceso, lo que
  rompe silenciosamente cualquier cadena `&&` posterior (por ejemplo, un
  commit que nunca se ejecuta). Ejecutar `pkill` y los comandos git
  siguientes como llamadas de Bash **separadas**, nunca encadenadas.
- **`.nav` no puede tener fondo transparente**: es `position: sticky`. Si
  el fondo es `transparent`, cuando el usuario hace scroll el contenido
  que pasa por debajo se ve "a través" del nav y se superpone visualmente
  con el logo/pills (bug real, confirmado con screenshot de producción).
  Debe llevar siempre un fondo sólido o esmerilado (mismo patrón
  `rgba(255,255,255,.55) + backdrop-filter: blur()` que `.hero__copy` /
  `.puntos__copy` / `.cta-final__copy`), nunca `transparent`.
- **CDN de fotos placeholder: usar Unsplash, no Picsum**: `picsum.photos`
  se bloquea en algunas redes/equipos (confirmado por el usuario — hard
  refresh no lo arregló). `images.unsplash.com` es el estándar de la
  industria y casi nunca se bloquea; preferirlo para cualquier imagen de
  stock/fake en el sitio.
- **Overflow horizontal en mobile por filas flex sin `flex-wrap`**: una
  fila flex sin `flex-wrap` (ej. `.hero__stats`) no se achica por debajo
  del ancho mínimo de su contenido (`min-width:auto` por defecto en
  flex/grid), así que en viewports angostos revienta el ancho de todo el
  contenedor padre (grid de una sola columna incluido) y termina en
  scroll horizontal de toda la página. Se detecta con
  `document.body.scrollWidth` > `window.innerWidth` en Playwright. Fix:
  `flex-wrap: wrap` en la fila, y si sigue sin alcanzar, reforzar los
  breakpoints angostos del nav (`.nav__actions`, `.mode-toggle__opt`,
  `.logo`) — probar explícitamente a 390px, 375px y 320px, no solo un
  breakpoint "mobile" genérico.

## Verificación visual

- El sandbox no tiene salida directa a internet (ni pickmap.cl ni
  google.com son alcanzables), así que toda verificación visual es local:
  `python3 -m http.server 8811` en background + Playwright con
  `executablePath: '/opt/pw-browsers/chromium'`, screenshots a la carpeta
  scratchpad.
- Para producción real, confiar en las capturas que manda el usuario.
- El FAB de Darwin tiene una animación de rebote continua (`betoFabBounce`),
  lo que puede hacer fallar el chequeo "wait for stable" de Playwright al
  hacer `.click()`. Usar `force=True`/`force: true` en los tests, no es un
  bug real de producto.

## Flujo de trabajo / deploy

- Rama `claude/funly-platform-website-huzmqt` es a la vez rama por
  defecto y de producción: cada push a ella se despliega automáticamente
  a pickmap.cl vía Vercel. No hay URL de preview separada.
- Flujo normal: editar → levantar server local + Playwright para verificar
  → `git add` de los archivos tocados → commit descriptivo → push directo
  a esa rama (no se abren PRs a menos que el usuario lo pida explícitamente).
- Repo tiene una sola rama (no hay `main` separado), así que no cabe abrir
  PR salvo que el usuario pida explícitamente crear una rama base nueva.

## Notificaciones (spec para lanzamiento real — aún NO implementado)

El usuario compartió `PickMap_Diagrama_Notificaciones_v2.pdf` con el set de
notificaciones que espera tener una vez la plataforma esté lanzada con
clientes reales (hoy no hay backend ni envío de emails real, todo es
`localStorage`; esto es referencia para cuando exista esa infraestructura).

**Vista Cliente** (todas por email):
| Etapa | Evento | Contenido |
|---|---|---|
| Cuenta | Crear cuenta | Bienvenida |
| Cuenta | Recuperar contraseña | Enlace seguro |
| Reserva | Reserva confirmada | Confirmación |
| Reserva | Reserva cancelada | Confirmación de cancelación |
| Recordatorio | 24 horas antes | Recordatorio |
| Post experiencia | Reserva completada | Resumen + puntos + reseña + recomendaciones IA |

**Vista Empresa** (notificación a la empresa):
| Evento | Notificación |
|---|---|
| Nueva reserva | Notificación inmediata con datos del cliente + botón "Ver calendario" (abre el calendario propio de la empresa en Pickmap) |
| Reserva cancelada | Aviso de cancelación + botón "Ver calendario" |
| Reserva modificada | Detalle de los cambios + botón "Ver calendario" |
| 24 horas antes | Recordatorio de las reservas del día siguiente + botón "Ver calendario" |
| Cliente completó experiencia | Solicitud para validar asistencia (opcional) + acceso al calendario |
| Cliente dejó reseña | Notificación con puntuación y comentario + acceso al panel |
| Reseña negativa | Alerta prioritaria + acceso al panel para responder |

No implementar mientras el sitio siga siendo demo estática; es la
referencia a seguir cuando se construya el backend/envío real de emails.

- **Preview de diseño guardado**: `notificaciones-preview.html` (raíz del
  repo) tiene las 13 plantillas de email ya maquetadas con la marca de
  Pickmap (inbox simulado: lista a la izquierda + preview del correo a la
  derecha, con toggle de tema). Es solo una página de referencia para
  iterar el diseño — no está enlazada desde el nav ni desde ninguna otra
  página del sitio (lleva `<meta name="robots" content="noindex, nofollow">`),
  y no envía correos reales. Las 4 notificaciones "buenas" para el cliente
  (Bienvenida, Reserva confirmada, Recordatorio 24h, Post experiencia)
  usan una barra superior a rayas (coral/amarillo/verde) + un recuadro de
  "dato random" con humor; las demás (cancelaciones, seguridad, reseña
  negativa) se mantienen serias a propósito.

## Bot "Darwin" super inteligente (en construcción, aislado en /bot-darwin/)

El usuario compartió 3 specs (`pickmap_fuentes_a_conectar.pdf`,
`pickmap_algoritmos_spec.pdf`, `pickmap_system_prompt_v4.pdf`) para un
agente de turismo mucho más sofisticado que el `js/beto-chat.js` actual
(catálogo real, clima/rutas reales, dos algoritmos determinísticos —
`calcular_confianza` y `rankear_combos` — y venta consultiva por
arquetipo/embudo/estado emocional). Se está construyendo en
`/bot-darwin/`, **aislado y sin enlazar desde el sitio ni desde el nav**
(mismo patrón que `notificaciones-preview.html`: `noindex, nofollow`, sin
links entrantes) — instrucción explícita del usuario de no meter nada a
producción hasta estar 100% listo. Ver `bot-darwin/README.md` para el
detalle completo (qué está simulado/placeholder vs. real, cómo probarlo
con `python3 -m http.server` + `bot-darwin/preview.html`, cómo se
conecta la BD real cuando el usuario la pase, y el checklist de fases
pendientes).

Decisiones tomadas para esta etapa (pueden revisarse más adelante):
- Motor **sin LLM real**: reglas/heurísticas deterministas
  (`js/motor.js` + `js/plantillas.js`), no llamadas a la API de Claude.
  Los dos algoritmos y las tools ya están separados del resto del código
  específicamente para que, el día que se conecte un LLM real, pasen a
  ser las *tools* que ese LLM invoca sin tener que reescribirlos.
- Catálogo: placeholder en `data/catalogo.mock.js` hasta que el usuario
  pase su BD real (contrato de datos documentado en ese archivo y en el
  README).
- Clima/rutas (`js/contexto.js`): código real contra Open-Meteo/OSRM
  (gratis, sin API key) — no se puede probar en este sandbox por falta
  de salida a internet, pero corre igual cuando el bot esté en un
  navegador con red.
- Afluencia/eventos locales (`js/afluencia.js`): heurística/placeholder,
  a reemplazar por datos reales de reservas y feriados/festivales.

## Instrucción permanente del usuario: código blindado + todo registrado

- **Blindar el código**: antes de dar por hecho un cambio, verificarlo
  (Playwright local cuando aplica) y no dejar código a medio hacer. Evitar
  regresiones: si se toca una función/CSS compartida, revisar qué otras
  páginas la usan (grep) antes de modificarla o borrarla.
- **Registrar todo**: cada sesión que agregue una convención nueva, un
  gotcha nuevo, o cambie el flujo de trabajo, debe reflejarlo en este
  archivo (`CLAUDE.md`) como parte del mismo commit, no como tarea aparte.
  Este archivo es la memoria persistente del proyecto entre sesiones.
