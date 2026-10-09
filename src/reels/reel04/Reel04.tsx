import React from 'react';
import {Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Kicker} from '../../components/ui';
import {C, DISPLAY, FONT} from '../../theme';
import {ReelFrame} from '../ReelFrame';
import {Page, Subtitles} from '../Subtitles';

// Timings (seconds) come from the voice track public/audio/reel-04.m4a.
export const REEL04_SECONDS = 66.5;
const TITLE = 'MSB: quiebre de estructura';

const pages: Page[] = [
  {from: 0.83, to: 4.2, text: 'El mercado te avisa cuando va a cambiar de *dirección*,'},
  {from: 4.39, to: 5.62, text: 'y a eso se le llama *quiebre de estructura*.'},
  {from: 5.78, to: 7.58, text: 'Hoy vamos a ver qué es un *MSB*.'},
  {from: 7.97, to: 9.6, text: 'Es el momento en que el precio pierde'},
  {from: 9.6, to: 11.25, text: 'una *secuencia* que venía respetando,'},
  {from: 11.36, to: 12.9, text: 'y es la primera señal de que el *control*'},
  {from: 12.9, to: 14.19, text: 'está cambiando de manos.'},
  {from: 14.27, to: 16.51, text: 'Imaginá una *tendencia alcista*:'},
  {from: 16.71, to: 18.4, text: 'el precio hace *mínimos cada vez más altos*.'},
  {from: 18.4, to: 20.26, text: 'Mientras esos mínimos se respeten,'},
  {from: 20.46, to: 21.96, text: 'los *compradores* van a tener el control.'},
  {from: 22.1, to: 24.5, text: 'Pero cuando el precio *rompe* el último mínimo más alto'},
  {from: 24.5, to: 26.85, text: 'y hace un *mínimo más bajo*, ahí tenés el *quiebre*.'},
  {from: 26.98, to: 30.26, text: 'Después, el precio suele volver a *retestear* esa zona,'},
  {from: 30.44, to: 31.67, text: 'hace un *máximo más bajo*'},
  {from: 31.76, to: 33.53, text: 'y es rechazado desde una zona de *oferta*,'},
  {from: 33.67, to: 35.3, text: 'lo que después se convierte en un *order block*'},
  {from: 35.3, to: 37.03, text: 'o una *confirmación* del movimiento.'},
  {from: 37.71, to: 40.12, text: 'En una situación alcista funciona *al revés*.'},
  {from: 40.71, to: 42.0, text: 'En una tendencia bajista,'},
  {from: 42.14, to: 44.47, text: 'el precio hace *máximos cada vez más bajos*.'},
  {from: 44.62, to: 47.19, text: 'Cuando se rompe ese último *máximo más bajo*'},
  {from: 47.78, to: 50.79, text: 'y se hace un *máximo más alto*,'},
  {from: 50.95, to: 52.14, text: 'se produce el *quiebre estructural alcista*.'},
  {from: 52.31, to: 53.9, text: 'Luego hace un *mínimo más alto*'},
  {from: 53.9, to: 55.29, text: 'con soporte en la zona de *demanda*,'},
  {from: 55.46, to: 56.8, text: 'y eso se vuelve un *order block*'},
  {from: 56.8, to: 58.22, text: 'para un movimiento hacia arriba.'},
  {from: 58.63, to: 60.19, text: 'Recordá: estas estructuras'},
  {from: 60.3, to: 61.7, text: 'siempre se *confirman* en el retesteo,'},
  {from: 62.0, to: 65.16, text: 'y si la ruptura viene con *volumen*, mejor todavía.'},
];

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const win = (t: number, a: number, b: number, fade = 0.3) =>
  interpolate(t, [a - fade, a, b, b + fade], [0, 1, 1, 0], clamp);
const appear = (t: number, at: number, d = 0.3) => interpolate(t, [at, at + d], [0, 1], clamp);

type Pt = [number, number];

// Bearish MSB, like the left drawing of the reference: higher lows, the last
// higher low (p4) breaks into a lower low (MSB). The last higher high (p5),
// where the bearish engulfing starts, is the order block / ceiling. The retest
// (p7) stops right on the MSB level and price continues down.
const BEAR: Pt[] = [[90, 1150], [230, 900], [320, 1045], [450, 805], [540, 965], [660, 690], [770, 1105], [860, 965], [990, 1190]];
// Bullish MSB: the mirror image around the middle of the visual zone.
const MID_Y = 940;
const BULL: Pt[] = BEAR.map(([x, y]) => [x, 2 * MID_Y - y]);

