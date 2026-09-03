import { supabase } from './supabaseClient';

export async function obtenerMarcadorGeneral() {
  const { data, error } = await supabase
    .from('marcador_general')
    .select('*')
    .order('puntos_generales', { ascending: false });
  if (error) throw error;
  return data;
}

/**
 * Devuelve, por equipo, "en qué base está" ahora mismo, combinando:
 *  - Tesoro: la última base a la que llegó (por fecha de llegada).
 *  - Gymkana: la base pendiente según su ruta fija (rutas_gymkana +
 *    puntuaciones_gymkana), ya que ese módulo ya no registra "llegadas"
 *    sueltas sino enfrentamientos emparejados.
 * Entre ambos módulos, gana el que tenga el evento más reciente.
 */
export async function obtenerUbicaciones() {
  const [rutasRes, gymkanaRes, tesoroRes] = await Promise.all([
    supabase.from('rutas_gymkana').select('equipo_id, orden_bases, creado_en'),
    supabase.from('puntuaciones_gymkana').select('base_id, equipo_a_id, equipo_b_id, finalizado, actualizado_en'),
    supabase.from('puntuaciones_tesoro').select('equipo_id, base_id, fecha'),
  ]);

  if (rutasRes.error) throw rutasRes.error;
  if (gymkanaRes.error) throw gymkanaRes.error;
  if (tesoroRes.error) throw tesoroRes.error;

  const ultimaPorEquipo = {};

  for (const r of tesoroRes.data) {
    const actual = ultimaPorEquipo[r.equipo_id];
    if (!actual || new Date(r.fecha) > new Date(actual.fecha)) {
      ultimaPorEquipo[r.equipo_id] = { equipo_id: r.equipo_id, base_id: r.base_id, fecha: r.fecha, modulo: 'Tesoro' };
    }
  }

  for (const ruta of rutasRes.data) {
    const partidosEquipo = gymkanaRes.data.filter(
      (p) => p.equipo_a_id === ruta.equipo_id || p.equipo_b_id === ruta.equipo_id
    );
    const porBase = new Map(partidosEquipo.map((p) => [p.base_id, p]));
    const recorrido = ruta.orden_bases.map((baseId) => porBase.get(baseId));

    const pendiente = recorrido.find((p) => p && !p.finalizado);
    const baseActual = pendiente ? pendiente.base_id : ruta.orden_bases[ruta.orden_bases.length - 1];

    const ultimoFinalizado = partidosEquipo
      .filter((p) => p.finalizado)
      .sort((a, b) => new Date(b.actualizado_en) - new Date(a.actualizado_en))[0];
    const fecha = ultimoFinalizado?.actualizado_en ?? ruta.creado_en;

    const actual = ultimaPorEquipo[ruta.equipo_id];
    if (!actual || new Date(fecha) > new Date(actual.fecha)) {
      ultimaPorEquipo[ruta.equipo_id] = { equipo_id: ruta.equipo_id, base_id: baseActual, fecha, modulo: 'Gymkana' };
    }
  }

  return ultimaPorEquipo;
}

export function suscribirseVisor(onChange) {
  const channel = supabase
    .channel('visor-general')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rutas_gymkana' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'puntuaciones_gymkana' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'puntuaciones_tesoro' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'partidos_torneo' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ajustes_admin' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'equipos' }, onChange)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
