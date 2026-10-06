import React from 'react';
import {Audio, interpolate, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {buildCandles} from '../../candles';
import {CandleChart} from '../../components/CandleChart';
import {Kicker} from '../../components/ui';
import {C, DISPLAY, FPS} from '../../theme';
import {ReelFrame, ZONE} from '../ReelFrame';
import {Page, Subtitles} from '../Subtitles';

// Timings (seconds) come from the voice track public/audio/reel-01.m4a.
export const REEL01_SECONDS = 63.5;

const pages: Page[] = [
  {from: 2.08, to: 4.45, text: 'Si mirás un gráfico y solo ves *velas*,'},
  {from: 4.45, to: 6.81, text: 'te estás perdiendo lo más *importante*.'},
  {from: 7.64, to: 10.11, text: 'El mercado es simplemente esto:'},
  {from: 10.42, to: 14.75, text: '*Compradores* y *vendedores* interactuando todo el tiempo.'},
  {from: 15.18, to: 18.06, text: 'El precio se mueve cuando uno de esos dos lados'},
  {from: 18.48, to: 20.54, text: 'actúa con más *agresividad*.'},
  {from: 21.64, to: 24.3, text: 'Si los compradores pagan cada vez más caro,'},
  {from: 24.3, to: 25.42, text: 'el precio *sube*.'},
  {from: 25.98, to: 28.0, text: 'Si los vendedores fueran a ser'},
  {from: 28.64, to: 31.09, text: 'más agresivos, el precio va a *bajar*.'},
  {from: 31.46, to: 32.85, text: 'Y nadie tiene ventaja:'},
  {from: 33.33, to: 35.97, text: 'el precio *rota* sin dirección.'},
  {from: 37.55, to: 40.36, text: 'Por eso, antes de ponerle una etiqueta al gráfico,'},
  {from: 40.5, to: 42.1, text: 'preguntate *tres cosas*.'},
  {from: 42.35, to: 45.25, text: '¿El movimiento es *limpio* o *trabajoso*?'},
  {from: 45.91, to: 47.72, text: '¿Algún lado mantiene el *control*?'},
  {from: 48.11, to: 50.25, text: '¿El precio está siendo *aceptado*'},
  {from: 50.25, to: 52.38, text: 'en una zona nueva, o *rechazado*?'},
  // 52.8–56.9 is shown as the big statement in the visual zone instead of a subtitle.
  {from: 57.62, to: 59.9, text: 'Seguí la serie de comportamientos'},
  {from: 59.9, to: 61.27, text: 'y aprendé a *leerla*.'},
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

// --- Pressure section --------------------------------------------------------
const P_START = 7.5;
const P_END = 36.5;

const pressure = (t: number) => {
  const base = interpolate(t, [P_START, 21.3, 21.9, 25.3, 26.0, 30.9, 31.6, 40], [0, 0, 1, 1, -1, -1, 0, 0], clamp);
  const interact = Math.sin(t * 6.5) * interpolate(t, [7.6, 9, 15, 16.5, 20.8, 21.4], [0, 0.25, 0.25, 0.6, 0.6, 0], clamp);
  const rotate = Math.sin(t * 4.2) * 0.85 * interpolate(t, [31.4, 32.2], [0, 1], clamp);
  return Math.max(-1, Math.min(1, base + interact + rotate));
};

const series: number[] = [];
{
  let v = 0;
  for (let f = 0; f <= Math.ceil(P_END * FPS); f++) {
    const t = f / FPS;
    if (t >= P_START) v += pressure(t) * 1.1 + (random(`r01-${f}`) - 0.5) * 3.2;
    series.push(v);
  }
}

const PressureSection: React.FC<{t: number}> = ({t}) => {
  const ch = {x: ZONE.left, y: 650, w: 880, h: 360, lo: -110, hi: 150};
  const now = Math.min(Math.max(t, P_START), P_END);
  const px = (tt: number) => ch.x + ((tt - P_START) / (P_END - P_START)) * ch.w;
  const py = (v: number) => ch.y + ((ch.hi - v) / (ch.hi - ch.lo)) * ch.h;
  let d = '';
  const f0 = Math.round(P_START * FPS);
  const f1 = Math.round(now * FPS);
  for (let f = f0; f <= f1; f++) {
    d += `${f === f0 ? 'M' : 'L'} ${px(f / FPS).toFixed(1)} ${py(series[f]).toFixed(1)} `;
  }
  const p = pressure(t);
  const buy = (1 + p) / 2;
  const head = p > 0.3 ? C.green : p < -0.3 ? C.red : C.gold;
  const states = [
    {word: 'SUBE', color: C.green, o: win(t, 21.64, 25.6, 0.25)},
    {word: 'BAJA', color: C.red, o: win(t, 25.98, 31.3, 0.25)},
    {word: 'ROTA', color: C.gold, o: win(t, 31.46, 36.2, 0.25)},
  ];
  return (
    <>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <line x1={ch.x} x2={ch.x + ch.w} y1={py(0)} y2={py(0)} stroke={C.line} strokeDasharray="8 10" strokeWidth={2} />
        <path d={d} fill="none" stroke={C.white} strokeWidth={5} strokeLinejoin="round" />
        <circle cx={px(now)} cy={py(series[f1])} r={28} fill={head} opacity={0.25} />
        <circle cx={px(now)} cy={py(series[f1])} r={13} fill={head} />
      </svg>
      {states.map((s) => (
        <div
          key={s.word}
          style={{
            position: 'absolute',
            left: ZONE.left,
            top: 575,
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: 76,
            letterSpacing: '0.04em',
            color: s.color,
            opacity: s.o,
            transform: `scale(${0.9 + s.o * 0.1})`,
            transformOrigin: 'left center',
          }}
        >
          {s.word}
        </div>
      ))}
      <div style={{position: 'absolute', left: ZONE.left, width: 880, top: 1080}}>
        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 28, fontWeight: 600, letterSpacing: '0.12em', marginBottom: 16}}>
          <span style={{color: C.green}}>COMPRADORES {Math.round(buy * 100)}%</span>
          <span style={{color: C.red}}>{Math.round((1 - buy) * 100)}% VENDEDORES</span>
        </div>
        <div style={{position: 'relative', height: 36, borderRadius: 18, overflow: 'hidden', background: C.red}}>
          <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${buy * 100}%`, background: C.green}} />
          <div style={{position: 'absolute', left: '50%', top: -4, bottom: -4, width: 4, background: C.bg}} />
        </div>
      </div>
    </>
  );
};

// --- Questions section -------------------------------------------------------
const labels = ['ALCISTA', 'BAJISTA', 'RANGO', 'TENDENCIA'];
const questions = [
  {q: '¿El movimiento es limpio o trabajoso?', from: 42.35, to: 45.6},
  {q: '¿Algún lado mantiene el control?', from: 45.91, to: 48.0},
  {q: '¿El precio está siendo aceptado en una zona nueva, o rechazado?', from: 48.11, to: 52.6},
];

const QuestionsSection: React.FC<{t: number}> = ({t}) => {
  const strike = interpolate(t, [40.4, 41.0], [0, 1], clamp);
  return (
    <>
      <div style={{position: 'absolute', left: ZONE.left, width: 880, top: 580}}>
        <Kicker size={24} color={C.muted}>
          Antes de la etiqueta
        </Kicker>
        <div style={{display: 'flex', gap: 14, marginTop: 18}}>
          {labels.map((l, i) => {
            const o = interpolate(t, [37.6 + i * 0.35, 37.9 + i * 0.35], [0, 1], clamp);
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
  const a = interpolate(t, [52.8, 53.2], [0, 1], clamp);
  const b = interpolate(t, [55.1, 55.5], [0, 1], clamp);
  return (
    <>
      <div style={{position: 'absolute', left: ZONE.left, top: 600}}>
        <CandleChart candles={candles} width={960} height={620} shown={candles.length} opacity={0.14} showGrid={false} />
      </div>
      <div style={{position: 'absolute', left: ZONE.left, right: 140, top: 700, fontFamily: DISPLAY, fontWeight: 800, letterSpacing: '-0.015em'}}>
        <div style={{fontSize: 96, lineHeight: 1.05, opacity: a, transform: `translateY(${(1 - a) * 30}px)`}}>
          El gráfico no imprime velas.
        </div>
        <div style={{fontSize: 110, lineHeight: 1.05, marginTop: 40, color: C.gold, opacity: b, transform: `translateY(${(1 - b) * 30}px)`}}>
          Muestra la presión.
        </div>
      </div>
    </>
  );
};

const Outro: React.FC<{t: number}> = ({t}) => {
  const a = interpolate(t, [57.5, 58.0], [0, 1], clamp);
  return (
    <div style={{position: 'absolute', left: ZONE.left, width: 880, top: 640, opacity: a}}>
      <Kicker size={28}>Seguí la serie</Kicker>
      <div style={{display: 'flex', gap: 12, marginTop: 34}}>
        {new Array(10).fill(0).map((_, i) => {
          const fill = interpolate(t, [58.0 + i * 0.12, 58.3 + i * 0.12], [0, 1], clamp);
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
  const shown = interpolate(t, [0.2, 6.6], [0, candles.length], clamp);
  const oCandles = interpolate(t, [7.0, 7.7], [1, 0], clamp);
  const oPressure = win(t, 7.7, 36.4, 0.5);
  const oQuestions = win(t, 37.3, 52.5, 0.4);
  const oStatement = win(t, 52.9, 57.2, 0.4);
  const oOutro = interpolate(t, [57.4, 57.9], [0, 1], clamp);

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
          <PressureSection t={t} />
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
  <ReelFrame num={1} title="El gráfico no imprime velas">
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
