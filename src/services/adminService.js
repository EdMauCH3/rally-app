import { supabase } from './supabaseClient';

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
    .from('equipos')
    .insert({ nombre, color_hex: colorHex });
  if (error) throw error;
}

export async function actualizarEquipo(id, { nombre, colorHex }) {
  const { error } = await supabase
    .from('equipos')
    .update({ nombre, color_hex: colorHex })
    .eq('id', id);
  if (error) throw error;
}

export async function eliminarEquipo(id) {
  const { error } = await supabase.from('equipos').delete().eq('id', id);
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
    .select('id, puntos_extra, motivo, fecha, equipos(nombre, color_hex)')
    .order('fecha', { ascending: false });
  if (error) throw error;
  return data;
}

// ---------- Gymkana: rutas y emparejamiento ----------

/** true si el Admin ya presionó "Iniciar Gymkana" (existen rutas guardadas). */
export async function gymkanaEstaIniciada() {
  const { count, error } = await supabase
    .from('rutas_gymkana')
    .select('equipo_id', { count: 'exact', head: true });
  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function listarRutasGymkana() {
  const { data, error } = await supabase
    .from('rutas_gymkana')
    .select('equipo_id, pareja_num, orden_bases, equipo:equipo_id(id, nombre, color_hex), rival:rival_id(id, nombre, color_hex)')
    .order('pareja_num', { ascending: true });
  if (error) throw error;
  return data;
}

/**
 * Sortea los 4 equipos en 2 parejas fijas y les asigna un recorrido de
 * bases que no se cruza (la pareja 2 arranca donde la pareja 1 termina
 * la primera mitad, y viceversa). El sorteo se hace acá, en el
 * cliente; el guardado en Supabase es una sola llamada atómica
 * (guardar_rutas_gymkana) para que las 4 rutas + los 12 enfrentamientos
 * queden creados juntos o no se cree nada.
 */
export async function iniciarGymkana(equipos) {
  if (equipos.length !== 4) {
    throw new Error(`Se necesitan exactamente 4 equipos para iniciar la Gymkana (hay ${equipos.length}).`);
  }

  // Fisher-Yates
  const barajados = [...equipos];
  for (let i = barajados.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [barajados[i], barajados[j]] = [barajados[j], barajados[i]];
  }

  const BASES = [1, 2, 3, 4, 5, 6];
  const mitad = BASES.length / 2; // 3
  const ordenPareja1 = BASES;
  const ordenPareja2 = [...BASES.slice(mitad), ...BASES.slice(0, mitad)]; // [4,5,6,1,2,3]

  const pares = [
    {
      pareja_num: 1,
      equipos: [barajados[0].id, barajados[1].id],
      orden_bases: ordenPareja1,
    },
    {
      pareja_num: 2,
      equipos: [barajados[2].id, barajados[3].id],
      orden_bases: ordenPareja2,
    },
  ];

  const { error } = await supabase.rpc('guardar_rutas_gymkana', { p_pares: pares });
  if (error) throw error;

  return pares.map((p) => ({
    parejaNum: p.pareja_num,
    equipos: p.equipos.map((id) => equipos.find((e) => e.id === id)),
    ordenBases: p.orden_bases,
  }));
}

/** Todos los enfrentamientos de Gymkana (para que el Admin pueda editar cualquiera, no solo los marcados en alerta). */
export async function listarPartidosGymkana() {
  const { data, error } = await supabase
    .from('puntuaciones_gymkana')
    .select(
      'id, base_id, resultado_a, resultado_b, finalizado, requiere_auditoria, equipo_a:equipo_a_id(id, nombre, color_hex), equipo_b:equipo_b_id(id, nombre, color_hex)'
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
      'id, base_id, resultado_a, resultado_b, requiere_auditoria, auditoria_reportada_en, auditoria_resuelta_en, equipo_a:equipo_a_id(id, nombre, color_hex), equipo_b:equipo_b_id(id, nombre, color_hex)'
    )
    .not('auditoria_reportada_en', 'is', null)
    .order('requiere_auditoria', { ascending: false })
    .order('auditoria_reportada_en', { ascending: false });
  if (error) throw error;
  return data;
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
