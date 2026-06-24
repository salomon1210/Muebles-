# Backend Supabase — Guía (Fase 2)

Esta carpeta contiene el **esquema de la base de datos** (`schema.sql`). El backend
recomendado es **Supabase** (base de datos + storage de fotos + login, gratis, sin
servidor que mantener). Esta guía es para cuando arranques la Fase 2.

> En la Fase 1 la web funciona con el catálogo de ejemplo y **no** necesitás nada de esto.

---

## 1. Crear el proyecto

1. Entrá a [supabase.com](https://supabase.com) y creá un proyecto (plan Free).
2. Anotá, desde **Project Settings → API**:
   - **Project URL** → será `SUPABASE_URL`
   - **service_role key** (en *Project API keys*) → será `SUPABASE_SERVICE_ROLE_KEY`
     ⚠️ **Es secreta.** No la pongas en el navegador ni la subas a git. Solo va como
     variable de entorno en Vercel (se usa únicamente durante el build).

## 2. Crear las tablas

En Supabase: **SQL Editor → New query**, pegá todo el contenido de
[`schema.sql`](./schema.sql) y ejecutá. Esto crea:

- Tabla `products` (campos **públicos** y **privados** juntos).
- Tabla `product_images` (fotos con rol: principal / ambiente / detalle).
- Vista `products_public` (solo campos públicos — es lo único que lee la web).
- Las políticas de seguridad (RLS): el rol anónimo **no** puede leer `products`.

## 3. Crear el bucket de fotos

**Storage → New bucket** → nombre `productos` → marcá **Public** → crear.
Las fotos se guardarán en `productos/<codigo>/<archivo>`.

> Las políticas de subida de fotos están al final de `schema.sql`. Como el bucket
> se crea desde la interfaz, corré esa última parte del SQL **después** de crear
> el bucket (o volvé a ejecutar todo `schema.sql`, es idempotente).

## 4. Crear tu usuario (login del panel)

**Authentication → Users → Add user** → tu email y una contraseña. Ese será el único
usuario que entra al panel interno.

## 5. Conectar la web a Supabase

En Vercel (proyecto de la web pública) → **Settings → Environment Variables**:

| Variable                     | Valor                                  |
|------------------------------|----------------------------------------|
| `SUPABASE_URL`               | Project URL                            |
| `SUPABASE_SERVICE_ROLE_KEY`  | service_role key (secreta)             |

Re-deployá. Ahora el build lee los productos reales desde `products_public`.

## 6. Re-publicación automática (al guardar un producto)

Para que la web se actualice sola cuando cargás/editás un producto:

1. En Vercel: **Settings → Git → Deploy Hooks** → creá un hook (ej. `republicar`) y copiá
   la URL.
2. En Supabase: **Database → Webhooks → Create a new hook** sobre la tabla `products`
   (eventos *insert / update / delete*) → tipo HTTP **POST** a la URL del Deploy Hook.

Listo: cada cambio en un producto dispara un rebuild (~1-2 min) y la web queda al día,
siempre solo con campos públicos.

---

## Verificar la separación de seguridad

Después de correr `schema.sql`, en el SQL Editor:

```sql
-- Debe FALLAR o devolver vacío para el rol anónimo (no tiene acceso a products):
set role anon;
select * from public.products;   -- sin permisos
reset role;

-- La vista pública solo expone columnas públicas:
select * from public.products_public limit 1;
```

Ningún campo privado (costos, fábrica, contactos) aparece en `products_public`, así que es
imposible que llegue a la web.

---

## 7. El panel interno (carpeta `admin/`)

El panel ya está construido en [`../admin`](../admin). Para usarlo:

```bash
cd admin
cp .env.example .env       # completá VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm install
npm run dev                # abre el panel en local (http://localhost:5173)
```

> La **ANON key** (no la service_role) va en el panel. Es segura en el navegador:
> sola no accede a nada, porque la RLS exige login. Recién después de loguearte
> con tu usuario tenés acceso a todo.

**Deploy del panel en Vercel (proyecto aparte, URL privada):**
1. Vercel → Add New → Project → mismo repo, pero en **Root Directory** elegí `admin`.
2. Framework: Vite. Build `npm run build`, output `dist`.
3. Cargá las env vars `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_STORAGE_BUCKET=productos`.

Funciones del panel:
- **Login** con el usuario del paso 4.
- **Cargar/editar producto** por código, con subida de fotos (drag & drop) y rol por foto.
  Solo código y nombre son obligatorios; el resto se completa con el tiempo.
- **Calculadora en vivo:** `CIF = FOB + flete`, `impuestos = % × CIF`,
  `costo_total = CIF + impuestos + despachante`, `precio_sugerido` (markup), `margen`.
- **Sumar proyecto:** pegás varios códigos (de una wishlist recibida) y da el total.
- **Estado/stock:** visible / destacado / en showroom / pedido por.

## 8. Carga masiva (opcional)

Para subir muchos productos de una, ver [`../data-import/README.md`](../data-import/README.md)
y el script `scripts/import-products.mjs`.
