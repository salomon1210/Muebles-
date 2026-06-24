import { useState } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { lista, agregarItem, quitarItem } from '../stores/wishlist';

interface Props {
  codigo: string;
  nombre: string;
  imagen: string;
  /** Ambientes sugeridos del producto (ids legibles ya resueltos a nombre). */
  ambientesSugeridos?: string[];
  /** "card" = botón compacto; "full" = con selector de cantidad y ambiente. */
  variant?: 'card' | 'full';
}

export default function AddToListButton({
  codigo,
  nombre,
  imagen,
  ambientesSugeridos = [],
  variant = 'card',
}: Props) {
  const items = useStore(lista);
  const enLista = items.some((i) => i.codigo === codigo);

  const [cantidad, setCantidad] = useState(1);
  const [ambiente, setAmbiente] = useState(ambientesSugeridos[0] ?? '');

  function toggle() {
    if (enLista) {
      quitarItem(codigo);
    } else {
      agregarItem({ codigo, nombre, imagen, ambiente, cantidad });
    }
  }

  if (variant === 'card') {
    return (
      <button
        type="button"
        onClick={toggle}
        class={`btn w-full ${enLista ? 'btn-gold' : 'btn-primary'}`}
      >
        {enLista ? '✓ En mi lista' : 'Agregar a mi lista'}
      </button>
    );
  }

  // variant "full"
  return (
    <div class="space-y-5">
      <div class="grid grid-cols-2 gap-4">
        <label class="block">
          <span class="eyebrow block mb-2">Cantidad</span>
          <div class="flex items-center border border-noir/20">
            <button
              type="button"
              class="px-4 py-3 text-lg hover:text-oro"
              onClick={() => setCantidad((c) => Math.max(1, c - 1))}
              aria-label="Menos"
            >
              −
            </button>
            <input
              type="number"
              min="1"
              value={cantidad}
              onInput={(e) => setCantidad(Math.max(1, parseInt((e.target as HTMLInputElement).value) || 1))}
              class="w-full text-center bg-transparent py-3 focus:outline-none"
            />
            <button
              type="button"
              class="px-4 py-3 text-lg hover:text-oro"
              onClick={() => setCantidad((c) => c + 1)}
              aria-label="Más"
            >
              +
            </button>
          </div>
        </label>
        <label class="block">
          <span class="eyebrow block mb-2">Ambiente</span>
          <input
            type="text"
            list="ambientes-sugeridos"
            value={ambiente}
            placeholder="Ej. Living"
            onInput={(e) => setAmbiente((e.target as HTMLInputElement).value)}
            class="field !py-3"
          />
          <datalist id="ambientes-sugeridos">
            {ambientesSugeridos.map((a) => (
              <option value={a} />
            ))}
          </datalist>
        </label>
      </div>
      <button type="button" onClick={toggle} class={`btn w-full ${enLista ? 'btn-gold' : 'btn-primary'}`}>
        {enLista ? '✓ En mi lista — quitar' : 'Agregar a mi lista'}
      </button>
      {enLista && (
        <p class="text-sm text-center text-noir/60">
          Ya está en tu lista. <a href="/mi-lista" class="text-oro underline">Ver mi lista</a>
        </p>
      )}
    </div>
  );
}
