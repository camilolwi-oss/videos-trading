import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {buildCandles} from '../candles';
import {CandleChart} from '../components/CandleChart';
import {DrawLine, Label, Tag, after} from '../components/annotations';
import {EstadoLayout} from '../components/EstadoLayout';
import {Gold} from '../components/ui';
import {C} from '../theme';

const anchors: [number, number][] = [
  [0, 100], [4, 101], [8, 99.2], [12, 100.9], [16, 99.1], [20, 100.6], [22, 100.2],
  [28, 103.5], [31, 102.6], [37, 106.5], [40, 107.3], [44, 105.8], [48, 107.6],
  [51, 109], [54, 106], [57, 107.6], [60, 106.2], [62, 106.6], [67, 110], [70, 109.2],
  [75, 113], [79, 111.6], [83, 112.8], [87, 111.7], [90, 112.4],
];
const candles = buildCandles(anchors, 'transicion', 0.3, 0.3);
const transitions = [22, 41, 62, 76];
const phases: [number, number, string][] = [
  [0, 22, 'Balance'],
  [22, 41, 'Desequilibrio'],
  [41, 62, 'Balance'],
  [62, 76, 'Desequilibrio'],
  [76, 91, 'Balance'],
];

const START = 20;
const END = 420;

export const Transicion: React.FC = () => {
  const frame = useCurrentFrame();
  const shown = interpolate(frame, [START, END], [0, candles.length], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <EstadoLayout
      num="04 · Estado 3"
      title="Transición (Cambio)"
      sectionDelays={[40, 160, 280]}
      captionFrom={400}
      caption={
        <>
          <Gold>Transiciones:</Gold> el punto donde el mercado pasa de balance a desequilibrio, o viceversa.
        </>
      }
      sections={[
        {title: 'Qué ves', items: ['La tendencia se desacelera', 'Rupturas fallidas', 'Reacciones más fuertes en contra del movimiento previo']},
        {title: 'Qué significa', items: ['El control puede estar cambiando de manos', 'De tendencia a rango, o hacia una reversión']},
        {title: 'Implicancia', items: ['Aumenta la incertidumbre', 'No des por sentada la continuación: mirá si el cambio se acepta o se rechaza']},
      ]}
      chart={
        <CandleChart
          candles={candles}
          width={1100}
          height={640}
          shown={shown}
          yMin={97.5}
          yMax={115.5}
          underlay={({x, y}) => (
            <g>
              {phases.map(([a, b, name]) => {
                const p = after(shown, a + 2, 6);
                const balance = name === 'Balance';
                return (
                  <g key={a} opacity={p}>
                    <rect
                      x={x(a) - 4}
                      y={y(115.5)}
                      width={x(b) - x(a)}
                      height={y(97.5) - y(115.5)}
                      fill={balance ? 'rgba(255,255,255,0.025)' : 'rgba(38,194,129,0.05)'}
                    />
                    <text
                      x={(x(a) + x(Math.min(b, candles.length - 1))) / 2}
                      y={y(97.5) - 14}
                      textAnchor="middle"
                      fontSize={19}
                      fontWeight={600}
                      fill={balance ? C.muted : C.green}
                      letterSpacing="0.12em"
                    >
                      {name.toUpperCase()}
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        >
          {({x, y}) => (
            <g>
              {transitions.map((i) => (
                <g key={i}>
                  <DrawLine x1={x(i) - 4} y1={y(97.5) - 40} x2={x(i) - 4} y2={y(115)} progress={after(shown, i + 1, 5)} color={C.gold} width={2.5} />
                  <Label x={x(i) - 4} y={y(115) - 10} text="Transición" progress={after(shown, i + 2, 4)} color={C.gold} size={20} />
                </g>
              ))}
              {/* Failed breakout above the second balance */}
              <DrawLine x1={x(41)} y1={y(108.1)} x2={x(61)} y2={y(108.1)} progress={after(shown, 46, 8)} color={C.muted} dashed />
              <Tag x={x(51)} y={y(candles[51].h) - 34} text="Ruptura fallida" bg={C.red} color={C.white} size={18} progress={after(shown, 55, 4)} />
            </g>
          )}
        </CandleChart>
      }
    />
  );
};
