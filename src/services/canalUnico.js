/**
 * Supabase reutiliza un canal de Realtime si el nombre coincide, y no
 * permite agregar callbacks a uno que ya está suscrito. Si dos
 * componentes montados a la vez escuchan lo mismo con el mismo nombre
 * de canal, truena con:
 *   "cannot add `postgres_changes` callbacks ... after `subscribe()`".
 * Dándole a CADA suscripción su propio nombre, eso no puede pasar.
 */
let contador = 0;

export function nombreCanalUnico(base) {
  contador += 1;
  return `${base}-${contador}`;
}
