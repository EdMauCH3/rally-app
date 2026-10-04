import { supabase } from './supabaseClient';
import { nombreCanalUnico } from './canalUnico';

export async function obtenerConfiguracionApp() {
  const { data, error } = await supabase
    .from('configuracion_app')
    .select('*')
    .eq('id', 1)
    .single();
  if (error) throw error;
  return data;
}

export async function actualizarConfiguracionApp(cambios) {
  const { error } = await supabase
    .from('configuracion_app')
    .update({ ...cambios, actualizado_en: new Date().toISOString() })
    .eq('id', 1);
  if (error) throw error;
}

export function suscribirseConfiguracionApp(onChange) {
  const channel = supabase
    .channel(nombreCanalUnico('configuracion-app'))
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'configuracion_app' },
      onChange
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
