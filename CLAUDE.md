# Pickmap — notas para trabajar en este repo

Sitio de marketing + demo funcional de "Pickmap" (app de panoramas/turismo).
Público objetivo: viajeros ("Soy viajero") y negocios turísticos aliados
("Soy empresa"). Producción: pickmap.cl.

## Stack y arquitectura

- Sitio estático, sin build step. HTML/CSS/JS planos servidos tal cual.
- **Backend real del sitio, dos funciones serverless de Vercel**
  (zero-config, sin `package.json`; Vercel detecta cualquier `.js` dentro
  de `api/` como función automáticamente):
  - `api/send-verification.js`: recibe `{ email, firstName, code?, link? }`
    desde `js/auth.js` y manda el correo real **directo con Resend**
    (`RESEND_API_KEY` en Vercel, dominio pickmap.cl ya verificado ahí —
    `from: contacto@pickmap.cl`). El HTML del correo (con el botón,
    branding Pick**Map**, etc.) vive **en este archivo**, no en ningún
    workflow externo — se eligió Resend específicamente porque GHL
    (Quick Compose) no dejaba estilizar el botón de verificación por más
    HTML/CSS que se probara (ver historial de intentos fallidos:
    `!important`, `<span>` anidado, `<font color>`, tabla con `<td>` de
    fondo — todos perdían el color/subrayado del `<a>`); con Resend se
    manda el HTML tal cual, sin ningún editor de por medio que lo
    reescriba.
  - `api/create-ghl-contact.js`: crea/actualiza el contacto en GHL
    (`GHL_API_TOKEN`, `GHL_LOCATION_ID`, mismo patrón de API que la
    alternativa "Contact Tag" de antes) — pero se llama **solo después de
    que la verificación fue real** (desde `js/auth.js`, en el bloque que
    procesa `?verify=<token>`), nunca en el momento del signup. Decisión
    explícita del usuario (2026-07-16): no quiere que cada intento de
    registro (incluidas pruebas) ensucie el CRM de GHL con contactos sin
    verificar — GHL debe reflejar solo usuarios reales y confirmados.
  - GHL ya no interviene para nada en el envío del correo de verificación
    de cuenta. El workflow de GHL con trigger "Contact Tag" (de la
    alternativa gratis a Inbound Webhook, ver commits `9c66212`/`a907c72`)
    y el trigger "Inbound Webhook" (que quedó permanentemente bloqueado
    en la cuenta del usuario por el "Mapping Reference" que nunca capturó
    una muestra pese a ~10 intentos con 200 OK confirmados en los logs de
    Vercel) quedan ambos sin usar — el segundo especialmente no vale la
    pena reintentar. `GHL_VERIFY_WEBHOOK_URL`/`GHL_VERIFY_FIELD_KEY`/
    `GHL_VERIFY_TAG` quedaron en Vercel sin uso, por si acaso.
  **Verificación de cuenta = magic link, no código**: al crear una
  cuenta, `js/auth.js` genera un `verificationToken` random (no un
  código de 6 dígitos) y manda por correo un link
  `login.html?verify=<token>`. Al abrirlo, el código al inicio del mismo
  `js/auth.js` (antes del chequeo de "ya hay sesión activa") busca el
  token en `pickmap_users`, marca `verified: true`, loguea a la persona
  directo (`setSession` + redirect a onboarding/dashboard), dispara
  `createGhlContact(user)` (fire-and-forget, no bloqueante) — nunca la
  manda de vuelta a loguearse a mano. La pantalla de espera
  (`#formVerify` en `login.html`, ya no es un `<form>`, es un `<div>`
  sin input) solo dice "revisa tu correo", con botones "Reenviar correo"
  y "Volver a iniciar sesión". Recuperar contraseña (`startForgotReset`)
  sigue siendo con código de 6 dígitos ingresado a mano (no se tocó, y no
  crea contacto en GHL) — ambos flujos comparten
  `sendVerificationEmail(email, firstName, extra)`, donde `extra` es
  `{ link }` o `{ code }` según cuál sea. Si el envío real falla, el
  fallback ya no muestra un código en pantalla para la verificación de
  cuenta — muestra el link de confirmación como texto clickeable
  (`#verifyLinkFallback`); recuperar contraseña sigue mostrando el
  código como fallback, igual que antes.
  `js/auth-empresa.js` todavía NO tiene ninguno de estos cambios (sigue
  mostrando el código en pantalla siempre, sin envío real) — replicar el
  mismo patrón ahí si se pide lo mismo para el login de empresa.
