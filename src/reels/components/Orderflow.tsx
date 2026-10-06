import React from 'react';
import {interpolate, random} from 'remotion';
import {C, DISPLAY, FONT} from '../../theme';
import {ZONE} from '../ReelFrame';

// Footprint candles (left) + vertical order book (right) sharing one price ladder.
// Everything is driven by a candle schedule in seconds of the voice track.

// autoPressure: each candle's footprint follows its own direction instead of the phase pressure.
export type Phase = {from: number; to: number; pressure: number; candles: [number, number, number, number][]; autoPressure?: boolean};

type Sched = {start: number; end: number; o: number; h: number; l: number; c: number; pressure: number; idx: number};

// Gold outline + tag on one candle's body or wicks, between two times (seconds).
export type Highlight = {from: number; to: number; idx: number; kind: 'body' | 'wick'; label: string};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const TICK = 0.25;
const BASE_PRICE = 100;
const DEFAULT_ROW_H = 34;
const COLS = 6;
const COL_W = 106;
const CHART_X = ZONE.left;
const CHART_W = COLS * COL_W; // 636
const BOOK_X = 726;
const BOOK_RIGHT = 940;

const fmt = (level: number) => (BASE_PRICE + level * TICK).toFixed(2);

const buildSchedule = (phases: Phase[]): Sched[] => {
  const out: Sched[] = [];
  for (const ph of phases) {
    const d = (ph.to - ph.from) / ph.candles.length;
    ph.candles.forEach(([o, h, l, c], k) => {
      const pr = ph.autoPressure ? Math.max(-1, Math.min(1, (c - o) / 3)) * 0.9 : ph.pressure;
      out.push({start: ph.from + k * d, end: ph.from + (k + 1) * d, o, h, l, c, pressure: pr, idx: out.length});
    });
  }
  return out;
};

// Bid (sold at bid) / ask (bought at ask) volume per level of a candle.
const volumes = (cd: Sched, level: number, wickPressure: boolean) => {
  const base = 8 + Math.floor(random(`fp-${cd.idx}-${level}-b`) * 42);
  const skew = (random(`fp-${cd.idx}-${level}-s`) - 0.5) * 0.36;
  // In a wick the other side pushed back: sellers at the top, buyers at the bottom.
  let pr = cd.pressure;
  if (wickPressure && level > Math.max(cd.o, cd.c)) pr = -0.9;
  if (wickPressure && level < Math.min(cd.o, cd.c)) pr = 0.9;
  const share = Math.max(0.08, Math.min(0.92, 0.5 + 0.32 * pr + skew));
  return {bid: Math.round(base * 2 * (1 - share)), ask: Math.round(base * 2 * share)};
};

// Price path inside a candle: up candles go o→l→h→c, down candles o→h→l→c.
const walk = (cd: Sched, p: number) => {
  const pts = cd.c >= cd.o ? [cd.o, cd.l, cd.h, cd.c] : [cd.o, cd.h, cd.l, cd.c];
  const seg = [0, 1, 2].map((i) => Math.max(0.5, Math.abs(pts[i + 1] - pts[i])));
  const total = seg.reduce((a, b) => a + b, 0);
  let s = p * total;
  let price = pts[3];
  let lo = pts[0];
  let hi = pts[0];
  for (let i = 0; i < 3; i++) {
    if (s <= seg[i]) {
      price = pts[i] + (pts[i + 1] - pts[i]) * (s / seg[i]);
      break;
    }
    s -= seg[i];
    lo = Math.min(lo, pts[i + 1]);
    hi = Math.max(hi, pts[i + 1]);
  }
  return {price, lo: Math.min(lo, price), hi: Math.max(hi, price)};
};

// Buy/sell pressure read from the candles themselves: how far the live price
// sits from the previous candle's open, in ticks (continuous across candles).
export const livePressure = (phases: Phase[], t: number) => {
  const sched = buildSchedule(phases);
  let cur = -1;
  sched.forEach((cd, i) => {
    if (t >= cd.start) cur = i;
  });
  if (cur < 0) return 0;
  const cd = sched[cur];
  const p = interpolate(t, [cd.start, cd.end], [0, 1], clamp);
  const price = walk(cd, p).price;
  const ref = cur > 0 ? sched[cur - 1].o : cd.o;
  return Math.max(-1, Math.min(1, (price - ref) / 4));
};

