import React from 'react';
import {Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {buildCandles} from '../../candles';
import {CandleChart} from '../../components/CandleChart';
import {Kicker} from '../../components/ui';
import {C, DISPLAY} from '../../theme';
import {OrderflowSection, Phase} from '../components/Orderflow';
import {ReelFrame, ZONE} from '../ReelFrame';
import {Page, Subtitles} from '../Subtitles';

// Timings (seconds) come from the voice track public/audio/reel-01.m4a.
export const REEL01_SECONDS = 49;

const pages: Page[] = [
  {from: 0.98, to: 2.9, text: 'Si mirás un gráfico y solo ves *velas*,'},
  {from: 2.9, to: 4.61, text: 'te estás perdiendo lo más *importante*,'},
  {from: 4.79, to: 6.15, text: 'porque el mercado se mueve'},
  {from: 6.42, to: 9.51, text: 'con *compradores* y *vendedores* interactuando todo el tiempo.'},
  {from: 9.84, to: 12.3, text: 'El precio se mueve cuando uno de esos dos lados'},
  {from: 12.3, to: 14.4, text: 'actúa con más *agresividad* que el otro.'},
  {from: 14.54, to: 16.68, text: 'Si los compradores pagan cada vez más caro,'},
  {from: 16.68, to: 17.78, text: 'el precio va a *subir*.'},
  {from: 17.93, to: 19.29, text: 'Si los vendedores se vuelven'},
  {from: 19.45, to: 21.1, text: 'más agresivos, el precio va a *bajar*.'},
  {from: 21.22, to: 22.75, text: 'Y si nadie tiene ventaja,'},
  {from: 22.75, to: 25.13, text: 'el precio se va a mover *sin dirección*.'},
  {from: 25.29, to: 28.36, text: 'Por eso, antes de ponerle una etiqueta al gráfico,'},
  {from: 28.49, to: 30.29, text: 'preguntate estas *tres cosas*.'},
  {from: 30.43, to: 32.66, text: '¿El movimiento es *limpio* o *trabajoso*?'},
  {from: 32.85, to: 34.78, text: '¿Algún lado mantiene el *control*?'},
  {from: 34.93, to: 36.46, text: '¿El precio está siendo *aceptado*'},
  {from: 36.62, to: 38.52, text: 'en una zona nueva, o *rechazándolo*?'},
  // 38.65–44.41 is shown as the big statement in the visual zone instead of a subtitle.
  {from: 44.68, to: 46.71, text: 'Seguí la serie y aprendé a *leerla*.'},
];

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const win = (t: number, a: number, b: number, fade = 0.35) =>
  interpolate(t, [a - fade, a, b, b + fade], [0, 1, 1, 0], clamp);

const candles = buildCandles(
  [
    [0, 100], [5, 98.4], [9, 100.6], [13, 99.2], [18, 102.6], [21, 101.4], [26, 104.4],
    [29, 103.2], [33, 103.9], [36, 102.6], [40, 105.6],
  ],
  'reel01',
  0.45,
  0.4,
);

// --- Orderflow section: footprint candles + vertical order book ---------------
// Price levels are ticks; phases follow the voice: interaction, buyers (sube),
// sellers (baja) and balance (rota).
const phases: Phase[] = [
  {
    from: 4.9, to: 14.45, pressure: 0,
    candles: [[0, 2, -1, 1], [1, 2, -1, 0], [0, 1, -2, -1], [-1, 1, -2, 1], [1, 3, 0, 2], [2, 2, -1, 0], [0, 1, -1, 0]],
  },
  {from: 14.55, to: 17.85, pressure: 0.85, candles: [[0, 5, 0, 4], [4, 8, 3, 7], [7, 11, 6, 10]]},
  {from: 17.93, to: 21.15, pressure: -0.85, candles: [[10, 11, 6, 7], [7, 8, 2, 3], [3, 4, -1, 0], [0, 0, -4, -3]]},
  {from: 21.22, to: 25.2, pressure: 0, candles: [[-3, 0, -4, -1], [-1, -1, -4, -3], [-3, 0, -3, -1], [-1, 0, -3, -2]]},
];

const pressure = (t: number) => {
  const base = interpolate(t, [4.8, 14.3, 14.8, 17.6, 18.2, 20.9, 21.5, 30], [0, 0, 1, 1, -1, -1, 0, 0], clamp);
  const interact = Math.sin(t * 6.5) * interpolate(t, [4.9, 6, 9.8, 10.6, 13.9, 14.4], [0, 0.25, 0.25, 0.6, 0.6, 0], clamp);
  const rotate = Math.sin(t * 4.2) * 0.85 * interpolate(t, [21.3, 22.0], [0, 1], clamp);
  return Math.max(-1, Math.min(1, base + interact + rotate));
};

const states = [
  {word: 'SUBE', color: C.green, from: 14.54, to: 17.8},
  {word: 'BAJA', color: C.red, from: 17.93, to: 21.1},
  {word: 'ROTA', color: C.gold, from: 21.22, to: 25.1},
];

// --- Questions section -------------------------------------------------------
const labels = ['ALCISTA', 'BAJISTA', 'RANGO', 'TENDENCIA'];
const questions = [
  {q: '¿El movimiento es limpio o trabajoso?', from: 30.43, to: 32.75},
  {q: '¿Algún lado mantiene el control?', from: 32.85, to: 34.85},
  {q: '¿El precio está siendo aceptado en una zona nueva, o rechazado?', from: 34.93, to: 38.6},
];

const QuestionsSection: React.FC<{t: number}> = ({t}) => {
  const strike = interpolate(t, [28.5, 29.1], [0, 1], clamp);
  return (
    <>
      <div style={{position: 'absolute', left: ZONE.left, width: 880, top: 580}}>
        <Kicker size={24} color={C.muted}>
          Antes de la etiqueta
        </Kicker>
        <div style={{display: 'flex', gap: 14, marginTop: 18}}>
          {labels.map((l, i) => {
            const o = interpolate(t, [25.5 + i * 0.3, 25.8 + i * 0.3], [0, 1], clamp);
            return (
              <div
                key={l}
                style={{
                  position: 'relative',
                  padding: '14px 22px',
                  borderRadius: 40,
                  border: `2px solid ${C.line}`,
                  background: C.panel,
                  fontSize: 27,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  color: C.text,
                  opacity: o * (1 - strike * 0.6),
                }}
              >
                {l}
                <div style={{position: 'absolute', left: 14, right: 14, top: '50%', height: 3, background: C.red, transform: `scaleX(${strike})`, transformOrigin: 'left'}} />
              </div>
            );
          })}
        </div>
      </div>
      {questions.map((q, i) => {
        const o = interpolate(t, [q.from - 0.15, q.from + 0.25], [0, 1], clamp);
        const on = t >= q.from && t < q.to;
        return (
          <div
            key={q.q}
            style={{
              position: 'absolute',
              left: ZONE.left,
              width: 880,
              top: 760 + i * 170,
              height: 150,
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              gap: 26,
              padding: '0 30px',
              borderRadius: 18,
              background: on ? 'rgba(227,168,43,0.10)' : C.panel,
              border: `2px solid ${on ? C.gold : C.line}`,
              opacity: o,
              transform: `translateY(${(1 - o) * 30}px)`,
            }}
          >
            <div
              style={{
                minWidth: 64,
                height: 64,
                borderRadius: 32,
                background: C.goldSoft,
                color: C.gold,
                fontFamily: DISPLAY,
                fontWeight: 800,
                fontSize: 34,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {i + 1}
            </div>
            <div style={{fontSize: 36, fontWeight: 600, lineHeight: 1.22}}>{q.q}</div>
          </div>
        );
      })}
    </>
  );
};

// --- Statement + outro -------------------------------------------------------
const Statement: React.FC<{t: number}> = ({t}) => {
  const a = interpolate(t, [38.65, 39.05], [0, 1], clamp);
  const b = interpolate(t, [41.37, 41.77], [0, 1], clamp);
  const c = interpolate(t, [43.29, 43.69], [0, 1], clamp);
  return (
    <>
      <div style={{position: 'absolute', left: ZONE.left, top: 600}}>
        <CandleChart candles={candles} width={960} height={620} shown={candles.length} opacity={0.14} showGrid={false} />
      </div>
      <div style={{position: 'absolute', left: ZONE.left, right: 140, top: 640, fontFamily: DISPLAY, fontWeight: 800, letterSpacing: '-0.015em'}}>
        <div style={{fontSize: 84, lineHeight: 1.05, opacity: a, transform: `translateY(${(1 - a) * 30}px)`}}>
          El gráfico, como tal, no imprime velas.
        </div>
        <div style={{fontSize: 92, lineHeight: 1.05, marginTop: 36, color: C.gold, opacity: b, transform: `translateY(${(1 - b) * 30}px)`}}>
          Muestra la fuerza y la presión
        </div>
        <div style={{fontSize: 92, lineHeight: 1.05, color: C.gold, opacity: c, transform: `translateY(${(1 - c) * 30}px)`}}>
          en tiempo real.
        </div>
      </div>
    </>
  );
};

const Outro: React.FC<{t: number}> = ({t}) => {
  const a = interpolate(t, [44.5, 45.0], [0, 1], clamp);
  return (
    <div style={{position: 'absolute', left: ZONE.left, width: 880, top: 640, opacity: a}}>
      <Kicker size={28}>Seguí la serie</Kicker>
      <div style={{display: 'flex', gap: 12, marginTop: 34}}>
        {new Array(10).fill(0).map((_, i) => {
          const fill = interpolate(t, [45.0 + i * 0.12, 45.3 + i * 0.12], [0, 1], clamp);
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: 18,
                borderRadius: 9,
                background: i === 0 ? C.gold : C.line,
                opacity: 0.3 + fill * 0.7,
              }}
            />
          );
        })}
      </div>
      <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 120, marginTop: 40}}>
        1<span style={{color: C.muted}}>/10</span>
      </div>
      <div style={{fontSize: 34, color: C.text, marginTop: 20}}>
        Próximo: <span style={{color: C.white, fontWeight: 600}}>Qué es realmente el precio</span>
      </div>
      <div style={{marginTop: 70}}>
        <Kicker size={30}>Bull Army</Kicker>
      </div>
    </div>
  );
};

