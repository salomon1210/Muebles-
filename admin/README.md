# Panel interno — Fase 2 (pendiente)

Acá vivirá el **panel interno** de Milano Home: una pequeña app con login (Supabase Auth)
para cargar y editar productos, subir fotos, gestionar costos/stock y la **calculadora de
cotización**. Se construye en la Fase 2, una vez validada la web pública (Fase 1).

Resumen de lo que incluirá (ver el plan y `supabase/README.md`):

- **Login** (solo el dueño).
- **Cargar producto:** código + fotos (drag & drop, con rol) + datos públicos y privados.
- **Buscar/editar por código.**
- **Calculadora:** CIF = FOB + flete · impuestos = % × CIF · costo total · precio
  sugerido · margen. Más una vista "sumar proyecto" (pegás códigos → total).
- **Estado/stock:** tengo foto · en showroom · disponible · pedido por.

Stack previsto: Vite + Preact + `@supabase/supabase-js`, deployado como proyecto Vercel
aparte (URL privada). La base ya está definida en `../supabase/schema.sql`.
