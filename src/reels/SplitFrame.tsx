import React from 'react';
import {OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import {Background, Kicker, ease, useEnter} from '../components/ui';
import {C, DISPLAY} from '../theme';
import {SERIES_TOTAL} from './ReelFrame';

// Split layout: the speaker fills the top (0–SPLIT_Y), the animation lives below.
export const SPLIT_Y = 800;

export const SplitFrame: React.FC<{
  num: number;
  title: string;
  faceSrc: string;
  faceTrimBefore?: number;
  // A single still frame (cover): show everything without the entry animation.
  still?: boolean;
  children: React.ReactNode;
}> = ({num, title, faceSrc, faceTrimBefore, still = false, children}) => {
  const frame = useCurrentFrame();
  const enter = useEnter(6, 18);
  const p = still ? 1 : enter;
  const line = still ? 1 : ease(frame, 0, 20);
  return (
    <Background>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: SPLIT_Y, overflow: 'hidden'}}>
        <OffthreadVideo src={staticFile(faceSrc)} muted trimBefore={faceTrimBefore} style={{width: 1080, height: SPLIT_Y, objectFit: 'cover'}} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(10,10,11,0) 62%, rgba(10,10,11,0.75) 84%, rgba(10,10,11,0.97) 100%)',
          }}
        />
      </div>
      <div style={{position: 'absolute', left: 0, top: SPLIT_Y - 2, height: 4, width: 1080 * line, background: C.gold}} />
      <div style={{position: 'absolute', left: 60, right: 60, top: SPLIT_Y - 128, opacity: p, transform: `translateY(${(1 - p) * 16}px)`}}>
        <Kicker size={22}>
          Estructuras de mercado · {num}/{SERIES_TOTAL}
        </Kicker>
        <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 62, lineHeight: 1.05, marginTop: 8, letterSpacing: '-0.01em', textShadow: '0 2px 18px rgba(0,0,0,0.6)'}}>
          {title}
        </div>
      </div>
      {children}
    </Background>
  );
};
