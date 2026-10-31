"""Candidatas para la línea suave: osciladores de precio y volatilidad de periodo largo."""
import sys
from pathlib import Path
import numpy as np
sys.path.insert(0, str(Path(__file__).parent))
from reverse import load, sma, ema, rma, tr, stoch, prank, score, stdev


def rsi(x, n):
    d = np.diff(x, prepend=x[0])
    up, dn = rma(np.maximum(d, 0), n), rma(np.maximum(-d, 0), n)
    return 100 - 100 / (1 + up / np.where(dn == 0, 1e-9, dn))


def cands(d):
    c = d["c"]
    out = {}
    for L in (20, 30, 50, 80, 120, 160, 200):
        for S in (5, 10, 20, 40):
            out[f"SMA{S}(stoch precio {L})"] = sma(stoch(c, L), S)
            out[f"EMA{S}(RSI {L})"] = ema(rsi(c, L), S)
            z = (c - sma(c, L)) / stdev(c, L)
            out[f"SMA{S}(zscore {L})"] = sma(z, S)
    for n in (28, 56, 112):
        for m in (50, 100, 200):
            for S in (10, 20, 40, 60):
                out[f"SMA{S}(prank ATR{n},{m})"] = sma(prank(rma(tr(d), n), m), S)
                out[f"SMA{S}(stoch ATR{n},{m})"] = sma(stoch(rma(tr(d), n), m), S)
    return out


for name in ("btc_4h", "btc_30m"):
    d = load(Path(sys.argv[1]) / f"{name}.csv")
    res = []
    for k, x in cands(d).items():
        for lag in (0, 10, 20, 40):
            xx = np.r_[np.full(lag, np.nan), x[:len(x) - lag]] if lag else x
            r, rmse = score(xx, d["cyc"], 200)
            res.append((r, rmse, k + (f" +retraso {lag}" if lag else "")))
    res.sort(reverse=True)
    print("==", name)
    for r, rmse, k in res[:8]:
        print(f"  r={r:.3f} rmse={rmse:5.1f} {k}")
    neg = sorted(res)[:3]
    for r, rmse, k in neg:
        print(f"  (inversa) r={r:.3f} {k}")
