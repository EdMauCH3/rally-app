import { useState } from 'react';
import { AlertTriangle, Dices, Loader2, Plus, RotateCcw, Sparkles } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import TablaFase from '../../torneo/TablaFase';
import {
  agruparPorFecha,
  avisosFixture,
  combinarFechaHora,
  etiquetaGrupoDe,
  nombreRonda,
  resumenProgreso,
} from '../../../services/torneoLogica';
import { eliminarPartido, programarPartido, reiniciarFixture, repetirSorteo } from '../../../services/torneoService';
import { reabrirPartido } from '../../../services/torneoProService';
import FilaPartidoAdmin from './FilaPartidoAdmin';
import { ModalAgregar, ModalCruce, ModalMover, ModalWO } from './ModalesPartidoAdmin';

// Día del evento (Rally Interoratorios 2026). Solo se programa la hora.
const DIA_EVENTO = '2026-10-17';

/**
 * Calendario del torneo (Admin y Director Técnico): todos los partidos confirmados, con W.O.,
 * cambio de cruces, mover/eliminar/reabrir, clasificación en vivo y reinicio total.
 */
export default function CalendarioAdmin({ equipos, partidos, tablas, onCambio }) {
  const { showToast } = useToast();
  const [modal, setModal] = useState(null); // { tipo, partido? }
  const [paso, setPaso] = useState(0);
  const [texto, setTexto] = useState('');
  const [procesando, setProcesando] = useState(false);

  const progreso = resumenProgreso(partidos);
  const avisos = avisosFixture(partidos, tablas, equipos);
  const fechas = agruparPorFecha(partidos);
  const adicionales = partidos
    .filter((p) => p.fase === 'adicional')
    .sort((a, b) => (a.hora_programada ?? '9').localeCompare(b.hora_programada ?? '9') || a.partido_num - b.partido_num);
  const hayCampeonato = partidos.some((p) => p.fase !== 'adicional');
  const cerrar = () => setModal(null);
  const hecho = () => {
    setModal(null);
    onCambio();
  };

  async function handleHora(partido, valor) {
    const nueva = valor ? combinarFechaHora(DIA_EVENTO, valor) : null;
    const actual = partido.hora_programada ? new Date(partido.hora_programada).toISOString() : null;
    if (nueva === actual) return;
    try {
      await programarPartido(partido.id, nueva);
      onCambio();
    } catch (err) {
      showToast(err.message ?? 'No se pudo guardar la hora', 'error');
    }
  }

  async function accion(fn, ok) {
    try {
      await fn();
      showToast(ok, 'success');
      onCambio();
    } catch (err) {
      showToast(err.message ?? 'No se pudo completar la acción', 'error');
    }
  }

  const acciones = {
    onWO: (p) => setModal({ tipo: 'wo', partido: p }),
    onCruce: (p) => setModal({ tipo: 'cruce', partido: p }),
    onMover: (p) => setModal({ tipo: 'mover', partido: p }),
    onEliminar: (p) => {
      if (!window.confirm(`¿Eliminar el partido ${p.partido_num} del calendario?`)) return;
      accion(() => eliminarPartido(p.id), 'Partido eliminado');
    },
    onReabrir: (p) => {
      const aviso = p.walkover
        ? 'Se quita el W.O. y el partido vuelve a quedar pendiente (no se volverá a declarar solo).'
        : 'El partido vuelve a estar abierto y los cruces que dependen de él se recalculan.';
      if (!window.confirm(`¿Reabrir el partido ${p.partido_num}? ${aviso}`)) return;
      accion(() => reabrirPartido(p.id), 'Partido reabierto');
    },
  };

  async function handleReiniciar() {
    setProcesando(true);
    try {
      await reiniciarFixture();
      showToast('Torneo reiniciado. Los equipos y plantillas se conservan.', 'success');
      setPaso(0);
      setTexto('');
      onCambio();
    } catch (err) {
      showToast(err.message ?? 'No se pudo reiniciar el torneo', 'error');
    } finally {
      setProcesando(false);
    }
  }

  async function handleSorteo(filas) {
    if (!window.confirm('Se vuelve a sortear el desempate entre estos equipos. ¿Continuar?')) return;
    try {
      await repetirSorteo(filas.map((f) => f.equipo_torneo_id));
      showToast('Sorteo repetido', 'success');
      onCambio();
    } catch (err) {
      showToast(err.message ?? 'No se pudo repetir el sorteo', 'error');
    }
  }

  const letras = [...new Set(tablas.filter((t) => t.fase === 'grupos').map((t) => t.grupo))].sort();
  const filasCuad = tablas.filter((t) => t.fase === 'cuadrangular');
  const empatesSorteo = (filas) => filas.filter((f) => f.desempate === 'sorteo');

  const seccionAdicionales = (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-bold text-white">
          <Sparkles size={16} className="text-violet-300" /> Partidos adicionales
        </h2>
        <button type="button" onClick={() => setModal({ tipo: 'agregar', modo: 'adicional' })} className="btn-secondary !px-3 !py-2 text-xs">
          <Plus size={14} /> Partido adicional
        </button>
      </div>
      <p className="text-xs text-slate-500">
        Suman puntos (y rojas) al Macro-equipo de cada lado, pero no cuentan para las tablas ni las llaves del campeonato. El público los ve
        en la pestaña Historial.
      </p>
      {adicionales.length === 0 ? (
        <p className="glass-card p-3 text-center text-xs text-slate-500">Todavía no hay partidos adicionales.</p>
      ) : (
        adicionales.map((p) => (
          <div key={p.id} className="space-y-1">
            <p className="px-1 text-[10px] font-bold uppercase tracking-wide text-violet-300/80">{nombreRonda(p)}</p>
            <FilaPartidoAdmin p={p} onHora={handleHora} acciones={acciones} />
          </div>
        ))
      )}
    </section>
  );

  if (!hayCampeonato) {
    return (
      <div className="glass-card mx-auto max-w-xl space-y-3 p-6 text-center">
        <p className="font-bold text-white">Todavía no hay partidos confirmados</p>
        <p className="text-sm text-slate-400">
          Arma los grupos (pestaña Grupos) y genera y confirma la Etapa 1 (pestaña Etapas). Aquí verás el calendario completo.
        </p>
        <button type="button" onClick={() => setModal({ tipo: 'agregar', modo: 'campeonato' })} className="btn-secondary mx-auto">
          <Plus size={16} /> Agregar un partido a mano
        </button>
        <div className="space-y-3 border-t border-white/10 pt-4 text-left">{seccionAdicionales}</div>
        {modal?.tipo === 'agregar' && <ModalAgregar equipos={equipos} modoInicial={modal.modo} onCerrar={cerrar} onHecho={hecho} />}
        {modal?.tipo === 'mover' && <ModalMover partido={modal.partido} onCerrar={cerrar} onHecho={hecho} />}
        {modal?.tipo === 'wo' && <ModalWO partido={modal.partido} onCerrar={cerrar} onHecho={hecho} />}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="glass-card grid grid-cols-4 gap-2 p-4 text-center">
        <div>
          <p className="text-2xl font-black text-white">{progreso.finalizados}</p>
          <p className="text-[11px] text-slate-400">Finalizados</p>
        </div>
        <div>
          <p className="text-2xl font-black text-red-300">{progreso.enVivo}</p>
          <p className="text-[11px] text-slate-400">En vivo</p>
        </div>
        <div>
          <p className="text-2xl font-black text-slate-300">{progreso.pendientes}</p>
          <p className="text-[11px] text-slate-400">Pendientes</p>
        </div>
        <div>
          <p className="text-2xl font-black text-fuchsia-300">{progreso.walkovers}</p>
          <p className="text-[11px] text-slate-400">W.O.</p>
        </div>
      </div>

      {avisos.length > 0 && (
        <div className="space-y-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="flex items-center gap-2 font-semibold text-amber-300">
            <AlertTriangle size={18} /> Revisa esto
          </p>
          {avisos.map((a) => (
            <p key={a.texto} className="text-sm text-amber-200/90">
              {a.texto}
            </p>
          ))}
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-bold text-white">Calendario</h2>
          <button type="button" onClick={() => setModal({ tipo: 'agregar', modo: 'campeonato' })} className="btn-secondary !px-3 !py-2 text-xs">
            <Plus size={14} /> Agregar partido
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Hora opcional de cada partido (día del evento: 17 de octubre); se muestra al público. Con W.O. declaras una derrota técnica, con
          Cruce cambias los equipos de un partido que no empezó.
        </p>
        {fechas.map(({ fecha, partidos: lista }) => (
          <div key={fecha} className="space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Fecha {fecha}</p>
            {lista.map((p) => (
              <div key={p.id} className="space-y-1">
                <p className="px-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  {p.grupo && p.fase !== 'cuadrangular' ? `${etiquetaGrupoDe(p.grupo, equipos)} · ` : ''}
                  {nombreRonda(p)}
                </p>
                <FilaPartidoAdmin p={p} onHora={handleHora} acciones={acciones} />
              </div>
            ))}
          </div>
        ))}
      </section>

      {seccionAdicionales}

      {(letras.length > 0 || filasCuad.length > 0) && (
        <section className="space-y-3">
          <h2 className="font-bold text-white">Clasificación actual</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {letras.map((letra) => {
              const filas = tablas.filter((t) => t.fase === 'grupos' && t.grupo === letra);
              const sorteos = empatesSorteo(filas);
              return (
                <div key={letra} className="glass-card space-y-2 p-3">
                  <p className="text-sm font-bold text-white">{etiquetaGrupoDe(letra, equipos.filter((e) => e.grupo === letra))}</p>
                  <TablaFase filas={filas} equipos={equipos} resaltar={filas[0]?.completo ? 1 : 0} compacta />
                  {sorteos.length > 0 && (
                    <button type="button" onClick={() => handleSorteo(filas)} className="flex items-center gap-1.5 text-xs text-amber-300 underline underline-offset-2">
                      <Dices size={14} /> Se definió por sorteo · repetir
                    </button>
                  )}
                </div>
              );
            })}
            {filasCuad.length > 0 && (
              <div className="glass-card space-y-2 p-3">
                <p className="text-sm font-bold text-white">Cuadrangular</p>
                <TablaFase filas={filasCuad} equipos={equipos} resaltar={0} compacta />
                {empatesSorteo(filasCuad).length > 0 && (
                  <button type="button" onClick={() => handleSorteo(filasCuad)} className="flex items-center gap-1.5 text-xs text-amber-300 underline underline-offset-2">
                    <Dices size={14} /> Se definió por sorteo · repetir
                  </button>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="space-y-3 rounded-2xl border border-red-500/25 bg-red-500/[0.05] p-5">
        <p className="flex items-center gap-2 font-bold text-red-300">
          <RotateCcw size={18} /> Reiniciar todo el torneo
        </p>
        <p className="text-sm text-red-300/80">
          Borra todos los partidos con sus goles, tarjetas y penales. Los equipos, grupos y plantillas se conservan. Para rehacer solo
          una etapa usa la pestaña Etapas.
        </p>
        {paso === 0 ? (
          <button type="button" onClick={() => setPaso(1)} className="btn-danger">
            Reiniciar torneo
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-red-200">
              Escribe <strong>REINICIAR</strong> para confirmar.
            </p>
            <input value={texto} onChange={(e) => setTexto(e.target.value)} className="field" placeholder="REINICIAR" />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setPaso(0);
                  setTexto('');
                }}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={texto.trim().toUpperCase() !== 'REINICIAR' || procesando}
                onClick={handleReiniciar}
                className="btn-danger flex-1 disabled:opacity-40"
              >
                {procesando && <Loader2 className="animate-spin" size={16} />}
                Confirmar
              </button>
            </div>
          </div>
        )}
      </section>

      {modal?.tipo === 'wo' && <ModalWO partido={modal.partido} onCerrar={cerrar} onHecho={hecho} />}
      {modal?.tipo === 'cruce' && <ModalCruce partido={modal.partido} equipos={equipos} onCerrar={cerrar} onHecho={hecho} />}
      {modal?.tipo === 'mover' && <ModalMover partido={modal.partido} onCerrar={cerrar} onHecho={hecho} />}
      {modal?.tipo === 'agregar' && <ModalAgregar equipos={equipos} modoInicial={modal.modo} onCerrar={cerrar} onHecho={hecho} />}
    </div>
  );
}