- `<script>` compartidos entre páginas; funciones helper (fmtMoney, fmtDate,
  etc.) están duplicadas literalmente en cada archivo que las necesita — es
  el patrón establecido, no "arreglar" moviéndolas a un módulo compartido
  sin que te lo pidan.
- Auth y persistencia son 100% falsas, vía `localStorage`:
  - viajero: sesión de cliente normal.
  - empresa: `pickmap_business_users`, `pickmap_business_session`,
    `pickmap_business_reservations_${email}`, `pickmap_business_reviews_${email}`,
    `pickmap_business_referrals_${email}`.
- **Esquema de datos del usuario viajero** (`pickmap_users`, cada objeto):
  `name` (nombre + apellido concatenados en un solo string — el resto del
  código, ej. saludos en dashboard/onboarding/invita, hace
  `.trim().split(' ')[0]` para sacar solo el primer nombre, así que
  `name` SIEMPRE debe llevar al menos dos palabras), `rut`, `email`,
  `phone` (opcional), `password`. El signup (`login.html` → `js/auth.js`)
  y el form de "Mi cuenta" (`dashboard.html` → `js/dashboard.js`, con
  inputs separados `settingsFirstName`/`settingsLastName`) usan campos
  separados de Nombre/Apellido en la UI pero los combinan a `name` al
  guardar — si agregas otro punto de entrada de datos del usuario, seguir
  el mismo patrón (campos separados en el form, concatenados al guardar)
  en vez de agregar un `firstName`/`lastName` real al objeto.
- Datos demo del panel de empresa se generan con un LCG (`seedRandom(seed)`)
  sembrado por `20240711 + hashStr(bizEmail)` (u otros offsets), para que
  cada cuenta tenga datos distintos pero estables entre recargas.
- `js/negocio.js` es el módulo compartido de las 6 páginas `negocio-*.html`
  (Resumen, Reservas, Pagos, Reseñas, Referidos, Calendario) y expone
  `window.PickmapNegocio` con getters + helpers de modal.
