import { useCallback, useEffect, useState } from 'react';
import { listarBasesGymkana, suscribirseBasesGymkana } from '../services/gymkanaBasesService';

/**
 * Devuelve las bases de la Gymkana indexadas por número:
 *   { 1: { numero, lugar, descripcion }, 2: {...}, ... }
 * Se mantiene al día por Realtime. Si falla la lectura (por ejemplo, el SQL
 * aún no se ha corrido) devuelve {} y las pantallas muestran solo "Base N",
 * como antes: nunca se rompe nada por esto.
 */
export function useBasesGymkana() {
  const [bases, setBases] = useState({});

  const cargar = useCallback(() => {
    listarBasesGymkana()
      .then((lista) => setBases(Object.fromEntries(lista.map((b) => [b.numero, b]))))
      .catch(() => setBases({}));
  }, []);

  useEffect(() => {
    cargar();
    const unsubscribe = suscribirseBasesGymkana(cargar);
    return unsubscribe;
  }, [cargar]);

  return bases;
}
