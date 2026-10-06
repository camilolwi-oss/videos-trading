import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {buildCandles} from '../candles';
import {CandleChart} from '../components/CandleChart';
import {DrawLine, Label, Tag, after} from '../components/annotations';
import {EstadoLayout} from '../components/EstadoLayout';
import {Gold} from '../components/ui';
import {C} from '../theme';

const anchors: [number, number][] = [
  [0, 100], [6, 103], [10, 101.5], [17, 105.5], [21, 103.8], [28, 108], [32, 106.2],
  [39, 110.5], [43, 108.8], [50, 113], [54, 111.4], [61, 115.5], [64, 114.6],
];
const candles = buildCandles(anchors, 'tendencia', 0.35, 0.35);
const highs = [6, 17, 28, 39, 50, 61];
const lows = [10, 21, 32, 43, 54];

const START = 20;
const END = 400;

export const Tendencia: React.FC = () => {
  const frame = useCurrentFrame();
  const shown = interpolate(frame, [START, END], [0, candles.length], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <EstadoLayout
      num="04 · Estado 2"
      title="Tendencia (Desequilibrio)"
      sectionDelays={[40, 150, 260]}
      captionFrom={380}
      caption={
        <>
          <Gold>Tendencia:</Gold> máximos y mínimos crecientes, retrocesos cortos y expansiones que alejan al precio.
        </>
      }
      sections={[
        {title: 'Qué ves', items: ['Máximos y mínimos más altos (o más bajos)', 'Movimiento direccional con menos superposición']},
        {title: 'Qué significa', items: ['Un lado tiene mayor control', 'El precio se aleja de las zonas previas']},
        {title: 'Implicancia', items: ['La continuación es más probable que la reversión', 'Los retrocesos son más débiles que el impulso']},
      ]}
      chart={
        <CandleChart candles={candles} width={1100} height={640} shown={shown} yMin={98.5} yMax={117}>
          {({x, y}) => (
            <g>
              {/* Trendline through the higher lows */}
              <DrawLine
                x1={x(lows[0])}
                y1={y(candles[lows[0]].l) + 6}
                x2={x(lows[4])}
                y2={y(candles[lows[4]].l) + 6}
                progress={after(shown, 24, 32)}
                color={C.gold}
                width={3}
              />
              {highs.map((i, k) => (
                <Tag
                  key={`h${i}`}
                  x={x(i)}
                  y={y(candles[i].h) - 34}
                  text={k === 0 ? 'Máx' : 'HH'}
                  size={18}
                  bg={C.green}
                  progress={after(shown, i + 1)}
                />
              ))}
              {lows.map((i) => (
                <Tag
                  key={`l${i}`}
                  x={x(i)}
                  y={y(candles[i].l) + 36}
                  text="HL"
                  size={18}
                  progress={after(shown, i + 1)}
                />
              ))}
              <Label x={x(0)} y={y(115.8)} anchor="start" text="HH = máximo más alto" progress={after(shown, 20, 6)} color={C.green} size={22} />
              <Label x={x(0)} y={y(115.8) + 32} anchor="start" text="HL = mínimo más alto" progress={after(shown, 24, 6)} color={C.gold} size={22} />
            </g>
          )}
        </CandleChart>
      }
    />
  );
};
