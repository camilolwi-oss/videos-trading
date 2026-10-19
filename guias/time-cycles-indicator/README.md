# Indicador "Ciclos de Tiempo · Time Cycles" (Pine Script v6)

Indicador visual con alertas para TradingView, basado en *Beginner's Guide to Time Cycles* (Mr. Abundance).
El resumen de la guía y las decisiones de diseño están en [`ANALISIS-PDF-Y-DISENO.md`](ANALISIS-PDF-Y-DISENO.md).

- Código: [`time_cycles.pine`](time_cycles.pine)
- Instalación: TradingView → *Pine Editor* → pegar el archivo completo → *Add to chart*.
- Recomendado: poner el gráfico en **escala logarítmica** (como pide la guía) y dejar `Escala logarítmica` activada en el indicador.

---

## Idioma

`1 · General → Idioma / Language` cambia **etiquetas del gráfico, tabla, tooltips y alertas** entre español (por defecto) e inglés.

> Limitación de Pine Script: los títulos de los *inputs* son texto fijo y no pueden cambiar según otro ajuste. Por eso cada ajuste está rotulado en los dos idiomas (`Ventana válida ±% / Valid window ±%`).

---

## Qué hace el motor (y qué regla de la guía aplica)

| Paso | Qué hace | Regla de la guía |
|---|---|---|
| 1. Mínimos mayores | Detecta mínimos de swing y los ordena por **prominencia** (cuánto cayó el precio para llegar y cuánto subió después). | "Marcar los mínimos significativos (HTF)". |
| 2. Mínimos dobles | Si dos mínimos mayores están casi al mismo precio y cerca en el tiempo, usa el **punto medio**. | Ejemplo ETH (p. 118). |
| 3. Anclas + subdivisión | Prueba cada par de mínimos como ciclo madre y subdivide **÷2, ÷3 (o ÷5) → ÷2 / ÷3**. Elige la combinación con más aciertos. Prefiere ÷2, luego ÷3; ÷5 solo si es claramente mejor. | "Madre ÷2 ÷2 vs ÷3 ÷2 → proyectar solo la más alineada"; 5 es raro (RIVN). |
| 4. Validación | Cada pivote proyectado se valida con la ventana ±%: **válido** (±10 %), **continuación** (mínimo más alto en ±5 %), **límite** (±15 %) o **inválido**. | Principio de variación, diana 5/10/15 %, p. 114. |
| 5. Ciclo dominante | El grado con mejor tasa de acierto (con ≥3 pruebas) se marca **◆ dominante**. | "Dominant rhythm" — más impactos directos. |
| 6. Redibujar | 2 pivotes inválidos seguidos → aviso **REDIBUJAR** + **pivote fantasma** desde el último mínimo real. | p. 115. |
| 7. Ajuste de fase | Si el último pivote del nivel superior llegó antes/después, dibuja **N2/N3 desplazados** (punteados) sin borrar los originales. | Ejemplo XMR, analogía del tren. |
| 8. Ciclos de Hurst | Tras un **mínimo extremo** reciente (≤ 20W), proyecta 5D/10D/20D/40D/80D/20W desde ese mínimo. | "Tras crash o impulso fuerte, sesgo a ciclos comunes hasta 20W". |
| 9. VTL | Línea entre los dos últimos **mínimos consecutivos válidos** del mismo grado. Cruce por debajo = techo confirmado (corto). Ruptura al alza de la línea bajista **dentro de la ventana** = largo. Objetivos 1:1, 1.618, 2.272. | p. 37–42. |
| 10. Estadística | Sobre los pivotes válidos históricos: expansión mínima / del 90 % / mediana, día típico del techo y retroceso típico. Proyecta TP1/TP2/TP3, la zona temporal del techo y la línea de retroceso. | Ejemplo DOGE 29D (+8 % / +20 %, techo día 6–8, 0.382). |
| 11. Momentum 0–5 | Base ≥ 3 meses · estructura saliendo del rango · EMA 20/50 apiladas y separándose **+** ATR subiendo · ratio en demanda/ventana · volumen creciente. | Checklist p. 53. |
| 12. Ratio | Corre **el mismo motor** sobre un ratio (`Activo ÷ Símbolo`, `Símbolo ÷ Activo` o fórmula libre) y marca su próximo pivote **R**. | Bonus de ratios. |

---

## Cómo leer el gráfico

