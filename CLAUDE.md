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

## Gotchas conocidos

- **CSS `[hidden]` vs. cascada de autor**: cualquier componente nuevo que
  use el atributo `hidden` para mostrar/ocultar necesita explícitamente
  `.mi-componente[hidden] { display: none; }` en el CSS, porque reglas de
  autor con `display:` pueden ganarle a `[hidden]` en la cascada. Ya pasó
  varias veces en este repo — escribirlo desde el principio en componentes
  nuevos (chat de Beto, menú de usuario, modales, etc.).
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

## Verificación visual

- El sandbox no tiene salida directa a internet (ni pickmap.cl ni
  google.com son alcanzables), así que toda verificación visual es local:
  `python3 -m http.server 8811` en background + Playwright con
  `executablePath: '/opt/pw-browsers/chromium'`, screenshots a la carpeta
  scratchpad.
- Para producción real, confiar en las capturas que manda el usuario.
- El FAB de Beto tiene una animación de rebote continua (`betoFabBounce`),
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

## Instrucción permanente del usuario: código blindado + todo registrado

- **Blindar el código**: antes de dar por hecho un cambio, verificarlo
  (Playwright local cuando aplica) y no dejar código a medio hacer. Evitar
  regresiones: si se toca una función/CSS compartida, revisar qué otras
  páginas la usan (grep) antes de modificarla o borrarla.
- **Registrar todo**: cada sesión que agregue una convención nueva, un
  gotcha nuevo, o cambie el flujo de trabajo, debe reflejarlo en este
  archivo (`CLAUDE.md`) como parte del mismo commit, no como tarea aparte.
  Este archivo es la memoria persistente del proyecto entre sesiones.
