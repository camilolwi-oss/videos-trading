"""Backtest walk-forward de las señales de time_cycles.pine, volatility_cycle.pine y sus fusiones.

Uso: python -I run.py <btc_dir> <tf: 1d|4h> [salida.json]
"""
import bisect
import calendar
import json
import math
import sys
import time
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from walk import load, snapshots, cyc_state, downtrend_long, vtl_short, simulate, metrics  # noqa: E402
from vol import features  # noqa: E402

TS = lambda y, m=1, d=1: calendar.timegm((y, m, d, 0, 0, 0))
IS = (TS(2017), TS(2022))
OOS = (TS(2022), TS(2026, 11, 2))
CFG = {"1d": dict(file="btc_1d.csv", recompute=5, brk_h=12, vol_time=30),
       "4h": dict(file="btc_4h.csv", recompute=30, brk_h=12, vol_time=60)}


def build(btc_dir, tf):
    cfg = CFG[tf]
    d = load(Path(btc_dir) / cfg["file"])
    start = int(np.searchsorted(d["t"], TS(2017)))
    t0 = time.time()
    import os
    f = features(d["o"], d["h"], d["l"], d["c"], d["v"], brk_h=cfg["brk_h"], comp_thr=float(os.environ.get("COMP_THR", "5")), rel_thr=float(os.environ.get("REL_THR", "20")))
    snaps = snapshots(d, cfg["recompute"], start)
    print(f"[{tf}] barras {len(d['c'])} · instantáneas {len(snaps)} · {time.time() - t0:.0f}s", file=sys.stderr)
    return d, f, snaps, start


def signal_sets(d, f, snaps, start, wf=0.10):
    t0s = [s[0] for s in snaps]
    sig = {k: [] for k in ("VOL", "VOL_L", "CYC_L", "CYC_S", "M_L_TIME", "M_L_VOL", "M_S_TIME")}
    states = {}
    for t in range(start, len(d["c"]) - 1):
        k = bisect.bisect_right(t0s, t) - 1
        if k < 0:
            continue
        cs = cyc_state(snaps[k], t, wf)
        states[t] = cs
        tag = dict(len=cs.len if cs.ok else 0, phase=cs.phase if cs.ok else None, hit=cs.hit if cs.ok else 0)
        b = f["brk"][t]
        if b != 0:
            stop = f["box_l"][t] if b > 0 else f["box_h"][t]
            sig["VOL"].append((t, b, stop, tag))
            if b > 0:
                sig["VOL_L"].append((t, b, stop, tag))
            if cs.ok:
                # fusión 1: ruptura de volatilidad en la zona temprana del ciclo (desde la ventana hasta 35 %)
                if b > 0 and -wf * cs.len <= cs.dist <= 0.35 * cs.len:
                    sig["M_L_TIME"].append((t, b, stop, tag))
                # fusión 3: ruptura bajista en la fase de salida de dinero (segunda mitad del ciclo)
                if b < 0 and 0.5 <= cs.phase <= 1.0 - wf:
                    sig["M_S_TIME"].append((t, b, stop, tag))
        stop = downtrend_long(d, cs, t, wf)
        if stop is not None:
            sig["CYC_L"].append((t, 1, stop, tag))
            # fusión 2: ruptura del ciclo con energía acumulada (compresión reciente)
            if t - f["last_comp"][t] <= max(10, 0.5 * cs.len):
                sig["M_L_VOL"].append((t, 1, stop, tag))
        stop = vtl_short(d, cs, t)
        if stop is not None:
            sig["CYC_S"].append((t, -1, stop, tag))
    return sig, states


EXITS = {
    "2R": dict(target_R=2.0, time_cycle=0.5, time_bars=30),
    "3R+BE": dict(target_R=3.0, breakeven_R=1.0, time_cycle=0.75, time_bars=45),
    "EMA20": dict(target_R=None, time_cycle=1.0, time_bars=60, ema="ema20"),
}


def fmt(m):
    if m.get("n", 0) == 0:
        return "   sin operaciones"
    return (f"n={m['n']:3d} acierto={m['win']:4.0f}% R/op={m['avgR']:+.2f} PF={m['pf']:4.2f} "
            f"R tot={m['totR']:+6.1f} DD={m['ddR']:4.1f}R CAGR@1%={m['cagr']:+5.1f}% MDD={m['mdd']:4.1f}%")


def main():
    btc_dir, tf = sys.argv[1], sys.argv[2]
    out = Path(sys.argv[3]) if len(sys.argv) > 3 else None
    d, f, snaps, start = build(btc_dir, tf)
    sig, states = signal_sets(d, f, snaps, start)
    c = d["c"]
    res = {}
    for name in ("IS", "OOS"):
        a, b = IS if name == "IS" else OOS
        i, j = int(np.searchsorted(d["t"], a)), int(np.searchsorted(d["t"], b)) - 1
        yrs = (d["t"][j] - d["t"][i]) / (365.25 * 86400)
        print(f"Comprar y mantener {name}: ×{c[j] / c[i]:.2f} · CAGR {((c[j] / c[i]) ** (1 / yrs) - 1) * 100:+.1f}%")
    for sname, sigs in sig.items():
        for ename, ecfg in EXITS.items():
            e = dict(ecfg)
            if e.get("ema"):
                e["ema"] = f[e["ema"]]
            if sname.startswith("VOL") and e.get("ema") is None:
                e["time_cycle"] = None
            trades = simulate(d, sigs, e)
            mi, mo = metrics(trades, d, *IS), metrics(trades, d, *OOS)
            res[f"{sname}|{ename}"] = dict(IS=mi, OOS=mo)
            print(f"{sname:9s} {ename:6s} IS  {fmt(mi)}")
            print(f"{'':9s} {'':6s} OOS {fmt(mo)}")
    if out:
        out.write_text(json.dumps(res, indent=1, default=float))


if __name__ == "__main__":
    main()
