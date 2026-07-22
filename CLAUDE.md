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
  `js/auth-empresa.js` ya tiene el mismo patrón replicado (instrucción
  del usuario, 2026-07-17): magic link real por correo en vez de código
  en pantalla, mismo `genToken()`/`sendVerificationEmail()`, mismo
  `?verify=<token>` manejado al inicio del archivo (redirige siempre a
  `negocio.html`, no hay onboarding de empresa que bifurcar). El
  `firstName` para el saludo del correo sale de la primera palabra de
  `repName` (nombre del representante), no de `name` como en el viajero.
  `#formVerify` en `login-empresa.html` pasó de `<form>` con input de
  código a `<div>` sin input (mismo cambio que `login.html`). Recuperar
  contraseña de empresa (`startForgotReset`) sigue sin tocar: código de
  6 dígitos mostrado en pantalla, sin envío real.
  **Superado 2026-07-20**: todo este bloque de auth de empresa (localStorage
  + magic link falso + código de recuperación en pantalla) fue
  reemplazado por Supabase Auth real — ver "Migración de auth de empresa
  a Supabase real" más abajo. Se deja este párrafo como registro
  histórico de cómo funcionaba antes.
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

## Contenido según modo (`.mode-client` / `.mode-business`)

- La mayoría del texto que cambia entre "Soy viajero"/"Soy empresa" se
  resuelve por elemento con `data-client`/`data-business` (`js/main.js`,
  `setMode()`). Pero para bloques ENTEROS que deben existir en un solo
  modo (no solo texto distinto), el patrón es CSS puro, no JS: dos
  elementos separados en el HTML, cada uno oculto por defecto y mostrado
  solo bajo `body.mode-business` o su opuesto — ver
  `.hero__mock`/`.hero__biz-mock` (ya existía) y `#beto`/`#beto-empresa`
  (agregado 2026-07-17, instrucción del usuario: la explicación técnica
  de Darwin — "+18 variables", "24/7 monitoreo", etc. — es solo para
  viajero; empresa ve una versión corta de venta sin tecnicismos, sin
  desglose de variables/algoritmo). **Ojo con `.card--inv`**: es texto
  blanco pensado para ir sobre el fondo oscuro de `.section--business`
  — usarlo en una sección con fondo claro (como `#beto-empresa`) deja
  las tarjetas casi invisibles; usar `.card` a secas fuera de esas
  secciones oscuras.
- El stat "100% reservas pagadas por adelantado" del hero (modo empresa)
  era literalmente falso — contradice el modelo real (comisión solo por
  reserva confirmada, liquidaciones posteriores vía `negocio-pagos.js`,
  nunca pago adelantado). Se corrigió a "0% riesgo: pagas solo por
  reserva confirmada". Si se agregan más stats con `data-business`,
  verificar que el copy calce con cómo funciona el pago real antes de
  publicarlo.

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
- **Login bloqueado por cuenta "no verificada" (bug real, ya arreglado)**:
  tanto `js/auth.js` (viajero) como `js/auth-empresa.js` (empresa) tenían,
  dentro del handler de `formLogin`, un `if (!match.verified) {
  startVerification(...); return; }` que redirigía a la pantalla de
  verificación pendiente en vez de dejar entrar, cada vez que alguien
  intentaba iniciar sesión con una cuenta cuyo `verified` seguía en
  `false` — típicamente porque el correo de verificación real nunca llegó
  (la entrega vía Resend fue poco confiable durante buena parte de esta
  sesión) o porque la persona cerró la pestaña antes de hacer click en el
  link/código. Confirmado en producción por el usuario con su propia
  cuenta (`eavayu@hotmail.com`): no podía iniciar sesión, quedaba
  atrapado en "Verifica tu correo" para siempre. Instrucción explícita:
  la verificación de correo debe aplicar **solo al crear la cuenta**,
  nunca como gate en el login. Fix: se eliminó esa rama de ambos
  handlers de `formLogin` — ahora el login solo valida
  email+contraseña y deja entrar sin mirar `match.verified`; el campo
  `verified` sigue existiendo y se sigue marcando `true` en el flujo de
  verificación (magic link para viajero, código para empresa), solo que
  ya no bloquea logins posteriores. Si se vuelve a tocar cualquiera de
  los dos `formLogin`, no reintroducir ese gate.

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

