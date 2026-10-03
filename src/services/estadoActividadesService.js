import { supabase } from './supabaseClient';

export async function listarEstadoActividades() {
  const { data, error } = await supabase.from('estado_actividades_tarde').select('*');
  if (error) throw error;
  return data;
}

export async function actualizarEstadoActividad(actividad, iniciada) {
  const { error } = await supabase
    .from('estado_actividades_tarde')
    .update({ iniciada, actualizado_en: new Date().toISOString() })
    .eq('actividad', actividad);
  if (error) throw error;
}

export function suscribirseEstadoActividades(onChange) {
  const channel = supabase
    .channel('estado-actividades-tarde')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'estado_actividades_tarde' },
      onChange
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
