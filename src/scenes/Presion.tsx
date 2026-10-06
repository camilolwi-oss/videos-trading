import React from 'react';
import {interpolate, random, useCurrentFrame} from 'remotion';
import {Background, Caption, Gold, Reveal, SceneHeader, useWindow} from '../components/ui';
import {C, DISPLAY} from '../theme';

const START = 60;
const END = 470;

// Net pressure: +1 buyers in control, -1 sellers in control, ~0 balance.
const pressure = (f: number) => {
  const base = interpolate(
    f,
    [0, 60, 80, 170, 200, 290, 320, 480],
    [0, 0, 1, 1, -1, -1, 0, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const osc =
    Math.sin(f * 0.16) * 0.9 *
    interpolate(f, [310, 340], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return Math.max(-1, Math.min(1, base + osc));
};

const series: number[] = [];
{
  let p = 0;
  for (let f = 0; f <= 480; f++) {
    p += pressure(f) * 1.2 + (random(`presion-${f}`) - 0.5) * 4;
    series.push(p);
  }
}

const CH = {x: 200, y: 360, w: 1520, h: 380, lo: -40, hi: 150};

export const Presion: React.FC = () => {
  const frame = useCurrentFrame();
  const now = Math.min(Math.max(frame, START), END);
  const px = (f: number) => CH.x + ((f - START) / (END - START)) * CH.w;
  const py = (v: number) => CH.y + ((CH.hi - v) / (CH.hi - CH.lo)) * CH.h;

  let d = '';
  for (let f = START; f <= now; f++) {
    d += `${f === START ? 'M' : 'L'} ${px(f).toFixed(1)} ${py(series[f]).toFixed(1)} `;
  }
  const p = pressure(frame);
  const buyShare = (1 + p) / 2;
  const headColor = p > 0.25 ? C.green : p < -0.25 ? C.red : C.gold;
  const chartIn = interpolate(frame, [30, 55], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const capBuy = useWindow(75, 195);
  const capSell = useWindow(205, 320);
  const capBal = useWindow(335, 520);

  const barW = 1200;
  const barX = (1920 - barW) / 2;

  return (
    <Background>
      <SceneHeader num="01" title="Cómo funciona el mercado" />
      <div style={{position: 'absolute', left: 120, right: 120, top: 270}}>
        <Reveal delay={10}>
          <div style={{fontSize: 36, color: C.text}}>
            El mercado es la <Gold>interacción constante</Gold> entre compradores y vendedores.
          </div>
        </Reveal>
      </div>
      <svg width={1920} height={1080} style={{position: 'absolute', opacity: chartIn}}>
        <line x1={CH.x} x2={CH.x + CH.w} y1={py(0)} y2={py(0)} stroke={C.line} strokeDasharray="6 8" />
        <path d={d} fill="none" stroke={C.white} strokeWidth={4} strokeLinejoin="round" />
        {frame >= START ? (
          <>
            <circle cx={px(now)} cy={py(series[now])} r={22} fill={headColor} opacity={0.25} />
            <circle cx={px(now)} cy={py(series[now])} r={10} fill={headColor} />
          </>
        ) : null}
        <text x={CH.x - 20} y={CH.y + 10} fill={C.muted} fontSize={22} textAnchor="end">
          precio
        </text>
      </svg>

      <div style={{position: 'absolute', left: barX, top: 790, width: barW, opacity: chartIn}}>
        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 22, fontWeight: 600, letterSpacing: '0.2em', marginBottom: 12}}>
          <span style={{color: C.green}}>COMPRADORES {Math.round(buyShare * 100)}%</span>
          <span style={{color: C.red}}>{Math.round((1 - buyShare) * 100)}% VENDEDORES</span>
        </div>
        <div style={{position: 'relative', height: 26, borderRadius: 13, overflow: 'hidden', background: C.red}}>
          <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${buyShare * 100}%`, background: C.green}} />
          <div style={{position: 'absolute', left: '50%', top: -4, bottom: -4, width: 3, background: C.bg}} />
        </div>
      </div>

      <Caption opacity={capBuy} top={900}>
        Los compradores pagan precios cada vez más altos → <span style={{color: C.green}}>el precio sube</span>
      </Caption>
      <Caption opacity={capSell} top={900}>
        Los vendedores pasan a ser el lado más agresivo → <span style={{color: C.red}}>el precio baja</span>
      </Caption>
      <Caption opacity={capBal} top={900}>
        Ningún lado tiene ventaja clara → <Gold>el precio rota en vez de moverse con intención</Gold>
      </Caption>
      <div
        style={{
          position: 'absolute',
          right: 120,
          top: 100,
          fontFamily: DISPLAY,
          fontWeight: 700,
          fontSize: 30,
          color: frame > 325 ? C.gold : headColor,
          opacity: chartIn,
        }}
      >
        {frame > 325 ? 'EQUILIBRIO' : p > 0.25 ? 'DEMANDA > OFERTA' : p < -0.25 ? 'OFERTA > DEMANDA' : 'EQUILIBRIO'}
      </div>
    </Background>
  );
};
