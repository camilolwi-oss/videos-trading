"""Iteración de filtros y salidas sobre las señales base, con contexto completo por señal.

Uso: python -I iterate.py <btc_dir> <tf> <grupo>
Grupos: base · filtros · salidas · final
"""
import bisect
import json
import math
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from run import build, IS, OOS, fmt  # noqa: E402
from walk import cyc_state, downtrend_long, vtl_short, simulate, metrics  # noqa: E402


def context(d, f, snaps, start, wf=0.10):
    """Señales base + contexto (solo información disponible en t)."""
    t0s = [s[0] for s in snaps]
    c, e20, e50, e200 = d["c"], f["ema20"], f["ema50"], f["ema200"]
    out = []
    for t in range(start, len(c) - 1):
        k = bisect.bisect_right(t0s, t) - 1
        if k < 0:
            continue
        cs = cyc_state(snaps[k], t, wf)
        base = []
        if f["brk"][t] != 0:
            b = int(f["brk"][t])
            base.append(("VOL", b, f["box_l"][t] if b > 0 else f["box_h"][t]))
        s = downtrend_long(d, cs, t, wf)
        if s is not None:
            base.append(("CYC_L", 1, s))
        s = vtl_short(d, cs, t)
        if s is not None:
            base.append(("CYC_S", -1, s))
        if not base:
            continue
        mom = int(f["ema_ok"][t]) + int(f["atr_ok"][t]) + int(f["volu_ok"][t])
        ctx = dict(
            cyc=cs.ok, len=cs.len if cs.ok else 0.0, phase=cs.phase if cs.ok else 0.5,
            reldist=(cs.dist / cs.len) if cs.ok else 0.0, in_win=cs.in_win if cs.ok else False,
            hit=cs.hit if cs.ok else 0.0, tested=cs.tested if cs.ok else 0, redraw=cs.redraw if cs.ok else False,
            hurst=f["hurst_avg"][t], vol=f["vol"][t], vcyc=f["cyc"][t],
            vcyc_up=bool(f["cyc"][t] > f["cyc"][t - 3]) if not np.isnan(f["cyc"][t - 3]) else False,
            up200=bool(c[t] > e200[t]), e50_200=bool(e50[t] > e200[t]), e20_50=bool(e20[t] > e50[t]),
            mom=mom, comp_age=t - f["last_comp"][t], atr=f["atr"][t],
            stats=cs.stats if cs.ok else None,
            lv_phase=cs.lv_phase if cs.ok else (), lv_inwin=cs.lv_inwin if cs.ok else (), dom=cs.dom if cs.ok else -1,
        )
        for name, dr, stop in base:
            out.append(dict(t=t, src=name, dir=dr, stop=stop, ctx=ctx))
    return out


def run_variant(d, f, sigs, flt, exit_cfg, min_risk_atr=0.5):
    chosen = []
    for s in sigs:
        cx = s["ctx"]
        if not flt(s, cx):
            continue
        risk = abs(d["c"][s["t"]] - s["stop"])
        if not np.isnan(cx["atr"]) and risk < min_risk_atr * cx["atr"]:
            continue
        chosen.append((s["t"], s["dir"], s["stop"], dict(len=cx["len"], stats=cx["stats"])))
    e = dict(exit_cfg)
    for key in ("ema", "ema_fast"):
        if isinstance(e.get(key), str):
            e[key] = f[e[key]]
    if e.get("peak") is True:
        e["peak"] = f["peak"]
    tr = simulate(d, chosen, e)
    return tr, metrics(tr, d, *IS), metrics(tr, d, *OOS)


EXITS = {
    "2R": dict(target_R=2.0, time_bars=30),
    "3R+BE": dict(target_R=3.0, breakeven_R=1.0, time_bars=45),
    "EMA20": dict(target_R=None, time_bars=90, ema="ema20"),
    "EMA50": dict(target_R=None, time_bars=180, ema="ema50"),
}

