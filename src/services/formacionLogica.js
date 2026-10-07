// Lógica PURA del módulo Formación (sin Supabase, sin React).
//
// Formación no guarda nada propio: lee la Rotación de la Mañana. La regla de
// la rotación ya existía en /colores:
//     base del equipo = bases[(equipo.orden + ronda_actual) % cantidadBases]
// Aquí solo se "da la vuelta" a esa regla para responder lo que necesita el
// formador (¿quién está en MI base? ¿quién viene?) y el Admin (¿dónde está cada
// equipo? ¿qué bases están vacías?).

/** Índice de la base donde está el equipo en la ronda dada. */
export function indiceBaseDeEquipo(equipo, ronda, totalBases) {
  if (!totalBases) return -1;
  return (equipo.orden + ronda) % totalBases;
}

/** Equipo que está en la base `indiceBase` durante la ronda dada (o null si está libre). */
export function equipoEnBase(indiceBase, ronda, equipos, totalBases) {
  if (!totalBases) return null;
  return equipos.find((e) => (e.orden + ronda) % totalBases === indiceBase) ?? null;
}

/**
 * Próximo equipo que llegará a la base (sin contar el que está ahora): el primero
 * de las rondas siguientes. `faltan` = cuántos cambios de base faltan para que llegue.
 * Si la última base está activada o ya no quedan rondas, devuelve null.
 */
export function proximoEquipoEnBase(indiceBase, ronda, equipos, totalBases, ultimaBase = false) {
  if (ultimaBase) return null;
  for (let r = ronda + 1; r < totalBases; r += 1) {
    const equipo = equipoEnBase(indiceBase, r, equipos, totalBases);
    if (equipo) return { equipo, faltan: r - ronda };
  }
  return null;
}

/** "Rojo A, Rojo B" -> ['Rojo A', 'Rojo B'] (ignora vacíos y repetidos). */
export function separarSubgrupos(texto) {
  if (!texto) return [];
  const vistos = new Set();
  return String(texto)
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter((s) => {
      if (!s || vistos.has(s.toLowerCase())) return false;
      vistos.add(s.toLowerCase());
      return true;
    });
}

/**
 * Lo que ve el formador parado en `indiceBase`.
 *
 * - estado: 'esperando' | 'en_curso' | 'terminado'
 * - actual: equipo que está en su base ahora (o null si la base está libre esta ronda)
 * - siguiente: equipo que llegará en la próxima rotación (null si ya no habrá más rondas o es la última base)
 * - agenda: lo que viene en esta base, ronda por ronda, desde la actual
 * - pasaron / total: cuántos equipos ya recibió y cuántos en total
 */
export function calcularEstacionFormacion(indiceBase, config, bases, equipos) {
  const totalBases = bases.length;
  const base = bases[indiceBase] ?? null;
  const estado = config?.estado ?? 'esperando';

  const vacio = {
    estado,
    base,
    actual: null,
    siguiente: null,
    faltan: 0,
    ronda: 0,
    totalRondas: totalBases,
    ultimaBase: false,
    agenda: [],
    pasaron: 0,
    total: equipos.length,
  };
  if (!base || estado !== 'en_curso') return vacio;

  const ronda = config.ronda_actual;
  const actual = equipoEnBase(indiceBase, ronda, equipos, totalBases);
  const proximo = proximoEquipoEnBase(indiceBase, ronda, equipos, totalBases, !!config.ultima_base);
  const siguiente = proximo?.equipo ?? null;

  const agenda = [];
  for (let r = ronda; r < totalBases; r += 1) {
    agenda.push({
      ronda: r + 1,
      equipo: equipoEnBase(indiceBase, r, equipos, totalBases),
      esActual: r === ronda,
    });
  }

  let pasaron = 0;
  for (let r = 0; r < ronda && r < totalBases; r += 1) {
    if (equipoEnBase(indiceBase, r, equipos, totalBases)) pasaron += 1;
  }

  return {
    estado,
    base,
    actual,
    siguiente,
    faltan: proximo?.faltan ?? 0,
    ronda: ronda + 1,
    totalRondas: totalBases,
    ultimaBase: !!config.ultima_base,
    agenda,
    pasaron,
    total: equipos.length,
  };
}

/** Estado de TODAS las bases en la ronda actual (para el Radar del Admin). */
export function ocupacionBasesFormacion(config, bases, equipos) {
  const totalBases = bases.length;
  const enCurso = config?.estado === 'en_curso';
  const ronda = config?.ronda_actual ?? 0;

  return bases.map((base, i) => {
    const proximo = enCurso
      ? proximoEquipoEnBase(i, ronda, equipos, totalBases, !!config.ultima_base)
      : null;
    return {
      base,
      indice: i,
      actual: enCurso ? equipoEnBase(i, ronda, equipos, totalBases) : null,
      siguiente: proximo?.equipo ?? null,
      faltan: proximo?.faltan ?? 0,
    };
  });
}

/** Dónde está cada equipo ahora y hacia dónde va (para el Radar del Admin). */
export function ubicacionEquiposFormacion(config, bases, equipos) {
  const totalBases = bases.length;
  const enCurso = config?.estado === 'en_curso';
  const ronda = config?.ronda_actual ?? 0;
  const hayMasRondas = enCurso && ronda + 1 < totalBases && !config.ultima_base;

  return equipos.map((equipo) => {
    const idx = indiceBaseDeEquipo(equipo, ronda, totalBases);
    const idxSig = indiceBaseDeEquipo(equipo, ronda + 1, totalBases);
    return {
      equipo,
      base: enCurso ? (bases[idx] ?? null) : null,
      siguienteBase: hayMasRondas ? (bases[idxSig] ?? null) : null,
      // Bases que ya recorrió (rondas anteriores a la actual).
      recorridas: enCurso ? Math.min(ronda, totalBases) : 0,
    };
  });
}

/**
 * Cronograma completo: una fila por equipo, una columna por ronda, con el
 * índice de la base de cada cruce. Sirve para dibujar el mapa de la mañana.
 */
export function matrizRotacionFormacion(bases, equipos) {
  const totalBases = bases.length;
  return equipos.map((equipo) => ({
    equipo,
    celdas: Array.from({ length: totalBases }, (_, r) => ({
      ronda: r + 1,
      indiceBase: indiceBaseDeEquipo(equipo, r, totalBases),
    })),
  }));
}

/** Resumen numérico del radar. */
export function resumenOcupacion(ocupacion) {
  const ocupadas = ocupacion.filter((o) => o.actual).length;
  return { ocupadas, libres: ocupacion.length - ocupadas, total: ocupacion.length };
}
