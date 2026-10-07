# videos-trading

Videos educativos de trading en motion graphics, hechos con [Remotion](https://www.remotion.dev/).

## Estructuras de mercado

Explica, en ~3 minutos (1920×1080, 30 fps), el contenido del PDF *Estructuras de mercado* de Bull Army:

| # | Escena | Qué muestra |
|---|--------|-------------|
| 1 | `intro` | Portada |
| 2 | `presion` | Compradores vs. vendedores: la presión mueve el precio (sube, baja, rota) |
| 3 | `lectura` | "El gráfico no imprime velas, muestra presión" + las 3 preguntas de lectura |
| 4 | `precio` | Qué es el precio: cada transacción deja un print en el gráfico |
| 5 | `movimiento` | Sentimiento neto de los traders → Orderflow → Movimiento del precio (causa / efecto) |
| 6 | `definicion` | Qué es una estructura de mercado |
| 7 | `causa-efecto` | Causa y efecto sobre un gráfico de velas: mínimos defendidos, barrida, expansión, rechazo de valor |
| 8 | `tres-estados` | Los 3 estados: rango, tendencia, transición |
| 9 | `rango` | Rango (balance): qué ves, qué significa, implicancia |
| 10 | `tendencia` | Tendencia (desequilibrio): HH / HL |
| 11 | `transicion` | Transición (cambio): balance ↔ desequilibrio, ruptura fallida |
| 12 | `tiempo` | El tiempo importa: rápido, lento, tiempo en la zona |
| 13 | `ideas-clave` | Las 6 ideas clave |
| 14 | `outro` | Cierre |

## Uso

```bash
npm install
npm run dev        # abre Remotion Studio para previsualizar y editar
npm run render     # renderiza out/estructuras-de-mercado.mp4
```

Cada escena también está registrada como composición propia (carpeta *Escenas* en el Studio, IDs `escena-<nombre>`), para previsualizarla o renderizarla por separado:

```bash
npx remotion render escena-rango out/rango.mp4
```

## Estructura

- `src/Video.tsx` — orden y duración de las escenas (en frames) y transiciones.
- `src/scenes/` — una escena por archivo.
- `src/components/CandleChart.tsx` — gráfico de velas SVG que se dibuja vela por vela.
- `src/components/annotations.tsx` — marcadores, etiquetas, flechas y líneas animadas para el gráfico.
- `src/candles.ts` — genera velas deterministas a partir de puntos ancla `[índice, precio]`, así los máximos y mínimos caen donde se anotan.
- `src/theme.ts` — colores y tipografías (negro + dorado, como el PDF).

Fuente: Inter (SIL Open Font License, ver `public/fonts/OFL.txt`).

## Reels verticales (Instagram)

Serie de 10 reels en 1080×1920 con la voz grabada. Cada reel vive en `src/reels/reelNN/` y su audio en `public/audio/reel-NN.m4a`.

- `src/reels/ReelFrame.tsx` — layout vertical con zonas seguras (título fijo 220–520 px, visual 540–1260 px, subtítulos 1280–1480 px, sin texto en los 120 px de la derecha).
- `src/reels/Subtitles.tsx` — subtítulos por frase; las palabras entre `*asteriscos*` salen en dorado. Para corregir un subtítulo, editá el array `pages` del reel.

```bash
npx remotion render Reel01 out/reels/reel-01.mp4
npx remotion still Reel01-portada out/reels/reel-01-portada.png
```

## Indicador Wyckoff (Pine Script + Vela/PineTS)

`indicadores/wyckoff/` contiene **Wyckoff Estructuras [Villahermosa]**, un indicador Pine v6 que detecta acumulaciones, distribuciones, reacumulaciones y redistribuciones con sus fases A–E y eventos (SC, AR, ST, Spring, UTAD, SOS/JAC, LPS/LPSY…). Corre en TradingView y en [Vela](https://github.com/LuxAlgo/vela) de LuxAlgo vía [PineTS](https://github.com/LuxAlgo/PineTS). Ver su [README](indicadores/wyckoff/README.md).

La base de conocimiento usada para diseñarlo es la skill `.claude/skills/villahermosa-wyckoff/`, generada con [book-to-skill](https://github.com/virgiliojr94/book-to-skill) a partir de *La Metodología Wyckoff en profundidad* (Rubén Villahermosa).
