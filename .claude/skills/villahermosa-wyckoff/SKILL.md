---
name: villahermosa-wyckoff
description: "Knowledge base from \"La Metodología Wyckoff en profundidad\" by Rubén Villahermosa. Use when applying Wyckoff's three laws (oferta y demanda, causa y efecto, esfuerzo y resultado), reading accumulation/distribution phases A–E and events (PS, SC, AR, ST, Spring, UTAD, SOS, LPS, LPSY), designing or reviewing a Wyckoff indicator, or studying the book."
---

<!-- argument-hint: [tema, evento Wyckoff o número de capítulo] -->

# La Metodología Wyckoff en profundidad
**Autor**: Rubén Villahermosa (2018) | **Páginas**: ~81 | **Capítulos**: 9 | **Generado**: 2026-10-07 con book-to-skill

## Cómo usar esta skill

- **Sin argumentos**: carga los frameworks centrales de abajo.
- **Con un tema** (`spring`, `selling climax`, `esfuerzo resultado`, `causa efecto`…): lee el capítulo correspondiente antes de responder.
- **Con un capítulo** (`ch08`): carga ese archivo.
- **Para el indicador**: el script Pine de este repo (`indicadores/wyckoff/`) implementa estas reglas. Usa el cheatsheet y los Ch2, Ch5, Ch8 y Ch9 para revisarlo o extenderlo.

Si la pregunta no está cubierta abajo, lee el capítulo del índice antes de contestar.

---

## Frameworks centrales

### 1. Las tres leyes
- **Oferta y demanda** (Ch3): solo la *iniciativa* (órdenes a mercado y stops) mueve el precio. Las órdenes limitadas lo frenan. Que se retire una fuerza (*falta de interés*) facilita el movimiento contrario.
- **Causa y efecto** (Ch4): el rango es la causa y la tendencia, el efecto, *proporcional* al tiempo y al esfuerzo del rango. Se proyecta con un conteo P&F (de LPS a PS/SC) o con la proyección vertical del rango.
- **Esfuerzo y resultado** (Ch5): volumen = esfuerzo, precio = resultado. La armonía indica continuación; la divergencia, giro. Se evalúa en cinco escalas: vela, siguiente desplazamiento, movimientos, ondas (Weis) y niveles clave.

### 2. El ciclo y el contexto (Ch1)
- Acumulación → tendencia alcista → distribución → tendencia bajista. Las pausas que continúan la tendencia son **reacumulaciones** o **redistribuciones**.
- No operes contra la fase. En acumulación o tendencia alcista, nada de cortos; en distribución o tendencia bajista, nada de largos.
- Evalúa las tendencias por **velocidad, proyección y profundidad**, siempre comparando con lo previo. Cada impulso debe superar al anterior.