// Point along the polyline at progress s (s = 3.5 → halfway from point 3 to 4).
const pointAt = (pts: Pt[], s: number): Pt => {
  const i = Math.max(0, Math.min(pts.length - 2, Math.floor(s)));
  const f = Math.max(0, Math.min(1, s - i));
  return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f];
};
const pathTo = (pts: Pt[], s: number) => {
  if (s <= 0) return '';
  const full = Math.floor(Math.min(s, pts.length - 1));
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i <= full; i++) d += ` L ${pts[i][0]} ${pts[i][1]}`;
  if (s < pts.length - 1) {
    const [x, y] = pointAt(pts, s);
    d += ` L ${x} ${y}`;
  }
  return d;
};
// x where the segment a→b crosses the horizontal level y
const crossX = (a: Pt, b: Pt, y: number) => a[0] + ((y - a[1]) / (b[1] - a[1])) * (b[0] - a[0]);

const Pill: React.FC<{x: number; y: number; text: string; o: number; color?: string; fill?: string; size?: number}> = ({
  x,
  y,
  text,
  o,
  color = C.white,
  fill = 'rgba(10,10,11,0.92)',
  size = 26,
}) => {
  if (o <= 0) return null;
  const w = text.length * size * 0.62 + 30;
  const h = size * 1.75;
  return (
    <g opacity={o} transform={`translate(0 ${(1 - o) * 10})`}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={h / 2} fill={fill} stroke={color} strokeWidth={1.6} />
      <text x={x} y={y + size * 0.36} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={size} fill={color} letterSpacing="0.06em">
        {text}
      </text>
    </g>
  );
};

const Arrow: React.FC<{from: Pt; to: Pt; o: number; color?: string}> = ({from, to, o, color = C.white}) => {
  if (o <= 0) return null;
  const ang = Math.atan2(to[1] - from[1], to[0] - from[0]);
  const h = 22;
  const a1 = ang + Math.PI * 0.82;
  const a2 = ang - Math.PI * 0.82;
  return (
    <path
      d={`M ${to[0] + Math.cos(a1) * h} ${to[1] + Math.sin(a1) * h} L ${to[0]} ${to[1]} L ${to[0] + Math.cos(a2) * h} ${to[1] + Math.sin(a2) * h}`}
      stroke={color}
      strokeWidth={4}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={o}
    />
  );
};

type Labels = {
  // side: put the tag left of the swing point instead of above/below it
  swing: {i: number; text: string; at: number; below: boolean; side?: boolean}[];
  msbAt: number;
  breakChip: {text: string; at: number; to: number};
  controlChip?: {text: string; at: number; to: number; color: string};
  // order block drawn on the last extreme before the break (point 5)
  zone: {color: string; tint: string; at: number; label1: {text: string; at: number}; label2: {text: string; at: number}};
  confirmChip?: {text: string; at: number; to: number};
};

