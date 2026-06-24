/**
 * Emite data-import/raw/classify-input.json: une cada producto del seed con su
 * fila original del CSV, para que los agentes revisores puedan comparar
 * "lo que dijo el cliente" vs "lo que asignó nuestro mapeo".
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const RAW = resolve(ROOT, 'data-import/raw');

function parseCsv(file) {
  const txt = readFileSync(file, 'utf-8').replace(/\r/g, '');
  const [head, ...lines] = txt.split('\n').filter((l) => l.trim().length);
  const cols = head.split(',');
  return lines.map((l) => {
    const cells = l.split(',');
    const o = {};
    cols.forEach((c, i) => (o[c.trim()] = (cells[i] ?? '').trim()));
    return o;
  });
}

const csvByCode = new Map();
for (const f of ['catalogo1.csv', 'catalogo2.csv', 'catalogo3.csv']) {
  for (const row of parseCsv(resolve(RAW, f))) {
    if (row.codigo && !csvByCode.has(row.codigo)) csvByCode.set(row.codigo, { ...row, _fuente: f });
  }
}

const seed = JSON.parse(readFileSync(resolve(ROOT, 'src/data/catalog.seed.json'), 'utf-8'));
const out = seed.map((p) => {
  const csv = csvByCode.get(p.codigo) || {};
  return {
    codigo: p.codigo,
    nombre: p.nombre,
    csv_categoria: csv.categoria || '',
    csv_ambiente: csv.ambiente || '',
    asignado_categoria: p.categoria,
    asignado_ambiente: p.ambientes[0] || '',
    medidas_mm: csv.medidas_mm || '',
    medidas_cm: p.medidas || '',
  };
});

writeFileSync(resolve(RAW, 'classify-input.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`[classify-input] ${out.length} productos escritos.`);
