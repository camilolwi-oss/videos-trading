import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Kicker} from '../../components/ui';
import {C, DISPLAY, FONT} from '../../theme';
import {ReelFrame} from '../ReelFrame';

// Prototype of the FVG reel: candles and text follow the script's timing.
// No voice yet: captions show the script's lines per section.
export const REEL05_SECONDS = 50;
const TITLE = 'FVG: el valor justo';

type K = [number, number, number, number]; // open, high, low, close
const CANDLES: {k: K; at: number}[] = [
  {k: [49, 51, 47, 50], at: 0.6},
  {k: [50, 52, 48, 49], at: 1.3},
  {k: [49, 51, 47, 50], at: 2.0},
  {k: [50, 53, 49, 52], at: 2.7},
  {k: [52, 54, 50, 51], at: 3.4},
  {k: [51, 58, 50, 57], at: 6.0}, // base candle: its high is the gap's top
  {k: [57, 84, 56, 82], at: 12.0}, // market order: big body, aggressive
  {k: [82, 86, 70, 72], at: 13.5}, // third candle: its low is the gap's bottom (70)
  {k: [72, 74, 63.5, 66], at: 30.0}, // pullback that touches the 50% line (64)
  {k: [66, 90, 65, 89], at: 33.0}, // rebound
  {k: [89, 108, 88, 106], at: 35.5}, // continuation
];
const VOLS = [0.25, 0.25, 0.3, 0.3, 0.25, 0.3, 1, 0.8, 0.6, 0.7, 0.9];

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const win = (t: number, a: number, b: number, f = 0.3) =>
  interpolate(t, [a - f, a, b, b + f], [0, 1, 1, 0], clamp);
const fade = (t: number, a: number, d = 0.35) => interpolate(t, [a, a + d], [0, 1], clamp);

const X0 = 100;
const STEP = 84;
const BW = 62;
const cx = (i: number) => X0 + i * STEP;
const py = (p: number) => 1240 - (p - 40) * 11;
const GAP_TOP = py(70);
const GAP_BOT = py(58);
const MID = py(64);

const Candle: React.FC<{i: number; k: K; o: number}> = ({i, k, o}) => {
  const [op, hi, lo, cl] = k;
  const col = cl >= op ? C.green : C.red;
  const x = cx(i);
  const top = py(Math.max(op, cl));
  const bot = py(Math.min(op, cl));
  return (
    <g opacity={o}>
      <line x1={x} x2={x} y1={py(hi)} y2={py(lo)} stroke={col} strokeWidth={4} />
      <rect x={x - BW / 2} y={top} width={BW} height={Math.max(4, bot - top)} fill={col} rx={3} />
    </g>
  );
};

const Pill: React.FC<{x: number; y: number; text: string; o: number; color?: string; size?: number}> = ({
  x,
  y,
  text,
  o,
  color = C.white,
  size = 24,
}) => {
  if (o <= 0) return null;
  const w = text.length * size * 0.62 + 28;
  const h = size * 1.7;
  return (
    <g opacity={o}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={h / 2} fill="rgba(10,10,11,0.92)" stroke={color} strokeWidth={1.6} />
      <text x={x} y={y + size * 0.36} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={size} fill={color} letterSpacing="0.05em">
        {text}
      </text>
    </g>
  );
};

