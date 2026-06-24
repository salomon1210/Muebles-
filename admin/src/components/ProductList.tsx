import { useEffect, useState } from 'preact/hooks';
import { supabase } from '../lib/supabase';
import { calcularCostos, fmt } from '../lib/calc';
import type { Producto } from '../lib/types';

interface Props {
  onEditar: (codigo: string) => void;
  onNuevo: () => void;
}

export function ProductList({ onEditar, onNuevo }: Props) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [q, setQ] = useState('');
  const [cargando, setCargando] = useState(true);
  const [err, setErr] = useState('');

  async function cargar() {
    setCargando(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) setErr(error.message);
    else setProductos((data as Producto[]) ?? []);
    setCargando(false);
  }
  useEffect(() => {
    cargar();
  }, []);

  const filtrados = productos.filter((p) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return `${p.codigo} ${p.nombre} ${p.fabrica ?? ''}`.toLowerCase().includes(s);
  });

  return (
    <div>
      <div style="display:flex;gap:12px;align-items:center;justify-content:space-between;margin-top:22px;flex-wrap:wrap">
        <h1 style="margin:0">Productos ({productos.length})</h1>
        <button class="btn" onClick={onNuevo}>+ Cargar producto</button>
      </div>

      <div class="card">
        <input
          placeholder="Buscar por código, nombre o fábrica…"
          value={q}
          onInput={(e) => setQ((e.target as HTMLInputElement).value)}
        />
        {err && <div class="msg err">{err}</div>}
        {cargando ? (
          <p class="muted">Cargando…</p>
        ) : filtrados.length === 0 ? (
          <p class="muted">No hay productos todavía. Cargá el primero con “+ Cargar producto”.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Costo total</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => {
                const c = calcularCostos(p);
                return (
                  <tr class="click" onClick={() => onEditar(p.codigo)}>
                    <td><b>{p.codigo}</b></td>
                    <td>{p.nombre}</td>
                    <td style="display:flex;gap:5px;flex-wrap:wrap">
                      <span class={`badge ${p.disponible ? 'on' : 'off'}`}>{p.disponible ? 'visible' : 'oculto'}</span>
                      {p.destacado && <span class="badge">★ destacado</span>}
                      {p.en_showroom && <span class="badge">showroom</span>}
                      {p.pedido_por && <span class="badge">pedido</span>}
                    </td>
                    <td>{c.costoTotal !== null ? fmt(c.costoTotal) : <span class="muted">sin costos</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
