import { supabase } from './supabaseClient';
import { nombreCanalUnico } from './canalUnico';

export async function obtenerMarcadorGeneral() {
  const { data, error } = await supabase
    .from('marcador_general')
    .select('*')
    .order('puntos_generales', { ascending: false });
  if (error) throw error;
  return data;
}

export async function obtenerUbicacionesGymkana() {
  const { data, error } = await supabase.from('v_ubicacion_gymkana').select('*');
  if (error) throw error;
  return data;
}

export async function obtenerUbicacionesTesoro() {
  const { data, error } = await supabase.from('v_ubicacion_tesoro').select('*');
  if (error) throw error;
  return data;
}

export function suscribirseVisor(onChange) {
  const channel = supabase
    .channel(nombreCanalUnico('visor-general'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rutas_gymkana' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'puntuaciones_gymkana' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'puntuaciones_tesoro' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'partidos_torneo' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'equipos_torneo' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'torneo_eventos' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ajustes_admin' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'macro_equipos' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'sub_equipos_color' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'estado_actividades_tarde' }, onChange)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