const FvgChart: React.FC<{t: number}> = ({t}) => {
  const chartO = interpolate(t, [43.8, 44.4], [1, 0], clamp);
  const gapO = fade(t, 18.5, 0.6);
  const midO = win(t, 19.5, 30.5, 0.3);
  const limO = win(t, 4.3, 18.6, 0.3);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity: chartO}}>
      {/* limit order: waits below the price, never touched */}
      <g opacity={limO}>
        <line x1={80} x2={1010} y1={py(46)} y2={py(46)} stroke={C.gold} strokeWidth={3} strokeDasharray="10 8" />
        <Pill x={260} y={py(46) + 40} text="ORDEN LÍMITE · ESPERA" o={1} color={C.gold} size={26} />
      </g>
      {/* fair value gap, between the first candle's high and the third candle's low */}
      <g opacity={gapO}>
        <rect x={cx(5) - BW / 2} y={GAP_TOP} width={cx(7) + BW / 2 - (cx(5) - BW / 2)} height={GAP_BOT - GAP_TOP} fill={C.gold} fillOpacity={0.18} stroke={C.gold} strokeWidth={2.4} rx={4} />
      </g>
      {/* 50% line of the gap */}
      <g opacity={midO}>
        <line x1={cx(5) - BW / 2} x2={1010} y1={MID} y2={MID} stroke={C.white} strokeWidth={2.5} strokeDasharray="4 6" />
        <Pill x={950} y={MID + 34} text="MITAD 50%" o={1} color={C.white} size={24} />
      </g>
      {CANDLES.map((c, i) => (
        <Candle key={i} i={i} k={c.k} o={fade(t, c.at, 0.25)} />
      ))}
      {/* order labels */}
      <Pill x={cx(6)} y={py(84) - 44} text="ORDEN DE MERCADO · AGRESIVA" o={win(t, 12.4, 18.4, 0.3)} color={C.green} size={26} />
      <Pill x={760} y={500} text="FVG · VALOR JUSTO" o={gapO} color={C.gold} size={30} />
      <Pill x={cx(8) + 110} y={py(54)} text="RESPETA EL 50%" o={win(t, 33.6, 38.5, 0.3)} color={C.green} size={28} />
      {/* volume panel */}
      <text x={60} y={1262} fontFamily={FONT} fontWeight={600} fontSize={18} fill={C.muted} letterSpacing="0.2em">
        VOLUMEN
      </text>
      {VOLS.map((v, i) => {
        const o = fade(t, CANDLES[i].at, 0.25);
        const up = CANDLES[i].k[3] >= CANDLES[i].k[0];
        const h = v * 80 * o;
        const hot = i === 6;
        return <rect key={i} x={cx(i) - 20} y={1330 - h} width={40} height={h} rx={4} fill={hot ? C.gold : up ? C.green : C.red} opacity={0.85} />;
      })}
      <Pill x={cx(6)} y={1222} text="AGRESIVIDAD" o={win(t, 12.4, 18.4, 0.3)} color={C.gold} size={24} />
    </svg>
  );
};

const CAPTIONS: {a: number; b: number; text: string}[] = [
  {a: 0.3, b: 4.2, text: '¿Por qué el precio se mueve tan rápido?'},
  {a: 4.3, b: 12, text: 'Órdenes límite: esperan. Liquidez pasiva.'},
  {a: 12.2, b: 18.3, text: 'Órdenes de mercado: agresivas. Liquidez activa.'},
  {a: 18.5, b: 30, text: 'Desequilibrio: un FVG, valor justo.'},
  {a: 30, b: 44, text: 'El mercado busca el punto medio y continúa.'},
];

const Caption: React.FC<{t: number}> = ({t}) => (
  <>
    {CAPTIONS.map((c) => {
      const o = win(t, c.a, c.b, 0.25);
      if (o <= 0) return null;
      return (
        <div
          key={c.text}
          style={{position: 'absolute', left: 60, right: 60, top: 1372, textAlign: 'center', fontFamily: DISPLAY, fontWeight: 700, fontSize: 46, lineHeight: 1.2, opacity: o}}
        >
          {c.text}
        </div>
      );
    })}
  </>
);

const Cards: React.FC<{t: number}> = ({t}) => {
  const o = fade(t, 44.5, 0.4);
  if (o <= 0) return null;
  const rows = [
    {label: 'DETECTAR', at: 44.8, color: C.gold},
    {label: 'AGRESIVIDAD', at: 45.6, color: C.green},
    {label: 'ENTRAR EN EL MOVIMIENTO', at: 46.4, color: C.white},
  ];
  return (
    <div style={{position: 'absolute', left: 60, width: 960, top: 620, opacity: o}}>
      {rows.map((r) => {
        const ro = fade(t, r.at, 0.3);
        return (
          <div
            key={r.label}
            style={{opacity: ro, transform: `translateY(${(1 - ro) * 18}px)`, border: `2px solid ${r.color}`, borderRadius: 18, padding: '22px 30px', marginBottom: 22, fontFamily: DISPLAY, fontWeight: 800, fontSize: 52, color: r.color}}
          >
            {r.label}
          </div>
        );
      })}
      <div style={{marginTop: 40, display: 'flex', alignItems: 'center', gap: 22}}>
        <div style={{display: 'flex', gap: 8, flex: 1}}>
          {new Array(10).fill(0).map((_, i) => (
            <div key={i} style={{flex: 1, height: 14, borderRadius: 7, background: i < 5 ? C.gold : C.line}} />
          ))}
        </div>
        <span style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 44}}>
          5<span style={{color: C.muted}}>/10</span>
        </span>
      </div>
      <div style={{marginTop: 24}}>
        <Kicker size={28}>Bull Army</Kicker>
      </div>
    </div>
  );
};

export const Reel05: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  return (
    <ReelFrame num={5} title={TITLE}>
      <FvgChart t={t} />
      <Caption t={t} />
      <Cards t={t} />
    </ReelFrame>
  );
};
