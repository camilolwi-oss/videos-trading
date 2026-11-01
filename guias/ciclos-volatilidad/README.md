# Ciclos + Volatilidad · indicador Pine Script v6

Este indicador fusiona [`time_cycles.pine`](../time-cycles-indicator/time_cycles.pine) (ciclos de
tiempo de Hurst, según la guía de Mr. Abundance) con
[`volatility_cycle.pine`](../volatilidad-hurst/volatility_cycle.pine) (compresión de volatilidad y
exponente de Hurst).

Hace todos los cálculos de los dos, pero en el gráfico solo dibuja lo necesario para operar.
**Una sola señal, validada con un backtest walk-forward en BTC 2017–2026** (ver
[BACKTEST.md](BACKTEST.md)).

Archivo: [`ciclos_volatilidad.pine`](ciclos_volatilidad.pine)

**Guía paso a paso con imágenes (PDF):** [`Guia-Ciclos-Volatilidad.pdf`](Guia-Ciclos-Volatilidad.pdf). Las imágenes se generan con `guia/figuras.py` y el PDF con `guia/construir_pdf.py`.

---

## Instalación

1. Abre el archivo en bruto:
   `https://raw.githubusercontent.com/camilolwi-oss/videos-trading/claude/friendly-rubin-kszpt5/guias/ciclos-volatilidad/ciclos_volatilidad.pine`
2. Selecciona **todo** el texto y cópialo. Son unas 1 080 líneas: si pegas solo una parte,
   TradingView da el error CE10246.
3. En TradingView, abre el Pine Editor, crea un indicador nuevo, borra el contenido, pégalo y pulsa
   **Añadir al gráfico**.
4. El idioma es **Español** por defecto. Se cambia en *Ajustes → 1 · General → Idioma / Language*.

---

## Cómo se lee: cinco elementos

| En el gráfico | Qué significa |
|---|---|
| 🟪 **Caja morada** | La volatilidad está comprimida: el percentil del ATR es ≤ 5. La caja marca el rango de esa calma. |
| 🟦 **Caja azul** | La volatilidad se liberó (percentil > 20). Se espera, durante 12 velas como máximo, un cierre por encima de la caja. |
| 🔼 **Triángulo verde** | **Señal larga.** La caja se rompió al alza, el precio está sobre la EMA200 y el momentum es ≥ 2/3.<br>Se entra en la apertura de la vela siguiente, con el stop en el mínimo de la caja. |
| 🔴 línea roja · 🟢 línea verde | Solo mientras hay una operación abierta: la roja es el **stop** y la verde, la **EMA de salida** (100). Se sale al cerrar por debajo de la EMA verde. ✖ marca la salida. |
| ▮ **Banda vertical** + etiqueta | Próxima ventana de pivote del **ciclo dominante**. Es **contexto, no filtro**.<br>Gris = falta tiempo · naranja = dentro de la ventana · verde = zona ideal (centro de la ventana). |

Cuando la caja azul se resuelve sin señal cambia de color:
- **verde**: rompió al alza;
- **roja**: rompió a la baja (sin operación; los cortos no dieron ventaja en el backtest);
- **gris**: caducó sin romper.

### El panel (8 filas)

| Fila | Ejemplo |
|---|---|
| 1 · título | `CICLOS + VOLATILIDAD · BTCUSD` |
| 2 · **qué hacer ahora** | `ESPERAR` · `COMPRESIÓN 14 barras · caja …` · `LIBERACIÓN: esperar cierre > …` · `SEÑAL LARGA: entrar en la apertura · stop …` · `EN OPERACIÓN … ahora +1,8R` |
| 3 · filtros | `tendencia (EMA200) ✓ · momentum 2/3 (EMA ✓ ATR ✓ Vol ✗)`. Se pinta en verde si se cumplen. |
| 4 · ciclo (contexto) | Ciclo dominante, aciertos del ciclo (p. ej. `7/9 (78 %)`), fecha del próximo pivote ± ventana y estado.<br>**Pasa el ratón por encima** para ver la estadística de todos los niveles (Madre, N1, N2, N3): longitud, aciertos y próximo pivote. |
| 5 · volatilidad (contexto) | `percentil 37 (normal) · ciclo 46 ↑ · ritmo ≈ 177 velas · pico ~… · valle ~…`.<br>La fase puede ser compresión (≤ 5), normal, expansión (≥ 70) o **AGOTAMIENTO** (≥ 90, en morado). El "ciclo" es la línea de ciclo de volatilidad y el "ritmo", su período dominante con el próximo pico y valle estimados. Si sale "≥", el período llegó al tope de la ventana y es poco fiable. |
| 6 · Hurst | `Hurst 0,58 → persistente (tendencia)`, `reversión a la media (rango)` o `aleatorio` |
| 7 · backtest del gráfico | Operaciones, acierto, R/op, PF, R total y peor racha en el símbolo y la temporalidad abiertos. Usa las mismas reglas que el backtest en Python. |
| 8 · referencia | El resultado del walk-forward en BTC 4h, para comparar |

---

## Qué se tomó de cada indicador

