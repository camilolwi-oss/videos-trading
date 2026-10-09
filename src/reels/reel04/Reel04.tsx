import React from 'react';
import {Audio, interpolate, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Kicker} from '../../components/ui';
import {C, DISPLAY, FONT} from '../../theme';
import {SplitFrame} from '../SplitFrame';
import {Page, Subtitles} from '../Subtitles';

// Timings (seconds) come from the voice of the webcam recording
// (public/audio/reel-04.m4a, video public/video/reel-04-cara.mp4).
export const REEL04_SECONDS = 47.5;
const TITLE = 'MSB: quiebre de estructura';
const FACE = 'video/reel-04-cara.mp4';
const SUBS = {top: 985, size: 46};

const pages: Page[] = [
  {from: 0.72, to: 4.01, text: 'Cuando el mercado está en una *tendencia alcista*, es decir,'},
  {from: 4.12, to: 6.8, text: 'hace *mínimos más altos* y *máximos más altos*,'},
  {from: 6.88, to: 8.41, text: 'existen *señales de debilidad*,'},
  {from: 8.58, to: 11.64, text: 'como por ejemplo que el precio haga un *mínimo más bajo*.'},
  {from: 11.75, to: 14.87, text: 'En este tipo de situaciones, el precio va a intentar *recuperar el nivel*,'},
  {from: 15.34, to: 18.07, text: 'y al *fallarlo*, queremos ver un volumen'},
  {from: 18.23, to: 20.14, text: 'por *encima del promedio*'},
  {from: 20.22, to: 21.5, text: 'para confirmarnos un *quiebre*'},
  {from: 21.5, to: 22.74, text: 'y una continuación *bajista*.'},
  {from: 23.82, to: 25.08, text: 'Lo mismo en *sentido contrario*:'},
  {from: 25.18, to: 28.1, text: 'tenemos *mínimos más bajos*, y el precio'},
  {from: 28.36, to: 30.81, text: 'intenta recuperar el *previo máximo* antes de que marquemos el *piso*.'},
  {from: 31.0, to: 32.16, text: 'Si se utiliza ese nivel'},
  {from: 32.23, to: 34.5, text: 'como un *punto de rebote*, vamos a tener'},
  {from: 34.5, to: 36.4, text: 'que ver *volumen por encima del promedio*'},
  {from: 36.4, to: 38.28, text: 'para ver una *continuación* en el movimiento.'},
  {from: 38.71, to: 40.58, text: 'Esto es algo que nos define'},
  {from: 40.9, to: 43.18, text: 'cómo operar un *cambio de tendencia*.'},
  {from: 43.4, to: 44.64, text: 'Si te gustó, *apoyanos*.'},
  {from: 44.72, to: 46.33, text: '¡Nos vemos en el próximo video!'},
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
// Drawn in the top half of the split screen (y 460–840).
const BEAR: Pt[] = [[90, 810], [230, 620], [320, 730], [450, 547], [540, 669], [660, 460], [770, 775], [860, 669], [990, 840]];
// Bullish MSB: the mirror image around the middle of the drawing.
const MID_Y = 650;
const CHIP_Y = 372;
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
  const retestAt = labels.swing.find((sw) => sw.i === 7)?.at ?? 0;
  const retestO = s >= 6.98 ? appear(t, retestAt, 0.3) : 0;
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
        <Pill x={330} y={CHIP_Y} text={labels.controlChip.text} o={win(t, labels.controlChip.at, labels.controlChip.to)} color={labels.controlChip.color} size={28} />
      ) : null}
      <Pill x={760} y={CHIP_Y} text={labels.breakChip.text} o={breakO} color={bullish ? C.green : C.red} size={28} />
      {labels.confirmChip ? (
        <Pill x={760} y={CHIP_Y} text={labels.confirmChip.text} o={win(t, labels.confirmChip.at, labels.confirmChip.to)} color={C.gold} size={28} />
      ) : null}
    </svg>
  );
};

// Path progress (point index) over time, following the voice.
const bearS = (t: number) => interpolate(t, [0.9, 6.8, 8.6, 11.0, 11.9, 14.6, 18.2, 21.6], [0, 5, 5, 6, 6, 7, 7, 8], clamp);
const bullS = (t: number) => interpolate(t, [25.18, 28.1, 28.36, 30.2, 31.0, 33.6, 34.5, 37.4], [0, 5, 5, 6, 6, 7, 7, 8], clamp);

