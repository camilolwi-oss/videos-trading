import React from 'react';
import {Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Kicker} from '../../components/ui';
import {C, DISPLAY} from '../../theme';
import {Cube3D} from '../components/Cube3D';
import {Highlight, OrderflowSection, Phase, RangeBox, livePressure} from '../components/Orderflow';
import {SplitFrame} from '../SplitFrame';
import {Page, Subtitles} from '../Subtitles';

// Timings (seconds) come from the voice track public/audio/reel-03.m4a.
export const REEL03_SECONDS = 50.5;
const TITLE = 'Volumen: la tercera dimensión';
const FACE = 'video/reel-03-cara.mp4';
const SUBS = {top: 818, size: 46};

const pages: Page[] = [
  {from: 1.15, to: 3.7, text: 'Así como existe el *tiempo* y el *precio*,'},
  {from: 3.7, to: 6.49, text: 'el *volumen* nos da una perspectiva diferente.'},
  {from: 6.6, to: 8.76, text: 'El volumen es *participación* en el mercado.'},
  {from: 8.91, to: 11.6, text: 'Sin volumen no tendremos un *sesgo* en el mercado.'},
  {from: 11.93, to: 16.35, text: 'Por eso, cuando el mercado se encuentra en una *lateralización* o rango,'},
  {from: 16.6, to: 20.7, text: 'el volumen suele ser *descendente*: hay menos participantes.'},
  {from: 21.11, to: 25.2, text: 'Asimismo, necesitamos el volumen para que haya *rupturas* en un nivel'},
  {from: 25.45, to: 27.26, text: 'y haya una *continuación* en la tendencia.'},
  {from: 27.69, to: 29.6, text: 'Sin volumen, o con un volumen'},
  {from: 29.6, to: 32.95, text: 'donde solo participa una *pequeña cantidad* de participantes,'},
  {from: 33.21, to: 35.43, text: 'tendremos *falsos movimientos* en el mercado.'},
  {from: 35.71, to: 39.1, text: 'Necesitamos el volumen para poder *montarnos* en un movimiento,'},
  {from: 39.1, to: 41.03, text: 'sea de *tendencia* o de *reversión*.'},
  {from: 41.38, to: 43.45, text: 'Siempre que veas un gráfico, recordá'},
  {from: 43.72, to: 46.75, text: 'qué *cantidad de participantes* hay en ese activo financiero:'},
  {from: 46.95, to: 47.74, text: '¿cómo está el *volumen*?'},
  {from: 48.1, to: 49.6, text: '¡Gracias por *apoyarnos*!'},
];

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const win = (t: number, a: number, b: number, fade = 0.35) =>
  interpolate(t, [a - fade, a, b, b + fade], [0, 1, 1, 0], clamp);

// --- Candles + volume ----------------------------------------------------------
// idx 0–2 no bias, 3–9 range, 10–13 breakout, 14–19 fakeout, 20–23 reversal.
const phases: Phase[] = [
  {from: 8.9, to: 11.9, pressure: 0, autoPressure: true, candles: [[0, 1, -1, -1], [-1, 0, -2, 0], [0, 1, -1, -1]], volumes: [0.35, 0.3, 0.3]},
  {
    from: 11.93, to: 20.7, pressure: 0, autoPressure: true,
    candles: [[-1, 0, -3, -2], [-2, 0, -3, -1], [-1, 0, -2, -2], [-2, -1, -3, -1], [-1, 0, -2, -1], [-1, 0, -2, -2], [-2, -1, -3, -1]],
    volumes: [0.75, 0.62, 0.5, 0.4, 0.3, 0.22, 0.15],
  },
  {from: 21.11, to: 27.26, pressure: 0, autoPressure: true, candles: [[-1, 2, -1, 2], [2, 4, 1, 4], [4, 5, 3, 5], [5, 6, 4, 6]], volumes: [0.88, 1.0, 0.95, 0.85]},
  {
    from: 27.69, to: 35.43, pressure: 0, autoPressure: true,
    candles: [[6, 6, 4, 5], [5, 6, 4, 5], [5, 6, 4, 5], [5, 8, 5, 8], [8, 8, 4, 4], [4, 5, 3, 4]],
    volumes: [0.22, 0.18, 0.16, 1.0, 0.2, 0.18],
  },
  {from: 35.71, to: 41.03, pressure: 0, autoPressure: true, candles: [[4, 4, 1, 1], [1, 2, -2, -2], [-2, -1, -4, -3], [-3, -2, -4, -3]], volumes: [0.85, 1.0, 0.9, 0.6]},
];

const boxes: RangeBox[] = [{from: 12.6, to: 21.4, i0: 3, i1: 9, lo: -3, hi: 0, label: 'RANGO · SIN SESGO'}];

const highlights: Highlight[] = [
  {from: 19.5, to: 20.9, idx: 8, kind: 'volume', label: 'DESCENDENTE'},
  {from: 21.3, to: 24.15, idx: 10, kind: 'body', label: 'RUPTURA'},
  {from: 24.2, to: 27.3, idx: 11, kind: 'volume', label: 'PARTICIPACIÓN TOTAL'},
  {from: 30.3, to: 31.5, idx: 15, kind: 'volume', label: 'VOLUMEN BAJO'},
  {from: 31.6, to: 33.15, idx: 17, kind: 'volume', label: 'VOLUMEN ANORMAL'},
  {from: 33.21, to: 35.43, idx: 17, kind: 'body', label: 'FAKEOUT'},
  {from: 38.4, to: 41.0, idx: 21, kind: 'volume', label: 'VOLUMEN QUE ACOMPAÑA'},
];

