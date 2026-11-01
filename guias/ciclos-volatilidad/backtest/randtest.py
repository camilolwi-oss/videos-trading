"""¿La ventaja es de la señal o del filtro + la salida? Entradas al azar con las mismas reglas.

Uso: python -I randtest.py <btc_dir> <tf>
"""
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from run import build, IS, OOS  # noqa: E402
from iterate import context, run_variant, EXITS  # noqa: E402
from walk import simulate, metrics  # noqa: E402


def main():
    btc_dir, tf = sys.argv[1], sys.argv[2]
    d, f, snaps, start = build(btc_dir, tf)
    sigs = context(d, f, snaps, start)
    c, atr, e200 = d["c"], f["atr"], f["ema200"]
    mom = f["ema_ok"].astype(int) + f["atr_ok"].astype(int) + f["volu_ok"].astype(int)
    systems = {
        "E: ruptura vol. + EMA200": (lambda s, cx: s["src"] == "VOL" and s["dir"] > 0 and cx["up200"], lambda t: c[t] > e200[t]),
        "E∩M: + momentum≥2": (lambda s, cx: s["src"] == "VOL" and s["dir"] > 0 and cx["up200"] and cx["mom"] >= 2,
                               lambda t: c[t] > e200[t] and mom[t] >= 2),
    }
    rng = np.random.default_rng(7)
    ex = dict(EXITS["EMA50"])
    ex["ema"] = f["ema50"]
    for name, (flt, elig) in systems.items():
        tr, mi, mo = run_variant(d, f, sigs, flt, EXITS["EMA50"])
        k_atr = np.median([abs(x["entry"] - x["stop"]) / atr[x["t"]] for x in tr])
        print(f"== {name} · stop mediano {k_atr:.2f} ATR")
        for label, (a, b), m in (("IS", IS, mi), ("OOS", OOS, mo)):
            i0, i1 = int(np.searchsorted(d["t"], a)), int(np.searchsorted(d["t"], b)) - 2
            pool = [t for t in range(max(i0, start), i1) if not np.isnan(atr[t]) and elig(t)]
            avg = []
            for _ in range(500):
                ts = sorted(rng.choice(pool, size=m["n"] * 3, replace=False))
                sg = [(t, 1, c[t] - k_atr * atr[t], {}) for t in ts]
                rt = simulate(d, sg, ex)
                rt = [x for x in rt if a <= d["t"][x["t"]] < b][: m["n"]]
                avg.append(np.mean([x["R"] for x in rt]) if rt else 0.0)
            avg = np.array(avg)
            p = float((avg >= m["avgR"]).mean())
            print(f"   {label}: señal R/op={m['avgR']:+.2f} (n={m['n']}) · azar R/op mediana={np.median(avg):+.2f} "
                  f"p90={np.percentile(avg, 90):+.2f} · p-valor≈{p:.3f}")


if __name__ == "__main__":
    main()
