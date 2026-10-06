import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {Background, Reveal, SceneHeader} from '../components/ui';
import {C, DISPLAY} from '../theme';

const ideas = [
  'No veas solamente movimiento de precio. Mirá traders tomando decisiones.',
  'El movimiento del precio es el efecto. La causa está por debajo.',
  'Quien se enfoca solo en el precio reacciona al efecto, esperando que dure lo suficiente para ganar.',
  'Comprá donde es probable que otros compren después que vos. Vendé donde es probable que otros vendan después que vos.',
  'Mirá cada movimiento desde la perspectiva de otros traders y cómo influye en sus decisiones.',
  'Buscá quién está en dolor, quién está atrapado, quién toma ganancias y quién puede verse forzado a actuar.',
];

const STEP = 95;
const FIRST = 25;

export const IdeasClave: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Background>
      <SceneHeader title="Ideas clave" />
      <div
        style={{
          position: 'absolute',
          left: 120,
          right: 120,
          top: 260,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridAutoRows: 220,
          gap: 28,
        }}
      >
        {ideas.map((t, i) => {
          const start = FIRST + i * STEP;
          const focus = interpolate(frame, [start, start + 10, start + STEP, start + STEP + 10], [0, 1, 1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const last = i === ideas.length - 1 ? interpolate(frame, [start + STEP, start + STEP + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 0;
          const hl = Math.max(focus, last);
          return (
            <Reveal key={i} delay={start} y={40}>
              <div
                style={{
                  height: 220,
                  boxSizing: 'border-box',
                  display: 'flex',
                  gap: 30,
                  alignItems: 'center',
                  padding: '0 40px',
                  borderRadius: 16,
                  background: hl > 0.5 ? 'rgba(227,168,43,0.08)' : C.panel,
                  border: `1px solid ${hl > 0.5 ? C.gold : C.line}`,
                  opacity: frame > start + STEP ? 0.55 + hl * 0.45 : 1,
                }}
              >
                <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 64, color: C.gold, minWidth: 90}}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div style={{fontSize: 30, lineHeight: 1.35, fontWeight: 500}}>{t}</div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Background>
  );
};
