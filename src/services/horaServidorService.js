import { supabase } from './supabaseClient';

/**
 * Devuelve los milisegundos que hay que SUMARLE a Date.now() para obtener
 * la hora real del servidor (negativo si el dispositivo va adelantado).
 *
 * Se compensa la demora de la red: la respuesta tardó (despues - antes) y
 * la hora del servidor se tomó, en promedio, a la mitad de ese trayecto.
 */
export async function obtenerDesfaseConServidor() {
  const antes = Date.now();
  const { data, error } = await supabase.rpc('hora_servidor');
  const despues = Date.now();

  if (error || !data) throw error ?? new Error('Sin hora del servidor');

  // Postgres devuelve microsegundos (6 decimales); algunos navegadores solo
  // aceptan 3 al interpretar la fecha, así que se recortan.
  const servidorMs = Date.parse(String(data).replace(/(\.\d{3})\d+/, '$1'));
  if (Number.isNaN(servidorMs)) throw new Error('Hora del servidor inválida');

  return servidorMs + (despues - antes) / 2 - despues;
}
