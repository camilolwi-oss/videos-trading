"""Motor de ciclos de time_cycles.pine portado a Python (modo barras; BTC cotiza 24/7).

Replica: mínimos mayores por prominencia, fusión de mínimos dobles, selección de
par de anclas + subdivisión (2/3/5 → 2/3 → 2/3) por tasa de acierto, validación de
pivotes (válido / continuación / límite / inválido), ciclo dominante y estadística.
"""
import math
from dataclasses import dataclass, field

import numpy as np


class RMQ:
    """Tablas de rango disperso: índice del mínimo de low / máximo de high en O(1)."""

    def __init__(self, h, l):
        self.h, self.l = h, l
        n = len(l)
        self.n = n
        self.mn = [np.arange(n)]
        self.mx = [np.arange(n)]
        k = 1
        while (1 << k) <= n:
            half = 1 << (k - 1)
            pm, px = self.mn[-1], self.mx[-1]
            a, b = pm[:n - (1 << k) + 1], pm[half:half + n - (1 << k) + 1]
            self.mn.append(np.where(l[a] <= l[b], a, b))
            a, b = px[:n - (1 << k) + 1], px[half:half + n - (1 << k) + 1]
            self.mx.append(np.where(h[a] >= h[b], a, b))
            k += 1

    def qmin(self, lo, hi):
        lo, hi = max(lo, 0), min(hi, self.n - 1)
        if lo > hi:
            return -1
        k = (hi - lo + 1).bit_length() - 1
        a, b = self.mn[k][lo], self.mn[k][hi - (1 << k) + 1]
        return int(a if self.l[a] <= self.l[b] else b)

    def qmax(self, lo, hi):
        lo, hi = max(lo, 0), min(hi, self.n - 1)
        if lo > hi:
            return -1
        k = (hi - lo + 1).bit_length() - 1
        a, b = self.mx[k][lo], self.mx[k][hi - (1 << k) + 1]
        return int(a if self.h[a] >= self.h[b] else b)


def bceil(n, x):
    return min(max(math.ceil(x - 1e-6), 0), n)


def bfloor(n, x):
    return max(min(math.floor(x + 1e-6), n - 1), -1)


def test_pivot(R, px, L, wf):
    """1 válido · 2 continuación · 3 límite ±15% · 0 inválido · -1 no evaluable."""
    n = R.n
    wX = wf * L
    if not (px - wX >= 0 and px + wX <= n - 1):
        return -1, -1
    lo, hi = bceil(n, px - wX), bfloor(n, px + wX)
    if lo > hi:
        return -1, -1
    mw = R.qmin(bceil(n, px - L / 3), bfloor(n, px + L / 3))
    m = R.qmin(lo, hi)
    if m == mw:
        return 1, m
    lo5, hi5 = bceil(n, px - wX * 0.5), bfloor(n, px + wX * 0.5)
    m5 = R.qmin(lo5, hi5) if lo5 <= hi5 else -1
    if m5 >= 0 and R.qmin(bceil(n, m5 - L / 6), bfloor(n, m5 + L / 6)) == m5:
        return 2, m5
    m15 = R.qmin(bceil(n, px - wX * 1.5), bfloor(n, px + wX * 1.5))
    if m15 >= 0 and m15 == mw:
        return 3, m15
    return 0, m


def lvl_score(sc, te):
    return (sc / te) * (te / (te + 3.0)) if te > 0 else 0.0


def ratio_pen(r):
    return 0.0 if r == 2 else 0.02 if r == 3 else 0.10


def eval_lvl(R, x0, L, wf, ea, eb):
    sc, va, te = 0.0, 0, 0
    n = R.n
    kmin, kmax = math.ceil((0 - x0) / L), math.floor((n - 1 - x0) / L)
    for k in range(kmin, kmax + 1):
        px = x0 + k * L
        if abs(px - ea) > L * 0.02 and abs(px - eb) > L * 0.02:
            st, _ = test_pivot(R, px, L, wf)
            if st >= 0:
                te += 1
                if st == 1:
                    va += 1
                    sc += 1
                elif st == 2:
                    va += 1
                    sc += 0.85
                elif st == 3:
                    sc += 0.5
    return sc, va, te


