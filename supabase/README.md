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

## Qué viene en el panel interno (Fase 2)

- Login con el usuario creado en el paso 4.
- Cargar/editar producto por código, con subida de fotos (drag & drop) y rol por foto.
- Calculadora: `CIF = FOB + flete`, `impuestos = impuestos_pct% × CIF`,
  `costo_total = CIF + impuestos + despachante`, `precio_sugerido`, `margen`.
- Vista "sumar proyecto": pegás varios códigos y te da el total del proyecto.
- Gestión de estado: tengo foto / en showroom / disponible / pedido por.
