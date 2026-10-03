import { supabase } from './supabaseClient';

export async function enviarAlertaAnimador({ nombre, telefono, asunto, creadoPor }) {
  const { error } = await supabase.from('alertas_animador').insert({
    nombre,
    telefono,
    asunto,
    creado_por: creadoPor,
  });
  if (error) throw error;
}

export async function listarAlertasAnimador() {
  const { data, error } = await supabase
    .from('alertas_animador')
    .select('*')
    .order('fecha_creacion', { ascending: false });
  if (error) throw error;
  return data;
}

export async function marcarAlertaAtendida(id) {
  const { error } = await supabase
    .from('alertas_animador')
    .update({ atendida: true })
    .eq('id', id);
  if (error) throw error;
}

export function suscribirseAlertasAnimador(onChange) {
  const channel = supabase
    .channel('alertas-animador')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'alertas_animador' },
      onChange
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
