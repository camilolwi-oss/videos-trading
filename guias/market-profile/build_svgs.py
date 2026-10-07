"""Genera los diagramas SVG de la guía de Market Profile y los inserta en guia.html.

Uso: python3 build_svgs.py   (lee guia.template.html, escribe guia.html)
"""
import math
from pathlib import Path

HERE = Path(__file__).parent
BG = "#0F0F12"
GOLD = "#E3A82B"
GREEN = "#26C281"
RED = "#F0465A"
PURPLE = "#A970FF"
PINK = "#FF5FA2"
MUTED = "#8E8E96"
TEXT = "#D4D4D8"
WHITE = "#F4F4F5"
FONT = 'font-family="Inter, sans-serif"'
LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"


def lerp(a, b, t):
    return a + (b - a) * t


def period_color(i, n):
    """Bloques tempranos más oscuros, tardíos más claros."""
    t = i / max(n - 1, 1)
    dark, light = (92, 66, 18), (247, 216, 140)
    r, g, b = (round(lerp(dark[k], light[k], t)) for k in range(3))
    return f"#{r:02X}{g:02X}{b:02X}", ("#0A0A0B" if t > 0.45 else WHITE)


def stats(rows):
    """rows: lista de strings de letras, de arriba (precio alto) a abajo.
    Devuelve índice del POC y (vah_idx, val_idx) con el 70% de los TPO."""
    counts = [len(r) for r in rows]
    total = sum(counts)
    poc = max(range(len(rows)), key=lambda i: (counts[i], -abs(i - len(rows) / 2)))
    hi = lo = poc
    acc = counts[poc]
    while acc < 0.7 * total:
        up = counts[hi - 1] if hi > 0 else -1
        dn = counts[lo + 1] if lo < len(rows) - 1 else -1
        if up >= dn:
            hi -= 1
            acc += up
        else:
            lo += 1
            acc += dn
    return poc, hi, lo


def ib_range(rows, periods="AB"):
    idx = [i for i, r in enumerate(rows) if any(p in r for p in periods)]
    return min(idx), max(idx)


def profile_cells(rows, x0, y0, cw, ch, n_periods, letters=True, highlight=None):
    out = []
    for i, r in enumerate(rows):
        for j, ch_ in enumerate(r):
            p = LETTERS.index(ch_)
            fill, fg = period_color(p, n_periods)
            x, y = x0 + j * cw, y0 + i * ch
            stroke = ""
            if highlight and i in highlight:
                stroke = f' stroke="{PINK}" stroke-width="1.6"'
            out.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{cw - 2:.1f}" height="{ch - 2:.1f}" rx="2" fill="{fill}"{stroke}/>')
            if letters:
                out.append(f'<text x="{x + (cw - 2) / 2:.1f}" y="{y + ch / 2 + 3.5:.1f}" font-size="{min(cw, ch) * 0.62:.1f}" font-weight="600" fill="{fg}" text-anchor="middle">{ch_}</text>')
    return out