- **"Por qué Darwin te lo recomienda"**: cada item del catálogo
  (`TASTE_POOL`/`COMPANY_POOL`/`DEFAULT_POOL` en `js/panoramas.js`) trae un
  campo `reason` con una frase sofisticada y completa (ej. "Tu perfil
  muestra una afinidad sostenida por experiencias al aire libre y de
  aventura."), pensada para sonar a razonamiento real de un motor de IA, no
  a frase casual. Cada tarjeta (`cardHTML`) muestra un hint pequeño
  "🧠 Por qué te lo recomienda Darwin"; al abrir el modal de detalle
  (`modalHTML`), la función `whyHTML(item)` arma un callout con ese
  `reason` como "señal principal" más viñetas dinámicas generadas a partir
  de datos reales del item cruzados con las preferencias declaradas por el
  usuario en onboarding (`difficultyPrefs`/`budgetPrefs`/`distancePrefs`/
  `dayPrefs`, las mismas variables que usa `matchScore()` para ordenar
  "Recomendado para ti") — nunca texto inventado sin respaldo en datos. La
  pestaña "General" del explorador fuerza `reason: null` (ver el array
  `general`) y cae en un párrafo distinto sobre comportamiento colectivo en
  vez de preferencias personales; el listener de click/teclado de las
  tarjetas usa `cardItemFor(card)` (no `CATALOG.find` directo) para
  resolver el item desde la lista correcta según la pestaña activa —
  buscar siempre en `CATALOG` filtraría la razón personalizada incluso en
  la pestaña "General". `js/favoritos.js` duplica `whyHTML` (patrón
  establecido) pero sin las viñetas de match de preferencias, ya que esa
  página no tiene acceso al perfil de onboarding, solo al snapshot
  guardado del item favorito.
- **Escala compacta de las páginas logueadas**: `css/dashboard.css` (cargado
  por dashboard, panoramas, favoritos, invita, negocio-*, pickpoints — no
  por index/login/onboarding) trae `html { font-size: 90%; }` de base, y
  `78%` desde `@media (min-width: 721px)` — porque a 100% de zoom por
  defecto en el navegador el usuario lo sentía demasiado grande
  **específicamente en desktop/PC** (se probó 90% en desktop primero y
  el usuario dijo que seguía viéndose grande, así que se bajó a 78% pero
  solo por encima de 720px, el mismo breakpoint mobile del resto del
  sitio, para no volver a achicar el mobile que ya se había ajustado
  aparte). Como casi todo ese CSS usa `rem`, bajar el font-size raíz
  encoge tipografía y espaciados de forma proporcional en cascada sin
  tocar layout, orden ni breakpoints. Si hace falta ajustar la densidad
  de desktop o mobile de nuevo, tocar el valor correspondiente de este
  mismo bloque en vez de ir cambiando tamaños sueltos por componente.
- **El tamaño de las tarjetas de panorama NO es puramente `rem`**: a
  diferencia del resto de `css/panoramas.css`, `.pano-row__scroll
  .pano-card` (ancho fijo, 216px), `.pano-grid` (`minmax(234px, 1fr)`) y
  `.pano-card__photo` (alto fijo, 118px) están en `px` a propósito
  (scroll-snap y grid necesitan un ancho de columna estable). Por eso
  bajar el `font-size` raíz en `css/dashboard.css` encoge el texto/padding
  interno de la tarjeta pero no su ancho ni el alto de la foto — para
  achicar la tarjeta en sí hay que tocar estos tres valores en px
  directamente (ya se bajaron una vez de 240/260/132px a 216/234/118px;
  si se pide achicar más, bajar estos tres juntos y proporcionalmente).
- **La IA se llama "Darwin"** en todo el texto visible del sitio (antes
  "Beto"). Los identificadores internos de código quedaron sin tocar a
  propósito — clases (`.beto-chat`, `.beto__profile`), IDs
  (`betoChatFab`, `betoChatPanel`) y el archivo `js/beto-chat.js` siguen
  usando "beto" en minúscula. Si agregas texto visible nuevo sobre la IA,
  usa "Darwin"; si tocas el widget de chat en código, sigue usando el
  prefijo `beto` en selectores/IDs para no romper referencias existentes.
- **PWA instalable para testing en el celular**: `manifest.json` + `sw.js`
  (service worker network-first, minimalista) + íconos en `assets/`
  (`icon-192.png`, `icon-512.png`, `icon-maskable-*.png`, generados desde
  `assets/logo.png` sobre fondo `--sun`; `apple-touch-icon.png` para iOS).
  Están enlazados en todas las páginas de la app (no en
  `notificaciones-preview.html` ni `terminos.html`, que son solo
  referencia). Con esto, "Agregar a pantalla de inicio" desde el celular
  instala Pickmap con ícono propio y ventana standalone, sin publicar en
  ninguna store — sirve para testear como app mientras se itera. Si se
  agrega una página nueva de la app, replicar el mismo bloque de tags
  (manifest, meta de iOS, registro del service worker) que ya está en las
  demás páginas.

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
- **Teaser del chat de Darwin no se auto-ocultaba**: `js/beto-chat.js`
  mostraba el globo de saludo (`#betoChatTeaser`) a los 1.6s de cargar la
  página y lo dejaba abierto indefinidamente hasta que el usuario lo
  cerrara a mano. En mobile, al ser `position: fixed` sobre el FAB, tapaba
  permanentemente el final de párrafos y tarjetas mientras se scrolleaba
  por `#como-funciona`, `#beto`, `#segmentos`, `#funciones`, `#alianzas`,
  `#puntos`, `#faq` y `#cta` — se veía poco profesional (confirmado con
  screenshots de Playwright a 390px). Fix: se agregó un segundo
  `setTimeout` que oculta el teaser solo (6s después de aparecer) si el
  usuario no interactuó; el cierre manual (botón × o abrir el chat) sigue
  funcionando igual. Si se vuelve a tocar `beto-chat.js`, no quitar ese
  auto-hide sin verificar de nuevo con Playwright a 390px que ninguna
  sección quede tapada.

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
links entrantes). Ver `bot-darwin/README.md` para el detalle completo
(qué está simulado/placeholder vs. real, cómo probarlo con `python3 -m
http.server` + `bot-darwin/preview.html`, cómo se conecta la BD real
cuando el usuario la pase, y el checklist de fases pendientes).

