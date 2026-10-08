// Lógica PURA del Torneo por fases (sin Supabase, sin React).
//
// Formato: 12 equipos (3 por macro-equipo), 20 partidos, 11 fechas, 2 canchas.
//   Fase de Grupos (fechas 1-6) -> Cuadrangular (7-9) -> Tercer puesto (10) y Final (11).
// El grupo ES el macro-equipo: la letra (A-D) sale del orden de creación de los
// macros, igual que en la base de datos (fecha_creacion, id).

export const FASES_TORNEO = [
  { id: 'grupos', label: 'Fase de Grupos', corto: 'Grupos' },
  { id: 'cuadrangular', label: 'Cuadrangular Final', corto: 'Cuadrangular' },
  { id: 'finales', label: 'Fase Final', corto: 'Final' },
];

export const NOMBRE_FASE_PARTIDO = {
  grupos: 'Fase de Grupos',
  cuadrangular: 'Cuadrangular',
  tercer_puesto: 'Tercer Puesto',
  final: 'Gran Final',
};

/** Pestaña a la que pertenece un partido ('grupos' | 'cuadrangular' | 'finales'). */
export function pestanaDePartido(partido) {
  if (partido.fase === 'tercer_puesto' || partido.fase === 'final') return 'finales';
  return partido.fase;
}

/** "L:A" -> "Líder Grupo A" · "Q:3" -> "3.º del Cuadrangular". Otro valor -> "Por definir". */
export function etiquetaCruce(ref) {
  if (!ref) return 'Por definir';
  const [tipo, valor] = ref.split(':');
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

/** Letras de grupo por macro, igual que la base de datos. */
export function letrasDeMacros(macros) {
  const ordenados = [...macros].sort((a, b) => {
    const fa = new Date(a.fecha_creacion ?? 0).getTime();
    const fb = new Date(b.fecha_creacion ?? 0).getTime();
    if (fa !== fb) return fa - fb;
    return String(a.id) < String(b.id) ? -1 : 1;
  });
  return ordenados.map((m, i) => ({ macro: m, letra: String.fromCharCode(65 + i) }));
}

/**
 * ¿Está lista la plantilla para generar el fixture?
 * Devuelve { listo, macrosOk, grupos: [{ letra, macro, casillas: [equipo|null x3], faltan }], problemas }.
 */
export function revisarPlantilla(macros, equipos) {
  const grupos = letrasDeMacros(macros).map(({ macro, letra }) => {
    const delMacro = equipos.filter((e) => e.macro_equipo_id === macro.id);
    const casillas = [1, 2, 3].map((s) => delMacro.find((e) => e.slot === s) ?? null);
    return { letra, macro, casillas, total: delMacro.length, faltan: Math.max(0, 3 - delMacro.length) };
  });

  const problemas = [];
  const macrosOk = macros.length === 4;
  if (!macrosOk) {
    problemas.push(`Se necesitan exactamente 4 macro-equipos (hay ${macros.length}).`);
  }
  for (const g of grupos) {
    if (g.total < 3) {
      problemas.push(`Grupo ${g.letra} (${g.macro.nombre}): faltan ${g.faltan} ${g.faltan === 1 ? 'equipo' : 'equipos'}.`);
    }
  }
  return { listo: problemas.length === 0, macrosOk, grupos, problemas };
}

/** Partido que ya empezó: no se le pueden cambiar los equipos. */
export function partidoIniciado(p) {
  return Boolean(
    p.finalizado || p.en_juego || p.reloj_inicio_en || (p.segundos_acumulados ?? 0) > 0
  );
}

/**
 * Avisos para el Admin: cruces que ya empezaron con un equipo que ya no
 * coincide con la clasificación actual (p. ej. se corrigió un partido de grupos
 * después de que arrancó el cuadrangular). La base de datos nunca cambia un
 * partido que ya empezó; hay que resolverlo a mano.
 */
export function avisosFixture(partidos, tablas) {
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
    if (!partidoIniciado(p)) continue;
    for (const lado of ['a', 'b']) {
      const ref = p[`ref_${lado}`];
      if (!ref) continue;
      const actual = p[`equipo_${lado}_id`];
      if (esperado(ref) !== actual) {
        avisos.push({
          partidoNum: p.partido_num,
          texto: `El partido ${p.partido_num} (${NOMBRE_FASE_PARTIDO[p.fase]}) ya empezó, pero la clasificación cambió: ${etiquetaCruce(ref)} ya no es ${p[`${lado}_nombre`] ?? 'ese equipo'}. No se cambia solo.`,
        });
      }
    }
  }
  return avisos;
}

export function resumenProgreso(partidos) {
  const total = partidos.length;
  const finalizados = partidos.filter((p) => p.finalizado).length;
  const enVivo = partidos.filter((p) => p.estado === 'en_vivo' || p.estado === 'pausado').length;
  return { total, finalizados, enVivo, pendientes: total - finalizados - enVivo };
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
