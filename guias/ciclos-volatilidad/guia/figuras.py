"""Imágenes de la guía paso a paso de ciclos_volatilidad.pine.

Recrean lo que dibuja el indicador con datos reales de BTC 4h (Bitstamp) y las mismas
reglas (no son capturas de TradingView). Uso: python -I figuras.py <dir_backtest> <dir_salida>
"""
import csv
import datetime as dt
import math
import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.dates as mdates  # noqa: E402
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
from matplotlib.patches import FancyBboxPatch, Rectangle  # noqa: E402

BT, OUT = Path(sys.argv[1]), Path(sys.argv[2])
OUT.mkdir(parents=True, exist_ok=True)
sys.path.insert(0, str(BT))
from engine import run_engine  # noqa: E402
from vol import ema, features, hurst_rs  # noqa: E402
from walk import load  # noqa: E402

# Colores: los mismos que usa el indicador en TradingView.
PURPLE, BLUE, GREEN, RED, ORANGE, GRAY = "#9C6ADE", "#2E86C1", "#26A69A", "#EF5350", "#FFA726", "#808080"
INK, MUTED, GRID, BG = "#1F2328", "#6E7781", "#E6E9ED", "#FFFFFF"
C_UP, C_DN = "#C3C9D1", "#6E7781"  # velas neutras para que resalten las marcas del indicador
H4 = 4 * 3600

plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 11.5, "axes.edgecolor": GRID, "axes.labelcolor": MUTED,
                     "xtick.color": MUTED, "ytick.color": MUTED, "axes.spines.top": False, "axes.spines.right": False,
                     "figure.facecolor": BG, "axes.facecolor": BG, "savefig.facecolor": BG})

d = load(BT / "datos" / "btc_4h.csv")
o, h, l, c, v, T = d["o"], d["h"], d["l"], d["c"], d["v"], d["t"]
N = len(c)
f = features(o, h, l, c, v, hurst_len=10 ** 9)
vol, atr14, cycv = f["vol"], f["atr"], f["cyc"]
e100, e200 = ema(c, 100), f["ema200"]
mom = f["ema_ok"].astype(int) + f["atr_ok"].astype(int) + f["volu_ok"].astype(int)


def ts(s):
    return int(dt.datetime.strptime(s, "%Y-%m-%d %H:%M").replace(tzinfo=dt.UTC).timestamp())


def idx(s):
    return int(np.searchsorted(T, ts(s)))


def tdate(i):
    return dt.datetime.fromtimestamp(int(T[0] + i * H4) if i >= N else int(T[i]), dt.UTC)


def fmt_d(i, hour=True):
    return tdate(i).strftime("%d/%m/%y %H:%M" if hour else "%d/%m/%Y")


def es(x, nd=0, sign=False):
    """Número con formato español (coma decimal, espacio de miles, signo menos tipográfico)."""
    s = f"{abs(x):,.{nd}f}".replace(",", " ").replace(".", ",")
    return ("−" if x < 0 else "+" if sign else "") + s


def pn(x, nd=2):
    """Como str.tostring(x, "#.##") de Pine: punto decimal, sin ceros finales ni separador de miles."""
    s = f"{x:.{nd}f}"
    return s.rstrip("0").rstrip(".") if "." in s else s


def pR(r):
    return ("+" if r >= 0 else "") + pn(r) + "R"


def pD(bars):
    """fmtDays del Pine (velas de 4h)."""
    dd = bars * 4 / 24
    return pn(dd, 1) + "D" if abs(dd) >= 1 else pn(dd * 24, 1) + "h"


# ─── Máquina de estados de la caja (idéntica a la del Pine) ───────────────────
def boxes_and_signals():
    in_zone, arm = False, None
    zh = zl = np.nan
    zs = -1
    boxes, sigs = [], []
    cur = None
    for i in range(1, N):
        if np.isnan(vol[i]):
            continue
        comp = vol[i] <= 5
        if not in_zone and comp:
            in_zone, zh, zl, zs = True, h[i], l[i], i
            cur = dict(x0=i, x1=i, top=h[i], bot=l[i], state="comp", rel=None, end=None)
            boxes.append(cur)
        elif in_zone:
            zh, zl = max(zh, h[i]), min(zl, l[i])
            cur.update(x1=i, top=zh, bot=zl)
        if in_zone and vol[i] > 20 and not vol[i - 1] > 20:
            in_zone = False
            arm = dict(bar=i, top=zh, bot=zl, box=cur)
            cur.update(state="armed", rel=i)
        if arm is not None:
            bx = arm["box"]
            if not in_zone:
                bx["x1"] = i
            if i - arm["bar"] > 12:
                bx.update(state="expired", end=i)
                arm = None
            elif c[i] > arm["top"]:
                bx.update(state="up", end=i)
                ok = c[i] > e200[i] and mom[i] >= 2 and c[i] - arm["bot"] >= 0.5 * atr14[i]
                sigs.append(dict(bar=i, stop=arm["bot"], ok=ok, box=bx))
                arm = None
            elif c[i] < arm["bot"]:
                bx.update(state="down", end=i)
                arm = None
    return boxes, sigs


