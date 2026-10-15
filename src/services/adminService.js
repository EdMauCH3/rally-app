import { supabase } from './supabaseClient';
import { nombreCanalUnico } from './canalUnico';

// ---------- Marcador / resumen ----------
export async function obtenerMarcadorGeneral() {
  const { data, error } = await supabase
    .from('marcador_general')
    .select('*')
    .order('puntos_generales', { ascending: false });
  if (error) throw error;
  return data;
}

// ---------- Equipos (CRUD) ----------
export async function crearEquipo(nombre, colorHex) {
  const { error } = await supabase
    .from('macro_equipos')
    .insert({ nombre, color_hex: colorHex });
  if (error) throw error;
}

export async function actualizarEquipo(id, { nombre, colorHex }) {
  const { error } = await supabase
    .from('macro_equipos')
    .update({ nombre, color_hex: colorHex })
    .eq('id', id);
  if (error) throw error;
}

export async function eliminarEquipo(id) {
  const { error } = await supabase.from('macro_equipos').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Ajustes manuales ----------
export async function crearAjuste(equipoId, puntosExtra, motivo, creadoPor) {
  const { error } = await supabase.from('ajustes_admin').insert({
    equipo_id: equipoId,
    puntos_extra: puntosExtra,
    motivo,
    creado_por: creadoPor,
  });
  if (error) throw error;
}

export async function listarAjustes() {
  const { data, error } = await supabase
    .from('ajustes_admin')
    .select('id, puntos_extra, motivo, fecha, equipos:macro_equipos(nombre, color_hex)')
    .order('fecha', { ascending: false });
  if (error) throw error;
  return data;
}

// ---------- Gymkana: circuito sincronizado ----------

/** true si el circuito de la Gymkana ya arrancó (hubo al menos una rotación). */
export async function gymkanaEstaIniciada() {
  const { data, error } = await supabase
    .from('gymkana_circuito')
    .select('estado')
    .eq('id', 1)
    .maybeSingle();
  if (error) throw error;
  return !!data && data.estado !== 'esperando';
}

/** Todos los enfrentamientos de Gymkana (para que el Admin pueda editar cualquiera, no solo los marcados en alerta). */
export async function listarPartidosGymkana() {
  const { data, error } = await supabase
    .from('puntuaciones_gymkana')
    .select(
      'id, base_id, ronda, resultado_a, resultado_b, finalizado, requiere_auditoria, equipo_a:equipo_a_id(id, nombre:color_nombre, color_hex), equipo_b:equipo_b_id(id, nombre:color_nombre, color_hex)'
    )
    .order('base_id', { ascending: true });
  if (error) throw error;
  return data;
}

// ---------- Gymkana: alertas / auditoría ----------
// Trae TANTO las pendientes como las ya resueltas (historial). Solo
// se limpian con "Reiniciar Evento". Pendientes primero, luego las
// resueltas más recientes.
export async function listarAlertasGymkana() {
  const { data, error } = await supabase
    .from('puntuaciones_gymkana')
    .select(
      'id, base_id, resultado_a, resultado_b, requiere_auditoria, auditoria_reportada_en, auditoria_resuelta_en, equipo_a:equipo_a_id(id, nombre:color_nombre, color_hex), equipo_b:equipo_b_id(id, nombre:color_nombre, color_hex)'
    )
    .not('auditoria_reportada_en', 'is', null)
    .order('requiere_auditoria', { ascending: false })
    .order('auditoria_reportada_en', { ascending: false });
  if (error) throw error;
  return data;
}

/**
 * Avisa cuando cambia cualquier partido de Gymkana (una alerta nueva, una
 * resuelta, un resultado sellado...). Sirve para que el contador de alertas
 * del Admin se mantenga al día sin recargar.
 */
export function suscribirseAlertasGymkana(onChange) {
  const channel = supabase
    .channel(nombreCanalUnico('admin-alertas-gymkana'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'puntuaciones_gymkana' }, onChange)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function sobrescribirResultadoGymkana(partidoId, resultadoA, resultadoB) {
  const { error } = await supabase.rpc('sobrescribir_resultado_gymkana', {
    p_partido_id: partidoId,
    p_resultado_a: resultadoA,
    p_resultado_b: resultadoB,
  });
  if (error) throw error;
}

// ---------- Reiniciar evento ----------
export async function reiniciarEvento() {
  const { error } = await supabase.rpc('reiniciar_evento');
  if (error) throw error;
}
