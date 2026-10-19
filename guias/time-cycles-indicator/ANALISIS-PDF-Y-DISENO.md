# Indicador de Time Cycles (Pine Script v6) — análisis de la guía y diseño

Fuente: *Beginner's Guide to Time Cycles* (Mr. Abundance), 136 páginas, 7 PDFs leídos completos.
Este documento agrupa lo que enseña la guía y lo traduce a requisitos de un indicador para TradingView.

---

## 1. Idea central

- Los mercados se mueven en **ritmos** (flujo de dinero que entra y sale). Los ciclos no predicen fechas exactas: definen **ventanas de probabilidad** donde un mínimo (bottom pivot) es más probable.
- "Los ciclos dan el *cuándo*, el precio da el *dónde*." Un setup A+ = ventana de tiempo + zona de precio (demanda) + estructura + momentum + ratio.
- Mentalidad: **ventana, no fecha**; **ritmo dominante, no ciclo perfecto**; **probabilidad, no predicción**; el riesgo se gestiona igual.

## 2. Principios de Hurst relevantes para el código

| Principio | Implicancia en el indicador |
|---|---|
| Cyclicality / Summation | El precio es suma de ciclos → se dibujan varios grados a la vez. |
| Harmonicity | Cada ciclo se subdivide por 2 (lo más común), 3 (frecuente) o 5 (raro). |
| Synchronicity | Los mínimos de ciclos de distinto grado coinciden → *confluencia temporal*. |
| Nominality | Longitudes nominales (tabla abajo). |
| Variation | Siempre hay tolerancia → ventana ± % de la longitud. |
| Commonality | Activos correlacionados comparten pivotes (índices, crashes) → cruce entre activos. |

### Ciclos nominales (calendario) y ventana

| Ciclo | Días | ± ventana |
|---|---|---|
| 5D | 5 | 0.5 |
| 10D | 10 | 1 |
| 20D | 20 | 2 |
| 40D | 40 | 4 |
| 80D | 80 | 8 |
| 20W | 140 | 14 |
| 9M | 270 | 13 |
| 18M | 540 | 27 |
| 27M | 822 | 41 |
| 54M | 1095 | 55 |
| 9Y | 3285 | 164 |
| 18Y | 6570 | 328 |

Secuencia simplificada: 20d → 40d → 80d → 20w → 40w → 18m → 54m → 9y (se duplica).

**Ventana**: el autor prefiere **±10 %** de la longitud (Hurst: 10–15 %). Para ciclos largos (>4 años) estrechar a **±5 %** y usar ciclos menores anidados. Visual de "diana": 5 % (centro, ideal) / 10 % / 15 % (límite).

Reglas de uso:
- Los **ciclos comunes de Hurst** funcionan mejor tras un mínimo extremo (crash o impulso fuerte) y hasta ~20W (±10 %). Después, volver a **simetría dibujada a ojo** para capturar el ritmo dominante del activo.
- No usar ciclos en TF muy bajos: recomienda no menos de 5 días; los de **20D+** son los más repetibles. (Sus ejemplos intradía en cripto son "los más extremos, no ideales".)
- Gráfico en **escala log** para activos volátiles / horizonte largo.

## 3. Cómo se mapean los ciclos (método de simetría)

1. Elegir **dos mínimos mayores** (Reference Point 1 y 2) → ciclo madre (HTF).
2. **Subdividir** en 2 y de nuevo en 2 (o 3 / 5) para bajar de grado (colores: negro/amarillo → marrón → gris).
3. Probar 2 vs 3 (y 5 si ninguno encaja); **elegir la división que mejor alinea con los mínimos reales**. Proceso: madre ÷2 ÷2 → medir; madre ÷3 ÷2 → medir; proyectar solo la mejor.
4. Pueden mezclarse razones por nivel (ej. SCCO: ÷2 luego ÷3; NEM: patrón de 3).
5. Proyectar hacia adelante. Fase de cada ciclo: "money in" (primera mitad, ascenso) → "money out" (segunda mitad).
6. Ignorar mechas atípicas: lo que importa es el flujo (modo HLC area / línea).

