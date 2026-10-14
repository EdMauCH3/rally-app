import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, CheckCircle2, Eye, Loader2, Lock, RotateCcw, Sparkles, Trash2 } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import {
  CONFIG_DEFECTO,
  ETAPAS,
  agruparPorFecha,
  equiposActivos,
  estadoEtapas,
  etiquetaGrupoDe,
} from '../../../services/torneoLogica';
import {
  confirmarEtapa,
  descartarBorrador,
  eliminarPartido,
  generarEtapa,
  guardarConfigEtapa,
  listarClasificados,
  reiniciarEtapa,
} from '../../../services/torneoService';
import FilaPartidoAdmin from './FilaPartidoAdmin';
import { ModalCruce, ModalMover } from './ModalesPartidoAdmin';

// Formatos que el Director Técnico puede elegir por grupo / por etapa.
const FORMATOS = {
  liga1: { formato: 'liga', vueltas: 1, texto: 'Todos contra todos (solo ida)' },
  liga2: { formato: 'liga', vueltas: 2, texto: 'Todos contra todos (ida y vuelta)' },
  elim: { formato: 'eliminatoria', vueltas: 1, texto: 'Eliminación directa (llave)' },
};

function claveDeFormato(cfg) {
  if (cfg?.formato === 'eliminatoria') return 'elim';
  return Number(cfg?.vueltas) === 2 ? 'liga2' : 'liga1';
}

function opcionesParaGrupo(tamano) {
  if (tamano <= 1) return [];
  if (tamano === 2) {
    return [
      { id: 'elim', texto: 'Llave: 1 partido (ida)' },
      { id: 'liga2', texto: 'Ida y vuelta (2 partidos)' },
    ];
  }
  return [
    { id: 'liga1', texto: FORMATOS.liga1.texto },
    { id: 'liga2', texto: FORMATOS.liga2.texto },
    { id: 'elim', texto: FORMATOS.elim.texto },
  ];
}

const configDe = (etapas, id) => ({
  ...CONFIG_DEFECTO[id],
  ...(etapas.find((e) => e.etapa === id)?.config ?? {}),
});

function minutosDe(cfg) {
  return String(Math.round((cfg.duracion_segundos ?? 600) / 60));
}

