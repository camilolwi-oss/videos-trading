import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {buildCandles} from '../candles';
import {CandleChart} from '../components/CandleChart';
import {Background, Gold, Kicker, Reveal} from '../components/ui';
import {C, DISPLAY} from '../theme';

const candles = buildCandles(
  [
    [0, 100], [10, 101.5], [18, 99], [26, 101.8], [32, 99.5], [40, 105], [46, 103.8],
    [54, 108], [60, 106.5], [70, 108.4], [78, 106.6], [86, 108.2], [96, 104], [104, 105.2], [112, 102],
  ],
  'definicion',
  0.45,
  0.4,
);

export const Definicion: React.FC = () => {
  const frame = useCurrentFrame();
  const shown = interpolate(frame, [0, 290], [0, candles.length], {extrapolateRight: 'clamp'});
  return (
    <Background>
      <AbsoluteFill style={{top: 200, left: 60}}>
        <CandleChart candles={candles} width={1800} height={700} shown={shown} opacity={0.16} showGrid={false} />
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', padding: '0 200px'}}>
        <Reveal delay={6}>
          <Kicker size={26} style={{textAlign: 'center'}}>
            Entonces, ¿qué es una estructura de mercado?
          </Kicker>
        </Reveal>
        <Reveal delay={30} style={{marginTop: 40}}>
          <div
            style={{
              fontFamily: DISPLAY,
              fontWeight: 800,
              fontSize: 84,
              lineHeight: 1.12,
              textAlign: 'center',
              letterSpacing: '-0.015em',
            }}
          >
            La <Gold>organización visible</Gold> de los <Gold>cambios de presión</Gold> a lo largo del tiempo.
          </div>
        </Reveal>
        <Reveal delay={120} style={{marginTop: 60}}>
          <div style={{fontSize: 32, color: C.text, textAlign: 'center', lineHeight: 1.5}}>
            El sentimiento cambia → cambian la oferta y la demanda → cambia el precio.
            <br />
            <span style={{color: C.muted}}>La estructura es la huella que deja ese proceso en el gráfico.</span>
          </div>
        </Reveal>
      </AbsoluteFill>
    </Background>
  );
};