**Ya está en producción (reachable por URL directa, instrucción
explícita del usuario para poder testear "de forma real")**: la rama de
desarrollo del bot (`claude/intelligent-bot-dev-51wg6w`) se mergeó a
esta rama de producción y se pusheó — `pickmap.cl/bot-darwin/preview.html`
queda accesible en vivo, pero sigue sin enlace entrante ni en el nav
(mismo `noindex, nofollow` de siempre). Para actualizar lo que está en
vivo tras seguir iterando en la rama de desarrollo: repetir el mismo
merge (`git fetch origin claude/funly-platform-website-huzmqt`,
`git checkout -b tmp-merge origin/claude/funly-platform-website-huzmqt`,
`git merge claude/intelligent-bot-dev-51wg6w`, verificar que el diff
contra `origin/claude/funly-platform-website-huzmqt` solo toque los
archivos esperados antes de pushear, luego `git push origin
tmp-merge:claude/funly-platform-website-huzmqt`, borrar la rama
temporal).

**`bot-darwin/data/catalogo.real-sample.js` (muestra de ~200 negocios
reales) SÍ está comiteado** — cambio de decisión explícito del usuario
("si es necesario subir a GitHub los negocios reales para poder testear
bien y real, hagámoslo"), reversando la instrucción anterior de no
subirlo. Es **data temporal de testing**: nombre/categoría/ubicación son
reales, precio/duración/horario/accesibilidad son ESTIMADOS por
categoría (ver header del archivo y `bot-darwin/scripts/
generar_catalogo_real_sample.py`). Se reemplaza por los negocios ya
firmados más adelante.

**Segunda superficie: "Darwin backend" conectado al sitio real**
(`js/darwin-backend.js` + `dashboard.html`, fuera de `/bot-darwin/`,
instrucción explícita del usuario). A diferencia del widget de soporte
general (`js/beto-chat.js`, sigue intacto, no se toca acá), esta
superficie trabaja **silenciosa, sin chat**: lee la sesión real del
viajero logueado (`pickmap_users`/`pickmap_current_user`), traduce sus
respuestas reales de `onboarding.html` (tastes/company/difficulty/
budget) a un perfil de bot-darwin, usa geolocalización real del
navegador para origen/clima, y llama directo a
`PickmapDarwin.motor.proponerCombos` (exportado en `motor.js` junto a
`proponerPlanMultiDia` específicamente para esto) — sin pasar por
`procesarMensaje`/detección de texto. Se muestra como una tarjeta nueva
en `dashboard.html` justo después del saludo ("🧠 Así piensa Darwin por
ti ahora mismo"), con un botón para aceptar la oferta de combo si
Darwin la hizo. Usa el catálogo real de negocios (arriba), no el mock.
Mapeo de gustos de onboarding (vocabulario más simple) a los 9 buckets
de bot-darwin documentado en el header de `js/darwin-backend.js` —
"shopping"/"ymas" no tienen bucket equivalente todavía y se ignoran
honestamente (no se inventa un mapeo falso).

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
