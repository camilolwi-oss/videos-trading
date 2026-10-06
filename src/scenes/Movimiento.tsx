import React from 'react';
import {interpolate, random, useCurrentFrame} from 'remotion';
import {Background, Caption, Gold, Kicker, Reveal, SceneHeader, ease, useWindow} from '../components/ui';
import {C, DISPLAY, FONT} from '../theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const COLS = 12;
const ROWS = 6;
const dots = new Array(COLS * ROWS).fill(0).map((_, i) => random(`trader-${i}`));

// Collective sentiment: mixed → bullish → bearish.
const sentiment = (f: number) =>
  interpolate(f, [0, 50, 90, 140, 170, 230, 280], [0, 0, 0.75, 0.75, -0.75, -0.75, -0.75], clamp);

const series: number[] = [];
{
  let p = 0;
  for (let f = 0; f <= 300; f++) {
    p += sentiment(f) * 1.6 + Math.sin(f * 1.3) * 0.5;
    series.push(p);
  }
}

const chain = [
  {label: 'Sentimiento', sub: 'lo que creen los traders'},
  {label: 'Orderflow', sub: 'cómo actúan sobre eso'},
  {label: 'Movimiento del precio', sub: 'lo que ves en el gráfico'},
];

export const Movimiento: React.FC = () => {
  const frame = useCurrentFrame();
  const partA = interpolate(frame, [20, 40, 270, 290], [0, 1, 1, 0], clamp);
  const partB = interpolate(frame, [290, 310], [0, 1], clamp);
  const s = sentiment(frame);
  const bullShare = Math.max(0, Math.min(1, 0.34 + 0.55 * s));
  const bearShare = Math.max(0, Math.min(1, 0.34 - 0.55 * s));

  let bulls = 0;
  let bears = 0;
  const states = dots.map((r) => {
    if (r < bullShare) {
      bulls++;
      return 'bull';
    }
    if (r > 1 - bearShare) {
      bears++;
      return 'bear';
    }
    return 'flat';
  });
  const net = bulls - bears;
  const netColor = net > 8 ? C.green : net < -8 ? C.red : C.muted;
  const netText = net > 8 ? 'ALCISTA ↑' : net < -8 ? 'BAJISTA ↓' : 'NEUTRAL';

  const now = Math.min(frame, 280);
  const line = {x: 1180, y: 450, w: 560, h: 300};
  let d = '';
  for (let f = 40; f <= Math.max(40, now); f++) {
    const x = line.x + ((f - 40) / 240) * line.w;
    const y = line.y + line.h / 2 - series[f] * 0.75;
    d += `${f === 40 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)} `;
  }

  const capA = useWindow(60, 285);
  const capB = useWindow(420, 700);

  return (
    <Background>
      <SceneHeader num="03" title="Cómo se mueve el precio" />
      <div style={{position: 'absolute', left: 120, right: 120, top: 270}}>
        <Reveal delay={8}>
          <div style={{fontSize: 36, color: C.text}}>
            Oferta y demanda no cambian solas: cambian a medida que <Gold>los traders toman decisiones.</Gold>
          </div>
        </Reveal>
      </div>

      {/* Part A: the crowd */}
      <div style={{position: 'absolute', left: 160, top: 400, opacity: partA}}>
        <Kicker size={20} color={C.muted}>
          Cada punto es un trader
        </Kicker>
        <div style={{display: 'grid', gridTemplateColumns: `repeat(${COLS}, 62px)`, gap: 14, marginTop: 24}}>
          {states.map((st, i) => (
            <div
              key={i}
              style={{
                width: 62,
                height: 62,
                borderRadius: 31,
                background: st === 'bull' ? C.greenSoft : st === 'bear' ? C.redSoft : 'rgba(255,255,255,0.04)',
                border: `2px solid ${st === 'bull' ? C.green : st === 'bear' ? C.red : C.gray}`,
                color: st === 'bull' ? C.green : st === 'bear' ? C.red : C.gray,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              {st === 'bull' ? '▲' : st === 'bear' ? '▼' : '–'}
            </div>
          ))}
        </div>
      </div>
      <div style={{position: 'absolute', left: 1180, top: 400, opacity: partA}}>
        <Kicker size={20} color={C.muted}>
          Efecto neto
        </Kicker>
        <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 56, color: netColor, marginTop: 10}}>
          {netText}
        </div>
        <div style={{fontSize: 24, color: C.text, marginTop: 6}}>
          <span style={{color: C.green}}>{bulls} alcistas</span> · <span style={{color: C.red}}>{bears} bajistas</span> ·{' '}
          <span style={{color: C.muted}}>{dots.length - bulls - bears} sin operar</span>
        </div>
      </div>
      <svg width={1920} height={1080} style={{position: 'absolute', opacity: partA}}>
        <path d={d} fill="none" stroke={netColor} strokeWidth={4} strokeLinejoin="round" transform="translate(0 110)" />
      </svg>
      <Caption opacity={capA * partA} top={930}>
        No importa la opinión de un trader individual, sino <Gold>el efecto neto de todos</Gold>.
      </Caption>

      {/* Part B: the chain */}
      <div
        style={{
          position: 'absolute',
          left: 120,
          right: 120,
          top: 450,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 26,
          opacity: partB,
        }}
      >
        {chain.map((c, i) => {
          const on = ease(frame, 300 + i * 34, 324 + i * 34);
          const arrow = ease(frame, 318 + i * 34, 334 + i * 34);
          return (
            <React.Fragment key={c.label}>
              <div
                style={{
                  width: 470,
                  height: 190,
                  borderRadius: 18,
                  border: `2px solid ${on > 0.5 ? C.gold : C.line}`,
                  background: on > 0.5 ? 'rgba(227,168,43,0.09)' : C.panel,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.25 + on * 0.75,
                  transform: `scale(${0.94 + on * 0.06})`,
                }}
              >
                <div style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: i === 2 ? 42 : 50}}>{c.label}</div>
                <div style={{fontSize: 24, color: C.muted, marginTop: 10}}>{c.sub}</div>
              </div>
              {i < chain.length - 1 ? (
                <div style={{fontSize: 60, color: C.gold, opacity: arrow, transform: `translateX(${(arrow - 1) * 20}px)`}}>→</div>
              ) : null}
            </React.Fragment>
          );
        })}
      </div>
      <svg width={1920} height={1080} style={{position: 'absolute', opacity: partB}}>
        {(() => {
          const b1 = ease(frame, 400, 425);
          const b2 = ease(frame, 412, 437);
          // Box centers: 3 boxes of 470 + 2 gaps (26 + arrow ~60 + 26).
          const total = 470 * 3 + 2 * 112;
          const x0 = (1920 - total) / 2;
          const causeL = x0;
          const causeR = x0 + 470 * 2 + 112;
          const effL = causeR + 112;
          const effR = effL + 470;
          const y = 680;
          return (
            <g fontFamily={FONT}>
              <g opacity={b1}>
                <path d={`M ${causeL} ${y} v 20 H ${causeR} v -20`} stroke={C.muted} strokeWidth={2} fill="none" />
                <text x={(causeL + causeR) / 2} y={y + 64} textAnchor="middle" fontSize={26} fontWeight={600} fill={C.text} letterSpacing="0.2em">
                  CAUSA · POR DEBAJO
                </text>
              </g>
              <g opacity={b2}>
                <path d={`M ${effL} ${y} v 20 H ${effR} v -20`} stroke={C.gold} strokeWidth={2} fill="none" />
                <text x={(effL + effR) / 2} y={y + 64} textAnchor="middle" fontSize={26} fontWeight={600} fill={C.gold} letterSpacing="0.2em">
                  EFECTO · LO VISIBLE
                </text>
              </g>
            </g>
          );
        })()}
      </svg>
      <Caption opacity={capB} top={900}>
        La mayoría reacciona al efecto, esperando que dure lo suficiente para ganar.
        <br />
        <Gold>Entender la causa es entender qué está moviendo al mercado.</Gold>
      </Caption>
    </Background>
  );
};
