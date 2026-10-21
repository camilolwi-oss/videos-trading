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

## Modo de lectura

`1 · General → Modo de lectura / Reading mode`. El gráfico responde tres preguntas: **cuándo** (próxima ventana), **cuánto confío** (aciertos del ritmo) y **qué hago**.

| | **Simple** (por defecto) | **Completo** |
|---|---|---|
| Arcos | Solo el ciclo de trading ★ (grueso) y su ciclo padre (fino) | Los 4 niveles activados |
| Tiempo | Una sola franja en el próximo pivote: **gris** falta tiempo · **ámbar** en ventana · **verde** zona ideal (±5 %) | Diana ±15/10/5 %, franja por nivel y líneas punteadas de cada pivote |
| Aciertos | Solo las ✗ (fallos) del ciclo de trading; el total va en el panel | ● válido / continuación / límite y ✗ según el ajuste *Marcas* |
| Señales | Solo la última ▲/▼ con entrada, SL y TP 1:1 | Historial + TP 1:1, 1.618, 2.272 |
| Estadística | TP1 y TP2 desde la base del ciclo actual | + TP3, zona temporal del techo y retroceso típico |
| Hurst | Solo los ciclos con ventana **activa** | Todos los proyectados desde el mínimo extremo |
| Oculto | "Entra/sale dinero", arcos desplazados, marca del ratio | Todo visible |
| Panel | 6 filas: estado · qué hacer · próximo pivote · confianza · momentum · última señal | Tabla detallada (18 filas) |

### Nombres y colores

- Los ciclos se nombran por **duración** ("80D", "4.5h") en gráfico, panel y alertas. La tabla completa añade el nivel interno entre paréntesis ("80D (N2)").
- Los arcos usan **un solo tono neutro** (grosor distinto por nivel). El color queda reservado para el **estado**: verde = válido / zona ideal, ámbar = atención / en ventana, rojo = fallo, violeta = Hurst. Si prefiere los colores por nivel de la guía (dorado, marrón, gris), active `10 · Visual → Colores por nivel`.

### La fila "Qué hacer"

Se calcula en este orden: ritmo roto (2 fallos seguidos) → señal activa (reciente y sin tocar el SL) → zona ideal → en ventana → saliendo del pivote (con o sin momentum) → fase de salida de dinero (segunda mitad del ciclo) → esperar N días. Es una guía de lectura, no una orden: la guía pide confirmar siempre con estructura y precio.

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
| Arcos (neutros; grueso = ciclo de trading ★, fino = padre) | Los ciclos. En Completo se ven los 4 niveles; con *Colores por nivel* toman los colores de la guía. |
| Franja vertical gris / ámbar / verde | Próximo pivote del ciclo de trading: falta tiempo / en ventana / zona ideal. La línea punteada central es la fecha ideal. |
| Etiqueta `80D · 22/08/26 · faltan 9D` | Próximo pivote del ciclo de trading con su estado (tooltip = ventana completa). |
| Líneas punteadas verticales (Completo) | Pivotes ideales de cada nivel. |
| Franja al pie del arco (Completo) | Ventana ±% del próximo pivote de cada nivel. |
| Diana (Completo) | Ventanas ±15 / ±10 / ±5 % del próximo pivote del nivel de trading. |
| ● verde / azul / naranja (Completo) | Pivote válido / continuación / límite ±15 % (tooltip con desvío en días). |
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

### Panel (modo Simple)

| Fila | Contenido |
|---|---|
| Cabecera | Activo · ciclo de trading ★ · semáforo: 🟢 ritmo válido (≥ objetivo) · 🟡 aceptable o pocas pruebas · 🔴 débil o roto |
| Qué hacer | La lectura operativa del momento (ver arriba) |
| Próximo pivote | Fecha ± ventana · estado · sincronía con otros ciclos si la hay |
| Confianza | Aciertos x/y (%) frente al objetivo · TP1/TP2 estadísticos si hay datos |
| Momentum | x/5 con cada punto del checklist |
| Última señal | Dirección, fecha, entrada, SL y si sigue viva o está cerrada |
| ⚠ | Solo aparece si hay avisos (ciclo < 5D, pocas pruebas, redibujar) |

### Tabla (modo Completo)

- Cabecera con semáforo y fila "Qué hacer" (las mismas del panel Simple).
- Anclas usadas y subdivisión elegida.
- Por ciclo:
  - duración y nivel interno, barras;
  - ciclo de Hurst equivalente (≈80D, ≈20W…);
  - aciertos x/y y %;
  - próximo pivote ± ventana;
  - estado (`EN VENTANA`, `faltan Nd`, `⚠ redibujar`).
- ★ ciclo de trading · ◆ dominante · sincronía actual.
- Hurst, momentum x/5 con cada punto, ratio y traslación (techo temprano/simétrico/tardío).
- Estadística de pivotes, ciclo actual (expansión y fuerza), última señal y avisos.

---

## Alertas

Para crear la alerta: botón *Crear alerta* → condición **Ciclos de Tiempo** → **"Cualquier llamada a la función alert()"**. Los mensajes llegan en el idioma elegido y nombran el ciclo por su duración (`BTCUSD · ciclo 80D · Entra en la ventana de pivote (15/08/26 → 29/08/26)`). Cada tipo se activa o desactiva en `11 · Alertas`.

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
