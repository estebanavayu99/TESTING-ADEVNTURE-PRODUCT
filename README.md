# Funly — Sitio web

Propuesta de landing page para **Funly**, la plataforma que arma panoramas personalizados según clima, edad, gustos y grupo. "Déjanos organizarlo por ti."

Sitio estático (HTML/CSS/JS puro, sin dependencias ni build). Para verlo localmente:

```bash
python3 -m http.server 8000
```

y abrir `http://localhost:8000`.

## Estructura

- `index.html` — contenido y secciones
- `css/styles.css` — estilos, fondo animado (cielo, sol, montañas parallax, pájaros) y layout responsive
- `js/main.js` — toggle "Soy viajero / Soy empresa", menú móvil, animaciones al hacer scroll

## Secciones

1. **Hero** con fondo animado (sol en movimiento, montañas en parallax, pájaros y nubes) y mockup de la app
2. **Cómo funciona** (4 pasos)
3. **Para quién** — segmentos: parejas, familias, amigos/jóvenes, empresas + ejemplos reales
4. **Sistema de puntos** — gamificación y canje
5. **Funciones** — clima, ofertas del día, alianzas, transporte, mapas, Funly IA
6. **Alianzas** (`#alianzas`) — sección orientada a empresas/aliados con marquee de rubros y modelo de comisión
7. **CTA final** y **footer**

Un botón en el header ("Soy viajero" / "Soy empresa") cambia el copy del hero y los CTAs según la audiencia.
