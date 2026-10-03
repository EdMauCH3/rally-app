import { supabase } from './supabaseClient';

export async function listarEquipos() {
  const { data, error } = await supabase
    .from('macro_equipos')
    .select('id, nombre, color_hex')
    .order('nombre', { ascending: true });

  if (error) throw error;
  return data;
}
