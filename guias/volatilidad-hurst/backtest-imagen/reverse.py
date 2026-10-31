"""Ingeniería inversa del oscilador 'volamonk' a partir de los datos digitalizados.

Prueba familias de fórmulas de volatilidad normalizada 0–100 contra la línea
irregular y familias de suavizado/onda contra la línea suave.
Uso: python -I reverse.py <data_dir>
"""
import csv
import itertools
import sys
from pathlib import Path

import numpy as np


def load(path):
    rows = list(csv.DictReader(open(path)))
    f = lambda k: np.array([float(r[k]) for r in rows])
    return dict(h=f("high"), l=f("low"), c=f("mid"), vol=f("vol"), cyc=f("cyc"), band=[r["band"] for r in rows])


def sma(x, n):
    out = np.full_like(x, np.nan)
    for i in range(n - 1, len(x)):
        out[i] = np.mean(x[i - n + 1:i + 1])
    return out


def ema(x, n):
    a = 2 / (n + 1)
    out = np.empty_like(x)
    out[0] = x[0]
    for i in range(1, len(x)):
        out[i] = a * x[i] + (1 - a) * out[i - 1] if not np.isnan(x[i]) else out[i - 1]
    return out


def rma(x, n):
    a = 1 / n
    out = np.empty_like(x)
    out[0] = x[0]
    for i in range(1, len(x)):
        out[i] = a * x[i] + (1 - a) * out[i - 1]
    return out


def tr(d):
    pc = np.r_[d["c"][0], d["c"][:-1]]
    return np.maximum(d["h"], pc) - np.minimum(d["l"], pc)


def stdev(x, n):
    out = np.full_like(x, np.nan)
    for i in range(n - 1, len(x)):
        out[i] = np.std(x[i - n + 1:i + 1])
    return out


def stoch(x, m):
    out = np.full_like(x, np.nan)
    for i in range(m - 1, len(x)):
        w = x[i - m + 1:i + 1]
        lo, hi = np.nanmin(w), np.nanmax(w)
        out[i] = 100 * (x[i] - lo) / (hi - lo) if hi > lo else 50
    return out


def prank(x, m):
    out = np.full_like(x, np.nan)
    for i in range(m, len(x)):
        w = x[i - m:i]
        out[i] = 100 * np.mean(w <= x[i])
    return out


def score(pred, target, start):
    p, t = pred[start:], target[start:]
    ok = ~np.isnan(p)
    p, t = p[ok], t[ok]
    if len(p) < 50 or np.std(p) == 0:
        return -1, 99
    r = np.corrcoef(p, t)[0, 1]
    # escala lineal óptima
    A = np.vstack([p, np.ones_like(p)]).T
    k, b = np.linalg.lstsq(A, t, rcond=None)[0]
    rmse = float(np.sqrt(np.mean((k * p + b - t) ** 2)))
    return float(r), rmse


def vol_candidates(d):
    c = d["c"]
    logret = np.r_[0, np.diff(np.log(c))]
    base = {}
    for n in (5, 7, 10, 14, 20, 30):
        base[f"ATR({n})"] = rma(tr(d), n)
        base[f"ATR%({n})"] = rma(tr(d), n) / c
        base[f"HV({n})"] = stdev(logret, n)
        bbw = stdev(c, n) / sma(c, n)
        base[f"BBW({n})"] = bbw
        base[f"Rango({n})"] = (np.array([np.max(d["h"][max(0, i - n + 1):i + 1]) for i in range(len(c))])
                              - np.array([np.min(d["l"][max(0, i - n + 1):i + 1]) for i in range(len(c))])) / c
    out = {}
    for (bn, bs), m, sm, kind in itertools.product(base.items(), (20, 50, 100, 150), (1, 3, 5), ("stoch", "prank")):
        x = stoch(bs, m) if kind == "stoch" else prank(bs, m)
        if sm > 1:
            x = sma(x, sm)
        out[f"{kind}({bn}, {m}) sma{sm}"] = (x, m + 30)
    return out


def main():
    data_dir = Path(sys.argv[1])
    for name in ("btc_4h", "btc_30m"):
        d = load(data_dir / f"{name}.csv")
        print(f"\n=== {name}: línea irregular (vol) — mejores fórmulas ===")
        res = []
        for k, (x, start) in vol_candidates(d).items():
            start = min(start, 180)
            r, rmse = score(x, d["vol"], start)
            res.append((r, rmse, k))
        res.sort(reverse=True)
        for r, rmse, k in res[:12]:
            print(f"  r={r:.3f}  rmse={rmse:5.1f}  {k}")

        print(f"--- {name}: línea suave (cyc) frente a la irregular ---")
        vol, cyc = d["vol"], d["cyc"]
        best = []
        for L in range(5, 140, 5):
            for kind, f in (("SMA", sma), ("EMA", ema)):
                y = f(vol, L)
                r, rmse = score(y, cyc, 150)
                best.append((r, rmse, f"{kind}({L}) de la irregular"))
                y2 = f(f(vol, L), L)
                r, rmse = score(y2, cyc, 150)
                best.append((r, rmse, f"doble {kind}({L}) de la irregular"))
        best.sort(reverse=True)
        for r, rmse, k in best[:6]:
            print(f"  r={r:.3f}  rmse={rmse:5.1f}  {k}")
        # desfase: ¿la suave adelanta o atrasa a la irregular suavizada?
        ref = sma(vol, 40)
        lags = []
        for lag in range(-60, 61, 2):
            a, b = (cyc[lag:], ref[:len(ref) - lag]) if lag >= 0 else (cyc[:lag], ref[-lag:])
            ok = ~np.isnan(b)
            if ok.sum() > 100:
                lags.append((np.corrcoef(a[ok], b[ok])[0, 1], lag))
        print("  correlación máxima con SMA40(irregular) en desfase", max(lags)[1], "barras (r=%.2f)" % max(lags)[0],
              "· desfase 0: r=%.2f" % [r for r, l in lags if l == 0][0])
        # ajuste de una sola senoide a la suave
        t = np.arange(len(cyc))
        fits = []
        for P in range(30, 500, 2):
            X = np.vstack([np.sin(2 * np.pi * t / P), np.cos(2 * np.pi * t / P), np.ones_like(t)]).T
            coef, *_ = np.linalg.lstsq(X, cyc, rcond=None)
            rmse = float(np.sqrt(np.mean((X @ coef - cyc) ** 2)))
            fits.append((rmse, P, float(np.hypot(coef[0], coef[1])), float(coef[2])))
        fits.sort()
        rmse, P, A, m = fits[0]
        print(f"  senoide única: período {P} barras, amplitud {A:.1f}, media {m:.1f}, rmse {rmse:.1f}")


if __name__ == "__main__":
    main()
