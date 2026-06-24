/** Tipos del producto (públicos + privados) tal como están en la base. */
export interface Producto {
  codigo: string;
  // públicos
  nombre: string;
  categoria: string;
  ambientes: string[];
  medidas: string | null;
  materiales: string | null;
  descripcion: string | null;
  destacado: boolean;
  disponible: boolean;
  // privados
  codigo_fabrica: string | null;
  fabrica: string | null;
  contacto_vendedor: string | null;
  link_producto: string | null;
  moq: number | null;
  lead_time_dias: number | null;
  costo_fob: number | null;
  flete_estimado: number | null;
  costo_despachante: number | null;
  impuestos_pct: number | null;
  markup_pct: number | null;
  precio_venta: number | null;
  volumen_m3: number | null;
  peso_kg: number | null;
  dimensiones_caja: string | null;
  cantidad_por_contenedor: number | null;
  en_showroom: boolean;
  pedido_por: string | null;
  notas: string | null;
}

export interface ProductImage {
  id: string;
  product_codigo: string;
  url: string;
  rol: 'principal' | 'ambiente' | 'detalle';
  alt: string | null;
  orden: number;
}

export function productoVacio(): Producto {
  return {
    codigo: '',
    nombre: '',
    categoria: 'sofas',
    ambientes: [],
    medidas: '',
    materiales: '',
    descripcion: '',
    destacado: false,
    disponible: true,
    codigo_fabrica: '',
    fabrica: '',
    contacto_vendedor: '',
    link_producto: '',
    moq: null,
    lead_time_dias: null,
    costo_fob: null,
    flete_estimado: null,
    costo_despachante: null,
    impuestos_pct: 23,
    markup_pct: null,
    precio_venta: null,
    volumen_m3: null,
    peso_kg: null,
    dimensiones_caja: '',
    cantidad_por_contenedor: null,
    en_showroom: false,
    pedido_por: '',
    notas: '',
  };
}
