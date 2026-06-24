# Milano Home — Catálogo curado de muebles de importación premium

Sistema de **vidriera curada** (no es e-commerce): la web **no muestra precios ni
cobra**. El cliente arma una **lista de deseos** (cantidad + ambiente por producto),
completa sus datos y la **envía por WhatsApp**. Vos cotizás el proyecto a mano.

El sistema tiene 3 partes con **una sola fuente de datos** (el código de producto es la
llave única, ej. `DT6701`):

1. **Web pública** (esta carpeta) — Astro estático en Vercel. *(Fase 1 — ✅ lista)*
2. **Backend** — Supabase (base + fotos + login). *(Fase 2)*
3. **Panel interno** — herramienta de carga con login. *(Fase 2)*

> **Estado actual:** Fase 1 completa y deployable. Funciona con un catálogo de ejemplo
> (`src/data/catalog.seed.json`) hasta que conectes Supabase. Ver `supabase/schema.sql` y
> `supabase/README.md` para la base de datos (Fase 2).

---

## 🔒 Garantía de seguridad (importante)

Los **datos privados** (costos, fábrica, contactos) **nunca** llegan a la web pública.
La web se genera en cada deploy leyendo **solo los campos públicos** (vía la vista
`products_public` de Supabase). El navegador del cliente jamás recibe una clave de la base
ni un solo dato privado. Es una separación física, no solo visual.

---

## Correr el proyecto en tu computadora

Necesitás [Node.js](https://nodejs.org) 18+ instalado.

```bash
npm install      # instalar dependencias (una sola vez)
npm run dev      # abrir en http://localhost:4321
npm run build    # generar la versión final en dist/
npm run preview  # previsualizar la versión final
```

---

## ✏️ Cómo cargar un producto

### Hoy (Fase 1, sin panel todavía)

Los productos viven en **`src/data/catalog.seed.json`** — una lista simple. Para agregar
uno, copiá un bloque existente y editá los valores:

```json
{
  "codigo": "SF6011",
  "nombre": "Sofá modular Como",
  "categoria": "sofas",
  "ambientes": ["living"],
  "medidas": "320 × 95 × 70 cm",
  "materiales": "Tapizado en lino italiano, estructura de haya...",
  "descripcion": "Texto más largo que describe el producto...",
  "destacado": true,
  "imagenes": [
    { "url": "/productos/sofa-como/1.jpg", "rol": "principal", "alt": "Sofá Como" },
    { "url": "/productos/sofa-como/2.jpg", "rol": "ambiente",  "alt": "En living" },
    { "url": "/productos/sofa-como/3.jpg", "rol": "detalle",   "alt": "Tapizado" }
  ]
}
```

**Las fotos:** ponelas en `public/productos/<lo-que-quieras>/` y referencialas con la ruta
que empieza en `/productos/...`. Roles posibles: `principal` (foto principal / fondo
blanco), `ambiente` (la pieza en un ambiente), `detalle` (close-up de materiales).

**Categorías y ambientes válidos** están en `src/lib/catalog.ts` (listas `CATEGORIAS` y
`AMBIENTES`). Usá el `id` (ej. `sofas`, `living`). Podés agregar nuevos ahí.

> **A partir de la Fase 2**, ya no editás este archivo: cargás todo desde el **panel
> interno** (código + fotos + datos) y la web se actualiza sola. El seed queda solo como
> respaldo para desarrollo.

### Campos disponibles (públicos)

| Campo         | Qué es                                            |
|---------------|---------------------------------------------------|
| `codigo`      | Código único del producto (ej. `DT6701`)          |
| `nombre`      | Nombre comercial                                  |
| `categoria`   | id de categoría (ver `src/lib/catalog.ts`)        |
| `ambientes`   | lista de ambientes donde aplica                   |
| `medidas`     | ej. `240 × 100 × 75 cm`                           |
| `materiales`  | descripción de materiales                         |
| `descripcion` | texto largo                                       |
| `destacado`   | `true` para mostrarlo en la home                  |
| `imagenes`    | lista de `{ url, rol, alt }`                       |

---

## ⚙️ Datos del negocio (WhatsApp, email, etc.)

Todo en **`src/config.ts`**. Cambiás el texto entre comillas, nada más:

- `whatsapp` — número en formato internacional **sin** `+`, espacios ni guiones
  (ej. `5491133519302`). Es el número al que llega la lista de los clientes.
- `whatsappDisplay`, `email`, `ubicacion`, `instagram`, textos de marca.

Los textos de cada sección (Home, Cómo funciona, FAQ, etc.) están en los archivos de
`src/pages/`.

---

## 🚀 Deploy en Vercel

1. Subí este repo a GitHub (ya está en la branch del proyecto).
2. Entrá a [vercel.com](https://vercel.com) → **Add New → Project** → importá el repo.
3. Vercel detecta Astro solo (build `npm run build`, output `dist`). Dale **Deploy**.
4. (Opcional) En **Settings → Environment Variables** agregá, cuando tengas Supabase:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` *(secreta — solo se usa en el build, nunca en el navegador)*
   - `PUBLIC_SITE_URL` (tu dominio final, ej. `https://milanohome.com.ar`)
5. Cada push a la branch dispara un nuevo deploy automático.

Sin variables de Supabase, la web buildea igual con el catálogo de ejemplo.

---

## Estructura del proyecto

```
src/
├─ config.ts            ← datos del negocio (WhatsApp, email...)
├─ data/
│  ├─ catalog.seed.json ← catálogo de ejemplo (editable a mano en Fase 1)
│  └─ catalog.generated.json ← lo genera el build (NO se edita a mano)
├─ lib/catalog.ts       ← categorías, ambientes y tipos
├─ stores/wishlist.ts   ← "Mi lista" + armado del mensaje de WhatsApp
├─ components/          ← piezas reutilizables (cards, botones, filtros)
├─ layouts/Layout.astro ← header + footer + SEO
└─ pages/               ← una página por sección
scripts/fetch-catalog.mjs ← genera el catálogo (Supabase o seed) antes del build
supabase/                 ← esquema SQL y guía del backend (Fase 2)
public/productos/         ← fotos de productos
public/showroom/          ← fotos de tu casa / showroom
```

## Próxima fase (Fase 2)

- Crear el proyecto Supabase y correr `supabase/schema.sql` (ver `supabase/README.md`).
- Panel interno `/admin` para cargar productos, fotos y costos, con calculadora de
  cotización (CIF, impuestos, costo total, precio sugerido, margen) y suma de proyectos.
- Webhook de Supabase → Deploy Hook de Vercel para que la web se republique sola al
  guardar un producto.
