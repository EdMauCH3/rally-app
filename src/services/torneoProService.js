import { supabase } from './supabaseClient';
import { nombreCanalUnico } from './canalUnico';

// ---------- Lectura ----------

/** Partidos con marcador (goles), estado y hora del servidor. */
export async function listarPartidosPro() {
  const { data, error } = await supabase
    .from('v_torneo_partidos')
    .select('*')
    .order('partido_num', { ascending: true });
  if (error) throw error;
  return data;
}

export async function listarEventosTorneo() {
  const { data, error } = await supabase
    .from('torneo_eventos')
    .select('*')
    .order('minuto', { ascending: true })
    .order('creado_en', { ascending: true });
  if (error) throw error;
  return data;
}

export async function listarJugadoresTorneo() {
  const { data, error } = await supabase
    .from('torneo_jugadores')
    .select('*')
    .order('dorsal', { ascending: true });
  if (error) throw error;
  return data;
}

/**
 * Jugadores con sus estadísticas y si están sancionados (y para qué
 * partido). Sale de la vista que calcula las sanciones.
 */
export async function listarEstadoJugadores() {
  const { data, error } = await supabase
    .from('v_torneo_jugadores_estado')
    .select('*')
    .order('dorsal', { ascending: true });
  if (error) throw error;
  return data;
}

// ---------- Inscripción de jugadores (árbitro y Admin; la RLS lo permite) ----------

export async function crearJugador({ equipoTorneoId, nombre, dorsal }) {
  const { error } = await supabase
    .from('torneo_jugadores')
    .insert({ equipo_torneo_id: equipoTorneoId, nombre, dorsal });
  if (error) throw error;
}

export async function actualizarJugador(id, { nombre, dorsal }) {
  const { error } = await supabase
    .from('torneo_jugadores')
    .update({ nombre, dorsal })
    .eq('id', id);
  if (error) throw error;
}

export async function eliminarJugador(id) {
  const { error } = await supabase.from('torneo_jugadores').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Correcciones del Admin (escritura directa, la RLS lo permite) ----------
// El trigger de la base valida que el equipo juegue ese partido y que el
// jugador sea de ese equipo; y si el partido ya terminó, recalcula solo
// el resultado y los puntos.

export async function crearEventoAdmin({
  partidoId,
  tipo,
  jugadorId,
  equipoTorneoId,
  minuto,
  autogol,
}) {
  const { error } = await supabase.from('torneo_eventos').insert({
    partido_id: partidoId,
    tipo,
    jugador_id: jugadorId,
    equipo_torneo_id: equipoTorneoId,
    minuto,
    autogol: tipo === 'gol' ? Boolean(autogol) : false,
  });
  if (error) throw error;
}

export async function actualizarEventoAdmin(
  id,
  { tipo, jugadorId, equipoTorneoId, minuto, autogol }
) {
  const { error } = await supabase
    .from('torneo_eventos')
    .update({
      tipo,
      jugador_id: jugadorId,
      equipo_torneo_id: equipoTorneoId,
      minuto,
      autogol: tipo === 'gol' ? Boolean(autogol) : false,
    })
    .eq('id', id);
  if (error) throw error;
}

export async function eliminarEventoAdmin(id) {
  const { error } = await supabase.from('torneo_eventos').delete().eq('id', id);
  if (error) throw error;
}

/** Solo Admin: reabre un partido finalizado por error. */
export async function reabrirPartido(partidoId) {
  const { error } = await supabase.rpc('torneo_reabrir_partido', {
    p_partido_id: partidoId,
  });
  if (error) throw error;
}

// ---------- Operación del partido en vivo (árbitro) ----------
// Todas llaman a funciones del servidor, que validan el rol, que el
// Modo Pro esté encendido, las sanciones, etc. (ver sql/26).

export async function obtenerPartidoPro(partidoId) {
  const { data, error } = await supabase
    .from('v_torneo_partidos')
    .select('*')
    .eq('id', partidoId)
    .single();
  if (error) throw error;
  return data;
}

export async function listarEventosDePartido(partidoId) {
  const { data, error } = await supabase
    .from('torneo_eventos')
    .select('*')
    .eq('partido_id', partidoId)
    .order('minuto', { ascending: true })
    .order('creado_en', { ascending: true });
  if (error) throw error;
  return data;
}

export async function listarEstadoJugadoresDeEquipos(equipoIds) {
  const { data, error } = await supabase
    .from('v_torneo_jugadores_estado')
    .select('*')
    .in('equipo_torneo_id', equipoIds)
    .order('dorsal', { ascending: true });
  if (error) throw error;
  return data;
}

export async function configurarTiempoPartido(partidoId, segundos) {
  const { error } = await supabase.rpc('torneo_configurar_tiempo', {
    p_partido_id: partidoId,
    p_duracion_segundos: segundos,
  });
  if (error) throw error;
}

export async function iniciarRelojPartido(partidoId) {
  const { error } = await supabase.rpc('torneo_iniciar_reloj', { p_partido_id: partidoId });
  if (error) throw error;
}

export async function pausarRelojPartido(partidoId) {
  const { error } = await supabase.rpc('torneo_pausar_reloj', { p_partido_id: partidoId });
  if (error) throw error;
}

export async function ajustarRelojPartido(partidoId, segundos) {
  const { error } = await supabase.rpc('torneo_ajustar_reloj', {
    p_partido_id: partidoId,
    p_segundos: segundos,
  });
  if (error) throw error;
}

/** Devuelve { ok, mensaje }: ok=false cuando el servidor lo rechaza (p. ej. jugador sancionado). */
export async function registrarEventoPartido({ partidoId, tipo, jugadorId, autogol = false }) {
  const { data, error } = await supabase.rpc('torneo_registrar_evento', {
    p_partido_id: partidoId,
    p_tipo: tipo,
    p_jugador_id: jugadorId,
    p_autogol: autogol,
  });
  if (error) throw error;
  return data?.[0];
}

export async function deshacerUltimoEventoPartido(partidoId) {
  const { data, error } = await supabase.rpc('torneo_deshacer_ultimo_evento', {
    p_partido_id: partidoId,
  });
  if (error) throw error;
  return data?.[0];
}

export async function finalizarPartidoPro(partidoId) {
  const { data, error } = await supabase.rpc('torneo_finalizar_partido', {
    p_partido_id: partidoId,
  });
  if (error) throw error;
  return data?.[0];
}

// ---------- Realtime ----------

export function suscribirseTorneoPro(onChange) {
  const channel = supabase
    .channel(nombreCanalUnico('torneo-pro'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'torneo_eventos' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'partidos_torneo' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'torneo_jugadores' }, onChange)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
