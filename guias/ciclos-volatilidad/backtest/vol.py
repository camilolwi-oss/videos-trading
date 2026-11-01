"""Volatilidad de volatility_cycle.pine portada a Python, barra a barra (sin mirar el futuro)."""
import numpy as np


def rma(x, n):
    out = np.full_like(x, np.nan, dtype=float)
    if len(x) < n:
        return out
    out[n - 1] = np.nanmean(x[:n])
    a = 1.0 / n
    for i in range(n, len(x)):
        out[i] = a * x[i] + (1 - a) * out[i - 1]
    return out


def ema(x, n):
    out = np.empty_like(x, dtype=float)
    a = 2.0 / (n + 1)
    out[0] = x[0]
    for i in range(1, len(x)):
        out[i] = a * x[i] + (1 - a) * out[i - 1]
    return out


def sma(x, n):
    out = np.full_like(x, np.nan, dtype=float)
    cs = np.cumsum(np.where(np.isnan(x), 0, x))
    cnt = np.cumsum(~np.isnan(x))
    for i in range(n - 1, len(x)):
        a = cs[i] - (cs[i - n] if i >= n else 0)
        k = cnt[i] - (cnt[i - n] if i >= n else 0)
        out[i] = a / n if k == n else np.nan
    return out


def atr(h, l, c, n):
    pc = np.r_[c[0], c[:-1]]
    tr = np.maximum(h, pc) - np.minimum(l, pc)
    return rma(tr, n)


def percentrank(x, n):
    """ta.percentrank: % de los n valores previos que son ≤ al actual."""
    out = np.full_like(x, np.nan, dtype=float)
    for i in range(n, len(x)):
        w = x[i - n:i]
        if np.isnan(x[i]) or np.isnan(w).any():
            continue
        out[i] = 100.0 * np.count_nonzero(w <= x[i]) / n
    return out


def hurst_rs(r):
    n = len(r)
    xs, ys = [], []
    s = 8
    while s <= n // 2:
        vals = []
        for i0 in range(0, n - s + 1, s):
            w = r[i0:i0 + s]
            y = np.cumsum(w - w.mean())
            sd = w.std()
            if sd > 0:
                vals.append((y.max() - y.min()) / sd)
        if vals:
            xs.append(np.log(s))
            ys.append(np.log(np.mean(vals)))
        s *= 2
    if len(xs) < 2:
        return np.nan
    return float(np.polyfit(xs, ys, 1)[0])


def features(o, h, l, c, v, atr_len=14, rank_len=100, cyc_atr=28, cyc_len=90,
             comp_thr=5.0, rel_thr=20.0, peak_thr=90.0, brk_h=12, hurst_len=100, hurst_avg=10):
    n = len(c)
    f = {}
    a14 = atr(h, l, c, atr_len)
    vol = percentrank(a14, rank_len)
    cyc = sma(percentrank(atr(h, l, c, cyc_atr), rank_len), cyc_len)
    f["atr"] = a14
    f["vol"] = vol
    f["cyc"] = cyc
    f["ema20"] = ema(c, 20)
    f["ema50"] = ema(c, 50)
    f["ema200"] = ema(c, 200)
    # zona de compresión → liberación → caja → ruptura
    in_zone = False
    zh = zl = np.nan
    arm_bar = -1
    arm_h = arm_l = np.nan
    comp = np.zeros(n, bool)
    release = np.zeros(n, bool)
    brk = np.zeros(n, int)          # +1 ruptura alcista, -1 bajista
    box_h = np.full(n, np.nan)
    box_l = np.full(n, np.nan)
    last_comp = np.full(n, -10 ** 9)
    lc = -10 ** 9
    for i in range(1, n):
        if np.isnan(vol[i]):
            continue
        comp[i] = vol[i] <= comp_thr
        if comp[i]:
            lc = i
        last_comp[i] = lc
        if not in_zone and comp[i]:
            in_zone, zh, zl = True, h[i], l[i]
        elif in_zone:
            zh, zl = max(zh, h[i]), min(zl, l[i])
        if in_zone and vol[i] > rel_thr and not (vol[i - 1] > rel_thr):
            release[i] = True
            in_zone = False
            arm_bar, arm_h, arm_l = i, zh, zl
        if arm_bar >= 0:
            if i - arm_bar > brk_h:
                arm_bar = -1
            elif c[i] > arm_h:
                brk[i], box_h[i], box_l[i] = 1, arm_h, arm_l
                arm_bar = -1
            elif c[i] < arm_l:
                brk[i], box_h[i], box_l[i] = -1, arm_h, arm_l
                arm_bar = -1
    f["comp"], f["release"], f["brk"], f["box_h"], f["box_l"], f["last_comp"] = comp, release, brk, box_h, box_l, last_comp
    f["peak"] = np.r_[False, (vol[1:] >= peak_thr) & ~(vol[:-1] >= peak_thr)]
    # Hurst R/S rodante + media
    lr = np.r_[0.0, np.diff(np.log(c))]
    hu = np.full(n, np.nan)
    for i in range(hurst_len, n):
        hu[i] = hurst_rs(lr[i - hurst_len + 1:i + 1])
    f["hurst"] = hu
    f["hurst_avg"] = sma(hu, hurst_avg)
    # momentum (checklist de la guía): EMA20>EMA50 con pendiente, ATR subiendo, volumen
    e20, e50 = f["ema20"], f["ema50"]
    ema_ok = np.zeros(n, bool)
    atr_ok = np.zeros(n, bool)
    vol_ok = np.zeros(n, bool)
    am = sma(a14, 20)
    vf, vs = sma(v, 5), sma(v, 20)
    for i in range(5, n):
        ema_ok[i] = c[i] > e20[i] and c[i] > e50[i] and e20[i] > e50[i] and e20[i] > e20[i - 3] and e50[i] > e50[i - 3] and (e20[i] - e50[i]) > (e20[i - 5] - e50[i - 5])
        atr_ok[i] = a14[i] > a14[i - 3] and a14[i] > am[i] if not np.isnan(am[i]) else False
        vol_ok[i] = vs[i] > 0 and vf[i] > vs[i] * 1.1 if not np.isnan(vs[i]) else False
    f["ema_ok"], f["atr_ok"], f["volu_ok"] = ema_ok, atr_ok, vol_ok
    return f