def find_cands(R, p, K, merge=True, tol=2.0):
    n = R.n
    l, h = R.l, R.h
    sw = [i for i in range(p // 2, n - p) if R.qmin(i - p, i + p) == i] if n > 2 * p + 2 else []
    prom = []
    for j, i in enumerate(sw):
        li = l[i]
        lb = next((sw[q] for q in range(j - 1, -1, -1) if l[sw[q]] < li), -1)
        rb = next((sw[q] for q in range(j + 1, len(sw)) if l[sw[q]] < li), -1)
        lmax = h[R.qmax(0 if lb < 0 else lb, i)]
        rmax = h[R.qmax(i, n - 1 if rb < 0 else rb)]
        if lb >= 0 and rb >= 0:
            key = min(lmax, rmax)
        elif lb >= 0:
            key = lmax
        elif rb >= 0:
            key = rmax
        else:
            key = max(lmax, rmax)
        prom.append(math.log(key / li) if li > 0 and key > 0 else key - li)
    sel = sorted(sorted(range(len(sw)), key=lambda j: -prom[j])[:K])
    cX, cI, cP = [], [], []
    q = 0
    while q < len(sel):
        j1 = sel[q]
        i1 = sw[j1]
        if merge and q < len(sel) - 1:
            j2 = sel[q + 1]
            i2 = sw[j2]
            if l[i1] > 0 and l[i2] > 0 and abs(math.log(l[i1] / l[i2])) <= tol / 100 and i2 - i1 <= 4 * p:
                cX.append((i1 + i2) / 2)
                cI.append(round((i1 + i2) / 2))
                cP.append(max(prom[j1], prom[j2]))
                q += 2
                continue
        cX.append(float(i1))
        cI.append(i1)
        cP.append(prom[j1])
        q += 1
    return cX, cI, cP


@dataclass
class Level:
    id: int
    len: float
    ratio: int
    on: bool
    valid: int = 0
    tested: int = 0
    score: float = 0.0
    st1: int = -1
    st2: int = -1
    last_tr: int = -1
    last_px: float = float("nan")
    next_px: float = float("nan")
    active: bool = False
    px: list = field(default_factory=list)
    st: list = field(default_factory=list)
    tro: list = field(default_factory=list)

    @property
    def hit(self):
        return self.valid / self.tested if self.tested else 0.0


def analyze(R, L: Level, x0, wf, ea, eb):
    n = R.n
    if not (L.on and L.len > 0):
        return
    wX = wf * L.len
    kmin = math.ceil((0 - x0) / L.len)
    kmax = math.floor((n - 1 - x0) / L.len) + 1
    for k in range(kmin, kmax + 1):
        px = x0 + k * L.len
        if px + wX > n - 1:
            if math.isnan(L.next_px):
                L.next_px = px
                L.active = n - 1 >= px - wX
            continue
        st, tro = test_pivot(R, px, L.len, wf)
        anchor = abs(px - ea) <= L.len * 0.02 or abs(px - eb) <= L.len * 0.02
        L.px.append(px)
        L.st.append(st)
        L.tro.append(tro)
        if st >= 0:
            if not anchor:
                L.tested += 1
                if st in (1, 2):
                    L.valid += 1
                L.score += {1: 1.0, 2: 0.85, 3: 0.5}.get(st, 0.0)
            L.st2, L.st1 = L.st1, st
            if st in (1, 2):
                L.last_tr, L.last_px = tro, px
    if math.isnan(L.next_px):
        L.next_px = x0 + (kmax + 1) * L.len


@dataclass
class Snapshot:
    ok: bool
    x0: float = 0.0
    levels: list = field(default_factory=list)
    dom: int = -1
    anchors: tuple = (0, 0)


def run_engine(h, l, wf=0.10, min_bars=4, n_cand=8, min_mast_pct=8.0, piv_str=0):
    """Ejecuta el motor sobre los arrays dados (índices locales 0..n-1)."""
    R = RMQ(h, l)
    n = R.n
    if n < 60:
        return Snapshot(False)
    p = piv_str if piv_str > 0 else max(2, round(n / 60))
    cX, cI, cP = find_cands(R, p, n_cand)
    m = len(cX)
    if m < 2:
        return Snapshot(False)
    maxP = max(max(cP), 1e-9)
    minD = max(min_bars * 4, round(n * min_mast_pct / 100))
    best = None
    for a in range(m - 1):
        for b in range(a + 1, m):
            dB = cI[b] - cI[a]
            if dB < minD:
                continue
            D = cX[b] - cX[a]
            pen0 = 0.05 if any(cP[c] > min(cP[a], cP[b]) for c in range(a + 1, b)) else 0.0
            promN = (cP[a] + cP[b]) / (2 * maxP)
            for r1 in (2, 3, 5):
                for r2 in (2, 3):
                    if dB / (r1 * r2) < min_bars:
                        continue
                    s1, _, t1 = eval_lvl(R, cX[a], D / r1, wf, cX[a], cX[b])
                    s2, _, t2 = eval_lvl(R, cX[a], D / r1 / r2, wf, cX[a], cX[b])
                    sc = 0.45 * lvl_score(s1, t1) + 0.45 * lvl_score(s2, t2) + 0.10 * promN - ratio_pen(r1) - 0.5 * ratio_pen(r2) - pen0
                    if best is None or sc > best[0]:
                        best = (sc, cX[a], D, r1, r2, a, b)
    if best is None:
        return Snapshot(False)
    _, x0, D, r1, r2, a, b = best
    ea, eb = cX[a], cX[b]
    r3, bs3 = 2, -1e18
    for a3 in (2, 3):
        l3 = D / r1 / r2 / a3
        if l3 >= min_bars:
            s3, _, t3 = eval_lvl(R, x0, l3, wf, ea, eb)
            sc3 = lvl_score(s3, t3) - ratio_pen(a3)
            if sc3 > bs3:
                bs3, r3 = sc3, a3
    lens = [D, D / r1, D / r1 / r2, D / r1 / r2 / r3]
    rats = [1, r1, r2, r3]
    levels = []
    for i in range(4):
        L = Level(i, lens[i], rats[i], lens[i] >= min_bars)
        analyze(R, L, x0, wf, ea, eb)
        levels.append(L)
    dom, domS = -1, -1.0
    for i, L in enumerate(levels):
        if L.on and L.tested >= 3:
            sv = lvl_score(L.score, L.tested)
            if sv > domS:
                domS, dom = sv, i
    if dom < 0:
        dom = 1 if levels[1].on else 0
    return Snapshot(True, x0, levels, dom, (ea, eb))


def pivot_stats(h, l, L: Level):
    """Estadística del nivel (expansión desde el mínimo, posición del techo, retroceso)."""
    n = len(l)
    exps, tops, rets = [], [], []
    for px, st, i0 in zip(L.px, L.st, L.tro):
        if st not in (1, 2) or i0 < 0 or i0 + 0.9 * L.len > n - 1:
            continue
        e75 = min(n - 1, int(i0 + 0.75 * L.len))
        top = i0 + int(np.argmax(h[i0:e75 + 1]))
        exps.append(h[top] / l[i0] - 1)
        tops.append((top - i0) / L.len)
        re = min(int(top + 0.25 * L.len), int(i0 + 0.9 * L.len))
        den = h[top] - l[i0]
        if re > top and den > 0:
            ml = top + 1 + int(np.argmin(l[top + 1:re + 1]))
            rets.append((h[top] - l[ml]) / den)
    if len(exps) < 3:
        return None
    e = np.array(exps)
    return dict(n=len(e), tp1=float(e.min()), tp2=float(np.percentile(e, 10)), tp3=float(np.median(e)),
                top_med=float(np.median(tops)), ret_med=float(np.median(rets)) if rets else float("nan"))
