# Indicador "Ciclo de Volatilidad · Volatility Cycle" (Pine Script v6)

Versión propia y documentada del oscilador "volamonk", construida a partir del análisis de las capturas. Cómo se dedujo cada componente y el backtest sobre las imágenes están en [`ANALISIS-Y-BACKTEST.md`](ANALISIS-Y-BACKTEST.md).

- Código: [`volatility_cycle.pine`](volatility_cycle.pine)
- Instalación: TradingView → *Pine Editor* → pegar el archivo → *Add to chart*. Se abre en un panel propio; las cajas y las flechas de ruptura se dibujan sobre el precio.
- Idioma: `1 · General → Idioma / Language` (español por defecto). Los títulos de los ajustes van en los dos idiomas porque Pine no permite cambiarlos según otro ajuste.

---

## Qué muestra

| Elemento | Qué es | Cómo leerlo |
|---|---|---|
| **Línea irregular** | Percentil (0–100) del ATR actual dentro de las últimas 100 barras | 0 = volatilidad mínima de la ventana, 100 = máxima. Gris → teal (≥ 70) → violeta (≥ 90). |
| **Línea de ciclo** (gris gruesa) | Percentil de un ATR más largo (28), suavizado (90) | El "ritmo" lento de la volatilidad. Sobre 50 = fase de expansión, bajo 50 = fase de calma. |
| **Bandas violetas** | Compresión: percentil ≤ 5 | Energía acumulándose. Prepararse, no operar todavía. |
| **Bandas azules** | Compresión con el ATR ya subiendo | La compresión empieza a soltarse. |
| **▲ azul abajo** | Liberación: tras una compresión, el percentil supera 20 | Se espera más rango que lo normal (ver backtest). |
| **Caja violeta en el precio** | Máximo/mínimo durante la compresión | El nivel a romper. |
| **▲ / ▼ en el precio** | Primer cierre fuera de la caja tras la liberación | Dirección de la ruptura. Stop al otro lado de la caja. |
| **◆ violeta arriba** | Agotamiento: el percentil cruza 90 | Volatilidad en máximos. No perseguir: suele enfriarse. |
| **○ / ✕ naranja en 50** | La línea de ciclo cruza 50 al alza / a la baja | Cambio de fase del ciclo (son tus círculos). |
| **Línea dorada punteada** | Proyección del ciclo dominante | Período detectado por autocorrelación y una senoide ajustada a las 2 últimas vueltas. Es una estimación, no una predicción. |

### Preset de la línea de ciclo

- **Compatible** (por defecto): SMA(90) del percentil de ATR(28). Reproduce la captura de 4h con r = 0,91, pero tiene mucho retraso (~45 barras).
- **Rápida**: SuperSmoother de Ehlers con la misma longitud. Misma forma, bastante menos retraso.

### Exponente de Hurst

H por rango reescalado (R/S) sobre 100 retornos, más su media de 10 lecturas (como la tabla original). Lectura:

- **H > 0,55**: persistente; las rupturas tienden a continuar.
- **H < 0,45**: reversión a la media; favorece operar rangos.
- **~0,5**: aleatorio.

Es el exponente de H.E. Hurst, **distinto** de los ciclos de J.M. Hurst. Solo se calcula en las últimas 500 barras, porque es costoso.

---

## Tabla

| Fila | Contenido |
|---|---|
| Cabecera | Activo y percentil actual |
| Estado | COMPRESIÓN (n barras) · SALIENDO · LIBERACIÓN (esperando ruptura) · EXPANSIÓN · AGOTAMIENTO · NORMAL |
| Qué hacer | Niveles concretos de la caja, ruptura activa con su stop, o "no perseguir". Añade el sesgo del Hurst. |
| Ciclo | Valor, dirección, sobre/bajo 50, período dominante (barras y días), próximo pico y valle proyectados |
| Hurst | H actual, su media y el régimen |
| Backtest | Por evento (liberación, cruce ↑, pico): cuántos hubo y en qué % el rango de las H barras siguientes superó la mediana del gráfico |
| Ruptura | Operaciones de la regla de ruptura tras liberación: acierto con 1R y resultado total con 1R y 2R |

**El backtest se calcula sobre todo el historial cargado del gráfico**, así que cambia con el activo y la temporalidad. Úsalo para decidir en qué mercados el indicador funciona: si "% > mediana" ronda el 50 %, ahí no aporta.

---

## Alertas

Crear alerta → condición **Ciclo de Volatilidad** → **"Cualquier llamada a la función alert()"**. Los mensajes llegan en el idioma elegido. Cada tipo se activa en `6 · Alertas`:

| Alerta | Cuándo (al cierre de vela) |
|---|---|
| Inicio de compresión | El percentil cae al umbral de compresión |
| Liberación | Sale de la compresión; el mensaje incluye la caja |
| Ruptura alcista / bajista | Primer cierre fuera de la caja |
| Agotamiento | El percentil cruza 90 |
| Ciclo cruza 50 | Cambio de fase del ciclo |

---

## Cómo combinarlo con el indicador de Time Cycles

1. **Time Cycles** dice *cuándo* se espera el pivote (franja verde o ámbar).
2. **Ciclo de Volatilidad** dice si hay energía acumulada (compresión) y cuándo se suelta (liberación).
3. **Entrada**: pivote en ventana + liberación + ruptura de la caja en la dirección de la estructura. Es lo mismo que pide el checklist de momentum de la guía: "base + ATR girando al alza".

## Limitaciones

- Mide volatilidad, no dirección.
- La línea de ciclo "Compatible" tiene mucho retraso; la proyección es una senoide ajustada, válida solo mientras el ritmo se mantenga.
- El backtest de las capturas es indicativo (muestra mínima). El de la tabla es el que vale para decidir, y aun así no incluye comisiones.
- No lo he podido compilar en TradingView desde aquí. Pasa el analizador sintáctico de Pine; si aparece un error al compilar, mándame la captura.
