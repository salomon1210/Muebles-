/**
 * Genera src/data/catalog.seed.json a partir de los CSV del cliente
 * (data-import/raw/catalogo1..3.csv).
 *
 * - Normaliza la categoría del CSV a la taxonomía de la web.
 * - Normaliza el ambiente.
 * - Convierte medidas de mm a cm (maneja diámetros "D" y juegos "L+M+S").
 * - Deduplica por código (prioriza la fila que tenga medidas).
 * - Asigna imágenes si existe el archivo public/productos/catalogo/<codigo>.jpg
 *   (las que extraemos del catálogo principal); si no, deja un placeholder.
 *
 * Correr:  node scripts/build-catalog-from-csv.mjs
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const RAW = resolve(ROOT, 'data-import/raw');
const FOTOS_DIR = resolve(ROOT, 'public/productos/catalogo');
const OUT = resolve(ROOT, 'src/data/catalog.seed.json');

// ── Mapeos ──────────────────────────────────────────────────────────────────
const AMBIENTE_MAP = {
  living: 'living',
  comedor: 'comedor',
  dormitorio: 'dormitorio',
  estudio: 'estudio',
  decoracion: 'decoracion',
};

// categoría del CSV (en minúscula, sin tildes) → id de la web
const CAT_MAP = {
  'mesas de comedor': 'mesas-comedor',
  'mesas de centro': 'mesas-centro',
  'mesas auxiliares': 'mesas-auxiliares',
  'consolas': 'consolas',
  'aparadores': 'aparadores',
  'muebles de tv': 'muebles-tv',
  'sillas de comedor': 'sillas',
  'sillones': 'sillones',
  'sofas': 'sofas',
  'banquetas': 'banquetas',
  'bibliotecas': 'bibliotecas',
  'bar carts': 'bar-carts',
  'escritorios': 'escritorios',
  'floreros y macetas': 'decoracion',
  'piezas de autor': 'decoracion',
};

// Clasificación por nombre (para la "Linea Signature" y para afinar SF/CH).
function clasificarPorNombre(nombre) {
  const n = sinTildes(nombre.toLowerCase());
  if (/\bcama\b/.test(n)) return 'camas';
  if (/mesa de luz/.test(n)) return 'mesas-luz';
  if (/tocador/.test(n)) return 'tocadores';
  if (/escritorio/.test(n)) return 'escritorios';
  if (/banqueta|pouf/.test(n)) return 'banquetas';
  if (/vitrina|aparador/.test(n)) return 'aparadores';
  if (/consola/.test(n)) return 'consolas';
  if (/mesa de comedor/.test(n)) return 'mesas-comedor';
  if (/mesa de centro/.test(n)) return 'mesas-centro';
  if (/mesa auxiliar/.test(n)) return 'mesas-auxiliares';
  if (/mueble de tv/.test(n)) return 'muebles-tv';
  if (/biblioteca/.test(n)) return 'bibliotecas';
  if (/bar cart/.test(n)) return 'bar-carts';
  if (/silla/.test(n)) return 'sillas';
  if (/sillon/.test(n)) return 'sillones';
  if (/sofa/.test(n)) return 'sofas';
  if (/florero|maceta/.test(n)) return 'decoracion';
  return null;
}

function sinTildes(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function mapCategoria(csvCat, nombre) {
  const key = sinTildes((csvCat || '').toLowerCase().trim());
  if (key.includes('signature')) {
    return clasificarPorNombre(nombre) || 'decoracion';
  }
  let id = CAT_MAP[key];
  // Afinar: en "Sofas" hay poufs y sillones por nombre.
  if (id === 'sofas') {
    const porNombre = clasificarPorNombre(nombre);
    if (porNombre === 'banquetas' || porNombre === 'sillones') id = porNombre;
  }
  return id || clasificarPorNombre(nombre) || 'decoracion';
}

function mapAmbiente(csvAmb) {
  const key = sinTildes((csvAmb || '').toLowerCase().trim());
  return AMBIENTE_MAP[key] || 'living';
}

// ── Conversión de medidas mm → cm ─────────────────────────────────────────────
function medidasCm(raw) {
  let s = (raw || '').trim();
  if (!s) return '';
  let diam = false;
  if (/^d/i.test(s)) {
    diam = true;
    s = s.slice(1);
  }
  const partes = s.split(/[*xX]/).map((t) => t.trim()).filter(Boolean);
  if (!partes.length) return '';
  const conv = (tok) =>
    tok
      .split('/')
      .map((v) => {
        const n = parseFloat(v);
        if (isNaN(n)) return v.trim();
        const cm = n / 10;
        return Number.isInteger(cm) ? String(cm) : cm.toFixed(1);
      })
      .join('/');
  const nums = partes.map(conv);
  if (diam) {
    const [d, ...rest] = nums;
    return `Ø${d}${rest.length ? ' × ' + rest.join(' × ') : ''} cm`;
  }
  return nums.join(' × ') + ' cm';
}

// ── Descripción breve (genérica, sin inventar materiales) ─────────────────────
const NOMBRE_TIPO = {
  sofas: 'Sofá', sillones: 'Sillón', sillas: 'Silla', 'mesas-comedor': 'Mesa de comedor',
  'mesas-centro': 'Mesa de centro', 'mesas-auxiliares': 'Mesa auxiliar', consolas: 'Consola',
  aparadores: 'Aparador', 'muebles-tv': 'Mueble de TV', bibliotecas: 'Biblioteca',
  'bar-carts': 'Bar cart', banquetas: 'Banqueta', camas: 'Cama', 'mesas-luz': 'Mesa de luz',
  tocadores: 'Tocador', escritorios: 'Escritorio', decoracion: 'Pieza decorativa',
};
function descripcion(catId) {
  const t = NOMBRE_TIPO[catId] || 'Pieza';
  return `${t} de la Colección Milano Home, de líneas contemporáneas y terminación de alta gama. Consultanos disponibilidad y opciones de terminación.`;
}

// ── Lectura de CSV (simple, sin comillas complejas) ───────────────────────────
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

// ── Build ─────────────────────────────────────────────────────────────────────
const fotosDisponibles = existsSync(FOTOS_DIR)
  ? new Set(readdirSync(FOTOS_DIR).map((f) => f.replace(/\.(jpg|jpeg|png|webp)$/i, '')))
  : new Set();

const archivos = ['catalogo1.csv', 'catalogo2.csv', 'catalogo3.csv'];
const porCodigo = new Map();

for (const arch of archivos) {
  const path = resolve(RAW, arch);
  if (!existsSync(path)) continue;
  for (const row of parseCsv(path)) {
    const codigo = (row.codigo || '').trim();
    if (!codigo) continue;
    const nombre = (row.nombre || '').trim() || codigo;
    const catId = mapCategoria(row.categoria, nombre);
    const ambId = mapAmbiente(row.ambiente);
    const medidas = medidasCm(row.medidas_mm);

    const prev = porCodigo.get(codigo);
    if (prev) {
      // Si ya existe, completar medidas si faltaban.
      if (!prev.medidas && medidas) prev.medidas = medidas;
      continue;
    }
    porCodigo.set(codigo, {
      codigo,
      nombre,
      categoria: catId,
      ambientes: [ambId],
      medidas,
      materiales: '',
      descripcion: descripcion(catId),
      destacado: false,
      imagenes: [],
    });
  }
}

// Aplicar correcciones aprobadas por el circuito de agentes (si existen).
const OVERRIDES = resolve(ROOT, 'data-import/overrides.json');
let nOverrides = 0;
if (existsSync(OVERRIDES)) {
  const ov = JSON.parse(readFileSync(OVERRIDES, 'utf-8'));
  for (const [codigo, cambios] of Object.entries(ov)) {
    const p = porCodigo.get(codigo);
    if (!p) continue;
    if (cambios.categoria && cambios.categoria !== p.categoria) {
      p.categoria = cambios.categoria;
      p.descripcion = descripcion(cambios.categoria);
      nOverrides++;
    }
    if (cambios.ambiente && cambios.ambiente !== p.ambientes[0]) {
      p.ambientes = [cambios.ambiente];
      nOverrides++;
    }
  }
}

// Asignar imágenes extraídas del catálogo principal.
let conFoto = 0;
for (const p of porCodigo.values()) {
  if (fotosDisponibles.has(p.codigo)) {
    p.imagenes = [
      { url: `/productos/catalogo/${p.codigo}.jpg`, rol: 'principal', alt: p.nombre },
    ];
    conFoto++;
  }
}

const catalogo = [...porCodigo.values()].sort((a, b) => a.codigo.localeCompare(b.codigo));
writeFileSync(OUT, JSON.stringify(catalogo, null, 2) + '\n');

// Resumen
const porCat = {};
for (const p of catalogo) porCat[p.categoria] = (porCat[p.categoria] || 0) + 1;
console.log(`[seed] ${catalogo.length} productos · ${conFoto} con foto · ${nOverrides} correcciones aplicadas`);
console.log('[seed] por categoría:', porCat);
