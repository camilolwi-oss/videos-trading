"""Informe del sistema final elegido en la iteración.

Señal: compresión de volatilidad → liberación → cierre sobre la caja, con precio > EMA200 y
momentum ≥ 2/3 (EMA20/50 apiladas · ATR subiendo · volumen). Stop: mínimo de la caja.
Salida: cierre bajo la EMA100 (o 180 barras). Coste 0,1 % por lado. Entrada a la apertura siguiente.
Uso: python -I final.py <btc_dir> <tf> <out_dir>
"""
import bisect
import calendar
import csv
import datetime as dt
import json
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from run import IS, OOS, CFG, TS  # noqa: E402
from walk import load, simulate, metrics, snapshots, cyc_state  # noqa: E402
from vol import features, ema  # noqa: E402

EXIT = dict(target_R=None, time_bars=180)


def signals(d, f, start):
    c = d["c"]
    mom = f["ema_ok"].astype(int) + f["atr_ok"].astype(int) + f["volu_ok"].astype(int)
    out = []
    for t in range(start, len(c) - 1):
        if f["brk"][t] > 0 and c[t] > f["ema200"][t] and mom[t] >= 2:
            stop = f["box_l"][t]
            if c[t] - stop >= 0.5 * f["atr"][t]:
                out.append((t, 1, stop, {}))
    return out


def equity(d, trades, risk_pct):
    """Curva de capital barra a barra (riesgo fijo por operación, marcado a mercado)."""
    c = d["c"]
    eq = np.ones(len(c))
    cap = 1.0
    open_tr = {x["t"] + 1: x for x in trades}
    cur = None
    for i in range(1, len(c)):
        if cur is None and i in open_tr:
            cur = open_tr[i]
            size = cap * risk_pct / 100 / (cur["risk_pct"] / 100)
            base = cap
        if cur is not None:
            if i >= cur["exit"]:
                cap = base * (1 + risk_pct / 100 * cur["R"])
                cur = None
                eq[i] = cap
                continue
            eq[i] = base + size * (c[i] / cur["entry"] - 1)
        else:
            eq[i] = cap
    return eq


