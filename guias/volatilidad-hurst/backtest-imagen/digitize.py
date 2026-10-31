"""Digitaliza las capturas de TradingView (precio + oscilador 'volamonk').

Salida por gráfico: CSV por barra con high/low/mid aproximados, línea irregular
(vol), línea suave (cyc), banda (P violeta / B azul / -) y anotaciones amarillas.
Uso: python -I digitize.py <img_dir> <out_dir>
"""
import csv
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

CHARTS = {
    "btc_4h": dict(
        file="btc_4h.jpg", bar_days=4 / 24,
        # eje X: x = x_sep1 + días_desde_1sep * px_dia
        x_sep1=427.0, px_day=15.75,
        # eje Y precio: price = p_ref - (y - y_ref) / px_usd
        p_ref=90000.0, y_ref=66.0, px_usd=646.0 / 28000.0,
        price_y=(70, 745), x_data=(12, 1363),
        # posición real de las líneas en la última columna (y en píxeles)
        last_vol_y=780.5, last_cyc_y=790.5,
    ),
    "btc_30m": dict(
        file="btc_30m.jpg", bar_days=0.5 / 24,
        x_sep1=573.0, px_day=98.2,
        p_ref=82800.0, y_ref=87.0, px_usd=600.0 / 6800.0,
        price_y=(70, 748), x_data=(12, 1748),
        last_vol_y=828.5, last_cyc_y=825.8,
    ),
}
# Panel del oscilador (idéntico en ambas capturas): 0 → y853, 0.8875 px por unidad.
OSC_Y0, OSC_PX = 853.0, 0.8875
OSC_RANGE = (753, 862)
BAND_P = np.array([84, 27, 95])
BAND_B = np.array([27, 80, 125])


def osc_val(y):
    return (OSC_Y0 - y) / OSC_PX


def osc_y(v):
    return OSC_Y0 - v * OSC_PX


def runs_of(mask, y0, gap=1):
    out, cur = [], None
    for i, m in enumerate(mask):
        if not m:
            continue
        y = y0 + i
        if cur and y - cur[1] <= gap + 1:
            cur[1] = y
        else:
            cur = [y, y]
            out.append(cur)
    return out


def is_yellow(p):
    return p[0] > 140 and p[1] > 120 and p[2] < p[0] - 40


