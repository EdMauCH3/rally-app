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
    .select('equipo_id, pareja_num, orden_bases, equipo:equipo_id(id, nombre:color_nombre, color_hex), rival:rival_id(id, nombre:color_nombre, color_hex)')
    .order('pareja_num', { ascending: true });
  if (error) throw error;
  return data;
}

/**
 * Arma las 4 duplas de la Gymkana a partir de los 8 sub-equipos (2 por color).
 *
 * Reglas:
 *  - Nunca se enfrentan dos escuadras del mismo color.
 *  - Las duplas son estables: la misma dupla juega las 6 bases contra el mismo rival,
 *    así nadie se desfasa por tiempos distintos.
 *  - Los 4 colores se sortean y se cruzan así (A, B, C, D = colores sorteados):
 *        dupla 1: A1 vs B1      dupla 2: C1 vs D1
 *        dupla 3: A2 vs C2      dupla 4: B2 vs D2
 *    Cada escuadra tiene un rival de otro color y todas completan las 6 bases.
 *  - Cada dupla arranca en una base distinta (1, 3, 4 y 6) y recorre las 6 en círculo:
 *    en una misma ronda las 4 duplas siempre están en 4 bases diferentes (nunca chocan).
 *
 * El guardado en Supabase es una sola llamada atómica (guardar_rutas_gymkana, SQL 43):
 * las 8 rutas + los 24 enfrentamientos se crean juntos o no se crea nada.
 */
export const INICIO_BASE_POR_DUPLA = [1, 3, 4, 6];

function ordenDesde(inicio) {
  return Array.from({ length: 6 }, (_, i) => ((inicio - 1 + i) % 6) + 1);
}

export function armarDuplasGymkana(equipos) {
  if (equipos.length !== 8) {
    throw new Error(
      `Se necesitan 8 sub-equipos para iniciar la Gymkana (2 por cada uno de los 4 colores); hay ${equipos.length}.`
    );
  }

  const porMacro = new Map();
  for (const e of equipos) {
    if (!porMacro.has(e.macro_equipo_id)) porMacro.set(e.macro_equipo_id, {});
    porMacro.get(e.macro_equipo_id)[e.subgrupo ?? 1] = e;
  }
  const macros = [...porMacro.values()];
  if (macros.length !== 4 || macros.some((m) => !m[1] || !m[2])) {
    throw new Error('Cada uno de los 4 Macro-equipos necesita su color de Gymkana con dos escuadras.');
  }

  // Fisher-Yates sobre los colores.
  for (let i = macros.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [macros[i], macros[j]] = [macros[j], macros[i]];
  }
  const [A, B, C, D] = macros;

  const cruces = [
    [A[1], B[1]],
    [C[1], D[1]],
    [A[2], C[2]],
    [B[2], D[2]],
  ];

  return cruces.map(([x, y], i) => ({
    pareja_num: i + 1,
    equipos: [x.id, y.id],
    orden_bases: ordenDesde(INICIO_BASE_POR_DUPLA[i]),
  }));
}

export async function iniciarGymkana(equipos) {
  const pares = armarDuplasGymkana(equipos);

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
      'id, base_id, resultado_a, resultado_b, finalizado, requiere_auditoria, equipo_a:equipo_a_id(id, nombre:color_nombre, color_hex), equipo_b:equipo_b_id(id, nombre:color_nombre, color_hex)'
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
