import { supabase } from './supabaseClient';

export async function listarSubEquiposColor() {
  const { data, error } = await supabase
    .from('sub_equipos_color')
    .select('*')
    .order('creado_en', { ascending: true });
  if (error) throw error;
  return data;
}

/**
 * Los sub-equipos (colores) asignados a UNA actividad, ya mapeados al
 * shape {id, nombre, color_hex} que espera <EquipoSelector> y el resto
 * de la UI de Gymkana/Tesoro (que antes recibía macro-equipos).
 */
export async function listarSubEquiposColorPorActividad(actividad) {
  const { data, error } = await supabase
    .from('sub_equipos_color')
    .select('id, color_nombre, color_hex, macro_equipo_id')
    .eq('actividad', actividad)
    .order('creado_en', { ascending: true });
  if (error) throw error;
  return data.map((c) => ({ id: c.id, nombre: c.color_nombre, color_hex: c.color_hex }));
}

export async function crearSubEquipoColor({ macroEquipoId, colorNombre, colorHex, actividad }) {
  const { error } = await supabase.from('sub_equipos_color').insert({
    macro_equipo_id: macroEquipoId,
    color_nombre: colorNombre,
    color_hex: colorHex,
    actividad,
  });
  if (error) throw error;
}

export async function actualizarSubEquipoColor(id, { colorNombre, colorHex }) {
  const { error } = await supabase
    .from('sub_equipos_color')
    .update({ color_nombre: colorNombre, color_hex: colorHex })
    .eq('id', id);
  if (error) throw error;
}

export async function eliminarSubEquipoColor(id) {
  const { error } = await supabase.from('sub_equipos_color').delete().eq('id', id);
  if (error) throw error;
}

export function suscribirseSubEquiposColor(onChange) {
  const channel = supabase
    .channel('sub-equipos-color')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'sub_equipos_color' },
      onChange
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