// One MSB drawing: the path grows with s(t), labels and zones appear on cue.
const MsbScene: React.FC<{t: number; pts: Pt[]; s: number; bullish: boolean; labels: Labels}> = ({t, pts, s, bullish, labels}) => {
  const lvl = pts[4][1];
  const cx = crossX(pts[5], pts[6], lvl);
  const crossS = 5 + (cx - pts[5][0]) / (pts[6][0] - pts[5][0]);
  // the MSB line reaches the break first, then extends right as price goes on
  const msbGrow = interpolate(s, [4.2, crossS, 7], [0, (cx + 40 - pts[4][0]) / (1020 - pts[4][0]), 1], clamp);
  const z = labels.zone;
  const zy = pts[5][1];
  const zTop = bullish ? zy - 74 : zy - 16;
  const zBot = bullish ? zy + 16 : zy + 74;
  const zX = pts[5][0] - 60;
  const retestO = s >= 6.98 ? appear(t, labels.swing[3].at, 0.3) : 0;
  const zoneO = appear(t, z.at, 0.4);
  const end = pointAt(pts, s);
  const prev = pointAt(pts, Math.max(0, s - 0.15));
  const breakO = win(t, labels.breakChip.at, labels.breakChip.to, 0.25);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      {/* supply / demand zone */}
      {zoneO > 0 ? (
        <g opacity={zoneO}>
          <rect x={zX} y={zTop} width={1020 - zX} height={zBot - zTop} fill={z.tint} stroke={z.color} strokeWidth={2.4} rx={4} />
          <text x={1008} y={zTop + 34} textAnchor="end" fontFamily={FONT} fontWeight={700} fontSize={28} fill={z.color} letterSpacing="0.08em" opacity={appear(t, z.label1.at)}>
            {z.label1.text}
          </text>
          <text x={1008} y={zTop + 66} textAnchor="end" fontFamily={FONT} fontWeight={700} fontSize={28} fill={C.gold} letterSpacing="0.08em" opacity={appear(t, z.label2.at)}>
            {z.label2.text}
          </text>
        </g>
      ) : null}
      {/* MSB level */}
      {msbGrow > 0 ? (
        <g>
          <line x1={pts[4][0]} x2={pts[4][0] + (1020 - pts[4][0]) * msbGrow} y1={lvl} y2={lvl} stroke={C.red} strokeWidth={3} />
          <text x={(pts[4][0] + cx) / 2 + 20} y={bullish ? lvl + 40 : lvl - 16} textAnchor="middle" fontFamily={DISPLAY} fontWeight={800} fontSize={34} fill={C.red} opacity={appear(t, labels.msbAt)} letterSpacing="0.06em">
            MSB
          </text>
        </g>
      ) : null}
      {/* the retest touches the MSB line and is rejected */}
      {retestO > 0 ? (
        <g opacity={retestO}>
          <circle cx={pts[7][0]} cy={lvl} r={18 + 10 * Math.abs(Math.sin(t * 5))} fill="none" stroke={C.gold} strokeWidth={3} />
          <text x={pts[7][0] + 34} y={bullish ? lvl + 44 : lvl - 26} fontFamily={FONT} fontWeight={700} fontSize={26} fill={C.gold} letterSpacing="0.06em">
            RETESTEO
          </text>
        </g>
      ) : null}
      {/* price path */}
      <path d={pathTo(pts, s)} fill="none" stroke={C.white} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
      {s > 0 && s < pts.length - 1 ? <circle cx={end[0]} cy={end[1]} r={9} fill={C.gold} /> : null}
      <Arrow from={prev} to={end} o={s >= pts.length - 1.05 ? 1 : 0} color={bullish ? C.green : C.red} />
      {/* swing labels */}
      {labels.swing.map((sw) => {
        const o = s >= sw.i ? appear(t, sw.at) : 0;
        if (o <= 0) return null;
        const [x, y] = pts[sw.i];
        const isBreak = sw.text === 'LL' || sw.text === 'HH';
        return (
          <g key={`${sw.i}-${sw.text}`}>
            <circle cx={x} cy={y} r={7} fill={isBreak ? C.red : C.white} opacity={o} />
            <Pill x={sw.side ? x - 70 : x} y={sw.side ? y : sw.below ? y + 50 : y - 50} text={sw.text} o={o} color={isBreak ? C.red : C.white} size={32} />
          </g>
        );
      })}
      {labels.controlChip ? (
        <Pill x={330} y={620} text={labels.controlChip.text} o={win(t, labels.controlChip.at, labels.controlChip.to)} color={labels.controlChip.color} size={28} />
      ) : null}
      <Pill x={780} y={620} text={labels.breakChip.text} o={breakO} color={C.red} size={28} />
      {labels.confirmChip ? (
        <Pill x={780} y={620} text={labels.confirmChip.text} o={win(t, labels.confirmChip.at, labels.confirmChip.to)} color={C.gold} size={28} />
      ) : null}
    </svg>
  );
};

const bearS = (t: number) => interpolate(t, [14.27, 20.2, 22.1, 24.4, 26.98, 29.6, 33.67, 35.6], [0, 5, 5, 6, 6, 7, 7, 8], clamp);
const bullS = (t: number) => interpolate(t, [40.71, 44.4, 44.62, 47.1, 52.31, 54.6, 55.46, 57.6], [0, 5, 5, 6, 6, 7, 7, 8], clamp);

