import React from 'react';
import {random} from 'remotion';
import {C, FONT} from '../../theme';

type V3 = [number, number, number];

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

// A fine-line cube that starts as a flat price × time square and extrudes
// into depth (volume). Labels sit on the faces: time in front, price on top,
// volume on the side. Every input is 0..1 and driven from outside.
export const Cube3D: React.FC<{
  cx: number;
  cy: number;
  r: number;
  angle: number;
  tilt: number;
  depth: number;
  time: number;
  price: number;
  volume: number;
  labels3d: number;
  dots: number;
  opacity?: number;
}> = ({cx, cy, r, angle, tilt, depth, time, price, volume, labels3d, dots, opacity = 1}) => {
  const ca = Math.cos(angle);
  const sa = Math.sin(angle);
  const cb = Math.cos(tilt);
  const sb = Math.sin(tilt);
  const rot = ([x, y, z]: V3): V3 => {
    const x1 = x * ca + z * sa;
    const z1 = -x * sa + z * ca;
    return [x1, y * cb - z1 * sb, y * sb + z1 * cb];
  };
  const proj = (v: V3) => {
    const [x, y, z] = rot(v);
    const k = 5 / (5 - z);
    return {x: cx + x * k * r, y: cy - y * k * r, z, k};
  };
  const zb = 1 - 2 * depth; // back face position: equals the front when flat
  const V: V3[] = [
    [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
    [-1, -1, zb], [1, -1, zb], [1, 1, zb], [-1, 1, zb],
  ];
  const P = V.map(proj);
  const faces = [
    {id: 'front', v: [0, 1, 2, 3], n: [0, 0, 1] as V3},
    {id: 'back', v: [4, 5, 6, 7], n: [0, 0, -1] as V3},
    {id: 'top', v: [3, 2, 6, 7], n: [0, 1, 0] as V3},
    {id: 'bottom', v: [0, 1, 5, 4], n: [0, -1, 0] as V3},
    {id: 'right', v: [1, 5, 6, 2], n: [1, 0, 0] as V3},
    {id: 'left', v: [0, 4, 7, 3], n: [-1, 0, 0] as V3},
  ];
  const visible = new Set(faces.filter((f) => rot(f.n)[2] > 0.02 && (depth > 0.02 || f.id === 'front')).map((f) => f.id));
  const edges: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  const edgeVisible = (a: number, b: number) => faces.some((f) => visible.has(f.id) && f.v.includes(a) && f.v.includes(b));
  const center = (ids: number[]) => ({
    x: ids.reduce((s, i) => s + P[i].x, 0) / ids.length,
    y: ids.reduce((s, i) => s + P[i].y, 0) / ids.length,
  });
  const fFront = center([0, 1, 2, 3]);
  const fTop = center([3, 2, 6, 7]);
  const fRight = center([1, 5, 6, 2]);
  // flat-square label spots: time under the bottom edge, price left of the left edge
  const tFlat = {x: (P[0].x + P[1].x) / 2, y: (P[0].y + P[1].y) / 2 + 52};
  const pFlat = {x: P[0].x - 26, y: (P[0].y + P[3].y) / 2 + 10};
  const label = (text: string, x: number, y: number, o: number, color: string, anchor: 'middle' | 'end' = 'middle') =>
    o > 0 ? (
      <text x={x} y={y} textAnchor={anchor} fontFamily={FONT} fontWeight={600} fontSize={28} letterSpacing="0.12em" fill={color} opacity={o}>
        {text}
      </text>
    ) : null;
  const nDots = 40;
  const pts = new Array(nDots).fill(0).map((_, i) => {
    const q: V3 = [random(`cb-x-${i}`) * 1.6 - 0.8, random(`cb-y-${i}`) * 1.6 - 0.8, lerp(0.85, zb + 0.15, random(`cb-z-${i}`))];
    return {p: proj(q), on: i / nDots < dots, buy: random(`cb-s-${i}`) > 0.45, i};
  });
  const right = faces.find((f) => f.id === 'right');
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity}}>
      {/* the volume face gets a faint gold tint */}
      {right && visible.has('right') && volume > 0 ? (
        <polygon points={right.v.map((i) => `${P[i].x},${P[i].y}`).join(' ')} fill={C.gold} fillOpacity={0.1 * volume} />
      ) : null}
      {edges.map(([a, b], k) => {
        const vis = edgeVisible(a, b);
        if (!vis && depth < 0.05) return null;
        const isTime = a === 0 && b === 1;
        const isPrice = a === 3 && b === 0;
        const isVol = (a === 1 && b === 5) || (a === 2 && b === 6) || (a === 5 && b === 6);
        let stroke = 'rgba(244,244,245,0.82)';
        let w = 2;
        if (isTime && time > 0) w = 2 + time * 1.5;
        if (isPrice && price > 0) w = 2 + price * 1.5;
        if (isVol && volume > 0) stroke = `rgba(227,168,43,${0.6 + 0.4 * volume})`;
        return (
          <line
            key={k}
            x1={P[a].x}
            y1={P[a].y}
            x2={P[b].x}
            y2={P[b].y}
            stroke={vis ? stroke : 'rgba(244,244,245,0.18)'}
            strokeWidth={vis ? w : 1.5}
            strokeDasharray={vis ? undefined : '6 8'}
            strokeLinecap="round"
          />
        );
      })}
      {pts
        .filter((d) => d.on)
        .map((d) => (
          <circle key={d.i} cx={d.p.x} cy={d.p.y} r={3.6 * d.p.k} fill={d.buy ? C.green : C.red} opacity={0.75} />
        ))}
      {label('TIEMPO', lerp(tFlat.x, fFront.x, labels3d), lerp(tFlat.y, fFront.y + 11, labels3d), time, C.white)}
      {label('PRECIO', lerp(pFlat.x, fTop.x, labels3d), lerp(pFlat.y, fTop.y + 11, labels3d), price, C.white, labels3d > 0.5 ? 'middle' : 'end')}
      {visible.has('right') ? label('VOLUMEN', fRight.x, fRight.y + 11, volume, C.gold) : null}
    </svg>
  );
};
