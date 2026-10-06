# Generates the illustrative chart SVG used in the guide (not a real market).
import math, random
random.seed(7)
W, H = 760, 380
# price path anchors (index, price)
anchors = [(0, 112), (8, 104), (14, 109), (20, 98), (26, 92), (31, 99), (36, 95), (42, 106), (48, 112), (53, 117), (57, 113), (62, 116)]
n = anchors[-1][0] + 1
def target(i):
    for (i0, p0), (i1, p1) in zip(anchors, anchors[1:]):
        if i0 <= i <= i1:
            return p0 + (p1 - p0) * (i - i0) / (i1 - i0)
    return anchors[-1][1]
lo, hi = 84, 124
plotW = 560
x = lambda i: 20 + i * plotW / n
y = lambda p: 20 + (hi - p) / (hi - lo) * (H - 40)
c = []
prev = target(0)
for i in range(n):
    cl = target(i) + random.uniform(-1.6, 1.6)
    o = prev
    h = max(o, cl) + random.uniform(0.2, 1.6)
    l = min(o, cl) - random.uniform(0.2, 1.6)
    c.append((o, h, l, cl)); prev = cl
right = 20 + plotW + 4
out = [f'<svg viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg" font-family="Inter, sans-serif">']
out.append(f'<rect width="{W}" height="{H}" rx="10" fill="#0F0F12"/>')
for k in range(1, 5):
    yy = 20 + k * (H - 40) / 5
    out.append(f'<line x1="20" x2="{right}" y1="{yy:.1f}" y2="{yy:.1f}" stroke="rgba(255,255,255,0.05)"/>')
def zone(top, bot, x0, col, alpha, bw, label, dash=None):
    style = f'stroke-dasharray="{dash}"' if dash else ''
    out.append(f'<rect x="{x(x0):.1f}" y="{y(top):.1f}" width="{right - x(x0):.1f}" height="{y(bot) - y(top):.1f}" fill="{col}" fill-opacity="{alpha}" stroke="{col}" stroke-width="{bw}" {style}/>')
    out.append(f'<rect x="{right}" y="{(y(top)+y(bot))/2 - 11:.1f}" width="{len(label)*6.3+16:.0f}" height="22" rx="4" fill="{col}" fill-opacity="0.9"/>')
    out.append(f'<text x="{right + 8}" y="{(y(top)+y(bot))/2 + 4:.1f}" font-size="11" font-weight="600" fill="#fff">{label}</text>')
# zones
zone(118.5, 116.5, 3, '#E91E63', 0.22, 3, '4H R | OB- | LIQ [6.5]')
zone(95.5, 91.5, 20, '#26A69A', 0.25, 3, '4H S | OB+ | S [8.1]')
zone(104.5, 103.3, 6, '#FF3B3B', 0.08, 1, 'R [0.7] CT', dash='4 4')
# fib deep band
fy1, fy2 = 101.2, 98.6
out.append(f'<rect x="{x(26):.1f}" y="{y(fy1):.1f}" width="{right - x(26):.1f}" height="{y(fy2)-y(fy1):.1f}" fill="#FFD700" fill-opacity="0.08" stroke="#FFD700" stroke-opacity="0.5" stroke-dasharray="2 3"/>')
for p, nm in [(fy1, '61.8'), (fy2, '78.6')]:
    out.append(f'<line x1="{x(26):.1f}" x2="{right}" y1="{y(p):.1f}" y2="{y(p):.1f}" stroke="#FFD700" stroke-width="1.5" stroke-dasharray="3 3"/>')
    out.append(f'<text x="{right + 8}" y="{y(p)+4:.1f}" font-size="10.5" fill="#FFD700">{nm}</text>')
# candles
cw = plotW / n * 0.62
for i, (o, h, l, cl) in enumerate(c):
    col = '#26C281' if cl >= o else '#F0465A'
    out.append(f'<line x1="{x(i)+cw/2:.1f}" x2="{x(i)+cw/2:.1f}" y1="{y(h):.1f}" y2="{y(l):.1f}" stroke="{col}" stroke-width="1.2"/>')
    out.append(f'<rect x="{x(i):.1f}" y="{y(max(o,cl)):.1f}" width="{cw:.1f}" height="{max(1.5, abs(y(o)-y(cl))):.1f}" fill="{col}"/>')
# sweep marker under the lowest candle
li = min(range(n), key=lambda i: c[i][2])
out.append(f'<path d="M {x(li)+cw/2:.1f} {y(c[li][2])+8:.1f} l -6 10 h 12 z" fill="#00E676"/>')
# callouts
def callout(nx, ny, text, tx, ty):
    out.append(f'<circle cx="{nx}" cy="{ny}" r="11" fill="#E3A82B"/><text x="{nx}" y="{ny+4}" text-anchor="middle" font-size="12" font-weight="700" fill="#0A0A0B">{text}</text>')
callout(x(1), y(117.5), '1', 0, 0)
callout(x(18), y(93.5), '2', 0, 0)
callout(x(4), y(103.9), '3', 0, 0)
callout(x(24), y(99.9), '4', 0, 0)
callout(x(li)+cw/2 + 20, y(c[li][2])+18, '5', 0, 0)
out.append('</svg>')
open('chart.svg', 'w').write('\n'.join(out))
print('ok', n)
