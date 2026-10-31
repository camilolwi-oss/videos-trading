# Análisis del indicador "volamonk" y backtest desde las capturas

Fuente: dos capturas de TradingView de BTCUSDT.P (Binance), una en 4h (6 ago → 30 oct 2026) y otra en 30m (26 ago → 12 sep 2026). Cada una tiene en el panel inferior el oscilador "volamonk" y una tabla "Hurst Exponent / Hurst (10) roll".

Como no tenemos el código del indicador ni los datos, **digitalizamos las imágenes píxel a píxel** y trabajamos sobre esos datos. Las herramientas están en [`backtest-imagen/`](backtest-imagen/) y son reproducibles.

---

## 1. Qué se extrajo de las imágenes

| | 4h | 30m |
|---|---|---|
| Barras digitalizadas | 516 | 825 |
| Precio (máx/mín por vela) | 62.477 – 87.313 | 76.147 – 82.267 |
| Error aproximado del precio | ±45 USD (1 px) | ±11 USD (1 px) |
| Error aproximado del oscilador | ±1,1 unidades (1 px) | ±1,1 unidades (1 px) |

Cómo se separó cada elemento:

- **Escala del oscilador.** Las marcas del eje (0,0 en y853, 80,0 en y782) y la línea naranja de 50 (y808,5) dan 0,8875 px por unidad. Se validó con las etiquetas finales del 30m: 30,6 / 27,6 medidos frente a 30,5 / 28,0 en la etiqueta.
- **Las dos líneas.** La suave (gris claro, 2 px) se siguió con un camino global de mínima curvatura (programación dinámica); la irregular es el resto. Se verificó superponiendo lo extraído sobre la captura.
- **Bandas.** Violeta ≈ RGB(84,27,95) y azul ≈ RGB(27,80,125), a toda la altura del panel.
- **Velas.** Píxeles grises/blancos (canal mínimo ≥ 82). Se quitaron las líneas horizontales largas (medición, cVAH/cVAL) y el perfil de volumen, que es más tenue.
- **Anotaciones amarillas.** Componentes conectados. Se usaron como "giros marcados por el usuario".

---

## 2. Qué es (ingeniería inversa)

### Línea irregular = percentil de la volatilidad (ATR), 0–100

Es el hallazgo más sólido. La mejor fórmula probada fue `percentrank(ATR, 100)`: r = 0,75 en 30m y r ≈ 0,53 en 4h (con ventana de 50, porque hay menos barras). Las alternativas probadas fueron estocástico de ATR, ancho de Bollinger, volatilidad histórica y rango.

El comportamiento visual lo confirma:

- **Mesetas en 0** (las bandas): el ATR actual es el más bajo de la ventana y sigue bajando. Es una compresión.
- **Mesetas en ~100**: el ATR es el más alto de la ventana y sigue subiendo. Es una expansión.
- **Saltos verticales**: una vela grande cambia de golpe la posición del ATR dentro de la ventana.

El color del trazo depende del nivel: gris abajo, teal/azul hacia 70–85, violeta en el máximo.

### Bandas = compresión

Dentro de las bandas la línea irregular vale 0–8 (mediana 0–0,6). No hay un criterio limpio entre violeta y azul. El azul aparece sobre todo **al final** de una racha violeta (`PPPP…BB`), con la volatilidad algo más al alza (53 % frente a 41 % de las barras), así que se interpreta como "compresión que empieza a soltarse".

### Línea suave = ciclo lento de la volatilidad (identificada solo en 4h)

| Gráfico | Mejor reproducción | r |
|---|---|---|
| 4h | **SMA(90) del percentil de ATR(28) en 100 barras** | **0,91** |
| 4h | misma idea con SMA(60) desplazada 20 barras | 0,93 |
| 30m | ninguna fórmula simple de volatilidad (máx. 0,25); la mejor relación es *inversa* con la posición del precio (z-score 20–50, retrasado 40 barras) | −0,66 |

