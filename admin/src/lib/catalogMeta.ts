/**
 * Categorías y ambientes válidos. DEBEN coincidir con los de la web pública
 * (src/lib/catalog.ts del proyecto Astro). Si agregás uno acá, agregalo allá.
 */
export const CATEGORIAS = [
  { id: 'sofas', nombre: 'Sofás y sillones' },
  { id: 'mesas', nombre: 'Mesas' },
  { id: 'sillas', nombre: 'Sillas' },
  { id: 'camas', nombre: 'Camas' },
  { id: 'aparadores', nombre: 'Aparadores y storage' },
  { id: 'escritorios', nombre: 'Escritorios' },
  { id: 'decoracion', nombre: 'Decoración' },
];

export const AMBIENTES = [
  { id: 'living', nombre: 'Living' },
  { id: 'comedor', nombre: 'Comedor' },
  { id: 'dormitorio', nombre: 'Dormitorio' },
  { id: 'estudio', nombre: 'Estudio' },
  { id: 'exterior', nombre: 'Exterior' },
  { id: 'decoracion', nombre: 'Decoración' },
];

export const ROLES_FOTO = [
  { id: 'principal', nombre: 'Principal (fondo blanco)' },
  { id: 'ambiente', nombre: 'Ambiente' },
  { id: 'detalle', nombre: 'Detalle' },
];