## Notificaciones (spec para lanzamiento real — plantillas ya implementadas, ver abajo)

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
- **Las 13 plantillas están portadas a `api/_lib/email-templates.js`**
  (instrucción del usuario, 2026-07-17: "empieza a implementar todas las
  plantillas que hemos trabajado a lo largo de los flujos"), como
  funciones parametrizadas (`PLANTILLAS[id](datos) -> { subject, html }`)
  en vez del copy hardcodeado de ejemplo que tiene
  `notificaciones-preview.html` — `shell()`/`BRAND` son una copia fiel de
  ahí, así que si se retoca el diseño en un lado hay que replicarlo en el
  otro. `api/send-notification.js` es el endpoint genérico (zero-config,
  mismo patrón que `api/send-verification.js`) que recibe
  `{ tipo, email, datos }`, arma la plantilla y la manda de verdad vía
  Resend — queda disponible para las 13, no reemplaza el envío ya
  existente de verificación de cuenta/código de recuperación (esos siguen
  en `api/send-verification.js`, sin tocar).
- **Primer flujo enganchado de punta a punta: "Reserva
  confirmada"** (el ejemplo concreto que pidió el usuario). El submit de
  `#reserveForm` en `js/panoramas.js` (función `sendReservaConfirmadaEmail`,
  llamada justo antes de `reserveSuccessHTML`) manda un
  `POST /api/send-notification` real con `tipo: 'reserva-confirmada'` —
  fire-and-forget (`.catch(() => {})`), porque es código de browser, no
  una función serverless: si el correo falla, el usuario igual ve su
  reserva confirmada en pantalla, solo que el correo no le llega. Esto
  corrige además que la pantalla de éxito ya decía "te enviamos todos los
  detalles a tu correo" sin que eso fuera cierto hasta ahora.
  **Actualización 2026-07-20: el vínculo real viajero↔negocio que
  bloqueaba el resto de plantillas ya se construyó** — ver la sección
  "Vínculo real viajero↔negocio" más abajo.
- **Segundo flujo enganchado: aceptar/rechazar reserva pendiente en el
  panel de negocio** (`negocio-reservas.html`/`js/negocio.js`, instrucción
  explícita del usuario). Cada reserva `pendiente` tiene botones
  Aceptar/Rechazar — tanto en el modal compartido de detalle como directo
  en cada fila de la lista de Reservas (mismo mecanismo,
  `N.actualizarEstadoReserva(id, nuevoEstado, motivo)`); rechazar exige un
  motivo (textarea) antes de confirmar. Nuevo estado `rechazada`
  (`monto: 0`, igual criterio que `cancelada`; `motivoRechazo` guardado).
  Cada acción manda un `POST /api/send-notification` real (fire-and-forget)
  con la plantilla nueva `accion-empresa-reserva-owner` — **no está en el
  spec original de 13 plantillas** (esas son solo cliente/empresa): es un
  aviso interno solo para el owner de Pickmap
  (`contacto@pickmap.cl`, hardcodeado, instrucción explícita del usuario).
  El aviso AL CLIENTE de que su reserva fue aceptada/rechazada queda
  deliberadamente sin enganchar — los clientes de este panel son 100% data
  demo (`CLIENTES` en `js/negocio.js` son solo nombres, sin email real),
  así que no hay a quién mandárselo hasta que el panel de negocio se
  conecte a reservas reales de viajeros.

## Vínculo real viajero↔negocio + reseñas reales + pago (2026-07-20)

Instrucción explícita del usuario: dejar de simular — construir el
vínculo real entre lo que reserva un viajero y la cuenta de negocio
correspondiente, un formulario real para dejar reseñas, y un correo de
"pago" (liquidación semanal). Decisiones tomadas (confirmadas por el
usuario vía preguntas explícitas): construir el vínculo real (no
simulado), construir el formulario real de reseñas, y que "pago" = la
liquidación semanal a la empresa que ya se veía en `negocio-pagos.html`.

- **Catálogo → negocio real** (`js/panoramas.js`): cada item del
  catálogo ahora lleva `businessEmail`/`businessName`, asignado de forma
  determinística (`hash(título) % negocios_registrados.length`) a un
  negocio REAL que ya exista en `pickmap_business_users` en ese
  navegador. Si no hay ningún negocio registrado todavía, queda `null` —
  no se inventa un negocio falso solo para que el flujo "se vea
  completo" (mismo criterio que el resto del sitio).
- **Reserva real persistida** (`persistRealBusinessReservations` en
  `js/panoramas.js`, llamada al confirmar `#reserveForm`): por cada item
  incluido en la reserva (el panorama principal + addons, que pueden
  pertenecer a negocios DISTINTOS), se guarda:
  1. Una entrada en `pickmap_traveler_reservations_<emailViajero>` (nuevo,
     historial real del viajero — usado después para el formulario de
     reseñas).
  2. Si el item tiene `businessEmail`, una fila real en
     `pickmap_business_reservations_<businessEmail>` — la MISMA key y
     esquema (`{id,cliente,actividad,personas,fecha,hora,monto,
     montoOriginal,estado}`) que ya lee `js/negocio.js`, marcada con
     `real: true` para distinguirla de la data demo. Si esa key nunca
     existió (el negocio nunca inició sesión), se siembra primero con el
     generador demo duplicado (`generateDemoReservationsForBiz`, mismo
     patrón que en `js/negocio-admin.js`) ANTES de agregar la real — si
     no, `getReservations()` en `js/negocio.js` nunca correría su propio
     generador después (solo siembra si la key no existe) y el negocio
     perdería todo su historial demo la primera vez que inicia sesión.
  3. Dispara `POST /api/send-notification` con `nueva-reserva-empresa`
     al negocio correspondiente.
  - **Regla de aislamiento respetada por construcción**: cada item se
    anota únicamente en la key de SU PROPIO negocio — si la reserva
    incluye un panorama de un negocio y un addon de otro, cada uno ve
    solo su propia línea, nunca la del otro (mismo mecanismo de
    localStorage-por-negocio ya documentado arriba).
- **Formulario real de reseñas** (`pickpoints.html` + `js/pickpoints.js`,
  nuevo): sección "Reservas por reseñar" lee
  `pickmap_traveler_reservations_<email>`, muestra las que faltan reseñar
  con un selector de estrellas + textarea. Al enviar:
  1. Marca `reviewed: true` en el historial del viajero.
  2. Si la reserva tiene negocio real vinculado, agrega la reseña a
     `pickmap_business_reviews_<businessEmail>` (mismo esquema que
     `js/negocio.js`), y dispara `cliente-dejo-resena` al negocio
     siempre, `resena-negativa` al negocio si la calificación es 1-2
     estrellas, y **`nueva-resena-owner`** (plantilla nueva, no estaba en
     el spec original de 13 — instrucción explícita del usuario de
     enterarse él también de cada reseña) a `contacto@pickmap.cl`.
  3. Suma +15 Pick Points (mismo valor ya prometido en la lista de
     "Formas de ganar Pick Points" de esa página).
- **Correo de pago** (`js/negocio-pagos.js`, plantilla nueva
  `pago-liquidacion-empresa` — no estaba en el spec original, que no
  incluía nada de pagos): el reloj de este demo es fijo (`NOW` =
  2026-07-11), así que no hay un cron real que "recién pague" algo — para
  no disparar un correo por cada semana de historial la primera vez que
  el negocio visita Pagos, se guarda la última liquidación ya vista
  (`pickmap_business_last_liq_notified_<email>`); la primera visita solo
  establece esa base sin notificar, y solo se dispara el correo cuando
  aparece una liquidación más nueva que la última vista (ej. después de
  una reserva real que se completó y cayó en una semana nueva).
- `window.PickmapNegocio` ahora también expone `getBusinessEmail()` (antes
  `bizEmail` era privado al closure de `js/negocio.js`) para que
  `js/negocio-pagos.js` pueda leerlo sin duplicar la lectura de sesión.

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

## Supabase + backend real de Darwin (`supabase/` + `api/darwin/`, listo antes de integrar el bot)

Instrucción explícita del usuario (2026-07-17): configurar TODAS las
bases de Supabase con las propiedades de tabla + los endpoints que va a
necesitar el futuro agente de IA, aclarando después "me refiero a todas
las configuraciones de supabase. más adelante integraré el bot (es para
que ya estén los endpoints y supabase listo)" — es decir, infraestructura
preparada de antemano, no una integración funcionando ya. Ver
`supabase/README.md` para el detalle completo (variables de entorno
nuevas, qué está 100% listo vs. qué queda pendiente a propósito, cómo
probarlo cuando haya datos reales). Resumen:

- `supabase/schema.sql`: las 7 tablas de la spec del usuario (`panoramas`,
  `usuarios_perfil`, `historial_viajes`, `historial_interacciones`,
  `paquetes` + `paquete_dias`, `sentimiento_usuario`, `clima_cache`),
  pgvector, RLS (cada usuario solo ve lo suyo; `panoramas`/`clima_cache`
  de lectura pública, escritura solo por service role), y las 4 funciones
  SQL (`buscar_candidatos`, `candidatos_cercanos`,
  `candidatos_cercanos_a_punto`, `distancias_entre_candidatos`). Los
  nombres de columna son EXACTOS a la spec porque el backend arma el JSON
  de entrada para Darwin con estos mismos nombres y escribe de vuelta el
  bloque `para_guardar` tal cual, sin transformarlo. Nota técnica: las
  funciones de distancia usan un CTE + `where` en vez del `having ... `
  (sin `group by`, referenciando el alias del `select`) que traía la spec
  original — esa forma no es válida en PostgreSQL real (los alias de
  `select` no son visibles en `having`), así que se reescribió para que
  efectivamente corra, manteniendo el mismo resultado.
- `api/darwin/_lib/`: helpers compartidos, todos con `fetch` plano (sin
  `@supabase/supabase-js` ni SDK de Anthropic, mismo patrón zero-config
  que `api/send-verification.js`) — `supabaseRest.js` (PostgREST + RPC),
  `clima.js` (Open-Meteo, mismo proveedor que `bot-darwin/js/contexto.js`,
  con `clima_cache` y las reglas de vigencia pedidas: 6h pronóstico / 30
  días histórico estacional), `embeddings.js` (Voyage AI — Anthropic no
  tiene API de embeddings propia, `voyage-3-large` con
  `output_dimension: 1536` para calzar con `vector(1536)`), `claude.js`
  (llamada real a la Claude API).
- 4 endpoints + 1 endpoint auxiliar + 1 cron, todos Vercel zero-config:
  `POST /api/darwin/recomendar` (modos `recomendacion_simple` /
  `armado_paquete` / `analisis_sentimiento`), `POST /api/darwin/feedback`,
  `GET /api/darwin/feed` (modo `feed_automatico`, se llama solo al abrir
  la app), `POST /api/darwin/editar-dia` (modo `editar_dia`) +
  `PATCH /api/paquetes/[id]/dias/[dia]` (confirma la elección sin volver
  a llamar a Darwin) + `api/darwin/cron-preferencias.js` (job diario,
  `vercel.json` → 06:00 UTC, actualiza
  `usuarios_perfil.preferencias_inferidas`). Todos hacen `await`
  secuencial de los INSERT/UPDATE de bitácora antes de responder — la
  spec pedía "en paralelo, sin bloquear la respuesta al usuario", pero un
  fire-and-forget no es confiable en una función serverless de Vercel
  (el runtime puede matar el contenedor apenas se envía la respuesta).
- **Pendiente a propósito, no fabricado** (ver `supabase/README.md` para
  el detalle): (a) el texto real de `pickmap_system_prompt_v4.pdf` como
  `DARWIN_SYSTEM_PROMPT` en `api/darwin/_lib/claude.js` — hoy es un
  placeholder que documenta el contrato de salida esperado por modo,
  porque el texto literal del prompt v4 nunca vivió en este repo (solo
  sus reglas ya traducidas a código en `bot-darwin/js/motor.js`); (b) qué
  objeto de GHL contiene realmente los ~20.000 panoramas
  (`scripts/sync-ghl-panoramas.js` asume un Custom Object llamado
  `panoramas`, sin poder confirmarlo contra la cuenta real); (c) los
  montos CLP de `PRESUPUESTO_POR_CATEGORIA` en
  `api/darwin/recomendar.js` son placeholder mientras
  `usuarios_perfil.presupuesto` sea una categoría de texto y no un monto.
- Esto es infraestructura aislada: no reemplaza ni toca
  `js/darwin-backend.js` (conectado al dashboard real, sin LLM) ni
  `/bot-darwin/` (motor determinístico de reglas) — es una tercera
  superficie, la que se usaría el día que se conecte un LLM real de
  verdad con datos reales en Supabase.

## Signup de empresa: región/comuna por select, contraseña mínima 8

Instrucción explícita del usuario (2026-07-17):
- **Contraseña mínima subida de 4 a 8 caracteres**, en los cuatro lugares
  que la validan (signup y reset de contraseña, tanto viajero como
  empresa: `login.html`/`login-empresa.html` para el `minlength`/
  placeholder, `js/auth.js`/`js/auth-empresa.js` para el chequeo real y
  el mensaje de error). Se aplicó a los dos flujos por consistencia,
  aunque el pedido original solo mostraba la pantalla de empresa.
- **Dirección de empresa ya no es un input de texto libre**: el usuario
  pidió que "solo puedan seleccionar, no escribir" — se le presentaron
  dos opciones (Región+Comuna por select vs. además autocompletar la
  calle con Google Places, que tiene costo y requiere API key) y eligió
  la primera. `js/chile-regiones.js` (nuevo, cargado antes de
  `js/auth-empresa.js` en `login-empresa.html`) trae las 16 regiones y
  346 comunas oficiales de Chile (`window.CHILE_REGIONES`); el signup
  ahora tiene selects de Región y Comuna (Comuna se puebla en cascada al
  elegir Región, deshabilitado hasta entonces) + un input de texto libre
  solo para "Calle y número" (no existe una lista manejable de todas las
  calles de Chile sin una API de direcciones). Al guardar, se arma
  `address` igual que antes (`"${calle}, ${comuna}, ${region}"`) para no
  romper el único lugar que lo lee (`js/negocio.js` línea ~40, solo lo
  pasa a través como string) — si se necesita región/comuna por
  separado en algún reporte futuro, hay que agregar esos campos sueltos
  al objeto guardado, hoy solo vive el string combinado.

## Panel de negocio: casilla de código de invitación + recompensa a $50.000

Instrucción explícita del usuario (2026-07-17): el signup de empresa
(`login-empresa.html`) no tenía forma de que un negocio nuevo ingresara el
código de invitación de quien lo trajo — la página de Referidos ya
generaba un código por negocio (`getReferralCode()` en `js/negocio.js`)
pero nada del lado del invitado lo consumía, así que el loop nunca se
podía completar de verdad. Se agregó un campo opcional "¿Tienes un código
de invitación?" al formulario de signup + `js/auth-empresa.js` ahora:
- Duplica `hashStr`/el cálculo de `getReferralCode()` (mismo patrón de
  helpers duplicados por archivo) como `computeReferralCode(user)`, para
  poder reconocer a qué negocio real pertenece un código ingresado por
  otro.
- Guarda `referralCodeUsed` en el usuario nuevo al hacer signup.
- Recién en el bloque `?verify=<token>` (verificación REAL, mismo criterio
  que `createGhlContact`: nunca ensuciar datos de otro negocio con un
  signup que nunca se confirmó) llama `creditarReferido()`, que busca al
  negocio dueño de ese código y le agrega una entrada real a
  `pickmap_business_referrals_<email>` con `estado: 'invitado'` y
  `recompensa: 0` — la recompensa de $50.000 se paga recién cuando el
  referido confirme su primera reserva real, vínculo que hoy no existe
  (mismo motivo documentado arriba de por qué el resto de notificaciones
  de reserva siguen sin engancharse a este panel demo). Si el código no
  matchea ningún negocio real, no pasa nada (signup nunca se bloquea por
  un código inválido/vacío).
- El monto subió de $25.000 a $50.000 en el título de
  `negocio-referidos.html` y en la recompensa fija de
  `generateReferrals()` (antes era un rango variable $20-35k que ni
  siquiera calzaba con el texto de $25.000 que ya estaba ahí).

## Fase backend real: Supabase + GHL (julio 2026, en curso)

Instrucción explícita del dueño del producto: dejar de ser demo pura y
empezar a trabajar "en serio" — ya subió negocios reales a su CRM
(GoHighLevel) y la prioridad declarada es que la **recomendación directa
de panoramas sin pasar por chat** (Superficie 2 — `js/darwin-backend.js`)
funcione con auth real, perfil persistente y catálogo real, antes que
seguir invirtiendo en el widget de chat (Superficie 1 — `js/beto-chat.js`,
sigue sin tocarse). Las dos superficies deben terminar leyendo/escribiendo
**el mismo perfil de preferencias compartido** en Supabase.

- **`supabase/schema.sql`**: tablas `profiles` (reemplaza `pickmap_users`),
  `darwin_preferences` (mirror exacto de `perfilPorDefecto()` en
  `bot-darwin/js/motor.js` — intereses/arquetipos/grupo/presupuesto/
  origen/contexto/restricciones/oferta_combo — para no rediseñar el shape
  que el motor ya entiende), `preference_signals` (log append-only de
  trazabilidad: cada ajuste de afinidad queda con su fuente —
  onboarding/inferido/chat/reserva/reseña — aunque hoy solo se escribe el
  evento `onboarding` desde `darwin-backend.js`; inferido/chat/reserva/
  reseña quedan sin poblar todavía, es infraestructura para cuando se
  conecten esas señales), y `businesses` (mismo contrato que
  `bot-darwin/data/catalogo.mock.js`, con `datos_estimados boolean` y
  `ghl_id` para el mapeo con el CRM real). Todo con RLS por `auth.uid()`.
  Aplicar pegando el archivo completo en el SQL Editor del proyecto
  Supabase real — no requiere el CLI ni conexión desde este repo.
- **Auth real, no falsa**: `js/auth.js` + `login.html` ahora usan
  Supabase Auth real (`signUp`/`signInWithPassword`/`resetPasswordForEmail`/
  `updateUser`) en vez de contraseñas en `localStorage` y códigos de
  verificación mostrados en pantalla. La confirmación de correo y el
  reset de contraseña ahora son flujos de correo real (Supabase envía el
  email; el reset se detecta por el evento `PASSWORD_RECOVERY` de
  `onAuthStateChange`, no por un código que el usuario copia a mano).
- **Puente legacy deliberado**: `js/favoritos.js`, `js/invita.js`,
  `js/panoramas.js` y `js/dashboard.js` **NO se tocaron** en esta fase —
  siguen leyendo `pickmap_users`/`pickmap_current_user` de `localStorage`
  exactamente igual que antes. `auth.js`/`onboarding.js` ahora mantienen
  ese mismo objeto/clave sincronizado como un espejo derivado de la
  sesión y el perfil reales de Supabase (`mirrorLegacyUser`/
  `syncLegacyFromSupabase` en `auth.js`), así que esas 4 páginas siguen
  funcionando sin cambios aunque la identidad real ahora viva en
  Supabase. Si se migran esas páginas más adelante a leer Supabase
  directamente, este puente deja de ser necesario — no borrarlo antes.
- **`js/darwin-backend.js` reescrito para Supabase** (Prioridad 1): en vez
  de leer `pickmap_users`, usa `S.auth.getSession()` +
  `S.profiles.get(userId)` + `S.darwinPreferences.get/upsert(userId)`.
  El catálogo intenta `S.businesses.listAll()` primero; si la tabla está
  vacía (import de GHL no corrido todavía) o Supabase no está
  configurado, cae de vuelta a `catalogo.real-sample.js` — nunca deja la
  tarjeta en blanco. Cada recomendación además inserta una fila en
  `preference_signals` (fuente `onboarding`, sin bloquear el flujo si
  falla).
- **`js/supabase-client.js`**: wrapper único (`window.PickmapSupabase`)
  usado por `auth.js`, `onboarding.js` y `darwin-backend.js`, para no
  reescribir la inicialización del cliente en cada archivo. Si
  `js/supabase-config.js` sigue con los valores placeholder
  (`TU-PROYECTO`/`TU-ANON-KEY-AQUI`), `PickmapSupabase.configured` queda
  `false` y todo se degrada con un mensaje explícito en vez de tirar
  excepciones — verificado con Playwright (login, dashboard, onboarding
  siguen sin errores de consola con Supabase sin configurar).
- **`js/supabase-config.js`**: SÍ se comitea con la anon key real cuando
  el usuario la pase — es segura de exponer en el navegador porque la
  seguridad real la da RLS, no ocultar esta key. La **service role key
  jamás va en ningún archivo del repo**, solo como variable de entorno de
  `scripts/importar_ghl_a_supabase.js`.
- **`scripts/importar_ghl_a_supabase.js`**: script Node standalone (sin
  dependencias npm, usa `fetch` nativo) que lee negocios reales desde la
  API de GoHighLevel y hace upsert en `businesses` vía la REST API de
  Supabase (PostgREST) usando la service role key. Aplica la misma
  heurística de estimación por categoría que
  `bot-darwin/scripts/generar_catalogo_real_sample.py` (precio/duración/
  energía/accesibilidad por bucket) porque GHL no tiene esos campos
  operativos — nombre/categoría/ubicación sí son reales. **No se puede
  ejecutar desde este sandbox** (sin salida a internet real, confirmado
  con `curl` → 403 tanto a `services.leadconnectorhq.com` como a
  `supabase.co`) — lo corre el usuario en su máquina o desde donde haya
  internet real. **Pendiente de confirmar por el usuario**: si los
  negocios en su cuenta GHL están guardados como Custom Objects o como
  Contacts con un tag — el script asume Custom Objects por defecto
  (`GHL_ORIGEN=custom_objects`), con `GHL_ORIGEN=contacts` como
  alternativa vía variable de entorno.
- **Alcance explícito de esta fase**: NO se tocó `negocio-*.html` /
  `js/auth-empresa.js` (login de empresa sigue 100% localStorage) ni las
  claves `pickmap_business_*` — la prioridad declarada fue el lado
  viajero + Superficie 2. Tampoco se conectó ningún LLM real (sigue
  siendo el motor de reglas determinista). **Superado 2026-07-20**: la
  auth de empresa SÍ se migró a Supabase real en la fase siguiente, ver
  "Migración de auth de empresa a Supabase real" más abajo — el resto de
  este bullet (LLM, claves `pickmap_business_reservations/reviews/
  referrals_*`) sigue vigente.
- **Vercel preview**: confirmado — el proyecto SÍ genera deploys de
  Preview automáticos para ramas no-productivas (comportamiento por
  defecto de la integración GitHub↔Vercel). Cada deployment individual
  tiene una URL única que cambia con cada push; además existe una URL
  "por rama" fija (patrón `<proyecto>-git-<rama>-<team>.vercel.app`,
  visible en la sección "Domains" de cualquier deployment de esa rama)
  que siempre apunta a lo último — usarla para no tener que buscar el
  deployment de turno en cada prueba.
- **Flujo real verificado end-to-end por el usuario** (julio 2026):
  registro con Supabase Auth real → correo de confirmación real (SMTP
  propio vía Resend, dominio `pickmap.cl` verificado, plantilla de marca
  aplicada en Authentication → Emails → "Confirm signup" y "Reset
  Password" en el dashboard de Supabase, no en este repo) → onboarding →
  tarjeta de Darwin en el dashboard. Funcionando de punta a punta.
  - `emailRedirectTo` explícito en `signUp()`/`resetPasswordForEmail()`
    (`js/supabase-client.js`) apuntando a `window.location.origin` — sin
    esto, Supabase usaba el "Site URL" del dashboard (por defecto
    `localhost:3000`) para el link del correo, rompiendo la confirmación
    en cualquier dominio real. También hay que agregar
    `https://*.vercel.app/**` a "Redirect URLs" (Authentication → URL
    Configuration) para que Supabase acepte el redirect.
  - Contraseña mínimo 8 caracteres (antes 4) en registro y reset.
  - `js/comunas-chile.js`: selector oficial de las 346 comunas de Chile
    (agrupadas por región) reemplazó el campo de texto libre en
    onboarding — una comuna mal escrita rompía el cálculo de distancia
    real de Darwin. Generado desde conocimiento de entrenamiento del
    modelo (sin verificación en vivo contra fuente oficial, por falta de
    internet en el sandbox) — avisar si se detecta algo desactualizado.
- **`supabase/data/businesses_batch_XX_de_07.sql`**: carga masiva de
  negocios reales a la tabla `businesses` — 25.875 negocios (de los
  ~28.220 del CSV real completo que pasó el usuario, tras filtrar no-
  turísticos y sin coordenadas), generados con
  `scripts/generar_sql_businesses_desde_csv.py` (mismo criterio de
  filtrado/estimación por categoría que
  `bot-darwin/scripts/generar_catalogo_real_sample.py`, pero sobre el
  CSV completo, no una muestra de ~200). Se pegan y corren uno por uno en
  el SQL Editor de Supabase (7 lotes de ~4.000 filas — un solo INSERT
  gigante de golpe era arriesgado de ejecutar). `js/darwin-backend.js` ya
  lee la tabla `businesses` primero automáticamente, sin cambios de
  código necesarios.
- **Pendiente de confirmar por el usuario**: no mergear esta fase a
  `claude/funly-platform-website-huzmqt` sin haber corrido los 7 lotes de
  negocios reales y confirmado que Darwin recomienda bien sobre ese
  catálogo completo — a diferencia de otros cambios de este repo, un bug
  en Auth real puede dejar a clientes reales sin poder entrar a
  `pickmap.cl`. **Actualización: esto ya se hizo** — el usuario pidió
  mergear esta fase a producción ahora mismo (no esperar a correr los 7
  lotes de negocios reales primero); `js/darwin-backend.js` sigue
  cayendo honestamente al catálogo `catalogo.real-sample.js` mientras la
  tabla `businesses` esté vacía, así que no queda ninguna tarjeta en
  blanco aunque los lotes SQL no se hayan corrido todavía en el proyecto
  Supabase real.

## REGLA PERMANENTE: aislamiento de privacidad entre negocios aliados

Instrucción explícita y crítica del usuario (2026-07-20): **un negocio
JAMÁS puede ver que un mismo cliente reservó también con OTRO negocio** —
si Juan reserva 3 actividades y una de ellas es con "Cabañas Carlos",
Cabañas Carlos solo puede ver SU reserva con Juan, nunca las otras dos.
Motivo explícito: evitar que un negocio "se robe" combinaciones/insights
sobre qué más ofrecen otros aliados a un mismo cliente.

- **Hoy esto ya se cumple estructuralmente, sin necesidad de tocar nada**:
  cada negocio en `js/negocio.js` calcula sus reservas/reseñas/referidos
  con un LCG sembrado SOLO por su propio `bizEmail`
  (`seedRandom(20240711 + hashStr(bizEmail))`, etc.) y los persiste en
  claves de `localStorage` exclusivas
  (`pickmap_business_reservations_<email>`, `..._reviews_<email>`,
  `..._referrals_<email>`). No existe ninguna tabla ni objeto compartido
  de "reservas de un cliente" que cruce negocios — cada negocio solo
  puede leer su propia clave. Confirmado al auditar el código: ninguna
  página `negocio-*.html` enumera ni lee la clave de otro negocio.
- **Regla para cuando se construya un backend real compartido de
  reservas entre negocios** (hoy no existe — el único backend real de
  Supabase es el de auth/perfil/Darwin del viajero, ver sección de abajo;
  las reservas de negocio siguen siendo 100% demo/`localStorage`): la
  tabla de reservas real deberá tener RLS estricto por `business_id`
  (cada negocio solo `select`/`update` sus propias filas), y CUALQUIER
  endpoint o vista que muestre "reservas de un cliente" a un negocio debe
  filtrar por ese `business_id` — nunca hacer un `join`/`select` que
  devuelva las reservas del mismo cliente en otros negocios. Esto aplica
  también a futuras notificaciones, exports o reportes: ninguno debe
  mencionarle a un negocio qué más reservó su cliente en otro lado.
- La ÚNICA cuenta que sí ve todo (agregado, no cruzado) es el admin de
  Pickmap (`contacto@pickmap.cl`, ver abajo) — y aun así solo ve TOTALES
  por negocio (generado histórico, reservas activas, rating promedio),
  nunca el detalle de reserva-por-reserva de cada negocio ajeno.

## Panel de administrador Pickmap (`contacto@pickmap.cl`)

Instrucción explícita del usuario (2026-07-20): el email
`contacto@pickmap.cl` (mismo que ya se usaba como
`OWNER_NOTIFICATION_EMAIL` en `js/negocio.js` para notificaciones internas
de aceptar/rechazar reserva) ahora es también la cuenta admin de la
plataforma — necesita poder ver "un resumen completo de mi empresa"
(Pickmap, no un negocio individual).

- `negocio-admin.html` + `js/negocio-admin.js` (nuevos): página aparte,
  NO reutiliza `js/negocio.js` (que está cerrado sobre el negocio de la
  sesión actual) — duplica el mismo patrón de helpers
  (`hashStr`/`seedRandom`/`CLIENTES`/`ACTIVIDADES`/`HORAS`/
  `generateReservations`), parametrizado por email en vez de cerrado
  sobre uno solo, para poder calcular el dataset demo de CUALQUIER
  negocio registrado en `pickmap_business_users` sin que ese negocio
  tenga que haber iniciado sesión antes. Persiste en las mismas claves
  (`pickmap_business_reservations_<email>`, `..._reviews_<email>`) así
  que si el negocio ya generó sus datos, el admin ve exactamente lo
  mismo que vería ese negocio.
- Login especial: `js/auth-empresa.js` tiene `ADMIN_EMAIL` +
  `panelDestino(email)` — si el email de la sesión es
  `contacto@pickmap.cl`, los tres puntos de redirect post-login/verify
  mandan a `negocio-admin.html` en vez de `negocio.html`. Además,
  `js/negocio.js` (las 6 páginas de negocio normales) redirige a
  `negocio-admin.html` si detecta que la sesión activa es la del admin —
  así no puede terminar viendo un panel de negocio vacío a su propio
  nombre por URL directa. Simétricamente, `negocio-admin.html` redirige
  a `negocio.html` si alguien que NO es el admin llega ahí por URL
  directa con sesión de negocio normal activa.
- **Expandido 2026-07-20** (instrucción del usuario: "haz un panel muy
  completo... debo poder entender todo lo que está pasando"):
  - **6 stats agregados**: negocios aliados (+ nota de cuántos
    verificados/sin verificar), generado histórico de todos, **comisión
    Pickmap histórica**, **pipeline activo** (valor de reservas
    confirmadas/pendientes aún no completadas — no solo el conteo),
    reservas activas totales, rating promedio de la plataforma.
  - **`COMMISSION_RATE = 0.12` en `js/negocio-admin.js`**: no hay una
    tasa de comisión real definida en ningún lugar del sitio — el `monto`
    de cada reserva ya es lo que el NEGOCIO recibe, neto de comisión
    (`terminos.html`: "Pickmap recauda el pago... transfiere los fondos...
    descontando la comisión de intermediación"), pero el % nunca quedó
    escrito en código. Se usa 12% como estimado (punto medio típico de
    plataformas de reservas turísticas), etiquetado explícitamente en la
    UI como "Estimado a 12% — tasa real pendiente de definir". Ajustar
    esa única constante en cuanto el usuario defina la tasa real.
  - **Gráfico de línea de los últimos 6 meses** (mismo patrón SVG que
    `js/negocio-resumen.js`, ver "Rediseñar gráfico Ingresos" abajo) con
    DOS series: generado total (línea sólida coral) y comisión Pickmap
    (línea punteada navy) — clickeable por mes, abre un modal propio
    (`#adminModal`, JS del mismo archivo, sin reutilizar el modal de
    `js/negocio.js`) con el desglose **por negocio** de ese mes (nunca
    por cliente/reserva individual — sigue la regla de aislamiento).
  - **"Mejores negocios"**: top 5 por generado histórico, con medallas
    🥇🥈🥉 para los primeros 3.
  - **"Negocios sin verificar"**: lista aparte (solo visible si hay
    alguno) para que el admin identifique fácil qué aliados nuevos faltan
    por confirmar.
  - Tabla completa "Todos los negocios aliados": cada fila ahora también
    muestra pipeline y comisión por negocio, además de generado
    histórico/activas/rating — **nunca el detalle de reserva-por-reserva
    de cada negocio** (ver regla de aislamiento arriba). Filas con
    `.biz-res--static` (mismo look que `.biz-res` pero sin cursor de
    "clickeable", porque no abren modal) — con un override de mobile
    aparte (`@media max-width:640px`) porque el wrap genérico de
    `.biz-res` asumía una columna de fecha de 54px que estas filas no
    tienen; sin ese override el monto/badges se superponían con el texto
    de 3 líneas del info block.
  - `js/auth-empresa.js` ahora también guarda `createdAt` en el signup
    (antes no existía ningún timestamp de registro) para poder mostrar
    "desde <fecha>" en la fila de cada negocio — cuentas ya creadas antes
    de este cambio simplemente no muestran esa parte (no se fabrica una
    fecha falsa).
- **Dark mode (2026-07-20, instrucción explícita del usuario: "solo el
  panel admin hagámoslo en dark mode, elegante, profesional y muy
  útil")** — SOLO `negocio-admin.html`, ninguna de las 6 páginas de
  negocio normales. `css/negocio-admin.css` (nuevo, cargado únicamente
  ahí, después de `css/negocio.css`) redefine las variables de color
  compartidas (`--bg`, `--white`, `--navy`, `--navy-2`, `--slate`,
  `--mist`) a tonos oscuros — como casi todo `css/negocio.css` ya está
  construido sobre esas variables (no colores sueltos), la cascada de
  tarjetas/badges/gráfico se oscurece casi gratis. Capas de profundidad:
  página (`--bg`, más oscura) < tarjeta (`--white`, más clara/elevada) <
  fila en hover. Excepciones que SÍ hubo que sobreescribir a mano porque
  no usaban variable: `.biz__greeting`/`.biz-stat` (negocio.css) y
  `.dcard` (dashboard.css) traían blanco translúcido HARDCODEADO
  (`rgba(255,255,255,0.58/0.62)`, pensado para flotar sobre el skyline
  ilustrado con degradado) — y los badges de estado con color de texto
  fijo en hex (`#3f7a2c`, `#8a6a10`) que quedaban ilegibles sobre fondo
  oscuro. El `.skyline` (montañas/sol/nubes) se oculta por completo en
  esta página (`body.admin-page .skyline{display:none}`) — no tiene
  sentido combinarlo con un dark mode "control room". De paso se
  encontró y arregló un bug real: el saludo de esta página nunca se
  actualizó cuando se le agregó el avatar con iniciales a las otras 6
  páginas (`.biz__greeting` pasó a `display:inline-flex`), así que en
  mobile el texto se apachurraba en una columna angosta en vez de
  apilarse — ahora tiene el mismo wrapper `<div>` + avatar (`PM`, coral)
  que las demás.

## Migración de auth de empresa a Supabase real (2026-07-20)

Instrucción explícita del usuario: "MIGRA LO QUE TENGAS QUE HACER PARA
ARREGLARLO" — respuesta a mi recomendación de que el panel de negocio
tuviera auth real (Supabase, como el viajero) en vez de dos sistemas de
identidad paralelos (uno real, uno 100% `localStorage`). Mismo patrón
exacto que la migración del viajero (`js/auth.js`, ver sección de arriba),
aplicado ahora a `login-empresa.html`/`js/auth-empresa.js`.

- **`supabase/schema.sql`**: tabla nueva `business_profiles` (mirror de
  los campos que antes vivían sueltos en `pickmap_business_users`:
  `rep_name`/`rep_rut`/`biz_name`/`legal_name`/`biz_rut`/`region`/`comuna`/
  `street`/`availability`/`referral_code_used`/`verified`/
  `referral_credited`), con RLS (dueño lee/actualiza su propia fila; el
  admin `contacto@pickmap.cl` lee TODAS, vía `auth.jwt()->>'email'` — para
  el resumen agregado de `negocio-admin.html`). Dos triggers nuevos sobre
  `auth.users` (mismo `security definer` que ya usaba `profiles` del
  viajero, para esquivar RLS en el instante del signup sin sesión):
  `crear_perfil_empresa_para_nuevo_usuario` (inserta la fila solo si
  `raw_user_meta_data->>'account_type' = 'empresa'`) y
  `sincronizar_verificacion_empresa` (copia `email_confirmed_at` de
  `auth.users` a `business_profiles.verified` en el momento real de la
  confirmación — necesario porque RLS de Supabase no deja leer
  `auth.users` de otra cuenta ni siquiera para el admin). El trigger
  `crear_perfil_para_nuevo_usuario` del viajero se envolvió en el mismo
  chequeo de `account_type` (`= 'viajero'`, con default si no viene) para
  que un signup de empresa no le cree también una fila de `profiles` de
  viajero. Se agregaron además `foto_principal text` / `fotos text[]` a
  `businesses` vía `alter table ... add column if not exists` (no dentro
  del `create table if not exists` original, que ya no corre nada sobre
  la tabla real con sus 25.875 filas ya cargadas) — para cuando el
  usuario empiece a subir fotos reales de negocios, ver más abajo.
- **`js/supabase-client.js`**: agregado `businessProfiles: { get, upsert }`
  (mismo patrón que `profiles`/`darwinPreferences`).
- **`js/auth-empresa.js` reescrito completo** para usar
  `S.auth.signUp/signIn/resetPasswordForEmail/updateUser` reales en vez de
  passwords en `localStorage` — mismo patrón que `js/auth.js`. Lo que se
  mantiene igual a propósito (alcance acotado a auth/identidad, igual que
  la fase del viajero):
  - **Puente legacy**: `mirrorLegacyBusinessUser`/`syncLegacyFromSupabase`
    siguen escribiendo `pickmap_business_users`/`pickmap_business_session`
    tal cual antes, para que `js/negocio.js` y las 6 páginas
    `negocio-*.html` sigan funcionando sin tocarlas.
  - **`ADMIN_EMAIL`/`panelDestino('contacto@pickmap.cl')`**: intacto, en
    los 3 puntos de redirect (sesión ya activa, signup con confirmación
    desactivada, login).
  - **Referidos**: `computeReferralCode`/`creditarReferido` siguen
    operando sobre el espejo legacy (`pickmap_business_users`), sin
    migrar a Supabase (los referidos no estaban en el alcance de esta
    fase). Cambio real necesario: antes se acreditaba una sola vez porque
    corría dentro de la rama `?verify=<token>`, que se consumía sola; con
    Supabase el perfil se sincroniza en cada login, así que sin una
    bandera se acreditaría de nuevo cada vez — de ahí la nueva columna
    `business_profiles.referral_credited`, escrita apenas se acredita.
  - **RUT/región/comuna**: validación y selects en cascada sin cambios.
  - **Recuperar contraseña de empresa** (`startForgotReset`): esta SÍ
    cambió de verdad — antes era un código de 6 dígitos mostrado en
    pantalla sin envío real (documentado en la sección de arriba como
    "sin tocar"), ahora es el mismo flujo real que el viajero
    (`resetPasswordForEmail` + evento `PASSWORD_RECOVERY` +
    `updateUser`), porque ya no hay contraseña en texto plano en
    `localStorage` sobre la cual mostrar/comparar un código. Se necesitaba
    migrar junto con el resto o el reset quedaba roto.
  - `login-empresa.html`: se agregaron los mismos 3 `<script>` de Supabase
    que ya tenía `login.html` (CDN + `supabase-config.js` +
    `supabase-client.js`, antes de `auth-empresa.js`), y los forms de
    "olvidé mi contraseña" se simplificaron a los mismos 2 pasos reales
    de `login.html` (pedir correo → escribir nueva contraseña), sin campo
    de código.
- **Verificado con Playwright** (sandbox sin salida a internet real, mismo
  patrón de degradación que el viajero): el CDN de supabase-js falla en
  cargar (`ERR_TUNNEL_CONNECTION_FAILED`), así que `S.configured` queda
  `true` (la anon key real ya está en `js/supabase-config.js`) pero
  `S.client` queda `null` — cualquier submit falla explícito con
  "Supabase no está configurado todavía...", nunca un error críptico ni
  una promesa colgada. Validación de RUT/campos obligatorios del signup
  de empresa sigue funcionando igual (corre antes de tocar Supabase). El
  form de "olvidé mi contraseña" ya no deja ningún rastro del input de
  código de 6 dígitos en el DOM.
- **Pendiente para el usuario, fuera de este repo**: pegar el
  `business_profiles` nuevo del `schema.sql` en el SQL Editor de Supabase
  (mismo proyecto que ya usa el viajero) antes de que el signup de
  empresa funcione en producción — sin esa tabla/triggers, `signUp()`
  funcionaría pero `business_profiles.get()` devolvería vacío para
  siempre y el espejo legacy quedaría con los campos en blanco.

### Metodología recomendada para cargar negocios reales + fotos (progresivo, no un solo batch)

El usuario preguntó cuál es la forma más práctica de ir sumando
info/fotos de negocios reales con el tiempo, para que el panel de control
quede "lo más fácil posible". Con `foto_principal`/`fotos` ya en el
schema, la recomendación concreta:

- **Para altas/ediciones sueltas (el caso normal: 1-5 negocios a la vez)**:
  usar directamente el **Table Editor de Supabase** (dashboard web, tabla
  `businesses`) — no requiere este repo ni ningún script. Es una grilla
  tipo spreadsheet: buscar la fila del negocio (o crear una nueva),
  editar celdas de texto/precio directo. Cero fricción, cero riesgo de
  romper otra fila.
- **Para las fotos**: crear un bucket público en **Supabase Storage**
  (ej. `negocios-fotos`), subir la foto ahí (arrastrar y soltar desde el
  dashboard), copiar la URL pública que Supabase genera, y pegarla en
  `foto_principal` (o agregarla al array `fotos`) de esa fila en el Table
  Editor — mismo flujo manual, sin código. Evita depender de hosting
  externo o de que el usuario maneje URLs de terceros.
- **Reservar el camino de CSV/script** (`scripts/generar_sql_businesses_
  desde_csv.py`, el que ya se usó para los 7 lotes de 25.875 negocios)
  **solo para altas masivas reales** (ej. si en el futuro llega un CSV
  nuevo de cientos de negocios de una vez) — no para el goteo normal de
  "voy juntando info de a poco", donde el overhead de generar SQL y
  correrlo por lotes es más lento que simplemente editar la celda a mano.
- En resumen: Table Editor + Storage para el día a día, script/CSV
  reservado para el próximo batch grande si llega.

## Sesión 2026-07-21: bugfix auth, rediseños, servicios, legal

- **Bug real arreglado: confirmación de correo fallaba entre navegadores/
  dispositivos distintos**. El usuario reportó: crear la cuenta en un
  navegador y confirmar el correo desde otra sesión/navegador no
  funcionaba ("no manda a una página válida"). Causa raíz: el flow por
  defecto de `supabase-js` (PKCE) guarda un `code_verifier` en el
  `localStorage` del navegador que llama a `signUp()`/
  `resetPasswordForEmail()` — el link de confirmación solo manda un
  `code` que debe intercambiarse contra ESE `code_verifier`; si se abre en
  otro navegador/dispositivo (el caso real y esperado: confirmar desde el
  celular después de registrarse en el compu), ese valor no existe ahí y
  el intercambio falla. Fix: `js/supabase-client.js` ahora pasa
  `{ auth: { flowType: 'implicit' } }` a `createClient()` — con esto
  Supabase entrega el `access_token`/`refresh_token` directo en la URL de
  confirmación (verificado server-side, sin depender de storage local),
  así que el link funciona desde cualquier navegador/dispositivo. Aplica
  tanto al signup del viajero como al de empresa (mismo cliente
  compartido).
- **Panel super-admin: rediseño completo del dark mode a "verdes
  fuertes"** (`css/negocio-admin.css`, instrucción explícita del usuario:
  "no me gustó mucho el dark mode... prioriza colores verdes fuertes para
  poder ver bien la información"). En vez de la paleta gris/coral de la
  primera pasada, ahora es fondo casi negro con tinte verde
  (`--bg: #070C09`, `--white: #101915`) y la variable de marca `--coral`
  se REDEFINE dentro de este archivo (que solo carga en esta página) a un
  verde vívido (`#22C55E`) — como casi todo lo que ya pintaba con
  `var(--coral)` en `css/negocio.css` (línea del gráfico, relleno del
  área, monto del ranking, badge del stat accent) automáticamente pasa a
  verde sin tocar `negocio.css` ni `negocio-admin.js`. Se agregaron
  overrides explícitos para que TODOS los números clave (no solo la
  tarjeta accent) salgan en verde: `.biz-stat__value`, `.biz-res__amt`,
  `.admin-top__amt`. `--deep-red`/`--sun` NO se tocaron — siguen siendo el
  rojo/ámbar real de "cancelada/rechazada" y "pendiente", para no perder
  el contraste de significado contra el verde ahora dominante.
- **Notificación al owner cuando un negocio responde una reseña**
  (instrucción explícita del usuario). `js/negocio.js` →
  `notificarOwnerRespuestaResena()`, llamada desde `responderResena()`,
  manda `POST /api/send-notification` con la plantilla nueva
  `empresa-respondio-resena-owner` (no estaba en el spec original de 13,
  mismo patrón interno-solo-owner que `accion-empresa-reserva-owner`/
  `nueva-resena-owner`) a `contacto@pickmap.cl`.
- **"PickMap" con M mayúscula en todo el texto visible del sitio**
  (instrucción explícita del usuario). Se reemplazó "Pickmap" → "PickMap"
  en: todo el HTML visible (títulos, meta descriptions, copy de página),
  `manifest.json` (nombre de la PWA), y las cadenas de texto real que ve
  el usuario en JS (mensajes del chat de Darwin, subjects/cuerpos de
  correo en `api/_lib/email-templates.js`/`api/send-verification.js`/
  `api/send-notification.js`, el `from:` del remitente del correo,
  toasts/success messages). Deliberadamente NO se tocaron: el dominio real
  `pickmap.cl` y las direcciones `@pickmap.cl` (van en minúscula, son
  reales), los identificadores de código `window.PickmapNegocio`/
  `PickmapSupabase`/`PickmapDarwin` (API interna, no texto visible), las
  claves de `localStorage` (`pickmap_users`, etc., todas en minúscula), ni
  los comentarios de código (no son visibles para el usuario final). Si se
  agrega texto visible nuevo sobre la marca, usar "PickMap".
- **Nueva sección "Servicios" en el panel de negocio** (`negocio-
  servicios.html` + `js/negocio-servicios.js`, 7ma página del panel,
  agregada al nav de las otras 6 — instrucción explícita del usuario: la
  empresa debe poder VER los servicios que tiene inscritos, de solo
  lectura, y solo puede pedir agregar uno nuevo vía una SOLICITUD, no
  editarlo directo). `js/negocio.js` expone `getServices()` (genera,
  sembrado por `bizEmail`, un set estable de servicios a partir de
  `ACTIVIDADES` con precio/capacidad propios — persistido en
  `pickmap_business_services_<email>`), `getServiceRequests()` y
  `solicitarNuevoServicio(nombre, descripcion, precioSugerido)` — esta
  última persiste en `pickmap_business_service_requests_<email>` con
  `estado: 'pendiente'` (nunca se auto-aprueba, mismo criterio de "no
  fabricar un dato falso") y dispara `POST /api/send-notification` con la
  plantilla nueva `solicitud-nuevo-servicio-owner` a `contacto@pickmap.cl`
  para que el equipo la revise y agregue el servicio de verdad.
- **Términos y Condiciones completados + Política de Privacidad nueva**
  (instrucción explícita del usuario: "inventa un término de condiciones
  y privacidad"). `terminos.html` ya tenía un documento de 31 cláusulas
  muy completo (roles Usuario/Proveedor, responsabilidad, cancelaciones,
  Pickpoints, Referidos, etc.) con placeholders sin rellenar — se
  completaron: `[fecha]` → 21 de julio de 2026, `[correo de contacto]` →
  `contacto@pickmap.cl` (las 4 apariciones), `[ciudad]` → Santiago, y se
  quitó `[teléfono de contacto]` (no hay uno real que ofrecer, mejor no
  inventar un número que parezca real). `privacidad.html` (nuevo, mismas
  `css/legal.css` y estructura de header/footer que `terminos.html`, 14
  secciones): responsable del tratamiento, normativa (Ley 19.628 + Ley
  21.719), datos recopilados, finalidades, con quién se comparten,
  cookies, conservación, seguridad, derechos ARCO+, menores de edad,
  transferencia internacional, cambios y contacto — enlazada
  recíprocamente desde `terminos.html` (cláusula 21 y el header) y desde
  el footer de `index.html` y de `api/_lib/email-templates.js`/
  `notificaciones-preview.html`.
- **Rediseño de "Mi cuenta" (dashboard.html, viajero) — SIN oferta de
  Darwin**. Primero se reordenó a `.dash__grid` (2fr/1fr) con la tarjeta
  de Darwin a la izquierda; después el usuario reconsideró y pidió
  explícitamente "en Mi cuenta no me ofrezcas nada, es para otras cosas
  ahí" — Mi Cuenta es solo administración de cuenta (Pick Points/datos de
  viajero como teasers de navegación, Configura tu cuenta, Métodos de
  pago), no un lugar donde Darwin ofrezca planes. Se quitaron de
  `dashboard.html`: la tarjeta `#darwinBackendCard`, el CTA "Ver mis
  panoramas", y los 9 `<script>` de bot-darwin/Supabase que solo servían
  para esa tarjeta (`js/darwin-backend.js` y el resto de `bot-darwin/js/*`
  NO se borraron del repo, solo dejaron de cargarse en esta página —
  quedan disponibles por si se reengancha esa oferta en otra parte, p.ej.
  `panoramas.html`, donde ya vive el mensaje "Darwin armó estos planes
  especialmente para ti"). Los dos teasers (Pick Points, Tus datos de
  viajero) pasan a `.dash__teasers` (grid simple 2 columnas, ya no hay
  columna angosta de sidebar sin la tarjeta de Darwin al lado).
- **Header de `panoramas.html` + widgets reales de clima Y ubicación**.
  El h1 se simplificó dos veces siguiendo instrucciones del usuario:
  primero "Darwin te armó este plan para hoy", después "SOLO pongas:
  'Darwin armó estos planes especialmente para ti'" — quedó ese texto
  como único contenido del bloque (se sacó el `<p class="dash__sub">` de
  abajo, ya no hay subtítulo separado). A la derecha (mismo
  `.dash__greeting`, con un `:has(.dash__weather)` en CSS que solo activa
  el layout de fila cuando hay al menos un widget — no afecta a las demás
  páginas que comparten `.dash__greeting`) hay DOS widgets iguales,
  agrandados (ícono 2.4rem, valor 1.7rem — antes 1.8rem/1.3rem), uno al
  lado del otro con un separador vertical entre cada uno:
  1. **Clima** — `js/panoramas-weather.js` pide geolocalización real del
     navegador y llama a `PickmapDarwin.contexto.clima()` (Open-Meteo, ya
     usado en bot-darwin, cargado standalone vía
     `bot-darwin/js/contexto.js` sin el resto del motor).
  2. **Ubicación** (agregado a pedido explícito del usuario: "pon otro
     igual al lado con la ubicación") — mismo archivo, reverse-geocoding
     real vía BigDataCloud (`api.bigdatacloud.net/data/reverse-geocode-
     client`, gratis, sin API key, CORS abierto — primera vez que se usa
     este proveedor en el repo, justificado porque el resto del sitio
     deliberadamente evitaba reverse geocoding hasta que el usuario lo
     pidió explícito acá) para mostrar el nombre real de la comuna/ciudad.
  Si no hay permiso de ubicación o cualquiera de los dos fetch falla, ESE
  widget en particular se queda oculto — nunca se fabrica un dato falso
  de clima ni de ubicación; cada uno se muestra independiente del otro.
- **Toolbar de filtros de `panoramas.html` rediseñada + filtro "Cuándo"
  con semántica nueva + filtro nuevo de duración de paquete**
  (instrucción explícita del usuario: la barra se veía "poco profesional
  y poco elaborado"). `.pano-advfilters` (plana, selects pelados) pasa a
  `.pano-toolbar`: tarjeta con eyebrow "🔍 Filtrar y ordenar", cada select
  con ícono + chevron custom (`appearance:none` + SVG de fondo en vez de
  la flecha nativa) y focus ring coral, "Limpiar filtros" como botón real
  con ícono. El filtro "Día" (antes "Entre semana"/"Fin de semana") pasó a
  "Cuándo": **Hoy / Mañana / El fin de semana que sigue / Cualquiera**
  (pedido explícito del usuario) — como cada item del catálogo solo trae
  un bucket fijo `semana`/`finde` (ver `parseDay()`, no un día de la
  semana exacto), "Hoy"/"Mañana" traducen la fecha real (`new Date()`,
  `diaBucketDeFecha()`) a ese mismo bucket, y "el fin de semana que sigue"
  siempre cae en `finde` sea cual sea hoy. Se agregó además un filtro
  nuevo **"Duración del paquete"** (1 día / 2 días / Fin de semana /
  Cualquiera, pedido explícito del usuario) — `parseDias()` lo deriva del
  mismo `item.meta` ("Paquete de un día"/"2 días"/"fin de semana"); los
  items `simple` no tienen duración de varios días (`dias: null`), así
  que activar este filtro los excluye naturalmente.
- **Filtro "Todos" (Explorar) y "Ver todo" (Combos/Simples) muestran el
  catálogo COMPLETO, no el subconjunto personalizado** (dos bugs reales
  reportados por el usuario, misma causa raíz). Se había agregado una
  sección nueva separada al fondo de la página para "Todos" — el usuario
  la rechazó explícitamente ("no pongas aparte una fila con Todos, quiero
  que en esta sección [la de Explorar] salgan TODOS") y se eliminó esa
  sección. En su lugar, `renderExplore()` en `js/panoramas.js` ahora
  ignora la pestaña activa cuando el pill "Todos" está seleccionado y
  siempre muestra `general` (catálogo completo, deduplicado) — antes,
  con la pestaña "Recomendado para ti" activa (el estado por defecto de
  la página), "Todos" en realidad mostraba solo `recommended` (el mismo
  subconjunto chico de ~6 items usado en las filas Combos/Simples de
  arriba). Mismo bug afectaba los links "Ver todo" de esas dos filas —
  llevaban a la pestaña "Recomendado" y filtraban ese subconjunto chico
  por tipo, mostrando muy pocos resultados; ahora ambos siempre navegan a
  la pestaña "General" (catálogo completo) filtrado por tipo.
  `cardItemFor()` se actualizó para resolver las tarjetas del pill
  "Todos" desde `general` (blurb genérico) en vez de `CATALOG` (razón
  personalizada), mismo criterio que ya aplicaba a la pestaña "General".
- **Dos bugs reales encontrados en revisión propia del PR** (instrucción
  del usuario: "busca bugs posibles" tras abrir el PR), ambos arreglados
  antes de dejar el PR listo para review:
  1. `parseDias()` (filtro de duración de paquete, ver arriba) solo
     reconocía metas con un número de días explícito ("un día"/"2 días"/
     "fin de semana") — 3 paquetes reales del catálogo tienen meta sin
     mención de días ("Paquete nocturno", "Paquete para equipos",
     "Paquete para grupo": *Bar + transporte de vuelta incluido*,
     *Team building al aire libre*, *Entradas + previa con amigos*) y se
     quedaban con `dias: null`, lo que los hacía desaparecer por completo
     apenas se activaba CUALQUIER filtro de duración específico (nunca
     calzaban con ningún valor). Fix: sin mención de "2 días"/"fin de
     semana", el fallback es `'1'` en vez de `null` — ninguno de esos
     tres describe una duración de varios días, así que "1 día" es la
     inferencia correcta en vez de perderlos silenciosamente.
  2. `dashboard.html` usaba la clase `class="dash__teasers"` para el
     nuevo layout de 2 columnas de los teasers (Pick Points / Tus datos
     de viajero) pero esa clase nunca se definió en `css/dashboard.css`
     — sin CSS, los dos teasers caían por defecto en columna completa
     apilados verticalmente en vez de lado a lado. Se agregó la regla
     (`display:grid; grid-template-columns: 1fr 1fr`, con stack a 1
     columna en mobile) y de paso se limpió `.dash__col-right` (clase
     agregada en la vuelta anterior de esta sesión que quedó sin ningún
     consumidor tras sacar la tarjeta de Darwin de esta página).

## Instrucción permanente del usuario: código blindado + todo registrado

- **Blindar el código**: antes de dar por hecho un cambio, verificarlo
  (Playwright local cuando aplica) y no dejar código a medio hacer. Evitar
  regresiones: si se toca una función/CSS compartida, revisar qué otras
  páginas la usan (grep) antes de modificarla o borrarla.
- **Registrar todo**: cada sesión que agregue una convención nueva, un
  gotcha nuevo, o cambie el flujo de trabajo, debe reflejarlo en este
  archivo (`CLAUDE.md`) como parte del mismo commit, no como tarea aparte.
  Este archivo es la memoria persistente del proyecto entre sesiones.

## App Flutter nativa de viajero (`/app_flutter/`, iniciada 2026-07-21)

Instrucción explícita del usuario: empezar el diseño de una app **nativa**
(Android/iOS vía Flutter) — explícitamente aclaró "pero aplicación, no
PWA" para que no se confunda con la PWA ya instalable del sitio web (ver
sección de arriba, `manifest.json`/`sw.js`). Es un proyecto Flutter
autocontenido en `app_flutter/` dentro de este mismo repo (no un repo
aparte). Alcance de esta primera etapa, confirmado por el usuario vía
`AskUserQuestion`: **solo viajero** (el panel de negocio queda para una
etapa futura), conectado al **mismo proyecto Supabase real** que ya usa
`js/auth.js` (no mocks), con **identidad visual fiel al sitio web**
(mismos colores/tipografía que `css/styles.css`, adaptados a Material 3).

- **Paridad de marca**: `lib/core/theme/pickmap_colors.dart` copia 1:1 las
  variables `:root` de `css/styles.css` (navy/coral/sun/mist/etc.);
  `pickmap_theme.dart` usa `google_fonts` con Fredoka (`--font-display`)
  para títulos y Nunito Sans (`--font-body`) para el resto — mismo par
  tipográfico que el sitio, cargado ahí vía Google Fonts CDN también, así
  que igual requiere red la primera vez (se cachea localmente después).
- **Backend compartido, no duplicado**: `lib/core/supabase/
  supabase_config.dart` apunta al mismo proyecto/anon key que
  `js/supabase-config.js`. `lib/features/auth/data/auth_repository.dart`
  lee/escribe directo en `profiles`/`darwin_preferences` (mismas tablas de
  `supabase/schema.sql`) — un usuario que se registra desde la app puede
  loguearse en el sitio web y viceversa, ambos comparten identidad real.
  `AuthController` (ChangeNotifier) + `go_router` con `redirect`
  replican el mismo criterio de `js/auth.js`: `profile.onboarded` solo se
  chequea al aterrizar en `/splash` o `/auth` (login/signup/restauración
  de sesión), no como guardia permanente — mismo comportamiento que el
  botón "Prefiero hacerlo después" de `onboarding.html`, que navega
  directo sin bloquear.
- **Deep link de auth**: Supabase Auth en Flutter usa PKCE por defecto
  (a diferencia del sitio web, que tuvo que forzar flujo implícito por el
  bug de confirmar desde otro navegador — acá no aplica, el
  code_verifier vive en el mismo dispositivo/app que abre el link).
  Scheme `pickmap://login-callback` registrado en
  `AndroidManifest.xml`/`Info.plist` — falta agregarlo a Authentication →
  URL Configuration → Redirect URLs en el dashboard de Supabase (mismo
  lugar que ya tiene `https://*.vercel.app/**` para el sitio) antes de
  que la confirmación de correo funcione en producción.
- **Catálogo de panoramas = data de muestra, todavía no `businesses`
  real**: `lib/features/panoramas/data/sample_catalog.dart` reutiliza
  literalmente el copy de `TASTE_POOL`/`DEFAULT_POOL` en `js/panoramas.js`
  (mismos títulos/razones "por qué Darwin te lo recomienda"), pero es
  data hardcodeada — portar el motor de ranking (`bot-darwin/js/motor.js`)
  y conectar la tabla `businesses` (25.875 negocios reales) es trabajo
  aparte, documentado como siguiente paso en `app_flutter/README.md`.
  Mismo criterio para Favoritos/Pick Points/Invita: layouts reales, datos
  de muestra, sin ledger de puntos ni favoritos persistidos todavía.
- **Bug real encontrado y arreglado durante la verificación visual**:
  `ElevatedButtonThemeData` tenía un `textStyle: TextStyle(fontWeight,
  fontSize)` sin `fontFamily` explícito — en Flutter, un `textStyle` de
  tema que no es null **reemplaza por completo** (no se mergea campo a
  campo) el `textStyle` default, así que el botón perdía la tipografía de
  marca y cae al fallback "Roboto" del engine. En Flutter Web ese
  fallback se descarga por red (CanvasKit); sin esa fuente disponible el
  texto del botón queda invisible — se detectó exactamente así con
  Playwright (botones "Entrar"/"Continuar"/"Copiar código" se veían como
  píldoras de color sin texto). Fix: sacar ese `textStyle` de
  `ElevatedButton.styleFrom(...)` en `pickmap_theme.dart` y dejar que
  herede `fontWeight`/tamaño desde `textTheme.labelLarge` (ya con la
  fuente de marca aplicada), manteniendo solo `foregroundColor` para el
  color. Si se vuelve a tocar el theme, no reintroducir un `textStyle`
  suelto sin `fontFamily` en ningún `*ButtonThemeData`.
- **Verificación visual sin internet real (mismo criterio que el sitio,
  ver sección de abajo, adaptado a Flutter)**: se clonó el Flutter SDK
  (stable) vía `git clone` (github.com sí pasa por el proxy del sandbox;
  `storage.googleapis.com`/`pub.dev` no, hay que exportar
  `PUB_HOSTED_URL=https://pub.dartlang.org` para que `flutter pub get`
  funcione), se corrió `flutter build web` apuntando a un entrypoint de
  debug aparte (`lib/dev_preview_main.dart`, **borrado tras verificar** —
  no debe volver a commitearse) que muestra cada pantalla directo por
  query param (`?screen=auth`, evita tener que loguearse de verdad), y se
  parcheó `canvasKitBaseUrl` en `flutter_bootstrap.js` para servir
  CanvasKit desde el build local en vez del CDN de Google (bloqueado acá).
  Las fuentes Fredoka/Nunito Sans tampoco cargan sin red — se sustituyeron
  temporalmente por una fuente local cualquiera solo para poder leer el
  texto en las capturas, revertido antes de terminar. Capturas vía
  Playwright con `/opt/pw-browsers/chromium`, igual que el resto del
  repo, con esperas largas (~15s): CanvasKit tarda en pintar el primer
  frame en este entorno software-rendered y las capturas tomadas
  demasiado pronto salen en blanco (no es un bug de la app).
- **Pendiente, a propósito, para una próxima sesión**: panel de negocio en
  Flutter, conectar catálogo/motor de recomendación real, favoritos/Pick
  Points/referidos persistidos de verdad, y pulir con capturas en un
  dispositivo/emulador real (esta sesión no tuvo emulador Android/iOS
  disponible, solo `flutter build web` para verificar diseño).

### Rediseño "más de fondo" (mismo día, a pedido explícito del usuario)

El usuario pidió explícitamente "mejorar el diseño" con un alcance más
profundo que un simple pulido — repensar composición, no solo ajustar
detalles. Se le preguntó primero si tenía un proyecto propio en
claude.ai/design (Claude Design) del que tomar referencia; respondió que
no, que mejorara el diseño directamente. Cambios reales de estructura
(no solo estilo):

- **`core/widgets/pm_bottom_nav.dart`** (nuevo): reemplaza el
  `BottomNavigationBar` de Material stock por una barra flotante
  (tarjeta redondeada con margen y sombra, no de borde a borde) con el
  ítem activo resuelto como una píldora de fondo coral + ícono relleno —
  más cercano al lenguaje visual de apps nativas modernas (Airbnb/
  Instagram) que el nav plano por defecto. `home_shell.dart` ya no trae
  `AppBar` propio (antes solo repetía el logo, redundante con el
  encabezado de cada página) — el contenido arranca directo desde
  arriba. Las etiquetas del nav se abreviaron respecto al
  `.nav__links` del sitio (Explorar/Favoritos/Points/Invita/Cuenta en
  vez de los nombres completos) porque a 5 tabs en ~390px de ancho el
  texto completo se cortaba — el título completo de cada sección sigue
  viviendo en el encabezado de su propia página.
- **`panorama_card.dart` rediseñada** (patrón tipo Airbnb): la foto pasa
  a esquinas redondeadas completas (antes solo las de arriba) con dos
  badges flotantes — "🧠 Darwin" arriba-izquierda (reemplaza el hint de
  texto plano que iba debajo) y un ícono de favorito (corazón, con
  estado `favorited`/`onFavoriteToggle` ya expuesto para cuando se
  conecten favoritos reales) arriba-derecha. Título/meta/precio pasan a
  vivir DEBAJO de la foto en texto normal (no superpuestos), más legible
  que el overlay que traía antes. Como la tarjeta ya no se
  autodimensiona (antes tenía `width: 210` fijo), las filas horizontales
  de Combos/Simples en `panoramas_page.dart` ahora envuelven cada
  tarjeta en un `SizedBox(width: 168)` explícito, y el `childAspectRatio`
  de las grillas (`panoramas_page.dart`/`favoritos_page.dart`) bajó de
  0.82 a 0.76 para darle más alto a la nueva composición foto+texto.
- **Onboarding convertido a wizard paso a paso** (`onboarding_page.dart`
  reescrito completo): en vez del formulario scrolleable único que traía
  `onboarding.html`, ahora es un `PageView` de 6 pasos (edad+compañía,
  gustos, exigencia física, presupuesto, distancia, día+comuna) con
  barra de progreso segmentada arriba, botón de volver (`←`) que aparece
  desde el paso 2, y "Saltar" siempre visible — cada paso valida solo
  sus propios campos antes de dejar avanzar (mismos campos obligatorios
  que el sitio: edad/company/difficulty/budget/distance/day/city; tastes
  sigue sin mínimo real pese al hint, mismo criterio que antes). El
  guardado real en Supabase (`upsertProfile`/`upsertDarwinPreferences`)
  solo se dispara al confirmar el último paso, igual que antes.
- **Auth rediseñado a patrón "hero + bottom sheet"** (`auth_page.dart`):
  en vez de una tarjeta blanca flotando centrada sobre el degradado,
  ahora es un layout de dos zonas — hero superior (degradado crema→sun,
  logo + tagline "Tu próximo panorama, sin buscar tanto") y un sheet
  blanco con esquinas superiores redondeadas que ocupa el resto de la
  pantalla y contiene el form activo (login/signup/verificación/
  recuperar contraseña, misma lógica interna de antes, solo cambió el
  contenedor). Patrón común en apps nativas (Duolingo/Airbnb-style) en
  vez de la tarjeta centrada que se sentía más "formulario web".
- **`core/widgets/pm_icon_circle.dart`** (nuevo): insignia circular
  reutilizable para emoji/ícono sobre fondo suave — reemplaza el patrón
  repetido "Container redondo + Text(emoji)" que estaba duplicado en Mi
  Cuenta y Pick Points.
- **Mi Cuenta** (`dashboard_page.dart`): se agregó un avatar circular con
  iniciales junto al saludo (mismo patrón ya usado en negocio-admin del
  sitio web) — muestra `🙂` si el perfil todavía no tiene nombre. Los
  teasers de Pick Points/datos de viajero pasan a usar `PmIconCircle`.
- **Pick Points** (`pickpoints_page.dart`): la barra de progreso lineal
  se reemplazó por un anillo de progreso circular (`CircularProgressIndicator`
  con el total de puntos centrado adentro) junto al nombre del nivel y
  cuánto falta para el próximo premio — más legible como "stat" que una
  barra angosta, patrón común en apps de rewards/fitness.
- **Verificación visual repetida con el mismo método** que la sesión
  anterior (Flutter SDK ya clonado en `/tmp`, entrypoint temporal
  `lib/dev_preview_main.dart` + fuente de prueba, ambos borrados/
  revertidos antes de terminar) — confirmado con capturas que el wizard
  de onboarding avanza de paso, valida y muestra error correctamente, que
  la tarjeta nueva y el nav flotante se ven bien, y que ninguna etiqueta
  del nav se corta.

### Segundo pase de pulido (mismo día, "mejoralo y perfeccionalo aun más")

Con la estructura ya redefinida, este pase agrega interacciones y
detalles finos en vez de tocar el layout de nuevo:

- **Toggle mostrar/ocultar contraseña** en los 3 campos de contraseña de
  `auth_page.dart` (login, signup, nueva contraseña del reset) — ícono de
  ojo en el `suffixIcon`, estado de visibilidad rastreado por
  `passwordKey` (`'login'`/`'signup'`/`'reset'`) ya que son campos
  distintos en vistas distintas de la misma pantalla.
- **Píldora deslizante en los tabs de auth** (`_tabs()`): un
  `AnimatedAlign` con un `FractionallySizedBox` de fondo, en vez de
  recolorear el contenedor de cada tab — transición suave tipo segmented
  control nativo al cambiar entre "Iniciar sesión"/"Crear cuenta".
  **Bug real encontrado acá mismo armando esto**: la primera versión
  envolvía el label en `AnimatedDefaultTextStyle` con un `TextStyle`
  nuevo (solo `fontWeight`/`color`, sin `fontFamily`) — mismo bug de
  fondo que el de `ElevatedButtonThemeData` documentado arriba:
  `DefaultTextStyle`/`AnimatedDefaultTextStyle` **reemplazan** por
  completo el estilo ambiente en vez de combinarlo, así que el texto caía
  al fallback del engine. Con `.merge()` explícito se veía OK, pero en
  una segunda vuelta de captura el texto salió como bloques de color
  sólido en vez de glifos (glitch de renderizado en este entorno
  CanvasKit+swiftshader+fuente de prueba, no reproducible con
  confianza) — se optó por la solución más simple y robusta: volver a
  `Text(style: TextStyle(...))` plano (que sí hereda/combina solo, por
  `inherit: true` de fábrica) y animar únicamente el fondo de la
  píldora, no el texto. Moraleja reforzada: evitar
  `DefaultTextStyle`/`AnimatedDefaultTextStyle` sueltos en este proyecto
  a menos que se combinen explícitamente con el estilo ambiente.
- **`core/widgets/pm_shimmer.dart`** (nuevo): placeholder "shimmer"
  (barrido diagonal de brillo vía `ShaderMask`) para fotos en carga —
  reemplaza el rectángulo gris plano en `panorama_card.dart` y
  `panorama_detail_sheet.dart`.
- **`panorama_card.dart`**: sombra sutil bajo la foto (antes plana) y
  `fadeInDuration` en `CachedNetworkImage` para que la transición
  placeholder→foto no sea un corte seco.
- **`panorama_detail_sheet.dart`**: agregado el drag handle (barrita
  blanca centrada sobre la foto) y un botón de cerrar (✕) flotante
  arriba-derecha — antes solo se podía cerrar arrastrando el sheet hacia
  abajo, sin afordance visual de que se podía cerrar con un tap.
- **`core/widgets/pm_cta_link.dart`** (nuevo): tarjeta "puente entre
  secciones" (ícono + título/subtítulo + flecha), portada literal de
  `.dash__cta` del sitio (`pickpoints.html`/`invita.html`) que se me
  había quedado sin construir en el primer pase — "Ver mis panoramas" en
  Pick Points y "Ver mis Pick Points" en Invita, navegando con
  `Navigator.push` a la página destino envuelta en `Scaffold` (mismo
  patrón ya usado por los teasers de `dashboard_page.dart`).
- **Flechas reales, no unicode**: el único `Text('Ver todo →')` que
  quedaba (`panoramas_page.dart`) pasó a `Icon(Icons.arrow_forward_rounded)`
  — mismo criterio que ya usaban los teasers (`Icons.chevron_right`),
  para que el glifo no dependa de qué fuente esté activa.
- **`pm_chip_group.dart`**: cada chip ahora es su propio
  `StatefulWidget` con un `AnimationController` de "pop" (`ScaleTransition`
  0.94→1 al tocar) + un ✓ (`Icons.check_rounded`) que aparece con
  `AnimatedSize` cuando el chip queda seleccionado — más feedback táctil
  que el cambio de color solo.
- **`pm_primary_button.dart`**: reescrito a `StatefulWidget` con un
  leve "press-scale" (`AnimatedScale` a 0.97 mientras se mantiene
  presionado). Implementado con `Listener` (`onPointerDown/Up/Cancel`),
  **no** `GestureDetector` — un `GestureDetector` con callbacks de tap
  ahí arriba compite en el gesture arena con el `onPressed` real del
  botón y podía bloquearlo; `Listener` solo observa punteros sin
  reclamar el gesto.
- **Métodos de pago de `dashboard_page.dart`**: el logo de Mastercard
  pasó de un texto "MC" suelto a los dos círculos superpuestos
  (rojo/ámbar) del branding real, y VISA quedó en cursiva/bold — mismo
  tratamiento visual de `.pay__logo--visa`/`.pay__logo--mc` del sitio.
- **Toolbar de filtros de Panoramas**: se agregó de vuelta el selector
  "Ordenar" (Recomendado/Precio asc/desc, con lógica real de
  `sort()` sobre `_exploreList`, no solo decorativo) — en el primer pase
  se había dejado solo el filtro de Precio y el toolbar se sentía
  desbalanceado/incompleto comparado con el original de
  `panoramas.html`.

### Ajuste puntual a Panoramas (mismo día, a pedido explícito del usuario)

El usuario pidió mejorar específicamente la pantalla de Panoramas (la más
visitada) en dos cosas concretas, dejando el resto de pantallas sin tocar:

- **`_ForestBanner`/`_Tree`** (nuevos, privados de `panoramas_page.dart`):
  el encabezado plano sobre fondo crema pasó a un banner degradado verde
  de esquinas inferiores redondeadas con una silueta de "árboles"
  (círculo de follaje + tronco, dos tonos de verde alternados, sin
  ninguna imagen/asset — formas puras) asomando desde el borde inferior,
  a pedido literal del usuario ("un fondo verde con árboles"). Mismo
  patrón conceptual que el `.skyline` ilustrado del sitio web pero hecho
  con `Container`s/`BoxDecoration`, no SVG.
- **Tarjetas más chicas para ver 3 por fila**: `PanoramaCard` ganó un
  parámetro `compact` (reduce badges/íconos/tamaños de texto
  proporcionalmente) — `favoritos_page.dart` NO lo usa a propósito
  (sigue con el tamaño normal, el usuario pidió tocar solo Panoramas).
  En `panoramas_page.dart`: las filas horizontales (Combos/Simples)
  bajaron de ancho 168→112px, y la grilla de "Explorar" de
  `maxCrossAxisExtent: 234/childAspectRatio: 0.76` a `130/0.60` — ambos
  ajustados para que quepan exactamente 3 columnas en ~390px de ancho en
  vez de 2.

## Sesión de bugs reales + primeros tests automatizados (mismo día)

A pedido explícito del usuario ("busca bugs y prueba funciones"), revisión
de código enfocada en encontrar bugs reales (no solo visuales) en
`app_flutter/`. Los cinco encontrados y arreglados:

1. **Recuperar contraseña rota si el link abre la app en frío**:
   `AuthController._onAuthStateChange` trataba el evento
   `AuthChangeEvent.passwordRecovery` igual que un login normal, así que
   el `redirect` de `go_router` mandaba directo a `/home`/`/onboarding`
   antes de que `AuthPage` (que tiene su propio listener para saltar al
   formulario de nueva contraseña) llegara siquiera a montarse — el
   listener de `AuthPage` nunca alcanzaba a ver el evento porque un
   `Stream` broadcast no reproduce eventos pasados a suscriptores
   tardíos. Fix: `AuthController` ahora expone `passwordRecovery`
   (booleano) + `consumePasswordRecovery()`; el router revisa ese flag
   ANTES del chequeo de onboarding y fuerza `/auth` al salir de
   `/splash`; `AuthPage.initState` lo consume para arrancar directo en
   la vista `forgotReset`. El listener local de `AuthPage` se mantiene
   intacto para el caso "la app ya estaba abierta" (ahí sí llega a
   tiempo).
2. **"Mi cuenta" quedaba con los campos vacíos para siempre**:
   `_hydrate()` en `dashboard_page.dart` marcaba `_hydrated = true` en el
   primer build aunque `auth.profile` todavía fuera `null` (fetch async
   a Supabase todavía en curso) — cuando el perfil real llegaba y
   disparaba un rebuild, el guard ya bloqueaba para siempre el llenado
   de Nombre/Apellido/RUT/Teléfono. Fix: no marcar `_hydrated` hasta que
   `auth.profile` sea realmente no-null.
3. **Onboarding no precargaba respuestas ya guardadas**: entrar a editar
   desde "Tus datos de viajero" siempre arrancaba el wizard en blanco,
   perdiendo silenciosamente edad/company/tastes/etc. ya guardados (a
   diferencia de `onboarding.html`, que sí precarga `user.city` y el
   resto — ver `js/onboarding.js`). Fix: `initState` ahora lee
   `AuthController.profile` (seguro: solo se llega acá vía el router
   después de que el perfil ya se resolvió, o empujado desde Mi Cuenta
   con el perfil ya cargado) y precarga los `Set`/controladores — con un
   guard extra para `city`: solo se asigna si el valor calza con
   `todasLasComunas`, porque `DropdownButtonFormField` tira una
   excepción real si el `value` no está entre sus `items` (un
   `profile.city` vacío/desactualizado habría roto la pantalla).
4. **El corazón de favorito no hacía nada**: `PanoramaCard` exponía
   `favorited`/`onFavoriteToggle` pero ningún caller los pasaba —
   tocarlo no tenía ningún efecto en ninguna pantalla. Fix:
   `features/favoritos/data/favorites_controller.dart` (nuevo,
   `ChangeNotifier` simple con un `Set<String>` en memoria, provisto en
   `main.dart` junto a `AuthController`) conectado en Panoramas
   (filas y grilla) y en Favoritos, que ahora filtra
   `catalog.todoElCatalogo` por lo realmente marcado en vez de mostrar
   una muestra fija — el estado vacío ("Todavía no tienes favoritos")
   pasa a ser alcanzable de verdad. Efímero a propósito (no persiste
   entre reinicios) mientras el catálogo siga siendo data de muestra.
5. **Signup/edición de cuenta no validaban el RUT**: `js/auth.js` y
   `js/dashboard.js` validan el RUT con dígito verificador real
   (`isValidRut`) antes de guardar; la app dejaba pasar cualquier texto.
   Fix: `core/utils/rut.dart` (nuevo) porta el mismo algoritmo
   (`cleanRut`/`formatRut`/`isValidRut`) literal, usado ahora en
   `auth_page.dart` (signup) y `dashboard_page.dart` ("Configura tu
   cuenta", que de paso también gana el chequeo de nombre/apellido no
   vacíos que tenía el sitio y a la app le faltaba).

**Primeros tests automatizados del proyecto** (`app_flutter/test/`,
carpeta que no existía — se había borrado el test de ejemplo del `flutter
create` en la sesión inicial por quedar obsoleto): en vez de seguir
verificando solo con capturas de Playwright (útil para diseño, pero
fresco y no repetible), se agregaron tests reales con `flutter_test`:
`rut_test.dart` (los 3 casos del algoritmo con RUTs reales verificados a
mano), `favorites_controller_test.dart`, y `panorama_card_test.dart` —
este último fue el que efectivamente detectó que el toggle de favorito
SÍ funciona bien aislado del tap general de la tarjeta (se había
intentado verificar por Playwright primero con clicks manuales por
coordenadas, que fallaron por imprecisión de un ícono de 24px, no por un
bug real — el test de widget lo confirmó de forma determinística). Correr
con `flutter test` desde `app_flutter/`.

## Modal de detalle del panorama: rediseño minimalista + Reservar honesto

A pedido explícito del usuario ("agrega un diseño minimalista pero
profesional") tras la sesión de bugs de arriba — se le preguntó dónde
aplicarlo (rechazó la pregunta estructurada), así que se usó criterio
propio: el modal de detalle (`panorama_detail_sheet.dart`) era el punto
más débil, con el botón "Reservar" sin dar ningún feedback al tocarlo.

- **Barra inferior fija con precio + CTA** (patrón Airbnb/Booking): antes
  el botón "Reservar" quedaba suelto al final del scroll; ahora el
  contenido (foto/título/dato rápido/por qué Darwin) scrollea en un
  `Expanded` y una `_BottomBar` separada (borde superior sutil, safe
  area) queda siempre visible con "Precio" + monto a la izquierda y el
  botón a la derecha.
- **"Por qué Darwin te lo recomienda" con acento minimalista**: pasó de
  una caja llena de color (fondo + borde) a una franja delgada de color
  a la izquierda (`_WhyCallout`, patrón "cita/callout" común en apps
  profesionales) — mismo contenido, menos peso visual.
- **Dato rápido con ícono real** (`Icons.schedule_rounded` + `item.meta`)
  y un separador delgado antes del callout, en vez de que todo quede
  apilado sin jerarquía.
- **"Reservar" ya no es un botón muerto**: como no existe backend de
  reservas todavía (ver sección de arriba), tocarlo cierra el sheet y
  muestra un aviso honesto ("Muy pronto vas a poder reservar directo
  desde la app") en vez de fingir una reserva confirmada que no pasó por
  ningún lado — mismo criterio de "no fabricar dato falso" del resto del
  repo. Verificado con un test de widget (`panorama_detail_sheet_test.dart`)
  en vez de Playwright, porque el intento con clicks por coordenadas no
  disparaba el botón de forma confiable (mismo tipo de imprecisión que
  ya se había visto con el corazón de favorito) — el test confirma de
  forma determinística que el sheet se cierra y aparece el aviso.

## Claridad de "paquetes" en la app Flutter, basada literalmente en la web

Instrucción explícita del usuario: "recuerda lo de los paquetes tiene que
ser clarisimo. basate mucho en la web en la forma que une los paquetes" —
antes de diseñar algo nuevo, se releyó `js/panoramas.js`
(`cardHTML()`/`modalHTML()`) y `css/panoramas.css` (líneas ~195-215) para
copiar el mecanismo real que ya usa el sitio en vez de inventar uno
distinto: un badge `.pano-card__kind`/`.pano-modal__kind` visible SIEMPRE
(tarjeta y modal), con texto "Simple" o "Paquete" y colores exactos
(`#3f7a2c` verde para simple, `var(--deep-red)` para paquete, fondo
`rgba(255,255,255,.9)`, texto mayúscula/bold/pequeño).

- **`PanoramaItem.kindLabel`** (`panorama_item.dart`): mismo texto
  "Simple"/"Paquete" que `kindLabel` en `js/panoramas.js`, derivado de
  `kind`.
- **`PanoramaItem.components`**: un paquete junta varias actividades en
  un solo título unido por " + " (mismo patrón de copy que el catálogo
  del sitio, ej. "Museo + almuerzo con guía") — este getter separa el
  título en partes individuales para poder listarlas una por una, en vez
  de dejarlas como un bloque de texto ambiguo. Cubierto por
  `test/panorama_item_test.dart` (3 casos: paquete con 2+ componentes,
  simple, y un título sin "+").
- **`panorama_card.dart`**: el badge de tipo pasó a vivir en un `Wrap`
  junto al badge de Darwin (antes solo existía el de Darwin) — mismos
  colores exactos que el CSS de arriba, con `right:` reservado para no
  superponerse con el corazón de favorito en la esquina opuesta.
- **`panorama_detail_sheet.dart`**: mismo badge (`_KindBadge`) sobre la
  foto del modal, en la misma posición relativa que
  `.pano-modal__kind` en el sitio. Para un paquete con más de un
  componente, se agregó una sección nueva **"🧳 Este paquete incluye"**
  (`_PackageIncludes`) — cada actividad del título compuesto listada con
  un ícono de check, entre el dato rápido (horario) y el callout de "Por
  qué Darwin te lo recomienda". El sistema de addons/calendario de
  reserva del sitio (`ADDONS_KEY`, `reserveModalHTML`) es una feature
  mucho más grande y queda fuera de este alcance — acá el objetivo era
  solo la claridad de "qué es" un paquete, no reproducir su flujo de
  reserva completo.
- Verificado con Playwright (mismo método de siempre: build web con
  `lib/dev_preview_main.dart` temporal, CanvasKit local, capturas a
  ~390px) mostrando la grilla con las tarjetas Simple/Paquete y el modal
  de un paquete abierto con su desglose de componentes — capturas
  descartadas tras verificar (no se commitea nada del entrypoint
  temporal, mismo criterio que las rondas anteriores de este mismo día).

## Bug real: el wizard de onboarding no navegaba a ningún lado al terminar

A pedido explícito del usuario ("busca bugs y arreglalos"), auditoría de
`app_flutter/lib/` completa buscando bugs funcionales (no solo visuales).
El más serio: **ni "Finalizar" ni "Saltar" en `onboarding_page.dart`
navegaban a ninguna parte** — un `grep -rn "context.go\|Navigator.push"`
sobre todo `lib/` mostró que la ÚNICA navegación imperativa de toda la app
es el `Navigator.push` que abre `OnboardingPage` desde "Tus datos de
viajero" en Mi Cuenta; todo lo demás depende 100% del `redirect`
declarativo de `app_router.dart`. Ese `redirect` solo decide destino
cuando `state.matchedLocation` es `/splash` o `/auth` (a propósito, ver
comentario ahí) — nunca cuando ya se está en `/onboarding`. Resultado: un
viajero nuevo que termina el signup, completa el wizard y presiona
"Finalizar" (o lo salta con "Saltar") se queda mirando la misma pantalla
para siempre, aunque `profile.onboarded` ya haya quedado en `true` en
Supabase — el único perfil que alguna vez pudo salir de ahí era
reiniciando la app en frío (el router sí redirige correctamente al pasar
por `/splash`).

- **Fix**: `onboarding_page.dart` agrega `_leaveOnboarding()`, llamado al
  final de `_submit()` (tras guardar) y de `_skip()`. Como la pantalla
  vive en dos contextos reales distintos — ruta raíz del router (signup
  fresco, sin nada debajo en el stack) vs. empujada con `Navigator.push`
  desde Mi Cuenta (con `HomeShell` debajo) — `Navigator.of(context).canPop()`
  distingue ambos sin necesitar un parámetro nuevo: si hay algo debajo,
  hace `pop()` (vuelve a Mi Cuenta); si no, `context.go('/home')` (mismo
  criterio que el resto del router). De paso quedó al descubierto que
  editar el perfil desde Mi Cuenta tampoco tenía forma de cerrarse sin el
  gesto nativo de "atrás" del sistema — el mismo fix cubre las dos rutas.
- **Test nuevo** (`test/onboarding_navigation_test.dart`, 2 casos): monta
  `OnboardingPage` con un `AuthController` real (no un mock — construido
  con un `SupabaseClient` apuntando a una URL inválida y
  `autoRefreshToken: false` para no dejar un timer pendiente que rompa el
  test) en los dos contextos (empujado sobre un `Navigator` vs. como ruta
  raíz de un `GoRouter` de prueba) y confirma que "Saltar" efectivamente
  saca al usuario de la pantalla en ambos casos. Viable sin mockear
  Supabase porque `AuthController._loadProfile()` ya atrapa internamente
  cualquier error de `_repo.currentUser` nulo y nunca lo relanza — por
  eso `_skip()`/`refreshProfile()` completan igual sin sesión real.
- 17 tests en total ahora (`flutter test`), todos verdes; `flutter
  analyze` sin issues.

## Onboarding: confirmada paridad 1:1 con la web + filtros de Panoramas mucho más completos

El usuario pidió, en dos mensajes seguidos: (1) que las preguntas de "cuéntanos
sobre ti" (onboarding) fueran "muy completas, igual o más que en la web"; (2)
que los filtros de Panoramas fueran "más elegantes" y permitieran "apretar y
desglosar muchos filtros, igual o más que en la web".

- **Onboarding: ya eran 1:1** — se releyó `onboarding.html` completo contra
  el wizard de `onboarding_page.dart` y son exactamente las mismas 7
  preguntas con las mismas opciones (edad, con quién, gustos, exigencia
  física, presupuesto, distancia, cuándo+comuna) — nada se había recortado
  al convertir el formulario scrolleable del sitio en wizard paso a paso.
  No se agregó ninguna pregunta nueva sin antes confirmarlo con el usuario
  (inventar categorías de perfil nuevas sería un dato fabricado sin
  respaldo en ningún spec).
- **Filtros de Panoramas: sí había un gap real**. `panoramas.html` tiene 6
  filtros en su toolbar (`js/panoramas.js`): Ordenar por (incl. "Mejor
  valorados"), Tipo de experiencia, Distancia, Precio, Cuándo (Hoy/Mañana/
  El fin de semana que sigue/Cualquiera) y Duración del paquete — la app
  Flutter solo tenía Ordenar (3 opciones, sin "Mejor valorados") y Precio.
  Para poder implementar los 4 filtros que faltaban había que portar
  primero los datos que la web deriva por hash de cada item
  (`enrich()`/`parseKm()`/`parseDay()`/`parseDias()`/`distanceBucket()` en
  `js/panoramas.js`):
  - **`PanoramaItem` (panorama_item.dart)** gana `category` (campo real,
    asignado a mano en `sample_catalog.dart` según el contenido real de
    cada item — nunca fabricado al azar) + getters computados idénticos a
    la web: `rating`/`reviews` (hash de `title`, mismo rango 4.3-5.0),
    `km`/`distanceBucket` (parseado de `meta` con el mismo fallback por
    hash), `dayBucket` (`'semana'`/`'finde'`, mismo `parseDay()`),
    `packageDuration` (mismo `parseDias()`, incluido el fallback a `'1'`
    para paquetes sin mención explícita de días — mismo bug ya corregido
    en la web, portado corregido desde el día uno). Cubierto por 8 tests
    nuevos en `panorama_item_test.dart`.
  - **`categoryLabels`** (mismo mapa `CATEGORY_LABELS` de la web) vive
    junto a `PanoramaItem` para reusarlo en el filtro "Tipo de
    experiencia", cuyas opciones se arman dinámicamente desde las
    categorías realmente presentes en el catálogo (no una lista fija).
  - **Toolbar rediseñada, "apretar y desglosar"**: en vez de 6 selects
    sueltos (lo que se ve poco elegante y ocupa media pantalla), la
    toolbar quedó compacta — un botón "Filtros" con contador de filtros
    activos (`Filtros (2)`, se pinta coral si hay algo aplicado) que abre
    una hoja modal (`_FiltersSheet`, `DraggableScrollableSheet`) con las 6
    categorías completas, cada una como un grupo de chips de selección
    única (no dropdowns nativos, más táctil). La hoja edita un "borrador"
    local que solo se aplica al tocar "Aplicar filtros" (patrón estándar
    de apps de reservas tipo Airbnb/Booking — evita que la grilla salte
    con cada tap individual). Debajo de la toolbar compacta, cada filtro
    ya aplicado queda como un chip removible con su propia ✕, sin tener
    que volver a abrir la hoja para sacar uno solo.
  - **`_applyAdvFilters()`/`_applySort()`** en `panoramas_page.dart`
    (mismo nombre y misma lógica que `applyAdvFilters()`/`applySort()` en
    `js/panoramas.js`) se aplican tanto a las filas Combos/Simples como a
    la grilla de Explorar — igual que en la web, donde `renderRows()`
    también respeta los filtros avanzados, no solo `renderExplore()`.
  - **Bug real encontrado en la verificación** (no relacionado a los
    filtros en sí): un widget test detectó un overflow real de 0.667px en
    las tarjetas compactas de las filas Combos/Simples — la fuente de
    prueba de Flutter (Ahem-like, sin la Nunito Sans/Fredoka real) mide
    ligeramente distinto y el alto fijo de la fila (182px) se quedaba
    corto por una fracción de píxel. Fix: 182 → 186px de alto de fila
    (margen invisible en producción, pero corrige el overflow real).
  - **Test nuevo** (`test/panoramas_filters_test.dart`, 3 casos): abrir la
    hoja, elegir una opción y aplicar deja el chip correcto; el chip se
    puede quitar directo con su ✕ sin reabrir la hoja; "Limpiar todo"
    resetea todo. Usa `pump()` explícito (no `pumpAndSettle()`), mismo
    motivo que `panorama_detail_sheet_test.dart` (el shimmer de fotos en
    carga anima en loop infinito sin red real en el test).
  - Verificado con Playwright (mismo método de siempre): la hoja de
    filtros abre con los 6 grupos completos, aplicar "Mejor valorados" +
    "Cultura" deja los dos chips activos y filtra correctamente el
    catálogo (la fila "Simples" incluso desaparece sola cuando queda
    vacía, ya contemplado por `_rowSection`).
- 27 tests en total ahora (`flutter test`), todos verdes; `flutter
  analyze` sin issues.

### Montañas caricaturizadas en el banner de Panoramas

A pedido explícito del usuario, tras ver el banner verde con árboles
("me gustó ese diseño verde... ¿pueden ser montañas caricaturizadas?
igual que en la web, pero más pequeño"). Se releyó `.mountains--back`/
`.mountains--mid`/`.mountains--front` en `css/styles.css` — el sitio usa
`clip-path: polygon(...)` para recortar 3 capas de silueta dentada, cada
una más oscura/opaca y más baja que la anterior. Flutter no tiene
equivalente directo a `clip-path` con porcentajes, así que se portó el
mismo efecto con un `CustomPainter` (`_MountainRange`/`_MountainPainter`
en `panoramas_page.dart`): 2 capas (no 3, dado el tamaño mucho más chico
del banner) de picos dibujados a mano con `Path.lineTo` en coordenadas
fraccionales del tamaño del canvas, una detrás de la otra — capa de atrás
más clara/translúcida (verde-azulado, para leerse "más lejos", mismo
truco de perspectiva de color que un ilustrador real usaría), capa de
adelante más oscura/sólida justo antes de que empiecen los árboles.
Posicionada detrás de los `_Tree` existentes en el mismo `Stack` (los
árboles siguen siendo el primer plano). Ronda de ajuste real durante la
verificación: la primera versión (58px de alto, tonos muy parecidos al
verde de los árboles) quedaba casi invisible fusionada con el fondo —
subida a 92px de alto y con mayor contraste de color (`0xFF9FCBAE`/
`0xFF234639`, antes `0xFF5C8C74`/`0xFF3D6B52`) para que los picos se lean
claramente como montañas sin taponar el texto del banner. Verificado con
Playwright (build web + captura recortada/ampliada 2x del banner) en las
dos rondas — la primera confirmó que se veía demasiado sutil, la segunda
confirmó picos nítidos y bien contrastados.

### Sin los árboles, con nubes y pájaros simples

Instrucción explícita del usuario en la misma sesión: "sin los círculos
verdes. agrega un par de pájaros y nubes, algo muy sencillo". Se sacaron
los 6 `_Tree` (círculo+tronco) del `_ForestBanner` y la clase `_Tree`
completa (sin otros usos en el repo). En su lugar, dos widgets nuevos
bien simples, mismo espíritu minimalista que `.cloud`/`.bird` del
skyline del sitio:
- **`_Cloud`**: 3 círculos blancos translúcidos superpuestos (mismo
  truco que varios `border-radius: 50%` encimados en CSS).
- **`_Bird`/`_BirdPainter`**: una sola curva doble en "M" dibujada con
  `Path.quadraticBezierTo` + `Paint(style: stroke)`, calcada del
  `<svg class="bird"><path d="M0 10 Q10 0 20 10 Q30 0 40 10">` real del
  sitio.

Las 2 nubes + 2 pájaros quedan agrupados en la esquina superior derecha
del banner, encima de las montañas. Ronda de ajuste real durante la
verificación: la primera posición dejaba un pájaro semi-tapado detrás de
una nube (mismo `Stack`, sin overlap intencional) y la nube chica pisaba
la primera línea del título — se resolvió subiendo todo el conjunto
(`top` entre 0 y 22px) para que quede por completo arriba de donde
empieza el texto, en vez de mover el texto o achicarlo.

### Texto del banner: más chico + fondo difuminado para legibilidad

El usuario mandó una captura mostrando el título blanco ("Darwin armó
estos planes especialmente para ti") mezclándose con los picos de las
montañas de fondo, poco legible, y pidió achicarlo y "ponerle un fondo
difuminado de color tal vez". Se envolvió el bloque de texto (eyebrow +
título) en un panel `ClipRRect` + `BackdropFilter(ImageFilter.blur
(sigmaX: 8, sigmaY: 8))` sobre un `Container` con `Colors.black.withValues
(alpha: 0.22)` — mismo patrón `rgba(...) + backdrop-filter: blur()` que
ya usa el sitio en `.hero__copy`/`.nav` para textos sobre fondos con
movimiento. El panel usa `Align(alignment: centerLeft)` + `Column
(mainAxisSize: MainAxisSize.min)` para achicarse al ancho real del texto
en vez de estirarse todo el ancho del banner. Título bajado de 21 a 17px,
eyebrow de 13 a 12px. Verificado con Playwright (build web + captura
recortada/ampliada 2x): el blur difumina visiblemente las montañas/nubes
detrás del panel y el texto blanco queda nítido y legible encima.

## Más color en Favoritos/Pick Points/Invita/Mi Cuenta (Panoramas queda intacta)

El usuario, tras ver capturas de toda la app: "la visual de panoramas
está perfecta. pero lo otro es super fome" — pidió más colores en
general en el resto de pantallas (todas construidas hasta ahora sobre
tarjetas blancas + acento coral único, sin usar el resto de la paleta de
marca — `sun`/`green`/`pink` casi no aparecían fuera de detalles
puntuales). Panoramas no se tocó (ya tenía el visto bueno explícito).

- **`PmIconCircle`** ya soportaba un `background` custom (parámetro
  existente, poco usado) — se aprovechó para variar el color de cada
  ícono según su significado en vez de dejar el tinte coral por defecto
  en todos lados:
  - Dashboard: teaser "Pick Points" → dorado (`sun`), teaser "Tus datos
    de viajero" → verde (`green`).
  - Pick Points: ícono de nivel 🙂 → dorado; cada premio de "Premios por
    logros" pasa de un emoji suelto con opacidad a un círculo de color
    (`_rewardColors`, cicla coral/dorado/verde/rosado por índice).
  - Invita: los 3 pasos de "Cómo funciona" pasan de emoji suelto a
    círculos de color (coral/verde/dorado).
  - Favoritos: el estado vacío pasa del emoji 🤍 suelto a un círculo
    rosado grande (72px), más invitante que antes.
- **Escalera de cashback de Pick Points** (`_cashbackLadder`): antes los
  4 tiers usaban todos el mismo coral desteñido en distintas opacidades;
  ahora cada tier tiene su propio color (Nuevo=gris/slate, Recurrente=
  rosado, Fiel=coral sólido/activo, VIP=dorado) — VIP ya se ve dorado
  aunque todavía no esté alcanzado, insinuando "el próximo nivel es el
  dorado" en vez de quedar en gris neutro.
- **Invita**: el código de invitación pasa de una caja gris con borde a
  un degradado dorado→coral suave; los 3 stats de "Tus referidos" pasan
  de coral uniforme a coral/verde/dorado — se agregó `_statGold`
  (`Color(0xFFC98A1E)`, una versión oscurecida de `sun`) porque el
  amarillo de marca tal cual no da contraste suficiente para texto
  grande en negrita sobre blanco.
- Verificado con Playwright (mismo método de siempre) en las 4 pantallas
  — se ven notoriamente más vivas sin perder la limpieza del diseño
  (nada de fondos saturados de página completa, el color vive en
  acentos puntuales: íconos, badges, la escalera, el código).