export const OrderflowSection: React.FC<{
  t: number;
  phases: Phase[];
  pressure: (t: number) => number;
  levels: [number, number]; // [lowest, highest] tick level drawn
  top: number;
  states: {word: string; color: string; from: number; to: number}[];
  rowH?: number;
  wickPressure?: boolean;
  highlights?: Highlight[];
  // 'overlay' draws the state word over the chart; 'header' puts it on the header row.
  statePlacement?: 'overlay' | 'header';
}> = ({t, phases, pressure, levels, top, states, rowH = DEFAULT_ROW_H, wickPressure = false, highlights = [], statePlacement = 'overlay'}) => {
  const ROW_H = rowH;
  const sched = React.useMemo(() => buildSchedule(phases), [phases]);
  const [lMin, lMax] = levels;
  const rows = lMax - lMin + 1;
  const bottom = top + rows * ROW_H;
  const y = (level: number) => top + (lMax - level + 0.5) * ROW_H;

  // Forming candle and horizontal scroll.
  let cur = -1;
  sched.forEach((cd, i) => {
    if (t >= cd.start) cur = i;
  });
  const shift = cur >= 0 ? interpolate(t, [sched[cur].start, sched[cur].start + 0.25], [0, 1], clamp) : 0;
  const curF = cur - 1 + shift;
  const colX = (i: number) => CHART_X + (Math.min(curF, COLS - 1) - (curF - i)) * COL_W;

  const live = cur >= 0 ? sched[cur] : null;
  const liveP = live ? interpolate(t, [live.start, live.end], [0, 1], clamp) : 0;
  const liveWalk = live ? walk(live, liveP) : null;
  const lastPrice = liveWalk ? liveWalk.price : 0;
  const lastLevel = Math.round(lastPrice);

  const p = pressure(t);
  const buyShare = (1 + p) / 2;

  const state = states.find((s) => t >= s.from - 0.25 && t < s.to + 0.25);
  const stateO = state ? interpolate(t, [state.from - 0.25, state.from, state.to, state.to + 0.25], [0, 1, 1, 0], clamp) : 0;

  return (
    <>
      <div style={{position: 'absolute', left: CHART_X, top: top - 46, fontSize: 22, fontWeight: 600, letterSpacing: '0.22em', color: C.muted}}>
        VELAS + FOOTPRINT
      </div>
      <div style={{position: 'absolute', left: BOOK_X, width: BOOK_RIGHT - BOOK_X, top: top - 46, textAlign: 'center', fontSize: 22, fontWeight: 600, letterSpacing: '0.12em', color: C.red}}>
        VENTA {Math.round((1 - buyShare) * 100)}%
      </div>
      <div style={{position: 'absolute', left: BOOK_X, width: BOOK_RIGHT - BOOK_X, top: bottom + 12, textAlign: 'center', fontSize: 22, fontWeight: 600, letterSpacing: '0.12em', color: C.green}}>
        COMPRA {Math.round(buyShare * 100)}%
      </div>
      <svg width={1080} height={1920} style={{position: 'absolute'}} fontFamily={FONT}>
        <defs>
          <clipPath id="fp-clip">
            <rect x={CHART_X - 4} y={top - 4} width={CHART_W + 8} height={bottom - top + 8} />
          </clipPath>
        </defs>
        {/* row grid */}
        {new Array(rows).fill(0).map((_, k) => (
          <line key={k} x1={CHART_X} x2={BOOK_RIGHT} y1={top + k * ROW_H} y2={top + k * ROW_H} stroke="rgba(255,255,255,0.04)" />
        ))}

        {/* footprint candles */}
        <g clipPath="url(#fp-clip)">
          {sched.map((cd, i) => {
            if (i > cur) return null;
            const x = colX(i);
            if (x < CHART_X - COL_W || x > CHART_X + CHART_W) return null;
            const fade = interpolate(x, [CHART_X - COL_W * 0.8, CHART_X], [0, 1], clamp);
            const done = i < cur || liveP >= 1;
            const w = done ? {price: cd.c, lo: cd.l, hi: cd.h} : walk(cd, liveP);
            const close = w.price;
            const up = close >= cd.o;
            const color = up ? C.green : C.red;
            const lvLo = Math.round(w.lo);
            const lvHi = Math.round(w.hi);
            const grow = done ? 1 : Math.min(1, liveP * 1.4 + 0.15);
            const cells = [];
            let poc = lvLo;
            let pocVol = -1;
            for (let lv = lvLo; lv <= lvHi; lv++) {
              const v = volumes(cd, lv, wickPressure);
              if (v.bid + v.ask > pocVol) {
                pocVol = v.bid + v.ask;
                poc = lv;
              }
              cells.push({lv, bid: Math.round(v.bid * grow), ask: Math.round(v.ask * grow)});
            }
            const bodyTop = y(Math.max(cd.o, close)) - ROW_H / 2 + 4;
            const bodyBot = y(Math.min(cd.o, close)) + ROW_H / 2 - 4;
            return (
              <g key={i} opacity={fade}>
                <line x1={x + 12} x2={x + 12} y1={y(w.hi) - ROW_H / 2 + 3} y2={y(w.lo) + ROW_H / 2 - 3} stroke={color} strokeWidth={2.5} />
                <rect x={x + 5} y={bodyTop} width={14} height={Math.max(6, bodyBot - bodyTop)} rx={2} fill={color} />
                {cells.map((cell) => {
                  const strongBuy = cell.ask >= cell.bid * 1.6 && cell.ask > 6;
                  const strongSell = cell.bid >= cell.ask * 1.6 && cell.bid > 6;
                  const fill = strongBuy ? 'rgba(38,194,129,0.32)' : strongSell ? 'rgba(240,70,90,0.32)' : 'rgba(255,255,255,0.05)';
                  const isPoc = done && cell.lv === poc;
                  return (
                    <g key={cell.lv}>
                      <rect
                        x={x + 26}
                        y={y(cell.lv) - ROW_H / 2 + 1.5}
                        width={COL_W - 32}
                        height={ROW_H - 3}
                        rx={3}
                        fill={fill}
                        stroke={isPoc ? C.gold : 'none'}
                        strokeWidth={2}
                      />
                      <text x={x + 32} y={y(cell.lv) + 5.5} fontSize={16} fontWeight={500} fill={strongSell ? C.white : C.text}>
                        {cell.bid}
                      </text>
                      <text x={x + COL_W - 12} y={y(cell.lv) + 5.5} fontSize={16} fontWeight={500} textAnchor="end" fill={strongBuy ? C.white : C.text}>
                        {cell.ask}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </g>

        {/* last price line from the forming candle to the book */}
        {live ? (
          <line
            x1={colX(cur) + COL_W - 4}
            x2={BOOK_X}
            y1={y(lastLevel)}
            y2={y(lastLevel)}
            stroke={C.gold}
            strokeWidth={2}
            strokeDasharray="6 6"
            opacity={0.8}
          />
        ) : null}

        {/* highlights on a candle's body or wicks */}
        {highlights.map((hl, k) => {
          const cd = sched[hl.idx];
          if (!cd || hl.idx > cur) return null;
          const o = interpolate(t, [hl.from - 0.2, hl.from + 0.15, hl.to - 0.15, hl.to + 0.2], [0, 1, 1, 0], clamp);
          if (o <= 0) return null;
          const x = colX(hl.idx);
          if (x < CHART_X - 4 || x > CHART_X + CHART_W) return null;
          const done = hl.idx < cur || liveP >= 1;
          const w = done ? {price: cd.c, lo: cd.l, hi: cd.h} : walk(cd, liveP);
          const bTop = Math.max(cd.o, w.price);
          const bBot = Math.min(cd.o, w.price);
          const pad = 6;
          const boxes: {y0: number; y1: number}[] = [];
          if (hl.kind === 'body') {
            boxes.push({y0: y(bTop) - ROW_H / 2, y1: y(bBot) + ROW_H / 2});
          } else {
            if (w.hi > bTop + 0.5) boxes.push({y0: y(w.hi) - ROW_H / 2, y1: y(bTop) - ROW_H / 2 + 4});
            if (w.lo < bBot - 0.5) boxes.push({y0: y(bBot) + ROW_H / 2 - 4, y1: y(w.lo) + ROW_H / 2});
          }
          const above = y(w.hi) - ROW_H / 2 - 30;
          // Keep the tag clear of the state pill in the top-left corner.
          const tagY = above > top + (statePlacement === 'overlay' ? 110 : 20) ? above : y(w.lo) + ROW_H / 2 + 34;
          const tagW = hl.label.length * 13.5 + 28;
          const tagX = Math.max(CHART_X + tagW / 2, Math.min(CHART_X + CHART_W - tagW / 2, x + COL_W / 2));
          const pulse = 1 + 0.06 * Math.sin(t * 8);
          return (
            <g key={k} opacity={o}>
              {boxes.map((b, j) => (
                <rect
                  key={j}
                  x={x - pad + 2}
                  y={b.y0 - pad}
                  width={COL_W - 2 * pad + 8}
                  height={Math.max(12, b.y1 - b.y0) + pad * 2}
                  rx={8}
                  fill="rgba(227,168,43,0.10)"
                  stroke={C.gold}
                  strokeWidth={4 * pulse}
                />
              ))}
              <rect x={tagX - tagW / 2} y={tagY - 22} width={tagW} height={40} rx={20} fill={C.gold} />
              <text x={tagX} y={tagY + 6} textAnchor="middle" fontSize={22} fontWeight={700} fill={C.bg} fontFamily={DISPLAY}>
                {hl.label}
              </text>
            </g>
          );
        })}

        {/* vertical pressure bar: red (sellers) from the top, green (buyers) from the bottom */}
        <rect x={BOOK_X - 22} y={top} width={10} height={bottom - top} rx={5} fill={C.red} />
        <rect x={BOOK_X - 22} y={top + (bottom - top) * (1 - buyShare)} width={10} height={(bottom - top) * buyShare} rx={5} fill={C.green} />

        {/* order book ladder */}
        {new Array(rows).fill(0).map((_, k) => {
          const lv = lMax - k;
          const cy = y(lv);
          const isLast = lv === lastLevel;
          const base = 18 + random(`dom-${lv}`) * 60;
          const jitter = 1 + 0.18 * Math.sin(t * 3.1 + lv * 1.7);
          const dist = Math.abs(lv - lastPrice);
          const depth = 0.55 + Math.min(1, dist / 6) * 0.6; // thinner near the price
          const isAsk = lv > lastLevel;
          const isBid = lv < lastLevel;
          const size = Math.round(base * jitter * depth * (isAsk ? 1 - 0.6 * p : 1 + 0.6 * p));
          const midL = BOOK_X + 76;
          const midR = BOOK_X + 144;
          const barMax = midL - BOOK_X;
          const bw = Math.max(34, Math.min(barMax, (size / 110) * barMax));
          return (
            <g key={lv}>
              {isBid ? (
                <>
                  <rect x={midL - 2 - bw} y={cy - ROW_H / 2 + 4} width={bw} height={ROW_H - 8} rx={3} fill={C.green} opacity={0.7} />
                  <text x={midL - 8} y={cy + 5.5} fontSize={16} fontWeight={700} textAnchor="end" fill={C.white}>
                    {size}
                  </text>
                </>
              ) : null}
              {isAsk ? (
                <>
                  <rect x={midR + 2} y={cy - ROW_H / 2 + 4} width={bw} height={ROW_H - 8} rx={3} fill={C.red} opacity={0.7} />
                  <text x={midR + 8} y={cy + 5.5} fontSize={16} fontWeight={700} fill={C.white}>
                    {size}
                  </text>
                </>
              ) : null}
              {isLast ? (
                <rect x={midL} y={cy - ROW_H / 2 + 1} width={midR - midL} height={ROW_H - 2} rx={5} fill={C.goldSoft} stroke={C.gold} strokeWidth={2} />
              ) : null}
              <text x={(midL + midR) / 2} y={cy + 5.5} fontSize={15} fontWeight={isLast ? 700 : 500} textAnchor="middle" fill={isLast ? C.gold : C.muted}>
                {fmt(lv)}
              </text>
            </g>
          );
        })}
      </svg>
      {state && statePlacement === 'header' ? (
        <div
          style={{
            position: 'absolute',
            right: 1080 - (CHART_X + CHART_W),
            top: top - 66,
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: 38,
            letterSpacing: '0.06em',
            color: state.color,
            opacity: stateO,
            background: 'rgba(10,10,11,0.9)',
            border: `2px solid ${state.color}`,
            borderRadius: 12,
            padding: '0 16px 2px',
          }}
        >
          {state.word}
        </div>
      ) : null}
      {state && statePlacement === 'overlay' ? (
        <div
          style={{
            position: 'absolute',
            left: CHART_X + 6,
            top: top + 4,
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: 76,
            letterSpacing: '0.04em',
            color: state.color,
            opacity: stateO,
            background: 'rgba(10,10,11,0.88)',
            border: `2px solid ${state.color}`,
            borderRadius: 16,
            padding: '2px 22px 6px',
            transform: `scale(${0.9 + stateO * 0.1})`,
            transformOrigin: 'left top',
          }}
        >
          {state.word}
        </div>
      ) : null}
    </>
  );
};
