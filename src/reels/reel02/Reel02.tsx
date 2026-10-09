import React from 'react';
import {Audio, interpolate, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Kicker} from '../../components/ui';
import {C, DISPLAY} from '../../theme';
import {FaceCam} from '../components/FaceCam';
import {Highlight, OrderflowSection, Phase, livePressure} from '../components/Orderflow';
import {ReelFrame, ZONE} from '../ReelFrame';
import {Page, Subtitles} from '../Subtitles';

// Timings (seconds) come from the voice track public/audio/reel-02.m4a.
export const REEL02_SECONDS = 44.5;
const TITLE = 'Fuerza y presión en cada vela';
// Title block leaves room for the face cam circle on the right.
const FRAME = {titleRight: 380, titleSize: 76, kickerSize: 22};
const FACE = {src: 'video/reel-02-cara.mp4', left: 716, top: 222, size: 304};

const pages: Page[] = [
  {from: 0.98, to: 3.24, text: 'Cuando analizamos el mercado en tiempo real,'},
  {from: 3.31, to: 6.6, text: 'necesitamos entender que esa *fuerza* que tiene el precio'},
  {from: 6.6, to: 8.5, text: 'se ve en el *cuerpo* de la vela.'},
  {from: 8.58, to: 10.8, text: 'Cuando una vela tiene un *cuerpo muy grande*,'},
  {from: 10.8, to: 14.33, text: 'hacemos referencia a que ese movimiento tiene *gran fuerza*'},
  {from: 14.4, to: 16.15, text: 'y que tiene una *intención de continuar*.'},
  {from: 16.33, to: 19.9, text: 'Asimismo, cuando el precio tiene una *presión contraria*'},
  {from: 19.9, to: 22.06, text: 'y hay una *fuerza* que está dominando'},
  {from: 22.06, to: 24.74, text: 'y que no se ve visualmente en la vela,'},
  {from: 24.89, to: 27.6, text: 'hacemos énfasis en las *mechas* o los *spikes*.'},
  {from: 27.6, to: 30.95, text: 'La *presión* que tienen las mechas demuestra'},
  {from: 31.12, to: 35.37, text: 'qué tanta *intensidad* hay en ir en contra de un movimiento.'},
  // 35.7–41.6 is shown as the "next video" card in the visual zone instead of a subtitle.
];

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const win = (t: number, a: number, b: number, fade = 0.35) =>
  interpolate(t, [a - fade, a, b, b + fade], [0, 1, 1, 0], clamp);

// Fast footprint candles. Indices are referenced by the highlights below.
const phases: Phase[] = [
  // 0–3: mixed, small candles
  {from: 0.5, to: 3.3, pressure: 0, candles: [[-3, -2, -4, -3], [-3, -2, -4, -2], [-2, -1, -3, -3], [-3, -2, -4, -2]]},
  // 4–8: force up, big bodies
  {from: 3.3, to: 8.5, pressure: 0.85, candles: [[-2, 1, -2, 1], [1, 5, 1, 5], [5, 8, 4, 8], [8, 10, 7, 10], [10, 11, 9, 11]]},
  // 9–14: force down, huge bodies that keep going
  {from: 8.58, to: 16.15, pressure: -0.85, candles: [[11, 12, 10, 10], [10, 10, 5, 5], [5, 6, 2, 2], [2, 3, -2, -2], [-2, -1, -4, -4], [-4, -3, -5, -4]]},
  // 15–20: spikes and aggressive reversals (wick, then big bodies the other way)
  {
    from: 16.33, to: 24.8, pressure: 0, autoPressure: true,
    candles: [[-4, -3, -6, -3], [-3, 1, -3, 1], [1, 5, 1, 4], [4, 9, 4, 5], [5, 5, 1, 1], [1, 2, -3, -2]],
  },
  // 21–27: more spikes against the move, each one reversed hard
  {
    from: 24.89, to: 35.4, pressure: 0, autoPressure: true,
    candles: [[-2, -1, -6, -1], [-1, 4, -1, 4], [4, 10, 4, 5], [5, 5, 0, 0], [0, 1, -5, -1], [-1, 4, -1, 3], [3, 4, 2, 3]],
  },
];

const highlights: Highlight[] = [
  {from: 6.6, to: 8.5, idx: 5, kind: 'body', label: 'CUERPO = FUERZA'},
  {from: 11.2, to: 14.3, idx: 10, kind: 'body', label: 'CUERPO GRANDE'},
  {from: 14.4, to: 16.15, idx: 12, kind: 'body', label: 'CONTINÚA'},
  {from: 17.8, to: 19.85, idx: 15, kind: 'wick', label: 'PRESIÓN CONTRARIA'},
  {from: 19.9, to: 21.95, idx: 16, kind: 'body', label: 'REVERSIÓN'},
  {from: 22.0, to: 24.7, idx: 18, kind: 'wick', label: 'NO SE VE EN EL CUERPO'},
  {from: 24.9, to: 27.6, idx: 21, kind: 'wick', label: 'SPIKE'},
  {from: 27.95, to: 30.95, idx: 22, kind: 'body', label: 'REVERSIÓN AGRESIVA'},
  {from: 31.1, to: 35.3, idx: 23, kind: 'wick', label: 'INTENSIDAD EN CONTRA'},
];

