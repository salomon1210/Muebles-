import { useMemo, useState } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { lista, agregarItem, quitarItem } from '../stores/wishlist';

interface ImagenLite {
  url: string;
  rol: string;
  alt?: string;
}
interface ProductoLite {
  codigo: string;
  nombre: string;
  categoria: string;
  categoriaNombre: string;
  ambientes: string[];
  ambientesNombres: string[];
  medidas: string;
  imagen: string | null;
}
interface Opcion {
  id: string;
  nombre: string;
}

interface Props {
  productos: ProductoLite[];
  ambientes: Opcion[];
  categorias: Opcion[];
}

export default function CatalogBrowser({ productos, ambientes, categorias }: Props) {
  const items = useStore(lista);
  const [ambiente, setAmbiente] = useState<string>('todos');
  const [categoria, setCategoria] = useState<string>('todas');
  const [q, setQ] = useState('');

  const filtrados = useMemo(() => {
    const query = q.trim().toLowerCase();
    return productos.filter((p) => {
      if (ambiente !== 'todos' && !p.ambientes.includes(ambiente)) return false;
      if (categoria !== 'todas' && p.categoria !== categoria) return false;
      if (query) {
        const hay = `${p.codigo} ${p.nombre}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [productos, ambiente, categoria, q]);

  return (
    <div>
      {/* Búsqueda visual por ambiente */}
      <div class="mb-8">
        <p class="eyebrow mb-4">Buscá por ambiente</p>
        <div class="flex flex-wrap gap-2">
          <Pill activo={ambiente === 'todos'} onClick={() => setAmbiente('todos')}>
            Todos
          </Pill>
          {ambientes.map((a) => (
            <Pill activo={ambiente === a.id} onClick={() => setAmbiente(a.id)}>
              {a.nombre}
            </Pill>
          ))}
        </div>
      </div>

      {/* Filtro por categoría + búsqueda por código */}
      <div class="mb-10 flex flex-col lg:flex-row gap-4 lg:items-end lg:justify-between">
        <div>
          <p class="eyebrow mb-3">Categoría</p>
          <div class="flex flex-wrap gap-2">
            <Pill small activo={categoria === 'todas'} onClick={() => setCategoria('todas')}>
              Todas
            </Pill>
            {categorias.map((c) => (
              <Pill small activo={categoria === c.id} onClick={() => setCategoria(c.id)}>
                {c.nombre}
              </Pill>
            ))}
          </div>
        </div>
        <div class="lg:w-80">
          <p class="eyebrow mb-3">Buscar por código o nombre</p>
          <input
            type="search"
            value={q}
            placeholder="Ej. SF6011"
            onInput={(e) => setQ((e.target as HTMLInputElement).value)}
            class="field"
          />
        </div>
      </div>

      <p class="text-sm text-noir/50 mb-6">
        {filtrados.length} {filtrados.length === 1 ? 'producto' : 'productos'}
      </p>

      {filtrados.length === 0 ? (
        <div class="py-20 text-center text-noir/50">
          <p class="font-display text-2xl mb-2">No encontramos productos con ese filtro</p>
          <p class="text-sm">Probá con otro ambiente o limpiá la búsqueda.</p>
        </div>
      ) : (
        <div class="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
          {filtrados.map((p) => {
            const enLista = items.some((i) => i.codigo === p.codigo);
            return (
              <div class="group" key={p.codigo}>
                <a href={`/producto/${p.codigo}`} class="block">
                  <div class="relative aspect-[4/5] overflow-hidden bg-crema-200">
                    {p.imagen ? (
                      <img
                        src={p.imagen}
                        alt={p.nombre}
                        loading="lazy"
                        class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div class="w-full h-full flex items-center justify-center text-noir/30 text-sm">
                        Sin foto
                      </div>
                    )}
                    <span class="absolute top-3 left-3 bg-crema-100/90 text-noir text-[11px] tracking-widest uppercase px-2 py-1">
                      {p.codigo}
                    </span>
                  </div>
                </a>
                <div class="pt-4">
                  <p class="text-[11px] uppercase tracking-widest text-oro">{p.categoriaNombre}</p>
                  <a href={`/producto/${p.codigo}`}>
                    <h3 class="font-display text-xl mt-1 leading-snug group-hover:text-oro transition-colors">
                      {p.nombre}
                    </h3>
                  </a>
                  {p.medidas && <p class="text-sm text-noir/55 mt-1">{p.medidas}</p>}
                  <button
                    type="button"
                    onClick={() =>
                      enLista
                        ? quitarItem(p.codigo)
                        : agregarItem({
                            codigo: p.codigo,
                            nombre: p.nombre,
                            imagen: p.imagen ?? '',
                            ambiente: p.ambientesNombres[0] ?? '',
                          })
                    }
                    class={`mt-4 w-full text-xs uppercase tracking-widest py-2.5 border transition-colors ${
                      enLista
                        ? 'bg-oro border-oro text-noir'
                        : 'border-noir/25 text-noir hover:border-oro hover:text-oro'
                    }`}
                  >
                    {enLista ? '✓ En mi lista' : 'Agregar a mi lista'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Pill({
  children,
  activo,
  onClick,
  small,
}: {
  children: preact.ComponentChildren;
  activo: boolean;
  onClick: () => void;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      class={`uppercase tracking-widest border transition-colors ${
        small ? 'text-[11px] px-3 py-1.5' : 'text-xs px-4 py-2'
      } ${activo ? 'bg-noir text-crema-100 border-noir' : 'border-noir/25 text-noir/70 hover:border-oro hover:text-oro'}`}
    >
      {children}
    </button>
  );
}
