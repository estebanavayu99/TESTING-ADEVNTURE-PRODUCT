# PickMap — app Flutter (viajero)

App nativa (Android/iOS, no PWA) para el lado viajero de PickMap — misma
marca e identidad visual que el sitio web (`css/styles.css`), mismo backend
real de Supabase (`supabase/schema.sql`: tablas `profiles`/
`darwin_preferences`, mismo proyecto que usa `js/auth.js`).

## Alcance de esta primera etapa

Solo viajero: auth (login/signup/verificación por correo/recuperar
contraseña), onboarding, Explorar panoramas, Favoritos, Pick Points, Invita
a un amig@, Mi cuenta. El panel de negocio (`negocio-*.html`) queda fuera
de esta etapa.

- **Auth real**: `lib/features/auth/` habla directo con Supabase Auth
  (mismo proyecto que el sitio, URL/anon key en
  `lib/core/supabase/supabase_config.dart`). Requiere agregar el deep link
  `pickmap://login-callback` a Authentication → URL Configuration →
  Redirect URLs en el dashboard de Supabase (ver comentario en ese
  archivo) para que la confirmación de correo y el reset de contraseña
  abran la app correctamente.
- **Catálogo de panoramas**: `lib/features/panoramas/data/sample_catalog.dart`
  es data de muestra (mismo copy que `js/panoramas.js`) mientras no se
  porta el motor de recomendación (`bot-darwin/js/motor.js`) ni se conecta
  la tabla `businesses` real — ver el comentario en `panorama_item.dart`.
  Favoritos/Pick Points/Invita también usan datos de muestra por el mismo
  motivo (no hay todavía ledger de puntos ni favoritos reales conectados).

## Estructura

```
lib/
  core/
    theme/       paleta + ThemeData (fiel a css/styles.css)
    supabase/    bootstrap + config del cliente único
    router/      go_router con redirect por estado de auth/onboarding
    widgets/     componentes compartidos (PmCard, PmChipGroup, etc.)
  features/
    auth/        login, signup, verificación, recuperar contraseña
    onboarding/  formulario de preferencias (mirror de onboarding.html)
    home/        shell con navegación inferior (5 tabs)
    dashboard/   "Mi cuenta"
    panoramas/   "Explorar"
    favoritos/, pickpoints/, invita/
```

## Correr el proyecto

```
flutter pub get
flutter run                # Android/iOS conectado
flutter run -d chrome       # verificación visual rápida en el navegador
```

No hay salida a internet dentro del sandbox de desarrollo de esta sesión,
así que la verificación visual se hizo con `flutter build web` +
Playwright/Chromium local — mismo patrón que usa el sitio web (ver
CLAUDE.md, sección "Verificación visual"), sustituyendo temporalmente la
tipografía (Fredoka/Nunito Sans requieren red vía `google_fonts`) por una
fuente local durante la verificación, revertido antes de terminar.
