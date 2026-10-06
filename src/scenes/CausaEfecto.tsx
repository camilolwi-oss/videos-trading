import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {buildCandles} from '../candles';
import {CandleChart} from '../components/CandleChart';
import {Arrow, DrawLine, Label, Ring, Tag, after} from '../components/annotations';
import {Background, Caption, Gold, SceneHeader, useWindow} from '../components/ui';
import {C} from '../theme';

const candles = buildCandles(
  [
    [0, 100], [5, 98], [9, 96.6], [13, 98.6], [17, 97.4], [21, 99], [25, 97.9], [28, 98.8],
    [31, 96.9], [34, 99], [42, 104], [47, 102.5], [50, 104.5], [54, 103], [58, 105.5],
    [62, 103.6], [66, 102.4], [69, 103.6], [72, 102.5], [76, 104.2], [86, 110], [90, 109], [95, 111],
  ],
  'causa',
  0.3,
  0.3,
);

const START = 30;
const END = 420;

export const CausaEfecto: React.FC = () => {
  const frame = useCurrentFrame();
  const shown = interpolate(frame, [START, END], [0, candles.length], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const reach = (i: number) => START + (i / candles.length) * (END - START);

  const cap1 = useWindow(20, reach(36));
  const cap2 = useWindow(reach(36), reach(64));
  const cap3 = useWindow(reach(64), 600);

  return (
    <Background>
      <SceneHeader num="03" title="Causa y efecto en el gráfico" />
      <div style={{position: 'absolute', left: 120, top: 240}}>
        <CandleChart
          candles={candles}
          width={1680}
          height={600}
          shown={shown}
          yMin={95}
          yMax={112}
          underlay={({x, y}) => {
            const z = after(shown, 64, 6);
            return z > 0 ? (
              <rect
                x={x(47)}
                y={y(103.1)}
                width={(x(73) - x(47)) * z}
                height={y(102) - y(103.1)}
                fill={C.goldSoft}
              />
            ) : null;
          }}
        >
          {({x, y}) => {
            const lo = (i: number) => candles[i].l;
            const hi = (i: number) => candles[i].h;
            return (
              <g>
                {/* Defended lows */}
                <Ring cx={x(9)} cy={y(lo(9)) + 24} progress={after(shown, 10)} />
                <Ring cx={x(17)} cy={y(lo(17)) + 24} progress={after(shown, 18)} />
                {/* Internal low and the sweep below it */}
                <DrawLine
                  x1={x(17)}
                  y1={y(lo(17))}
                  x2={x(33)}
                  y2={y(lo(17))}
                  progress={after(shown, 20, 10)}
                  color={C.muted}
                  dashed
                />
                <Label x={x(23)} y={y(lo(17)) + 32} text="Mínimo interno" progress={after(shown, 22)} color={C.muted} size={20} />
                <Ring cx={x(31)} cy={y(lo(31)) + 24} progress={after(shown, 32)} />
                <Tag x={x(31)} y={y(lo(31)) + 82} text="Barrida" progress={after(shown, 33)} />
                <Label x={x(13)} y={y(lo(9)) + 80} text="CAUSA" progress={after(shown, 33)} color={C.gold} size={30} weight={700} />
                {/* First expansion */}
                <Arrow
                  x1={x(33)}
                  y1={y(hi(33)) - 40}
                  x2={x(41)}
                  y2={y(hi(41)) - 40}
                  progress={after(shown, 36, 6)}
                />
                <Label x={x(35) - 30} y={y(hi(38)) - 70} text="EFECTO" progress={after(shown, 40)} size={30} weight={700} />
                {/* Return to the zone, rejecting value */}
                <Ring cx={x(66)} cy={y(lo(66)) + 24} progress={after(shown, 67)} />
                <Ring cx={x(72)} cy={y(lo(72)) + 24} progress={after(shown, 73)} />
                <Tag x={x(56)} y={y(102) + 60} text="Rechazo de valor" progress={after(shown, 68)} />
                <Label x={x(74)} y={y(lo(72)) + 95} text="NUEVA CAUSA" progress={after(shown, 74)} color={C.gold} size={30} weight={700} />
                {/* Second expansion */}
                <Arrow
                  x1={x(76)}
                  y1={y(hi(76)) - 40}
                  x2={x(85)}
                  y2={y(hi(85)) - 40}
                  progress={after(shown, 78, 6)}
                />
                <Label x={x(78) - 30} y={y(hi(82)) - 70} text="EFECTO" progress={after(shown, 82)} size={30} weight={700} />
              </g>
            );
          }}
        </CandleChart>
      </div>
      <Caption opacity={cap1} top={935}>
        La <Gold>causa</Gold> aparece donde los traders toman decisiones: mínimos defendidos y barridas.
      </Caption>
      <Caption opacity={cap2} top={935}>
        El <Gold>efecto</Gold> es la expansión posterior: el movimiento que la mayoría ve y persigue.
      </Caption>
      <Caption opacity={cap3} top={935}>
        El precio vuelve a la zona, <Gold>rechaza valor</Gold> y genera la causa del siguiente impulso.
      </Caption>
    </Background>
  );
};
