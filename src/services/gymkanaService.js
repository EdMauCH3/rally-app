import { supabase } from './supabaseClient';

/**
 * Califica el cruce de una base. El juez marca quién ganó desde la perspectiva de
 * un equipo ('gano' | 'empato' | 'perdio'); el servidor calcula el resultado del
 * rival y sella el cruce para ambos. Un cruce ya calificado no se puede volver a
 * calificar (devuelve ya_bloqueado).
 */
export async function sellarResultadoGymkana(partidoId, equipoId, resultado) {
  const { data, error } = await supabase.rpc('sellar_resultado_gymkana', {
    p_partido_id: partidoId,
    p_equipo_id: equipoId,
    p_resultado: resultado,
  });
  if (error) throw error;
  return data?.[0];
}

/** Reporta un error/alerta sobre una base ya sellada, para que la coordinación lo revise. */
export async function reportarAlertaGymkana(partidoId) {
  const { error } = await supabase.rpc('reportar_alerta_gymkana', {
    p_partido_id: partidoId,
  });
  if (error) throw error;
}
