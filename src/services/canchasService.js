import { supabase } from './supabaseClient';
import { nombreCanalUnico } from './canalUnico';

// Lugares de juego del torneo (Coliseo, Cancha Azul… y los que el Admin / DT agregue ese día).

export async function listarCanchas() {
  const { data, error } = await supabase
    .from('canchas_torneo')
    .select('id, nombre, color, activa, orden')
    .order('orden', { ascending: true })
    .order('id', { ascending: true });
  if (error) throw error;
  return data;
}

export function suscribirseCanchas(onChange) {
  const channel = supabase
    .channel(nombreCanalUnico('canchas-torneo'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'canchas_torneo' }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

async function rpc(nombre, args) {
  const { data, error } = await supabase.rpc(nombre, args);
  if (error) throw error;
  return data;
}

/** Crea (id null) o edita un lugar. Devuelve { id, pendientes }. */
export function guardarCancha({ id = null, nombre, color, activa = true }) {
  return rpc('torneo_guardar_cancha', { p_id: id, p_nombre: nombre, p_color: color, p_activa: activa });
}

export function eliminarCancha(id) {
  return rpc('torneo_eliminar_cancha', { p_id: id });
}

/** Pasa los partidos pendientes de un lugar a otro. Devuelve cuántos movió. */
export function reasignarCanchas(desde, hacia) {
  return rpc('torneo_reasignar_canchas', { p_desde: desde, p_hacia: hacia });
}

/** Reparte los partidos pendientes de cada fecha entre los lugares activos. Devuelve cuántos cambió. */
export function redistribuirCanchas() {
  return rpc('torneo_redistribuir_canchas', {});
}

/** Partido adicional: suma al Macro-equipo, no cuenta para el campeonato. */
export function agregarAdicional({ equipoAId, equipoBId, nombre = null, cancha = null, horaIso = null, minutos = 10 }) {
  return rpc('torneo_agregar_adicional', {
    p_a: equipoAId,
    p_b: equipoBId,
    p_nombre: nombre,
    p_cancha: cancha,
    p_hora: horaIso,
    p_minutos: minutos,
  });
}
