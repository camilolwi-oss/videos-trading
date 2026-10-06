import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {buildCandles} from '../candles';
import {CandleChart} from '../components/CandleChart';
import {DrawLine, Label, Ring, Tag, after} from '../components/annotations';
import {EstadoLayout} from '../components/EstadoLayout';
import {Gold} from '../components/ui';
import {C} from '../theme';

const TOP = 102;
const BOT = 98;
const anchors: [number, number][] = [
  [0, 100], [5, 101.7], [11, 98.3], [17, 101.8], [23, 98.2], [29, 101.6], [35, 98.4],
  [41, 101.8], [47, 98.3], [53, 101.7], [59, 98.5], [65, 100.6], [69, 100],
];
const candles = buildCandles(anchors, 'rango', 0.45, 0.35);
const touchesTop = [5, 17, 29, 41, 53];
const touchesBot = [11, 23, 35, 47, 59];

const START = 20;
const END = 400;

export const Rango: React.FC = () => {
  const frame = useCurrentFrame();
  const shown = interpolate(frame, [START, END], [0, candles.length], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <EstadoLayout
      num="04 · Estado 1"
      title="Rango (Balance)"
      sectionDelays={[40, 150, 260]}
      captionFrom={380}
      caption={
        <>
          <Gold>Balance:</Gold> el precio rota entre extremos, con velas superpuestas y sin que ningún lado se desplace con intención.
        </>
      }
      sections={[
        {title: 'Qué ves', items: ['Precio moviéndose de forma lateral', 'Máximos y mínimos que se respetan', 'Mucha superposición entre velas']},
        {title: 'Qué significa', items: ['El mercado acepta el precio en esa zona', 'Ningún lado tiene un control claro']},
        {title: 'Implicancia', items: ['El precio tiende a quedarse dentro del rango', 'Las rupturas tienen que ser aceptadas, no solo vistas']},
      ]}
      chart={
        <CandleChart
          candles={candles}
          width={1100}
          height={640}
          shown={shown}
          yMin={96.6}
          yMax={103.4}
          underlay={({x, y}) => {
            const z = after(shown, 24, 10);
            return (
              <rect
                x={x(0)}
                y={y(TOP)}
                width={(x(candles.length - 1) - x(0)) * z}
                height={y(BOT) - y(TOP)}
                fill={C.goldSoft}
                opacity={0.6}
              />
            );
          }}
        >
          {({x, y}) => (
            <g>
              <DrawLine x1={x(0)} y1={y(TOP)} x2={x(candles.length - 1)} y2={y(TOP)} progress={after(shown, 18, 14)} dashed />
              <DrawLine x1={x(0)} y1={y(BOT)} x2={x(candles.length - 1)} y2={y(BOT)} progress={after(shown, 24, 14)} dashed />
              {touchesTop.map((i) => (
                <Ring key={`t${i}`} cx={x(i)} cy={y(candles[i].h) - 18} r={12} progress={after(shown, i + 1)} />
              ))}
              {touchesBot.map((i) => (
                <Ring key={`b${i}`} cx={x(i)} cy={y(candles[i].l) + 18} r={12} progress={after(shown, i + 1)} />
              ))}
              <Tag x={x(candles.length - 1)} y={y(TOP) - 50} anchor="end" text="Máximos respetados" progress={after(shown, 30)} />
              <Tag x={x(candles.length - 1)} y={y(BOT) + 50} anchor="end" text="Mínimos respetados" progress={after(shown, 36)} />
              <Label x={x(34)} y={y(100) + 12} text="ACEPTACIÓN" progress={after(shown, 50, 8) * 0.35} size={64} weight={800} color={C.gold} />
            </g>
          )}
        </CandleChart>
      }
    />
  );
};
