import React from 'react';
import {C, FONT} from '../theme';

// Progress (0..1) of an annotation tied to a candle index being revealed.
export const after = (shown: number, idx: number, span = 3) =>
  Math.max(0, Math.min(1, (shown - idx) / span));

export const DrawLine: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  progress: number;
  color?: string;
  dashed?: boolean;
  width?: number;
}> = ({x1, y1, x2, y2, progress, color = C.gold, dashed, width = 2}) => {
  if (progress <= 0) return null;
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x1 + (x2 - x1) * progress}
      y2={y1 + (y2 - y1) * progress}
      stroke={color}
      strokeWidth={width}
      strokeDasharray={dashed ? '10 8' : undefined}
      strokeLinecap="round"
    />
  );
};

export const Ring: React.FC<{
  cx: number;
  cy: number;
  r?: number;
  progress: number;
  color?: string;
}> = ({cx, cy, r = 20, progress, color = C.gold}) => {
  if (progress <= 0) return null;
  const pop = progress < 0.7 ? (progress / 0.7) * 1.2 : 1.2 - ((progress - 0.7) / 0.3) * 0.2;
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={r * pop}
        fill="rgba(227,168,43,0.22)"
        stroke={color}
        strokeWidth={3}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r * (1 + progress * 0.9)}
        fill="none"
        stroke={color}
        strokeWidth={2}
        opacity={(1 - progress) * 0.8}
      />
    </g>
  );
};

export const Tag: React.FC<{
  x: number;
  y: number;
  text: string;
  progress: number;
  color?: string;
  bg?: string;
  size?: number;
  anchor?: 'start' | 'middle' | 'end';
}> = ({
  x,
  y,
  text,
  progress,
  color = C.bg,
  bg = C.gold,
  size = 22,
  anchor = 'middle',
}) => {
  if (progress <= 0) return null;
  const w = text.length * size * 0.6 + size * 1.2;
  const h = size * 1.7;
  const left = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  return (
    <g
      opacity={progress}
      transform={`translate(0 ${(1 - progress) * 10})`}
    >
      <rect x={left} y={y - h / 2} width={w} height={h} rx={h / 2} fill={bg} />
      <text
        x={left + w / 2}
        y={y + size * 0.36}
        textAnchor="middle"
        fontFamily={FONT}
        fontWeight={600}
        fontSize={size}
        fill={color}
      >
        {text}
      </text>
    </g>
  );
};

export const Label: React.FC<{
  x: number;
  y: number;
  text: string;
  progress: number;
  color?: string;
  size?: number;
  anchor?: 'start' | 'middle' | 'end';
  weight?: number;
}> = ({x, y, text, progress, color = C.white, size = 24, anchor = 'middle', weight = 600}) => {
  if (progress <= 0) return null;
  return (
    <text
      x={x}
      y={y + (1 - progress) * 10}
      textAnchor={anchor}
      fontFamily={FONT}
      fontWeight={weight}
      fontSize={size}
      fill={color}
      opacity={progress}
    >
      {text}
    </text>
  );
};

export const Arrow: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  progress: number;
  color?: string;
  width?: number;
}> = ({x1, y1, x2, y2, progress, color = C.white, width = 4}) => {
  if (progress <= 0) return null;
  const ex = x1 + (x2 - x1) * progress;
  const ey = y1 + (y2 - y1) * progress;
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const head = 18;
  const a1 = ang + Math.PI * 0.82;
  const a2 = ang - Math.PI * 0.82;
  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={ex}
        y2={ey}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
      />
      <path
        d={`M ${ex + Math.cos(a1) * head} ${ey + Math.sin(a1) * head} L ${ex} ${ey} L ${ex + Math.cos(a2) * head} ${ey + Math.sin(a2) * head}`}
        stroke={color}
        strokeWidth={width}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
};
