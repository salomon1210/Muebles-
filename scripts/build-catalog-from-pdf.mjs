/**
 * Genera src/data/catalog.seed.json para el CATÁLOGO NUEVO (2026), fusionando:
 *  - OCR del Catálogo 2026 (código + sección) y del Innovative (código + nombre + medidas)
 *    → data-import/raw_new/ocr.json
 *  - Datos VIEJOS verificados (src/data/catalog.seed.OLD.json) para los códigos que se mantienen.
 *
 * Reglas de prioridad por campo:
 *  - categoría: sección del 2026 (mapeada) > dato viejo (si existe) > prefijo del código.
 *  - nombre:    dato viejo (si existe) > "{Tipo} {código}".
 *  - ambiente:  dato viejo (si existe) > mapa categoría→ambiente.
 *  - medidas:   Innovative (convertido) > dato viejo > "".
 *
 * Correr: node scripts/build-catalog-from-pdf.mjs
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OCR = resolve(ROOT, 'data-import/raw_new/ocr.json');
const OLD = resolve(ROOT, 'src/data/catalog.seed.OLD.json');
const FOTOS_DIR = resolve(ROOT, 'public/productos/catalogo');
const OUT = resolve(ROOT, 'src/data/catalog.seed.json');

// ── Normalización de código (saca combos de tamaño y espacios) ────────────────
function normCode(c) {
  c = (c || '').replace(/\s+/g, '');
  c = c.replace(/[LMS](\+[LMS])+/g, ''); // CT6709L+M+S -> CT6709
  return c;
}
const esJunk = (c) => !c || c === '?' || /^SERIE/i.test(c) || !/\d/.test(c);

// ── Mapas ─────────────────────────────────────────────────────────────────────
const SECTION_MAP = {
  'MESAS DE COMEDOR': 'mesas-comedor', APARADORES: 'aparadores', 'SILLAS DE COMEDOR': 'sillas',
  BIBLIOTECAS: 'bibliotecas', 'MESAS DE CENTRO': 'mesas-centro', 'MUEBLES DE TV': 'muebles-tv',
  ESPEJOS: 'espejos', SOFAS: 'sofas', ESCRITORIOS: 'escritorios', SILLONES: 'sillones',
  PORTAMACETAS: 'decoracion', 'CARROS BAR': 'bar-carts', CONSOLAS: 'consolas',
};
// Prefijo de código → categoría (fallback)
const PREFIX_MAP = {
  DT: 'mesas-comedor', CT: 'mesas-centro', RT: 'mesas-centro', WT: 'mesas-centro',
  ET: 'mesas-auxiliares', CN: 'consolas', EC: 'consolas', DB: 'aparadores',
  CJ: 'bibliotecas', TV: 'muebles-tv', MR: 'espejos', FS: 'decoracion', WC: 'bar-carts',
  DS: 'escritorios', MG: 'escritorios', BD: 'camas', NT: 'mesas-luz', CD: 'banquetas',
  SF: 'sofas', YG: 'decoracion',
};
const AMB_MAP = {
  'mesas-comedor': 'comedor', sillas: 'comedor', aparadores: 'comedor',
  sofas: 'living', sillones: 'living', 'mesas-centro': 'living', 'mesas-auxiliares': 'living',
  consolas: 'living', 'muebles-tv': 'living', bibliotecas: 'living', 'bar-carts': 'living',
  espejos: 'living', banquetas: 'dormitorio', camas: 'dormitorio', 'mesas-luz': 'dormitorio',
  tocadores: 'dormitorio', escritorios: 'estudio', decoracion: 'decoracion',
};
const NOMBRE_TIPO = {
  sofas: 'Sofá', sillones: 'Sillón', sillas: 'Silla', 'mesas-comedor': 'Mesa de comedor',
  'mesas-centro': 'Mesa de centro', 'mesas-auxiliares': 'Mesa auxiliar', consolas: 'Consola',
  aparadores: 'Aparador', 'muebles-tv': 'Mueble de TV', bibliotecas: 'Biblioteca',
  'bar-carts': 'Bar cart', banquetas: 'Banqueta', camas: 'Cama', 'mesas-luz': 'Mesa de luz',
  tocadores: 'Tocador', escritorios: 'Escritorio', decoracion: 'Pieza decorativa', espejos: 'Espejo',
};

// ── Conversión de medidas (mm → cm). Soporta x/*, D y ø (diámetro), 'mm', notas ──
function medidasCm(raw) {
  let s = (raw || '').trim();
  if (!s) return '';
  return s
    .split('\n')
    .map((linea) => convLinea(linea.trim()))
    .filter(Boolean)
    .join(' · ');
}
function convLinea(s) {
  if (!s) return '';
  s = s.replace(/mm/gi, '').trim();
  let prefijo = '';
  const diam = /[øØdD]/.test(s[0]);
  if (diam) { prefijo = 'Ø'; s = s.replace(/^[øØdD]\s*/, ''); }
  // separar texto-nota del bloque numérico
  const m = s.match(/^([\d.x×*\/øØ\s]+)(.*)$/);
  let nums = s, nota = '';
  if (m) { nums = m[1]; nota = m[2].trim(); }
  const partes = nums.split(/[x×*]/i).map((t) => t.trim()).filter(Boolean);
  const conv = (tok) =>
    tok.split('/').map((v) => {
      const n = parseFloat(v.replace(/[øØ]/g, ''));
      if (isNaN(n)) return '';
      const cm = n / 10;
      return Number.isInteger(cm) ? String(cm) : cm.toFixed(1);
    }).filter(Boolean).join('/');
  const out = partes.map(conv).filter(Boolean);
  if (!out.length) return nota;
  let txt = (prefijo ? 'Ø' : '') + out.join(' × ') + ' cm';
  if (nota) txt += ' ' + nota;
  return txt;
}