const BEAR_LABELS: Labels = {
  swing: [
    {i: 2, text: 'HL', at: 17.2, below: true},
    {i: 4, text: 'HL', at: 18.6, below: true},
    {i: 6, text: 'LL', at: 24.6, below: true},
    {i: 7, text: 'LH', at: 30.44, below: false, side: true},
  ],
  msbAt: 23.6,
  breakChip: {text: 'ENVOLVENTE BAJISTA', at: 24.7, to: 26.9},
  controlChip: {text: 'COMPRADORES EN CONTROL', at: 20.46, to: 22.0, color: C.green},
  zone: {color: C.red, tint: 'rgba(240,70,90,0.16)', at: 24.9, label1: {text: 'ORDER BLOCK', at: 25.2}, label2: {text: 'TECHO', at: 26.98}},
  confirmChip: {text: 'CONFIRMACIÓN', at: 35.3, to: 37.2},
};
const BULL_LABELS: Labels = {
  swing: [
    {i: 2, text: 'LH', at: 42.8, below: false},
    {i: 4, text: 'LH', at: 43.8, below: false},
    {i: 6, text: 'HH', at: 47.78, below: false},
    {i: 7, text: 'HL', at: 52.31, below: true, side: true},
  ],
  msbAt: 46.4,
  breakChip: {text: 'ENVOLVENTE ALCISTA', at: 50.95, to: 52.2},
  zone: {color: C.green, tint: 'rgba(38,194,129,0.16)', at: 48.2, label1: {text: 'ORDER BLOCK', at: 48.5}, label2: {text: 'PISO', at: 52.31}},
  confirmChip: {text: 'HACIA ARRIBA', at: 56.8, to: 58.4},
};

// --- intro, definition, mirror and close ----------------------------------------
const Intro: React.FC<{t: number}> = ({t}) => {
  const s = interpolate(t, [0.9, 4.3], [0, 6.4], clamp);
  const dim = interpolate(t, [5.5, 6.0], [1, 0.22], clamp);
  const flash = win(t, 4.39, 5.6, 0.2);
  const big = appear(t, 5.78, 0.4);
  return (
    <>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity: dim}}>
        <line x1={BEAR[4][0]} x2={1000} y1={BEAR[4][1]} y2={BEAR[4][1]} stroke={C.red} strokeWidth={3} opacity={flash} />
        <path d={pathTo(BEAR, s)} fill="none" stroke={C.white} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, top: 760, textAlign: 'center', opacity: big, transform: `scale(${0.9 + big * 0.1})`}}>
        <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 230, lineHeight: 1, color: C.red, letterSpacing: '0.02em'}}>MSB</div>
        <Kicker size={30} style={{marginTop: 18}}>
          Market Structure Break
        </Kicker>
      </div>
    </>
  );
};

const Definition: React.FC<{t: number}> = ({t}) => {
  const seq = ['HL', 'HL', 'HL'];
  const broken = appear(t, 10.2, 0.3);
  const hands = appear(t, 11.36, 0.4);
  const flow = interpolate(t, [12.0, 13.4], [0, 1], clamp);
  return (
    <div style={{position: 'absolute', left: 60, width: 880, top: 640}}>
      <Kicker size={24} color={C.muted}>
        La secuencia
      </Kicker>
      <div style={{display: 'flex', gap: 18, alignItems: 'center', marginTop: 22}}>
        {seq.map((s, i) => {
          const o = appear(t, 8.0 + i * 0.55);
          return (
            <React.Fragment key={i}>
              <div style={{opacity: o, border: `1.6px solid ${C.white}`, borderRadius: 40, padding: '10px 26px', fontSize: 34, fontWeight: 600}}>{s}</div>
              <div style={{opacity: o, color: C.muted, fontSize: 34}}>→</div>
            </React.Fragment>
          );
        })}
        <div style={{opacity: broken, border: `1.6px solid ${C.red}`, color: C.red, borderRadius: 40, padding: '10px 26px', fontSize: 34, fontWeight: 700}}>LL ✕</div>
      </div>
      <div style={{marginTop: 70, opacity: hands}}>
        <Kicker size={24} color={C.muted}>
          El control cambia de manos
        </Kicker>
        <div style={{display: 'flex', alignItems: 'center', gap: 20, marginTop: 22, fontFamily: DISPLAY, fontWeight: 800, fontSize: 52}}>
          <span style={{color: C.green, opacity: 1 - flow * 0.6}}>COMPRADORES</span>
          <span style={{color: C.gold, transform: `translateX(${flow * 14}px)`}}>→</span>
          <span style={{color: C.red, opacity: 0.4 + flow * 0.6}}>VENDEDORES</span>
        </div>
      </div>
    </div>
  );
};