BOXES, SIGS = boxes_and_signals()


def trades():
    out, busy = [], -1
    for s in SIGS:
        t = s["bar"]
        if not s["ok"] or t <= busy or t + 1 >= N:
            continue
        entry, stop = o[t + 1], s["stop"]
        risk = entry - stop
        if risk <= 0 or risk / entry > 0.25:
            continue
        j, res, why = t + 1, None, ""
        while j < N:
            if l[j] <= stop:
                res, why = (stop - entry) / risk, "stop"
                break
            if j > t + 1 and c[j] < e100[j]:
                res, why = (c[j] - entry) / risk, "ema"
                break
            if j - (t + 1) >= 180:
                res, why = (c[j] - entry) / risk, "tiempo"
                break
            j += 1
        if res is None:
            break
        res -= 2 * 0.001 * entry / risk
        out.append(dict(sig=t, ent=t + 1, entry=entry, stop=stop, risk=risk, exit=j, R=res, why=why, box=s["box"]))
        busy = j
    return out


TR = trades()


def find_trade(sig_date):
    i = idx(sig_date)
    return next(x for x in TR if x["sig"] == i)


# ─── Utilidades de dibujo ──────────────────────────────────────────────────────
def candles(ax, a, b, x=None):
    xs = np.arange(a, b) if x is None else x
    for k, i in enumerate(range(a, b)):
        xi = xs[k]
        up = c[i] >= o[i]
        col = C_UP if up else C_DN
        ax.vlines(xi, l[i], h[i], color=C_DN, lw=0.7, zorder=2)
        y0, y1 = sorted((o[i], c[i]))
        ax.add_patch(Rectangle((xi - 0.36, y0), 0.72, max(y1 - y0, (h[i] - l[i]) * 0.02), facecolor=col,
                               edgecolor=C_DN, lw=0.5, zorder=3))


def draw_box(ax, bx, upto=None):
    x1 = bx["x1"] if upto is None else min(bx["x1"], upto)
    st = bx["state"]
    if upto is not None and bx["end"] is not None and upto < bx["end"]:
        st = "armed" if bx["rel"] is not None and upto >= bx["rel"] else "comp"
    fc, ec, alpha = {"comp": (PURPLE, PURPLE, 0.16), "armed": (BLUE, BLUE, 0.16), "up": (GREEN, GREEN, 0.16),
                     "down": (RED, RED, 0.12), "expired": (GRAY, GRAY, 0.10)}[st]
    ax.add_patch(Rectangle((bx["x0"] - 0.5, bx["bot"]), x1 - bx["x0"] + 1, bx["top"] - bx["bot"], facecolor=fc,
                           alpha=alpha, edgecolor=ec, lw=1.1, zorder=1))
    ax.add_patch(Rectangle((bx["x0"] - 0.5, bx["bot"]), x1 - bx["x0"] + 1, bx["top"] - bx["bot"], facecolor="none",
                           edgecolor=ec, lw=1.1, alpha=0.8, zorder=1))


def tri(ax, x, y, col=GREEN, s=110):
    ax.scatter([x], [y], marker="^", s=s, color=col, zorder=6, edgecolors="white", linewidths=0.8)


def xmark(ax, x, y):
    ax.scatter([x], [y], marker="x", s=70, color=GRAY, zorder=6, linewidths=2)


def badge(ax, x, y, n, dx=0, dy=0, color=INK):
    """Círculo numerado con línea guía al punto (x, y)."""
    if dx or dy:
        ax.annotate("", xy=(x, y), xytext=(x + dx, y + dy), arrowprops=dict(arrowstyle="-", color=color, lw=0.9), zorder=7)
    ax.text(x + dx, y + dy, str(n), ha="center", va="center", fontsize=10, fontweight="bold", color="white", zorder=8,
            bbox=dict(boxstyle="circle,pad=0.28", facecolor=color, edgecolor="white", lw=1))


