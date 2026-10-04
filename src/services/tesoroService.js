import { supabase } from './supabaseClient';
import { nombreCanalUnico } from './canalUnico';

export const BASES_TESORO = Array.from({ length: 10 }, (_, i) => i + 1);

export async function obtenerPuntuacionesTesoro(equipoId) {
  const { data, error } = await supabase
    .from('puntuaciones_tesoro')
    .select('*')
    .eq('equipo_id', equipoId);

  if (error) throw error;
  return data;
}

export async function marcarLlegadaTesoro(equipoId, baseId) {
  const { data, error } = await supabase.rpc('marcar_llegada_tesoro', {
    p_equipo_id: equipoId,
    p_base_id: baseId,
  });
  if (error) throw error;
  return data?.[0];
}

export async function calificarBaseTesoro(equipoId, baseId, puntos) {
  const { data, error } = await supabase.rpc('calificar_base_tesoro', {
    p_equipo_id: equipoId,
    p_base_id: baseId,
    p_puntos: puntos,
  });
  if (error) throw error;
  return data?.[0];
}

export function suscribirseTesoro(equipoId, onChange) {
  const channel = supabase
    .channel(nombreCanalUnico(`tesoro-${equipoId}`))
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'puntuaciones_tesoro',
        filter: `equipo_id=eq.${equipoId}`,
      },
      onChange
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
