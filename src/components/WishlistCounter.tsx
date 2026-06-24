import { useStore } from '@nanostores/preact';
import { lista } from '../stores/wishlist';

/** Burbuja con la cantidad de ítems en la lista (en el header). */
export default function WishlistCounter() {
  const items = useStore(lista);
  const total = items.reduce((acc, i) => acc + i.cantidad, 0);
  return (
    <a
      href="/mi-lista"
      class="relative inline-flex items-center gap-2 text-sm uppercase tracking-widest hover:text-oro transition-colors"
      aria-label={`Mi lista (${total} ítems)`}
    >
      <span class="hidden sm:inline">Mi lista</span>
      <span class="relative inline-flex">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3">
          <path d="M3 5h2l2.4 12.2a1 1 0 0 0 1 .8h8.7a1 1 0 0 0 1-.8L21 8H6" />
          <circle cx="9" cy="21" r="1" />
          <circle cx="18" cy="21" r="1" />
        </svg>
        {total > 0 && (
          <span class="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-oro text-noir text-[11px] font-medium flex items-center justify-center">
            {total}
          </span>
        )}
      </span>
    </a>
  );
}