### 3. Eventos y fases (Ch2)
| Fase | Acumulación | Distribución |
|---|---|---|
| A: parada | PS → SC → AR → ST (1.er CHoCH) | PSY → BC → AR → ST |
| B: causa | UA, ST as SOW | UT, mSOW |
| C: test | Spring (#1/TSO, #2, #3) y su test; en el esquema #2, LPS | UTAD y su test; en el esquema #2, LPSY |
| D: tendencia dentro | SOS/JAC, LPS, BU/BUEC (2.º CHoCH) | MSOW, LPSY |
| E: tendencia fuera | SOS y LPS crecientes | SOW y LPSY decrecientes |

- El **clímax y el AR fijan los límites**: Creek (resistencia de la acumulación) e ICE (soporte de la distribución).
- Todo evento es **potencial** hasta que lo confirman los siguientes. El SC se etiqueta tras ver el AR y el ST.
- Los esquemas son ideales, no plantillas: el mercado nunca repite dos estructuras iguales.

### 4. Fase A en detalle (Ch8)
- **PS**: primer frenazo fallido. Puede verse como barra amplia con volumen, como varias barras estrechas con volumen constante o como una mecha larga con volumen. Sirve para cerrar cortos, no para comprar.
- **SC**: clímax que fija el soporte y necesita un ST con menos volumen (*No Supply*). Puede darse sin volumen climático: es el **Selling Exhaustion**, que anticipan PS cada vez más bajos con volumen decreciente.
- **AR**: produce el CHoCH y fija el techo. Si es amplio, hay fortaleza. Si es entrelazado, corto y con volumen decreciente, hay sospecha de **redistribución**. Arranca con volumen y rango amplios y se va secando.

### 5. Spring (Ch9)
- Es una rotura del soporte que fracasa, con triple función: barrer stops, inducir ventas y lucrarse.
- **#1/TSO** (penetración profunda y volumen alto), **#2** (moderada) y **#3** (leve, con volumen que se seca). Solo el #3 se compra sin test.
- **Test válido**: rango estrecho, menos volumen y por encima del mínimo del Spring.
- El **Ordinary Shakeout** es la misma sacudida dentro de una tendencia alcista, sin preparación.

### 6. Características de los rangos (Ch6, Ch7)
- **Acumulación**: volumen y volatilidad *decrecientes*, tests altos sin volumen, Springs, barras alcistas más fluidas y mínimos crecientes al final.
- **Distribución**: volumen y volatilidad *altos y constantes*, tests bajos sin volumen, Upthrusts, barras bajistas más fluidas y máximos decrecientes al final.
- **Lo más difícil**: distinguir reacumulación de distribución y redistribución de acumulación, porque empiezan igual.

### 7. Cómo operar según el autor
- La zona primaria es la **Fase C**: Spring y su test, o UTAD y su test.
- Sin sacudida (esquema #2), se entra en el **BUEC** (largos) o en el **LPSY** (cortos), no en la ruptura.
- PS, SC y AR son para tomar beneficios de la tendencia previa. Comprar ahí es temerario.
- Guía de liquidez: pregúntate siempre quién da la contrapartida a quién.

---

## Índice de capítulos

| # | Título | Frameworks clave |
|---|-------|----------------|
| [ch01](chapters/ch01-como-se-mueven-los-mercados.md) | Cómo se mueven los mercados | Ondas, ciclo del precio, velocidad/proyección/profundidad, líneas y canales, rangos |
| [ch02](chapters/ch02-esquemas-acumulacion-distribucion.md) | Esquemas de acumulación y distribución | Fases A–E, eventos, Creek/ICE, CHoCH, esquemas #1/#2 |
| [ch03](chapters/ch03-ley-oferta-demanda.md) | Ley de oferta y demanda | Agresivo vs pasivo, iniciativa, falta de interés |
| [ch04](chapters/ch04-ley-causa-efecto.md) | Ley de causa y efecto | Proporcionalidad, conteo P&F, proyección vertical |
| [ch05](chapters/ch05-ley-esfuerzo-resultado.md) | Ley de esfuerzo y resultado | Tabla armonía/divergencia, ondas de Weis, clímax |
| [ch06](chapters/ch06-acumulacion-reacumulacion.md) | Acumulación y reacumulación | Control del stock, manipulación, características del rango |
| [ch07](chapters/ch07-distribucion-redistribucion.md) | Distribución y redistribución | Upthrust, características, redistribución volátil |
| [ch08](chapters/ch08-eventos-fase-a.md) | Eventos de la Fase A: PS, SC, AR | Selling Exhaustion, anatomía del AR |
| [ch09](chapters/ch09-spring-shakeout.md) | Spring / Shakeout | Tipos #1, #2 y #3, test del Spring, Ordinary Shakeout |

## Índice temático
- **AR (Automatic Rally/Reaction)** → ch02, ch08
- **Armonía / divergencia** → ch05
- **BU / BUEC** → ch02
- **Canales y líneas** → ch01
- **Causa y efecto, conteo P&F** → ch04
- **CHoCH** → ch02, ch08
- **Creek / ICE** → ch02
- **Falta de interés** → ch03, ch05
- **LPS / LPSY** → ch02, ch04
- **Manipulación y liquidez** → ch06, ch07, ch09
- **PS / PSY** → ch02, ch08
- **Reacumulación / redistribución** → ch01, ch06, ch07
- **SC / BC, Selling Exhaustion** → ch02, ch05, ch08
- **SOS / JAC / MSOW** → ch02
- **Spring / TSO / Ordinary Shakeout** → ch02, ch09
- **ST, ST as SOW, mSOW** → ch02, ch08
- **UA / UT / UTAD** → ch02, ch07
- **Velocidad, proyección, profundidad** → ch01

## Archivos de apoyo
- [glossary.md](glossary.md): todos los términos con definición.
- [patterns.md](patterns.md): técnicas paso a paso.
- [cheatsheet.md](cheatsheet.md): reglas de decisión, umbrales y tablas.

---

## Alcance y límites
La skill cubre el contenido del libro (versión 2018, 81 págs., que termina en el capítulo del Spring). Los esquemas del libro son imágenes y se describieron a partir de su lectura. Los umbrales numéricos del cheatsheet son una interpretación cuantitativa para el indicador, no reglas del autor. El contenido está parafraseado y no sustituye al libro (© Rubén Villahermosa).
