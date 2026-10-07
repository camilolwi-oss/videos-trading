// Demo: Vela (gráfico de LuxAlgo) + vela-pinets (motor Pine) ejecutando el indicador Wyckoff.
//
//   ?symbol=ETHUSDT&tf=60          velas en vivo de Binance (por defecto BTCUSDT, 4h)
//   ?datos=acumulacion1            esquemas sintéticos del libro: acumulacion1 | distribucion1 | acumulacion2
//   ?json=/mis-velas.json&tf=240   velas propias: [{time|openTime, open, high, low, close, volume}]
//   &desde=2025-02-01&hasta=2025-05-15   ventana visible inicial
import {VelaWorkspace} from '@luxalgo/vela/workspace';
import {BinanceProvider} from '@luxalgo/vela/providers/binance';
import {PineWorkerEngine} from '@luxalgo/vela-pinets';
import script from '../wyckoff-estructuras.pine?raw';
import {escenarios} from '../test/escenarios.mjs';

const params = new URLSearchParams(location.search);
const toVela = (b) => ({time: b.time ?? b.openTime, open: +b.open, high: +b.high, low: +b.low, close: +b.close, volume: +(b.volume ?? 0)});

const options = {
  layout: false,
  theme: 'dark',
  timeframe: params.get('tf') ?? '240',
  persist: false,
  engines: {pine: () => new PineWorkerEngine()},
  indicators: [{name: 'Wyckoff Estructuras', enabled: true, script}],
};

const datos = params.get('datos');
const json = params.get('json');
if (datos && escenarios[datos]) {
  options.data = escenarios[datos]().map(toVela);
  options.timeframe = params.get('tf') ?? '60';
} else if (json) {
  const raw = await (await fetch(json)).json();
  options.data = raw.map(toVela);
} else {
  options.symbol = params.get('symbol') ?? 'BTCUSDT';
  options.bars = Number(params.get('bars') ?? 3000);
  options.live = true;
  options.providers = {binance: () => new BinanceProvider()};
}

if (params.get('desde')) {
  options.visibleRange = {from: Date.parse(params.get('desde')), to: params.get('hasta') ? Date.parse(params.get('hasta')) : Date.now()};
}

window.wyckoffChart = new VelaWorkspace('#chart', options);
