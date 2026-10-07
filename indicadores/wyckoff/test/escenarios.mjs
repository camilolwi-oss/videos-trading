// Velas sintéticas que reproducen los esquemas ideales del libro (no son mercado real).
// Cada escenario se define con anclas [índice, precio] y multiplicadores de volumen por vela.

// PRNG determinista (mulberry32) para que las pruebas sean reproducibles.
const rng = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const pathAt = (anchors, i) => {
  for (let k = 0; k < anchors.length - 1; k++) {
    const [i0, p0] = anchors[k];
    const [i1, p1] = anchors[k + 1];
    if (i >= i0 && i <= i1) return p0 + ((p1 - p0) * (i - i0)) / (i1 - i0);
  }
  return anchors[anchors.length - 1][1];
};

// volume: [[desde, hasta, mult]] tramos base + spikes {índice: mult}
export const buildBars = ({anchors, volume = [], spikes = {}, wicks = {}, seed = 1, noise = 0.25, wick = 0.35, base = 1000, t0 = Date.UTC(2025, 0, 1), step = 3600e3}) => {
  const rand = rng(seed);
  const n = anchors[anchors.length - 1][0] + 1;
  const anchorSet = new Set(anchors.map(([i]) => i));
  const bars = [];
  let prev = pathAt(anchors, 0);
  for (let i = 0; i < n; i++) {
    const j = anchorSet.has(i) ? 0.1 : 1;
    const c = pathAt(anchors, i) + (rand() - 0.5) * 2 * noise * j;
    const o = prev;
    let h = Math.max(o, c) + rand() * wick;
    let l = Math.min(o, c) - rand() * wick;
    if (wicks[i]) {
      if (wicks[i].low !== undefined) l = Math.min(l, wicks[i].low);
      if (wicks[i].high !== undefined) h = Math.max(h, wicks[i].high);
    }
    let m = 1;
    for (const [a, b, k] of volume) if (i >= a && i <= b) m = k;
    if (spikes[i] !== undefined) m = spikes[i];
    const v = base * m * (0.85 + rand() * 0.3);
    bars.push({openTime: t0 + i * step, closeTime: t0 + (i + 1) * step - 1, open: o, high: h, low: l, close: c, volume: v});
    prev = c;
  }
  return bars;
};

// Acumulación #1 (con Spring) seguida de tendencia alcista.
export const acumulacion1 = () => buildBars({
  seed: 11,
  anchors: [
    [0, 150], [30, 132], [36, 136], [60, 112], [66, 116], // tendencia bajista con PS potenciales
    [72, 104], [76, 107], [80, 96],                    // PS (rebote con volumen) y SC
    [88, 108],                                         // AR
    [96, 97.6],                                        // ST
    [101, 104], [104, 100], [108, 109.3], [109, 105], // UA (Fase B joven)
    [113, 99], [116, 95.7], [117, 99.5],               // ST as SOW
    [122, 105], [128, 100], [134, 106], [140, 101], [146, 104], [150, 99],
    [153, 94.6], [154, 98.2],                          // Spring
    [158, 101], [161, 97.4],                           // Test
    [166, 103], [169, 100.5], [176, 112],              // LPS y SOS/JAC
    [181, 108.6],                                      // BU/BUEC
    [192, 118], [196, 116], [215, 132],                // Fase E
  ],
  volume: [[0, 69, 1], [70, 79, 1.3], [81, 88, 1.2], [89, 152, 0.75], [155, 168, 0.8], [169, 176, 1.6], [177, 181, 0.6], [182, 215, 1.3]],
  spikes: {72: 1.9, 79: 2.6, 80: 3.6, 81: 2.4, 96: 0.6, 108: 0.9, 116: 1.0, 153: 1.5, 154: 1.2, 161: 0.5, 174: 2.0, 175: 1.8, 176: 1.7, 181: 0.5},
});

// Distribución #1 (con UTAD) seguida de tendencia bajista.
export const distribucion1 = () => buildBars({
  seed: 23,
  anchors: [
    [0, 100], [30, 118], [36, 114], [60, 138], [66, 134], // tendencia alcista
    [72, 146], [76, 143], [80, 154],                      // PSY y BC
    [88, 142],                                            // AR
    [96, 152.4],                                          // ST
    [101, 146], [104, 150], [108, 140.7], [109, 145],     // mSOW (Fase B joven)
    [113, 151], [116, 155.4], [117, 151],                 // UT
    [122, 145], [128, 150], [134, 144], [140, 149], [146, 146], [150, 151],
    [153, 156.2], [154, 151.5],                           // UTAD
    [158, 148], [161, 152.6],                             // Test del UTAD
    [166, 147], [169, 149.5], [176, 138],                 // LPSY y MSOW
    [181, 141.4],                                         // LPSY (back up al ICE)
    [192, 132], [196, 134], [215, 118],                   // Fase E
  ],
  volume: [[0, 69, 1], [70, 79, 1.3], [81, 88, 1.2], [89, 152, 1.0], [155, 168, 1.0], [169, 176, 1.7], [177, 181, 0.7], [182, 215, 1.4]],
  spikes: {72: 1.9, 79: 2.6, 80: 3.6, 81: 2.4, 96: 0.7, 108: 1.1, 116: 1.2, 153: 1.8, 154: 1.4, 161: 0.6, 174: 2.1, 175: 1.9, 176: 1.8, 181: 0.6},
});

// Acumulación #2 (sin Spring: el test de la Fase C es un LPS) seguida de tendencia alcista.
export const acumulacion2 = () => buildBars({
  seed: 37,
  anchors: [
    [0, 150], [30, 132], [36, 136], [60, 112], [66, 116],
    [72, 104], [76, 107], [80, 96],
    [88, 108],
    [96, 97.6],
    [104, 104], [110, 99], [118, 106], [126, 100], [134, 105], [142, 100.5],
    [150, 104], [156, 99.8],                           // LPS de Fase C (no llega al mínimo)
    [162, 104], [166, 102], [173, 111.5],              // SOS/JAC
    [178, 108.4],                                      // BUEC
    [190, 117], [194, 115], [212, 130],
  ],
  volume: [[0, 69, 1], [70, 79, 1.3], [81, 88, 1.2], [89, 160, 0.75], [161, 173, 1.6], [174, 178, 0.6], [179, 212, 1.3]],
  spikes: {72: 1.9, 79: 2.6, 80: 3.6, 81: 2.4, 96: 0.6, 156: 0.5, 171: 2.0, 172: 1.9, 173: 1.8, 178: 0.5},
});

// Tendencia bajista sin estructura: no debe detectarse ningún rango completo.
export const tendenciaLimpia = () => buildBars({
  seed: 5,
  anchors: [[0, 150], [40, 130], [46, 133], [90, 108], [96, 111], [140, 88], [146, 91], [190, 70]],
  volume: [[0, 190, 1]],
});

export const escenarios = {acumulacion1, distribucion1, acumulacion2, tendenciaLimpia};
