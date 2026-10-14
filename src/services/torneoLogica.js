// Lógica PURA del Torneo dinámico (sin Supabase, sin React).
//
// El torneo se arma por ETAPAS que el Admin o el Director Técnico configura y confirma una a una:
//   Etapa 1 · Grupos          (todos contra todos o eliminación directa, según el grupo)
//   Etapa 2 · Clasificatoria  (cuadrangular / todos contra todos, o playoffs)
//   Etapa 3 · Finales         (tercer puesto y final, cuando la etapa 2 fue todos contra todos)
// Cada equipo pertenece a un Macro-equipo; sus puntos y rojas suman al Macro sin importar
// cuántos equipos tenga cada uno. La cantidad de equipos y de grupos es libre.

export const ETAPAS = [
  { id: 1, nombre: 'Fase de Grupos', corto: 'Grupos' },
  { id: 2, nombre: 'Clasificatoria', corto: 'Clasificatoria' },
  { id: 3, nombre: 'Finales', corto: 'Finales' },
];

/** Configuración por defecto de cada etapa (igual que en la base de datos). */
export const CONFIG_DEFECTO = {
  1: { formato: 'liga', vueltas: 1, clasifican: 1, duracion_segundos: 600, grupos: {} },
  2: { formato: 'liga', vueltas: 1, tercer_puesto: true, duracion_segundos: 600 },
  3: { tercer_puesto: true, duracion_segundos: 600 },
};

export const NOMBRE_FASE_PARTIDO = {
  grupos: 'Fase de Grupos',
  cuadrangular: 'Cuadrangular',
  eliminatoria: 'Eliminación directa',
  tercer_puesto: 'Tercer Puesto',
  final: 'Gran Final',
};

/** Nombre de la ronda: el que generó el sistema ("Semifinal") o, si falta, el de la fase. */
export function nombreRonda(partido) {
  return partido.ronda_nombre || NOMBRE_FASE_PARTIDO[partido.fase] || 'Partido';
}

/** Fases donde no puede haber empate (se define por prórroga/penales). */
export function esEliminatoria(partido) {
  return ['eliminatoria', 'tercer_puesto', 'final'].includes(partido.fase);
}

/** Nombre oficial de cada cancha: la 1 es el Coliseo y la 2 la Cancha Azul. */
export const NOMBRES_CANCHA = { 1: 'Coliseo', 2: 'Cancha Azul' };

export function nombreCancha(numero) {
  return NOMBRES_CANCHA[numero] ?? `Cancha ${numero}`;
}

/**
 * Pestaña pública a la que pertenece un partido:
 * 'grupos' (etapa 1) | 'cuadrangular' (todos contra todos de la etapa 2) | 'llaves' (eliminatorias y finales).
 */
export function pestanaDePartido(partido) {
  if (partido.fase === 'grupos' || (partido.fase === 'eliminatoria' && partido.etapa === 1)) return 'grupos';
  if (partido.fase === 'cuadrangular') return 'cuadrangular';
  return 'llaves';
}

/** Pestañas que el público ve: SOLO las etapas que existen (nada de un cuadro fijo de 12 equipos). */
export function pestanasVisibles(partidos, equipos = []) {
  const hay = (id) => partidos.some((p) => pestanaDePartido(p) === id);
  const lista = [];
  if (hay('grupos') || equipos.some((e) => e.grupo)) lista.push({ id: 'grupos', label: 'Grupos' });
  if (hay('cuadrangular')) lista.push({ id: 'cuadrangular', label: 'Cuadrangular' });
  if (hay('llaves')) {
    const soloFinales = partidos
      .filter((p) => pestanaDePartido(p) === 'llaves')
      .every((p) => p.fase === 'final' || p.fase === 'tercer_puesto');
    lista.push({ id: 'llaves', label: soloFinales ? 'Fase Final' : 'Playoffs' });
  }
  return lista;
}