const pressure = (t: number) => {
  const base = interpolate(t, [0.6, 3.2, 3.7, 8.4, 8.9, 16.0], [0, 0, 0.9, 0.9, -0.9, -0.9], clamp);
  // From the spikes on, the book follows the candles: every reversal flips it.
  const mix = interpolate(t, [16.0, 16.6], [0, 1], clamp);
  const p = base * (1 - mix) + livePressure(phases, t) * mix;
  return Math.max(-1, Math.min(1, p));
};

const states = [
  {word: 'FUERZA', color: C.green, from: 3.31, to: 8.5},
  {word: 'FUERZA', color: C.red, from: 8.58, to: 16.15},
  {word: 'PRESIÓN', color: C.gold, from: 16.33, to: 35.3},
];

const Flow: React.FC<{t: number}> = ({t}) => (
  <OrderflowSection
    t={t}
    phases={phases}
    pressure={pressure}
    levels={[-6, 12]}
    top={620}
    rowH={32}
    states={states}
    wickPressure
    highlights={highlights}
    statePlacement="header"
  />
);

// --- Next video + outro ------------------------------------------------------
const NextVideo: React.FC<{t: number}> = ({t}) => {
  const a = interpolate(t, [35.7, 36.1], [0, 1], clamp);
  const b = interpolate(t, [38.0, 38.4], [0, 1], clamp);
  const bars = new Array(14).fill(0).map((_, i) => 0.25 + random(`vol-${i}`) * 0.75);
  return (
    <div style={{position: 'absolute', left: ZONE.left, width: 880, top: 600}}>
      <div style={{opacity: a}}>
        <Kicker size={28}>Próximo video</Kicker>
        <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 110, lineHeight: 1.0, marginTop: 16, color: C.gold}}>El volumen</div>
      </div>
      <div style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: 52, lineHeight: 1.15, marginTop: 18, opacity: b, transform: `translateY(${(1 - b) * 20}px)`}}>
        Cómo integra esta <span style={{color: C.green}}>fuerza</span> y esta <span style={{color: C.red}}>presión</span> en el gráfico.
      </div>
      <div style={{display: 'flex', alignItems: 'flex-end', gap: 14, height: 170, marginTop: 40}}>
        {bars.map((h, i) => {
          const g = interpolate(t, [36.2 + i * 0.12, 36.8 + i * 0.12], [0, 1], clamp);
          return <div key={i} style={{flex: 1, height: `${h * 100 * g}%`, borderRadius: 6, background: i % 3 === 1 ? C.red : C.green, opacity: 0.85}} />;
        })}
      </div>
    </div>
  );
};

const Outro: React.FC<{t: number}> = ({t}) => {
  const a = interpolate(t, [41.7, 42.1], [0, 1], clamp);
  return (
    <div style={{position: 'absolute', left: ZONE.left, width: 880, top: 680, opacity: a}}>
      <Kicker size={28}>Seguí la serie</Kicker>
      <div style={{display: 'flex', gap: 12, marginTop: 34}}>
        {new Array(10).fill(0).map((_, i) => (
          <div key={i} style={{flex: 1, height: 18, borderRadius: 9, background: i < 2 ? C.gold : C.line}} />
        ))}
      </div>
      <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 120, marginTop: 40}}>
        2<span style={{color: C.muted}}>/10</span>
      </div>
      <div style={{marginTop: 50}}>
        <Kicker size={30}>Bull Army</Kicker>
      </div>
    </div>
  );
};

export const Reel02: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const oFlow = win(t, 0.3, 35.45, 0.3);
  const oNext = win(t, 35.7, 41.5, 0.3);
  const oOutro = interpolate(t, [41.6, 42.0], [0, 1], clamp);
  return (
    <ReelFrame num={2} title={TITLE} {...FRAME}>
      <Audio src={staticFile('audio/reel-02.m4a')} />
      <FaceCam {...FACE} />
      {oFlow > 0 ? (
        <div style={{position: 'absolute', inset: 0, opacity: oFlow}}>
          <Flow t={t} />
        </div>
      ) : null}
      {oNext > 0 ? (
        <div style={{position: 'absolute', inset: 0, opacity: oNext}}>
          <NextVideo t={t} />
        </div>
      ) : null}
      {oOutro > 0 ? (
        <div style={{position: 'absolute', inset: 0, opacity: oOutro}}>
          <Outro t={t} />
        </div>
      ) : null}
      <Subtitles pages={pages} />
    </ReelFrame>
  );
};

// Static cover: the big-body candle highlighted.
export const Reel02Cover: React.FC = () => (
  <ReelFrame num={2} title={TITLE} {...FRAME} still>
    <FaceCam {...FACE} still trimBefore={300} />
    <Flow t={12.5} />
    <div
      style={{
        position: 'absolute',
        left: ZONE.left,
        right: 140,
        top: 1300,
        textAlign: 'center',
        fontFamily: DISPLAY,
        fontWeight: 800,
        fontSize: 60,
        color: C.gold,
      }}
    >
      La fuerza está en el cuerpo.
    </div>
  </ReelFrame>
);
