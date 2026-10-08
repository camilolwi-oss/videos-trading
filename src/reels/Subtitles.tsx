import React from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, DISPLAY} from '../theme';
import {ZONE} from './ReelFrame';

// A caption page, in seconds of the voice track. Wrap key words in *asterisks* to paint them gold.
export type Page = {from: number; to: number; text: string};

const HOLD = 0.3;

const renderText = (text: string) =>
  text.split(/(\*[^*]+\*)/).map((part, i) =>
    part.startsWith('*') ? (
      <span key={i} style={{color: C.gold}}>
        {part.slice(1, -1)}
      </span>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );

export const Subtitles: React.FC<{pages: Page[]; top?: number; size?: number}> = ({pages, top = ZONE.subsTop, size = 58}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const active = pages.filter((p) => t >= p.from && t < p.to + HOLD);
  const page = active[active.length - 1];
  if (!page) return null;
  const p = spring({frame: (t - page.from) * fps, fps, config: {damping: 200}, durationInFrames: 7});
  return (
    <div
      style={{
        position: 'absolute',
        left: ZONE.left,
        right: 140,
        top,
        textAlign: 'center',
        fontFamily: DISPLAY,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1.18,
        color: C.white,
        opacity: p,
        transform: `translateY(${(1 - p) * 14}px) scale(${0.96 + p * 0.04})`,
      }}
    >
      {renderText(page.text)}
    </div>
  );
};
