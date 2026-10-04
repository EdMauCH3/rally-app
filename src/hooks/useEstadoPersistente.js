import { useEffect, useState } from 'react';

/**
 * Igual que useState, pero recuerda el valor en sessionStorage.
 * Sirve para "en qué parte de la pantalla estaba": sobrevive a un
 * remontaje del componente y a recargar con F5. Se borra al cerrar la
 * pestaña del navegador (y al cerrar sesión, ver AuthContext).
 *
 * Todas las claves deben empezar con "rally_ui_" para que el cierre de
 * sesión las limpie.
 *
 * `validar` (opcional) descarta un valor guardado que ya no tenga
 * sentido (por ejemplo, una pestaña que ese rol ya no puede ver).
 */
export function useEstadoPersistente(clave, valorInicial, validar) {
  const [valor, setValor] = useState(() => {
    try {
      const guardado = sessionStorage.getItem(clave);
      if (guardado !== null) {
        const leido = JSON.parse(guardado);
        if (!validar || validar(leido)) return leido;
      }
    } catch {
      // sessionStorage no disponible o valor corrupto: se usa el inicial.
    }
    return valorInicial;
  });

  useEffect(() => {
    try {
      if (valor === null || valor === undefined) sessionStorage.removeItem(clave);
      else sessionStorage.setItem(clave, JSON.stringify(valor));
    } catch {
      // Sin almacenamiento: la app funciona igual, solo que no recuerda.
    }
  }, [clave, valor]);

  return [valor, setValor];
}
