import { persistentAtom } from '@nanostores/persistent';
import { site } from '../config';

/**
 * Estado de "Mi lista" (wishlist). Vive solo en el navegador del cliente
 * (localStorage), sin login ni backend. Se comparte entre todas las islas.
 */
export interface ItemLista {
  codigo: string;
  nombre: string;
  imagen: string; // url de la foto principal (para mostrar en la lista)
  cantidad: number;
  ambiente: string; // texto libre que indica el cliente (ej. "Living principal")
}

export const lista = persistentAtom<ItemLista[]>('milano:lista', [], {
  encode: JSON.stringify,
  decode: JSON.parse,
});

export function agregarItem(item: Omit<ItemLista, 'cantidad'> & { cantidad?: number }) {
  const actual = lista.get();
  const existente = actual.find((i) => i.codigo === item.codigo);
  if (existente) {
    lista.set(
      actual.map((i) =>
        i.codigo === item.codigo
          ? { ...i, cantidad: i.cantidad + (item.cantidad ?? 1), ambiente: item.ambiente || i.ambiente }
          : i,
      ),
    );
  } else {
    lista.set([...actual, { ...item, cantidad: item.cantidad ?? 1 }]);
  }
}

export function quitarItem(codigo: string) {
  lista.set(lista.get().filter((i) => i.codigo !== codigo));
}

export function actualizarCantidad(codigo: string, cantidad: number) {
  const c = Math.max(1, Math.floor(cantidad) || 1);
  lista.set(lista.get().map((i) => (i.codigo === codigo ? { ...i, cantidad: c } : i)));
}

export function actualizarAmbiente(codigo: string, ambiente: string) {
  lista.set(lista.get().map((i) => (i.codigo === codigo ? { ...i, ambiente } : i)));
}

export function vaciarLista() {
  lista.set([]);
}

export function cantidadTotal(): number {
  return lista.get().reduce((acc, i) => acc + i.cantidad, 0);
}

/** Datos de contacto que completa el cliente en el formulario final. */
export interface DatosCliente {
  nombre: string;
  email: string;
  whatsapp: string;
  direccion: string;
  comentarios: string;
}

/**
 * Arma el mensaje de WhatsApp con los datos del cliente + la lista de productos.
 * Este mensaje le llega al dueño para cotizar a mano.
 */
export function construirMensaje(items: ItemLista[], datos: DatosCliente): string {
  const L = [];
  L.push(`*Nueva lista de deseos — ${site.nombre}*`);
  L.push('');
  L.push('*Mis datos:*');
  L.push(`• Nombre: ${datos.nombre || '-'}`);
  L.push(`• Email: ${datos.email || '-'}`);
  L.push(`• WhatsApp: ${datos.whatsapp || '-'}`);
  if (datos.direccion) L.push(`• Zona/dirección: ${datos.direccion}`);
  L.push('');
  L.push(`*Productos (${items.length}):*`);
  for (const i of items) {
    const amb = i.ambiente ? ` — ${i.ambiente}` : '';
    L.push(`• [${i.codigo}] ${i.nombre} ×${i.cantidad}${amb}`);
  }
  if (datos.comentarios) {
    L.push('');
    L.push(`*Comentarios:* ${datos.comentarios}`);
  }
  L.push('');
  L.push('Me gustaría recibir la cotización del proyecto. ¡Gracias!');
  return L.join('\n');
}

export function linkWhatsappLista(items: ItemLista[], datos: DatosCliente): string {
  const msg = construirMensaje(items, datos);
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(msg)}`;
}
