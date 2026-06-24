import { useState } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import {
  lista,
  quitarItem,
  actualizarCantidad,
  actualizarAmbiente,
  vaciarLista,
  linkWhatsappLista,
  type DatosCliente,
} from '../stores/wishlist';

export default function WishlistView() {
  const items = useStore(lista);
  const [datos, setDatos] = useState<DatosCliente>({
    nombre: '',
    email: '',
    whatsapp: '',
    direccion: '',
    comentarios: '',
  });
  const [errores, setErrores] = useState<string[]>([]);

  function set<K extends keyof DatosCliente>(k: K, v: string) {
    setDatos((d) => ({ ...d, [k]: v }));
  }

  function enviar(e: Event) {
    e.preventDefault();
    const errs: string[] = [];
    if (!datos.nombre.trim()) errs.push('nombre');
    if (!datos.whatsapp.trim() && !datos.email.trim())
      errs.push('contacto');
    setErrores(errs);
    if (errs.length) return;

    const url = linkWhatsappLista(items, datos);
    window.open(url, '_blank', 'noopener');
  }

  if (items.length === 0) {
    return (
      <div class="py-24 text-center">
        <p class="font-display text-3xl mb-3">Tu lista está vacía</p>
        <p class="text-noir/60 mb-8">Agregá los productos que te gusten y armá tu proyecto.</p>
        <a href="/catalogo" class="btn-primary">Ver el catálogo</a>
      </div>
    );
  }

  return (
    <div class="grid lg:grid-cols-[1fr_380px] gap-12 items-start">
      {/* Lista de productos */}
      <div>
        <div class="flex items-center justify-between mb-6">
          <p class="text-sm text-noir/55">
            {items.length} {items.length === 1 ? 'producto' : 'productos'}
          </p>
          <button onClick={vaciarLista} class="text-xs uppercase tracking-widest text-noir/50 hover:text-oro">
            Vaciar lista
          </button>
        </div>

        <ul class="divide-y divide-noir/10 border-y border-noir/10">
          {items.map((i) => (
            <li class="py-5 flex gap-4" key={i.codigo}>
              <div class="w-24 h-28 flex-shrink-0 bg-crema-200 overflow-hidden">
                {i.imagen ? (
                  <img src={i.imagen} alt={i.nombre} class="w-full h-full object-cover" />
                ) : (
                  <div class="w-full h-full flex items-center justify-center text-noir/30 text-xs">Sin foto</div>
                )}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-[11px] uppercase tracking-widest text-oro">{i.codigo}</p>
                    <a href={`/producto/${i.codigo}`} class="font-display text-lg leading-snug hover:text-oro">
                      {i.nombre}
                    </a>
                  </div>
                  <button
                    onClick={() => quitarItem(i.codigo)}
                    class="text-noir/40 hover:text-red-600 text-sm"
                    aria-label="Quitar"
                  >
                    ✕
                  </button>
                </div>

                <div class="mt-3 flex flex-wrap items-center gap-4">
                  <div class="flex items-center border border-noir/20">
                    <button class="px-3 py-1.5 hover:text-oro" onClick={() => actualizarCantidad(i.codigo, i.cantidad - 1)} aria-label="Menos">−</button>
                    <input
                      type="number"
                      min="1"
                      value={i.cantidad}
                      onInput={(e) => actualizarCantidad(i.codigo, parseInt((e.target as HTMLInputElement).value) || 1)}
                      class="w-12 text-center bg-transparent py-1.5 focus:outline-none"
                    />
                    <button class="px-3 py-1.5 hover:text-oro" onClick={() => actualizarCantidad(i.codigo, i.cantidad + 1)} aria-label="Más">+</button>
                  </div>
                  <label class="flex items-center gap-2 text-sm">
                    <span class="text-noir/50">Ambiente:</span>
                    <input
                      type="text"
                      value={i.ambiente}
                      placeholder="Ej. Living"
                      onInput={(e) => actualizarAmbiente(i.codigo, (e.target as HTMLInputElement).value)}
                      class="border-b border-noir/20 bg-transparent py-1 px-1 focus:border-oro focus:outline-none w-32"
                    />
                  </label>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Formulario final */}
      <form onSubmit={enviar} class="bg-white border border-noir/10 p-6 lg:sticky lg:top-24">
        <h2 class="font-display text-2xl mb-1">Enviar mi lista</h2>
        <p class="text-sm text-noir/55 mb-6">
          Te llega a nosotros por WhatsApp y te cotizamos el proyecto completo. Sin compromiso.
        </p>

        <div class="space-y-3">
          <input class="field" placeholder="Nombre y apellido *" value={datos.nombre} onInput={(e) => set('nombre', (e.target as HTMLInputElement).value)} />
          <input class="field" type="email" placeholder="Email" value={datos.email} onInput={(e) => set('email', (e.target as HTMLInputElement).value)} />
          <input class="field" placeholder="WhatsApp *" value={datos.whatsapp} onInput={(e) => set('whatsapp', (e.target as HTMLInputElement).value)} />
          <input class="field" placeholder="Zona o dirección aproximada" value={datos.direccion} onInput={(e) => set('direccion', (e.target as HTMLInputElement).value)} />
          <textarea class="field min-h-[90px]" placeholder="Comentarios (opcional)" value={datos.comentarios} onInput={(e) => set('comentarios', (e.target as HTMLTextAreaElement).value)} />
        </div>

        {errores.length > 0 && (
          <p class="text-sm text-red-600 mt-3">
            {errores.includes('nombre') && 'Ingresá tu nombre. '}
            {errores.includes('contacto') && 'Dejá al menos un WhatsApp o email.'}
          </p>
        )}

        <button type="submit" class="btn-gold w-full mt-5">
          Enviar por WhatsApp
        </button>
        <p class="text-[11px] text-noir/40 mt-3 text-center">
          Se abrirá WhatsApp con tu lista ya escrita. No se procesan pagos ni se muestran precios.
        </p>
      </form>
    </div>
  );
}
