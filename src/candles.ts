import {random} from 'remotion';

export type Candle = {o: number; h: number; l: number; c: number};

// Builds deterministic candles that follow a piecewise-linear path through
// [index, price] anchors, so swing points land exactly where we annotate them.
export const buildCandles = (
  anchors: [number, number][],
  seed: string,
  noise = 0.35,
  wick = 0.35,
): Candle[] => {
  const n = anchors[anchors.length - 1][0] + 1;
  const target = (i: number) => {
    for (let k = 0; k < anchors.length - 1; k++) {
      const [i0, p0] = anchors[k];
      const [i1, p1] = anchors[k + 1];
      if (i >= i0 && i <= i1) {
        return p0 + ((p1 - p0) * (i - i0)) / (i1 - i0);
      }
    }
    return anchors[anchors.length - 1][1];
  };
  const isAnchor = new Set(anchors.map(([i]) => i));
  const out: Candle[] = [];
  let prev = target(0);
  for (let i = 0; i < n; i++) {
    const t = target(i);
    const jitter = isAnchor.has(i) ? 0.15 : 1;
    const c = t + (random(`${seed}-c-${i}`) - 0.5) * 2 * noise * jitter;
    const o = prev;
    const h = Math.max(o, c) + random(`${seed}-h-${i}`) * wick;
    const l = Math.min(o, c) - random(`${seed}-l-${i}`) * wick;
    out.push({o, h, l, c});
    prev = c;
  }
  return out;
};