const BEAR_LABELS: Labels = {
  swing: [
    {i: 2, text: 'HL', at: 4.6, below: true},
    {i: 3, text: 'HH', at: 5.4, below: false},
    {i: 4, text: 'HL', at: 5.9, below: true},
    {i: 6, text: 'LL', at: 10.9, below: true},
    {i: 7, text: 'LH', at: 15.34, below: false, side: true},
  ],
  msbAt: 10.4,
  breakChip: {text: 'ENVOLVENTE BAJISTA', at: 10.9, to: 14.8},
  controlChip: {text: 'SEÑALES DE DEBILIDAD', at: 6.88, to: 8.5, color: C.gold},
  zone: {color: C.red, tint: 'rgba(240,70,90,0.16)', at: 11.2, label1: {text: 'ORDER BLOCK', at: 11.5}, label2: {text: 'TECHO', at: 12.2}},
  confirmChip: {text: 'FALLA EL RETESTEO', at: 15.34, to: 18.1},
};
const BULL_LABELS: Labels = {
  swing: [
    {i: 3, text: 'LL', at: 26.4, below: true},
    {i: 4, text: 'LH', at: 27.0, below: false},
    {i: 5, text: 'LL', at: 27.9, below: true, side: true},
    {i: 6, text: 'HH', at: 30.0, below: false},
    {i: 7, text: 'HL', at: 32.23, below: true, side: true},
  ],
  msbAt: 29.6,
  breakChip: {text: 'ENVOLVENTE ALCISTA', at: 29.8, to: 31.8},
  zone: {color: C.green, tint: 'rgba(38,194,129,0.16)', at: 30.3, label1: {text: 'ORDER BLOCK', at: 30.4}, label2: {text: 'PISO', at: 30.5}},
  confirmChip: {text: 'PUNTO DE REBOTE', at: 32.23, to: 34.5},
};

// Volume under the drawing: bars appear as the path passes them; the
// continuation after the failed retest prints volume above the average.
const VOL = {base: 945, max: 66, avg: 0.42};
const VolumeStrip: React.FC<{t: number; pts: Pt[]; s: number; color: string; tagAt: number; tagTo: number}> = ({t, pts, s, color, tagAt, tagTo}) => {
  const n = 26;
  const reach = pointAt(pts, s)[0];
  const tag = win(t, tagAt, tagTo, 0.25);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      <text x={60} y={VOL.base - VOL.max - 6} fontFamily={FONT} fontWeight={600} fontSize={18} fill={C.muted} letterSpacing="0.2em">
        VOLUMEN
      </text>
      {new Array(n).fill(0).map((_, i) => {
        const x = 90 + i * 35.5;
        if (s <= 0 || x > reach) return null;
        const strong = x >= pts[7][0] - 4;
        const mid = x >= pts[5][0] && x < pts[6][0];
        const h = strong ? 0.92 + 0.08 * random(`v4-${i}`) : mid ? 0.5 : 0.22 + 0.18 * random(`v4-${i}`);
        return <rect key={i} x={x} y={VOL.base - h * VOL.max} width={24} height={h * VOL.max} rx={3} fill={strong ? color : C.gray} opacity={strong ? 0.95 : 0.7} />;
      })}
      <line x1={86} x2={1010} y1={VOL.base - VOL.avg * VOL.max} y2={VOL.base - VOL.avg * VOL.max} stroke={C.white} strokeWidth={2} strokeDasharray="6 6" opacity={0.6} />
      {tag > 0 ? <Pill x={340} y={VOL.base - VOL.max - 16} text="VOLUMEN > PROMEDIO" o={tag} color={color} size={22} /> : null}
    </svg>
  );
};

// "Lo mismo en sentido contrario": the finished bearish drawing flips vertically.
const Mirror: React.FC<{t: number}> = ({t}) => {
  const k = interpolate(t, [23.9, 25.0], [1, -1], {...clamp, easing: (x) => 0.5 - Math.cos(Math.PI * x) / 2});
  const lbl = win(t, 23.82, 25.1, 0.2);
  const lvl = BEAR[4][1];
  return (
    <>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
        <g transform={`translate(0 ${MID_Y}) scale(1 ${k}) translate(0 ${-MID_Y})`}>
          <line x1={BEAR[4][0]} x2={1020} y1={lvl} y2={lvl} stroke={C.red} strokeWidth={3} />
          <path d={pathTo(BEAR, 8)} fill="none" stroke={C.white} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
        </g>
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, top: CHIP_Y - 30, textAlign: 'center', opacity: lbl}}>
        <span style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 52, color: C.gold, letterSpacing: '0.06em'}}>SENTIDO CONTRARIO ↕</span>
      </div>
    </>
  );
};