| De `volatility_cycle.pine` | De `time_cycles.pine` |
|---|---|
| **Señal**: compresión → liberación → ruptura de la caja | **Filtro de momentum** (checklist de la guía): EMA20/50 apiladas y separándose · ATR subiendo · volumen creciente |
| Percentil del ATR(14) en 100 velas, con los umbrales 5 y 20 | **Motor de ciclos completo**: anclas automáticas por prominencia, fusión de mínimos dobles, subdivisión 2/3/5, validación de pivotes y ciclo dominante. Se muestra como contexto. |
| **Línea de ciclo de volatilidad** (SMA90 del percentil del ATR28), **agotamiento** (≥ 90) y **período dominante** de esa línea (autocorrelación + senoide). Están en el panel, sin dibujar. | **Estadística de pivotes por nivel**, en el tooltip de la fila de ciclo |
| Exponente de Hurst (R/S), como lectura de régimen | Ventanas ±%, base de tiempo calendario o por barras, y textos en español e inglés |
| Backtest en el gráfico y alertas | Panel de lectura simple, en la línea del modo "Simple" |

Del backtest salen tres cambios sobre los originales:
- **Precio > EMA200** como filtro de tendencia;
- **salida por cierre bajo la EMA100**, en lugar de objetivos fijos;
- **solo largos**.

Lo que **no** entró como regla, porque no aguantó fuera de muestra:
- las señales de ciclos (rotura de la línea bajista y cruce de la VTL);
- los filtros de fase o ventana del ciclo;
- Hurst > 0,5 como filtro;
- las salidas por ciclo o por pico de volatilidad.

Las cifras están en [BACKTEST.md](BACKTEST.md).

---

## Resultado de referencia (BTC 4h, walk-forward, con costes)

| Periodo | Ops | Acierto | R/op | PF | Peor racha |
|---|---|---|---|---|---|
| En muestra 2017–2021 | 29 | 62 % | +2,25 | 10,4 | −2,4R |
| Fuera de muestra 2022–2026 | 23 | 43 % | +1,71 | 5,6 | −3,8R |
| Total | 52 | 54 % | +2,01 | 7,7 | −3,8R |

Advertencias:
- Una sola operación (enero de 2023, +21R) pesa mucho; sin ella, la media fuera de muestra es
  ≈ +0,83R.
- Comprar y mantener BTC ganó bastante más en el periodo. El valor del sistema está en controlar el
  riesgo: máx. DD del 3,7 % arriesgando el 1 % por operación.
- **No es garantía de resultados futuros.**

---

## Temporalidades y activos

- **Validado: BTC 4h.** Ahí se hizo el walk-forward.
- **1D:** la compresión ≤ 5 casi no aparece, así que hay muy pocas señales. Si quieres más, sube
  *Compresión: percentil ≤* a 8. En la rejilla de sensibilidad, con 4h, todas las combinaciones
  probadas fueron positivas.
- **Otros activos y temporalidades** (5m … 2M): el panel "Backtest de este gráfico" aplica las
  mismas reglas al gráfico abierto. Úsalo como primer filtro, sabiendo que no es un walk-forward.
- El **volumen** forma parte del momentum. En símbolos sin volumen (algunos índices o forex) ese
  punto nunca se cumple, así que hay que tener los otros dos. Otra opción es bajar *Momentum mínimo*
  a 1.

---

## Ajustes

| Grupo | Lo importante |
|---|---|
| 1 · General | Idioma, panel y su posición, mostrar la EMA200 |
| 2 · Señal (validada) | ATR 14, percentil 100, compresión ≤ 5, liberación > 20, 12 velas para romper, EMA de tendencia 200, momentum mínimo 2, EMA de salida 100, salida por tiempo a las 180 velas, riesgo mínimo 0,5 ATR, comisión 0,1 % (solo para el backtest del gráfico) |
| 3 · Ciclos de tiempo | Igual que en `time_cycles.pine`: barras del motor (5 000), ventana ±10 %, fuerza de pivote, candidatos, fusión de mínimos dobles, ciclo madre mínimo y relaciones Madre→N1→N2→N3 (Auto/2/3/5) |
| 4 · Ciclo de volatilidad y Hurst | ATR del ciclo (28), longitud del ciclo (90), umbral de agotamiento (90), ventana del período dominante (400 velas); Hurst: ventana R/S de 100, media de 10 y barras calculadas (500) |
| 5 · Alertas | Entrada, salida, compresión/liberación, entrada en la ventana del ciclo y, desactivada por defecto, agotamiento / ciclo de volatilidad cruza 50 |

## Alertas

- **Con textos en el idioma elegido** (recomendado): *Crear alerta → Ciclos+Vol → "Cualquier llamada
  a la función alert()"*. Envía mensajes como `BTCUSD · SEÑAL LARGA: entrar en la apertura · stop
  61246 · salida: cierre < EMA100`.
- **Fijas**: *Señal larga*, *Salida*, *Liberación*, *Compresión* y *Agotamiento*, para quien
  prefiere elegir una sola.

---

## Notas técnicas

- **La señal, el stop y la salida no repintan.** Se calculan vela a vela con datos cerrados.
- **El motor de ciclos corre en la última vela** sobre las últimas 5 000 velas, como en
  `time_cycles.pine`. La banda y la etiqueta del ciclo pueden moverse cuando aparecen pivotes
  nuevos; por eso no forman parte de la señal.
- El exponente de Hurst se calcula solo en las últimas 500 velas para ahorrar tiempo de ejecución.
- El período dominante del ciclo de volatilidad se recalcula en la última vela con las últimas 400
  velas de la línea. Es una estimación (igual que la proyección de `volatility_cycle.pine`), no una
  predicción. En el backtest, usar esa línea como filtro no mejoró la señal.
- Si TradingView muestra un error de compilación, envía una captura con el mensaje y lo corrijo. El
  código se revisó con un parser de Pine v6, pero no se compiló dentro de TradingView.
