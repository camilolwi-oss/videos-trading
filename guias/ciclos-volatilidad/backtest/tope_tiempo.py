"""Iteración 6: sensibilidad del sistema final a la EMA de salida y al tope de tiempo.

Uso: python -I tope_tiempo.py <btc_dir> <tf>
"""
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from run import IS, OOS, CFG, TS  # noqa: E402
from walk import load, simulate, metrics  # noqa: E402
from vol import features, ema  # noqa: E402
from final import signals  # noqa: E402


def main():
    btc_dir, tf = sys.argv[1], sys.argv[2]
    d = load(Path(btc_dir) / CFG[tf]["file"])
    start = int(np.searchsorted(d["t"], TS(2017)))
    f = features(d["o"], d["h"], d["l"], d["c"], d["v"], hurst_len=10 ** 9)
    sig = signals(d, f, start)
    for en in (50, 100, 150):
        e = ema(d["c"], en)
        for tb in (90, 180, 270, 360, 540, 10 ** 6):
            tr = simulate(d, sig, dict(target_R=None, time_bars=tb, ema=e))
            mi, mo = metrics(tr, d, *IS), metrics(tr, d, *OOS)
            nt = sum(1 for x in tr if x["exit"] - (x["t"] + 1) >= tb)
            print(f"EMA{en:3d} tope {tb if tb < 10 ** 6 else 'sin':>4} · IS n={mi['n']} R/op={mi['avgR']:+.2f} PF={mi['pf']:.2f} "
                  f"· OOS n={mo['n']} R/op={mo['avgR']:+.2f} PF={mo['pf']:.2f} · cierres por tiempo {nt}")


if __name__ == "__main__":
    main()
