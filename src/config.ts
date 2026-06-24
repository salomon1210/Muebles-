/**
 * Configuración central del negocio. EDITÁ ESTE ARCHIVO para cambiar el número
 * de WhatsApp, el nombre, el email, etc. Es el único lugar que tocás para los
 * datos de contacto. (No requiere saber programar: cambiá el texto entre comillas.)
 */
export const site = {
  nombre: 'Milano Home',
  tagline: 'Muebles de importación premium',
  // Mensaje central de marca.
  claim:
    'Las mismas fábricas que producen para las grandes casas italianas, en tu hogar, sin el precio argentino.',

  // ── Contacto ──────────────────────────────────────────────────────────────
  // WhatsApp en formato internacional SIN "+", espacios ni guiones (para wa.me).
  whatsapp: '5491133519302',
  // Cómo se muestra el número a la vista.
  whatsappDisplay: '+54 11 3351 9302',
  email: 'abadsalomon12@gmail.com',
  // Ciudad / zona del showroom (tu casa). Editá a gusto.
  ubicacion: 'Buenos Aires, Argentina',

  // Redes (opcional, dejá vacío para ocultar).
  instagram: '',

  // Descripción para SEO / metadatos.
  descripcion:
    'Catálogo curado de muebles de importación premium: sofás, mesas, sillas y más, de las fábricas que producen para las grandes casas italianas. Armás tu lista y te cotizamos el proyecto completo.',
} as const;

/** Devuelve el link de WhatsApp con un mensaje opcional pre-cargado. */
export function whatsappLink(mensaje?: string): string {
  const base = `https://wa.me/${site.whatsapp}`;
  return mensaje ? `${base}?text=${encodeURIComponent(mensaje)}` : base;
}
