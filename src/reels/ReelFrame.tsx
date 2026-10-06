import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Background, Kicker, ease, useEnter} from '../components/ui';
import {C, DISPLAY} from '../theme';

export const REEL_W = 1080;
export const REEL_H = 1920;
export const SERIES_TOTAL = 10;

// Vertical safe layout (px from the top):
//   0–220     Instagram UI  → background only
//   220–520   fixed title
//   540–1260  main visual
//   1280–1480 voice subtitles
//   1480–1920 Instagram UI  → background only
// Keep labels out of the right 120 px between 900 and 1700 (like/comment/share).
export const ZONE = {
  titleTop: 250,
  visualTop: 560,
  visualBottom: 1260,
  subsTop: 1290,
  left: 60,
  right: 1020,
  safeRight: 940,
};

export const ReelFrame: React.FC<{
  num: number;
  title: string;
  children: React.ReactNode;
}> = ({num, title, children}) => {
  const frame = useCurrentFrame();
  const p = useEnter(0, 18);
  const line = ease(frame, 4, 24);
  return (
    <Background>
      <div style={{position: 'absolute', left: ZONE.left, right: 140, top: ZONE.titleTop}}>
        <div style={{opacity: p}}>
          <Kicker size={28}>
            Estructuras de mercado · {num}/{SERIES_TOTAL}
          </Kicker>
        </div>
        <div
          style={{
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: 84,
            lineHeight: 1.04,
            letterSpacing: '-0.015em',
            marginTop: 18,
            opacity: p,
            transform: `translateY(${(1 - p) * 24}px)`,
          }}
        >
          {title}
        </div>
        <div style={{marginTop: 22, height: 5, width: 160 * line, background: C.gold, borderRadius: 3}} />
      </div>
      {children}
    </Background>
  );
};