def digitize(name, cfg, img_dir):
    im = np.array(Image.open(img_dir / cfg["file"])).astype(int)
    x_from, x_to = cfg["x_data"]
    cols = []
    # ---------- oscilador: candidatos por columna ----------
    for x in range(x_from, x_to + 1):
        col = im[OSC_RANGE[0]:OSC_RANGE[1], x]
        dP = np.abs(col - BAND_P).sum(axis=1)
        dB = np.abs(col - BAND_B).sum(axis=1)
        # relleno de banda: tonos violeta/azul apagados (el sombreado varía entre capturas)
        dimP = (col[:, 0] > col[:, 1] + 15) & (col[:, 2] > col[:, 1] + 15) & (col.max(axis=1) < 135) & (col.min(axis=1) < 70)
        dimB = (col[:, 2] > col[:, 0] + 30) & (col.max(axis=1) < 150) & (col.min(axis=1) < 70)
        bandP = ((dP < 40) | dimP).mean()
        bandB = ((dB < 40) | dimB).mean()
        band = "P" if bandP > 0.5 else "B" if bandB > 0.5 else "-"
        line = []
        for i, p in enumerate(col):
            y = OSC_RANGE[0] + i
            if p.max() < 55 or dP[i] < 40 or dB[i] < 40 or dimP[i] or dimB[i] or is_yellow(p):
                line.append(False)
                continue
            # línea punteada naranja del nivel 50 (incluye sus píxeles oscuros de antialias)
            orange = p[0] > p[1] + 15 and p[0] > p[2] + 35
            if orange and 805 <= y <= 811:
                line.append(False)
                continue
            line.append(True)
        rr = runs_of(line, OSC_RANGE[0], gap=0)
        info = []
        for a, b in rr:
            seg = col[a - OSC_RANGE[0]:b - OSC_RANGE[0] + 1]
            gray = float(np.mean(seg.max(axis=1) - seg.min(axis=1))) < 22 and float(seg.min(axis=1).max()) >= 118
            info.append(dict(a=a, b=b, c=(a + b) / 2, gray=gray))
        cols.append(dict(x=x, band=band, runs=info))

    # ---------- línea suave: camino global más suave (programación dinámica) ----------
    # Candidatos: tramos grises de núcleo brillante (≤ 5 px). Coste de una transición:
    # saltos de columnas + cambio de pendiente (la suave casi no curva; la irregular sí).
    T = len(cols)
    cands = [[r for r in c["runs"] if r["gray"] and (r["b"] - r["a"]) <= 7] for c in cols]
    G, SKIP, WE, TOL, WS = 45, 1.5, 2.0, 1.2, 60.0
    best = [[None] * len(cands[t]) for t in range(T)]  # (coste, t_prev, i_prev, pendiente suavizada)
    for t in range(T):
        for i, r in enumerate(cands[t]):
            bc = (t * SKIP, -1, -1, 0.0)  # empezar aquí: saltar las columnas anteriores
            for g in range(1, min(G, t) + 1):
                tp = t - g
                for ip, rp in enumerate(cands[tp]):
                    prv = best[tp][ip]
                    if prv is None:
                        continue
                    sl = (r["c"] - rp["c"]) / g
                    err = abs(r["c"] - (rp["c"] + prv[3] * g))
                    cost = (prv[0] + SKIP * (g - 1) + WE * max(0.0, err - TOL) ** 2
                            + WS * max(0.0, abs(sl) - 0.9) ** 2)
                    if cost < bc[0]:
                        bc = (cost, tp, ip, 0.75 * prv[3] + 0.25 * sl)
            best[t][i] = bc
    end = None
    for t in range(T):
        for i in range(len(cands[t])):
            tot = best[t][i][0] + (T - 1 - t) * SKIP
            if end is None or tot < end[0]:
                end = (tot, t, i)
    path = {}
    t, i = end[1], end[2]
    while t >= 0 and i >= 0:
        path[t] = cands[t][i]
        _, tp, ip, _ = best[t][i]
        t, i = tp, ip
    # extender la ruta hacia los extremos siguiendo el candidato más cercano
    known = sorted(path)
    for direction in (-1, 1):
        t = known[0] if direction == -1 else known[-1]
        y = path[t]["c"]
        while 0 <= t + direction < T:
            t += direction
            near = [r for r in cands[t] if abs(r["c"] - y) <= 2.0]
            if not near:
                continue
            r = min(near, key=lambda q: abs(q["c"] - y))
            path[t] = r
            y = r["c"]
    known = sorted(path)
    for t, c in enumerate(cols):
        if t in path:
            c["cyc_y"], c["cyc_run"] = path[t]["c"], path[t]
        else:
            # interpolación lineal entre los puntos conocidos más cercanos
            lo = max([k for k in known if k < t], default=None)
            hi = min([k for k in known if k > t], default=None)
            if lo is None:
                y = path[hi]["c"]
            elif hi is None:
                y = path[lo]["c"]
            else:
                y = path[lo]["c"] + (path[hi]["c"] - path[lo]["c"]) * (t - lo) / (hi - lo)
            c["cyc_y"], c["cyc_run"] = y, None
    print("  suave: columnas con candidato", len(path), "de", T)

    # ---------- línea irregular = el resto ----------
    prev_v = cfg["last_vol_y"]
    for c in reversed(cols):
        rest = [r for r in c["runs"] if r is not c["cyc_run"]]
        if rest:
            # preferimos el tramo más cercano al valor anterior (continuidad), pero aceptamos saltos
            best = min(rest, key=lambda r: min(abs(r["a"] - prev_v), abs(r["b"] - prev_v)))
            # en un salto vertical el tramo cubre ambos extremos: tomamos el extremo hacia el valor previo
            if best["b"] - best["a"] > 6:
                y = best["a"] if abs(best["a"] - prev_v) < abs(best["b"] - prev_v) else best["b"]
            else:
                y = best["c"]
        else:
            y = c["cyc_y"]  # superpuesta con la suave
        c["vol_y"] = y
        prev_v = y

    # ---------- precio ----------
    y0, y1 = cfg["price_y"]
    pane = im[y0:y1, :]
    pmask = (pane.min(axis=2) >= 82) & ((pane.max(axis=2) - pane.min(axis=2)) <= 40)
    # quitar líneas horizontales largas (medición, cVAH/cVAL, niveles): tramos ≥ 60 px en una fila
    for yy in range(pmask.shape[0]):
        row = pmask[yy]
        xx = 0
        while xx < row.size:
            if row[xx]:
                x2 = xx
                while x2 + 1 < row.size and row[x2 + 1]:
                    x2 += 1
                if x2 - xx + 1 >= 60:
                    row[xx:x2 + 1] = False
                xx = x2 + 1
            else:
                xx += 1
    for c in cols:
        x = c["x"]
        mask = pmask[:, x].copy()
        # ignorar la tabla de Hurst y el texto de cabecera
        if x > 1485:
            mask[: max(0, 100 - y0)] = False
        if x < 200:
            mask[: max(0, 70 - y0)] = False
        c["pruns"] = [tuple(r) for r in runs_of(mask, y0, gap=0)]

    # ---------- agregación por barra ----------
    def price(y):
        return cfg["p_ref"] - (y - cfg["y_ref"]) / cfg["px_usd"]

    bars = {}
    for c in cols:
        d = (c["x"] - cfg["x_sep1"]) / cfg["px_day"]
        k = int(np.floor(d / cfg["bar_days"]))
        bars.setdefault(k, []).append(c)
    rows = []
    for k in sorted(bars):
        cs = bars[k]
        pr = [r for c in cs for r in c["pruns"]]
        if not pr:
            continue
        # vela = tramo más largo de la barra + tramos que se solapan o tocan (±2 px)
        a, b = max(pr, key=lambda r: r[1] - r[0])
        grown = True
        while grown:
            grown = False
            for ra, rb in pr:
                if ra <= b + 2 and rb >= a - 2 and (ra < a or rb > b):
                    a, b = min(a, ra), max(b, rb)
                    grown = True
        hi, lo = price(a), price(b)
        vol = osc_val(cs[-1]["vol_y"])
        cyc = osc_val(float(np.mean([c["cyc_y"] for c in cs])))
        bands = [c["band"] for c in cs]
        band = "P" if "P" in bands else "B" if "B" in bands else "-"
        rows.append(dict(k=k, day=round(k * cfg["bar_days"], 4), high=round(hi, 1), low=round(lo, 1),
                         mid=round((hi + lo) / 2, 1), vol=round(max(0.0, vol), 2), cyc=round(cyc, 2), band=band))

    # ---------- anotaciones amarillas (componentes conectados) ----------
    yel = np.zeros(im.shape[:2], bool)
    sub = im[60:870, 10:1750]
    yel[60:870, 10:1750] = (sub[:, :, 0] > 150) & (sub[:, :, 1] > 130) & (sub[:, :, 2] < sub[:, :, 0] - 50)
    seen = np.zeros_like(yel)
    comps = []
    H, W = yel.shape
    for y in range(60, 870):
        for x in range(10, 1750):
            if yel[y, x] and not seen[y, x]:
                stack, pts = [(y, x)], []
                seen[y, x] = True
                while stack:
                    cy, cx = stack.pop()
                    pts.append((cy, cx))
                    for dy in (-2, -1, 0, 1, 2):
                        for dx in (-2, -1, 0, 1, 2):
                            ny, nx = cy + dy, cx + dx
                            if 0 <= ny < H and 0 <= nx < W and yel[ny, nx] and not seen[ny, nx]:
                                seen[ny, nx] = True
                                stack.append((ny, nx))
                if len(pts) >= 25:
                    ys, xs = zip(*pts)
                    comps.append(dict(x0=min(xs), x1=max(xs), y0=min(ys), y1=max(ys), n=len(pts),
                                      xc=float(np.mean(xs)), yc=float(np.mean(ys))))
    ann = []
    for c in comps:
        pane = "osc" if c["yc"] > 750 else "price"
        d = (c["xc"] - cfg["x_sep1"]) / cfg["px_day"]
        ann.append(dict(pane=pane, day=round(d, 2), k=int(np.floor(d / cfg["bar_days"])),
                        w=c["x1"] - c["x0"], h=c["y1"] - c["y0"], n=c["n"],
                        value=round(price(c["yc"]), 0) if pane == "price" else round(osc_val(c["yc"]), 1)))
    return rows, ann