def main():
    btc_dir, tf, out_dir = sys.argv[1], sys.argv[2], Path(sys.argv[3])
    out_dir.mkdir(parents=True, exist_ok=True)
    d = load(Path(btc_dir) / CFG[tf]["file"])
    start = int(np.searchsorted(d["t"], TS(2017)))
    f = features(d["o"], d["h"], d["l"], d["c"], d["v"], hurst_len=10 ** 9)
    e100 = ema(d["c"], 100)
    tr = simulate(d, signals(d, f, start), dict(EXIT, ema=e100))
    full = (TS(2017), TS(2026, 11, 2))
    rep = {k: metrics(tr, d, *v) for k, v in (("IS 2017-2021", IS), ("OOS 2022-2026", OOS), ("Total 2017-2026", full))}
    for k, m in rep.items():
        print(f"{k:16s} n={m['n']:3d} acierto={m['win']:3.0f}% R/op={m['avgR']:+.2f} PF={m['pf']:.2f} R tot={m['totR']:+.1f} "
              f"DD={m['ddR']:.1f}R · CAGR@1%={m['cagr']:+.1f}% MDD={m['mdd']:.1f}%")
    # por año
    years = {}
    for x in tr:
        y = dt.datetime.fromtimestamp(int(d["t"][x["t"]]), dt.UTC).year
        years.setdefault(y, []).append(x["R"])
    c = d["c"]
    print("\nAño  ops  acierto  R total  ret@1%  BTC")
    yearly = []
    for y in range(2017, 2027):
        r = np.array(years.get(y, []))
        i0, i1 = int(np.searchsorted(d["t"], TS(y))), int(np.searchsorted(d["t"], TS(y + 1))) - 1
        btc = c[min(i1, len(c) - 1)] / c[i0] - 1
        ret = np.prod(1 + 0.01 * r) - 1 if len(r) else 0.0
        yearly.append(dict(year=y, n=len(r), win=float((r > 0).mean() * 100) if len(r) else 0, R=float(r.sum()), ret1=ret * 100, btc=btc * 100))
        print(f"{y}  {len(r):3d}  {yearly[-1]['win']:6.0f}%  {r.sum():+6.1f}  {ret * 100:+6.1f}%  {btc * 100:+6.0f}%")
    # exposición
    bars = sum(x["exit"] - x["t"] for x in tr)
    expo = bars / (len(c) - start) * 100
    print(f"\nExposición: {expo:.0f}% del tiempo · duración mediana {np.median([x['exit'] - x['t'] for x in tr]):.0f} barras"
          f" · riesgo mediano {np.median([x['risk_pct'] for x in tr]):.1f}% del precio")
    # contexto de ciclos (informativo): ¿mejor dentro de una ventana de pivote?
    snaps = snapshots(d, CFG[tf]["recompute"], start)
    t0s = [s[0] for s in snaps]
    inwin, outwin = [], []
    for x in tr:
        k = bisect.bisect_right(t0s, x["t"]) - 1
        cs = cyc_state(snaps[k], x["t"]) if k >= 0 else None
        (inwin if cs and cs.ok and any(cs.lv_inwin) else outwin).append(x["R"])
    for lab, arr in (("con alguna ventana de pivote activa", inwin), ("sin ventana activa", outwin)):
        a = np.array(arr)
        print(f"Ciclos (informativo) {lab}: n={len(a)} acierto={(a > 0).mean() * 100:.0f}% R/op={a.mean():+.2f}")
    # azar con las mismas reglas
    rng = np.random.default_rng(11)
    mom = f["ema_ok"].astype(int) + f["atr_ok"].astype(int) + f["volu_ok"].astype(int)
    k_atr = np.median([(x["entry"] - x["stop"]) / f["atr"][x["t"]] for x in tr])
    for lab, (a, b) in (("IS", IS), ("OOS", OOS)):
        m = metrics(tr, d, a, b)
        i0, i1 = int(np.searchsorted(d["t"], a)), int(np.searchsorted(d["t"], b)) - 2
        pool = [t for t in range(max(i0, start), i1) if c[t] > f["ema200"][t] and mom[t] >= 2 and not np.isnan(f["atr"][t])]
        avg = []
        for _ in range(500):
            ts = sorted(rng.choice(pool, size=m["n"] * 3, replace=False))
            rt = simulate(d, [(t, 1, c[t] - k_atr * f["atr"][t], {}) for t in ts], dict(EXIT, ema=e100))
            rt = [x for x in rt if a <= d["t"][x["t"]] < b][: m["n"]]
            avg.append(np.mean([x["R"] for x in rt]))
        avg = np.array(avg)
        print(f"Azar {lab}: señal {m['avgR']:+.2f} R/op · azar mediana {np.median(avg):+.2f} · p90 {np.percentile(avg, 90):+.2f} · p≈{(avg >= m['avgR']).mean():.3f}")
        rep[f"azar {lab}"] = dict(signal=m["avgR"], rand_med=float(np.median(avg)), rand_p90=float(np.percentile(avg, 90)),
                                  p=float((avg >= m["avgR"]).mean()))
    # curva de capital
    eq1 = equity(d, tr, 1.0)
    eq2 = equity(d, tr, 2.0)
    with open(out_dir / f"operaciones_{tf}.csv", "w", newline="") as fo:
        w = csv.writer(fo)
        w.writerow(["fecha_señal", "entrada", "stop", "riesgo_%", "fecha_salida", "salida_R"])
        for x in tr:
            fmt = lambda i: dt.datetime.fromtimestamp(int(d["t"][i]), dt.UTC).strftime("%Y-%m-%d %H:%M")
            w.writerow([fmt(x["t"]), round(x["entry"], 2), round(x["stop"], 2), round(x["risk_pct"], 2), fmt(x["exit"]), round(x["R"], 3)])
    (out_dir / f"informe_{tf}.json").write_text(json.dumps(dict(metrics=rep, yearly=yearly, exposure=expo), indent=1, default=float))
    np.save(out_dir / f"equity_{tf}.npy", np.vstack([d["t"], c, eq1, eq2]))
    print("guardado en", out_dir)


if __name__ == "__main__":
    main()
