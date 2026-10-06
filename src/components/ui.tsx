import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {C, DISPLAY, FONT} from '../theme';

export const useEnter = (delay = 0, duration = 22) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({
    frame: frame - delay,
    fps,
    config: {damping: 200},
    durationInFrames: duration,
  });
};

// 0 → 1 → 0 opacity window, used to swap captions in and out.
export const useWindow = (from: number, to: number, fade = 12) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [from, from + fade, to - fade, to], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
};

export const ease = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.65, 0, 0.35, 1),
  });

export const Background: React.FC<{children?: React.ReactNode}> = ({
  children,
}) => {
  const frame = useCurrentFrame();
  const off = frame * 0.25;
  const mask = 'radial-gradient(ellipse at 50% 45%, black 25%, transparent 78%)';
  return (
    <AbsoluteFill
      style={{backgroundColor: C.bg, fontFamily: FONT, color: C.white}}
    >
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${C.grid} 1px, transparent 1px), linear-gradient(90deg, ${C.grid} 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
          backgroundPosition: `${off}px ${off}px`,
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 88% 6%, rgba(227,168,43,0.09), transparent 42%)',
        }}
      />
      {children}
    </AbsoluteFill>
  );
};

export const Reveal: React.FC<{
  delay?: number;
  y?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({delay = 0, y = 30, style, children}) => {
  const p = useEnter(delay);
  return (
    <div
      style={{
        opacity: p,
        transform: `translateY(${(1 - p) * y}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const Kicker: React.FC<{
  children: React.ReactNode;
  color?: string;
  size?: number;
  style?: React.CSSProperties;
}> = ({children, color = C.gold, size = 22, style}) => (
  <div
    style={{
      fontFamily: FONT,
      fontWeight: 600,
      fontSize: size,
      letterSpacing: '0.28em',
      textTransform: 'uppercase',
      color,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Gold: React.FC<{children: React.ReactNode}> = ({children}) => (
  <span style={{color: C.gold}}>{children}</span>
);

export const SceneHeader: React.FC<{num?: string; title: string}> = ({
  num,
  title,
}) => {
  const frame = useCurrentFrame();
  const p = useEnter(0);
  const line = ease(frame, 6, 30);
  return (
    <div style={{position: 'absolute', left: 120, top: 80}}>
      {num ? (
        <div style={{opacity: p}}>
          <Kicker>{num}</Kicker>
        </div>
      ) : null}
      <div
        style={{
          fontFamily: DISPLAY,
          fontWeight: 700,
          fontSize: 62,
          marginTop: 10,
          opacity: p,
          transform: `translateX(${(1 - p) * -30}px)`,
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </div>
      <div
        style={{
          marginTop: 18,
          height: 4,
          width: 140 * line,
          background: C.gold,
          borderRadius: 2,
        }}
      />
    </div>
  );
};

export const Caption: React.FC<{
  children: React.ReactNode;
  opacity?: number;
  top?: number;
  size?: number;
  color?: string;
}> = ({children, opacity = 1, top = 950, size = 34, color = C.text}) => (
  <div
    style={{
      position: 'absolute',
      left: 120,
      right: 120,
      top,
      textAlign: 'center',
      fontSize: size,
      fontWeight: 500,
      color,
      opacity,
      transform: `translateY(${(1 - opacity) * 14}px)`,
    }}
  >
    {children}
  </div>
);

export const QuoteCard: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  size?: number;
}> = ({children, style, size = 46}) => (
  <div
    style={{
      borderLeft: `6px solid ${C.gold}`,
      background: 'linear-gradient(90deg, rgba(227,168,43,0.10), rgba(255,255,255,0.02))',
      padding: '34px 48px',
      borderRadius: 6,
      fontFamily: DISPLAY,
      fontWeight: 700,
      fontSize: size,
      lineHeight: 1.25,
      ...style,
    }}
  >
    {children}
  </div>
);
