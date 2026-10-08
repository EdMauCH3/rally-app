import { supabase } from './supabaseClient';
import { nombreCanalUnico } from './canalUnico';

// ============================================
// Partidos y tablas (lectura)
// ============================================

/** Filas crudas de partidos_torneo (las usa el resumen de Animación). */
export async function listarPartidos() {
  const { data, error } = await supabase
    .from('partidos_torneo')
    .select('*')
    .order('partido_num', { ascending: true });
  if (error) throw error;
  return data;
}

/** Partidos con nombres/colores de equipo y macro, marcador, penales y estado. */
export async function listarPartidosFases() {
  const { data, error } = await supabase
    .from('v_torneo_partidos')
    .select('*')
    .order('partido_num', { ascending: true });
  if (error) throw error;
  return data;
}

/** Tablas de posiciones ya desempatadas: 4 grupos + cuadrangular. */
export async function listarTablasTorneo() {
  const { data, error } = await supabase
    .from('v_torneo_tabla')
    .select('*')
    .order('fase', { ascending: true })
    .order('grupo', { ascending: true })
    .order('pos', { ascending: true });
  if (error) throw error;
  return data;
}

export function suscribirsePartidos(onChange) {
  const channel = supabase
    .channel(nombreCanalUnico('partidos-torneo'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'partidos_torneo' }, onChange)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ============================================
// Equipos del torneo (siempre pertenecen a un macro-equipo)
// ============================================

export async function listarMacrosTorneo() {
  const { data, error } = await supabase
    .from('macro_equipos')
    .select('id, nombre, color_hex, fecha_creacion')
    .order('fecha_creacion', { ascending: true })
    .order('id', { ascending: true });
  if (error) throw error;
  return data;
}

/** Equipos del torneo con su macro, grupo (letra) y posición dentro del grupo. */
export async function listarRosterTorneo() {
  const { data, error } = await supabase
    .from('v_equipos_torneo')
    .select('*')
    .order('grupo', { ascending: true })
    .order('slot', { ascending: true });
  if (error) throw error;
  return data;
}

function traducirErrorEquipo(error) {
  if (error?.code === '23505') {
    if (String(error.message).includes('uq_equipos_torneo_nombre')) {
      return new Error('Ya existe un equipo del torneo con ese nombre.');
    }
    return new Error('Esa posición del grupo ya está ocupada.');
  }
  if (error?.code === '23503') {
    return new Error('No se puede quitar: este equipo ya tiene partidos registrados en el torneo.');
  }
  return error;
}

export async function crearEquipoTorneo({ nombre, colorHex, descripcion, macroEquipoId }) {
  const { error } = await supabase.from('equipos_torneo').insert({
    nombre: nombre.trim(),
    color_hex: colorHex,
    descripcion: (descripcion ?? '').trim(),
    macro_equipo_id: macroEquipoId,
  });
  if (error) throw traducirErrorEquipo(error);
}

/** Nombre, color y descripción se pueden editar siempre; el macro solo antes de generar el fixture. */
export async function actualizarEquipoTorneo(id, { nombre, colorHex, descripcion, macroEquipoId }) {
  const cambios = {
    nombre: nombre.trim(),
    color_hex: colorHex,
    descripcion: (descripcion ?? '').trim(),
  };
  if (macroEquipoId) cambios.macro_equipo_id = macroEquipoId;
  const { error } = await supabase.from('equipos_torneo').update(cambios).eq('id', id);
  if (error) throw traducirErrorEquipo(error);
}

export async function quitarEquipoDelTorneo(equipoTorneoId) {
  const { error } = await supabase.from('equipos_torneo').delete().eq('id', equipoTorneoId);
  if (error) throw traducirErrorEquipo(error);
}

/** Cambia la posición (1-3) dentro del grupo; intercambia con quien la ocupe. */
export async function moverEquipoTorneo(equipoTorneoId, slot) {
  const { error } = await supabase.rpc('torneo_mover_equipo', {
    p_equipo: equipoTorneoId,
    p_slot: slot,
  });
  if (error) throw error;
}

export function suscribirseRosterTorneo(onChange) {
  const channel = supabase
    .channel(nombreCanalUnico('roster-torneo'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'equipos_torneo' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'macro_equipos' }, onChange)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ============================================
// Fixture (solo Admin)
// ============================================

/** Crea los 20 partidos. `duracionSegundos` = tiempo reglamentario de cada partido. */
export async function generarFixture(duracionSegundos = 600) {
  const { error } = await supabase.rpc('torneo_generar_fixture', {
    p_duracion_segundos: duracionSegundos,
  });
  if (error) throw error;
}

/** Borra partidos y eventos (los equipos y las plantillas se conservan). */
export async function reiniciarFixture() {
  const { error } = await supabase.rpc('torneo_reiniciar_fixture');
  if (error) throw error;
}

/** Vuelve a sortear el desempate final de los equipos indicados. */
export async function repetirSorteo(equipoIds) {
  const { error } = await supabase.rpc('torneo_nuevo_sorteo', { p_equipos: equipoIds });
  if (error) throw error;
}

/** Hora programada del partido (ISO) o null para quitarla. */
export async function programarPartido(partidoId, horaIso) {
  const { error } = await supabase
    .from('partidos_torneo')
    .update({ hora_programada: horaIso })
    .eq('id', partidoId);
  if (error) throw error;
}

/** Puntos que el torneo le aporta a cada macro-equipo (ya con las rojas descontadas). */
export async function listarPuntosTorneoMacros() {
  const { data, error } = await supabase
    .from('marcador_general')
    .select('equipo_id, nombre, color_hex, total_torneo');
  if (error) throw error;
  return data;
}
