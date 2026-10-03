import { supabase } from './supabaseClient';

/**
 * Trae la ruta fija del equipo (rival + orden de bases) y el estado de
 * cada enfrentamiento de esa ruta, y devuelve el partido "actual"
 * (el primero de la ruta que aún no está finalizado).
 *
 * Devuelve null si la Gymkana todavía no fue iniciada por el Admin.
 */
export async function obtenerEstadoGymkana(equipoId) {
  const { data: ruta, error: errorRuta } = await supabase
    .from('rutas_gymkana')
    .select('equipo_id, rival_id, pareja_num, orden_bases, rival:rival_id(id, nombre:color_nombre, color_hex)')
    .eq('equipo_id', equipoId)
    .maybeSingle();

  if (errorRuta) throw errorRuta;
  if (!ruta) return null;

  const { data: partidos, error: errorPartidos } = await supabase
    .from('puntuaciones_gymkana')
    .select('*')
    .in('base_id', ruta.orden_bases)
    .or(`equipo_a_id.eq.${equipoId},equipo_b_id.eq.${equipoId}`);

  if (errorPartidos) throw errorPartidos;

  // Ordenamos los partidos según el recorrido propio del equipo, no por base_id.
  const partidosPorBase = new Map(partidos.map((p) => [p.base_id, p]));
  const recorrido = ruta.orden_bases.map((baseId) => partidosPorBase.get(baseId));

  const actualIndex = recorrido.findIndex((p) => p && !p.finalizado);
  const actual = actualIndex === -1 ? null : recorrido[actualIndex];

  return {
    rival: ruta.rival,
    parejaNum: ruta.pareja_num,
    ordenBases: ruta.orden_bases,
    recorrido, // en el orden que le toca a este equipo
    actual, // partido pendiente de calificar (o null si ya terminó las 6 bases)
    actualIndex,
    completadas: recorrido.filter((p) => p?.finalizado).length,
  };
}

/**
 * El Animador marca el resultado desde su propia perspectiva
 * ('gano' | 'empato' | 'perdio'). El backend calcula el resultado
 * inverso para el rival y sella el enfrentamiento para ambos.
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

/** Reporta un error/alerta sobre una base ya sellada, para que el Admin la revise. */
export async function reportarAlertaGymkana(partidoId) {
  const { error } = await supabase.rpc('reportar_alerta_gymkana', {
    p_partido_id: partidoId,
  });
  if (error) throw error;
}

/**
 * Se suscribe a cambios en puntuaciones_gymkana. La tabla es pequeña
 * (2 parejas x 6 bases = 12 filas en todo el evento), así que no hace
 * falta filtrar por equipo: cualquier cambio recarga el estado del
 * equipo seleccionado en la pantalla.
 */
export function suscribirseGymkana(onChange) {
  const channel = supabase
    .channel('gymkana-puntuaciones')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'puntuaciones_gymkana' },
      onChange
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
