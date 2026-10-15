import { supabase } from './supabaseClient';
import { nombreCanalUnico } from './canalUnico';

/** Las 6 bases: [{ numero, nombre, lugar }]. `nombre` es temático ("Esperanza"); `lugar`, la ubicación física. */
export async function listarBasesGymkana() {
  const { data, error } = await supabase
    .from('gymkana_bases')
    .select('numero, nombre, lugar')
    .order('numero', { ascending: true });
  if (error) throw error;
  return data;
}

/**
 * Guarda las 6 bases de una vez (una sola petición). Las filas ya existen
 * (el SQL las crea vacías), así que esto solo las actualiza.
 */
export async function guardarBasesGymkana(bases) {
  const filas = bases.map((b) => ({
    numero: b.numero,
    nombre: b.nombre.trim(),
    lugar: b.lugar.trim(),
    actualizado_en: new Date().toISOString(),
  }));
  const { error } = await supabase.from('gymkana_bases').upsert(filas, { onConflict: 'numero' });
  if (error) throw error;
}

export function suscribirseBasesGymkana(onChange) {
  const channel = supabase
    .channel(nombreCanalUnico('gymkana-bases'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'gymkana_bases' }, onChange)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