**Conclusión:** en 4h la línea suave es un promedio largo (y con mucho retraso) del percentil de volatilidad. En 30m no se pudo identificar: puede haber otros parámetros por temporalidad, datos de otra temporalidad o una construcción adaptativa.

**No es una media móvil de la línea irregular** (r = 0,17 en 30m).

### "Hurst Exponent" de la tabla

Es el exponente de **H.E. Hurst** (R/S): mide persistencia (> 0,5 tendencia, < 0,5 reversión a la media). **No es lo mismo que los ciclos de J.M. Hurst** de la guía de Time Cycles; comparten el apellido, no el concepto.

Con R/S sobre el precio digitalizado obtenemos 0,58–0,65 (4h) y 0,55–0,62 (30m), frente a 0,472 y 0,775 en la tabla. **No se pudo reproducir**: no se conoce su ventana ni su método, y el precio medio de cada vela es solo una aproximación del cierre.

### Conclusión práctica

El indicador **mide volatilidad, no dirección**. Por eso tus círculos aparecen tanto en suelos (17 ago) como en techos (2 oct, 20 oct): marca *cuándo* hay energía para moverse, no *hacia dónde*.

---

## 3. Backtest sobre los datos digitalizados

Eventos evaluados:

| Código | Evento |
|---|---|
| A | **Liberación**: la irregular sale del suelo (≤ 5) y supera 20 |
| B+ / B− | La suave cruza 50 al alza / a la baja (donde dibujaste los círculos) |
| C+ / C− | La irregular cruza la suave al alza / a la baja |
| D | **Pico**: la irregular llega a ≥ 90 |

Métrica principal: **rango futuro** = (máximo − mínimo de las próximas H barras) / precio. Se compara con la mediana de todas las barras (por definición, una barra cualquiera supera la mediana el 50 % de las veces).

### 4h (6 ago → 30 oct)

Rango futuro mediano de todas las barras: 2,24 % (24 h) · 3,32 % (48 h) · 4,73 % (96 h).

| Evento | n | 24 h: ×mediana · % > mediana | 48 h | 96 h | % sube (48 h) |
|---|---|---|---|---|---|
| A liberación | 6 | 0,85 · 33 % | **1,36 · 83 %** | 1,02 · 50 % | 33 % |
| C+ irregular ↑ suave | 17 | **1,25 · 71 %** | **1,28 · 71 %** | **1,24 · 71 %** | 47 % |
| D pico | 12 | 1,18 · 75 % | 1,14 · 58 % | 1,49 · 67 % | 67 % |
| C− | 17 | 1,13 · 53 % | 0,98 · 47 % | 1,06 · 59 % | 47 % |
| B+ suave ↑ 50 | 3 | 0,83 · 0 % | 0,74 · 33 % | 0,65 · 0 % | 33 % |
| B− suave ↓ 50 | 2 | 0,92 · 50 % | 1,22 · 100 % | 0,98 · 50 % | 50 % |

### 30m (26 ago → 12 sep)

Rango futuro mediano de todas las barras: 0,89 % (4 h) · 1,27 % (8 h) · 2,55 % (24 h).

| Evento | n | 4 h | 8 h | 24 h | % sube (8 h) |
|---|---|---|---|---|---|
| A liberación | 7 | **1,35 · 71 %** | **1,24 · 71 %** | 1,21 · 57 % | 57 % |
| C+ | 35 | **1,31 · 71 %** | 1,34 · 63 % | 1,07 · 54 % | 37 % |
| D pico | 28 | 1,02 · 50 % | 0,96 · 46 % | **0,79 · 29 %** | 43 % |
| C− | 34 | 1,11 · 62 % | 1,27 · 62 % | 1,07 · 55 % | 29 % |
| B+ | 5 | 1,51 · 60 % | 1,06 · 60 % | 0,91 · 40 % | 60 % |
| B− | 6 | 0,86 · 33 % | 0,63 · 40 % | 1,12 · 80 % | 60 % |

