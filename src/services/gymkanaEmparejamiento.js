/**
 * Motor de emparejamiento de la Gymkana sincronizada (lógica pura, sin red).
 *
 * Cada ronda cruza a TODOS los sub-equipos que aún no completan el circuito
 * (normalmente los 8: "Verde 1", "Verde 2", "Azul 1"…) en 4 duelos, cada uno en
 * una base distinta. Reglas:
 *   ESTRICTAS
 *     1. Ningún sub-equipo va a una base donde ya estuvo.
 *     2. Nunca se enfrentan dos sub-equipos del mismo Macro-equipo (mismo color).
 *     3. En una ronda, cada base recibe a lo sumo un duelo.
 *   OPTIMIZACIÓN
 *     4. Se prefieren rivales que todavía no se han visto. Con 4 colores × 2
 *        existen justo 24 cruces entre colores distintos y 24 duelos en todo el
 *        circuito, así que un plan perfecto no repite a nadie. El motor busca
 *        ese plan COMPLETO (con retroceso), no solo la ronda siguiente, para que
 *        las rondas futuras no se queden sin salida.
 *
 * Entrada:
 *   equipos:   [{ id, macro }]            sub-equipos de Gymkana y su Macro-equipo
 *   historial: [{ base, a, b }]           cruces ya creados (de cualquier ronda)
 *   bases:     [1..6]
 * Salida: { ok: true, duelos: [{ base, a, b }], repetidos: n } | { ok: false, mensaje }
 */

// Reinicios rápidos: la búsqueda tiene colas largas, es mejor muchos intentos cortos que uno largo.
const PRESUPUESTO_NODOS = 6000;
const INTENTOS = 150;