function categoriaDe(codigo, seccion, viejo) {
  const secId = SECTION_MAP[(seccion || '').toUpperCase().trim()];
  if (secId) return secId;
  if (viejo) return viejo.categoria;
  const pref = (codigo.match(/^[A-Za-z]+/) || [''])[0].toUpperCase();
  return PREFIX_MAP[pref] || 'decoracion';
}

// ── Carga de OCR ────────────────────────────────────────────────────────────
const ocr = JSON.parse(readFileSync(OCR, 'utf-8'));
const secByCode = new Map();
for (const pg of ocr.cat2026 || []) {
  for (const it of pg.productos) {
    const c = normCode(it.codigo);
    if (!esJunk(c) && !secByCode.has(c)) secByCode.set(c, it.seccion || '');
  }
}
const innovByCode = new Map();
for (const pg of ocr.innovative || []) {
  for (const it of pg.productos) {
    const c = normCode(it.codigo);
    if (!esJunk(c) && !innovByCode.has(c))
      innovByCode.set(c, { nombre: it.nombre || '', medidas: it.medidas || '' });
  }
}

// Datos viejos (verificados)
const oldByCode = new Map();
if (existsSync(OLD)) {
  for (const p of JSON.parse(readFileSync(OLD, 'utf-8'))) oldByCode.set(p.codigo, p);
}

// Fotos disponibles
const fotos = existsSync(FOTOS_DIR)
  ? new Set(readdirSync(FOTOS_DIR).map((f) => f.replace(/\.(jpg|jpeg|png|webp)$/i, '')))
  : new Set();

// Universo nuevo = unión de códigos del 2026 + Innovative
const universo = new Set([...secByCode.keys(), ...innovByCode.keys()]);

const catalogo = [];
let conMedidasInnov = 0;
for (const codigo of universo) {
  const viejo = oldByCode.get(codigo);
  const innov = innovByCode.get(codigo);
  const cat = categoriaDe(codigo, secByCode.get(codigo), viejo);
  const nombre = viejo?.nombre || `${NOMBRE_TIPO[cat] || 'Pieza'} ${codigo}`;
  const amb = viejo?.ambientes?.length ? viejo.ambientes : [AMB_MAP[cat] || 'living'];
  let medidas = '';
  if (innov?.medidas) { medidas = medidasCm(innov.medidas); if (medidas) conMedidasInnov++; }
  if (!medidas && viejo?.medidas) medidas = viejo.medidas;

  catalogo.push({
    codigo, nombre, categoria: cat, ambientes: amb, medidas,
    materiales: viejo?.materiales || '',
    descripcion: viejo?.descripcion || `${NOMBRE_TIPO[cat] || 'Pieza'} de la Colección Milano Home 2026, de líneas contemporáneas y terminación de alta gama.`,
    destacado: false,
    imagenes: fotos.has(codigo)
      ? [{ url: `/productos/catalogo/${codigo}.jpg`, rol: 'principal', alt: nombre }]
      : [],
  });
}
catalogo.sort((a, b) => a.codigo.localeCompare(b.codigo));
writeFileSync(OUT, JSON.stringify(catalogo, null, 2) + '\n');

const porCat = {};
for (const p of catalogo) porCat[p.categoria] = (porCat[p.categoria] || 0) + 1;
const conFoto = catalogo.filter((p) => p.imagenes.length).length;
console.log(`[seed-v2] ${catalogo.length} productos · ${conFoto} con foto · ${conMedidasInnov} con medidas del Innovative`);
console.log('[seed-v2] por categoría:', porCat);
