import { supabase } from './supabaseClient';

export async function obtenerConfiguracion() {
  const { data, error } = await supabase
    .from('colores_configuracion')
    .select('*')
    .eq('id', 1)
    .single();
  if (error) throw error;
  return data;
}

export async function listarBases() {
  const { data, error } = await supabase
    .from('colores_bases')
    .select('*')
    .order('orden', { ascending: true });
  if (error) throw error;
  return data;
}

export async function listarEquipos() {
  const { data, error } = await supabase
    .from('colores_equipos')
    .select('*')
    .order('orden', { ascending: true });
  if (error) throw error;
  return data;
}

/**
 * bases: [{ nombre, lugar }]
 * equipos: [{ nombre, color_hex }]
 * duracionSegundos: number
 */
export async function iniciarRotacion({ bases, equipos, duracionSegundos }) {
  const { error } = await supabase.rpc('iniciar_rotacion_colores', {
    p_bases: bases,
    p_equipos: equipos,
    p_duracion_segundos: duracionSegundos,
  });
  if (error) throw error;
}

export async function rotarSiguienteBase() {
  const config = await obtenerConfiguracion();
  const nuevoTiempoFin = new Date(Date.now() + config.duracion_segundos * 1000).toISOString();

  const { error } = await supabase
    .from('colores_configuracion')
    .update({
      ronda_actual: config.ronda_actual + 1,
      tiempo_fin: nuevoTiempoFin,
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', 1);
  if (error) throw error;
}

export async function marcarUltimaBase(valor) {
  const { error } = await supabase
    .from('colores_configuracion')
    .update({ ultima_base: valor, actualizado_en: new Date().toISOString() })
    .eq('id', 1);
  if (error) throw error;
}

export async function terminarRotacion() {
  const { error } = await supabase
    .from('colores_configuracion')
    .update({ estado: 'terminado', actualizado_en: new Date().toISOString() })
    .eq('id', 1);
  if (error) throw error;
}

export async function reiniciarConfiguracion() {
  const { error } = await supabase.rpc('reiniciar_rotacion_colores');
  if (error) throw error;
}

export function suscribirseColores(onChange) {
  const channel = supabase
    .channel('colores-admin')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'colores_configuracion' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'colores_bases' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'colores_equipos' }, onChange)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
