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

// Cada suscripción necesita su PROPIO canal: AdminPage (badge de conteo)
// y AlertasAnimadorAdminPanel (la lista) escuchan esta tabla al mismo
// tiempo, y Supabase no permite agregar callbacks a un canal con el
// mismo nombre que ya esté suscrito.
let contadorCanales = 0;

export function suscribirseAlertasAnimador(onChange) {
  contadorCanales += 1;
  const channel = supabase
    .channel(`alertas-animador-${contadorCanales}`)
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
