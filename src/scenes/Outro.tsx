import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Background, Gold, Kicker, Reveal} from '../components/ui';
import {C, DISPLAY} from '../theme';

export const Outro: React.FC = () => (
  <Background>
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', textAlign: 'center'}}>
      <Reveal delay={6}>
        <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 92, lineHeight: 1.1, letterSpacing: '-0.015em'}}>
          No reacciones vela por vela.
        </div>
      </Reveal>
      <Reveal delay={26} style={{marginTop: 18}}>
        <div style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: 64, color: C.text}}>
          Leé el <Gold>comportamiento</Gold> detrás de ellas.
        </div>
      </Reveal>
      <Reveal delay={60} style={{marginTop: 90}}>
        <Kicker size={28}>Bull Army</Kicker>
        <div style={{fontSize: 24, color: C.muted, marginTop: 14}}>Estructuras de mercado · Material educativo</div>
      </Reveal>
    </AbsoluteFill>
  </Background>
);