def date_axis(ax, a, b, step):
    ticks = list(range(a, b, step))
    ax.set_xticks(ticks)
    ax.set_xticklabels([tdate(i).strftime("%d %b") for i in ticks])
    ax.set_xlim(a - 1, b)


def price_fmt(ax):
    ax.yaxis.set_major_formatter(matplotlib.ticker.FuncFormatter(lambda y, _: es(y)))
    ax.grid(axis="y", color=GRID, lw=0.6)
    ax.yaxis.tick_right()
    ax.spines["left"].set_visible(False)
    ax.spines["right"].set_visible(True)


def save(fig, name):
    fig.savefig(OUT / name, dpi=170, bbox_inches="tight")
    plt.close(fig)
    print("ok", name)


# ─── 1 · Cómo nace una señal (precio + percentil interno) ─────────────────────
def fig_secuencia():
    tr = find_trade("2023-10-16 12:00")
    bx = tr["box"]
    a, b = bx["x0"] - 25, tr["sig"] + 14
    fig, (ax, ax2) = plt.subplots(2, 1, figsize=(10, 6.4), height_ratios=[3, 1.35], sharex=True)
    candles(ax, a, b)
    s, r = tr["sig"], bx["rel"]
    rng = h[a:b].max() - l[a:b].min()
    # La caja es una sola en TradingView y cambia de color; aquí se muestran sus fases una al lado de la otra.
    for x0, x1, col in ((bx["x0"], r, PURPLE), (r, s, BLUE), (s, s + 1, GREEN)):
        ax.add_patch(Rectangle((x0 - 0.5, bx["bot"]), x1 - x0, bx["top"] - bx["bot"], facecolor=col, alpha=0.18,
                               edgecolor=col, lw=1.2, zorder=1))
    tri(ax, s, l[s] - rng * 0.05)
    price_fmt(ax)
    ax.set_ylim(l[a:b].min() - rng * 0.12, h[a:b].max() + rng * 0.08)
    badge(ax, (bx["x0"] + r) / 2, bx["top"], 1, dy=rng * 0.13, color=PURPLE)
    badge(ax, (r + s) / 2, bx["bot"], 2, dy=-rng * 0.1, color=BLUE)
    badge(ax, s, l[s] - rng * 0.05, 3, dx=5, dy=-rng * 0.1, color=GREEN)
    ax.set_title("Cómo nace una señal · BTC 4h, octubre de 2023", loc="left", color=INK, fontsize=12)
    # percentil
    x = np.arange(a, b)
    ax2.plot(x, vol[a:b], color=INK, lw=1.4)
    ax2.axhline(5, color=PURPLE, lw=0.9, ls="--")
    ax2.axhline(20, color=BLUE, lw=0.9, ls="--")
    ax2.text(a, 7, "5 = compresión", color=PURPLE, fontsize=8.5, va="bottom")
    ax2.text(a, 22, "20 = liberación", color=BLUE, fontsize=8.5, va="bottom")
    ax2.fill_between(x, 0, 100, where=vol[a:b] <= 5, color=PURPLE, alpha=0.12, step="mid", lw=0)
    ax2.set_ylim(0, 100)
    ax2.set_ylabel("Percentil del ATR")
    ax2.grid(axis="y", color=GRID, lw=0.6)
    ax2.scatter([r], [vol[r]], s=36, color=BLUE, zorder=5)
    ax2.text(a, 96, "cálculo interno (no se dibuja en el gráfico)", color=MUTED, fontsize=9, va="top")
    date_axis(ax2, a, b, 12)
    fig.tight_layout()
    save(fig, "f1_secuencia.png")