export const Reel01: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const shown = interpolate(t, [0.1, 4.4], [0, candles.length], clamp);
  const oCandles = interpolate(t, [4.5, 5.0], [1, 0], clamp);
  const oPressure = win(t, 5.0, 25.2, 0.35);
  const oQuestions = win(t, 25.45, 38.55, 0.35);
  const oStatement = win(t, 38.85, 44.4, 0.3);
  const oOutro = interpolate(t, [44.45, 44.9], [0, 1], clamp);

  return (
    <ReelFrame num={1} title="El gráfico no imprime velas">
      <Audio src={staticFile('audio/reel-01.m4a')} />
      {oCandles > 0 ? (
        <div style={{position: 'absolute', left: ZONE.left, top: 590, opacity: oCandles}}>
          <CandleChart candles={candles} width={960} height={640} shown={shown} />
        </div>
      ) : null}
      {oPressure > 0 ? (
        <div style={{position: 'absolute', inset: 0, opacity: oPressure}}>
          <OrderflowSection t={t} phases={phases} pressure={pressure} levels={[-5, 12]} top={612} states={states} />
        </div>
      ) : null}
      {oQuestions > 0 ? (
        <div style={{position: 'absolute', inset: 0, opacity: oQuestions}}>
          <QuestionsSection t={t} />
        </div>
      ) : null}
      {oStatement > 0 ? (
        <div style={{position: 'absolute', inset: 0, opacity: oStatement}}>
          <Statement t={t} />
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

// Static cover for the profile grid (title + chart, inside the 3:4 crop).
export const Reel01Cover: React.FC = () => (
  <ReelFrame num={1} title="El gráfico no imprime velas" still>
    <div style={{position: 'absolute', left: ZONE.left, top: 590}}>
      <CandleChart candles={candles} width={960} height={640} shown={candles.length} />
    </div>
    <div
      style={{
        position: 'absolute',
        left: ZONE.left,
        right: 140,
        top: 1300,
        textAlign: 'center',
        fontFamily: DISPLAY,
        fontWeight: 800,
        fontSize: 64,
        color: C.gold,
      }}
    >
      Muestra la presión.
    </div>
  </ReelFrame>
);
