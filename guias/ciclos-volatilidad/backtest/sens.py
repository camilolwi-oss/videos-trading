"""Sensibilidad del sistema final (ruptura de volatilidad + EMA200 + momentum) a sus parámetros.

Uso: python -I sens.py <btc_dir> <tf>
"""
import itertools
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from run import IS, OOS, CFG, TS  # noqa: E402
from walk import load, simulate, metrics  # noqa: E402
from vol import features, ema  # noqa: E402


def system(d, f, start, exit_ema, min_risk_atr=0.5):
    c = d["c"]
    sig = []
    mom = f["ema_ok"].astype(int) + f["atr_ok"].astype(int) + f["volu_ok"].astype(int)
    for t in range(start, len(c) - 1):
        if f["brk"][t] > 0 and c[t] > f["ema200"][t] and mom[t] >= 2:
            stop = f["box_l"][t]
            if c[t] - stop >= min_risk_atr * f["atr"][t]:
                sig.append((t, 1, stop, {}))
    return simulate(d, sig, dict(target_R=None, time_bars=180, ema=exit_ema))


def main():
    btc_dir, tf = sys.argv[1], sys.argv[2]
    d = load(Path(btc_dir) / CFG[tf]["file"])
    start = int(np.searchsorted(d["t"], TS(2017)))
    rows = []
    for comp, rel, bh in itertools.product((3, 5, 8), (15, 20, 25), (6, 12, 24)):
        f = features(d["o"], d["h"], d["l"], d["c"], d["v"], comp_thr=comp, rel_thr=rel, brk_h=bh, hurst_len=10 ** 9)  # Hurst no interviene: se omite
        for en in (20, 50, 100):
            tr = system(d, f, start, ema(d["c"], en))
            mi, mo = metrics(tr, d, *IS), metrics(tr, d, *OOS)
            rows.append((comp, rel, bh, en, mi, mo))
            print(f"comp≤{comp} lib>{rel} ruptura≤{bh:2d}b salida EMA{en:3d} · IS n={mi.get('n', 0):3d} R/op={mi.get('avgR', 0):+.2f} "
                  f"· OOS n={mo.get('n', 0):3d} R/op={mo.get('avgR', 0):+.2f} PF={mo.get('pf', 0):.2f}", flush=True)
    oos = np.array([r[5].get("avgR", 0) for r in rows])
    ins = np.array([r[4].get("avgR", 0) for r in rows])
    print(f"\nCombinaciones: {len(rows)} · IS R/op>0 en {np.mean(ins > 0) * 100:.0f}% (mediana {np.median(ins):+.2f}) · "
          f"OOS R/op>0 en {np.mean(oos > 0) * 100:.0f}% (mediana {np.median(oos):+.2f}, mín {oos.min():+.2f})")


if __name__ == "__main__":
    main()
