import { z } from 'zod';
import generated from '../data/catalog.generated.json';

/**
 * Capa de datos del catálogo PÚBLICO.
 *
 * IMPORTANTE: este módulo solo conoce campos públicos. Los datos privados
 * (costos, fábrica, etc.) viven en Supabase y NUNCA llegan acá ni al navegador.
 * El archivo `catalog.generated.json` lo genera `scripts/fetch-catalog.mjs` en
 * cada build (desde Supabase si hay credenciales, o desde el seed si no).
 */

// ── Ambientes y categorías (orden de aparición en la web) ─────────────────────
export const AMBIENTES = [
  { id: 'living', nombre: 'Living' },
  { id: 'comedor', nombre: 'Comedor' },
  { id: 'dormitorio', nombre: 'Dormitorio' },
  { id: 'estudio', nombre: 'Estudio' },
  { id: 'decoracion', nombre: 'Decoración' },
] as const;

export const CATEGORIAS = [
  { id: 'sofas', nombre: 'Sofás' },
  { id: 'sillones', nombre: 'Sillones y butacas' },
  { id: 'sillas', nombre: 'Sillas' },
  { id: 'mesas-comedor', nombre: 'Mesas de comedor' },
  { id: 'mesas-centro', nombre: 'Mesas de centro' },
  { id: 'mesas-auxiliares', nombre: 'Mesas auxiliares' },
  { id: 'consolas', nombre: 'Consolas' },
  { id: 'aparadores', nombre: 'Aparadores y vitrinas' },
  { id: 'muebles-tv', nombre: 'Muebles de TV' },
  { id: 'bibliotecas', nombre: 'Bibliotecas' },
  { id: 'bar-carts', nombre: 'Bar carts' },
  { id: 'banquetas', nombre: 'Banquetas y poufs' },
  { id: 'camas', nombre: 'Camas' },
  { id: 'mesas-luz', nombre: 'Mesas de luz' },
  { id: 'tocadores', nombre: 'Tocadores' },
  { id: 'escritorios', nombre: 'Escritorios' },
  { id: 'decoracion', nombre: 'Decoración' },
] as const;

export type AmbienteId = (typeof AMBIENTES)[number]['id'];
export type CategoriaId = (typeof CATEGORIAS)[number]['id'];

// ── Esquema de un producto público ────────────────────────────────────────────
export const imagenSchema = z.object({
  url: z.string(),
  rol: z.enum(['principal', 'ambiente', 'detalle']).default('principal'),
  alt: z.string().optional(),
});

export const productoSchema = z.object({
  codigo: z.string(),
  nombre: z.string(),
  categoria: z.string(),
  ambientes: z.array(z.string()).default([]),
  medidas: z.string().optional().default(''),
  materiales: z.string().optional().default(''),
  descripcion: z.string().optional().default(''),
  destacado: z.boolean().optional().default(false),
  imagenes: z.array(imagenSchema).default([]),
});

export type Imagen = z.infer<typeof imagenSchema>;
export type Producto = z.infer<typeof productoSchema>;

const catalogSchema = z.array(productoSchema);

// Validamos en build: si un producto está mal cargado, el build falla con un
// mensaje claro en vez de romper silenciosamente la web.
export const productos: Producto[] = catalogSchema.parse(generated);

/** Imagen principal de un producto (o la primera disponible, o null). */
export function imagenPrincipal(p: Producto): Imagen | null {
  return (
    p.imagenes.find((i) => i.rol === 'principal') ?? p.imagenes[0] ?? null
  );
}

export function getProducto(codigo: string): Producto | undefined {
  return productos.find((p) => p.codigo.toLowerCase() === codigo.toLowerCase());
}

export function productosDestacados(): Producto[] {
  const dest = productos.filter((p) => p.destacado);
  return dest.length ? dest : productos.slice(0, 6);
}

/** Nombre legible de una categoría/ambiente a partir de su id. */
export function nombreCategoria(id: string): string {
  return CATEGORIAS.find((c) => c.id === id)?.nombre ?? id;
}
export function nombreAmbiente(id: string): string {
  return AMBIENTES.find((a) => a.id === id)?.nombre ?? id;
}

/** Ambientes que tienen al menos un producto (para no mostrar filtros vacíos). */
export function ambientesConProductos() {
  return AMBIENTES.filter((a) => productos.some((p) => p.ambientes.includes(a.id)));
}
