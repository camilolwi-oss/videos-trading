"""Walk-forward del motor de ciclos + señales de los dos indicadores + simulador.

Regla de oro: en la barra t solo se usa información hasta t.
- El motor de ciclos se recalcula cada `recompute` barras con los datos hasta ese
  momento (ventana máx. 5000 barras, como en Pine) y su rejilla de pivotes se usa
  hasta el siguiente recálculo.
- La volatilidad se calcula barra a barra.
- Entrada a la apertura de la barra siguiente a la señal; stop y objetivo con
  máximos/mínimos (si ambos caen en la misma vela se cuenta el stop).
"""
import csv
import math
from dataclasses import dataclass

import numpy as np

from engine import run_engine, pivot_stats
from vol import features


def load(path):
    rows = list(csv.reader(open(path)))[1:]
    a = np.array(rows, dtype=float)
    return dict(t=a[:, 0].astype(np.int64), o=a[:, 1], h=a[:, 2], l=a[:, 3], c=a[:, 4], v=a[:, 5])


def snapshots(d, recompute, start, max_bars=5000):
    """Lista ordenada de (t0, offset, Snapshot, stats) calculada solo con datos ≤ t0."""
    h, l = d["h"], d["l"]
    out = []
    for t0 in range(start, len(h), recompute):
        lo = max(0, t0 - max_bars + 1)
        S = run_engine(h[lo:t0 + 1], l[lo:t0 + 1])
        st = pivot_stats(h[lo:t0 + 1], l[lo:t0 + 1], S.levels[S.dom]) if S.ok else None
        out.append((t0, lo, S, st))
    return out


@dataclass
class CycState:
    ok: bool
    len: float = 0.0
    dist: float = 0.0        # barras desde el pivote más cercano (negativo = antes)
    phase: float = 0.0       # 0 = pivote (mínimo), 0.5 = mitad del ciclo
    in_win: bool = False
    hit: float = 0.0
    tested: int = 0
    pk: float = 0.0          # pivote más cercano (índice global)
    vtl: tuple = None        # (i1, i2) mínimos válidos consecutivos (índices globales)
    stats: dict = None
    redraw: bool = False
    lv_phase: tuple = ()     # fase de cada nivel (Madre, N1, N2, N3)
    lv_inwin: tuple = ()     # ¿barra dentro de la ventana ±10 % de cada nivel?
    dom: int = -1


def cyc_state(snap, t, wf=0.10):
    t0, lo, S, st = snap
    if not S.ok:
        return CycState(False)
    T = S.levels[S.dom]
    x0 = S.x0 + lo
    k = round((t - x0) / T.len)
    pk = x0 + k * T.len
    dist = t - pk
    phase = ((t - x0) / T.len) % 1.0
    vtl = None
    for q in range(len(T.px) - 1, 0, -1):
        if T.st[q] in (1, 2) and T.st[q - 1] in (1, 2) and T.tro[q] > T.tro[q - 1] >= 0:
            vtl = (T.tro[q - 1] + lo, T.tro[q] + lo)
            break
    ph, iw = [], []
    for Lv in S.levels:
        if Lv.on and Lv.len > 0:
            r = (t - x0) / Lv.len
            ph.append(r % 1.0)
            iw.append(abs(r - round(r)) * Lv.len <= wf * Lv.len)
        else:
            ph.append(float("nan"))
            iw.append(False)
    return CycState(True, T.len, dist, phase, abs(dist) <= wf * T.len, T.hit, T.tested, pk, vtl, st,
                    T.st1 == 0 and T.st2 == 0, tuple(ph), tuple(iw), S.dom)


def snap_index(snaps):
    """Para cada barra t devuelve la instantánea vigente (t0 ≤ t más reciente)."""
    t0s = [s[0] for s in snaps]
    return t0s


def ln(x):
    return math.log(x)


def downtrend_long(d, cs: CycState, t, wf=0.10):
    """Señal larga de time_cycles: ruptura de la línea bajista del ciclo dentro de la ventana."""
    if not cs.ok:
        return None
    L = cs.len
    w = wf * L
    pk = cs.pk
    ws = math.ceil(pk - w)
    if not (ws <= t <= pk + 0.25 * L) or ws < 3:
        return None
    h, l, c = d["h"], d["l"], d["c"]
    a = max(0, math.ceil(pk - L + w))
    if a >= ws - 1:
        return None
    top = a + int(np.argmax(h[a:ws]))
    qb = max(2, round(L / 10))
    if top + qb > ws - 1:
        return None
    sec = top + qb + int(np.argmax(h[top + qb:ws]))
    if not (h[sec] < h[top]):
        return None
    y1, y2 = ln(h[top]), ln(h[sec])
    line = lambda j: y1 + (y2 - y1) * (j - top) / (sec - top)
    if ln(c[t]) > line(t) and ln(c[t - 1]) <= line(t - 1):
        stop = l[max(0, math.ceil(pk - 1.5 * w)):t + 1].min()
        return stop
    return None


