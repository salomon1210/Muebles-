-- ============================================================================
-- Milano Home — Esquema de base de datos (Supabase / PostgreSQL)
-- ============================================================================
-- Una sola tabla `products` con campos PÚBLICOS y PRIVADOS. La separación de
-- seguridad se hace a nivel de acceso:
--   • La web pública lee SOLO la vista `products_public` (campos públicos).
--   • El panel interno (usuario autenticado) accede a todo.
--   • El rol anónimo NO puede leer la tabla `products`.
-- Ejecutá este archivo en Supabase → SQL Editor.
-- ============================================================================

-- ── Tabla principal ─────────────────────────────────────────────────────────
create table if not exists public.products (
  -- Identidad
  codigo                  text primary key,              -- llave única (ej. DT6701)
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  -- ── CAMPOS PÚBLICOS (los ve el cliente en la web) ──
  nombre                  text not null,
  categoria               text not null,                 -- id de categoría (ver src/lib/catalog.ts)
  ambientes               text[] not null default '{}',  -- ids de ambiente
  medidas                 text default '',
  materiales              text default '',
  descripcion             text default '',
  destacado               boolean not null default false,
  disponible              boolean not null default true,  -- si false, no sale a la web

  -- ── CAMPOS PRIVADOS (NUNCA salen a la web) ──
  codigo_fabrica          text,
  fabrica                 text,
  contacto_vendedor       text,
  link_producto           text,
  moq                     integer,
  lead_time_dias          integer,
  -- Costos (en USD salvo que aclares otra cosa)
  costo_fob               numeric(12,2),
  flete_estimado          numeric(12,2),
  costo_despachante       numeric(12,2),
  impuestos_pct           numeric(5,2) default 23,        -- % sobre CIF
  -- Precio de venta (lo decidís vos; la calculadora del panel lo sugiere)
  markup_pct              numeric(6,2),                   -- % de markup sobre el costo total
  precio_venta            numeric(12,2),                  -- precio final de venta elegido
  -- Logística
  volumen_m3              numeric(10,3),
  peso_kg                 numeric(10,2),
  dimensiones_caja        text,
  cantidad_por_contenedor integer,
  -- Estado operativo
  en_showroom             boolean not null default false,
  pedido_por              text,
  notas                   text
);

-- Mantener updated_at al día (dispara el webhook de re-publicación en cada cambio).
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ── Imágenes (todas públicas por diseño) ────────────────────────────────────
create table if not exists public.product_images (
  id              uuid primary key default gen_random_uuid(),
  product_codigo  text not null references public.products(codigo) on delete cascade,
  url             text not null,
  rol             text not null default 'principal'
                    check (rol in ('principal','ambiente','detalle')),
  alt             text,
  orden           integer not null default 0,
  created_at      timestamptz not null default now()
);
create index if not exists idx_product_images_codigo on public.product_images(product_codigo);

-- ── Vista PÚBLICA: solo columnas públicas de productos disponibles ──────────
-- El build de la web lee de acá. Si una columna privada no está en este SELECT,
-- es físicamente imposible que llegue a la web.
create or replace view public.products_public as
  select
    codigo, nombre, categoria, ambientes, medidas, materiales,
    descripcion, destacado
  from public.products
  where disponible = true;

-- ============================================================================
-- SEGURIDAD (Row Level Security)
-- ============================================================================
alter table public.products       enable row level security;
alter table public.product_images enable row level security;

-- Productos: SOLO usuarios autenticados (el dueño) acceden a la tabla completa.
drop policy if exists "owner full access products" on public.products;
create policy "owner full access products"
  on public.products for all
  to authenticated
  using (true) with check (true);

-- Imágenes: el dueño gestiona; cualquiera puede LEER (las fotos son públicas).
drop policy if exists "owner manage images" on public.product_images;
create policy "owner manage images"
  on public.product_images for all
  to authenticated
  using (true) with check (true);

drop policy if exists "public read images" on public.product_images;
create policy "public read images"
  on public.product_images for select
  to anon
  using (true);

-- El rol anónimo NO tiene políticas sobre `products` → no puede leer la tabla.
-- Quitamos cualquier grant directo por las dudas:
revoke all on public.products from anon;

-- La vista pública se usa con la clave service_role en el build (no anon).
-- Si en el futuro quisieras lectura en vivo desde el navegador, recién ahí
-- harías: grant select on public.products_public to anon;

-- ============================================================================
-- STORAGE (fotos): crear el bucket público "productos" desde el panel de
-- Supabase (Storage → New bucket → name: productos → Public). Path sugerido:
--   productos/<codigo>/<archivo>
--
-- Una vez creado el bucket, corré estas políticas para que el panel (usuario
-- autenticado) pueda subir/borrar fotos. La lectura es pública (bucket público).
-- ============================================================================
drop policy if exists "owner upload productos" on storage.objects;
create policy "owner upload productos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'productos');

drop policy if exists "owner update productos" on storage.objects;
create policy "owner update productos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'productos');

drop policy if exists "owner delete productos" on storage.objects;
create policy "owner delete productos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'productos');
