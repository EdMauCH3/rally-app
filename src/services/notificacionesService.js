import { supabase } from './supabaseClient';

/**
 * Para cuando un usuario carga/recarga la app mientras ya hay una
 * notificacion permanente activa (enviada antes de que entrara).
 */
export async function obtenerNotificacionPermanenteActiva() {
  const { data, error } = await supabase
    .from('notificaciones_globales')
    .select('*')
    .eq('tipo', 'permanente')
    .eq('estado_activa', true)
    .order('fecha_creacion', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function suscribirseNotificacionesGlobales({ onInsert, onUpdate }) {
  const channel = supabase
    .channel('notificaciones-globales-listener')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notificaciones_globales' },
      (payload) => onInsert?.(payload.new)
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'notificaciones_globales' },
      (payload) => onUpdate?.(payload.new)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ============================================
// Admin: enviar, listar historial, apagar la permanente activa
// ============================================

export async function enviarNotificacion({ titulo, mensaje, tipo, creadoPor }) {
  const { error } = await supabase.from('notificaciones_globales').insert({
    titulo,
    mensaje,
    tipo,
    creado_por: creadoPor,
  });
  if (error) throw error;
}

export async function listarHistorialNotificaciones() {
  const { data, error } = await supabase
    .from('notificaciones_globales')
    .select('*')
    .order('fecha_creacion', { ascending: false });
  if (error) throw error;
  return data;
}

export async function apagarNotificacionPermanente(id) {
  const { error } = await supabase
    .from('notificaciones_globales')
    .update({ estado_activa: false })
    .eq('id', id);
  if (error) throw error;
}

export function suscribirseHistorialNotificaciones(onChange) {
  const channel = supabase
    .channel('notificaciones-admin-historial')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'notificaciones_globales' },
      onChange
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
