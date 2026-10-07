// Ejecuta el indicador con PineTS sobre los escenarios sintéticos y verifica la secuencia de eventos.
// Uso: npm test   (desde indicadores/wyckoff)
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
import {PineTS} from 'pinets';
import {escenarios} from './escenarios.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, '..', 'wyckoff-estructuras.pine'), 'utf8');

// Lo que el libro espera ver en cada esquema, en orden.
const esperado = {
  acumulacion1: {tipo: 'Acumulación', eventos: ['PS', 'SC', 'AR', 'ST', 'UA', 'ST as SOW', /^Spring/, 'Test', 'SOS/JAC', 'BU/BUEC', 'Fase E']},
  distribucion1: {tipo: 'Distribución', eventos: ['PSY', 'BC', 'AR', 'ST', 'mSOW', 'UT', 'UTAD', 'Test', 'MSOW', 'LPSY', 'Fase E']},
  acumulacion2: {tipo: 'Acumulación', eventos: ['PS', 'SC', 'AR', 'ST', 'LPS', 'SOS/JAC', 'BU/BUEC', 'Fase E']},
  tendenciaLimpia: {tipo: null, eventos: []},
};

const last = (plot) => plot.data[plot.data.length - 1].value;
const verbose = process.argv.includes('-v');
let fallos = 0;

for (const [nombre, gen] of Object.entries(escenarios)) {
  const bars = gen();
  const ctx = await new PineTS(bars).run(source);
  const labels = last(ctx.plots.__labels__).filter((l) => !l._deleted);
  const boxes = last(ctx.plots.__boxes__).filter((b) => !b._deleted);
  const eventos = labels
    .filter((l) => !/^Fase [A-D]$/.test(l.text) && !l.text.startsWith('Objetivo'))
    .sort((a, b) => a.x - b.x || a.id - b.id);
  const textos = eventos.map((l) => l.text);
  const exp = esperado[nombre];

  // Comprueba que los eventos esperados aparecen como subsecuencia ordenada.
  let k = 0;
  for (const t of textos) {
    const e = exp.eventos[k];
    if (e && (e instanceof RegExp ? e.test(t) : e === t)) k++;
  }
  const okEventos = k === exp.eventos.length && (exp.eventos.length > 0 || textos.length === 0);
  const tipos = boxes.map((b) => b.text);
  const okTipo = exp.tipo === null ? boxes.length === 0 : tipos.includes(exp.tipo);
  const ok = okEventos && okTipo;
  if (!ok) fallos++;

  console.log(`${ok ? '✓' : '✗'} ${nombre}: ${bars.length} velas · cajas [${tipos.join(', ')}]`);
  console.log(`   eventos: ${eventos.map((l) => `${l.text}@${l.x}`).join('  ')}`);
  if (!okEventos) console.log(`   esperado (en orden): ${exp.eventos.map(String).join(' → ')}  — coincidieron ${k}`);
  if (verbose) {
    const fases = labels.filter((l) => /^Fase /.test(l.text)).map((l) => `${l.text}@${l.x}`);
    console.log(`   fases: ${fases.join('  ')}`);
    const tbl = last(ctx.plots.__tables__)[0];
    if (tbl) console.log('   tabla: ' + tbl.cells.map((r) => r.map((c) => c.text).join(' = ')).join(' | '));
  }
}

console.log(fallos ? `\n${fallos} escenario(s) fallaron` : '\nTodos los escenarios pasan');
process.exit(fallos ? 1 : 0);
