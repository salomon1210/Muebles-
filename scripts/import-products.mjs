/**
 * Importador masivo de productos a Supabase.
 *
 * Sirve para cargar muchos productos de una (ej. cuando Salomón manda un
 * catálogo y hay que subir todo). Lee un JSON con los productos y los hace
 * UPSERT en la tabla `products`; opcionalmente sube fotos desde archivos locales
 * al bucket de Storage.
 *
 * Uso:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/import-products.mjs data-import/products.json
 *
 * Formato del JSON: ver data-import/products.example.json
 *   - Campos públicos y privados son los de la tabla (todos opcionales menos
 *     `codigo` y `nombre`).
 *   - `imagenes`: lista de { rol, alt, url? , file? }
 *       · `url`  → ya está hosteada, se usa tal cual.
 *       · `file` → ruta local (relativa a data-import/) que se sube al bucket.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'productos';

if (!URL || !KEY) {
  console.error('Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el entorno.');
  process.exit(1);
}

const archivo = resolve(ROOT, process.argv[2] || 'data-import/products.json');
const baseDir = dirname(archivo);

const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(URL, KEY, { auth: { persistSession: false } });

const productos = JSON.parse(readFileSync(archivo, 'utf-8'));
if (!Array.isArray(productos)) {
  console.error('El archivo debe ser un array de productos.');
  process.exit(1);
}

async function subirArchivo(codigo, rutaLocal) {
  const abs = resolve(baseDir, rutaLocal);
  const buf = readFileSync(abs);
  const path = `${codigo}/${Date.now()}-${basename(rutaLocal).replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
  const ext = (basename(rutaLocal).split('.').pop() || 'jpg').toLowerCase();
  const tipo = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  const { error } = await supabase.storage.from(BUCKET).upload(path, buf, { contentType: tipo, upsert: true });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

let ok = 0;
for (const raw of productos) {
  const { imagenes, ...prod } = raw;
  if (!prod.codigo || !prod.nombre) {
    console.warn(`✗ Saltado (falta codigo/nombre):`, JSON.stringify(raw).slice(0, 80));
    continue;
  }
  try {
    const { error: e1 } = await supabase.from('products').upsert(prod);
    if (e1) throw e1;

    if (Array.isArray(imagenes) && imagenes.length) {
      await supabase.from('product_images').delete().eq('product_codigo', prod.codigo);
      const rows = [];
      let orden = 0;
      for (const img of imagenes) {
        let url = img.url;
        if (!url && img.file) url = await subirArchivo(prod.codigo, img.file);
        if (!url) continue;
        rows.push({
          product_codigo: prod.codigo,
          url,
          rol: img.rol || (orden === 0 ? 'principal' : 'ambiente'),
          alt: img.alt || prod.nombre,
          orden: orden++,
        });
      }
      if (rows.length) {
        const { error: e2 } = await supabase.from('product_images').insert(rows);
        if (e2) throw e2;
      }
    }
    ok++;
    console.log(`✓ ${prod.codigo} — ${prod.nombre}`);
  } catch (e) {
    console.error(`✗ ${prod.codigo}: ${e.message ?? e}`);
  }
}

console.log(`\nListo: ${ok}/${productos.length} productos importados.`);
console.log('La web se republica sola si configuraste el webhook (ver supabase/README.md).');