/** "W:12" -> "Ganador del partido 12" · "P:12" -> "Perdedor del partido 12" · "L:A" -> "Líder Grupo A". */
export function etiquetaCruce(ref) {
  if (!ref) return 'Por definir';
  const [tipo, valor] = ref.split(':');
  if (tipo === 'W') return `Ganador del partido ${valor}`;
  if (tipo === 'P') return `Perdedor del partido ${valor}`;
  if (tipo === 'L') return `Líder Grupo ${valor}`;
  if (tipo === 'Q') return `${valor}.º del Cuadrangular`;
  return 'Por definir';
}

/** Nombre a mostrar de un lado ('a' | 'b') del partido: el equipo o, si aún no se define, el cruce. */
export function nombreLado(partido, lado) {
  const nombre = partido[`${lado}_nombre`];
  if (nombre) return nombre;
  return etiquetaCruce(partido[`ref_${lado}`]);
}

export function ladoDefinido(partido, lado) {
  return Boolean(partido[`equipo_${lado}_id`]);
}

export function partidoJugable(partido) {
  return ladoDefinido(partido, 'a') && ladoDefinido(partido, 'b');
}

/** [{ fecha, partidos: [cancha 1, cancha 2] }] ordenado por fecha. */
export function agruparPorFecha(partidos) {
  const mapa = new Map();
  for (const p of partidos) {
    if (!mapa.has(p.fecha_num)) mapa.set(p.fecha_num, []);
    mapa.get(p.fecha_num).push(p);
  }
  return [...mapa.entries()]
    .sort((x, y) => x[0] - y[0])
    .map(([fecha, lista]) => ({
      fecha,
      partidos: [...lista].sort((x, y) => x.cancha - y.cancha),
    }));
}

/**
 * Nombre completo de un grupo: "Grupo A - Verde". El color/nombre sale SIEMPRE del
 * Macro-equipo, así que si el Admin lo cambia, todas las pantallas lo reflejan solas
 * (la etiqueta nunca se guarda: se arma al mostrarla).
 */
export function etiquetaGrupo(letra, macroNombre) {
  const nombre = (macroNombre ?? '').trim();
  return nombre ? `Grupo ${letra} - ${nombre}` : `Grupo ${letra}`;
}

/**
 * Mapa letra → { nombre, color, macros, equipos } a partir de los equipos del torneo.
 * `nombre` y `color` solo existen si TODOS los equipos del grupo son del mismo Macro-equipo;
 * si el grupo mezcla macros, se muestra solo "Grupo A".
 */
export function infoGrupos(equipos) {
  const mapa = new Map();
  for (const e of equipos ?? []) {
    if (!e.grupo) continue;
    if (!mapa.has(e.grupo)) mapa.set(e.grupo, { letra: e.grupo, macros: new Map(), equipos: [] });
    const g = mapa.get(e.grupo);
    g.equipos.push(e);
    g.macros.set(e.macro_equipo_id, { nombre: e.macro_nombre, color: e.macro_color });
  }
  for (const g of mapa.values()) {
    const unico = g.macros.size === 1 ? [...g.macros.values()][0] : null;
    g.nombre = unico?.nombre ?? null;
    g.color = unico?.color ?? null;
  }
  return mapa;
}

/** Etiqueta de un grupo a partir de su letra y la lista de equipos. */
export function etiquetaGrupoDe(letra, equipos) {
  if (!letra) return 'Sin grupo';
  return etiquetaGrupo(letra, infoGrupos(equipos).get(letra)?.nombre);
}

/** Letras de grupo: A, B, C… hasta la cantidad pedida (máximo 12). */
export function letrasGrupos(cantidad) {
  return Array.from({ length: Math.min(Math.max(cantidad, 0), 12) }, (_, i) => String.fromCharCode(65 + i));
}

/** Equipos que siguen en competencia. */
export function equiposActivos(equipos) {
  return (equipos ?? []).filter((e) => e.estado !== 'retirado');
}

/**
 * Estado de cada etapa a partir de los partidos (sin contar la vista previa) y los borradores.
 * { 1: { confirmada, borrador, total, finalizados, completa }, 2: …, 3: … }
 */
