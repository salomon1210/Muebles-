# Importación masiva de productos

Para cargar muchos productos de una sola vez (ej. a partir de un catálogo).

## Cómo se usa

1. Armá un archivo `products.json` en esta carpeta con la lista de productos
   (ver `products.example.json` como modelo). Solo `codigo` y `nombre` son
   obligatorios; el resto se completa cuando se tenga.
2. Si vas a subir fotos desde archivos locales, ponelas en una subcarpeta acá
   (ej. `data-import/fotos/sf6011/1.jpg`) y referencialas con `"file": "fotos/sf6011/1.jpg"`.
   Si la foto ya está hosteada, usá `"url": "https://…"` en vez de `file`.
3. Corré el importador con las credenciales de Supabase:

   ```bash
   SUPABASE_URL="https://xxxx.supabase.co" \
   SUPABASE_SERVICE_ROLE_KEY="xxxxx" \
   node scripts/import-products.mjs data-import/products.json
   ```

El script hace **upsert** (si el código ya existe, lo actualiza), sube las fotos
al bucket y reemplaza las imágenes del producto. La web se republica sola si el
webhook está configurado (ver `../supabase/README.md`).

> **Nota:** Esta carpeta (`data-import/`) está pensada para uso interno. Las fotos
> y el `products.json` con costos no se publican: solo alimentan la base. No subas
> a git fotos pesadas ni datos sensibles si no querés (ver `.gitignore`).
