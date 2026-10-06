/**
 * Lógica pura (sin red) de los jueces fijos de estación y del radar del Admin.
 * Todo se DERIVA de las tablas; no hay un "estado de estación" aparte que pueda
 * quedar desincronizado.
 *
 * Gymkana: una base recibe PAREJAS. Una pareja "viene" a la base cuando ya
 *   calificó todas las bases anteriores de su recorrido; "está" cuando el juez
 *   marcó la llegada (llegada_en).
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

// ───────────────────────── Gymkana ─────────────────────────

/** Qué pasa AHORA en la base `base`. */
export function calcularEstacionGymkana(base, rutas, partidos, equiposPorId) {
  const ordenDe = (equipoId) => rutas.find((r) => r.equipo_id === equipoId)?.orden_bases ?? [];

  const info = partidos
    .filter((p) => p.base_id === base)
    .map((p) => {
      const orden = ordenDe(p.equipo_a_id);
      const pos = orden.indexOf(base);
      const anterioresListos =
        pos !== -1 &&
        orden.slice(0, pos).every(
          (b) =>
            partidos.find(
              (q) =>
                q.base_id === b && q.equipo_a_id === p.equipo_a_id && q.equipo_b_id === p.equipo_b_id
            )?.finalizado
        );
      return {
        partido: p,
        equipoA: equipoDe(equiposPorId, p.equipo_a_id),
        equipoB: equipoDe(equiposPorId, p.equipo_b_id),
        turno: !p.finalizado && anterioresListos,
      };
    });

  const enTurno = info.filter((i) => i.turno);
  const enBase = enTurno
    .filter((i) => i.partido.llegada_en)
    .sort((a, b) => new Date(a.partido.llegada_en) - new Date(b.partido.llegada_en));
  const enCamino = enTurno.filter((i) => !i.partido.llegada_en);
  const finalizados = info.filter((i) => i.partido.finalizado).length;

  return {
    iniciada: rutas.length > 0,
    total: info.length,
    finalizados,
    todosPasaron: info.length > 0 && finalizados === info.length,
    enBase, // la pareja que está calificándose (si hay más de una, la primera en llegar va primero)
    enCamino, // parejas a las que el sistema ya mandó a esta base
    // Normalmente 0 o 1. Con 2 hay choque de parejas en la misma base: se atienden en orden.
    simultaneas: enBase.length + enCamino.length,
  };
}

/** Una fila por equipo: dónde está o a dónde va. */
export function radarGymkana(rutas, partidos, equiposPorId) {
  return rutas.map((r) => {
    const orden = r.orden_bases ?? [];
    const suyos = partidos.filter((p) => p.equipo_a_id === r.equipo_id || p.equipo_b_id === r.equipo_id);
    const porBase = new Map(suyos.map((p) => [p.base_id, p]));
    const actual = orden.map((b) => porBase.get(b)).find((p) => p && !p.finalizado) ?? null;
    const completadas = suyos.filter((p) => p.finalizado).length;

    let estado = 'termino';
    if (actual) estado = actual.llegada_en ? 'en_lugar' : 'en_camino';

    return {
      equipo: equipoDe(equiposPorId, r.equipo_id),
      rival: equipoDe(equiposPorId, r.rival_id),
      parejaNum: r.pareja_num,
      estado,
      destino: actual?.base_id ?? null,
      completadas,
      total: orden.length,
    };
  });
}

/** Estado de cada base: libre | en_camino | compitiendo | cerrada (+ aviso de choque). */
export function ocupacionBases(rutas, partidos, equiposPorId, numeros) {
  return numeros.map((n) => {
    const e = calcularEstacionGymkana(n, rutas, partidos, equiposPorId);
    let estado = 'libre';
    if (e.todosPasaron) estado = 'cerrada';
    else if (e.enBase.length > 0) estado = 'compitiendo';
    else if (e.enCamino.length > 0) estado = 'en_camino';
    return {
      numero: n,
      estado,
      parejas: [...e.enBase, ...e.enCamino],
      choque: e.simultaneas > 1,
      finalizados: e.finalizados,
      total: e.total,
    };
  });
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
