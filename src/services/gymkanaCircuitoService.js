import { supabase } from './supabaseClient';
import { nombreCanalUnico } from './canalUnico';

/**
 * Circuito general de la Gymkana: UNA fila con la ronda en curso, el instante
 * en que se autorizó la rotación y su duración. Cada pantalla calcula su propia
 * cuenta regresiva con esos dos datos; el servidor no se consulta por segundo.
 */
export async function obtenerCircuito() {
  const { data, error } = await supabase
    .from('gymkana_circuito')
    .select('estado, ronda_actual, inicio_rotacion_at, duracion_minutos, ultima_base, actualizado_en')
    .eq('id', 1)
    .maybeSingle();
  if (error) throw error;
  return (
    data ?? {
      estado: 'esperando',
      ronda_actual: 0,
      inicio_rotacion_at: null,
      duracion_minutos: 20,
      ultima_base: false,
    }
  );
}

/** Todos los cruces del circuito (máximo 24 filas en todo el evento). */
export async function listarCrucesGymkana() {
  const { data, error } = await supabase
    .from('puntuaciones_gymkana')
    .select(
      'id, base_id, equipo_a_id, equipo_b_id, ronda, resultado_a, resultado_b, finalizado, requiere_auditoria, actualizado_en'
    )
    .order('ronda', { ascending: true })
    .order('base_id', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/**
 * Autoriza una rotación. `duelos` ya viene validado por el motor de
 * emparejamiento, pero el servidor vuelve a exigir todas las reglas.
 * Devuelve { ok, mensaje, ronda_nueva, pendientes }.
 */
export async function rotarEquiposGymkana({ duracion, ultima, duelos, forzar = false }) {
  const { data, error } = await supabase.rpc('gymkana_rotar', {
    p_duracion: duracion,
    p_ultima: !!ultima,
    p_duelos: duelos,
    p_forzar: forzar,
  });
  if (error) throw error;
  return data?.[0];
}

/** Cambia el tiempo de la ronda en curso y/o declara la última base. */
export async function ajustarRondaGymkana({ duracion = null, ultima = null }) {
  const { error } = await supabase.rpc('gymkana_ajustar_ronda', {
    p_duracion: duracion,
    p_ultima: ultima,
  });
  if (error) throw error;
}

/** Realtime: un aviso solo cuando el coordinador cambia de fase o alguien califica. */
export function suscribirseCircuito(onChange) {
  const channel = supabase
    .channel(nombreCanalUnico('gymkana-circuito'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'gymkana_circuito' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'puntuaciones_gymkana' }, onChange)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