def hline(x1, x2, y, color, w=2, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return f'<line x1="{x1:.1f}" x2="{x2:.1f}" y1="{y:.1f}" y2="{y:.1f}" stroke="{color}" stroke-width="{w}"{d}/>'


def label(x, y, text, color, size=12, weight=600, anchor="start"):
    return f'<text x="{x:.1f}" y="{y:.1f}" font-size="{size}" font-weight="{weight}" fill="{color}" text-anchor="{anchor}">{text}</text>'


def svg(w, h, body):
    return (f'<svg viewBox="0 0 {w} {h}" xmlns="http://www.w3.org/2000/svg" {FONT}>'
            f'<rect width="{w}" height="{h}" rx="10" fill="{BG}"/>' + "\n".join(body) + "</svg>")


# ---------------------------------------------------------------- 1. construcción
def svg_build():
    """Velas de 30 min a la izquierda → perfil TPO a la derecha."""
    # cada periodo: (alto, bajo) en filas (0 = arriba)
    periods = [(9, 13), (7, 11), (6, 9), (5, 8), (7, 10), (8, 11), (6, 9), (4, 7), (5, 8), (6, 8)]
    n = len(periods)
    nrows = 14
    ch, top = 17, 44
    body = [label(24, 28, "1 · CADA BLOQUE DE 30 MIN ES UNA LETRA", MUTED, 11.5, 600)]
    # izquierda: letras en su columna temporal
    cw = 26
    x0 = 40
    for p, (hi, lo) in enumerate(periods):
        fill, fg = period_color(p, n)
        for r in range(hi, lo + 1):
            x, y = x0 + p * cw, top + r * ch
            body.append(f'<rect x="{x}" y="{y}" width="{cw - 3}" height="{ch - 2}" rx="2" fill="{fill}"/>')
            body.append(f'<text x="{x + (cw - 3) / 2:.1f}" y="{y + 11.5}" font-size="10" font-weight="600" fill="{fg}" text-anchor="middle">{LETTERS[p]}</text>')
    body.append(label(x0, top + nrows * ch + 20, "tiempo →", MUTED, 11, 400))
    # flecha
    ax = x0 + n * cw + 30
    body.append(f'<path d="M{ax} {top + 7 * ch} h50" stroke="{GOLD}" stroke-width="2.5"/><path d="M{ax + 50} {top + 7 * ch - 7} l12 7 l-12 7 z" fill="{GOLD}"/>')
    body.append(label(ax + 31, top + 7 * ch - 14, "se apilan", GOLD, 11, 600, "middle"))
    # derecha: perfil
    rows = ["" for _ in range(nrows)]
    for p, (hi, lo) in enumerate(periods):
        for r in range(hi, lo + 1):
            rows[r] += LETTERS[p]
    px = ax + 90
    body.append(label(px, 28, "2 · EL PERFIL DEL DÍA", MUTED, 11.5, 600))
    body += profile_cells(rows, px, top, 26, ch, n)
    poc, vah, val = stats(rows)
    xr = px + 26 * max(len(r) for r in rows) + 10
    poc_w = len(rows[poc]) * 26
    body.append(f'<rect x="{px - 3}" y="{top + poc * ch - 2}" width="{poc_w + 2}" height="{ch + 1}" rx="3" fill="none" stroke="#FF9A3C" stroke-width="2.2"/>')
    body.append(hline(px + poc_w + 1, xr, top + poc * ch + ch / 2 - 1, "#FF9A3C", 2))
    body.append(label(xr + 6, top + poc * ch + ch / 2 + 3, "POC · más tiempo", "#FF9A3C", 11.5))
    body.append(label(px, top + nrows * ch + 20, "precio ↕ · forma de campana", MUTED, 11, 400))
    return svg(760, top + nrows * ch + 36, body)


# ---------------------------------------------------------------- 2. anatomía
ANATOMY = [
    "L", "L", "KL", "GKL", "GHKL", "CGHIK", "CDGHIJK", "BCDEFGHIJ", "BCDEFHIJ",
    "ABDEFIJ", "ABDEFJ", "ABEF", "AB", "A", "A",
]


def svg_anatomy():
    rows = ANATOMY
    n = 12
    ch, cw, top, px = 21, 24, 28, 90
    body = []
    poc, vah, val = stats(rows)
    ib_hi, ib_lo = ib_range(rows)
    width = max(len(r) for r in rows)
    # banda del área de valor
    body.append(f'<rect x="{px - 8}" y="{top + vah * ch - 3}" width="{width * cw + 16}" height="{(val - vah + 1) * ch + 4}" rx="6" fill="{GREEN}" fill-opacity=".08"/>')
    body += profile_cells(rows, px, top, cw, ch, n)
    xr = px + width * cw + 14
    y_vah = top + vah * ch - 2
    y_val = top + (val + 1) * ch
    y_poc = top + poc * ch + ch / 2 - 1
    body.append(hline(px - 8, xr, y_vah, GREEN, 2.2))
    body.append(hline(px - 8, xr, y_val, GREEN, 2.2))
    poc_w = len(rows[poc]) * cw
    body.append(f'<rect x="{px - 3}" y="{top + poc * ch - 2}" width="{poc_w + 2}" height="{ch + 1}" rx="3" fill="none" stroke="#FF9A3C" stroke-width="2.4"/>')
    body.append(hline(px + poc_w + 1, xr, y_poc, "#FF9A3C", 2.4))
    # IB a la izquierda
    y_ibh, y_ibl = top + ib_hi * ch - 1, top + (ib_lo + 1) * ch - 1
    body.append(hline(30, px + 2 * cw, y_ibh, PURPLE, 2, "5 4"))
    body.append(hline(30, px + 2 * cw, y_ibl, PURPLE, 2, "5 4"))
    body.append(f'<line x1="40" x2="40" y1="{y_ibh}" y2="{y_ibl}" stroke="{PURPLE}" stroke-width="2"/>')
    body.append(label(48, (y_ibh + y_ibl) / 2 - 2, "IB", PURPLE, 13, 700))
    body.append(label(48, (y_ibh + y_ibl) / 2 + 13, "A+B", PURPLE, 10, 500))
    # colas
    for (a, b, txt) in [(0, 1, "Cola superior"), (len(rows) - 2, len(rows) - 1, "Cola inferior")]:
        y1, y2 = top + a * ch, top + (b + 1) * ch - 2
        bx = px + cw + 8
        body.append(f'<path d="M{bx} {y1} h6 v{y2 - y1} h-6" fill="none" stroke="{PINK}" stroke-width="1.6"/>')
        body.append(label(bx + 12, (y1 + y2) / 2 + 4, txt, PINK, 11, 600))
    # etiquetas derecha
    lx = xr + 10
    body.append(label(lx, y_vah + 4, "VAH · máximo del área de valor", GREEN, 12.5))
    body.append(label(lx, y_poc + 4, "POC · punto de control", "#FF9A3C", 12.5))
    body.append(label(lx, y_val + 4, "VAL · mínimo del área de valor", GREEN, 12.5))
    vy = (y_vah + y_val) / 2
    body.append(label(lx, vy - 30, "Área de valor (VA)", WHITE, 12.5, 700))
    body.append(label(lx, vy - 14, "≈ 70% del tiempo del día", MUTED, 11.5, 400))
    body.append(label(lx, vy + 32, "Más oscuro = más temprano", MUTED, 11, 400))
    body.append(label(lx, vy + 47, "Más claro = más tarde", MUTED, 11, 400))
    h = top + len(rows) * ch + 22
    return svg(760, h, body), dict(poc=poc, vah=vah, val=val)


# ---------------------------------------------------------------- 3. initial balance
def svg_ib():
    """Dos escenarios: rotura del IB al alza y aceptación dentro."""
    body = []

    def scen(x0, rows, title, sub, color, arrow_up):
        ch, cw, top = 15, 17, 60
        n = 12
        body.append(label(x0, 28, title, color, 12.5, 700))
        body.append(label(x0, 44, sub, MUTED, 11, 400))
        hi, lo = ib_range(rows)
        wmax = max(len(r) for r in rows)
        body.append(f'<rect x="{x0 - 6}" y="{top + hi * ch - 3}" width="{wmax * cw + 10}" height="{(lo - hi + 1) * ch + 4}" rx="5" fill="{PURPLE}" fill-opacity=".10" stroke="{PURPLE}" stroke-dasharray="5 4"/>')
        body.extend(profile_cells(rows, x0, top, cw, ch, n, letters=True))
        body.append(label(x0 + wmax * cw + 12, top + (hi + lo) / 2 * ch + 12, "IB", PURPLE, 12, 700))
        if arrow_up is not None:
            ax = x0 + wmax * cw + 50
            if arrow_up:
                body.append(f'<path d="M{ax} {top + hi * ch} v-{6 * ch}" stroke="{color}" stroke-width="2.5"/><path d="M{ax - 6} {top + (hi - 6) * ch + 2} l6 -10 l6 10 z" fill="{color}"/>')
                body.append(label(ax + 10, top + (hi - 3) * ch, "construye", color, 11, 600))
                body.append(label(ax + 10, top + (hi - 3) * ch + 14, "valor arriba", color, 11, 600))
    up = ["JKL", "IJKL", "HIJK", "GHI", "FGH", "EFG", "CDEF", "BCDE", "ABCD", "AB", "A"]
    bal = ["B", "ABH", "ABCGHIJ", "ACDEFGHIJKL", "ADEFGIJKL", "ABDEFKL", "ABEF", "AB", "A"]
    scen(40, up, "Rotura del IB al alza", "Se acepta fuera → sesgo alcista del día", GREEN, True)
    scen(420, bal, "El precio se queda dentro del IB", "Rotación → día de balance", GOLD, None)
    return svg(760, 240, body)


# ---------------------------------------------------------------- 4. singles
def svg_singles():
    rows = [
        "NOP", "MNOP", "LMNOP", "KLMNO", "JKLO", "J", "J", "I", "I", "I", "H",
        "FGH", "BCDEFG", "ABCDEFG", "ABCDEF", "ABCE", "AB",
    ]
    n = 16
    ch, cw, top, px = 15, 20, 40, 120
    single_rows = [5, 6, 7, 8, 9, 10]
    body = [label(24, 26, "DÍA DE TENDENCIA POR UNA NOTICIA EXPLOSIVA", MUTED, 11.5, 600)]
    y1, y2 = top + single_rows[0] * ch - 2, top + (single_rows[-1] + 1) * ch
    body.append(f'<rect x="{px - 10}" y="{y1}" width="380" height="{y2 - y1}" fill="{PINK}" fill-opacity=".10"/>')
    body.append(hline(px - 10, px + 370, y1, PINK, 1.6, "4 3"))
    body.append(hline(px - 10, px + 370, y2, PINK, 1.6, "4 3"))
    body += profile_cells(rows, px, top, cw, ch, n, highlight=set(single_rows))
    lx = px + 140
    body.append(label(lx, (y1 + y2) / 2 - 6, "Single prints / vacío", PINK, 13, 700))
    body.append(label(lx, (y1 + y2) / 2 + 11, "Una sola letra por precio: no hubo comercio a dos lados", TEXT, 11.5, 400))
    body.append(label(lx, top + 2 * ch + 4, "Balance nuevo (arriba)", MUTED, 11.5, 500))
    body.append(label(lx, top + 14 * ch + 4, "Balance previo (abajo)", MUTED, 11.5, 500))
    body.append(label(24, top + len(rows) * ch + 20, "Las órdenes agresivas se comieron la liquidez pasiva del libro y el precio salió disparado.", MUTED, 11, 400))
    return svg(760, top + len(rows) * ch + 34, body)


# ---------------------------------------------------------------- 5. tails & poor highs
def svg_tails():
    body = []
    ch, cw, top = 15, 18, 58
    n = 12
    tail = ["K", "K", "JK", "GHJK", "CGHIJ", "BCDGHI", "ABDEFI", "ABDEF", "ABE", "AB", "A", "A"]
    poor = ["DEFGH", "CDEFGHK", "BCDEFHIJK", "ABCIJKL", "ABIJL", "ABJL", "AL", "A"]
    body.append(label(40, 26, "Cola (tail)", PINK, 13, 700))
    body.append(label(40, 42, "Letras sueltas en el extremo: rechazo", MUTED, 11, 400))
    body += profile_cells(tail, 40, top, cw, ch, n, highlight={0, 1, 10, 11})
    body.append(label(40 + 5 * cw + 10, top + 1 * ch + 4, "← cola superior", PINK, 11, 600))
    body.append(label(40 + 3 * cw + 10, top + 11 * ch + 4, "← cola inferior", PINK, 11, 600))
    x2 = 420
    body.append(label(x2, 26, "Máximo pobre (poor high)", GOLD, 13, 700))
    body.append(label(x2, 42, "Techo plano de 3+ bloques: sin rechazo", MUTED, 11, 400))
    body.append(hline(x2 - 8, x2 + 5 * cw + 8, top - 2, GOLD, 2.2))
    body += profile_cells(poor, x2, top, cw, ch, n)
    body.append(label(x2 + 10 * cw + 12, top + 10, "← tope «romo»", GOLD, 11, 600))
    body.append(label(x2 + 10 * cw + 12, top + 26, "suele volver a buscarse", MUTED, 11, 400))
    return svg(760, top + 12 * ch + 16, body)


# ---------------------------------------------------------------- 6. volume profile
def svg_volume():
    body = [label(24, 26, "PERFIL DE VOLUMEN · NODOS ALTOS Y BAJOS", MUTED, 11.5, 600)]
    top, bot = 44, 284
    nb = 48
    bh = (bot - top) / nb

    def g(x, m, s, a):
        return a * math.exp(-((x - m) ** 2) / (2 * s * s))
    vols = []
    for i in range(nb):
        x = i / (nb - 1)
        vols.append(g(x, 0.22, 0.07, 1.0) + g(x, 0.72, 0.08, 0.8) + 0.03)
    vmax = max(vols)
    base, wmax = 400, 190
    for i, v in enumerate(vols):
        w = v / vmax * wmax
        y = top + i * bh
        col = GOLD if v > 0.55 * vmax else ("#3A3A42" if v > 0.15 * vmax else "#5B8DEF")
        body.append(f'<rect x="{base}" y="{y:.1f}" width="{w:.1f}" height="{bh - 1:.1f}" fill="{col}" fill-opacity=".9"/>')
    hvn1 = top + 0.22 * (nb - 1) * bh + bh / 2
    hvn2 = top + 0.72 * (nb - 1) * bh + bh / 2
    lvn = top + 0.47 * (nb - 1) * bh + bh / 2
    # precio a la izquierda: rango abajo, cruce rápido del LVN, rango arriba
    pts = [(30, hvn2 + 10), (70, hvn2 - 8), (110, hvn2 + 12), (150, hvn2 - 14), (190, hvn2 + 6), (225, hvn2 - 10),
           (250, lvn + 30), (268, lvn - 30), (290, hvn1 + 12), (320, hvn1 - 10), (350, hvn1 + 8), (380, hvn1 - 6)]
    body.append('<polyline points="' + " ".join(f"{x:.0f},{y:.0f}" for x, y in pts) + f'" fill="none" stroke="{WHITE}" stroke-width="2.4" stroke-linejoin="round"/>')
    lx = base + wmax + 18
    for y, color in [(hvn1, GOLD), (lvn, "#5B8DEF"), (hvn2, GOLD)]:
        body.append(hline(24, lx - 6, y, color, 1, "3 4"))
    body.append(label(lx, hvn1 - 2, "HVN", GOLD, 13, 700))
    body.append(label(lx, hvn1 + 13, "mucho volumen", MUTED, 11, 400))
    body.append(label(lx, lvn - 2, "LVN", "#5B8DEF", 13, 700))
    body.append(label(lx, lvn + 13, "casi sin volumen", MUTED, 11, 400))
    body.append(label(lx, hvn2 - 2, "HVN", GOLD, 13, 700))
    body.append(label(lx, hvn2 + 13, "mucho volumen", MUTED, 11, 400))
    body.append(label(150, lvn - 8, "el precio cruzó rápido", MUTED, 11, 400, "middle"))
    body.append(label(24, bot + 24, "Precio en el tiempo →", MUTED, 11, 400))
    body.append(label(base, bot + 24, "Volumen en cada precio →", MUTED, 11, 400))
    return svg(760, bot + 36, body)


# ---------------------------------------------------------------- 7. entorno: secuencia de perfiles
def day_profile(x0, r_top, r_bot, peak_w, color, top, ch, cw=5, flat=False, tail_top=0):
    """Perfil diario compacto entre las filas r_top y r_bot (incluidas)."""
    out = []
    mid = (r_top + r_bot) / 2
    half = max((r_bot - r_top) / 2, 1)
    for r in range(r_top, r_bot + 1):
        if flat:
            w = peak_w
        else:
            w = max(1, round(peak_w * math.exp(-((r - mid) / half) ** 2 * 2.2)))
        if r < r_top + tail_top:
            w = 1
        out.append(f'<rect x="{x0}" y="{top + r * ch:.1f}" width="{w * cw}" height="{ch - 1}" fill="{color}" fill-opacity=".9"/>')
    return out


def svg_environment():
    body = [label(24, 26, "LA SECUENCIA TÍPICA: BALANCE → DESEQUILIBRIO → BALANCE", MUTED, 11.5, 600)]
    top, ch = 44, 5
    grey = "#6B6B74"
    days = [
        # (fila arriba, fila abajo, ancho máx, color, plano, cola arriba)
        (36, 52, 10, grey, False, 0), (35, 51, 10, grey, False, 0), (36, 52, 10, grey, False, 0),
        (18, 38, 2, RED, True, 0),           # día de tendencia alcista
        (14, 26, 10, GOLD, False, 0), (13, 25, 10, GOLD, False, 0),   # valor se aprieta
        (2, 16, 2, GREEN, True, 0),          # markup
        (0, 11, 9, GOLD, False, 3),          # intenta balance, cola arriba → rechazo
        (8, 30, 2, RED, True, 0), (26, 44, 2, RED, True, 0),   # vuelta abajo
        (35, 51, 10, grey, False, 0),        # valor previo
    ]
    step = 64
    for k, (a, b, w, col, flat, tail) in enumerate(days):
        body += day_profile(40 + k * step, a, b, w, col, top, ch, flat=flat, tail_top=tail)
    # banda del valor previo
    body.append(f'<rect x="28" y="{top + 35 * ch - 3}" width="720" height="{17 * ch + 6}" rx="6" fill="{MUTED}" fill-opacity=".06" stroke="{MUTED}" stroke-opacity=".4" stroke-dasharray="4 4"/>')
    ly = top + 54 * ch + 16
    notes = [
        (40, "Balance", grey), (40 + 3 * step, "Tendencia", RED), (40 + 4 * step, "Valor se aprieta", GOLD),
        (40 + 6 * step, "Markup", GREEN), (40 + 7 * step, "Rechazo", GOLD), (40 + 8 * step, "Tendencia", RED),
        (40 + 10 * step, "Valor previo", grey),
    ]
    for x, t, c in notes:
        body.append(label(x, ly, t, c, 11, 600))
    body.append(label(40 + 7 * step + 50, top + 6, "← cola", PINK, 10.5, 600))
    return svg(760, ly + 14, body)


def main():
    tpl = (HERE / "guia.template.html").read_text()
    anatomy, _ = svg_anatomy()
    parts = {
        "SVG_BUILD": svg_build(),
        "SVG_ANATOMY": anatomy,
        "SVG_IB": svg_ib(),
        "SVG_SINGLES": svg_singles(),
        "SVG_TAILS": svg_tails(),
        "SVG_VOLUME": svg_volume(),
        "SVG_ENV": svg_environment(),
    }
    for k, v in parts.items():
        tpl = tpl.replace("{{" + k + "}}", v)
    assert "{{SVG_" not in tpl
    (HERE / "guia.html").write_text(tpl)


if __name__ == "__main__":
    main()