L = lambda s, c: s["dir"] > 0
S = lambda s, c: s["dir"] < 0
GROUPS = {
    "base": {
        "VOL ambos": lambda s, c: s["src"] == "VOL",
        "VOL largo": lambda s, c: s["src"] == "VOL" and L(s, c),
        "VOL corto": lambda s, c: s["src"] == "VOL" and S(s, c),
        "CYC largo": lambda s, c: s["src"] == "CYC_L",
        "CYC corto": lambda s, c: s["src"] == "CYC_S",
    },
    "filtros": {
        # filtros que vienen de los propios indicadores (ciclos de tiempo / volatilidad)
        "VOL L · fase dinero entra (<0,5)": lambda s, c: s["src"] == "VOL" and L(s, c) and c["phase"] < 0.5,
        "VOL L · fase dinero sale (≥0,5)": lambda s, c: s["src"] == "VOL" and L(s, c) and c["phase"] >= 0.5,
        "VOL L · ventana pivote −10%…+35%": lambda s, c: s["src"] == "VOL" and L(s, c) and -0.1 <= c["reldist"] <= 0.35,
        "VOL L · ritmo fiable (≥60%)": lambda s, c: s["src"] == "VOL" and L(s, c) and c["hit"] >= 0.6,
        "VOL L · Hurst >0,5": lambda s, c: s["src"] == "VOL" and L(s, c) and c["hurst"] > 0.5,
        "VOL L · Hurst ≤0,5": lambda s, c: s["src"] == "VOL" and L(s, c) and not (c["hurst"] > 0.5),
        "VOL L · ciclo de vol. subiendo": lambda s, c: s["src"] == "VOL" and L(s, c) and c["vcyc_up"],
        "VOL L · ciclo de vol. <50": lambda s, c: s["src"] == "VOL" and L(s, c) and c["vcyc"] < 50,
        "VOL L · momentum ≥2/3": lambda s, c: s["src"] == "VOL" and L(s, c) and c["mom"] >= 2,
        "VOL L · EMA20>EMA50": lambda s, c: s["src"] == "VOL" and L(s, c) and c["e20_50"],
        "VOL L · precio>EMA200": lambda s, c: s["src"] == "VOL" and L(s, c) and c["up200"],
        "VOL S · precio<EMA200": lambda s, c: s["src"] == "VOL" and S(s, c) and not c["up200"],
        "VOL S · fase dinero sale": lambda s, c: s["src"] == "VOL" and S(s, c) and c["phase"] >= 0.5,
        "VOL S · EMA20<EMA50": lambda s, c: s["src"] == "VOL" and S(s, c) and not c["e20_50"],
        "CYC L · compresión reciente": lambda s, c: s["src"] == "CYC_L" and c["comp_age"] <= max(10, 0.5 * c["len"]),
        "CYC L · precio>EMA200": lambda s, c: s["src"] == "CYC_L" and c["up200"],
        "CYC L · momentum ≥2/3": lambda s, c: s["src"] == "CYC_L" and c["mom"] >= 2,
    },
}
VL = lambda s, c: s["src"] == "VOL" and s["dir"] > 0
CL = lambda s, c: s["src"] == "CYC_L"
M2 = lambda c: c["mom"] >= 2
H5 = lambda c: c["hurst"] > 0.5
GROUPS["final"] = {
    "A VOL L (base)": lambda s, c: VL(s, c),
    "B VOL L + momentum≥2": lambda s, c: VL(s, c) and M2(c),
    "C VOL L + Hurst>0,5": lambda s, c: VL(s, c) and H5(c),
    "D VOL L + momentum≥2 + Hurst>0,5": lambda s, c: VL(s, c) and M2(c) and H5(c),
    "E VOL L + precio>EMA200": lambda s, c: VL(s, c) and c["up200"],
    "F CYC L + momentum≥2": lambda s, c: CL(s, c) and M2(c),
    "G fusión: (B) o (F)": lambda s, c: (VL(s, c) or CL(s, c)) and M2(c),
    "H fusión: (D) o (F+Hurst)": lambda s, c: (VL(s, c) or CL(s, c)) and M2(c) and H5(c),
}
FINAL_EXITS = {k: EXITS[k] for k in ("3R+BE", "EMA20", "EMA50")}
EM = lambda s, c: VL(s, c) and c["up200"]
def parent_phase(c):
    """Fase del nivel superior al dominante (si existe)."""
    p = c["dom"] - 1
    return c["lv_phase"][p] if p >= 0 and len(c["lv_phase"]) > p else float("nan")
GROUPS["gestion"] = {
    "E base (VOL L + EMA200)": EM,
    "E ∩ momentum≥2": lambda s, c: EM(s, c) and M2(c),
    "E + padre en 1ª mitad (<0,5)": lambda s, c: EM(s, c) and parent_phase(c) < 0.5,
    "E + padre en 2ª mitad (≥0,5)": lambda s, c: EM(s, c) and parent_phase(c) >= 0.5,
    "E + alguna ventana de pivote activa": lambda s, c: EM(s, c) and any(c["lv_inwin"]),
    "E + sin ventana activa": lambda s, c: EM(s, c) and not any(c["lv_inwin"]),
    "E + dominante fiable (≥55%)": lambda s, c: EM(s, c) and c["hit"] >= 0.55,
}
GESTION_EXITS = {
    "EMA50": EXITS["EMA50"],
    "EMA50→EMA20 tras pico vol": dict(target_R=None, time_bars=180, ema="ema50", ema_fast="ema20", peak=True),
    "EMA50 + salida en techo típico": dict(target_R=None, time_bars=180, ema="ema50", top_exit=1.0),
}


def main():
    btc_dir, tf, group = sys.argv[1], sys.argv[2], sys.argv[3]
    d, f, snaps, start = build(btc_dir, tf)
    sigs = context(d, f, snaps, start)
    variants = GROUPS[group] if group in GROUPS else {}
    exits = GESTION_EXITS if group == "gestion" else (EXITS if group != "final" else FINAL_EXITS)
    results = {}
    for vname, flt in variants.items():
        for ename, ecfg in exits.items():
            tr, mi, mo = run_variant(d, f, sigs, flt, ecfg)
            results[f"{vname}|{ename}"] = dict(IS=mi, OOS=mo)
            print(f"{vname:34s} {ename:6s} IS  {fmt(mi)}")
            print(f"{'':34s} {'':6s} OOS {fmt(mo)}")
    Path(f"res_{tf}_{group}.json").write_text(json.dumps(results, indent=1, default=float))


if __name__ == "__main__":
    main()