/** Generador pseudoaleatorio con semilla (mulberry32): mismas semillas, mismo resultado. */
function crearAzar(semilla) {
  let s = semilla >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function barajar(lista, azar) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

const clavePar = (i, j) => (i < j ? `${i}-${j}` : `${j}-${i}`);

/**
 * Plan de las rondas que faltan. Devuelve un arreglo de rondas (cada una, una lista
 * de duelos con índices de equipo) o null si no hay forma de completarlo.
 */
function buscarPlan({ n, macro, visitadas, vistos, nBases, permitirRepetidos, azar }) {
  let nodos = 0;

  function ronda(estado, profundidad) {
    const activos = [];
    for (let t = 0; t < n; t++) if (estado.visitadas[t].size < nBases) activos.push(t);
    if (activos.length === 0) return [];
    if (activos.length % 2 !== 0) return null;
    if (profundidad > nBases + 1) return null;

    const duelos = [];
    const emparejado = new Set();
    const basesUsadas = new Set();

    function opcionesDe(t) {
      const res = [];
      for (const u of activos) {
        if (u === t || emparejado.has(u) || macro[u] === macro[t]) continue;
        const repite = estado.vistos.has(clavePar(t, u));
        if (repite && !permitirRepetidos) continue;
        for (let b = 1; b <= nBases; b++) {
          if (basesUsadas.has(b) || estado.visitadas[t].has(b) || estado.visitadas[u].has(b)) continue;
          res.push({ u, b, repite });
        }
      }
      return res;
    }

    function construir() {
      if (++nodos > PRESUPUESTO_NODOS) return null;
      // Equipo sin emparejar con MENOS opciones (el más difícil primero).
      let mejor = null;
      let mejorOpc = null;
      for (const t of activos) {
        if (emparejado.has(t)) continue;
        const opc = opcionesDe(t);
        if (opc.length === 0) return null;
        if (mejorOpc === null || opc.length < mejorOpc.length) {
          mejor = t;
          mejorOpc = opc;
        }
      }
      if (mejor === null) {
        // Ronda completa: se aplica y se busca el resto del circuito.
        const nuevo = {
          visitadas: estado.visitadas.map((s) => new Set(s)),
          vistos: new Set(estado.vistos),
        };
        for (const d of duelos) {
          nuevo.visitadas[d.a].add(d.base);
          nuevo.visitadas[d.b].add(d.base);
          nuevo.vistos.add(clavePar(d.a, d.b));
        }
        const resto = ronda(nuevo, profundidad + 1);
        return resto ? [duelos.map((d) => ({ ...d })), ...resto] : null;
      }

      const ordenadas = barajar(mejorOpc, azar).sort((x, y) => Number(x.repite) - Number(y.repite));
      for (const o of ordenadas) {
        duelos.push({ a: mejor, b: o.u, base: o.b });
        emparejado.add(mejor);
        emparejado.add(o.u);
        basesUsadas.add(o.b);
        const r = construir();
        if (r) return r;
        duelos.pop();
        emparejado.delete(mejor);
        emparejado.delete(o.u);
        basesUsadas.delete(o.b);
        if (nodos > PRESUPUESTO_NODOS) return null;
      }
      return null;
    }

    return construir();
  }

  return ronda({ visitadas, vistos }, 0);
}

/**
 * Propone los duelos de la PRÓXIMA ronda. `semilla` permite "volver a sortear".
 */
export function planificarRonda({ equipos, historial = [], bases = [1, 2, 3, 4, 5, 6], semilla }) {
  const n = equipos.length;
  if (n < 2) return { ok: false, mensaje: 'Faltan sub-equipos de Gymkana por crear.' };

  const indice = new Map(equipos.map((e, i) => [e.id, i]));
  const macro = equipos.map((e) => e.macro);
  const visitadas = equipos.map(() => new Set());
  const vistos = new Set();
  for (const h of historial) {
    const i = indice.get(h.a);
    const j = indice.get(h.b);
    if (i === undefined || j === undefined) continue;
    visitadas[i].add(Number(h.base));
    visitadas[j].add(Number(h.base));
    vistos.add(clavePar(i, j));
  }

  const nBases = bases.length;
  if (visitadas.every((s) => s.size >= nBases)) {
    return { ok: false, mensaje: 'Todos los sub-equipos ya pasaron por las bases.' };
  }

  const base = semilla ?? Math.floor(Math.random() * 1e9);
  let plan = null;
  let permitidos = false;
  // Primero el plan perfecto (sin repetir rivales); si no existe, el que menos repita.
  for (const permitirRepetidos of [false, true]) {
    for (let intento = 0; intento < INTENTOS && !plan; intento++) {
      plan = buscarPlan({
        n,
        macro,
        visitadas,
        vistos,
        nBases,
        permitirRepetidos,
        azar: crearAzar(base + intento * 7919),
      });
    }
    if (plan) {
      permitidos = permitirRepetidos;
      break;
    }
  }

  if (!plan || plan.length === 0) {
    return {
      ok: false,
      mensaje:
        'No hay un cruce posible que respete las reglas (sin repetir base ni enfrentar al mismo color). Revisa el historial o reinicia el circuito.',
    };
  }

  const duelos = plan[0].map((d) => ({ base: d.base, a: equipos[d.a].id, b: equipos[d.b].id }));
  const repetidos = plan[0].filter((d) => vistos.has(clavePar(d.a, d.b))).length;
  return {
    ok: true,
    duelos: duelos.sort((x, y) => x.base - y.base),
    repetidos,
    planPerfecto: !permitidos,
    rondasRestantes: plan.length,
  };
}

/** Rondas que faltan para que todos pasen por las `nBases` bases (cota por equipo). */
export function bases_por_equipo(historial, equipoId) {
  return new Set(
    historial.filter((h) => h.a === equipoId || h.b === equipoId).map((h) => Number(h.base))
  );
}

/** ¿Ya todos los sub-equipos visitaron las `nBases` bases? */
export function circuitoCompleto(equipos, historial, nBases = 6) {
  return (
    equipos.length > 0 && equipos.every((e) => bases_por_equipo(historial, e.id).size >= nBases)
  );
}
