import React from 'react';
import {random} from 'remotion';
import {C, DISPLAY, FONT} from '../../theme';

type V3 = [number, number, number];

// Wireframe cube in true perspective: x = time, y = price, z = volume (depth).
// Axis strengths and the participant dots are driven from outside (0..1).
export const Cube3D: React.FC<{
  cx: number;
  cy: number;
  r: number;
  angle: number;
  tilt?: number;
  time: number;
  price: number;
  volume: number;
  dots: number;
}> = ({cx, cy, r, angle, tilt = -0.42, time, price, volume, dots}) => {
  const ca = Math.cos(angle);
  const sa = Math.sin(angle);
  const cb = Math.cos(tilt);
  const sb = Math.sin(tilt);
  const proj = ([x, y, z]: V3) => {
    const x1 = x * ca + z * sa;
    const z1 = -x * sa + z * ca;
    const y2 = y * cb - z1 * sb;
    const z2 = y * sb + z1 * cb;
    const k = 4.2 / (4.2 - z2);
    return {x: cx + x1 * k * r, y: cy - y2 * k * r, z: z2, k};
  };
  const V: V3[] = [
    [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
    [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
  ];
  const P = V.map(proj);
  const edges: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  const faces: number[][] = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [3, 2, 6, 7], [0, 3, 7, 4], [1, 2, 6, 5]];
  const sortedFaces = faces
    .map((f) => ({f, z: f.reduce((a, i) => a + P[i].z, 0) / 4}))
    .sort((a, b) => a.z - b.z);
  // axes from the front-bottom-left corner (vertex 0)
  const axes = [
    {to: 1, s: time, color: C.white, label: 'TIEMPO', dir: [1.32, -1, 1] as V3},
    {to: 3, s: price, color: C.white, label: 'PRECIO', dir: [-1, 1.3, 1] as V3},
    {to: 4, s: volume, color: C.gold, label: 'VOLUMEN', dir: [-1.1, -1.25, -1.95] as V3},
  ];
  const nDots = 70;
  const pts = new Array(nDots).fill(0).map((_, i) => {
    const q: V3 = [random(`cd-x-${i}`) * 1.7 - 0.85, random(`cd-y-${i}`) * 1.7 - 0.85, random(`cd-z-${i}`) * 1.7 - 0.85];
    return {p: proj(q), on: i / nDots < dots, buy: random(`cd-s-${i}`) > 0.45, i};
  });
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} fontFamily={FONT}>
      {sortedFaces.map(({f}, k) => (
        <polygon key={k} points={f.map((i) => `${P[i].x},${P[i].y}`).join(' ')} fill={C.gold} fillOpacity={0.05 + volume * 0.07} />
      ))}
      {edges.map(([a, b], k) => (
        <line key={k} x1={P[a].x} y1={P[a].y} x2={P[b].x} y2={P[b].y} stroke="rgba(255,255,255,0.28)" strokeWidth={2} />
      ))}
      {pts
        .filter((d) => d.on)
        .sort((a, b) => a.p.z - b.p.z)
        .map((d) => (
          <circle key={d.i} cx={d.p.x} cy={d.p.y} r={6 * d.p.k} fill={d.buy ? C.green : C.red} opacity={0.9} />
        ))}
      {axes.map((ax) => {
        if (ax.s <= 0) return null;
        const a = P[0];
        const b = P[ax.to];
        const ex = a.x + (b.x - a.x) * Math.min(1, ax.s * 1.2);
        const ey = a.y + (b.y - a.y) * Math.min(1, ax.s * 1.2);
        const lp = proj(ax.dir);
        const big = ax.label === 'VOLUMEN';
        return (
          <g key={ax.label}>
            <line x1={a.x} y1={a.y} x2={ex} y2={ey} stroke={ax.color} strokeWidth={big ? 9 : 6} strokeLinecap="round" />
            <text
              x={lp.x}
              y={lp.y + 10}
              textAnchor="middle"
              fontFamily={DISPLAY}
              fontWeight={800}
              fontSize={big ? 44 : 34}
              fill={ax.color}
              opacity={Math.min(1, ax.s * 1.5)}
              letterSpacing="0.06em"
            >
              {ax.label}
            </text>
          </g>
        );
      })}
      <circle cx={P[0].x} cy={P[0].y} r={9} fill={C.gold} />
    </svg>
  );
};
