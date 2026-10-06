import React from 'react';
import {C} from '../theme';
import type {Candle} from '../candles';

export type Scale = {
  x: (i: number) => number;
  y: (p: number) => number;
  cw: number;
  shown: number;
};

type Props = {
  candles: Candle[];
  width: number;
  height: number;
  // Number of candles revealed (can be fractional: last candle grows in).
  shown: number;
  yMin?: number;
  yMax?: number;
  padding?: number;
  opacity?: number;
  showGrid?: boolean;
  children?: (s: Scale) => React.ReactNode;
  underlay?: (s: Scale) => React.ReactNode;
};

export const CandleChart: React.FC<Props> = ({
  candles,
  width,
  height,
  shown,
  yMin,
  yMax,
  padding = 30,
  opacity = 1,
  showGrid = true,
  children,
  underlay,
}) => {
  const lo = yMin ?? Math.min(...candles.map((c) => c.l));
  const hi = yMax ?? Math.max(...candles.map((c) => c.h));
  const n = candles.length;
  const step = (width - padding * 2) / n;
  const cw = Math.max(3, step * 0.62);
  const x = (i: number) => padding + step * (i + 0.5);
  const y = (p: number) =>
    padding + ((hi - p) / (hi - lo)) * (height - padding * 2);
  const scale: Scale = {x, y, cw, shown};
  const full = Math.floor(shown);
  const partial = shown - full;

  return (
    <svg width={width} height={height} style={{overflow: 'visible', opacity}}>
      {showGrid
        ? [0.2, 0.4, 0.6, 0.8].map((t) => (
            <line
              key={t}
              x1={0}
              x2={width}
              y1={height * t}
              y2={height * t}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={1}
            />
          ))
        : null}
      {underlay ? underlay(scale) : null}
      {candles.map((c, i) => {
        if (i > full || (i === full && partial <= 0)) {
          return null;
        }
        const grow = i === full ? partial : 1;
        const close = c.o + (c.c - c.o) * grow;
        const high = Math.max(c.o, close) + (c.h - Math.max(c.o, c.c)) * grow;
        const low = Math.min(c.o, close) - (Math.min(c.o, c.c) - c.l) * grow;
        const up = c.c >= c.o;
        const color = up ? C.green : C.red;
        const top = y(Math.max(c.o, close));
        const bodyH = Math.max(1.5, Math.abs(y(c.o) - y(close)));
        return (
          <g key={i}>
            <line
              x1={x(i)}
              x2={x(i)}
              y1={y(high)}
              y2={y(low)}
              stroke={color}
              strokeWidth={Math.max(1.2, cw * 0.14)}
            />
            <rect
              x={x(i) - cw / 2}
              y={top}
              width={cw}
              height={bodyH}
              fill={color}
              rx={1}
            />
          </g>
        );
      })}
      {children ? children(scale) : null}
    </svg>
  );
};