### Ajuste de fase ("shift", ejemplo XMR)
Si el pivote real llegó antes/después de la fecha ideal, **desplazar los ciclos de TF menor** esa misma cantidad (ciclo gris "shifted") pero **conservar también el original**: la variación es temporal y el ritmo medio vuelve ("analogía del tren").

### Stealth time cycles (avanzado, p. 118–131)
Anclar el ciclo no en el mínimo más profundo sino en **último mínimo antes de un breakout** y **primer retroceso claro tras el impulso** (ETH, DOGE, SMCI, ASTER, APEX, INTC). Sirve como ciclo secundario cuando el de simetría "falla". El autor dice que no es para principiantes, pero el indicador puede permitir elegir anclas manuales cualesquiera.

## 4. Validación y mantenimiento de ciclos

- **Hit rate objetivo ≥ 80 %** (ejemplo PALL: 5/6 = 83 %).
- Un ciclo se considera **inválido** si el mínimo cae fuera de la ventana ±15 % **y** no hay higher low/ruptura/continuación en la ventana ±5 %.
- Una invalidación es tolerable; **dos seguidas → redibujar**; mientras tanto crear un **pivote fantasma** ("ghost pivot") de seguimiento.
- Ciclo **dominante** = el que más impactos directos tiene (ej. HL: 6700D marrón vs 8000D gris). El ciclo mayor puede "reclamar dominancia" después (analogía del volcán dormido).
- Si el gráfico no muestra ritmo claro: bajar de TF; si sigue sin verse, **no forzar**, cambiar de activo.
- Posición del pico dentro del ciclo: **left translated** (techo temprano), **simétrico**, **right translated** (techo tardío) → sesgo de estructura.

## 5. Entradas, salidas y gestión

### VTL (Valid Trend Line)
- Línea entre **dos mínimos consecutivos del mismo grado** (dos de 80D = VTL 80D).
- **Largo**: tras entrar en la ventana de bottom, ruptura al alza de la línea bajista previa (confirmación; si ocurre fuera de ventana es probable fake-out/squeeze). TP mínimo **1:1**; SL bajo el mínimo.
- **Corto**: precio cruza **por debajo de la VTL alcista** del ciclo → el techo está puesto. SL en el máximo reciente, objetivo 1:1. Confirmaciones extra: Wyckoff distribución, backtest de la VTL, rebote a VWAP anclado desde el máximo.
- Entradas refinadas en TF menor: BOS bajista→alcista, SFP, Wyckoff M1/M2, Elliott, Fibonacci.
- Ejemplo BTC: VTL 80D (7-abr-25 y 22-jun-25), ventana ±8D; 20W = 140D.

### Objetivos
- Expansión: 1:1, 1.618, 2.272. Corrección: 1:1, 1.382. Menos de 1:1 = debilidad.
- Retroceso típico: soporte en **0.382**.

### Estadística de backtest para TP (ejemplo DOGE, ciclo 29D)
Medir sobre los pivotes históricos: (A) expansión media desde el pivote, (B) días entre pivote y techo local / inicio de corrección, (C) retroceso fib medio. DOGE: mínimo +8 % (1/10), estándar **+20 % (9/10)** en 6–8 días, techo local día 6–8, demanda en 0.382 del tramo. Entrada ±3D del pivote.
→ El indicador debería **calcular esta tabla automáticamente** para el ciclo elegido.

### Escalado por confluencia temporal
Precio llegando a demanda **dentro** de la ventana válida → mayor tamaño / apalancamiento con SL más corto. Fuera de ventana → menos tamaño. Respetar siempre el precio: si llega antes a la demanda, adaptar (caso ZC).

## 6. Momentum (checklist de 5 puntos, p. 52–68)