### Regla direccional: ruptura de la caja de compresión tras la liberación

Entrada al primer cierre fuera de la caja (máx/mín de la compresión), stop en el lado opuesto, objetivo 1R o 2R, salida por tiempo (12 barras en 4h, 16 en 30m). Si stop y objetivo caen en la misma vela, se cuenta como pérdida (criterio conservador).

| | Operaciones | Acierto 1R | Total 1R | Total 2R |
|---|---|---|---|---|
| 4h | 5 | 60 % | +1,61R | +2,17R |
| 30m | 6 | 50 % | −0,84R | +1,16R |

### Tus giros marcados frente a los eventos

En 4h, los 7 círculos de precio (17 ago, 28 ago, 18 sep, 24 sep, 26 sep, 2 oct, 20 oct) caen a ≤ 6 barras de algún evento, y 4 de ellos a ≤ 2 barras. En 30m, los 3 giros caen a ≤ 3 barras.

**Pero** una barra *al azar* tiene un cruce C a ±5 barras el 40–50 % de las veces, y algún evento el 59–69 %. Los cruces son demasiado frecuentes, así que la coincidencia es en buena parte azar. La evidencia a favor es débil: 57 % a ±2 barras frente al 38 % esperado.

---

## 4. Conclusiones

1. **Sirve como reloj de volatilidad.** Tras una liberación de la compresión (A) o un cruce de la irregular sobre la suave (C+), el rango de las siguientes horas o días fue mayor que lo normal en ~70–83 % de los casos (lo esperable por azar es 50 %), con 1,2–1,4 veces el rango típico.
2. **No da dirección.** El porcentaje de subidas tras cada evento ronda el 50 %. La dirección hay que sacarla de la ruptura de la caja, la estructura o los ciclos de tiempo.
3. **Los picos de volatilidad (D) tienden a enfriarse.** En 30m, 24 h después de un pico, el rango fue menor que lo normal (×0,79, solo 29 % por encima). Es la reversión a la media de la volatilidad: no conviene perseguir el movimiento tras un pico.
4. **Los cruces de la suave con 50 (tus círculos) no mostraron ventaja medible**, aunque con 2–6 casos no se puede concluir nada.
5. **La regla de ruptura salió mixta** (+1,6R / −0,8R con 1R) y con muestras ínfimas.
6. **Encaja con la guía de Time Cycles.** El checklist de momentum pide "base de 3+ meses + ATR girando al alza"; eso es exactamente una compresión seguida de liberación. Los dos indicadores son complementarios: los ciclos dan la ventana de tiempo y la volatilidad confirma que el movimiento arranca.

## 5. Limitaciones (importantes)

- Son datos **leídos de una imagen**: errores de ±1 px. El cierre real se aproxima con el punto medio de cada vela.
- **Muestra mínima**: un activo, dos ventanas (86 días y 17 días) y entre 2 y 35 eventos por tipo. Los eventos se solapan. **Nada de esto es estadísticamente significativo.**
- Sin comisiones ni deslizamiento.
- La línea suave del 30m y la tabla de Hurst no se pudieron reproducir.

**El backtest de verdad es el que trae el indicador propio** ([`volatility_cycle.pine`](volatility_cycle.pine)). Calcula las mismas métricas sobre todo el historial del gráfico, en cualquier activo y temporalidad.

## 6. Reproducir

```bash
cd guias/volatilidad-hurst/backtest-imagen
# 1) digitalizar (requiere las capturas como btc_4h.jpg y btc_30m.jpg en <capturas>)
python3 -I digitize.py <capturas> datos
# 2) ingeniería inversa de las dos líneas
python3 -I reverse.py datos && python3 -I reverse_cyc.py datos
# 3) backtest
python3 -I backtest.py datos
```

Requiere Python 3 con `numpy` y `Pillow`. Los CSV ya digitalizados están en `datos/`, así que los pasos 2 y 3 funcionan sin las capturas.
