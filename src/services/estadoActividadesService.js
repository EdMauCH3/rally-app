import { supabase } from './supabaseClient';
import { nombreCanalUnico } from './canalUnico';

export async function listarEstadoActividades() {
  const { data, error } = await supabase.from('estado_actividades_tarde').select('*');
  if (error) throw error;
  return data;
}

export async function actualizarEstadoActividad(actividad, iniciada) {
  const cambios = { iniciada, actualizado_en: new Date().toISOString() };
  // Apagar una actividad también quita su pausa: al volver a encenderla arranca limpia.
  if (!iniciada) {
    cambios.pausada = false;
    cambios.pausada_en = null;
  }
  const { error } = await supabase
    .from('estado_actividades_tarde')
    .update(cambios)
    .eq('actividad', actividad);
  if (error) throw error;
}

/**
 * Pausa o reanuda una actividad (solo Admin). Mientras está pausada el servidor
 * rechaza cualquier registro del staff, y todas las pantallas muestran el aviso.
 */
export async function establecerPausaActividad(actividad, pausada) {
  const { error } = await supabase.rpc('establecer_pausa_actividad', {
    p_actividad: actividad,
    p_pausada: pausada,
  });
  if (error) throw error;
}

export function suscribirseEstadoActividades(onChange) {
  const channel = supabase
    .channel(nombreCanalUnico('estado-actividades-tarde'))
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
