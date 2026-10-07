# Capítulo 3: La ley de oferta y demanda (págs. 33–37)

## Idea central
Siempre hay el mismo número de compradores que de vendedores. El precio no se mueve porque haya "más compradores", sino porque **la iniciativa (órdenes a mercado)** consume la liquidez pasiva (órdenes limitadas) de un nivel y obliga al precio a buscar contrapartida en el siguiente.

## Frameworks
- **Agresivo vs pasivo**:
  - *Oferta y demanda* son órdenes limitadas (pasivas) en el ASK y el BID: frenan el movimiento, pero no lo mueven.
  - *Compradores y vendedores* son órdenes a mercado (agresivas): son las únicas que desplazan el precio.
- **Desplazamiento del precio**:
  - Para subir, los compradores agresivos deben absorber toda la oferta del nivel y seguir comprando. También empuja al alza que salten los stops de los cortos.
  - Para bajar ocurre lo mismo con las ventas a mercado y con los stops de los largos.
- **Falta de interés**: si una fuerza se retira, la otra mueve el precio con muy poco esfuerzo. Si se retira la oferta, hay pocos contratos en el ASK y el precio sube con poca compra. Si se retira la demanda, baja con poca venta.

## Conceptos clave
- **Liquidez**: el volumen atrae al precio. El mercado (como subasta) busca facilitar el intercambio.
- **Iniciativa**: órdenes a mercado o stops que se convierten en órdenes a mercado.
- **Órdenes pasivas**: solo expresan intención y pueden detener un movimiento.

## Modelos mentales
- Pregúntate quién está tomando la iniciativa y quién está absorbiendo.
- Un avance con volumen bajo puede ser *falta de oferta*, no fuerza compradora.
- El origen de la orden (minorista, institucional o algoritmo) no importa: toda orden añade liquidez. Precio y volumen son las herramientas para leer el resultado.

## Anti-patrones
- **"Sube porque hay más compradores"**: es falso; cada compra tiene su venta.
- **Llamar demanda a toda compra**: confunde lo pasivo con lo agresivo.

## Ejemplo trabajado
Hay 500 contratos en el ASK de 100,00 y entran compras a mercado por 500.
- Si no entran más compras, el precio se queda ahí.
- Si entran 200 más, se consume el nivel y el precio sube a 100,25 a buscar nuevos vendedores.
- Si en 100,25 solo hay 50 contratos (oferta retirada), bastan 50 compras más para subir otro tick.

## Puntos clave
1. Solo las órdenes a mercado (y los stops) mueven el precio.
2. Las órdenes limitadas frenan el movimiento.
3. La ausencia de la fuerza contraria facilita el movimiento (falta de interés).
4. Lee siempre precio y volumen juntos.

## Conecta con
- **Ch5**: el esfuerzo (volumen) frente al resultado (precio).
- **Ch9**: el Spring busca precisamente la liquidez de los stops.
