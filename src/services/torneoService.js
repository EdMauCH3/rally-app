import { supabase } from './supabaseClient';

export async function listarPartidos() {
  const { data, error } = await supabase
    .from('partidos_torneo')
    .select('*')
    .order('partido_num', { ascending: true });
  if (error) throw error;
  return data;
}

export async function generarPartidos() {
  const { error } = await supabase.rpc('generar_partidos_torneo');
  if (error) throw error;
}

export async function finalizarPartido(partidoId, ganador) {
  const { data, error } = await supabase.rpc('finalizar_partido', {
    p_partido_id: partidoId,
    p_ganador: ganador, // 'equipo_a' | 'empate' | 'equipo_b'
  });
  if (error) throw error;
  return data?.[0];
}

export function suscribirsePartidos(onChange) {
  const channel = supabase
    .channel('partidos-torneo')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'partidos_torneo' },
      onChange
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ============================================
// Roster de equipos del Torneo (generales seleccionados + exclusivos)
// ============================================

export async function listarEquiposGenerales() {
  const { data, error } = await supabase
    .from('equipos')
    .select('id, nombre, color_hex')
    .order('nombre', { ascending: true });
  if (error) throw error;
  return data;
}

export async function listarRosterTorneo() {
  const { data, error } = await supabase
    .from('v_equipos_torneo')
    .select('*')
    .order('creado_en', { ascending: true });
  if (error) throw error;
  return data;
}

export async function agregarEquipoGeneralATorneo(equipoGeneralId) {
  const { error } = await supabase
    .from('equipos_torneo')
    .insert({ equipo_general_id: equipoGeneralId, es_exclusivo: false });
  if (error) throw error;
}

export async function crearEquipoExclusivoTorneo(nombre, colorHex) {
  const { error } = await supabase
    .from('equipos_torneo')
    .insert({ nombre, color_hex: colorHex, es_exclusivo: true });
  if (error) throw error;
}

/**
 * Sirve tanto para quitar un equipo general del torneo como para
 * eliminar uno exclusivo — en ambos casos es la misma fila de
 * equipos_torneo. Si ya tiene partidos registrados, Postgres rechaza
 * el borrado por la FK (violación 23503) y lo traducimos a un mensaje
 * claro en vez de dejar pasar el código de error crudo.
 */
export async function quitarEquipoDelTorneo(equipoTorneoId) {
  const { error } = await supabase.from('equipos_torneo').delete().eq('id', equipoTorneoId);
  if (error) {
    if (error.code === '23503') {
      throw new Error(
        'No se puede quitar: este equipo ya tiene partidos registrados en el torneo.'
      );
    }
    throw error;
  }
}

export function suscribirseRosterTorneo(onChange) {
  const channel = supabase
    .channel('roster-torneo')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'equipos_torneo' },
      onChange
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
