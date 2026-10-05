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

// ---------- Recorridos y flujo por tinajas ----------

/**
 * El recorrido (orden de tinajas) de UN equipo: [7, 2, 5...]. Solo lo ven el
 * Admin y el staff del Tesoro. null = la búsqueda aún no se ha iniciado.
 */
export async function obtenerRutaTesoro(equipoId) {
  const { data, error } = await supabase
    .from('rutas_tesoro')
    .select('orden_tinajas')
    .eq('equipo_id', equipoId)
    .maybeSingle();
  if (error) throw error;
  return data?.orden_tinajas ?? null;
}

/** Todos los recorridos [{ equipo_id, orden_tinajas }] (Admin y staff del Tesoro). */
export async function listarRutasTesoro() {
  const { data, error } = await supabase.from('rutas_tesoro').select('equipo_id, orden_tinajas');
  if (error) throw error;
  return data;
}

/** Todas las puntuaciones de todos los equipos, para la supervisión del Admin. */
export async function listarPuntuacionesTesoro() {
  const { data, error } = await supabase
    .from('puntuaciones_tesoro')
    .select('*')
    .order('fecha', { ascending: true });
  if (error) throw error;
  return data;
}

/**
 * Progreso público de un equipo: { total, encontradas, completadas, base_id
 * (la última encontrada), tinajas: [las suyas, ordenadas] } o null si la
 * búsqueda aún no tiene recorridos. Nunca incluye el orden ni las pistas.
 */
export async function obtenerProgresoTesoroEquipo(equipoId) {
  const { data, error } = await supabase
    .from('v_ubicacion_tesoro')
    .select('*')
    .eq('equipo_id', equipoId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Genera los recorridos aleatorios y enciende la actividad (solo Admin). */
export async function iniciarBusquedaTesoro() {
  const { error } = await supabase.rpc('iniciar_busqueda_tesoro');
  if (error) throw error;
}

/** Borra recorridos y puntuaciones del Tesoro y la apaga; las pistas se conservan (solo Admin). */
export async function reiniciarBusquedaTesoro() {
  const { error } = await supabase.rpc('reiniciar_busqueda_tesoro');
  if (error) throw error;
}

export async function deshacerLlegadaTesoro(equipoId, baseId) {
  const { data, error } = await supabase.rpc('deshacer_llegada_tesoro', {
    p_equipo_id: equipoId,
    p_base_id: baseId,
  });
  if (error) throw error;
  return data?.[0];
}

/** Solo Admin: corrige el puntaje (1 a 3) de una tinaja ya calificada. */
export async function recalificarTinajaTesoro(equipoId, baseId, puntos) {
  const { data, error } = await supabase.rpc('recalificar_tinaja_tesoro', {
    p_equipo_id: equipoId,
    p_base_id: baseId,
    p_puntos: puntos,
  });
  if (error) throw error;
  return data?.[0];
}

/** Avisa cuando cambia cualquier puntuación o recorrido del Tesoro (de cualquier equipo). */
export function suscribirseTesoroGlobal(onChange) {
  const channel = supabase
    .channel(nombreCanalUnico('tesoro-global'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'puntuaciones_tesoro' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rutas_tesoro' }, onChange)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
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
