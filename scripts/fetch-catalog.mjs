/**
 * Genera src/data/catalog.generated.json — el catálogo PÚBLICO que consume la web.
 *
 * Estrategia (build-time, máxima seguridad):
 *  - Si hay credenciales de Supabase (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY),
 *    lee SOLO la vista `products_public` + `product_images` y escribe los campos
 *    públicos. Los datos privados (costos, fábrica) NUNCA se leen acá.
 *  - Si no hay credenciales (ej. desarrollo local antes de configurar Supabase),
 *    usa el catálogo de ejemplo src/data/catalog.seed.json.
 *
 * La service_role key se usa únicamente en este script de build (servidor), nunca
 * se envía al navegador. El resultado es un JSON estático sin ningún dato privado.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../src/data/catalog.generated.json');
const SEED = resolve(__dirname, '../src/data/catalog.seed.json');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function writeOut(data, fuente) {
  writeFileSync(OUT, JSON.stringify(data, null, 2) + '\n');
  console.log(`[catalog] ${data.length} producto(s) escritos desde ${fuente}.`);
}

function fromSeed(motivo) {
  const seed = JSON.parse(readFileSync(SEED, 'utf-8'));
  if (motivo) console.log(`[catalog] ${motivo}`);
  writeOut(seed, 'catalog.seed.json (ejemplo)');
}

async function fromSupabase() {
  // Import dinámico: la dependencia es opcional, así el build funciona sin ella.
  let createClient;
  try {
    ({ createClient } = await import('@supabase/supabase-js'));
  } catch {
    fromSeed('@supabase/supabase-js no instalado — uso el catálogo de ejemplo.');
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });

  // Solo la vista pública: jamás tocamos columnas privadas.
  const { data: prods, error: e1 } = await supabase
    .from('products_public')
    .select('*')
    .order('destacado', { ascending: false })
    .order('nombre', { ascending: true });
  if (e1) throw new Error(`Supabase products_public: ${e1.message}`);

  const { data: imgs, error: e2 } = await supabase
    .from('product_images')
    .select('product_codigo, url, rol, alt, orden')
    .order('orden', { ascending: true });
  if (e2) throw new Error(`Supabase product_images: ${e2.message}`);

  const imgsPorCodigo = new Map();
  for (const img of imgs ?? []) {
    const list = imgsPorCodigo.get(img.product_codigo) ?? [];
    list.push({ url: img.url, rol: img.rol ?? 'principal', alt: img.alt ?? undefined });
    imgsPorCodigo.set(img.product_codigo, list);
  }

  const catalog = (prods ?? []).map((p) => ({
    codigo: p.codigo,
    nombre: p.nombre,
    categoria: p.categoria,
    ambientes: p.ambientes ?? [],
    medidas: p.medidas ?? '',
    materiales: p.materiales ?? '',
    descripcion: p.descripcion ?? '',
    destacado: !!p.destacado,
    imagenes: imgsPorCodigo.get(p.codigo) ?? [],
  }));

  writeOut(catalog, 'Supabase (products_public)');
}

async function main() {
  try {
    if (SUPABASE_URL && SUPABASE_KEY) {
      await fromSupabase();
    } else {
      fromSeed('Sin credenciales de Supabase — uso el catálogo de ejemplo.');
    }
  } catch (err) {
    // Si Supabase falla en el build, no rompemos el deploy: caemos al seed.
    console.error('[catalog] Error leyendo Supabase:', err.message);
    fromSeed('Fallback al catálogo de ejemplo por el error anterior.');
  }
}

main();