// "Esto es algo que nos define cómo operar un cambio de tendencia" + goodbye.
const Close: React.FC<{t: number}> = ({t}) => {
  const steps = [
    {label: 'QUIEBRE', color: C.red, at: 38.8},
    {label: 'RETESTEO', color: C.gold, at: 39.5},
    {label: 'VOLUMEN', color: C.green, at: 40.2},
  ];
  const big = appear(t, 40.9, 0.4);
  const outro = appear(t, 43.4, 0.4);
  return (
    <div style={{position: 'absolute', left: 60, width: 880, top: 380}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
        {steps.map((st, i) => {
          const o = appear(t, st.at, 0.3);
          return (
            <React.Fragment key={st.label}>
              <div style={{opacity: o, transform: `translateY(${(1 - o) * 16}px)`, border: `2px solid ${st.color}`, color: st.color, borderRadius: 40, padding: '10px 22px', fontFamily: DISPLAY, fontWeight: 800, fontSize: 36}}>
                {st.label}
              </div>
              {i < steps.length - 1 ? <span style={{opacity: o, color: C.muted, fontSize: 36}}>→</span> : null}
            </React.Fragment>
          );
        })}
      </div>
      <div style={{marginTop: 40, opacity: big, transform: `translateY(${(1 - big) * 20}px)`, fontFamily: DISPLAY, fontWeight: 800, fontSize: 76, lineHeight: 1.05}}>
        = <span style={{color: C.gold}}>cambio de tendencia</span>
      </div>
      <div style={{opacity: outro, display: 'flex', alignItems: 'center', gap: 22, marginTop: 50}}>
        <div style={{display: 'flex', gap: 8, flex: 1}}>
          {new Array(10).fill(0).map((_, i) => (
            <div key={i} style={{flex: 1, height: 14, borderRadius: 7, background: i < 4 ? C.gold : C.line}} />
          ))}
        </div>
        <span style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 44}}>
          4<span style={{color: C.muted}}>/10</span>
        </span>
      </div>
      <div style={{opacity: outro, marginTop: 26}}>
        <Kicker size={28}>Bull Army</Kicker>
      </div>
    </div>
  );
};

export const Reel04: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const sB = bearS(t);
  const sU = bullS(t);
  return (
    <SplitFrame num={4} title={TITLE} faceSrc={FACE}>
      <Audio src={staticFile('audio/reel-04.m4a')} />
      <div style={{position: 'absolute', inset: 0, opacity: win(t, 0.6, 23.75, 0.25)}}>
        <MsbScene t={t} pts={BEAR} s={sB} bullish={false} labels={BEAR_LABELS} />
        <VolumeStrip t={t} pts={BEAR} s={sB} color={C.red} tagAt={18.23} tagTo={22.8} />
      </div>
      <div style={{position: 'absolute', inset: 0, opacity: win(t, 23.85, 25.05, 0.12)}}>
        <Mirror t={t} />
      </div>
      <div style={{position: 'absolute', inset: 0, opacity: win(t, 25.1, 38.5, 0.2)}}>
        <MsbScene t={t} pts={BULL} s={sU} bullish labels={BULL_LABELS} />
        <VolumeStrip t={t} pts={BULL} s={sU} color={C.green} tagAt={34.5} tagTo={38.3} />
      </div>
      <div style={{position: 'absolute', inset: 0, opacity: interpolate(t, [38.55, 38.85], [0, 1], clamp)}}>
        <Close t={t} />
      </div>
      <Subtitles pages={pages} {...SUBS} />
    </SplitFrame>
  );
};

// Static cover: the bearish MSB with its order block and retest.
export const Reel04Cover: React.FC = () => (
  <SplitFrame num={4} title={TITLE} faceSrc={FACE} faceTrimBefore={150} still>
    <MsbScene t={16} pts={BEAR} s={8} bullish={false} labels={{...BEAR_LABELS, confirmChip: undefined, controlChip: undefined}} />
    <VolumeStrip t={20} pts={BEAR} s={8} color={C.red} tagAt={19} tagTo={30} />
  </SplitFrame>
);
