import type { Producto } from './types';

/**
 * Calculadora de cotización (versión simple).
 * Todos los costos pueden faltar: devuelve null en lo que no se pueda calcular
 * todavía (los costos se van cargando con el tiempo).
 *
 *   CIF           = FOB + flete
 *   impuestos     = impuestos_pct% × CIF
 *   costo_total   = CIF + impuestos + despachante   (puesto en Argentina)
 *   precio_sug.   = costo_total × (1 + markup%)
 *   margen        = (precio_venta − costo_total) / precio_venta
 */
export interface Costos {
  cif: number | null;
  impuestos: number | null;
  costoTotal: number | null;
  precioSugerido: number | null;
  margenPct: number | null;
}

function num(v: number | null | undefined): number | null {
  return v === null || v === undefined || isNaN(v as number) ? null : Number(v);
}

export function calcularCostos(p: Partial<Producto>): Costos {
  const fob = num(p.costo_fob);
  const flete = num(p.flete_estimado);
  const despachante = num(p.costo_despachante) ?? 0;
  const impPct = num(p.impuestos_pct) ?? 23;
  const markup = num(p.markup_pct);
  const precioVenta = num(p.precio_venta);

  // CIF necesita al menos FOB (flete se asume 0 si falta).
  const cif = fob !== null ? fob + (flete ?? 0) : null;
  const impuestos = cif !== null ? (cif * impPct) / 100 : null;
  const costoTotal = cif !== null ? cif + (impuestos ?? 0) + despachante : null;

  const precioSugerido =
    costoTotal !== null && markup !== null ? costoTotal * (1 + markup / 100) : null;

  // El margen se calcula sobre el precio de venta elegido (o el sugerido).
  const precioRef = precioVenta ?? precioSugerido;
  const margenPct =
    costoTotal !== null && precioRef !== null && precioRef > 0
      ? ((precioRef - costoTotal) / precioRef) * 100
      : null;

  return { cif, impuestos, costoTotal, precioSugerido, margenPct };
}

export function fmt(v: number | null, moneda = 'USD'): string {
  if (v === null) return '—';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: moneda,
    maximumFractionDigits: 2,
  }).format(v);
}

export function fmtPct(v: number | null): string {
  if (v === null) return '—';
  return `${v.toFixed(1)}%`;
}
