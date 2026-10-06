import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {Background, Caption, Gold, Reveal, SceneHeader, useWindow} from '../components/ui';
import {C, DISPLAY, FONT} from '../theme';

const prices = [100.0, 100.25, 100.5, 100.25, 100.75, 101.0];
const CYCLE = 48;
const FIRST = 50;

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const Precio: React.FC = () => {
  const frame = useCurrentFrame();
  const local = frame - FIRST;
  const k = Math.max(0, Math.min(prices.length - 1, Math.floor(local / CYCLE)));
  const t = local - k * CYCLE; // frame inside current cycle
  const active = local >= 0 && local < prices.length * CYCLE;
  // Buyer and seller travel towards each other and meet at t=22.
  const meet = interpolate(t, [0, 22], [0, 1], {
    ...clamp,
    easing: (x) => 1 - Math.pow(1 - x, 3),
  });
  const flash = active ? interpolate(t, [22, 26, 44], [0, 1, 0], clamp) : 0;
  const tag = active ? interpolate(t, [22, 28, 42, 47], [0, 1, 1, 0], clamp) : 0;
  const dotsIn = active ? interpolate(t, [0, 6, 40, 47], [0, 1, 1, 0], clamp) : 0;

  const cx = 560;
  const cy = 625;
  const buyerX = cx - 300 + 262 * meet;
  const sellerX = cx + 300 - 262 * meet;
  const summary = interpolate(local, [prices.length * CYCLE, prices.length * CYCLE + 15], [0, 1], clamp);

  // Chart of prints on the right.
  const chart = {x: 1100, y: 430, w: 640, h: 340};
  const printX = (i: number) => chart.x + 40 + (i * (chart.w - 80)) / (prices.length - 1);
  const printY = (p: number) => chart.y + chart.h - 40 - ((p - 99.9) / 1.2) * (chart.h - 80);
  const printsDone = (i: number) => interpolate(local - i * CYCLE, [22, 32], [0, 1], clamp);

  let path = '';
  prices.forEach((p, i) => {
    if (printsDone(i) > 0) path += `${path ? 'L' : 'M'} ${printX(i)} ${printY(p)} `;
  });

  const panelIn = interpolate(frame, [30, 50], [0, 1], clamp);
  const cap1 = useWindow(170, 335);
  const cap2 = useWindow(345, 700);

  return (
    <Background>
      <SceneHeader num="02" title="Qué es el precio" />
      <div style={{position: 'absolute', left: 120, right: 120, top: 270}}>
        <Reveal delay={10}>
          <div style={{fontSize: 36, color: C.text}}>
            El <Gold>monto acordado</Gold> entre un comprador y un vendedor para que se concrete una transacción.
          </div>
        </Reveal>
      </div>
      <svg width={1920} height={1080} style={{position: 'absolute', opacity: panelIn}}>
        <rect x={160} y={chart.y} width={800} height={chart.h} rx={16} fill={C.panel} stroke={C.line} />
        <circle cx={cx} cy={cy} r={60 + flash * 70} fill="none" stroke={C.gold} strokeWidth={3} opacity={flash} />
        <g opacity={dotsIn}>
          <circle cx={buyerX} cy={cy} r={34} fill={C.green} />
          <circle cx={sellerX} cy={cy} r={34} fill={C.red} />
        </g>
        <g opacity={1 - summary}>
          <text x={cx - 300} y={cy + 100} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={22} fill={C.green} letterSpacing="0.15em">
            COMPRADOR
          </text>
          <text x={cx + 300} y={cy + 100} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={22} fill={C.red} letterSpacing="0.15em">
            VENDEDOR
          </text>
        </g>
        <g opacity={summary} fontFamily={DISPLAY} fontWeight={700} fontSize={44} textAnchor="middle">
          <text x={cx} y={cy - 10}>
            <tspan fill={C.green}>Compra</tspan>
            <tspan fill={C.muted}> + </tspan>
            <tspan fill={C.red}>Venta</tspan>
          </text>
          <text x={cx} y={cy + 60} fill={C.gold}>
            = Precio
          </text>
        </g>
        <g opacity={tag} transform={`translate(0 ${(1 - tag) * 16})`}>
          <rect x={cx - 110} y={cy - 140} width={220} height={64} rx={32} fill={C.gold} />
          <text x={cx} y={cy - 97} textAnchor="middle" fontFamily={DISPLAY} fontWeight={800} fontSize={34} fill={C.bg}>
            {prices[k].toFixed(2)}
          </text>
          <text x={cx} y={cy - 156} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={20} fill={C.gold} letterSpacing="0.2em">
            TRANSACCIÓN
          </text>
        </g>

        <rect x={chart.x} y={chart.y} width={chart.w} height={chart.h} rx={16} fill={C.panel} stroke={C.line} />
        <text x={chart.x + 30} y={chart.y + 44} fontFamily={FONT} fontWeight={600} fontSize={20} fill={C.muted} letterSpacing="0.2em">
          LO QUE VES EN EL GRÁFICO
        </text>
        <path d={path} fill="none" stroke={C.white} strokeWidth={3} opacity={0.8} />
        {prices.map((p, i) => {
          const d = printsDone(i);
          if (d <= 0) return null;
          return (
            <g key={i}>
              <circle cx={printX(i)} cy={printY(p)} r={11 * d} fill={C.gold} />
              <text x={printX(i)} y={printY(p) - 22} textAnchor="middle" fontFamily={FONT} fontSize={18} fill={C.text} opacity={d}>
                {p.toFixed(2)}
              </text>
            </g>
          );
        })}
        <text x={1030} y={cy + 12} textAnchor="middle" fontSize={44} fill={C.gold}>
          →
        </text>
      </svg>
      <Caption opacity={cap1} top={860}>
        Cada print existe porque alguien compró, alguien vendió y se concretó una transacción.
      </Caption>
      <Caption opacity={cap2} top={840} size={50} color={C.white}>
        <span style={{fontFamily: DISPLAY, fontWeight: 700}}>
          Bien leído, el precio no es solo movimiento. <Gold>Es evidencia.</Gold>
        </span>
      </Caption>
    </Background>
  );
};
