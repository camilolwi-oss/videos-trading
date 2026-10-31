"""Backtest sobre los datos digitalizados de las capturas (precio + oscilador).

Eventos evaluados:
  A  Liberación de compresión: la irregular sale del suelo (≤5) y supera 20.
  B+ / B-  La línea suave cruza 50 al alza / a la baja.
  C+ / C-  La irregular cruza la suave al alza / a la baja.
  D  Meseta alta: la irregular llega a ≥90 (pico de volatilidad).
Métricas: rango futuro (máx-mín de las próximas H barras) frente a la mediana de
todas las barras, retorno futuro, y una regla direccional sobre A (ruptura de la
caja de compresión, stop en el lado opuesto, objetivo 1R/2R, salida por tiempo).
Uso: python -I backtest.py <data_dir>
"""
import csv
import datetime as dt
import json
import sys
from pathlib import Path

import numpy as np

CFG = {
    "btc_4h": dict(bar_h=4, H=(6, 12, 24), last_k=356),
    "btc_30m": dict(bar_h=0.5, H=(8, 16, 48), last_k=10 ** 9),
}


def load(path):
    rows = list(csv.DictReader(open(path)))
    f = lambda k: np.array([float(r[k]) for r in rows])
    return dict(k=f("k").astype(int), h=f("high"), l=f("low"), c=f("mid"), vol=f("vol"), cyc=f("cyc"),
                band=np.array([r["band"] for r in rows]))


def fwd_range(d, t, H):
    if t + H >= len(d["c"]):
        return np.nan
    return (d["h"][t + 1:t + H + 1].max() - d["l"][t + 1:t + H + 1].min()) / d["c"][t]


def fwd_ret(d, t, H):
    if t + H >= len(d["c"]):
        return np.nan
    return d["c"][t + H] / d["c"][t] - 1


def events(d):
    v, cy = d["vol"], d["cyc"]
    ev = {"A": [], "B+": [], "B-": [], "C+": [], "C-": [], "D": []}
    last_a = -99
    for t in range(1, len(v)):
        if v[t] > 20 and v[max(0, t - 6):t].min() <= 5 and t - last_a > 6:
            ev["A"].append(t)
            last_a = t
        if cy[t] >= 50 > cy[t - 1]:
            ev["B+"].append(t)
        if cy[t] < 50 <= cy[t - 1]:
            ev["B-"].append(t)
        if v[t] >= cy[t] and v[t - 1] < cy[t - 1]:
            ev["C+"].append(t)
        if v[t] < cy[t] and v[t - 1] >= cy[t - 1]:
            ev["C-"].append(t)
        if v[t] >= 90 > v[t - 1]:
            ev["D"].append(t)
    # filtrar cruces muy seguidos (ruido de digitalización): mínimo 3 barras entre eventos del mismo tipo
    for k in ("C+", "C-", "B+", "B-", "D"):
        out = []
        for t in ev[k]:
            if not out or t - out[-1] >= 3:
                out.append(t)
        ev[k] = out
    return ev


def breakout_rule(d, t, H):
    """Regla direccional sobre una liberación: caja = máx/mín de la compresión previa."""
    v = d["vol"]
    s = t - 1
    while s > 0 and v[s - 1] <= 20 and t - s < 40:
        s -= 1
    box_h, box_l = d["h"][s:t].max(), d["l"][s:t].min()
    for j in range(t, min(len(v) - 1, t + H)):
        c = d["c"][j]
        if c > box_h or c < box_l:
            side = 1 if c > box_h else -1
            stop = box_l if side > 0 else box_h
            risk = abs(c - stop)
            if risk <= 0:
                return None
            res = {"1R": None, "2R": None}
            for tgt in (1, 2):
                target = c + side * risk * tgt
                out = None
                for m in range(j + 1, min(len(v), j + 1 + H)):
                    hit_stop = d["l"][m] <= stop if side > 0 else d["h"][m] >= stop
                    hit_tgt = d["h"][m] >= target if side > 0 else d["l"][m] <= target
                    if hit_stop and hit_tgt:
                        out = -1.0  # ambiguo dentro de la vela: contamos pérdida (conservador)
                        break
                    if hit_stop:
                        out = -1.0
                        break
                    if hit_tgt:
                        out = float(tgt)
                        break
                if out is None:  # salida por tiempo
                    last = d["c"][min(len(v) - 1, j + H)]
                    out = side * (last - c) / risk
                res[f"{tgt}R"] = out
            return dict(t=t, entry_bar=j, side=side, risk_pct=risk / c * 100, **res)
    return None


