import { supabase } from './supabaseClient';
import { nombreCanalUnico } from './canalUnico';

/** Largo máximo de una pista (el SQL lo exige también). */
export const MAX_PISTA = 1000;

/**
 * Las pistas completas: [{ numero, pista }] de las 10 tinajas.
 * SOLO las puede leer el Admin y el staff del Tesoro. Para el público la
 * base de datos devuelve 0 filas (las pistas no son públicas).
 */
export async function listarPistasTesoro() {
  const { data, error } = await supabase
    .from('tesoro_tinajas')
    .select('numero, pista')
    .order('numero', { ascending: true });
  if (error) throw error;
  return data;
}

/**
 * Guarda todas las pistas de una vez, en UNA sola petición: o se guardan
 * todas o ninguna, nunca a medias. Las 10 filas ya existen (el SQL las crea
 * vacías), así que esto solo las actualiza. Solo el Admin puede escribir.
 */
export async function guardarPistasTesoro(pistas) {
  const ahora = new Date().toISOString();
  const filas = pistas.map((p) => ({
    numero: p.numero,
    pista: p.pista.trim(),
    actualizado_en: ahora,
  }));
  const { error } = await supabase.from('tesoro_tinajas').upsert(filas, { onConflict: 'numero' });
  if (error) throw error;
}

/**
 * Qué tinajas están configuradas, SIN el texto de la pista: [{ numero,
 * configurada }]. Es lo único que puede ver el público, y sirve para saber
 * el total ("3 de 8 tinajas").
 */
export async function listarTinajasConfiguradas() {
  const { data, error } = await supabase
    .from('v_tesoro_tinajas')
    .select('numero, configurada')
    .order('numero', { ascending: true });
  if (error) throw error;
  return data;
}

export function suscribirsePistasTesoro(onChange) {
  const channel = supabase
    .channel(nombreCanalUnico('tesoro-pistas'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tesoro_tinajas' }, onChange)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