# ─── 2 · Una operación completa ───────────────────────────────────────────────
def fig_operacion(sig_date, name, title, pad_after=18):
    tr = find_trade(sig_date)
    bx = tr["box"]
    a, b = bx["x0"] - 12, min(N, tr["exit"] + pad_after)
    fig, ax = plt.subplots(figsize=(10, 5.3))
    candles(ax, a, b)
    draw_box(ax, bx)
    s, e, x = tr["sig"], tr["ent"], tr["exit"]
    rng = h[a:b].max() - l[a:b].min()
    tri(ax, s, l[s] - rng * 0.025)
    xs = np.arange(e, x + 1)
    ax.plot(xs, np.full(len(xs), tr["stop"]), color=RED, lw=1.4, zorder=4)
    ax.plot(xs, e100[e:x + 1], color=GREEN, lw=1.4, zorder=4)
    ax.scatter([e], [tr["entry"]], s=26, color=INK, zorder=6)
    xmark(ax, x, h[x] + rng * 0.03)
    price_fmt(ax)
    ax.set_ylim(l[a:b].min() - rng * 0.08, h[a:b].max() + rng * 0.1)
    date_axis(ax, a, b, max(6, (b - a) // 9))
    ax.set_title(title, loc="left", color=INK, fontsize=12)
    why = {"stop": "tocó el stop", "ema": "cerró bajo la EMA100", "tiempo": "llegó a 180 velas"}[tr["why"]]
    ax.text(x, h[x] + rng * 0.075, f"{es(tr['R'], 1, sign=True)}R · {why}", ha="right" if x > (a + b) / 2 else "left", color=INK,
            fontsize=9.5, fontweight="bold", bbox=dict(boxstyle="round,pad=0.25", facecolor="white", edgecolor="none", alpha=0.9))
    fig.tight_layout()
    return fig, ax, tr, rng


def fig_ganadora():
    fig, ax, tr, rng = fig_operacion("2023-10-16 12:00", "f2", "Una operación completa · BTC 4h, octubre–noviembre de 2023")
    bx, s, e, x = tr["box"], tr["sig"], tr["ent"], tr["exit"]
    badge(ax, (bx["x0"] + bx["x1"]) / 2, bx["top"], 1, dy=rng * 0.13, color=GREEN)
    badge(ax, s, l[s] - rng * 0.025, 2, dx=5, dy=-rng * 0.1, color=GREEN)
    badge(ax, e + 22, tr["stop"], 3, dy=-rng * 0.06, color=RED)
    k = e + (x - e) // 2
    badge(ax, k, e100[k], 4, dy=-rng * 0.09, color=GREEN)
    badge(ax, x, h[x] + rng * 0.03, 5, dx=4, dy=-rng * 0.09, color=GRAY)
    save(fig, "f2_operacion.png")
    return tr


def fig_perdedora():
    fig, ax, tr, rng = fig_operacion("2024-09-13 20:00", "f3", "Cuando sale mal · BTC 4h, septiembre de 2024", pad_after=24)
    save(fig, "f3_perdida.png")
    return tr


# ─── 3 · Estados de la caja (esquema) ─────────────────────────────────────────
def fig_estados():
    rs = np.random.default_rng(4)
    fig, axs = plt.subplots(1, 5, figsize=(10, 3.1))
    specs = [("comp", "1 · Compresión", "la volatilidad está\nen mínimos"),
             ("armed", "2 · Liberación", "esperar un cierre sobre\nla caja (≤ 12 velas)"),
             ("up", "3 · Ruptura al alza", "si pasan los filtros:\n▲ señal larga"),
             ("down", "4 · Ruptura a la baja", "sin operación"),
             ("expired", "5 · Caducó", "no rompió en 12 velas:\nsin operación")]
    for ax, (st, t1, t2) in zip(axs, specs):
        n0, nb = 14, 10
        p = [100.0]
        for k in range(n0 + nb):
            p.append(p[-1] + rs.normal(0, 0.35))
        p = np.array(p)
        if st == "up":
            p[n0 + 3:] = p[n0 + 3:] + np.linspace(1.5, 6, len(p) - n0 - 3)
        if st == "down":
            p[n0 + 3:] = p[n0 + 3:] - np.linspace(1.5, 6, len(p) - n0 - 3)
        if st in ("armed", "expired"):
            lo_, hi_ = p[2:n0].min() + 0.4, p[2:n0].max() - 0.4
            p[n0:] = np.clip(p[n0:], lo_, hi_)
        if st == "comp":
            p = p[:n0 + 1]
        for k in range(1, len(p)):
            y0, y1 = sorted((p[k - 1], p[k]))
            ax.vlines(k, y0 - 0.25, y1 + 0.25, color=C_DN, lw=0.6)
            ax.add_patch(Rectangle((k - 0.35, y0), 0.7, max(y1 - y0, 0.05), facecolor=C_UP if p[k] >= p[k - 1] else C_DN,
                                   edgecolor=C_DN, lw=0.4))
        top, bot = p[2:n0].max() + 0.25, p[2:n0].min() - 0.25
        col = {"comp": PURPLE, "armed": BLUE, "up": GREEN, "down": RED, "expired": GRAY}[st]
        x1 = n0 + 0.5 if st == "comp" else n0 + 6
        ax.add_patch(Rectangle((1.5, bot), x1 - 1.5, top - bot, facecolor=col, alpha=0.16, edgecolor=col, lw=1.2))
        if st == "up":
            ax.scatter([n0 + 3], [p[n0 + 3] - 1.3], marker="^", s=80, color=GREEN, edgecolors="white", zorder=5)
        ax.set_xlim(0, n0 + nb + 2)
        ax.set_ylim(p.min() - 2, p.max() + 2)
        ax.axis("off")
        ax.set_title(t1, color=col if st != "expired" else MUTED, fontsize=11.5, fontweight="bold", loc="left")
        ax.text(0.5, -0.04, t2, transform=ax.transAxes, ha="center", va="top", color=INK, fontsize=10.5)
    fig.tight_layout()
    save(fig, "f4_estados_caja.png")


# ─── 4 · Panel (valores reales en un momento dado) ───────────────────────────
def autocorr_period(hh):
    n = len(hh)
    m = hh.mean()
    best, bR, passed, prev = None, -2.0, False, 1.0
    for P in range(8, n // 2 + 1):
        a, b = hh[P:] - m, hh[:n - P] - m
        den = math.sqrt((a * a).sum() * (b * b).sum())
        r = (a * b).sum() / den if den > 0 else 0.0
        if not passed and r > prev:
            passed = True
        if passed and r > bR:
            bR, best = r, P
        prev = r
    if best is None or bR <= 0.2:
        return None
    L = min(n, 2 * best)
    w = 2 * math.pi / best
    j = np.arange(L)
    X = np.c_[np.sin(w * j), np.cos(w * j), np.ones(L)]
    ca, cb, _ = np.linalg.lstsq(X, hh[n - L:], rcond=None)[0]
    k = np.arange(1, best + 1)
    y = ca * np.sin(w * (L - 1 + k)) + cb * np.cos(w * (L - 1 + k))
    return best, bR, int(k[np.argmax(y)]), int(k[np.argmin(y)]), best >= n // 2


def lvl_name(i):
    return "Madre" if i == 0 else f"N{i}"


def cycle_info(t):
    lo = max(0, t - 4999)
    S = run_engine(h[lo:t + 1], l[lo:t + 1])
    if not S.ok:
        return None
    n = t - lo + 1
    rows = []
    for i, L in enumerate(S.levels):
        if L.on and L.len > 0:
            nx_g = L.next_px + lo
            rows.append(dict(i=i, len=L.len, valid=L.valid, tested=L.tested, nx=nx_g, active=L.active, dom=i == S.dom))
    D = S.levels[S.dom]
    nx = D.next_px + lo
    wX = 0.10 * D.len
    ideal = nx - wX * 0.5 <= t <= nx + wX * 0.5
    state = 3 if ideal else 2 if D.active else 1
    return dict(len=D.len, valid=D.valid, tested=D.tested, nx=nx, wX=wX, state=state, rows=rows, n=n)


def panel_rows(t):
    """Textos y colores de las 8 filas del panel en la vela t (mismas fórmulas que el Pine)."""
    tr = next((x for x in TR if x["ent"] <= t <= x["exit"]), None)
    if tr is not None and t < tr["exit"]:
        cur = (c[t] - tr["entry"]) / tr["risk"]
        r2 = (f"EN OPERACIÓN desde {fmt_d(tr['ent'])} · entrada {tr['entry']:.0f} · stop {tr['stop']:.0f} · "
              f"sale si cierra < EMA100 ({e100[t]:.0f}) · ahora {pR(cur)}", GREEN)
    else:
        r2 = ("ESPERAR: sin compresión de volatilidad", INK)
    ok = c[t] > e200[t] and mom[t] >= 2
    ck = lambda b: "✓" if b else "✗"
    r3 = (f"Filtros: tendencia (EMA200) {ck(c[t] > e200[t])} · momentum {mom[t]}/3 (EMA {ck(f['ema_ok'][t])} "
          f"ATR {ck(f['atr_ok'][t])} Vol {ck(f['volu_ok'][t])})", GREEN if ok else INK)
    ci = cycle_info(t)
    if ci:
        hr = ci["valid"] * 100 / ci["tested"] if ci["tested"] else 0
        st = "ZONA IDEAL" if ci["state"] == 3 else "EN VENTANA" if ci["state"] == 2 else "faltan " + pD(max(ci["nx"] - ci["wX"] - t, 0))
        r4 = (f"Ciclo (contexto): {pD(ci['len'])} · aciertos {ci['valid']}/{ci['tested']} ({hr:.0f}%) · próx. pivote "
              f"{fmt_d(int(round(ci['nx'])))} ±{pD(ci['wX'])} · {st}", GREEN if ci["state"] == 3 else ORANGE if ci["state"] == 2 else INK)
    else:
        r4 = ("Ciclo (contexto): sin ciclo válido", INK)
    vp = vol[t]
    ph = "AGOTAMIENTO" if vp >= 90 else "expansión" if vp >= 70 else "compresión" if vp <= 5 else "normal"
    vc = cycv[t]
    arrow = "↑" if vc > cycv[t - 1] else "↓"
    hh = cycv[max(0, t - 399):t + 1]
    hh = hh[~np.isnan(hh)]
    ap = autocorr_period(hh) if len(hh) >= 80 else None
    rt = ""
    if ap:
        P, rr, pk, trg, edge = ap
        rt = f" · ritmo {'≥' if edge else '≈'} {P} velas · pico ~{fmt_d(t + pk)} · valle ~{fmt_d(t + trg)}"
    r5 = (f"Volatilidad: percentil {vp:.0f} ({ph}) · ciclo {vc:.0f} {arrow}{rt}", PURPLE if vp >= 90 else INK)
    lr = np.r_[0.0, np.diff(np.log(c))]
    hv = np.mean([hurst_rs(lr[i - 99:i + 1]) for i in range(t - 9, t + 1)])
    reg = "persistente (tendencia)" if hv > 0.55 else "reversión a la media (rango)" if hv < 0.45 else "aleatorio"
    r6 = (f"Hurst {pn(hv)} → {reg}", INK)
    done = [x["R"] for x in TR if x["exit"] < t]
    R = np.array(done)
    cum = np.cumsum(R)
    dd = float((np.maximum.accumulate(np.r_[0, cum]) - np.r_[0, cum]).max())
    pf = R[R > 0].sum() / -R[R < 0].sum()
    r7 = (f"Backtest de este gráfico (desde {fmt_d(TR[0]['ent'])}): {len(R)} ops · acierto {(R > 0).mean() * 100:.0f}% · "
          f"{pR(R.mean())}/op · PF {pn(pf)} · total {pR(R.sum())} · DD {pn(dd, 1)}R", GREEN if R.sum() > 0 else RED)
    r8 = ("Referencia BTC 4h 2017–2026 (walk-forward): 52 ops · +2,0R/op · PF 7,7 · DD 3,8R. No es garantía de resultados futuros.", "#8A9099")
    r1 = ("CICLOS + VOLATILIDAD · BTCUSD", INK)
    return [r1, r2, r3, r4, r5, r6, r7, r8], ci


def fig_panel(t_str, name):
    t = idx(t_str)
    rows, ci = panel_rows(t)
    fig = plt.figure(figsize=(8.4, 3.2))
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    x0, x1, top, rh = 0.055, 0.985, 0.93, 0.105
    ax.add_patch(FancyBboxPatch((x0, top - rh * 8), x1 - x0, rh * 8, boxstyle="round,pad=0,rounding_size=0.01",
                                facecolor="#FAFBFC", edgecolor="#C9CED6", lw=1))
    for k, (txt, col) in enumerate(rows):
        y = top - rh * (k + 0.5)
        if k == 0:
            ax.add_patch(Rectangle((x0, top - rh), x1 - x0, rh, facecolor="#EEF0F3", edgecolor="none"))
        if k > 0:
            ax.plot([x0, x1], [top - rh * k] * 2, color="#E3E6EA", lw=0.8)
        ax.text(x0 + 0.008, y, txt, va="center", ha="left", fontsize=8.4, color=col,
                fontweight="bold" if k in (0, 1) else "normal")
        ax.text(0.027, y, str(k + 1), ha="center", va="center", fontsize=9, fontweight="bold", color="white",
                bbox=dict(boxstyle="circle,pad=0.25", facecolor=INK, edgecolor="white"))
    save(fig, name)
    return rows, ci


# ─── 5 · Situación al final de los datos con la banda del ciclo ───────────────
def fig_hoy():
    t = N - 1
    ci = cycle_info(t)
    a = t - 150
    fut = int(max(ci["nx"] + ci["wX"] + 45, t + 40)) if ci else t + 40
    fig, ax = plt.subplots(figsize=(10, 5.2))
    candles(ax, a, t + 1)
    for bx in BOXES:
        if bx["x0"] >= a and bx["x0"] <= t:
            draw_box(ax, bx)
    for s in SIGS:
        if a <= s["bar"] <= t and s["ok"]:
            tri(ax, s["bar"], l[s["bar"]] * 0.985)
    hi, lo = h[t - 199:t + 1].max(), l[t - 199:t + 1].min()
    rng = h[a:t + 1].max() - l[a:t + 1].min()
    if ci:
        col = GREEN if ci["state"] == 3 else ORANGE if ci["state"] == 2 else GRAY
        ax.add_patch(Rectangle((ci["nx"] - ci["wX"], lo * 0.99), 2 * ci["wX"], hi * 1.01 - lo * 0.99, facecolor=col,
                               alpha=0.2 if ci["state"] >= 2 else 0.12, edgecolor="none", zorder=0))
        st = "ZONA IDEAL" if ci["state"] == 3 else "EN VENTANA" if ci["state"] == 2 else "faltan " + pD(max(ci["nx"] - ci["wX"] - t, 0))
        ax.text(ci["nx"], lo * 0.99, f"Ciclo {pD(ci['len'])} · {fmt_d(int(round(ci['nx'])))} · {st}", ha="center", va="top",
                color="white", fontsize=9.5, bbox=dict(boxstyle="round,pad=0.35", facecolor=col, edgecolor="none"))
    ax.axvline(t + 0.5, color=MUTED, lw=0.8, ls=":")
    ax.text(t + 1.5, hi * 1.012, "última vela →\nfuturo", color=MUTED, fontsize=8.5, va="top")
    price_fmt(ax)
    ax.set_ylim(lo * 0.965, max(h[a:t + 1].max(), hi * 1.01) + rng * 0.12)
    ticks = list(range(a, fut, 42))
    ax.set_xticks(ticks)
    ax.set_xticklabels([tdate(i).strftime("%d %b") for i in ticks])
    ax.set_xlim(a - 1, fut)
    ax.set_title(f"La banda del ciclo dominante · BTC 4h, datos hasta el {fmt_d(t, False)}", loc="left", color=INK, fontsize=12)
    fig.tight_layout()
    save(fig, "f6_banda_ciclo.png")
    return ci


# ─── 6 · Esquemas: instalación y flujo de decisión ───────────────────────────
def card(ax, x, y, w, hgt, title, body, col, num=None):
    ax.add_patch(FancyBboxPatch((x, y), w, hgt, boxstyle="round,pad=0.01,rounding_size=0.02", facecolor="white",
                                edgecolor=col, lw=1.6))
    ax.text(x + 0.018, y + hgt - 0.06, title, fontsize=10.5, fontweight="bold", color=col, va="top")
    ax.text(x + 0.018, y + hgt - 0.16, body, fontsize=9, color=INK, va="top", linespacing=1.45)
    if num is not None:
        ax.text(x, y + hgt, str(num), ha="center", va="center", fontsize=10, fontweight="bold", color="white",
                bbox=dict(boxstyle="circle,pad=0.3", facecolor=col, edgecolor="white", lw=1.2))


def arrow(ax, x0, y0, x1, y1, col=MUTED):
    ax.annotate("", xy=(x1, y1), xytext=(x0, y0), arrowprops=dict(arrowstyle="-|>", color=col, lw=1.4, mutation_scale=14))


def fig_instalacion():
    fig = plt.figure(figsize=(7.4, 5.2))
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(0, 0.62)
    ax.set_ylim(0, 1)
    ax.axis("off")
    # ventana esquemática
    ax.add_patch(FancyBboxPatch((0.03, 0.06), 0.56, 0.88, boxstyle="round,pad=0,rounding_size=0.015", facecolor="#F6F7F9",
                                edgecolor="#C9CED6", lw=1.2))
    ax.add_patch(Rectangle((0.03, 0.87), 0.56, 0.07, facecolor="#EEF0F3", edgecolor="none"))
    ax.text(0.045, 0.905, "BTCUSD · 4h", fontsize=9.5, color=INK, va="center", fontweight="bold")
    ax.text(0.2, 0.905, "Indicadores", fontsize=9, color=MUTED, va="center")
    # mini gráfico
    rs = np.random.default_rng(2)
    p = 50 + np.cumsum(rs.normal(0.05, 0.9, 70))
    xs = np.linspace(0.06, 0.56, 70)
    ys = 0.62 + (p - p.min()) / (p.max() - p.min()) * 0.2
    ax.plot(xs, ys, color=C_DN, lw=1.2)
    # editor
    ax.add_patch(Rectangle((0.03, 0.06), 0.56, 0.47, facecolor="white", edgecolor="#C9CED6", lw=1))
    ax.add_patch(Rectangle((0.03, 0.47), 0.56, 0.06, facecolor="#EEF0F3", edgecolor="none"))
    ax.text(0.045, 0.5, "Pine Editor", fontsize=9.5, color=INK, va="center", fontweight="bold")
    ax.add_patch(FancyBboxPatch((0.43, 0.483), 0.145, 0.034, boxstyle="round,pad=0,rounding_size=0.008", facecolor=BLUE,
                                edgecolor="none"))
    ax.text(0.5025, 0.5, "Añadir al gráfico", fontsize=8.5, color="white", va="center", ha="center", fontweight="bold")
    code = ["//@version=6", 'indicator("Ciclos + Volatilidad · Cycles + Volatility", ...)', "", "// ... unas 1 080 líneas ...",
            "", 'alertcondition(evPeak, "Agotamiento / Exhaustion", ...)']
    for k, line in enumerate(code):
        ax.text(0.064, 0.42 - k * 0.055, line, fontsize=8.5, color=INK if line.startswith("//@") else MUTED, family="DejaVu Sans Mono")
        ax.text(0.054, 0.42 - k * 0.055, str(k + 1 if k < 3 else 1078 + k - 3), fontsize=7, color="#A0A6AE", ha="right",
                family="DejaVu Sans Mono")
    badge(ax, 0.175, 0.5, 2, color=BLUE)
    badge(ax, 0.30, 0.31, 3, color=BLUE)
    badge(ax, 0.59, 0.5, 4, color=BLUE)
    ax.text(0.03, 0.015, "Esquema simplificado: los botones pueden cambiar de sitio según la versión de TradingView.",
            fontsize=8, color=MUTED)
    save(fig, "f7_instalacion.png")


def fig_flujo():
    fig = plt.figure(figsize=(12, 3.9))
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    W, Hh, y = 0.168, 0.5, 0.27
    xs = [0.014 + k * (W + 0.0315) for k in range(5)]
    cards = [("ESPERAR", "No hay compresión.\n\nNo hagas nada.\nEs el estado más\nfrecuente.", GRAY),
             ("COMPRESIÓN", "Caja morada.\n\nPrepárate: marca\nel máximo y el\nmínimo de la caja.", PURPLE),
             ("LIBERACIÓN", "Caja azul.\n\nEspera un cierre de\nvela sobre la caja en\n≤ 12 velas.", BLUE),
             ("SEÑAL LARGA", "▲ verde.\n\nCompra en la apertura\nde la vela siguiente.\nStop: mínimo de la caja.", GREEN),
             ("EN OPERACIÓN", "Línea roja = stop.\nLínea verde = EMA100.\n\nSal al cerrar bajo la\nEMA100 (o 180 velas).", GREEN)]
    for k, (t1, t2, col) in enumerate(cards):
        card(ax, xs[k], y, W, Hh, t1, t2, col, num=k + 1)
        if k < 4:
            arrow(ax, xs[k] + W + 0.004, y + Hh / 2, xs[k + 1] - 0.004, y + Hh / 2)
    ax.text(0.5, 0.11, "Si la caja rompe a la baja o caduca (12 velas sin romper) → vuelve a ESPERAR.  "
            "Si la ruptura no pasa los filtros (EMA200 y momentum ≥ 2/3) → no hay señal.",
            ha="center", fontsize=9, color=MUTED)
    ax.text(0.5, 0.95, "La fila 2 del panel te dice en cuál de estos cinco estados estás", ha="center", fontsize=11.5,
            fontweight="bold", color=INK)
    save(fig, "f8_flujo.png")


if __name__ == "__main__":
    fig_secuencia()
    tw = fig_ganadora()
    tl = fig_perdedora()
    fig_estados()
    rows, ci = fig_panel("2023-10-25 12:00", "f5_panel.png")
    for r in rows:
        print("  ", r[0])
    ci_now = fig_hoy()
    fig_instalacion()
    fig_flujo()
    print("ganadora", es(tw["R"], 2), tw["why"], "perdedora", es(tl["R"], 2), tl["why"])
