import { supabase } from './supabaseClient';
import { nombreCanalUnico } from './canalUnico';

// ============================================
// Partidos y tablas (lectura)
// ============================================

/** Filas crudas de partidos_torneo ya confirmados (las usa el resumen de Animación). */
export async function listarPartidos() {
  const { data, error } = await supabase
    .from('partidos_torneo')
    .select('*')
    .eq('borrador', false)
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

/** Tablas de posiciones ya desempatadas: todos los grupos + cuadrangular. */
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

/** Configuración guardada de cada etapa: [{ etapa, config }]. */
export async function listarEtapasTorneo() {
  const { data, error } = await supabase
    .from('torneo_etapas')
    .select('etapa, config, actualizado_en')
    .order('etapa', { ascending: true });
  if (error) throw error;
  return data;
}

export function suscribirseEtapas(onChange) {
  const channel = supabase
    .channel(nombreCanalUnico('etapas-torneo'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'torneo_etapas' }, onChange)
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

/** Equipos del torneo con su macro, grupo (letra), estado (activo / retirado) y datos de W.O. */
export async function listarRosterTorneo() {
  const { data, error } = await supabase
    .from('v_equipos_torneo')
    .select('*')
    .order('grupo', { ascending: true, nullsFirst: false })
    .order('slot', { ascending: true })
    .order('nombre', { ascending: true });
  if (error) throw error;
  return data;
}

function traducirErrorEquipo(error) {
  if (error?.code === '23505') {
    if (String(error.message).includes('uq_equipos_torneo_nombre')) {
      return new Error('Ya existe un equipo del torneo con ese nombre.');
    }
    return new Error('Esa posición ya está ocupada.');
  }
  if (error?.code === '23503') {
    return new Error('No se puede quitar: este equipo ya tiene partidos registrados. Mejor retíralo del torneo.');
  }
  if (error?.code === '42501') {
    return new Error('Tu rol no tiene permiso para modificar los equipos.');
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
// Motor del torneo (Admin y Director Técnico)
// ============================================

async function rpc(nombre, args) {
  const { data, error } = await supabase.rpc(nombre, args);
  if (error) throw error;
  return data;
}

/** Guarda el formato de una etapa (ver CONFIG_DEFECTO en torneoLogica). */
export function guardarConfigEtapa(etapa, config) {
  return rpc('torneo_guardar_config', { p_etapa: etapa, p_config: config });
}

/** Reparte los equipos activos en grupos: 'auto' (evita mismo macro) o 'macro' (un grupo por macro). */
export function repartirGrupos(modo, numGrupos = null) {
  return rpc('torneo_repartir_grupos', { p_modo: modo, p_num_grupos: numGrupos });
}

/** Mueve un equipo a mano a un grupo (null = sin grupo). */
export function asignarGrupo(equipoId, grupo) {
  return rpc('torneo_asignar_grupo', { p_equipo: equipoId, p_grupo: grupo });
}

/** Genera la VISTA PREVIA de una etapa. Devuelve { partidos, ultima_fecha, advertencias }. */
export function generarEtapa(etapa) {
  return rpc('torneo_generar_etapa', { p_etapa: etapa });
}

/** Confirma la vista previa: desde ese momento el público la ve y se puede arbitrar. */
export function confirmarEtapa(etapa) {
  return rpc('torneo_confirmar_etapa', { p_etapa: etapa });
}

export function descartarBorrador() {
  return rpc('torneo_descartar_borrador');
}

/** Borra los partidos de esa etapa y de las siguientes (los equipos y plantillas se conservan). */
export function reiniciarEtapa(etapa) {
  return rpc('torneo_reiniciar_etapa', { p_etapa: etapa });
}

/** Borra todos los partidos y eventos (los equipos y las plantillas se conservan). */
export async function reiniciarFixture() {
  await rpc('torneo_reiniciar_fixture');
}

/** Vuelve a sortear el desempate final de los equipos indicados. */
export async function repetirSorteo(equipoIds) {
  await rpc('torneo_nuevo_sorteo', { p_equipos: equipoIds });
}

/** W.O.: el ganador se lleva el marcador técnico (3-0 por defecto, editable). */
export function declararWO({ partidoId, ganadorId, golesGanador = 3, golesPerdedor = 0, motivo = null }) {
  return rpc('torneo_declarar_wo', {
    p_partido: partidoId,
    p_ganador: ganadorId,
    p_goles_ganador: golesGanador,
    p_goles_perdedor: golesPerdedor,
    p_motivo: motivo,
  });
}

/** Retira un equipo. Si `wo` es true, sus partidos pendientes se pierden por W.O. con ese marcador. */
export function retirarEquipo({ equipoId, motivo = null, wo = true, goles = 3 }) {
  return rpc('torneo_retirar_equipo', {
    p_equipo: equipoId,
    p_motivo: motivo,
    p_wo: wo,
    p_goles: goles,
  });
}

export async function reactivarEquipo(equipoId) {
  await rpc('torneo_reactivar_equipo', { p_equipo: equipoId });
}

export async function editarCruce(partidoId, equipoAId, equipoBId) {
  await rpc('torneo_editar_cruce', { p_partido: partidoId, p_a: equipoAId, p_b: equipoBId });
}

export async function eliminarPartido(partidoId) {
  await rpc('torneo_eliminar_partido', { p_partido: partidoId });
}

export async function moverPartido(partidoId, fecha, cancha) {
  await rpc('torneo_mover_partido', { p_partido: partidoId, p_fecha: fecha, p_cancha: cancha });
}

export function agregarPartido({ etapa, fase, grupo = null, equipoAId, equipoBId, nombre = null }) {
  return rpc('torneo_agregar_partido', {
    p_etapa: etapa,
    p_fase: fase,
    p_grupo: grupo,
    p_a: equipoAId,
    p_b: equipoBId,
    p_nombre: nombre,
  });
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

/** Equipos que pasarían de la etapa 1 a la 2 con la configuración y los resultados actuales. */
export async function listarClasificados() {
  const { data, error } = await supabase.rpc('fn_torneo_clasificados');
  if (error) throw error;
  return data ?? [];
}
