/**
 * Lógica pura (sin red) de los jueces fijos de estación y del radar del Admin.
 * Todo se DERIVA de las tablas; no hay un "estado de estación" aparte que pueda
 * quedar desincronizado.
 *
 * (La Gymkana ya no vive aquí: es un circuito sincronizado, ver gymkanaLogica.js.)
 * Tesoro: cada equipo tiene UNA tinaja asignada (tesoro_asignaciones). "Viene"
 *   si aún no hay registro de llegada, "está" si hay registro sin calificar.
 */

const GRIS = '#94a3b8';

function equipoDe(mapa, id) {
  return mapa.get(id) ?? { id, nombre: 'Equipo', color_hex: GRIS };
}

export function mapaEquipos(lista) {
  return new Map((lista ?? []).map((e) => [e.id, e]));
}

// ───────────────────────── Tesoro ─────────────────────────

const calificada = (puntuaciones, equipoId, tinaja) =>
  puntuaciones.some(
    (p) => p.equipo_id === equipoId && p.base_id === tinaja && p.puntos_evaluacion != null
  );

/** Qué pasa AHORA en la tinaja `tinaja`. */
export function calcularEstacionTesoro(tinaja, rutas, puntuaciones, asignaciones, equiposPorId) {
  const conEstaTinaja = rutas.filter((r) => r.orden_tinajas.includes(tinaja));
  const pasaron = conEstaTinaja.filter((r) => calificada(puntuaciones, r.equipo_id, tinaja)).length;

  const asignado = asignaciones.find((a) => a.tinaja === tinaja) ?? null;
  const registro = asignado
    ? (puntuaciones.find((p) => p.equipo_id === asignado.equipo_id && p.base_id === tinaja) ?? null)
    : null;
  const yaCalificado = registro?.puntos_evaluacion != null;

  let estado = 'libre'; // nadie viene todavía
  if (rutas.length === 0) estado = 'sin_iniciar';
  else if (conEstaTinaja.length > 0 && pasaron === conEstaTinaja.length) estado = 'cerrada';
  else if (asignado && !yaCalificado) estado = registro ? 'en_tinaja' : 'en_camino';

  return {
    estado,
    equipo: asignado && !yaCalificado ? equipoDe(equiposPorId, asignado.equipo_id) : null,
    registro: asignado && !yaCalificado ? registro : null,
    total: conEstaTinaja.length,
    pasaron,
  };
}

/** Una fila por equipo: dónde está o a dónde va. */
export function radarTesoro(rutas, puntuaciones, asignaciones, equiposPorId) {
  return rutas.map((r) => {
    const suyas = puntuaciones.filter((p) => p.equipo_id === r.equipo_id);
    const completadas = suyas.filter((p) => p.puntos_evaluacion != null).length;
    const total = r.orden_tinajas.length;
    const tinaja = asignaciones.find((a) => a.equipo_id === r.equipo_id)?.tinaja ?? null;

    let estado = 'espera';
    if (completadas >= total) estado = 'termino';
    else if (tinaja != null) {
      estado = suyas.some((p) => p.base_id === tinaja) ? 'en_lugar' : 'en_camino';
    }

    return {
      equipo: equipoDe(equiposPorId, r.equipo_id),
      estado,
      destino: estado === 'termino' ? null : tinaja,
      completadas,
      total,
      puntos: suyas.reduce((t, p) => t + (p.puntos_totales ?? 0), 0),
    };
  });
}

/** Estado de cada tinaja: libre | en_camino | en_tinaja | cerrada. */
export function ocupacionTinajas(rutas, puntuaciones, asignaciones, equiposPorId, numeros) {
  return numeros.map((n) => {
    const e = calcularEstacionTesoro(n, rutas, puntuaciones, asignaciones, equiposPorId);
    return {
      numero: n,
      estado: e.estado === 'sin_iniciar' ? 'libre' : e.estado,
      equipo: e.equipo,
      pasaron: e.pasaron,
      total: e.total,
    };
  });
}
