"""Descarga velas BTCUSD de Bitstamp (API pública) y las guarda en CSV.

Uso: python -I descargar_btc.py <4h|1d> <salida.csv> [desde AAAA-MM-DD]
Formato de salida: time,open,high,low,close,volume (time = segundos UTC de apertura).
Es la misma fuente que se usó para el backtest (datos/btc_4h.csv y datos/btc_1d.csv).
"""
import calendar
import csv
import json
import sys
import time
import urllib.request

STEP = {"4h": 14400, "1d": 86400}
URL = "https://www.bitstamp.net/api/v2/ohlc/btcusd/?step={step}&limit=1000&start={start}"


def main():
    tf, out = sys.argv[1], sys.argv[2]
    since = sys.argv[3] if len(sys.argv) > 3 else "2014-01-01"
    step = STEP[tf]
    start = calendar.timegm(time.strptime(since, "%Y-%m-%d"))
    rows = {}
    while start < time.time():
        with urllib.request.urlopen(URL.format(step=step, start=start), timeout=30) as r:
            data = json.load(r)["data"]["ohlc"]
        if not data:
            break
        for k in data:
            rows[int(k["timestamp"])] = [k["open"], k["high"], k["low"], k["close"], k["volume"]]
        last = max(int(k["timestamp"]) for k in data)
        if last + step <= start:
            break
        start = last + step
        time.sleep(0.3)
    now = time.time()
    with open(out, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["time", "open", "high", "low", "close", "volume"])
        for t in sorted(rows):
            if t + step <= now:  # solo velas cerradas
                w.writerow([t] + rows[t])
    print(f"{len(rows)} velas → {out}")


if __name__ == "__main__":
    main()