def vtl_short(d, cs: CycState, t):
    """Señal corta de time_cycles: cruce bajo la VTL de dos mínimos válidos consecutivos."""
    if not cs.ok or cs.vtl is None:
        return None
    i1, i2 = cs.vtl
    if t <= i2 + 1 or t > i2 + 1.1 * cs.len:
        return None
    h, l, c = d["h"], d["l"], d["c"]
    y1, y2 = ln(l[i1]), ln(l[i2])
    line = lambda j: y1 + (y2 - y1) * (j - i1) / (i2 - i1)
    if ln(c[t]) < line(t) and ln(c[t - 1]) >= line(t - 1):
        top = i2 + int(np.argmax(h[i2:t + 1]))
        if top > i2 + 1:
            return h[i2:t + 1].max()
    return None


def simulate(d, signals, exit_cfg, fee=0.001, start_bar=0):
    """Una posición a la vez. signals: lista de (t, dir, stop, tag). Devuelve operaciones."""
    o, h, l, c = d["o"], d["h"], d["l"], d["c"]
    ema = exit_cfg.get("ema")
    n = len(c)
    trades = []
    busy_until = -1
    for t, dr, stop, tag in sorted(signals):
        if t < start_bar or t <= busy_until or t + 1 >= n:
            continue
        entry = o[t + 1]
        risk = (entry - stop) * dr
        if risk <= 0 or risk / entry > exit_cfg.get("max_risk", 0.25):
            continue
        tgtR = exit_cfg.get("target_R")
        target = entry + dr * risk * tgtR if tgtR else None
        tmax = exit_cfg.get("time_bars", 30)
        if exit_cfg.get("time_cycle") and tag.get("len"):
            tmax = max(5, int(exit_cfg["time_cycle"] * tag["len"]))
        be_at = exit_cfg.get("breakeven_R")
        cur_stop = stop
        res = None
        j = t + 1
        while j < n:
            hit_stop = l[j] <= cur_stop if dr > 0 else h[j] >= cur_stop
            hit_tgt = target is not None and (h[j] >= target if dr > 0 else l[j] <= target)
            if hit_stop:
                res = (cur_stop - entry) * dr / risk
                break
            if hit_tgt:
                res = tgtR
                break
            if be_at and (h[j] - entry if dr > 0 else entry - l[j]) >= be_at * risk:
                cur_stop = entry if dr > 0 else entry
            ema_j = ema
            if exit_cfg.get("ema_fast") is not None and exit_cfg.get("peak") is not None and exit_cfg["peak"][t + 1:j + 1].any():
                ema_j = exit_cfg["ema_fast"]
            if exit_cfg.get("top_exit") and tag.get("stats") and tag.get("len") and j - t >= tag["stats"]["top_med"] * tag["len"] * exit_cfg["top_exit"]:
                res = (c[j] - entry) * dr / risk
                break
            if ema_j is not None and j > t + 1 and ((c[j] < ema_j[j]) if dr > 0 else (c[j] > ema_j[j])):
                res = (c[j] - entry) * dr / risk
                break
            if j - (t + 1) >= tmax:
                res = (c[j] - entry) * dr / risk
                break
            j += 1
        if res is None:
            res = (c[n - 1] - entry) * dr / risk
            j = n - 1
        cost = 2 * fee * entry / risk
        trades.append(dict(t=t, exit=j, dir=dr, entry=entry, stop=stop, risk_pct=risk / entry * 100,
                           R=res - cost, tag=tag))
        busy_until = j
    return trades


def metrics(trades, d, t_from, t_to, risk_pct=1.0):
    tr = [x for x in trades if t_from <= d["t"][x["t"]] < t_to]
    n = len(tr)
    if n == 0:
        return dict(n=0)
    R = np.array([x["R"] for x in tr])
    wins = R[R > 0].sum()
    losses = -R[R < 0].sum()
    eq = np.cumsum(R)
    dd = float((np.maximum.accumulate(np.r_[0, eq]) - np.r_[0, eq]).max())
    capital = 1.0
    peak = 1.0
    mdd = 0.0
    for r in R:
        capital *= 1 + risk_pct / 100 * r
        peak = max(peak, capital)
        mdd = max(mdd, 1 - capital / peak)
    years = (t_to - t_from) / (365.25 * 86400)
    cagr = capital ** (1 / years) - 1 if years > 0 and capital > 0 else float("nan")
    bars_in = sum(x["exit"] - x["t"] for x in tr)
    return dict(n=n, win=float((R > 0).mean() * 100), avgR=float(R.mean()), pf=float(wins / losses) if losses > 0 else float("inf"),
                totR=float(R.sum()), ddR=dd, cagr=cagr * 100, mdd=mdd * 100, bars=bars_in)