function Chip({ children, clase }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${clase}`}>{children}</span>;
}

export default function EtapasAdmin({ equipos, partidos, borradores, etapas, onCambio }) {
  const { showToast } = useToast();
  const estado = useMemo(() => estadoEtapas([...partidos, ...borradores]), [partidos, borradores]);
  const activos = useMemo(() => equiposActivos(equipos), [equipos]);
  const [trabajando, setTrabajando] = useState(false);
  const [modal, setModal] = useState(null); // { tipo, partido }
  const etapaBorrador = ETAPAS.find((e) => estado[e.id].borrador)?.id ?? null;

  async function ejecutar(fn, mensajeOk) {
    setTrabajando(true);
    try {
      const r = await fn();
      if (mensajeOk) showToast(typeof mensajeOk === 'function' ? mensajeOk(r) : mensajeOk, 'success');
      onCambio();
      return r;
    } catch (err) {
      showToast(err.message ?? 'No se pudo completar la acción', 'error');
      return null;
    } finally {
      setTrabajando(false);
    }
  }

  async function generar(id, config, textoSalto) {
    if (textoSalto && !window.confirm(textoSalto)) return;
    setTrabajando(true);
    try {
      await guardarConfigEtapa(id, config);
      const r = await generarEtapa(id);
      showToast(`Vista previa lista: ${r.partidos} partidos en ${r.ultima_fecha ? 'hasta la fecha ' + r.ultima_fecha : 'el calendario'}`, 'success');
      (r.advertencias ?? []).forEach((a) => showToast(a, 'warning'));
      onCambio();
    } catch (err) {
      showToast(err.message ?? 'No se pudo generar la etapa', 'error');
    } finally {
      setTrabajando(false);
    }
  }

  function confirmar(id) {
    const e = ETAPAS.find((x) => x.id === id);
    if (!window.confirm(`Se confirma «${e.nombre}»: el público la verá y se podrá arbitrar. ¿Confirmar?`)) return;
    ejecutar(() => confirmarEtapa(id), `${e.nombre} confirmada`);
  }

  function reiniciar(id) {
    const e = ETAPAS.find((x) => x.id === id);
    const afectados = ETAPAS.filter((x) => x.id >= id && estado[x.id].confirmada).map((x) => x.nombre).join(', ');
    if (
      !window.confirm(
        `Reiniciar «${e.nombre}» borra sus partidos y también los de las etapas siguientes (${afectados || 'ninguna'}), con sus goles, tarjetas y penales.\n\nLos equipos y las plantillas se conservan. ¿Continuar?`
      )
    )
      return;
    ejecutar(() => reiniciarEtapa(id), 'Etapa reiniciada');
  }

  const eliminarDelBorrador = (p) => {
    if (!window.confirm(`¿Quitar el partido ${p.partido_num} de la vista previa?`)) return;
    ejecutar(() => eliminarPartido(p.id), 'Partido quitado');
  };

  const acciones = {
    onCruce: (p) => setModal({ tipo: 'cruce', partido: p }),
    onMover: (p) => setModal({ tipo: 'mover', partido: p }),
    onEliminar: eliminarDelBorrador,
  };

  // Disponibilidad de cada etapa
  const e1 = estado[1];
  const e2 = estado[2];
  const liga2 = partidos.some((p) => p.etapa === 2 && p.fase === 'cuadrangular');
  const bloqueo = {
    1: activos.length < 2 ? 'Necesitas al menos 2 equipos activos.' : activos.some((e) => !e.grupo) ? 'Primero asigna un grupo a cada equipo (pestaña Grupos).' : null,
    2: e1.confirmada && !e1.completa ? `Faltan ${e1.total - e1.finalizados} partidos de la Etapa 1 por finalizar.` : e1.borrador ? 'Confirma o descarta primero la vista previa de la Etapa 1.' : null,
    3: !e2.confirmada
      ? 'Se habilita cuando la Etapa 2 sea un todos contra todos y termine.'
      : !liga2
        ? 'La Etapa 2 fueron playoffs: la final ya está incluida, no hace falta una Etapa 3.'
        : !e2.completa
          ? `Faltan ${e2.total - e2.finalizados} partidos de la Etapa 2 por finalizar.`
          : null,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="glass-card p-4 text-sm text-slate-300">
        El torneo se arma <strong className="text-white">etapa por etapa</strong>. En cada una eliges el formato, generas una{' '}
        <strong className="text-white">vista previa</strong> (solo la ves tú), la ajustas si hace falta y la{' '}
        <strong className="text-white">confirmas</strong>. Las etapas siguientes se arman con los resultados reales.
      </div>

      {ETAPAS.map((et) => {
        const st = estado[et.id];
        const aviso = bloqueo[et.id];
        const hayOtroBorrador = etapaBorrador && etapaBorrador !== et.id;
        return (
          <section key={et.id} className="glass-card overflow-hidden">
            <header className="flex flex-wrap items-center gap-3 border-b border-white/5 bg-white/[0.04] px-4 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-slate-900">{et.id}</span>
              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-white">{et.nombre}</h2>
              </div>
              {st.confirmada ? (
                st.completa ? (
                  <Chip clase="bg-emerald-500/20 text-emerald-300">Terminada</Chip>
                ) : (
                  <Chip clase="bg-sky-500/20 text-sky-300">En juego · {st.finalizados}/{st.total}</Chip>
                )
              ) : st.borrador ? (
                <Chip clase="bg-amber-500/20 text-amber-300">Vista previa</Chip>
              ) : aviso ? (
                <Chip clase="bg-slate-500/20 text-slate-400">Bloqueada</Chip>
              ) : (
                <Chip clase="bg-slate-500/20 text-slate-300">Sin generar</Chip>
              )}
            </header>

            <div className="space-y-4 p-4">
              {/* CONFIRMADA */}
              {st.confirmada && (
                <div className="space-y-3">
                  <p className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    {st.total} partidos confirmados · {st.finalizados} finalizados. Los ves y los ajustas en la pestaña Calendario.
                  </p>
                  <button type="button" onClick={() => reiniciar(et.id)} disabled={trabajando} className="btn-danger !py-2 text-sm">
                    <RotateCcw size={15} /> Reiniciar desde esta etapa
                  </button>
                </div>
              )}

              {/* VISTA PREVIA */}
              {!st.confirmada && st.borrador && (
                <VistaPrevia
                  etapa={et.id}
                  borradores={borradores.filter((p) => p.etapa === et.id)}
                  equipos={equipos}
                  acciones={acciones}
                  trabajando={trabajando}
                  onConfirmar={() => confirmar(et.id)}
                  onDescartar={() => ejecutar(() => descartarBorrador(), 'Vista previa descartada')}
                />
              )}

              {/* CONFIGURACION */}
              {!st.confirmada && !st.borrador && (
                <>
                  {aviso && (
                    <p className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-400">
                      <Lock size={15} className="mt-0.5 shrink-0" /> {aviso}
                    </p>
                  )}
                  {!aviso && hayOtroBorrador && (
                    <p className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
                      <AlertTriangle size={15} className="mt-0.5 shrink-0" /> Hay una vista previa de otra etapa. Generar ésta la descarta.
                    </p>
                  )}
                  {!aviso && et.id === 1 && (
                    <Editor1 equipos={equipos} cfg={configDe(etapas, 1)} trabajando={trabajando} onGenerar={(c) => generar(1, c)} />
                  )}
                  {!aviso && et.id === 2 && (
                    <Editor2
                      cfg={configDe(etapas, 2)}
                      trabajando={trabajando}
                      sinGrupos={!e1.confirmada}
                      activos={activos.length}
                      onGenerar={(c) =>
                        generar(
                          2,
                          c,
                          e1.confirmada
                            ? null
                            : 'No generaste la Etapa 1: jugarán todos los equipos activos en esta etapa, sin fase de grupos. ¿Continuar?'
                        )
                      }
                      listo={e1.completa}
                    />
                  )}
                  {!aviso && et.id === 3 && (
                    <Editor3 cfg={configDe(etapas, 3)} trabajando={trabajando} onGenerar={(c) => generar(3, c)} />
                  )}
                </>
              )}
            </div>
          </section>
        );
      })}

      {modal?.tipo === 'cruce' && (
        <ModalCruce
          partido={modal.partido}
          equipos={equipos}
          onCerrar={() => setModal(null)}
          onHecho={() => {
            setModal(null);
            onCambio();
          }}
        />
      )}
      {modal?.tipo === 'mover' && (
        <ModalMover
          partido={modal.partido}
          onCerrar={() => setModal(null)}
          onHecho={() => {
            setModal(null);
            onCambio();
          }}
        />
      )}
    </div>
  );
}

function VistaPrevia({ etapa, borradores, equipos, acciones, trabajando, onConfirmar, onDescartar }) {
  const fechas = agruparPorFecha(borradores);
  return (
    <div className="space-y-4">
      <p className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
        <Eye size={16} className="mt-0.5 shrink-0" />
        <span>
          Esta es la <strong>vista previa</strong> de {borradores.length} partidos. Solo tú la ves. Cambia cruces, mueve horarios o quita partidos
          y, cuando esté bien, confírmala.
        </span>
      </p>
      {fechas.map(({ fecha, partidos: lista }) => (
        <div key={fecha} className="space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Fecha {fecha}</p>
          {lista.map((p) => (
            <div key={p.id} className="space-y-1">
              {p.grupo && <p className="px-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">{etiquetaGrupoDe(p.grupo, equipos)} · {p.ronda_nombre}</p>}
              {!p.grupo && <p className="px-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">{p.ronda_nombre}</p>}
              <FilaPartidoAdmin p={p} acciones={acciones} />
            </div>
          ))}
        </div>
      ))}
      <div className="grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={onDescartar} disabled={trabajando} className="btn-secondary disabled:opacity-50">
          <Trash2 size={16} /> Descartar y cambiar el formato
        </button>
        <button type="button" onClick={onConfirmar} disabled={trabajando} className="btn-primary disabled:opacity-50" data-etapa={etapa}>
          {trabajando ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
          Confirmar etapa
        </button>
      </div>
    </div>
  );
}

function CampoDuracion({ valor, onChange }) {
  return (
    <div>
      <label className="field-label">Duración de cada partido (minutos)</label>
      <input type="number" min="1" max="300" value={valor} onChange={(e) => onChange(e.target.value)} className="field max-w-[8rem]" />
      <p className="mt-1 text-xs text-slate-500">El árbitro puede ajustarla en cada partido. El suplementario de la Final es de 2 × 5 min.</p>
    </div>
  );
}

function aSegundos(min) {
  const m = Number(min);
  return Number.isFinite(m) && m > 0 && m <= 300 ? Math.round(m * 60) : null;
}

/** Etapa 1: formato por grupo. */
function Editor1({ equipos, cfg, trabajando, onGenerar }) {
  const { showToast } = useToast();
  const activos = equiposActivos(equipos);
  const grupos = useMemo(() => {
    const mapa = new Map();
    for (const e of activos) if (e.grupo) mapa.set(e.grupo, (mapa.get(e.grupo) ?? 0) + 1);
    return [...mapa.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([letra, tamano]) => ({ letra, tamano }));
  }, [activos]);

  const inicial = useMemo(() => {
    const r = {};
    for (const g of grupos) {
      const ov = cfg.grupos?.[g.letra] ?? {};
      const base = { formato: ov.formato ?? cfg.formato, vueltas: ov.vueltas ?? cfg.vueltas };
      let clave = claveDeFormato(base);
      if (g.tamano === 2 && clave === 'liga1') clave = 'elim';
      r[g.letra] = { clave, clasifican: Math.min(Number(ov.clasifican ?? cfg.clasifican ?? 1), Math.max(1, g.tamano - 1)) };
    }
    return r;
  }, [grupos, cfg]);

  const [porGrupo, setPorGrupo] = useState(inicial);
  const [minutos, setMinutos] = useState(minutosDe(cfg));
  const claveInicial = JSON.stringify(inicial);
  useEffect(() => {
    setPorGrupo(inicial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveInicial]);

  const clasifican = grupos.reduce((acc, g) => {
    const f = porGrupo[g.letra];
    if (!f || g.tamano <= 1) return acc + g.tamano;
    return acc + (f.clave === 'elim' ? 1 : Math.min(f.clasifican, g.tamano));
  }, 0);

  function aplicarATodos(clave) {
    setPorGrupo((prev) => {
      const sig = { ...prev };
      for (const g of grupos) {
        if (g.tamano <= 1) continue;
        const validas = opcionesParaGrupo(g.tamano).map((o) => o.id);
        sig[g.letra] = { ...sig[g.letra], clave: validas.includes(clave) ? clave : g.tamano === 2 ? (clave === 'liga1' ? 'elim' : 'elim') : clave };
      }
      return sig;
    });
  }

  function generar() {
    const seg = aSegundos(minutos);
    if (!seg) return showToast('La duración debe estar entre 1 y 300 minutos', 'error');
    const gruposCfg = {};
    for (const g of grupos) {
      if (g.tamano <= 1) continue;
      const f = porGrupo[g.letra];
      const fm = FORMATOS[f.clave];
      gruposCfg[g.letra] = {
        formato: fm.formato,
        vueltas: fm.vueltas,
        clasifican: Math.min(Math.max(1, f.clasifican), Math.max(1, g.tamano - 1)),
      };
    }
    onGenerar({ ...cfg, duracion_segundos: seg, grupos: gruposCfg });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        Elige el formato de cada grupo. Un grupo de 2 puede ser una llave (un partido) o ida y vuelta; de 3 o más, todos contra todos o
        eliminación directa.
      </p>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => aplicarATodos('liga1')} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/20">
          Todos contra todos en todos
        </button>
        <button type="button" onClick={() => aplicarATodos('elim')} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/20">
          Eliminación directa en todos
        </button>
      </div>

      <div className="space-y-2">
        {grupos.map((g) => {
          const f = porGrupo[g.letra] ?? { clave: 'liga1', clasifican: 1 };
          const opciones = opcionesParaGrupo(g.tamano);
          return (
            <div key={g.letra} className="glass-row flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5">
              <div className="min-w-0 basis-40 flex-1">
                <p className="truncate text-sm font-bold text-white">{etiquetaGrupoDe(g.letra, activos.filter((e) => e.grupo === g.letra))}</p>
                <p className="text-[11px] text-slate-500">{g.tamano} {g.tamano === 1 ? 'equipo' : 'equipos'}</p>
              </div>
              {g.tamano <= 1 ? (
                <span className="text-xs text-emerald-300">Pasa directo a la siguiente etapa</span>
              ) : (
                <>
                  <select
                    aria-label={`Formato del grupo ${g.letra}`}
                    value={f.clave}
                    onChange={(e) => setPorGrupo((p) => ({ ...p, [g.letra]: { ...f, clave: e.target.value } }))}
                    className="field !h-9 !w-auto min-w-[11rem] !py-0 text-xs"
                  >
                    {opciones.map((o) => (
                      <option key={o.id} value={o.id}>{o.texto}</option>
                    ))}
                  </select>
                  {f.clave === 'elim' ? (
                    <span className="text-[11px] text-slate-500">Avanza el ganador</span>
                  ) : (
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      Clasifican
                      <select
                        value={f.clasifican}
                        onChange={(e) => setPorGrupo((p) => ({ ...p, [g.letra]: { ...f, clasifican: Number(e.target.value) } }))}
                        className="field !h-9 !w-16 !px-2 !py-0 text-xs"
                      >
                        {Array.from({ length: Math.min(g.tamano - 1, 4) }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </label>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-400">
        Pasarán <strong className="text-white">{clasifican}</strong> equipos a la Etapa 2.
      </p>

      <CampoDuracion valor={minutos} onChange={setMinutos} />

      <button type="button" onClick={generar} disabled={trabajando || grupos.length === 0} className="btn-primary w-full disabled:opacity-50">
        {trabajando ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
        Generar vista previa de la Etapa 1
      </button>
    </div>
  );
}

/** Etapa 2: cuadrangular / todos contra todos, o playoffs. */
function Editor2({ cfg, trabajando, onGenerar, sinGrupos, activos, listo }) {
  const { showToast } = useToast();
  const [clave, setClave] = useState(claveDeFormato(cfg));
  const [tercer, setTercer] = useState(cfg.tercer_puesto !== false);
  const [minutos, setMinutos] = useState(minutosDe(cfg));
  const [clasificados, setClasificados] = useState(null);

  useEffect(() => {
    let vivo = true;
    listarClasificados()
      .then((r) => vivo && setClasificados(r.length))
      .catch(() => vivo && setClasificados(null));
    return () => {
      vivo = false;
    };
  }, [listo]);

  const n = clasificados ?? (sinGrupos ? activos : null);
  const descripcion =
    clave === 'elim'
      ? n === 2
        ? 'Los 2 juegan la final directa.'
        : n === 3
          ? 'Con 3 equipos el mejor sembrado pasa directo a la final y los otros dos juegan semifinal.'
          : n === 4
            ? 'Semifinales y final' + (tercer ? ' (más el partido por el tercer puesto).' : '.')
            : n
              ? `Llave de eliminación directa para ${n} equipos, con pases libres si hace falta${tercer ? ' y tercer puesto.' : '.'}`
              : 'Llave de eliminación directa hasta la final.'
      : 'Todos contra todos entre los clasificados; después, tercer puesto y final (Etapa 3).';

  function generar() {
    const seg = aSegundos(minutos);
    if (!seg) return showToast('La duración debe estar entre 1 y 300 minutos', 'error');
    const fm = FORMATOS[clave];
    onGenerar({ formato: fm.formato, vueltas: fm.vueltas, tercer_puesto: tercer, duracion_segundos: seg });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        {sinGrupos
          ? 'No hay Etapa 1: jugarán todos los equipos activos.'
          : n != null
            ? `Clasificados de la Etapa 1: ${n} equipos.`
            : 'Los clasificados salen de la Etapa 1.'}
      </p>
      <div>
        <label className="field-label">Formato</label>
        <select value={clave} onChange={(e) => setClave(e.target.value)} className="field">
          <option value="liga1">Cuadrangular / todos contra todos (solo ida)</option>
          <option value="liga2">Cuadrangular / todos contra todos (ida y vuelta)</option>
          <option value="elim">Playoffs: directo a semifinales y final (eliminación directa)</option>
        </select>
        <p className="mt-1 text-xs text-slate-500">{descripcion}</p>
        {clave !== 'elim' && n != null && n < 3 && (
          <p className="mt-1 text-xs text-amber-400">El todos contra todos necesita al menos 3 clasificados: elige playoffs.</p>
        )}
      </div>
      {clave === 'elim' && (
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-200">
          <input type="checkbox" checked={tercer} onChange={(e) => setTercer(e.target.checked)} />
          Jugar el partido por el tercer puesto
        </label>
      )}
      <CampoDuracion valor={minutos} onChange={setMinutos} />
      <button type="button" onClick={generar} disabled={trabajando} className="btn-primary w-full disabled:opacity-50">
        {trabajando ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
        Generar vista previa de la Etapa 2
      </button>
    </div>
  );
}

/** Etapa 3: tercer puesto y final (después de un todos contra todos). */
function Editor3({ cfg, trabajando, onGenerar }) {
  const { showToast } = useToast();
  const [tercer, setTercer] = useState(cfg.tercer_puesto !== false);
  const [minutos, setMinutos] = useState(minutosDe(cfg));

  function generar() {
    const seg = aSegundos(minutos);
    if (!seg) return showToast('La duración debe estar entre 1 y 300 minutos', 'error');
    onGenerar({ tercer_puesto: tercer, duracion_segundos: seg });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        Con la tabla final de la Etapa 2: 1.º y 2.º juegan la Gran Final; 3.º y 4.º, el tercer puesto. Si un equipo se retiró, se salta.
      </p>
      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-200">
        <input type="checkbox" checked={tercer} onChange={(e) => setTercer(e.target.checked)} />
        Jugar el partido por el tercer puesto
      </label>
      <CampoDuracion valor={minutos} onChange={setMinutos} />
      <button type="button" onClick={generar} disabled={trabajando} className="btn-primary w-full disabled:opacity-50">
        {trabajando ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
        Generar vista previa de la Etapa 3
      </button>
    </div>
  );
}