const states = [
  {word: 'SIN SESGO', color: C.muted, from: 8.91, to: 11.9},
  {word: 'VOLUMEN ↓', color: C.gold, from: 16.6, to: 20.7},
  {word: 'RUPTURA', color: C.green, from: 21.11, to: 27.26},
  {word: 'POCO VOLUMEN', color: C.muted, from: 27.69, to: 33.0},
  {word: 'FALSO MOV.', color: C.red, from: 33.21, to: 35.43},
  {word: 'REVERSIÓN', color: C.red, from: 35.71, to: 41.0},
];

const pressure = (t: number) => livePressure(phases, t);

const Flow: React.FC<{t: number}> = ({t}) => (
  <OrderflowSection
    t={t}
    phases={phases}
    pressure={pressure}
    levels={[-4, 8]}
    top={992}
    rowH={24}
    states={states}
    statePlacement="header"
    wickPressure
    highlights={highlights}
    boxes={boxes}
    volumeHeight={140}
  />
);

// --- Cube scenes -----------------------------------------------------------------
const CUBE = {cx: 540, cy: 1200, r: 118};

const CubeIntro: React.FC<{t: number}> = ({t}) => {
  const time = interpolate(t, [1.85, 2.35], [0, 1], clamp);
  const price = interpolate(t, [2.65, 3.15], [0, 1], clamp);
  const volume = interpolate(t, [3.8, 4.5], [0, 1], clamp);
  const dots = interpolate(t, [6.6, 8.6], [0, 1], clamp);
  // Turn only within the range where the three axis labels stay apart.
  const angle = 0.5 + interpolate(t, [3.8, 6.4], [0, 0.75], {...clamp, easing: (x) => 1 - Math.pow(1 - x, 3)}) + 0.06 * Math.sin(t * 0.9);
  const lbl = interpolate(t, [6.6, 7.0], [0, 1], clamp);
  return (
    <>
      <Cube3D {...CUBE} angle={angle} time={time} price={price} volume={volume} dots={dots} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 1415, textAlign: 'center', opacity: lbl}}>
        <span style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 40, color: C.gold, letterSpacing: '0.04em'}}>VOLUMEN = PARTICIPACIÓN</span>
      </div>
    </>
  );
};

const CubeOutro: React.FC<{t: number}> = ({t}) => {
  const dots = interpolate(t, [43.72, 46.6], [0.1, 1], clamp);
  const angle = 1.0 + 0.22 * Math.sin((t - 41.4) * 0.9);
  const q1 = interpolate(t, [43.72, 44.1], [0, 1], clamp);
  const q2 = interpolate(t, [46.95, 47.3], [0, 1], clamp);
  return (
    <>
      <Cube3D {...CUBE} angle={angle} time={1} price={1} volume={1} dots={dots} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 1415, textAlign: 'center'}}>
        <span style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 38, color: C.gold, opacity: q2 > 0 ? q2 : q1}}>
          {q2 > 0 ? '¿CÓMO ESTÁ EL VOLUMEN?' : '¿CUÁNTOS PARTICIPAN?'}
        </span>
      </div>
    </>
  );
};

const Outro: React.FC<{t: number}> = ({t}) => {
  const a = interpolate(t, [48.0, 48.4], [0, 1], clamp);
  return (
    <div style={{position: 'absolute', left: 60, width: 880, top: 1010, opacity: a}}>
      <Kicker size={28}>Seguí la serie</Kicker>
      <div style={{display: 'flex', gap: 12, marginTop: 30}}>
        {new Array(10).fill(0).map((_, i) => (
          <div key={i} style={{flex: 1, height: 18, borderRadius: 9, background: i < 3 ? C.gold : C.line}} />
        ))}
      </div>
      <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 120, marginTop: 30}}>
        3<span style={{color: C.muted}}>/10</span>
      </div>
      <div style={{marginTop: 24}}>
        <Kicker size={30}>Bull Army</Kicker>
      </div>
    </div>
  );
};

export const Reel03: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const oCube1 = win(t, 0.3, 8.75, 0.3);
  const oFlow = win(t, 9.05, 41.1, 0.3);
  const oCube2 = win(t, 41.45, 47.8, 0.3);
  const oOutro = interpolate(t, [47.95, 48.35], [0, 1], clamp);
  return (
    <SplitFrame num={3} title={TITLE} faceSrc={FACE}>
      <Audio src={staticFile('audio/reel-03.m4a')} />
      {oCube1 > 0 ? (
        <div style={{position: 'absolute', inset: 0, opacity: oCube1}}>
          <CubeIntro t={t} />
        </div>
      ) : null}
      {oFlow > 0 ? (
        <div style={{position: 'absolute', inset: 0, opacity: oFlow}}>
          <Flow t={t} />
        </div>
      ) : null}
      {oCube2 > 0 ? (
        <div style={{position: 'absolute', inset: 0, opacity: oCube2}}>
          <CubeOutro t={t} />
        </div>
      ) : null}
      {oOutro > 0 ? (
        <div style={{position: 'absolute', inset: 0, opacity: oOutro}}>
          <Outro t={t} />
        </div>
      ) : null}
      <Subtitles pages={pages} {...SUBS} />
    </SplitFrame>
  );
};

// Static cover: face on top, the cube with its three axes below.
export const Reel03Cover: React.FC = () => (
  <SplitFrame num={3} title={TITLE} faceSrc={FACE} faceTrimBefore={420} still>
    <Cube3D {...CUBE} angle={1.15} time={1} price={1} volume={1} dots={0.6} />
    <div style={{position: 'absolute', left: 0, right: 0, top: 860, textAlign: 'center', fontFamily: DISPLAY, fontWeight: 800, fontSize: 52, color: C.gold}}>
      El volumen es participación
    </div>
  </SplitFrame>
);