1. Mínimo formando rango de **3+ meses**.
2. Estructura acumulativa / ruptura saliendo del rango (3 drives, Wyckoff).
3. **EMA20 cruza sobre EMA50** y se separa, con **ATR (14) subiendo / "curling up"**; precio sobre ambas, ambas con pendiente alcista.
4. Ratios Alt/ETH (u otros) en demanda.
5. **Volumen** creciente (spot/perp).

Se puntúa x/5. Reglas: ATR nunca solo; ATR es indicador *rezagado*, sirve para confirmar ruptura en resistencias; si el ciclo mayor está por terminar, ser más cauto con largos de subciclo. **Hidden momentum**: el sector/índice sube y arrastra al activo aunque su propio ATR esté bajista ("rising tide").

## 7. Análisis de ratios (bonus, p. 69–118)

Pregunta de institucional: *¿dónde rota el capital y está soportado este movimiento?*

**4 leyes:** (1) activos de tamaño relativo similar; (2) mismo "estatus" en su industria (la prueba de los 5 segundos de un gestor); (3) juzgar por **claridad** (rangos, Wyckoff, 3 drives) — si no aporta claridad se descarta, usar la historia más larga; (4) tener **un solo respaldo**.

Uso en el indicador: correr el mismo motor de ciclos sobre el **ratio** (ciclos del ratio confirman ciclos del USD) y marcar zonas range high / range low del ratio como confluencia de precio.

Ratios citados (presets sugeridos):
- Top 15: TIPS/BTC, TLT/IWM, GLD/SPY, DXY/EEM, LQD/HYG, IEF/QQQ, ARKK/VIX, XLP/XLY, BND/IPO, GDX/XBI, DBC/SPY, CRB/SPX, TIP/SPY, SIL/ACWI, HUI/VT. Bonus: US10Y/Gold.
- Oro vs 11 sectores S&P: XAU/XLK, XLF, XLE, XLV, XLY, XLP, XLI, XLRE, XLU, XLC, XLB (señal macro: 1–3 sectores = rotación local; 5+ = debilidad ampliándose; 11 = régimen de bear USD).
- Cripto: USDT.D − USDC.D (resta, no suma; sube = institucionales ya salieron → topes; baja = soporte), USDT.D/ETH, ETH/Silver, Altcoins(TOTAL3)/ETH, BTC/SPX, BTC/QQQ, BTC/GOLD, SILVER/BTC.
- Commodities: spot vs mineras (XAU/GDX, SLV/SIL, XCU/COPX, LIT/LITP, URA/URNM, PLTM/SBSW), Platinum/Silver, metales vs bancos (GLTR/BKX, Silver/C, Platinum/WFC, Copper/GS, TTGD/TXBA).
- Riesgo: HYG/LQD (soporte fib 0.786 / −0.3 deviation = suelos del SPX), IWM/TLT (backtest de canal bajista = caídas), IPO/BND (canal con fibs 0.25/0.5/0.75), ARKK/VIX (90 % de aciertos en 20 flechas).
- Topes cripto macro: TIP/BTC tocando mínimo de ciclo ≈ techo de BTC; nunca usar un solo ratio.

## 8. Qué NO puede hacer (o no conviene) un indicador

- Detección de Wyckoff M1/M2, 3-drives, SFP, Elliott: subjetivo; solo se pueden aproximar (SFP/BOS con pivotes) — recomendable **dejar como confirmación manual** o v2.
- "A ojo / HLC": el indicador usa el low real (o HLC area configurable) → permitir **suavizado** de mechas atípicas.
- FLD, envelopes, channels: la guía los excluye explícitamente; fuera de alcance.

---

## 9. Diseño propuesto del indicador (Pine v6)

### 9.1 Principio técnico
Trabajar en **tiempo (ms), no en barras** → funciona en cualquier TF y activo (cripto 24/7, acciones con fines de semana, FX, commodities, ratios). Proyecciones con `xloc.bar_time`, que admite fechas futuras.

### 9.2 Módulos

