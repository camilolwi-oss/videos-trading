import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Background, Caption, Gold, Reveal, SceneHeader, ease, useWindow} from '../components/ui';
import {C, DISPLAY} from '../theme';

type Mini = {pts: [number, number][]; guides?: React.ReactNode};

const W = 420;
const H = 200;

const minis: Mini[] = [
  {
    pts: [[0, 100], [45, 30], [95, 165], [150, 35], [205, 160], [260, 30], [315, 170], [370, 40], [420, 110]],
    guides: (
      <>
        <line x1={0} x2={W} y1={28} y2={28} stroke={C.gold} strokeDasharray="8 8" opacity={0.7} />
        <line x1={0} x2={W} y1={172} y2={172} stroke={C.gold} strokeDasharray="8 8" opacity={0.7} />
      </>
    ),
  },
  {
    pts: [[0, 185], [60, 120], [95, 150], [165, 80], [200, 112], [270, 45], [305, 75], [380, 10], [420, 30]],
  },
  {
    pts: [[0, 180], [55, 120], [85, 145], [150, 70], [180, 95], [215, 60], [255, 100], [290, 55], [335, 98], [380, 62], [420, 90]],
    guides: <line x1={180} x2={180} y1={0} y2={H} stroke={C.gold} strokeDasharray="8 8" opacity={0.8} />,
  },
];

const cards = [
  {title: 'Rango', sub: 'Balance', text: 'El precio rota dentro de una zona.'},
  {title: 'Tendencia', sub: 'Desequilibrio', text: 'El precio se mueve con dirección.'},
  {title: 'Transición', sub: 'Cambio', text: 'La condición previa empieza a debilitarse o a cambiar.'},
];

const MiniChart: React.FC<{mini: Mini; progress: number}> = ({mini, progress}) => {
  const d = mini.pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
  return (
    <svg width={W} height={H} style={{overflow: 'visible'}}>
      {mini.guides}
      <path
        d={d}
        fill="none"
        stroke={C.white}
        strokeWidth={5}
        strokeLinejoin="round"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - progress}
      />
    </svg>
  );
};

export const TresEstados: React.FC = () => {
  const frame = useCurrentFrame();
  const cap = useWindow(200, 500);
  return (
    <Background>
      <SceneHeader num="04" title="Los 3 estados del mercado" />
      <div style={{position: 'absolute', left: 120, right: 120, top: 270}}>
        <Reveal delay={8}>
          <div style={{fontSize: 36, color: C.text}}>
            A grandes rasgos, el mercado casi siempre está haciendo <Gold>una de estas tres cosas</Gold>:
          </div>
        </Reveal>
      </div>
      <div style={{position: 'absolute', left: 120, right: 120, top: 370, display: 'flex', gap: 40}}>
        {cards.map((c, i) => (
          <Reveal key={c.title} delay={30 + i * 22} y={50} style={{flex: 1}}>
            <div
              style={{
                height: 480,
                background: C.panel,
                border: `1px solid ${C.line}`,
                borderTop: `4px solid ${C.gold}`,
                borderRadius: 16,
                padding: 36,
                boxSizing: 'border-box',
              }}
            >
              <MiniChart mini={minis[i]} progress={ease(frame, 45 + i * 22, 130 + i * 22)} />
              <div style={{display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 34}}>
                <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 56}}>{c.title}</div>
                <div style={{fontSize: 24, color: C.gold, fontWeight: 600}}>({c.sub})</div>
              </div>
              <div style={{fontSize: 28, color: C.text, marginTop: 12, lineHeight: 1.35}}>{c.text}</div>
            </div>
          </Reveal>
        ))}
      </div>
      <Caption opacity={cap} top={905}>
        Antes de buscar entradas, niveles o patrones: <Gold>identificá en qué condición está el mercado.</Gold>
      </Caption>
    </Background>
  );
};
