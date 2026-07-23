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

## Toolbar de panoramas.html: rediseño "profesional y tecnológico" (2026-07-21)

Instrucción explícita del usuario sobre el header + toolbar de filtros ya
rediseñados ese mismo día ("resideña esta sección, a más profesional y
tecnológica"). `css/panoramas.css`:
- `.pano-hero__pulse`: punto pulsante (animación `panoHeroPulse`, expandir +
  desvanecer) junto al eyebrow "🤖 Darwin · tu IA de panoramas", para que se
  lea como "sistema en vivo" en vez de texto estático.
- `.pano-hero__stat` (además de `.dash__weather`, en los widgets de
  clima/ubicación): chip con fondo/borde propio, como si fuera una lectura
  de sensor.
- `.pano-toolbar__head` (nuevo wrapper): fila con el label a la izquierda y
  `.pano-toolbar__head-actions` a la derecha (contador de resultados en
  vivo `#panoResultCount` + botón "Limpiar filtros", que se movió de
  dentro de `.pano-toolbar__row` a acá — se le quitó el `margin-left:auto`
  que tenía porque ya no lo necesita en su nueva posición).
- `#panoResultCount` se actualiza en cada `renderExplore()` (`js/panoramas.js`)
  con el conteo real de tarjetas filtradas — antes solo existía el markup,
  sin JS que lo poblara.
- Cada ícono de filtro (`.pano-advfilter__badge`) y el del label
  (`.pano-toolbar__label-icon`) pasan de emoji suelto a un chip cuadrado
  con fondo tenue, mismo patrón visual repetido para que se sienta
  "sistema", no una lista de emojis sueltos.

## Super admin: modo "Ver como" (negocio/viajero) sin recambiar cuentas (2026-07-21)

Instrucción explícita del usuario: poder moverse, desde `negocio-admin.html`,
a la vista real de cualquier negocio aliado o cualquier viajero registrado
— sin cerrar sesión ni loguearse de nuevo — para ir revisando cambios del
sitio sin tener que alternar cuentas a mano. De paso se reportó un bug real
("entro como empresa y me mete a otra cosa nada que ver") que se atacó en
paralelo (ver bullet de case-insensitivity abajo).

- **Mecanismo**: como tanto `js/negocio.js`/`negocio-*.html` como
  `js/dashboard.js`/`js/panoramas.js`/etc. determinan "quién está
  logueado" leyendo un puntero plano de `localStorage`
  (`pickmap_business_session` / `pickmap_current_user`) y buscando ese
  email en `pickmap_business_users` / `pickmap_users` — SIN re-verificar
  una sesión viva de Supabase en cada carga de página (solo las páginas de
  login mismas hacen ese chequeo, para auto-redirigir si ya hay sesión) —
  "impersonar" para el admin es tan simple como pisar ese puntero
  temporalmente y navegar al panel real. Cero código nuevo de
  autenticación, se reusa el 100% del render existente.
- **`negocio-admin.html`**: nueva tarjeta "🎭 Ver como" con dos selects
  (negocio / viajero, poblados desde `pickmap_business_users` /
  `pickmap_users`) + botón cada uno. `js/negocio-admin.js`: al hacer clic,
  guarda `pickmap_admin_viewing_as` (`{type, email}`) y pisa
  `pickmap_business_session` (o `pickmap_current_user`) con el email
  elegido, redirige a `negocio.html` / `dashboard.html`. Además, al pasar
  el guard de admin, ahora guarda `pickmap_admin_true_email` (marca
  persistente de "quién está REALMENTE autenticado", separada del puntero
  de sesión que sí se pisa) — se limpia al cerrar sesión de verdad.
- **`js/admin-viewas.js`** (nuevo, cargado en las 13 páginas de negocio y
  viajero — no en `negocio-admin.html`, que no lo necesita): no-op salvo
  que `pickmap_admin_true_email === 'contacto@pickmap.cl'` Y
  `pickmap_admin_viewing_as` esté seteado. Si aplica, inyecta una barra
  superior sticky ("👑 Super admin viendo como negocio/viajero: <email>" +
  botón "← Volver a super admin") que persiste al navegar entre páginas
  del mismo negocio/viajero. El botón de salir limpia
  `pickmap_admin_viewing_as`, restaura `pickmap_business_session` a
  `contacto@pickmap.cl`, limpia `pickmap_current_user`, y redirige a
  `negocio-admin.html`. También intercepta el `#logoutBtn`/`#bizLogoutBtn`
  propio de cada página (bug real encontrado en auditoría propia: si el
  admin usaba el "Cerrar sesión" normal en vez del botón de salir del
  banner mientras impersonaba, las marcas de admin quedaban pisadas en ese
  mismo navegador y el banner podía reaparecer con una sesión ya cerrada
  la próxima vez) — limpia las mismas dos marcas ahí también.
- **Solo el super admin ve esto**: el flag `pickmap_admin_true_email` se
  setea únicamente dentro del guard de `js/negocio-admin.js` (solo
  alcanzable tras pasar el chequeo de `contacto@pickmap.cl`), nunca en
  ningún otro flujo — un negocio o viajero real jamás puede terminar con
  ese flag seteado en su propio navegador, así que el banner nunca les
  aparece a ellos.
- Verificado end-to-end con Playwright (localStorage sembrado con un
  negocio y un viajero reales, click en ambos botones, navegación entre
  páginas del negocio con el banner visible, "volver a super admin"
  restaura el estado): sin errores de consola en ningún punto del flujo.

## Fix robustez: comparación de ADMIN_EMAIL case-insensitive (2026-07-21)

Diagnóstico (no confirmado con 100% de certeza — no se pudo reproducir en
vivo contra Supabase real por falta de internet en el sandbox, solo lectura
estática de código) del bug reportado "entro como empresa [siendo el admin]
y me mete a otra cosa nada que ver": los tres puntos que comparan el email
de sesión contra `ADMIN_EMAIL = 'contacto@pickmap.cl'`
(`js/auth-empresa.js`'s `panelDestino()` y el chequeo de sesión ya activa,
`js/negocio.js`'s guard, `js/negocio-admin.js`'s guard) usaban `===`
directo sin `trim()`/`toLowerCase()` — si `session.user.email` de Supabase
vuelve con mayúsculas o espacios distintos al literal hardcodeado, el admin
cae silenciosamente al camino de negocio normal en vez de a
`negocio-admin.html`. Se normalizaron los tres (`(email ||
'').trim().toLowerCase()` antes de comparar/usar), como hardening
defensivo — se documenta como tal, no como causa raíz confirmada.

## Solicitud de servicio: agregar o editar (2026-07-21)

Instrucción explícita del usuario sobre la sección "Servicios" del panel de
negocio ("acá puede ser agregar o editar servicio"): el form de solicitud
solo contemplaba pedir un servicio NUEVO — se agregó un toggle "Agregar
servicio nuevo" / "Editar un servicio existente" (`negocio-servicios.html`
+ `js/negocio-servicios.js`). Al elegir "editar", aparece un select con los
servicios ya inscritos (mismo `N.getServices()` que ya lista arriba) y las
etiquetas de nombre/descripción cambian a "Nuevo nombre (si cambia)"/"Qué
quieres cambiar" — los campos no se auto-rellenan con los valores actuales
del servicio (para no parecer que ya quedó guardado así, son "cambios
propuestos", no una réplica editable). `js/negocio.js`:
`solicitarNuevoServicio(nombre, descripcion, precioSugerido)` pasó a
`solicitarServicio(tipo, nombre, descripcion, precioSugerido,
servicioOriginal)` — la solicitud persistida ahora lleva `tipo`
(`'nuevo'`/`'edicion'`) y, si aplica, `servicioOriginalId`/
`servicioOriginalNombre`. La plantilla de correo interno
`solicitud-nuevo-servicio-owner` (`api/_lib/email-templates.js`) cambia
subject/heading/tabla según `datos.esEdicion`, agregando la fila "Servicio
a editar" cuando corresponde — sigue siendo un aviso solo para
`contacto@pickmap.cl`, no se auto-aprueba nada (mismo criterio de siempre).

**Bug real encontrado y arreglado en la misma pasada**: el campo nuevo
`#servicioAEditarField` (mismo patrón `.dash__field` que el resto del
form) usaba el atributo `hidden` para mostrarse/ocultarse según el toggle
— pero `.dash__field { display: flex; }` (definido en `css/dashboard.css`)
le ganaba en la cascada al `[hidden] { display: none }` por defecto del
navegador (mismo gotcha ya documentado arriba de "CSS `[hidden]` vs.
cascada de autor", esta vez atrapado en revisión propia en vez de
screenshot). El select "Servicio a editar" quedaba visible aunque el
toggle volviera a "Agregar nuevo" después de enviar una solicitud de
edición. Fix: se agregó `.dash__field[hidden] { display: none; }` en
`css/dashboard.css` — si se agrega otro campo con `hidden` sobre esta
clase en el futuro, ya queda cubierto.

## Bug real de auth: signUp() repetido con correo ya confirmado (2026-07-21)

Bug reportado en vivo por el usuario probando `contacto@pickmap.cl` en
producción: creó la cuenta admin el 20 de julio (quedó confirmada y con
login exitoso ese mismo día, confirmado en Authentication → Users del
dashboard de Supabase), pero al día siguiente volvió a intentar "Crear
cuenta" con el mismo correo (creyendo que la cuenta no existía) y quedó
esperando un correo de confirmación que nunca llegó. Causa: Supabase, por
protección anti-enumeración, no lanza error cuando `signUp()` se llama con
un correo que YA tiene una cuenta confirmada — devuelve un `user` con
`identities: []` (sin sesión), indistinguible de un signup nuevo genuino
para el código que no chequea ese campo. El formulario mostraba igual la
pantalla "Verifica tu correo", prometiendo un envío que nunca iba a pasar
(no hay nada que confirmar, ya está confirmado). Fix en `js/auth.js` y
`js/auth-empresa.js`: justo después de `signUp()`, si
`result.user.identities.length === 0`, se manda derecho al login con el
correo precargado y un mensaje explícito ("Ya existe una cuenta con ese
correo. Inicia sesión..."), en vez de mostrar la pantalla de espera falsa.
**Workaround usado para desbloquear la cuenta real de ese momento** (queda
documentado por si se repite con otra cuenta): en el SQL Editor de
Supabase, `update auth.users set encrypted_password = crypt('nueva-clave',
gen_salt('bf')), updated_at = now() where email = '...';` — fuerza una
contraseña conocida sin depender de ningún correo, usable cuando el SMTP
de confirmación/recuperación falla y la cuenta ya está confirmada pero se
perdió la contraseña.

## "Ver como" real: listar cuentas de Supabase, no solo del navegador del admin (2026-07-21)

Bug de alcance descubierto por el usuario probando en producción real:
`negocio-admin.html` mostraba "Negocios aliados: 0" y los selects de "Ver
como" salían vacíos, aunque sí había negocios/viajeros reales registrados
en Supabase. Causa: `js/negocio-admin.js` armaba esas listas leyendo
`pickmap_business_users`/`pickmap_users` de `localStorage` — que solo se
llenan cuando ESA cuenta específica inicia sesión en ESE MISMO navegador
(puente legacy, ver secciones de arriba). En el navegador del admin, que
nunca ha sido el navegador de ningún otro negocio/viajero, esas claves
están casi vacías sin importar cuántas cuentas reales existan.

Fix: `js/negocio-admin.js` ahora complementa esa lista local con una
consulta real a Supabase (`business_profiles`/`profiles`, ambas con la
policy "dueño o admin lee" ya definida en `schema.sql`) y las mezcla por
email (`mergeByEmail`, remoto pisa a local en conflicto) — si Supabase no
está configurado o la consulta falla, sigue funcionando solo con lo local,
nunca se rompe la página por esto (confirmado con Playwright: sin acceso a
internet en el sandbox, cae al fallback local sin errores de consola). El
rollup completo (stats agregados, top negocios, tabla, ver-como) ahora usa
esta lista mezclada — como `generateReservations(email)`/
`generateReviewRatings(email)` son puramente determinísticos por email
(sembrados con `seedRandom(20240711 + hashStr(email))`), cualquier negocio
real (de cualquier navegador) obtiene el MISMO dataset demo que vería en
su propio panel, sin necesitar reservas reales migradas a Supabase.

**`profiles`/`business_profiles` no tenían columna `email`** (solo
`user_id`, FK a `auth.users`) — necesaria para armar el picker sin poder
leer `auth.users` desde el navegador (bloqueado siempre por RLS, incluso
para el admin, salvo con la service role key que nunca vive en el
navegador). Se agregó `email text` a ambas tablas + backfill vía `update
... from auth.users` (corre una vez en el SQL Editor con el rol de owner,
que sí puede leer `auth.users`) + los dos triggers de creación de fila
(`crear_perfil_para_nuevo_usuario`/`crear_perfil_empresa_para_nuevo_usuario`)
ahora graban `new.email` en cada signup nuevo. `profiles` no tenía policy
de lectura para el admin (solo `business_profiles` la tenía) — se agregó
el mismo patrón (`auth.jwt() ->> 'email' = 'contacto@pickmap.cl'`).
**Pendiente para el usuario**: pegar el `schema.sql` completo de nuevo en
el SQL Editor para aplicar estos cambios (columna nueva + backfill +
policy + triggers actualizados) — es 100% idempotente/seguro de re-correr
sobre el proyecto real, como el resto del archivo.

Al hacer clic en "Ver como X", además de pisar el puntero de sesión, ahora
se espeja el registro real (venga de este navegador o de Supabase) hacia
`pickmap_business_users`/`pickmap_users` (`upsertLocalUser`) — sin este
paso, `negocio.js`/`dashboard.js` (que leen ese localStorage directo, sin
consultar Supabase) mostrarían "cuenta no encontrada" para cualquier
negocio/viajero real que nunca haya iniciado sesión en el navegador del
admin.

**Limitación que sigue igual, documentada honestamente**: las reservas,
reseñas y referidos de cada negocio siguen siendo 100% demo determinística
por email (nunca datos reales migrados a Supabase — alcance explícito ya
documentado arriba). Este fix soluciona que el admin pueda DESCUBRIR y
entrar a la vista de cualquier cuenta real registrada; no inventa
reservas/reseñas reales que no existen.

## Elegancia visual del panel super-admin (2026-07-21)

Instrucción explícita del usuario ("haz más elegante el panel del control
del super admin"). `css/negocio-admin.css`: micro-elevación en hover para
`.dcard`/`.biz-stat` (translateY + sombra más marcada), barra de acento
superior sutil en `.biz-stat`, punto verde antes de cada `.dcard__title`
(mismo lenguaje visual que el pulso de "sistema en vivo" ya usado en el
header de `panoramas.html`), hover más perceptible en filas de listas
(`.biz-res`, `.admin-top`), y un tratamiento propio para la tarjeta "Ver
como" (filas con fondo/borde verde tenue separadas, selects con foco verde,
botones con gradiente). Todo dentro de `.admin-page`, no afecta ninguna
otra página.

## Cuentas demo genéricas para "Ver como" + creación directa por SQL (2026-07-21)

Instrucción explícita del usuario: quiere una cuenta de empresa y una de
viajero genéricas, siempre disponibles, para poder ir revisando cambios en
tiempo real desde "Ver como" sin tener que loguearse/desloguearse — y
pidió crearlas directo por SQL en vez de pasar por el formulario de
signup (para no salirse del panel de super admin).

- **Cómo se crean cuentas reales de Supabase Auth sin pasar por la UI**:
  insertar directo en `auth.users` (con `encrypted_password` vía
  `crypt()`/`gen_salt('bf')`, mismo mecanismo ya usado para forzar la
  contraseña de `contacto@pickmap.cl`) + una fila en `auth.identities`
  (necesaria en versiones recientes de GoTrue para que
  `signInWithPassword` funcione) — los triggers ya instalados
  (`crear_perfil_para_nuevo_usuario`/`crear_perfil_empresa_para_nuevo_usuario`)
  se disparan solos con el `INSERT` y crean la fila de `profiles`/
  `business_profiles` automáticamente a partir de `raw_user_meta_data`, sin
  necesitar un segundo insert manual. `email_confirmed_at = now()` en el
  mismo insert evita todo el problema de correos de confirmación que no
  llegan. Cuentas creadas así: `negocio.demo@pickmap.cl` (empresa) y
  `viajero.demo@pickmap.cl` (viajero), password `Demo2026!` para ambas.
- **Gotcha real encontrado: caché de esquema de PostgREST**. Justo después
  de crear la tabla `business_profiles` por primera vez (pegando el
  `schema.sql` completo), las consultas desde el navegador a esa tabla
  devolvían vacío por un rato aunque los datos ya estaban ahí (confirmado
  con `select` directo en el SQL Editor) — típico retraso de PostgREST en
  reconocer una tabla nueva. Se resolvió solo esperando y recargando; no
  requirió ninguna acción further.
- **Bug real encontrado y arreglado**: `js/negocio-admin.js` filtraba
  `ADMIN_EMAIL` de la lista de negocios del picker "Ver como" pero no de
  la lista de viajeros — como `contacto@pickmap.cl` tiene su propia fila
  en `profiles` (se creó cuando todavía era una cuenta viajero normal,
  antes de tener acceso a `negocio-admin.html`), se colaba como si fuera
  un viajero real más. Se agregó el mismo filtro a `travelerUsers`.
- **Historial de reservas del viajero + reseñas (pickpoints.html)**: antes
  la tarjeta "Reservas por reseñar" solo mostraba reservas SIN reseñar, y
  desaparecía por completo apenas todas quedaban reseñadas — no existía
  ningún historial persistente visible. Ahora es "Historial de reservas":
  siempre visible (o un estado vacío explícito si no hay ninguna),
  muestra TODAS las reservas reales del viajero ordenadas por fecha
  — las ya reseñadas en modo solo-lectura (estrellas + comentario que
  el viajero dejó, guardado ahora también en su propio registro de
  `pickmap_traveler_reservations_<email>`, antes solo se guardaba en la
  reseña del NEGOCIO) y las pendientes con el mismo formulario de
  estrellas + texto de siempre.
- **Seed de historial demo, solo para `viajero.demo@pickmap.cl`**: como
  esta cuenta se creó directo por SQL, nunca reservó nada real — sin
  datos, el historial le saldría vacío. `js/pickpoints.js` siembra 3
  reservas de ejemplo (2 ya reseñadas con distintos ratings/comentarios, 1
  pendiente) la primera vez que esta cuenta puntual visita la página, si
  no tiene ninguna reserva todavía. Mismo criterio que `ADMIN_EMAIL`/
  `OWNER_NOTIFICATION_EMAIL` hardcodeados en otros archivos: el hardcode
  aplica a un correo específico y conocido, nunca se generan datos falsos
  para un viajero real. El lado empresa (`negocio.demo@pickmap.cl`) no
  necesitó nada de esto — `js/negocio.js` ya generaba reservas/reseñas/
  servicios demo determinísticos para CUALQUIER email desde antes.

**Bug real encontrado y arreglado (loop infinito de onboarding bajo "Ver
como")**: al completar `onboarding.html` mientras el admin está
impersonando a un viajero, esa respuesta se guarda contra Supabase con la
sesión REAL activa en ese navegador — que sigue siendo la del admin,
nunca hay una sesión de Supabase real para el viajero impersonado (la
impersonación es un puro swap de puntero en `localStorage`, no un login
real). Por eso `profiles.onboarded` del viajero de verdad nunca queda en
`true` en Supabase. Sin fix, cada clic en "Ver como viajero" volvía a
traer `onboarded:false` desde Supabase (vía `fetchRealTravelerUsers`) y
pisaba el `true` que sí había quedado guardado en el espejo local,
mandando de vuelta a onboarding en un loop infinito. Fix en
`js/negocio-admin.js`: antes de espejar el registro remoto, si el
`pickmap_users` local YA tiene `onboarded:true` para ese email, se
preserva ese valor por sobre el dato (potencialmente desactualizado) de
Supabase — una vez completado el onboarding una vez en un navegador para
una cuenta impersonada, queda completado ahí para siempre.
**Limitación de fondo que sigue igual** (documentada, no resuelta):
cualquier escritura real a Supabase que un viajero/negocio haría desde su
propia sesión (onboarding, preferencias, reservas) queda mal atribuida
mientras se usa "Ver como", porque la sesión de Supabase activa sigue
siendo la del admin — este fix soluciona el síntoma más molesto
(onboarding en loop) pero no reescribe la arquitectura de impersonación
para que las escrituras reales queden bien atribuidas al usuario
impersonado.

## Profesionalización técnica del sitio: SEO, favicon real, 404, meta tags (2026-07-22)

Instrucción explícita del usuario ("profesionaliza o busca formas de
hacer más pro la web"). Auditoría propia (solo lectura) encontró varios
huecos técnicos estándar de "sitio profesional" que nunca se habían
completado porque el foco de las sesiones anteriores fue siempre
funcionalidad, no SEO/metadata. Se implementó lo que no requiere
contenido inventado; dos ítems quedaron explícitamente fuera (ver abajo)
porque requerían fabricar datos falsos, algo que este proyecto evita a
propósito.

- **Favicon real en las 19 páginas de la app** (antes: un círculo SVG
  inline como placeholder, mismo en todas): reemplazado por
  `<link rel="icon" type="image/png" href="assets/icon-192.png">`, el
  ícono real de marca que ya existía (generado para la PWA, ver sección
  de arriba) pero nunca se usaba como favicon de pestaña.
  `notificaciones-preview.html` deliberadamente no se tocó (es
  `noindex, nofollow`, página de referencia interna).
- **`<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`**
  agregado junto al preconnect de `fonts.googleapis.com` que ya existía
  en las 19 páginas — antes solo se precalentaba la conexión al primer
  dominio (el que sirve el CSS de Google Fonts), no al segundo (el que
  sirve los archivos de fuente reales), perdiendo la mitad del ahorro de
  latencia que promete un preconnect de fuentes.
  `<img src="assets/logo.png" alt="">` → `alt="PickMap"` en el logo del
  nav de las mismas 19 páginas (antes vacío, invisible para lectores de
  pantalla).
- **`robots.txt` y `sitemap.xml`** (nuevos, raíz del repo): el sitio
  nunca había tenido ninguno de los dos — `robots.txt` desalinea
  explícitamente todas las páginas que requieren sesión (`dashboard`,
  `onboarding`, `panoramas`, `favoritos`, `pickpoints`, `invita`,
  `negocio*`) más `/bot-darwin/` y `/notificaciones-preview.html` (mismo
  criterio `noindex` que ya llevaban en su `<meta>`), y apunta al
  sitemap; `sitemap.xml` lista solo las 5 páginas genuinamente públicas
  (`/`, `/login.html`, `/login-empresa.html`, `/terminos.html`,
  `/privacidad.html`).
- **`404.html`** (nuevo): antes cualquier URL rota en producción caía en
  el 404 genérico y sin marca de Vercel. Página propia, reutilizando
  `.skyline` + `.nav`/`.logo` + `css/legal.css` (mismo lenguaje visual
  del resto del sitio) con un bloque `<style>` inline chico para el
  mensaje 404 en sí; `<meta name="robots" content="noindex">` porque no
  debe indexarse. Vercel sirve automáticamente cualquier `404.html` en la
  raíz de un sitio estático como página de error — no requiere config
  adicional en `vercel.json`.
- **Open Graph + Twitter Card en `index.html`**: el sitio nunca tuvo meta
  tags de preview social — compartir el link en WhatsApp/Twitter/Slack
  mostraba solo el título crudo de la pestaña, sin imagen ni descripción.
  Se agregó el bloque completo (`og:type/site_name/title/description/
  image/url`, `twitter:card/title/description/image`) apuntando a
  `https://pickmap.cl/` (dominio de producción documentado arriba) y
  `assets/icon-512.png` como imagen — es el único asset de marca en
  buena resolución que ya existe, aunque es cuadrado (1:1) y no el
  formato panorámico ideal (1.91:1) que estas plataformas recortan mejor;
  queda documentado con un comentario HTML en el propio `<head>` para
  quien quiera reemplazarlo por un banner ancho real más adelante.
- **Stat del hero actualizado a un número más creíble**: "+41.391.200
  combinaciones de panoramas" (una cifra astronómica, poco creíble a
  simple vista) se cambió a **"+1.352.112"** — mismo tipo de stat
  (combinaciones posibles, no un conteo real medido), pero en un orden de
  magnitud que se lee como plausible en vez de inflado. Instrucción
  explícita del usuario tras ver la propuesta de la auditoría.
- **Deliberadamente NO implementado** (flaggeado al usuario en vez de
  fabricar datos falsos, mismo criterio de siempre en este repo):
  reemplazar o agregar testimonios/reseñas reales en el hero (hoy solo
  existe un badge fijo "❤️ 5 reseñas" ya en el sitio) — instrucción
  explícita del usuario: "respecto a las reseñas aún no tengo reales,
  déjalo así". Se deja tal cual hasta que el usuario tenga reseñas reales
  que mostrar.
- Verificado con Playwright local (`python3 -m http.server 8811` +
  Chromium): `index.html` y `404.html` renderizan sin errores de layout,
  el stat nuevo se ve correcto en el hero. Los únicos "errores de
  consola" capturados (`ERR_CONNECTION_RESET` al cargar Google Fonts) son
  el bloqueo de red esperado del sandbox (ver sección "Verificación
  visual" arriba), no un problema real de las páginas.

## Rediseño de `.hero__stats`/`.hero__ctas` en el hero de `index.html` (2026-07-22)

Instrucción explícita del usuario sobre la fila de 3 stats + los 2
botones del hero viajero ("hazla más atractiva o elegante, cuidado con
que moleste visualmente"). Cambios en `css/styles.css`:
- Cada `.hero__stat` pasó de columna de texto plano a fila con un chip de
  ícono a la izquierda (mismo lenguaje visual ya establecido en
  `.pano-toolbar__label-icon`/`.pano-advfilter__badge` de
  `panoramas.html` — chip cuadrado con fondo coral tenue), fondo con
  gradiente sutil + sombra suave, y micro-elevación en hover
  (`translateY(-2px)` + borde coral). Íconos elegidos genéricos a
  propósito (🧭/🎯/⭐) para que sigan leyéndose bien tanto en modo
  viajero como en modo empresa (mismo `<strong data-client>/data-business`
  de siempre, el ícono es puramente decorativo y no cambia por modo).
  `.btn--primary` pasó de color plano a un gradiente sutil; `.btn--ghost`
  ahora tiene el mismo hover de elevación + sombra que el primario (antes
  solo invertía colores, sin movimiento) para que ambos botones se sientan
  igual de "vivos".
- **Bug real encontrado y arreglado en la misma pasada** (detectado con un
  chequeo de `scrollWidth` vs `clientWidth` en Playwright, no a simple
  vista): el primer stat (`+1.352.112`) es el texto más largo de los tres
  y, con el tamaño de fuente inicial del rediseño (1.3rem) más el ancho
  que le quitaba el ícono nuevo a la columna de texto, no cabía en una
  sola línea dentro de la card de ~159px (a 1280px de viewport) y el
  navegador lo cortaba a la mitad de un número ("+1.352.1" / "12"),
  viéndose roto. Fix: se ajustó el balance completo del componente —
  ícono 28px (antes 34px), padding horizontal 10px (antes 16px), gap 9px
  (antes 12px), fuente del número 0.96rem (antes 1.3rem) — hasta
  que `strong.scrollWidth === strong.clientWidth` para el texto más largo
  de los tres, confirmado con un script de Playwright antes de dar el
  cambio por terminado. Si se agrega un cuarto stat o se cambia el texto
  de alguno a algo más largo que "+1.352.112", repetir esa misma
  verificación (no confiar solo en la captura de pantalla, un overflow de
  ~1 palabra puede no saltar a la vista en una sola resolución).
- **Vueltos verticales a pedido explícito del usuario** ("y si los pones
  vertical? estas 3 mini tarjetas"), en vez de la fila de 3 columnas de
  la iteración anterior. `.hero__stats` pasó de `display: grid;
  grid-template-columns: repeat(3,1fr)` a `display: flex; flex-direction:
  column; max-width: 320px` — quedan apiladas del lado izquierdo, debajo
  de los botones, en vez de una fila ancha. Con más ancho disponible por
  tarjeta (ya no compiten entre sí por espacio horizontal) se pudieron
  agrandar de nuevo el ícono (32px, antes 28px) y la tipografía del
  número (1.1rem, antes 0.96rem) respecto a la versión en fila, sin
  reintroducir el bug de overflow (reverificado con el mismo chequeo de
  `scrollWidth`/`clientWidth`). En el breakpoint donde `.hero__inner`
  colapsa a una columna centrada (`@media max-width: 980px`, mismo punto
  donde ya se centraban `h1`/`.hero__sub`/`.hero__ctas`), se agregó
  `align-items: center; margin: 0 auto` a `.hero__stats` — antes tenía
  `justify-content: center` heredado de cuando era un grid en fila (con
  columna flex eso solo afecta el eje vertical, no centra horizontalmente,
  así que quedaba pegado al borde izquierdo mientras el resto del hero ya
  se veía centrado). Verificado con Playwright a 1280px (2 columnas,
  stats a la izquierda), 900px y 390px (columna centrada) en ambos modos
  (viajero/empresa): sin overflow horizontal ni texto cortado.
- **Segunda vuelta: stats como sidebar junto al título, no debajo de los
  botones** ("me refería a ponerlos en el lado izquierdo de la tarjeta,
  justo al lado de 'Déjanos organizarlo por ti'"). Se envolvió el
  contenido de `.hero__copy` en `.hero__copy-row` (flex row) con dos
  hijos: `.hero__stats` (ahora sidebar angosta, `max-width: 230px`, ya no
  forzada a un ancho uniforme — cada tarjeta se ajusta a su propio
  contenido) y `.hero__copy-main` (eyebrow + h1 + subtítulo + botones, el
  orden de siempre). Por debajo de 980px (mismo breakpoint donde
  `.hero__inner` ya colapsaba a una columna centrada) `.hero__copy-row`
  vuelve a `flex-direction: column` con `order` invertido (texto primero,
  stats después) para reproducir exactamente el layout apilado de la
  iteración anterior — nada cambia en mobile/tablet.
  **Ajuste encontrado en la propia verificación**: el h1 de modo empresa
  ("Llena tus cupos. Nosotros ponemos la gente.", bastante más largo que
  el de viajero) envolvía en 6 líneas dentro de la columna que le deja la
  sidebar nueva, leyéndose desbalanceado. Se agregó
  `.hero__copy-row .hero__copy-main h1 { font-size: clamp(2rem, 3vw,
  3rem); }` dentro de `@media (min-width: 981px)` (para no tocar el
  tamaño ya definido en el breakpoint de 720px) — bajó a 5 líneas, más
  proporcionado junto a la sidebar. Verificado con Playwright a 1280px,
  1024px, 900px y 390px en ambos modos: sin overflow ni texto cortado en
  ninguna combinación.
- **Tercera vuelta: "cuadrar" la sidebar para que no quede descuadrada
  respecto al texto**. La sidebar (3 tarjetas + gaps) medía ~240px de
  alto mientras la columna de texto (eyebrow+h1+sub+botones) medía
  ~415px — dejaba un bloque vacío abajo a la izquierda, desalineado con
  el resto de la tarjeta. Fix: `.hero__copy-row` pasó de `align-items:
  flex-start` a `align-items: stretch` (la sidebar ahora ocupa el 100%
  del alto de la fila) y `.hero__copy-row .hero__stats` pasó de
  `max-width` a `width: 230px` fijo + `justify-content: space-between` —
  las 3 tarjetas se separan para llenar ese alto parejo en vez de
  quedarse apretadas arriba. Resultado: el borde superior E inferior de
  la sidebar coincide exactamente con el de la columna de texto en
  cualquier alto de contenido (viajero con h1 de 3 líneas o empresa con
  h1 de 5). El breakpoint mobile (`max-width:980px`) ya fijaba
  `width:100%` para la sidebar apilada, así que no necesitó cambios.
- **Cuarta vuelta: de 3 tarjetas sueltas a un solo panel unificado**
  ("no me convence, rediseña esta tarjeta que se vea muy profesional" /
  luego "re ordena todo esto... proporciones profesionales"). Estirar la
  sidebar con `justify-content: space-between` (vuelta anterior) dejaba 3
  cajas flotantes con huecos vacíos grandes entre ellas — se leía como un
  layout roto, no como "cuadrado y elegante". Rediseño real: `.hero__stats`
  pasa a ser UN SOLO panel (borde + fondo + sombra propios, `overflow:
  hidden` para que las esquinas redondeadas corten las líneas divisorias
  internas), y cada `.hero__stat` es ahora una fila plana sin su propio
  borde/fondo/sombra — las filas se separan con `border-top` fino
  (`.hero__stat + .hero__stat`) y usan `flex: 1 1 0` para repartirse el
  alto disponible como padding interno en vez de como espacio vacío entre
  cajas. El hover pasó de "elevar la tarjeta" (`translateY`, ya no aplica
  a una fila sin bordes propios) a un resaltado de fondo sutil
  (`background: rgba(245,94,97,.06)`), mismo lenguaje que un hover de fila
  de tabla. Resultado: un bloque sólido, con las mismas proporciones que
  la columna de texto, sin importar cuánto se estire — se ve como un
  panel de verdad, no como 3 tarjetas descuadradas. Aplica igual en
  mobile/tablet apilado (mismo panel, ahora a ancho completo).
- **Quinta vuelta: reordenar todo — vuelta al orden de lectura clásico**
  ("todo lo que es stat, titulo y phone, quiero que lo reordenes"). Las
  4 vueltas anteriores probaron distintas variantes de "stats como
  sidebar junto al título" y ninguna convenció del todo. Se eliminó por
  completo `.hero__copy-row`/`.hero__copy-main` (el wrapper de fila que
  ponía la sidebar al lado del texto) — `.hero__copy` vuelve a ser una
  columna simple con el orden de lectura de toda la vida: eyebrow → h1 →
  subtítulo → botones → **stats al final, como fila horizontal** (antes
  vivían arriba/al lado). `.hero__stats` pasa de columna a
  `flex-direction: row` (mismo panel unificado con líneas divisorias,
  ahora verticales entre columnas en vez de horizontales entre filas);
  por debajo de 720px vuelve a apilarse en columna (mismo breakpoint que
  ya achicaba tipografía del hero), con la única línea divisoria pasando
  de `border-left` a `border-top`. El celular (`.hero__mock`) no se tocó
  — sigue en la columna derecha del grid `.hero__inner`, sin cambios.
  **Ajuste real necesario**: en fila horizontal de 3 columnas dentro de
  los ~536px de ancho de `.hero__copy` en desktop (1024-1280px), el
  número más largo (`+1.352.112`) volvía a cortarse — mismo tipo de bug
  que en la primera vuelta de este rediseño, esta vez detectado ANTES de
  pushear (con el mismo chequeo `scrollWidth`/`clientWidth` en Playwright
  en 5 anchos distintos) en vez de después. Se ajustó el balance del
  componente hasta que cupiera en todos los anchos probados: ícono 24px
  (antes 32px), padding 8px (antes 14-18px), gap 7px (antes 10-12px),
  fuente 0.88rem (antes 1-1.1rem). Verificado sin overflow en 1280, 1024,
  900, 600 y 390px, en ambos modos.
- **Sexta vuelta: botones del hero principal centrados + verde en vez de
  coral** ("estos botones centralos y en vez de rojo usa verde, el mismo
  que usas en otros lados"). `.hero__ctas` ahora lleva `justify-content:
  center` en la regla base (antes solo se centraba en mobile/`.cta-final`)
  — sin impacto visual en esos dos casos porque ya centraban por su
  cuenta. El botón primario del hero (`#hero .hero__ctas .btn--primary`,
  scoped solo a la sección `#hero` para no tocar el resto del sitio) pasa
  a `var(--green)` (`#83D061`, el mismo verde ya usado en el "Map" del
  logo y en el modo empresa) en vez del coral/rojo — el resto de botones
  `.btn--primary` del sitio (login, dashboard, panoramas, el CTA final
  "Descargar PickMap") siguen coral sin tocar, el pedido fue puntual
  sobre este botón. Verificado con Playwright en ambos modos
  (viajero/empresa) y que el CTA final no se vio afectado.
- **Séptima vuelta: centrar el texto dentro de cada tarjeta de stat**
  ("centra cada texto en su tarjeta"). El ícono+texto quedaba pegado al
  borde izquierdo de cada columna, con espacio vacío a la derecha ya que
  cada `.hero__stat` (flex: 1) reparte el ancho parejo pero el contenido
  es más angosto que la columna. Fix: `justify-content: center` en
  `.hero__stat` (centra el grupo ícono+texto dentro del ancho
  disponible) + `text-align: center` en `.hero__stat-body` (centra las
  líneas de texto que envuelven, como "combinaciones de panoramas").
  Aplica igual en la versión apilada de mobile.
- **Octava vuelta: count-up animado en los dos stats numéricos del hero**
  ("sorpréndeme", instrucción abierta tras preguntar qué más agregar para
  verse más profesional). `+1.352.112` y `100%` ahora animan desde 0 al
  cargar la página en vez de aparecer estáticos — mismo patrón ya
  establecido en el widget de Pick Points (`js/main.js`: ease-out cúbico,
  1400ms, `IntersectionObserver` que se dispara una sola vez,
  `toLocaleString('es-CL')`), replicado para no inventar un mecanismo
  nuevo. Como estas dos tarjetas ya no usan `data-client`/`data-business`
  (ese atributo dispara el swap de texto genérico en `setMode()`, que
  pisaría el número a mitad de la animación), ahora usan
  `class="count-up-hero"` + `data-target-client`/`data-target-business`
  + `data-prefix`/`data-suffix` — `setMode()` se actualizó para, en cada
  cambio de modo POSTERIOR a la animación inicial, actualizar el valor al
  instante sin re-animar (mismo criterio que el widgetCounter existente).
  Respeta `prefers-reduced-motion`: si está activo, no se ejecuta nada y
  se queda el valor final ya escrito en el HTML como fallback estático.
  "Pick Points"/"Referidos" (el tercer stat, no numérico) no se tocó.
  Verificado con Playwright: la animación corre y se asienta exacto en
  el valor final (`+1.352.112`/`100%`), el cambio a modo empresa lo pisa
  a `+0`/`0%` al instante, y volver a viajero restaura el valor final sin
  re-animar — sin errores de consola.

## Extender el lenguaje visual del hero al resto de index.html (2026-07-22)

Instrucción explícita del usuario: "hazlo sorpréndeme" tras preguntarle
qué más pulir del **diseño** (aclaró explícitamente "no cambies
estructura, hablo de diseño") — así que solo CSS, sin tocar HTML/layout
de estas secciones. Auditoría propia encontró que `.step` (Cómo
funciona) ya tenía un buen tratamiento (fondo con gradiente por color,
ícono en chip con su propio degradé), pero `.card__icon` (usado en
"¿Para quién es esto?", las 6 tarjetas de features de Darwin, y las 3
tarjetas de venta de empresa) era solo un emoji suelto de 2rem sin
ningún contenedor — no calzaba con el lenguaje de "ícono en chip
cuadrado con fondo tenue" ya establecido en el hero
(`.hero-stat-icon`) y en el toolbar de `panoramas.html`
(`.pano-toolbar__label-icon`).

- `.card__icon` pasó a chip cuadrado (52px, `border-radius:14px`,
  `background: rgba(245,94,97,.1)`, `display:inline-flex` para que
  respete el `text-align:center` que ya heredan `.cards--6`/
  `.card--feature` sin necesitar `margin:auto` extra).
- **`.card--inv .card__icon`** (la variante de fondo oscuro usada en
  `.section--business`, las 3 tarjetas "Más reservas.../Comisión
  solo.../Panel de gestión...") necesitó un override: el mismo tinte
  coral tenue (`rgba(245,94,97,.1)`) sería casi invisible sobre el fondo
  navy oscuro de esa sección — se usa `rgba(255,255,255,.12)` (tinte
  blanco) en su lugar, para que el chip siga leyéndose como tal en
  cualquiera de los dos fondos.
- Reducido el breakpoint mobile (`.card__icon` a 44px/12px de radio) en
  vez de solo cambiar el `font-size` como antes, ya que ahora es una caja
  con dimensiones fijas, no texto suelto.
- Alcance verificado: `.card`/`.card__icon` solo se usan en `index.html`
  dentro de este repo (`notificaciones-preview.html` no carga
  `css/styles.css`), así que el cambio no tocó ninguna otra página.
- Verificado con Playwright en las 4 secciones que usan `.cards`
  (incluida la oculta en modo viajero, "Más reservas..." solo visible en
  modo empresa) y en mobile (390px): sin overflow horizontal ni errores
  de consola en ninguna combinación.
- **Segunda pasada, a pedido explícito ("con ambos" — FAQ + revisar
  footer/alianzas)**: el `+`/`×` del acordeón de preguntas frecuentes
  (`.faq__question::after`) pasó de un carácter suelto flotando a la
  derecha a un chip circular (26px, mismo tinte coral tenue) que gira a
  "×" al abrir la pregunta — mismo lenguaje de ícono-en-chip ya aplicado
  en el hero y en `.card__icon`. Se amplió el `padding-right` de
  `.faq__question` (28px→38px, 26px→34px en mobile) para darle
  respiración al chip nuevo. Las tarjetas de `#alianzas` (sección
  empresa) ya habían quedado cubiertas por el override
  `.card--inv .card__icon` del commit anterior — no necesitaron cambios
  extra. El footer se revisó y se decidió NO tocarlo: ya es minimalista
  a propósito (fondo sólido navy, links de texto plano con hover de
  opacidad) y agregarle más adornos visuales lo recargaría en vez de
  mejorarlo — criterio de diseño, no un pendiente. Verificado con
  Playwright: acordeón abre/cierra bien, chip gira, sin overflow ni
  errores de consola.
- **Tercera pasada**: `.example` (las 3 tarjetas de cita/testimonio
  dentro de la sección de Darwin — "Pareja/Empresa/Familia") eran las
  únicas que quedaban completamente planas (fondo navy sólido, sin
  sombra, sin hover) mientras `.step`/`.card` ya tenían elevación al
  pasar el mouse. Se agregó `box-shadow: var(--shadow)` +
  `transform: translateY(-6px)` en hover, mismo patrón. Verificado que
  el `transform` computado cambia al hacer hover (Playwright), sin
  overflow ni errores de consola.
- **Cuarta pasada**: la lista de beneficios de Pick Points
  (📍⭐🎁🔥 junto a "Cada panorama que vives, suma") también eran emojis
  sueltos sin chip — mismo fix (`.puntos__list li > span:first-child`
  pasa a chip cuadrado 36px, mismo tinte coral tenue).
- **Bug de claridad real, reportado por el usuario con captura**: el
  widget "Tu progreso" (`.puntos__widget`, decorativo/`aria-hidden`)
  mostraba una barra de progreso y 3 badges sin ninguna explicación de
  qué representaban — "esta parte no se entiende mucho". Se agregó
  `.widget__bar-caption` ("72% para Nivel Aventurero" / "72% de tu meta
  mensual" en modo empresa) debajo de la barra, y
  `.widget__badges-label` ("Insignias recientes" / "Actividad reciente")
  arriba de los 3 badges — mismo criterio de "todo es contenido
  ilustrativo del mockup, no datos reales" que ya aplica al resto de
  este widget (el nivel, el conteo, los badges mismos ya eran
  inventados). Verificado en ambos modos con Playwright: sin overflow ni
  errores de consola.

## Auditoría de reveal-on-scroll + detalles "super pro" (2026-07-22)

Instrucción explícita del usuario ("sigue mejorándola... debe ser
atractivo, elegante y profesional, super pro"). Antes de agregar nada
nuevo, se investigó una captura de página completa que mostraba huecos
vacíos enormes entre secciones y un nav duplicado a mitad de página —
**ambos resultaron ser artefactos de cómo Playwright arma un screenshot
`fullPage` con animaciones de scroll y elementos `position: sticky`**,
NO bugs reales: verificado con scroll real gradual (pasos de 80px) que
las 29 `[data-reveal]` de la página se revelan correctamente en ambos
modos, y que el nav se ve perfecto en una captura de viewport normal. No
se tocó nada por esto — se documenta para que una futura sesión no
vuelva a alarmarse por el mismo artefacto.

Mejoras reales agregadas:
- **Cascada al revelar tarjetas en fila** (`.steps`, `.cards`,
  `.examples__grid`): antes todas las tarjetas de una fila aparecían de
  golpe al cruzar el umbral de scroll casi al mismo tiempo. Se agregó
  `transition-delay` vía `[data-reveal]:nth-child(2..6)` — funciona
  porque cada grid solo tiene hijos del mismo tipo (nunca mezclados con
  otro elemento), así que "2do hijo del grid" siempre es la segunda
  tarjeta real.
- **`::selection`** con el coral de marca en vez del azul default del
  navegador.
- **`:focus-visible`** con anillo coral para navegación por teclado
  (`a`, `button`, `summary` —el toggle del FAQ es un `<summary>`—,
  `input`, `[tabindex]`) — antes no había ningún estilo de foco propio,
  se veía el outline azul/negro default del navegador.
- **Feedback táctil al presionar botones** (`.btn:active { transform:
  scale(0.97); }`), declarado después de los `:hover` para que gane en
  el instante del click sin perder la elevación de `:hover` al soltar.
- Verificado con Playwright: los delays de cascada se aplican
  correctamente (0s/.08s/.16s/.24s/.32s/.4s), el foco por teclado en el
  `<summary>` del FAQ toma el color coral, y el `transform` del botón
  cambia a scale(~0.97) durante el click — sin overflow ni errores de
  consola.
