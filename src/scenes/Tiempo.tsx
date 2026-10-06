import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {Background, Caption, Gold, Kicker, Reveal, SceneHeader, useWindow} from '../components/ui';
import {C, DISPLAY} from '../theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const PW = 480;
const PH = 300;

const linePath = (fn: (t: number) => number, upto: number) => {
  let d = '';
  const steps = 120;
  for (let s = 0; s <= steps * upto; s++) {
    const t = s / steps;
    d += `${s === 0 ? 'M' : 'L'} ${(t * PW).toFixed(1)} ${fn(t).toFixed(1)} `;
  }
  return d;
};

const panels = [
  {
    key: 'rapido',
    title: 'Rápido',
    text: 'El movimiento veloz suele reflejar urgencia y desequilibrio.',
    color: C.green,
    fn: (t: number) => 260 - Math.pow(t, 1.4) * 230 + Math.sin(t * 40) * 4,
    range: [50, 80] as [number, number],
  },
  {
    key: 'lento',
    title: 'Lento',
    text: 'El movimiento lento suele reflejar aceptación y equilibrio.',
    color: C.white,
    fn: (t: number) => 170 - t * 30 + Math.sin(t * 22) * 22,
    range: [50, 330] as [number, number],
  },
  {
    key: 'tiempo',
    title: 'Tiempo',
    text: 'Cuanto más tiempo pasa el precio en una zona, más significativa se vuelve.',
    color: C.gold,
    fn: (t: number) => 150 + Math.sin(t * 34) * 48 * (0.6 + 0.4 * Math.sin(t * 7)),
    range: [50, 330] as [number, number],
  },
];

export const Tiempo: React.FC = () => {
  const frame = useCurrentFrame();
  const cap = useWindow(340, 700);
  return (
    <Background>
      <SceneHeader num="05" title="El tiempo importa" />
      <div style={{position: 'absolute', left: 120, right: 120, top: 270}}>
        <Reveal delay={8}>
          <div style={{fontSize: 36, color: C.text}}>
            El precio solo no alcanza: importa <Gold>cómo se mueve</Gold> y <Gold>cuánto tiempo se queda</Gold> en una zona.
          </div>
        </Reveal>
      </div>
      <div style={{position: 'absolute', left: 120, right: 120, top: 370, display: 'flex', gap: 40}}>
        {panels.map((p, i) => {
          const prog = interpolate(frame, p.range, [0, 1], clamp);
          const zone = p.key === 'tiempo' ? interpolate(frame, [60, 330], [0.05, 0.45], clamp) : 0;
          const secs = Math.round(prog * 48);
          return (
            <Reveal key={p.key} delay={20 + i * 14} style={{flex: 1}}>
              <div
                style={{
                  background: C.panel,
                  border: `1px solid ${C.line}`,
                  borderRadius: 16,
                  padding: 32,
                  height: 520,
                  boxSizing: 'border-box',
                }}
              >
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Kicker size={22} color={p.color}>
                    {p.title}
                  </Kicker>
                  {p.key === 'tiempo' ? (
                    <div style={{fontSize: 22, color: C.gold, fontVariantNumeric: 'tabular-nums'}}>
                      {secs} velas en la zona
                    </div>
                  ) : null}
                </div>
                <svg width={PW} height={PH} style={{marginTop: 20, overflow: 'visible'}}>
                  {p.key === 'tiempo' ? (
                    <rect x={0} y={90} width={PW} height={120} fill={C.gold} opacity={zone} rx={6} />
                  ) : null}
                  <path d={linePath(p.fn, prog)} fill="none" stroke={p.color} strokeWidth={4.5} strokeLinejoin="round" strokeLinecap="round" />
                  {p.key === 'rapido' && prog > 0.2
                    ? [0, 1, 2].map((k) => (
                        <line
                          key={k}
                          x1={PW * prog - 70 - k * 18}
                          y1={p.fn(prog) + 30 + k * 16}
                          x2={PW * prog - 20 - k * 18}
                          y2={p.fn(prog) + 14 + k * 16}
                          stroke={C.green}
                          strokeWidth={3}
                          opacity={0.5 * (1 - prog * 0.6)}
                        />
                      ))
                    : null}
                </svg>
                <div style={{fontFamily: DISPLAY, fontWeight: 600, fontSize: 28, lineHeight: 1.35, marginTop: 10}}>{p.text}</div>
              </div>
            </Reveal>
          );
        })}
      </div>
      <Caption opacity={cap} top={935}>
        ¿Se aleja con <Gold>urgencia</Gold>, o se queda porque la zona está siendo <Gold>aceptada</Gold>?
      </Caption>
    </Background>
  );
};
