import { useState } from 'preact/hooks';
import { supabase } from '../lib/supabase';
import { calcularCostos, fmt } from '../lib/calc';
import type { Producto } from '../lib/types';

/**
 * "Sumar proyecto": pegás los códigos de una wishlist recibida (uno por línea,
 * o "CODIGO x2" para cantidades) y te calcula el total del proyecto.
 */
interface Linea {
  codigo: string;
  cantidad: number;
  producto?: Producto;
  noEncontrado?: boolean;
}

function parsear(texto: string): { codigo: string; cantidad: number }[] {
  return texto
    .split(/[\n,;]+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      // soporta "DT6701 x2", "DT6701 2", "DT6701"
      const m = l.match(/^(.+?)(?:\s*[xX*]?\s*(\d+))?$/);
      const codigo = (m?.[1] ?? l).trim();
      const cantidad = m?.[2] ? parseInt(m[2]) : 1;
      return { codigo, cantidad };
    });
}

export function ProjectSum() {
  const [texto, setTexto] = useState('');
  const [lineas, setLineas] = useState<Linea[] | null>(null);
  const [cargando, setCargando] = useState(false);

  async function calcular() {
    const pedidos = parsear(texto);
    if (!pedidos.length) return;
    setCargando(true);
    const codigos = pedidos.map((p) => p.codigo);
    const { data } = await supabase.from('products').select('*').in('codigo', codigos);
    const mapa = new Map((data as Producto[] | null)?.map((p) => [p.codigo.toLowerCase(), p]) ?? []);
    setLineas(
      pedidos.map((p) => {
        const prod = mapa.get(p.codigo.toLowerCase());
        return { codigo: p.codigo, cantidad: p.cantidad, producto: prod, noEncontrado: !prod };
      }),
    );
    setCargando(false);
  }

  const totalCosto =
    lineas?.reduce((acc, l) => {
      const c = l.producto ? calcularCostos(l.producto).costoTotal : null;
      return acc + (c !== null ? c * l.cantidad : 0);
    }, 0) ?? 0;

  const totalVenta =
    lineas?.reduce((acc, l) => {
      if (!l.producto) return acc;
      const c = calcularCostos(l.producto);
      const precio = l.producto.precio_venta ?? c.precioSugerido;
      return acc + (precio !== null ? precio * l.cantidad : 0);
    }, 0) ?? 0;

  const margen = totalVenta > 0 ? ((totalVenta - totalCosto) / totalVenta) * 100 : null;

  return (
    <div>
      <h1>Sumar proyecto</h1>
      <p class="muted">
        Pegá los códigos de la lista que te llegó (uno por línea). Podés indicar cantidad:{' '}
        <code>DT6701 x2</code>.
      </p>
      <div class="card">
        <textarea
          style="min-height:120px;font-family:monospace"
          placeholder={'SF6011 x2\nDT6701\n...'}
          value={texto}
          onInput={(e) => setTexto((e.target as HTMLTextAreaElement).value)}
        />
        <button class="btn" onClick={calcular} disabled={cargando}>
          {cargando ? 'Calculando…' : 'Calcular total'}
        </button>
      </div>

      {lineas && (
        <div class="card">
          <table>
            <thead>
              <tr><th>Código</th><th>Producto</th><th>Cant.</th><th>Costo total</th><th>Precio venta</th></tr>
            </thead>
            <tbody>
              {lineas.map((l) => {
                if (l.noEncontrado)
                  return (
                    <tr><td><b>{l.codigo}</b></td><td colSpan={4} class="msg err" style="margin:0">No encontrado</td></tr>
                  );
                const c = calcularCostos(l.producto!);
                const precio = l.producto!.precio_venta ?? c.precioSugerido;
                return (
                  <tr>
                    <td><b>{l.codigo}</b></td>
                    <td>{l.producto!.nombre}</td>
                    <td>×{l.cantidad}</td>
                    <td>{c.costoTotal !== null ? fmt(c.costoTotal * l.cantidad) : <span class="muted">—</span>}</td>
                    <td>{precio !== null ? fmt(precio * l.cantidad) : <span class="muted">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div class="calc" style="margin-top:16px">
            <div class="row"><span>Costo total del proyecto (puesto en Argentina)</span><b>{fmt(totalCosto)}</b></div>
            <div class="row"><span>Precio de venta del proyecto</span><b>{fmt(totalVenta)}</b></div>
            <div class="row"><span>Margen</span><b>{margen !== null ? `${margen.toFixed(1)}%` : '—'}</b></div>
          </div>
          <p class="muted" style="font-size:12px">
            Los productos sin costos cargados no suman al total. Cargá sus costos para que aparezcan.
          </p>
        </div>
      )}
    </div>
  );
}