def main():
    img_dir, out_dir = Path(sys.argv[1]), Path(sys.argv[2])
    out_dir.mkdir(parents=True, exist_ok=True)
    for name, cfg in CHARTS.items():
        rows, ann = digitize(name, cfg, img_dir)
        with open(out_dir / f"{name}.csv", "w", newline="") as f:
            w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
            w.writeheader()
            w.writerows(rows)
        (out_dir / f"{name}_annotations.json").write_text(json.dumps(ann, indent=1))
        print(name, "barras:", len(rows), "· anotaciones:", len(ann),
              "· rango precio", min(r["low"] for r in rows), "–", max(r["high"] for r in rows))




def overlay(img_dir, out_dir):
    """Dibuja lo digitalizado sobre la captura para validarlo a ojo."""
    from PIL import ImageDraw
    for name, cfg in CHARTS.items():
        im = Image.open(img_dir / cfg["file"]).convert("RGB")
        d = ImageDraw.Draw(im)
        rows = list(csv.DictReader(open(out_dir / f"{name}.csv")))
        for r in rows:
            day = float(r["day"]) + cfg["bar_days"] / 2
            x = cfg["x_sep1"] + day * cfg["px_day"]
            yh = cfg["y_ref"] + (cfg["p_ref"] - float(r["high"])) * cfg["px_usd"]
            yl = cfg["y_ref"] + (cfg["p_ref"] - float(r["low"])) * cfg["px_usd"]
            d.line([(x, yh), (x, yl)], fill=(255, 60, 60), width=1)
            d.point((x, osc_y(float(r["cyc"]))), fill=(255, 0, 0))
            d.point((x, osc_y(float(r["vol"]))), fill=(0, 255, 0))
        im.save(out_dir / f"{name}_overlay.png")


if __name__ == "__main__":
    main()
    overlay(Path(sys.argv[1]), Path(sys.argv[2]))
