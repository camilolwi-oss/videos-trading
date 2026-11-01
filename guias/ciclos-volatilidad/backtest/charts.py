"""Gráficos del informe: curva de capital frente a BTC y R por operación.

Uso: python charts.py <out_dir> <tf>
"""
import csv
import datetime as dt
import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.dates as mdates  # noqa: E402
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402

INK, MUTED, GRID = "#1F2328", "#6E7781", "#D8DEE4"
C_SYS, C_SYS2, C_BTC, C_WIN, C_LOSS = "#1F6FEB", "#8250DF", "#9A6700", "#1A7F37", "#CF222E"

out, tf = Path(sys.argv[1]), sys.argv[2]
t, c, eq1, eq2 = np.load(out / f"equity_{tf}.npy")
dates = [dt.datetime.fromtimestamp(int(x), dt.UTC) for x in t]
i0 = int(np.searchsorted(t, dt.datetime(2017, 1, 1, tzinfo=dt.UTC).timestamp()))
dates, c, eq1, eq2 = dates[i0:], c[i0:], eq1[i0:] / eq1[i0], eq2[i0:] / eq2[i0]

plt.rcParams.update({"font.size": 10, "axes.edgecolor": GRID, "axes.labelcolor": MUTED, "xtick.color": MUTED,
                     "ytick.color": MUTED, "axes.spines.top": False, "axes.spines.right": False})
fig, (a1, a2) = plt.subplots(2, 1, figsize=(11, 7), height_ratios=[3, 2], sharex=True)
a1.plot(dates, eq1, color=C_SYS, lw=1.8, label="Sistema · riesgo 1 % por operación")
a1.plot(dates, eq2, color=C_SYS2, lw=1.4, label="Sistema · riesgo 2 % por operación")
a1.axvline(dt.datetime(2022, 1, 1), color=MUTED, lw=0.8, ls="--")
a1.text(dt.datetime(2022, 2, 1), a1.get_ylim()[1] * 0.97, "fuera de muestra →", color=MUTED, va="top", fontsize=9)
a1.set_ylabel("Capital (×)")
a1.grid(axis="y", color=GRID, lw=0.6)
a1.legend(frameon=False, loc="upper left")
a1.set_title(f"BTC {tf} · ruptura de volatilidad + EMA200 + momentum · salida EMA100 · walk-forward 2017–2026",
             color=INK, loc="left", fontsize=11)
a2.plot(dates, c, color=C_BTC, lw=1.0)
a2.set_yscale("log")
a2.set_ylabel("BTC (USD, log)")
a2.grid(axis="y", color=GRID, lw=0.6)
trs = list(csv.DictReader(open(out / f"operaciones_{tf}.csv")))
for x in trs:
    d0 = dt.datetime.strptime(x["fecha_señal"], "%Y-%m-%d %H:%M").replace(tzinfo=dt.UTC)
    a2.axvline(d0, color=C_WIN if float(x["salida_R"]) > 0 else C_LOSS, lw=0.6, alpha=0.6)
a2.xaxis.set_major_locator(mdates.YearLocator())
a2.xaxis.set_major_formatter(mdates.DateFormatter("%Y"))
fig.tight_layout()
fig.savefig(out / f"curva_{tf}.png", dpi=130)

fig, ax = plt.subplots(figsize=(11, 3.2))
R = np.array([float(x["salida_R"]) for x in trs])
ax.bar(range(len(R)), R, color=[C_WIN if r > 0 else C_LOSS for r in R], width=0.8)
ax.axhline(0, color=INK, lw=0.6)
ax.set_ylabel("R por operación")
ax.set_xlabel("Operaciones en orden cronológico")
ax.grid(axis="y", color=GRID, lw=0.6)
ax.set_title(f"{len(R)} operaciones · {(R > 0).mean() * 100:.0f}% ganadoras · media {R.mean():+.2f}R · las pérdidas se cortan en ~−1R",
             color=INK, loc="left", fontsize=11)
fig.tight_layout()
fig.savefig(out / f"operaciones_{tf}.png", dpi=130)
print("ok")
