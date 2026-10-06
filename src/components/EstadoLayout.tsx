import React from 'react';
import {Background, Caption, Kicker, Reveal, SceneHeader, useWindow} from './ui';
import {C} from '../theme';

export type Section = {title: string; items: string[]};

// Shared layout for the Rango / Tendencia / Transición scenes:
// animated chart on the left, "qué ves / qué significa / implicancia" on the right.
export const EstadoLayout: React.FC<{
  num: string;
  title: string;
  sections: Section[];
  sectionDelays: number[];
  caption: React.ReactNode;
  captionFrom: number;
  chart: React.ReactNode;
}> = ({num, title, sections, sectionDelays, caption, captionFrom, chart}) => {
  const cap = useWindow(captionFrom, captionFrom + 600);
  return (
    <Background>
      <SceneHeader num={num} title={title} />
      <div style={{position: 'absolute', left: 100, top: 270}}>{chart}</div>
      <div style={{position: 'absolute', left: 1260, right: 100, top: 270}}>
        {sections.map((s, i) => (
          <Reveal key={s.title} delay={sectionDelays[i]} style={{marginBottom: 34}}>
            <Kicker size={20}>{s.title}</Kicker>
            <div style={{marginTop: 12}}>
              {s.items.map((it) => (
                <div key={it} style={{display: 'flex', gap: 14, fontSize: 27, lineHeight: 1.3, marginBottom: 8, color: C.text}}>
                  <span style={{color: C.gold, fontWeight: 700}}>–</span>
                  <span>{it}</span>
                </div>
              ))}
            </div>
          </Reveal>
        ))}
      </div>
      <Caption opacity={cap} top={945} size={30}>
        {caption}
      </Caption>
    </Background>
  );
};
