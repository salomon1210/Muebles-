import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const STORAGE_BUCKET =
  (import.meta.env.VITE_STORAGE_BUCKET as string) || 'productos';

export const configurado = Boolean(url && anonKey);

// La ANON key es segura en el navegador: sola no accede a nada (RLS exige login).
export const supabase = createClient(url ?? 'http://localhost', anonKey ?? 'anon');

/** Sube una foto al bucket y devuelve su URL pública. */
export async function subirFoto(codigo: string, file: File): Promise<string> {
  const limpio = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `${codigo}/${Date.now()}-${limpio}`;
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
