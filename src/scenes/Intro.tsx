import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {buildCandles} from '../candles';
import {CandleChart} from '../components/CandleChart';
import {Background, Kicker, Reveal, ease, useEnter} from '../components/ui';
import {C, DISPLAY} from '../theme';

const candles = buildCandles(
  [
    [0, 100], [8, 98], [14, 101], [20, 99], [26, 104], [31, 102.5], [38, 107],
    [43, 105.5], [50, 106.5], [55, 105], [62, 110], [66, 108.6], [74, 113],
  ],
  'intro',
  0.5,
  0.45,
);

const TitleLine: React.FC<{text: string; delay: number}> = ({text, delay}) => {
  const p = useEnter(delay, 26);
  return (
    <div style={{overflow: 'hidden', paddingBottom: 6}}>
      <div style={{transform: `translateY(${(1 - p) * 110}%)`}}>{text}</div>
    </div>
  );
};

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const shown = interpolate(frame, [0, 170], [0, candles.length], {
    extrapolateRight: 'clamp',
  });
  const line = ease(frame, 14, 40);
  return (
    <Background>
      <AbsoluteFill style={{left: 820, top: 120}}>
        <CandleChart
          candles={candles}
          width={1000}
          height={620}
          shown={shown}
          opacity={0.5}
          showGrid={false}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(90deg, rgba(10,10,11,1) 30%, rgba(10,10,11,0.2) 75%, rgba(10,10,11,0.6))',
        }}
      />
      <div style={{position: 'absolute', left: 140, top: 110}}>
        <Reveal delay={4}>
          <Kicker size={26}>Bull Army</Kicker>
        </Reveal>
      </div>
      <div style={{position: 'absolute', left: 140, top: 380}}>
        <div style={{height: 4, width: 220 * line, background: C.white, marginBottom: 34}} />
        <div
          style={{
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: 150,
            lineHeight: 1.02,
            letterSpacing: '-0.02em',
          }}
        >
          <TitleLine text="Estructuras" delay={18} />
          <TitleLine text="de mercado" delay={26} />
        </div>
        <Reveal delay={48} style={{marginTop: 36, maxWidth: 1050}}>
          <div style={{fontSize: 34, color: C.text, lineHeight: 1.45}}>
            Qué son, por qué se forman y cómo leer los tres estados del
            mercado: <span style={{color: C.gold}}>rango, tendencia y transición.</span>
          </div>
        </Reveal>
      </div>
      <div style={{position: 'absolute', left: 140, bottom: 80}}>
        <Reveal delay={64}>
          <div style={{fontSize: 24, color: C.muted}}>Material educativo · Bull Army</div>
        </Reveal>
      </div>
    </Background>
  );
};
