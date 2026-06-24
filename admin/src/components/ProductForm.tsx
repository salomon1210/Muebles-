import { useEffect, useState } from 'preact/hooks';
import { supabase, subirFoto } from '../lib/supabase';
import { CATEGORIAS, AMBIENTES, ROLES_FOTO } from '../lib/catalogMeta';
import { productoVacio, type Producto, type ProductImage } from '../lib/types';
import { calcularCostos, fmt, fmtPct } from '../lib/calc';

interface Props {
  codigoEditar: string | null;
  onGuardado: () => void;
}

type ImgEdit = Pick<ProductImage, 'url' | 'rol' | 'alt' | 'orden'> & { id?: string };

export function ProductForm({ codigoEditar, onGuardado }: Props) {
  const [p, setP] = useState<Producto>(productoVacio());
  const [imagenes, setImagenes] = useState<ImgEdit[]>([]);
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; m: string } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [over, setOver] = useState(false);
  const editando = Boolean(codigoEditar);

  useEffect(() => {
    if (!codigoEditar) return;
    (async () => {
      const { data: prod } = await supabase.from('products').select('*').eq('codigo', codigoEditar).single();
      if (prod) setP(prod as Producto);
      const { data: imgs } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_codigo', codigoEditar)
        .order('orden');
      setImagenes((imgs as ProductImage[] | null)?.map(({ id, url, rol, alt, orden }) => ({ id, url, rol, alt, orden })) ?? []);
    })();
  }, [codigoEditar]);

  function set<K extends keyof Producto>(k: K, v: Producto[K]) {
    setP((prev) => ({ ...prev, [k]: v }));
  }
  function setNum<K extends keyof Producto>(k: K, v: string) {
    set(k, (v === '' ? null : Number(v)) as Producto[K]);
  }
  function toggleAmbiente(id: string) {
    set('ambientes', p.ambientes.includes(id) ? p.ambientes.filter((a) => a !== id) : [...p.ambientes, id]);
  }

  async function onFiles(files: FileList | null) {
    if (!files || !files.length) return;
    if (!p.codigo.trim()) {
      setMsg({ t: 'err', m: 'Primero escribí el código del producto (define la carpeta de las fotos).' });
      return;
    }
    setSubiendo(true);
    setMsg(null);
    try {
      const nuevas: ImgEdit[] = [];
      let orden = imagenes.length;
      for (const file of Array.from(files)) {
        const url = await subirFoto(p.codigo.trim(), file);
        nuevas.push({ url, rol: orden === 0 ? 'principal' : 'ambiente', alt: p.nombre, orden: orden++ });
      }
      setImagenes((prev) => [...prev, ...nuevas]);
    } catch (e: any) {
      setMsg({ t: 'err', m: 'Error subiendo foto: ' + (e.message ?? e) });
    } finally {
      setSubiendo(false);
    }
  }

  function setRol(i: number, rol: ImgEdit['rol']) {
    setImagenes((prev) => prev.map((img, idx) => (idx === i ? { ...img, rol } : img)));
  }
  function quitarImg(i: number) {
    setImagenes((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function guardar(e: Event) {
    e.preventDefault();
    setMsg(null);
    if (!p.codigo.trim()) return setMsg({ t: 'err', m: 'El código es obligatorio.' });
    if (!p.nombre.trim()) return setMsg({ t: 'err', m: 'El nombre es obligatorio.' });
    setGuardando(true);
    try {
      const codigo = p.codigo.trim();
      const { error: e1 } = await supabase.from('products').upsert({ ...p, codigo });
      if (e1) throw e1;
      // Sincronizar imágenes: borrar y reinsertar (simple y consistente).
      const { error: e2 } = await supabase.from('product_images').delete().eq('product_codigo', codigo);
      if (e2) throw e2;
      if (imagenes.length) {
        const rows = imagenes.map((img, i) => ({
          product_codigo: codigo,
          url: img.url,
          rol: img.rol,
          alt: img.alt ?? p.nombre,
          orden: i,
        }));
        const { error: e3 } = await supabase.from('product_images').insert(rows);
        if (e3) throw e3;
      }
      setMsg({ t: 'ok', m: `Producto ${codigo} guardado. La web se republica en ~1-2 min.` });
      setTimeout(onGuardado, 900);
    } catch (e: any) {
      setMsg({ t: 'err', m: 'Error guardando: ' + (e.message ?? e) });
    } finally {
      setGuardando(false);
    }
  }

  const c = calcularCostos(p);

  return (
    <form onSubmit={guardar}>
      <h1>{editando ? `Editar ${codigoEditar}` : 'Cargar producto'}</h1>
      <p class="muted">
        Solo el <b>código</b> y el <b>nombre</b> son obligatorios. El resto lo completás cuando lo
        tengas (medidas, fotos, costos…); podés volver a editar este producto cuando quieras.
      </p>

      {/* PÚBLICO */}
      <div class="section-title">Datos públicos (los ve el cliente)</div>
      <div class="card">
        <div class="grid2">
          <label><span>Código *</span>
            <input value={p.codigo} disabled={editando}
              onInput={(e) => set('codigo', (e.target as HTMLInputElement).value)} placeholder="DT6701" />
          </label>
          <label><span>Nombre *</span>
            <input value={p.nombre} onInput={(e) => set('nombre', (e.target as HTMLInputElement).value)} placeholder="Mesa de comedor Travertino" />
          </label>
        </div>
        <div class="grid2">
          <label><span>Categoría</span>
            <select value={p.categoria} onChange={(e) => set('categoria', (e.target as HTMLSelectElement).value)}>
              {CATEGORIAS.map((cat) => <option value={cat.id}>{cat.nombre}</option>)}
            </select>
          </label>
          <label><span>Medidas</span>
            <input value={p.medidas ?? ''} onInput={(e) => set('medidas', (e.target as HTMLInputElement).value)} placeholder="240 × 100 × 75 cm" />
          </label>
        </div>
        <label><span>Ambientes</span>
          <div class="pills">
            {AMBIENTES.map((a) => (
              <span class={`pill ${p.ambientes.includes(a.id) ? 'on' : ''}`} onClick={() => toggleAmbiente(a.id)}>{a.nombre}</span>
            ))}
          </div>
        </label>
        <label><span>Materiales</span>
          <textarea value={p.materiales ?? ''} onInput={(e) => set('materiales', (e.target as HTMLTextAreaElement).value)} />
        </label>
        <label><span>Descripción</span>
          <textarea value={p.descripcion ?? ''} onInput={(e) => set('descripcion', (e.target as HTMLTextAreaElement).value)} />
        </label>
        <div style="display:flex;gap:24px;flex-wrap:wrap">
          <label class="checkbox"><input type="checkbox" checked={p.disponible} onChange={(e) => set('disponible', (e.target as HTMLInputElement).checked)} /> <span style="margin:0">Visible en la web</span></label>
          <label class="checkbox"><input type="checkbox" checked={p.destacado} onChange={(e) => set('destacado', (e.target as HTMLInputElement).checked)} /> <span style="margin:0">Destacado (home)</span></label>
        </div>
      </div>

      {/* FOTOS */}
      <div class="section-title">Fotos</div>
      <div class="card">
        <div
          class={`dropzone ${over ? 'over' : ''}`}
          onClick={() => document.getElementById('file-input')?.click()}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); onFiles((e as DragEvent).dataTransfer?.files ?? null); }}
        >
          {subiendo ? 'Subiendo…' : 'Arrastrá las fotos acá o hacé click para elegirlas'}
          <input id="file-input" type="file" accept="image/*" multiple style="display:none"
            onChange={(e) => onFiles((e.target as HTMLInputElement).files)} />
        </div>
        {imagenes.length > 0 && (
          <div class="thumbs" style="margin-top:14px">
            {imagenes.map((img, i) => (
              <div class="thumb">
                <img src={img.url} alt={img.alt ?? ''} />
                <select value={img.rol} onChange={(e) => setRol(i, (e.target as HTMLSelectElement).value as ImgEdit['rol'])}>
                  {ROLES_FOTO.map((r) => <option value={r.id}>{r.nombre}</option>)}
                </select>
                <div class="rm" onClick={() => quitarImg(i)}>quitar</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PRIVADO */}
      <div class="section-title">Datos privados (nunca salen a la web)</div>
      <div class="card">
        <div class="grid3">
          <label><span>Código de fábrica</span><input value={p.codigo_fabrica ?? ''} onInput={(e) => set('codigo_fabrica', (e.target as HTMLInputElement).value)} /></label>
          <label><span>Fábrica</span><input value={p.fabrica ?? ''} onInput={(e) => set('fabrica', (e.target as HTMLInputElement).value)} /></label>
          <label><span>Contacto vendedor (WhatsApp/WeChat)</span><input value={p.contacto_vendedor ?? ''} onInput={(e) => set('contacto_vendedor', (e.target as HTMLInputElement).value)} /></label>
        </div>
        <div class="grid3">
          <label><span>Link del producto</span><input value={p.link_producto ?? ''} onInput={(e) => set('link_producto', (e.target as HTMLInputElement).value)} /></label>
          <label><span>MOQ</span><input type="number" value={p.moq ?? ''} onInput={(e) => setNum('moq', (e.target as HTMLInputElement).value)} /></label>
          <label><span>Lead time (días)</span><input type="number" value={p.lead_time_dias ?? ''} onInput={(e) => setNum('lead_time_dias', (e.target as HTMLInputElement).value)} /></label>
        </div>

        <div class="section-title" style="margin-top:6px">Costos (los cargás cuando los tengas)</div>
        <div class="grid3">
          <label><span>FOB (USD)</span><input type="number" step="0.01" value={p.costo_fob ?? ''} onInput={(e) => setNum('costo_fob', (e.target as HTMLInputElement).value)} /></label>
          <label><span>Flete estimado (USD)</span><input type="number" step="0.01" value={p.flete_estimado ?? ''} onInput={(e) => setNum('flete_estimado', (e.target as HTMLInputElement).value)} /></label>
          <label><span>Despachante (USD)</span><input type="number" step="0.01" value={p.costo_despachante ?? ''} onInput={(e) => setNum('costo_despachante', (e.target as HTMLInputElement).value)} /></label>
          <label><span>Impuestos % (sobre CIF)</span><input type="number" step="0.01" value={p.impuestos_pct ?? ''} onInput={(e) => setNum('impuestos_pct', (e.target as HTMLInputElement).value)} /></label>
          <label><span>Markup % (sugerir precio)</span><input type="number" step="0.01" value={p.markup_pct ?? ''} onInput={(e) => setNum('markup_pct', (e.target as HTMLInputElement).value)} /></label>
          <label><span>Precio de venta (USD)</span><input type="number" step="0.01" value={p.precio_venta ?? ''} onInput={(e) => setNum('precio_venta', (e.target as HTMLInputElement).value)} /></label>
        </div>

        {/* Calculadora en vivo */}
        <div class="calc">
          <div class="row"><span>CIF (FOB + flete)</span><span>{fmt(c.cif)}</span></div>
          <div class="row"><span>Impuestos ({p.impuestos_pct ?? 23}%)</span><span>{fmt(c.impuestos)}</span></div>
          <div class="row"><span>Costo total puesto en Argentina</span><b>{fmt(c.costoTotal)}</b></div>
          <div class="row"><span>Precio sugerido {p.markup_pct ? `(markup ${p.markup_pct}%)` : ''}</span><span>{fmt(c.precioSugerido)}</span></div>
          <div class="row"><span>Margen {p.precio_venta ? '(sobre precio de venta)' : '(sobre sugerido)'}</span><b>{fmtPct(c.margenPct)}</b></div>
        </div>

        <div class="section-title" style="margin-top:6px">Logística y estado</div>
        <div class="grid3">
          <label><span>Volumen (m³)</span><input type="number" step="0.001" value={p.volumen_m3 ?? ''} onInput={(e) => setNum('volumen_m3', (e.target as HTMLInputElement).value)} /></label>
          <label><span>Peso (kg)</span><input type="number" step="0.01" value={p.peso_kg ?? ''} onInput={(e) => setNum('peso_kg', (e.target as HTMLInputElement).value)} /></label>
          <label><span>Dimensiones de caja</span><input value={p.dimensiones_caja ?? ''} onInput={(e) => set('dimensiones_caja', (e.target as HTMLInputElement).value)} /></label>
          <label><span>Cantidad por contenedor</span><input type="number" value={p.cantidad_por_contenedor ?? ''} onInput={(e) => setNum('cantidad_por_contenedor', (e.target as HTMLInputElement).value)} /></label>
          <label><span>Pedido por</span><input value={p.pedido_por ?? ''} onInput={(e) => set('pedido_por', (e.target as HTMLInputElement).value)} placeholder="Cliente / nadie" /></label>
        </div>
        <label class="checkbox"><input type="checkbox" checked={p.en_showroom} onChange={(e) => set('en_showroom', (e.target as HTMLInputElement).checked)} /> <span style="margin:0">Está en mi casa / showroom</span></label>
        <label><span>Notas</span><textarea value={p.notas ?? ''} onInput={(e) => set('notas', (e.target as HTMLTextAreaElement).value)} /></label>
      </div>

      {msg && <div class={`msg ${msg.t}`}>{msg.m}</div>}
      <div style="display:flex;gap:10px;margin-top:8px">
        <button class="btn" disabled={guardando || subiendo}>{guardando ? 'Guardando…' : 'Guardar producto'}</button>
        <button type="button" class="btn ghost" onClick={onGuardado}>Cancelar</button>
      </div>
    </form>
  );
}