// "funciona al revés": the finished bearish drawing flips vertically.
const Mirror: React.FC<{t: number}> = ({t}) => {
  const k = interpolate(t, [38.0, 39.7], [1, -1], {...clamp, easing: (x) => 0.5 - Math.cos(Math.PI * x) / 2});
  const lbl = win(t, 37.9, 40.3, 0.25);
  const lvl = BEAR[4][1];
  return (
    <>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
        <g transform={`translate(0 ${MID_Y}) scale(1 ${k}) translate(0 ${-MID_Y})`}>
          <line x1={BEAR[4][0]} x2={1020} y1={lvl} y2={lvl} stroke={C.red} strokeWidth={3} />
          <path d={pathTo(BEAR, 8)} fill="none" stroke={C.white} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
        </g>
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, top: 600, textAlign: 'center', opacity: lbl}}>
        <span style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 56, color: C.gold, letterSpacing: '0.06em'}}>AL REVÉS ↕</span>
      </div>
    </>
  );
};

const Close: React.FC<{t: number}> = ({t}) => {
  const a = appear(t, 58.63, 0.35);
  const b = appear(t, 60.3, 0.35);
  const c = appear(t, 62.0, 0.35);
  const bars = [0.25, 0.3, 0.22, 0.28, 1.0, 0.9, 0.75];
  const outro = appear(t, 64.6, 0.4);
  const card = (label: string, value: string, color: string, o: number) => (
    <div style={{opacity: o, transform: `translateY(${(1 - o) * 20}px)`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1.6px solid ${color}`, borderRadius: 18, padding: '20px 30px', marginBottom: 20}}>
      <span style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 46, color}}>{label}</span>
      <span style={{fontSize: 34, fontWeight: 600, color: C.text}}>{value}</span>
    </div>
  );
  return (
    <div style={{position: 'absolute', left: 60, width: 880, top: 600}}>
      {card('RUPTURA', 'te avisa', C.red, a)}
      {card('RETESTEO', 'te confirma', C.gold, b)}
      <div style={{opacity: c, display: 'flex', alignItems: 'flex-end', gap: 14, height: 190, marginTop: 30}}>
        {bars.map((h, i) => {
          const g = interpolate(t, [62.2 + i * 0.15, 62.7 + i * 0.15], [0, 1], clamp);
          return <div key={i} style={{flex: 1, height: `${h * 100 * g}%`, borderRadius: 6, background: i >= 4 ? C.green : C.gray}} />;
        })}
        <div style={{alignSelf: 'center', fontFamily: DISPLAY, fontWeight: 800, fontSize: 40, color: C.green, marginLeft: 10, width: 240}}>+ VOLUMEN</div>
      </div>
      <div style={{opacity: outro, display: 'flex', alignItems: 'center', gap: 22, marginTop: 34}}>
        <div style={{display: 'flex', gap: 8, flex: 1}}>
          {new Array(10).fill(0).map((_, i) => (
            <div key={i} style={{flex: 1, height: 14, borderRadius: 7, background: i < 4 ? C.gold : C.line}} />
          ))}
        </div>
        <span style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 44}}>
          4<span style={{color: C.muted}}>/10</span>
        </span>
      </div>
    </div>
  );
};

export const Reel04: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  return (
    <ReelFrame num={4} title={TITLE}>
      <Audio src={staticFile('audio/reel-04.m4a')} />
      <div style={{position: 'absolute', inset: 0, opacity: win(t, 0.4, 7.7, 0.3)}}>
        <Intro t={t} />
      </div>
      <div style={{position: 'absolute', inset: 0, opacity: win(t, 7.95, 14.15, 0.25)}}>
        <Definition t={t} />
      </div>
      <div style={{position: 'absolute', inset: 0, opacity: win(t, 14.3, 37.75, 0.25)}}>
        <MsbScene t={t} pts={BEAR} s={bearS(t)} bullish={false} labels={BEAR_LABELS} />
      </div>
      <div style={{position: 'absolute', inset: 0, opacity: win(t, 37.85, 40.45, 0.15)}}>
        <Mirror t={t} />
      </div>
      <div style={{position: 'absolute', inset: 0, opacity: win(t, 40.6, 58.45, 0.25)}}>
        <MsbScene t={t} pts={BULL} s={bullS(t)} bullish labels={BULL_LABELS} />
      </div>
      <div style={{position: 'absolute', inset: 0, opacity: interpolate(t, [58.4, 58.7], [0, 1], clamp)}}>
        <Close t={t} />
      </div>
      <Subtitles pages={pages} size={52} />
    </ReelFrame>
  );
};

// Static cover: the bearish MSB fully drawn.
export const Reel04Cover: React.FC = () => (
  <ReelFrame num={4} title={TITLE} still>
    <MsbScene t={36} pts={BEAR} s={8} bullish={false} labels={{...BEAR_LABELS, confirmChip: undefined}} />
  </ReelFrame>
);