| Elemento | Significado |
|---|---|
| Arcos gris / dorado / marrón / gris claro | Madre, N1, N2, N3 (los colores de la guía). |
| Líneas punteadas verticales | Pivotes ideales (más marcadas en el nivel de trading ★). |
| Etiqueta `N2 22/08/2026` | Próximo pivote de cada grado (tooltip = ventana). |
| Franja al pie del arco | Ventana ±% del próximo pivote; más intensa si está **activa**. |
| Diana (3 bandas verticales) | Ventanas ±15 / ±10 / ±5 % del próximo pivote del nivel de trading. |
| ● verde / azul / naranja | Pivote válido / continuación / límite ±15 % (tooltip con desvío en días). |
| ✗ rojo | Pivote inválido. |
| Línea violeta discontinua "Fantasma" | Pivote propuesto tras 2 fallos seguidos. |
| Arcos punteados | Ciclos N2/N3 desplazados por el desfase del nivel superior. |
| Líneas violetas `H·80D` | Ciclos comunes de Hurst desde el último mínimo extremo. |
| Línea roja "VTL" | VTL alcista: cruce por debajo = corto. |
| Línea verde discontinua "Bajista" | Línea bajista del ciclo: ruptura dentro de la ventana = largo. |
| ▲ / ▼ | Señales largo / corto (tooltip con entrada, SL y TP 1:1). |
| Líneas TP 1:1 / 1.618 / 2.272 + SL | Niveles de la última señal. |
| Líneas verdes punteadas TP1/TP2/TP3 | Objetivos estadísticos desde la base del ciclo actual (con cuántos pivotes los alcanzaron). |
| Caja verde "Techo típico" | Zona temporal (percentil 25–75) donde suele formarse el techo local. |
| Línea azul "Retroceso típico" | Retroceso medio tras el techo (en la guía ≈ 0.382). |
| Marca violeta `R N2` abajo | Próximo pivote del ratio. |

### Tabla

- Anclas usadas y subdivisión elegida.
- Por grado:
  - longitud en días y barras;
  - ciclo de Hurst equivalente (≈80D, ≈20W…);
  - aciertos x/y y %;
  - próximo pivote ± ventana;
  - estado (`EN VENTANA`, `faltan Nd`, `⚠ redibujar`).
- ★ nivel de trading · ◆ dominante · calidad: válido ≥ objetivo (80 %), aceptable ≥ 60 %, débil (la guía: "no forzar, cambiar de activo/TF").
- Sincronía actual, Hurst, momentum x/5 con cada punto, ratio y traslación (techo temprano/simétrico/tardío).
- Estadística de pivotes, ciclo actual (expansión y fuerza), última señal y avisos.

---

## Alertas

Para crear la alerta: botón *Crear alerta* → condición **Ciclos de Tiempo** → **"Cualquier llamada a la función alert()"**. Los mensajes llegan en el idioma elegido. Cada tipo se activa o desactiva en `11 · Alertas`.

También hay condiciones individuales (con texto fijo bilingüe), por si se quiere una alerta por evento:

| Alerta | Cuándo se dispara (al cierre de vela) |
|---|---|
| Ventana de pivote | El precio entra en la ventana ±% del próximo pivote del nivel de trading. |
| Fecha ideal | Se alcanza la fecha ideal del pivote. |
| Ciclo invalidado / Redibujar | Termina la ventana sin mínimo válido / segundo fallo seguido. |
| Señal largo / corto | Ruptura de línea bajista en ventana / cruce bajo la VTL. |
| Momentum en pivote | El puntaje sube a ≥ el umbral cerca del pivote. |
| Sincronía | 2+ grados (o Hurst / ratio) con ventana activa a la vez. |
| Objetivo estadístico | El precio alcanza TP1/TP2/TP3 estadístico. |
| Ratio en ventana | El ratio entra en la ventana de su pivote. |

---

## Ajustes sugeridos por temporalidad

| TF | Barras analizadas | Notas |
|---|---|---|
| 5m · 30m | 5000–10000 | Ciclos intradía. La guía considera poco fiables los ciclos < 5D (la tabla lo avisa). Úselos como timing fino dentro del ciclo del 4h/1D. |
| 1h · 4h · 6h | 5000 | Buen equilibrio (el ejemplo DOGE 29D de la guía está en 4h). |
| 1D | 5000 (o toda la historia) | Ciclos 20D–20W: los más repetibles según la guía. |
| 3D · 1W | Toda la historia | Ciclos de 9M–54M. |
| 1M · 2M | Toda la historia | Pocas barras: deje `Longitud mínima de ciclo` en 3–4 y `Fuerza de pivote` en 0 (auto). |

`Base de tiempo = Auto`: calendario en cripto y en TF diario o mayor; barras en intradía de acciones/FX (sus sesiones dejan huecos).

---

## Notas importantes

- **Repintado del historial.** Las anclas automáticas se eligen con toda la historia visible. Las marcas ●/✗ y las señales ▲/▼ antiguas son, por tanto, una **lectura retrospectiva** del ritmo, no señales que existieron en vivo. Las **alertas** sí son en tiempo real y al cierre de vela. Si llega un mínimo nuevo y más prominente, el par de anclas puede cambiar (equivale al "redibujar" de la guía).
- Los ciclos dan el **cuándo**; el precio da el **dónde**. La guía pide confirmar con estructura (Wyckoff, SFP, BOS, Fibonacci), que el indicador no detecta automáticamente.
- Si la tabla marca el nivel como **débil**, la guía recomienda no forzar: bajar de TF o cambiar de activo.
- Validación hecha:
  - el código pasa el analizador sintáctico de Pine (`pynescript`);
  - la lógica del motor se verificó con series sintéticas de ciclos conocidos (recupera 640/320/160 y 600/200/100);
  - **falta la compilación y la prueba en TradingView.**