1. **Motor de ciclos**
   - Anclas: `input.time` para Ref 1 y Ref 2 (manual) **o** auto (dos mínimos significativos con `ta.pivotlow` + distancia mínima, para activos sin ancla elegida).
   - Niveles N (hasta 5) con **razón de subdivisión por nivel** (2/3/5) o longitud fija nominal Hurst (selector 10D…18Y).
   - Proyección a futuro K ciclos, ajuste de fase (**shift**) por nivel y opción de mostrar ciclo original + shifted.
   - Dibujo: líneas verticales en pivotes + semicírculos (`polyline`, con el color por grado: negro/amarillo/marrón/gris) + etiquetas "money in/out".
2. **Ventanas de tiempo**: cajas verticales ±5/10/15 % (diana); % configurable; "ventana activa" = bool para alertas.
3. **Validación**: sobre pivotes históricos proyectados hacia atrás calcular **hit rate** (swing low dentro de la ventana), contador de **fallos consecutivos**, aviso "redibujar", pivote fantasma. Comparador **2 vs 3 vs 5** que sugiere la razón con mejor hit rate (tabla).
4. **VTL**: línea entre los dos últimos mínimos del grado elegido; señales de ruptura (largo/corto) con SL/TP 1:1, 1.618, 2.272; alertas.
5. **Momentum score 0–5**: EMA20/50, ATR14 curling, volumen, rango ≥3m (configurable), pendiente. Tabla.
6. **Estadística de pivote** (como DOGE): tabla con % expansión medio/mínimo, día medio del techo, retroceso fib medio por ciclo; proyecta TP1/TP2 y zona 0.382.
7. **Módulo de ratio** (opcional): `input.symbol` secundario / expresión de ratio vía `request.security`, mismo motor aplicado al ratio + zonas range high/low; presets de la lista de §7. Verificar claridad (ley 3) queda al usuario.
8. **Panel de confluencia**: puntos por cada ciclo cuya ventana contiene la barra actual (peso por grado) + momentum + ratio → "score" y estado (en ventana / próximo pivote en N días).
9. **Clasificación left/right translated** del ciclo en curso.

### 9.3 Cuidados específicos de Pine
- Límites: ~500 líneas/cajas/labels, 100 polylines → controlar densidad por TF y número de ciclos proyectados.
- `ta.pivotlow(L,R)` confirma con retraso R barras → documentarlo (no es repintado de señal, pero sí de marcado).
- `request.security` con `lookahead` apropiado y `barmerge` para ratio sin repintado.
- Arcos: posicionarlos bajo el mínimo visible del rango (`chart.left_visible_bar_time` / `chart.right_visible_bar_time` + escala log opcional).
- Estructuras con `type` / `array` para niveles y pivotes.

### 9.4 Parámetros por tipo de activo (presets)
| Activo | Preset sugerido |
|---|---|
| Cripto | log, ciclos 20D/40D/80D/20W, ventana 10 %, ratios BTC/SPX, USDT.D−USDC.D |
| Acciones / índices | log en largo plazo, simetría desde mínimos semanales/mensuales, ratios sector/índice, vs oro |
| Commodities / mineras | ratio spot vs minera, vs bancos, vs bolsa |
| FX | ratio contra par fuerte (CHF); escala lineal |
| Ratios | mismos ciclos, sin ratio secundario |

---

## 10. Decisiones pendientes (a confirmar con el usuario)

1. ¿Anclas **manuales** (dos fechas) o también **auto-detección**? (Recomendado: híbrido, manual por defecto.)
2. Alcance v1: motor + ventanas + validación + VTL + momentum. ¿Ratios y estadística de pivote en v1 o v2?
3. ¿Indicador (solo visual + alertas) o también **strategy** para backtest real?
4. Idioma de etiquetas/inputs (¿español o inglés?).
5. Activos/TF principales donde se usará, para calibrar presets.
6. Ubicación del `.pine` en el repo (propuesta: `guias/time-cycles-indicator/time_cycles.pine`).