def stamp(d, t, bar_h):
    return (dt.datetime(2026, 9, 1) + dt.timedelta(hours=int(d["k"][t]) * bar_h)).strftime("%d %b %H:%M")


def main():
    data_dir = Path(sys.argv[1])
    report = {}
    for name, cfg in CFG.items():
        d = load(data_dir / f"{name}.csv")
        ev = events(d)
        n = len(d["c"])
        out = {"bars": n, "events": {}}
        print(f"\n===== {name} · {n} barras =====")
        for H in cfg["H"]:
            base = np.array([fwd_range(d, t, H) for t in range(n)])
            med = np.nanmedian(base)
            print(f"-- horizonte {H} barras ({H * cfg['bar_h']:.0f} h) · rango futuro mediano de todas las barras: {med * 100:.2f}%")
            for k, ts in ev.items():
                rs = np.array([fwd_range(d, t, H) for t in ts])
                rr = np.array([fwd_ret(d, t, H) for t in ts])
                ok = ~np.isnan(rs)
                if ok.sum() == 0:
                    continue
                ratio = np.nanmedian(rs) / med
                above = np.mean(rs[ok] > med) * 100
                up = np.mean(rr[ok] > 0) * 100
                print(f"   {k:3s} n={ok.sum():2d}  rango/mediana={ratio:4.2f}  %>mediana={above:5.1f}  "
                      f"ret medio={np.nanmean(rr) * 100:+5.2f}%  %sube={up:5.1f}")
                out["events"].setdefault(k, {})[H] = dict(n=int(ok.sum()), ratio=round(float(ratio), 2),
                                                          above=round(float(above), 1),
                                                          ret=round(float(np.nanmean(rr) * 100), 2),
                                                          up=round(float(up), 1))
        print("-- eventos (fecha · tipo):")
        for k, ts in ev.items():
            print(f"   {k:3s}", ", ".join(stamp(d, t, cfg["bar_h"]) for t in ts))
        out["dates"] = {k: [stamp(d, t, cfg["bar_h"]) for t in ts] for k, ts in ev.items()}
        # regla direccional sobre A
        H = cfg["H"][1]
        trades = [x for x in (breakout_rule(d, t, H) for t in ev["A"]) if x]
        print(f"-- regla de ruptura tras liberación (horizonte {H} barras): {len(trades)} operaciones")
        for x in trades:
            print(f"   {stamp(d, x['t'], cfg['bar_h'])} {'LARGO' if x['side'] > 0 else 'CORTO'} riesgo {x['risk_pct']:.2f}%  "
                  f"1R→{x['1R']:+.2f}R  2R→{x['2R']:+.2f}R")
        if trades:
            for tgt in ("1R", "2R"):
                r = np.array([x[tgt] for x in trades])
                print(f"   {tgt}: acierto {np.mean(r > 0) * 100:.0f}% · media {r.mean():+.2f}R · total {r.sum():+.2f}R")
        out["trades"] = trades
        # giros marcados por el usuario
        ann = json.loads((data_dir / f"{name}_annotations.json").read_text())
        turns = sorted([a for a in ann if a["pane"] == "price" and a["k"] <= cfg["last_k"] and a["n"] >= 36 and a["h"] >= 15],
                       key=lambda a: a["k"])
        print("-- giros marcados (círculos amarillos) y evento más cercano:")
        kidx = {int(k): i for i, k in enumerate(d["k"])}
        near = []
        for a in turns:
            i = kidx.get(a["k"])
            if i is None:
                continue
            best = None
            for k, ts in ev.items():
                for t in ts:
                    if best is None or abs(t - i) < abs(best[1] - i):
                        best = (k, t)
            dist = best[1] - i if best else None
            near.append(dict(date=stamp(d, i, cfg["bar_h"]), price=a["value"], event=best[0] if best else None, dist=dist))
            print(f"   {stamp(d, i, cfg['bar_h'])} ~{a['value']:.0f} → {best[0]} a {dist:+d} barras")
        out["turns"] = near
        report[name] = out
    (data_dir / "backtest.json").write_text(json.dumps(report, indent=1, default=float))


if __name__ == "__main__":
    main()