export function estadoEtapas(partidosConBorrador) {
  const estado = {};
  for (const e of ETAPAS) {
    const reales = partidosConBorrador.filter((p) => p.etapa === e.id && !p.borrador);
    const borr = partidosConBorrador.filter((p) => p.etapa === e.id && p.borrador);
    const fin = reales.filter((p) => p.finalizado).length;
    estado[e.id] = {
      confirmada: reales.length > 0,
      borrador: borr.length > 0,
      total: reales.length,
      totalBorrador: borr.length,
      finalizados: fin,
      completa: reales.length > 0 && fin === reales.length,
    };
  }
  return estado;
}

/** ¿Qué etapa toca configurar/generar ahora? (la primera sin confirmar) */
export function etapaSiguiente(estado) {
  for (const e of ETAPAS) if (!estado[e.id].confirmada) return e.id;
  return null;
}

/** Estado visual de un partido: 'wo' | 'finalizado' | 'en_vivo' | 'pausado' | 'pendiente'. */
export function estadoUi(p) {
  if (p.walkover) return 'wo';
  if (p.finalizado) return 'finalizado';
  if (p.estado === 'en_vivo') return 'en_vivo';
  if (p.estado === 'pausado') return 'pausado';
  return 'pendiente';
}

export const TEXTO_ESTADO = {
  pendiente: 'Pendiente',
  en_vivo: 'En vivo',
  pausado: 'En pausa',
  finalizado: 'Finalizado',
  wo: 'W.O.',
};

/** Agrupa partidos por ronda: [{ ronda, nombre, partidos }] ordenado por ronda. */
export function agruparRondas(partidos) {
  const mapa = new Map();
  for (const p of partidos) {
    const r = p.ronda ?? 0;
    if (!mapa.has(r)) mapa.set(r, []);
    mapa.get(r).push(p);
  }
  return [...mapa.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([ronda, lista]) => ({
      ronda,
      nombre: lista[0]?.ronda_nombre?.split(' · ').pop() ?? `Ronda ${ronda}`,
      partidos: [...lista].sort((x, y) => x.partido_num - y.partido_num),
    }));
}

/**
 * Sugerencias para repartir en grupos: tamaños resultantes (p. ej. 10 equipos en 3 grupos → 4, 3, 3).
 */
export function tamanosDeGrupos(totalEquipos, numGrupos) {
  if (!numGrupos || numGrupos < 1) return [];
  const base = Math.floor(totalEquipos / numGrupos);
  const extra = totalEquipos % numGrupos;
  return Array.from({ length: numGrupos }, (_, i) => base + (i < extra ? 1 : 0));
}

/** Resumen de la inscripción: equipos por macro (cualquier cantidad). */
export function resumenInscripcion(macros, equipos) {
  const porMacro = macros.map((m) => {
    const lista = equipos.filter((e) => e.macro_equipo_id === m.id);
    return {
      macro: m,
      equipos: lista,
      activos: lista.filter((e) => e.estado !== 'retirado').length,
      retirados: lista.filter((e) => e.estado === 'retirado').length,
    };
  });
  const activos = equiposActivos(equipos);
  const sinGrupo = activos.filter((e) => !e.grupo).length;
  return { porMacro, total: equipos.length, activos: activos.length, sinGrupo };
}

/** Partido que ya empezó: no se le pueden cambiar los equipos. */
export function partidoIniciado(p) {
  return Boolean(
    p.finalizado || p.en_juego || p.reloj_inicio_en || (p.segundos_acumulados ?? 0) > 0
  );
}

/**
 * Avisos para el Admin / DT: situaciones que requieren una decisión.
 *  · cruces de la versión anterior que ya empezaron con un equipo que no coincide con la clasificación,
 *  · partidos pendientes de un equipo retirado que no se resolvieron solos (W.O. manual),
 *  · partidos pendientes donde ambos equipos están retirados.
 */
export function avisosFixture(partidos, tablas = [], equipos = []) {
  const avisos = [];
  const lider = {};
  const puesto = {};
  for (const fila of tablas) {
    if (!fila.completo || fila.pos == null) continue;
    if (fila.fase === 'grupos' && fila.pos === 1) lider[`L:${fila.grupo}`] = fila.equipo_torneo_id;
    if (fila.fase === 'cuadrangular') puesto[`Q:${fila.pos}`] = fila.equipo_torneo_id;
  }
  const esperado = (ref) => lider[ref] ?? puesto[ref] ?? null;

  for (const p of partidos) {
    if (p.borrador) continue;
    if (partidoIniciado(p)) {
      for (const lado of ['a', 'b']) {
        const ref = p[`ref_${lado}`];
        if (!ref || !/^[LQ]:/.test(ref)) continue;
        const actual = p[`equipo_${lado}_id`];
        if (esperado(ref) !== actual) {
          avisos.push({
            partidoNum: p.partido_num,
            texto: `El partido ${p.partido_num} (${nombreRonda(p)}) ya empezó, pero la clasificación cambió: ${etiquetaCruce(ref)} ya no es ${p[`${lado}_nombre`] ?? 'ese equipo'}. No se cambia solo.`,
          });
        }
      }
      continue;
    }
    if (p.finalizado) continue;
    const aRet = p.a_estado === 'retirado';
    const bRet = p.b_estado === 'retirado';
    if (aRet && bRet) {
      avisos.push({
        partidoNum: p.partido_num,
        texto: `Partido ${p.partido_num}: los dos equipos están retirados. Elimínalo o reestructura el cruce.`,
      });
    } else if (aRet || bRet) {
      const quien = aRet ? p.a_nombre : p.b_nombre;
      avisos.push({
        partidoNum: p.partido_num,
        texto: `Partido ${p.partido_num}: ${quien} está retirado y el W.O. no es automático. Decláralo W.O. o reestructura el cruce.`,
      });
    }
  }
  const sinGrupo = equiposActivos(equipos).filter((e) => !e.grupo);
  if (sinGrupo.length > 0 && partidos.some((p) => p.etapa === 1 && !p.borrador)) {
    avisos.push({
      partidoNum: 0,
      texto: `${sinGrupo.length === 1 ? 'Un equipo no está' : `${sinGrupo.length} equipos no están`} en ningún grupo (${sinGrupo.map((e) => e.nombre).join(', ')}): no jugará la etapa de grupos.`,
    });
  }
  return avisos;
}

export function resumenProgreso(partidos) {
  const total = partidos.length;
  const finalizados = partidos.filter((p) => p.finalizado).length;
  const enVivo = partidos.filter((p) => !p.finalizado && (p.estado === 'en_vivo' || p.estado === 'pausado')).length;
  const walkovers = partidos.filter((p) => p.walkover).length;
  return { total, finalizados, enVivo, walkovers, pendientes: total - finalizados - enVivo };
}

export const TEXTO_DESEMPATE = {
  dg: 'Diferencia de goles',
  gf: 'Goles a favor',
  directo: 'Enfrentamiento directo',
  fair_play: 'Juego limpio',
  sorteo: 'Sorteo',
};

export const ABREV_DESEMPATE = {
  dg: 'DG',
  gf: 'GF',
  directo: 'H2H',
  fair_play: 'FP',
  sorteo: 'Sorteo',
};

/** "2026-10-17T14:30:00Z" -> "14:30" en la hora local, o '' si no hay hora. */
export function formatoHora(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/** Valor para <input type="time"> ("14:30") a partir de la hora programada. */
export function horaParaInput(iso) {
  return formatoHora(iso);
}

/** Combina un día (YYYY-MM-DD) y una hora (HH:MM) locales en un ISO; '' -> null. */
export function combinarFechaHora(dia, hora) {
  if (!dia || !hora) return null;
  const d = new Date(`${dia}T${hora}:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Validación del formulario de un equipo del torneo. Devuelve un mensaje de error o null. */
export function validarEquipoForm({ nombre, colorHex, macroEquipoId }) {
  if (!nombre || !nombre.trim()) return 'Ponle un nombre al equipo';
  if (nombre.trim().length > 40) return 'El nombre es demasiado largo (máximo 40 letras)';
  if (!/^#[0-9a-fA-F]{6}$/.test(colorHex ?? '')) return 'Elige un color válido';
  if (!macroEquipoId) return 'Elige el macro-equipo al que pertenece';
  return null;
}
