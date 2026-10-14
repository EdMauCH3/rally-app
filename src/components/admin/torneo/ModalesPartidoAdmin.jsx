import { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { combinarFechaHora, nombreLado, nombreRonda } from '../../../services/torneoLogica';
import { useCanchas } from '../../../hooks/useCanchas';
import { agregarAdicional } from '../../../services/canchasService';
import {
  agregarPartido,
  declararWO,
  editarCruce,
  moverPartido,
  retirarEquipo,
} from '../../../services/torneoService';

function Carcasa({ titulo, subtitulo, onCerrar, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
      <div className="glass-card max-h-[92vh] w-full max-w-md space-y-4 overflow-y-auto rounded-b-none p-5 sm:rounded-b-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-bold text-white">{titulo}</h3>
            {subtitulo && <p className="text-xs text-slate-400">{subtitulo}</p>}
          </div>
          <button type="button" onClick={onCerrar} className="p-2 text-slate-400 hover:text-white" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Pie({ onCerrar, guardando, textoOk, peligro = false }) {
  return (
    <div className="flex gap-2 pt-1">
      <button type="button" onClick={onCerrar} className="btn-secondary flex-1">
        Cancelar
      </button>
      <button type="submit" disabled={guardando} className={`${peligro ? 'btn-danger' : 'btn-primary'} flex-1 disabled:opacity-50`}>
        {guardando && <Loader2 className="animate-spin" size={16} />}
        {textoOk}
      </button>
    </div>
  );
}

/** Declarar W.O.: quién gana y con qué marcador técnico (3-0 por defecto, editable). */
export function ModalWO({ partido, onCerrar, onHecho }) {
  const { showToast } = useToast();
  const [ganador, setGanador] = useState('');
  const [gg, setGg] = useState('3');
  const [gp, setGp] = useState('0');
  const [motivo, setMotivo] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    if (!ganador) return showToast('Elige qué equipo gana por W.O.', 'error');
    const g = Number(gg);
    const q = Number(gp);
    if (!Number.isInteger(g) || !Number.isInteger(q) || g <= q || g < 1 || q < 0) {
      return showToast('El marcador debe darle la victoria al ganador (ej. 3-0)', 'error');
    }
    setGuardando(true);
    try {
      await declararWO({ partidoId: partido.id, ganadorId: ganador, golesGanador: g, golesPerdedor: q, motivo: motivo.trim() || null });
      showToast('W.O. registrado', 'success');
      onHecho();
    } catch (err) {
      showToast(err.message ?? 'No se pudo declarar el W.O.', 'error');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Carcasa titulo="Declarar W.O." subtitulo={`Partido ${partido.partido_num} · ${nombreRonda(partido)}`} onCerrar={onCerrar}>
      <form onSubmit={enviar} className="space-y-4">
        <p className="text-sm text-slate-300">¿Qué equipo se presenta y gana el partido?</p>
        <div className="grid gap-2">
          {['a', 'b'].map((lado) => (
            <label
              key={lado}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-3 py-3 text-sm font-semibold transition ${
                ganador === partido[`equipo_${lado}_id`] ? 'border-fuchsia-400 bg-fuchsia-500/10 text-white' : 'border-white/10 text-slate-300'
              }`}
            >
              <input
                type="radio"
                name="ganador"
                checked={ganador === partido[`equipo_${lado}_id`]}
                onChange={() => setGanador(partido[`equipo_${lado}_id`])}
              />
              <span className="min-w-0 break-words">{nombreLado(partido, lado)}</span>
            </label>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Goles del ganador</label>
            <input type="number" min="1" max="30" value={gg} onChange={(e) => setGg(e.target.value)} className="field" />
          </div>
          <div>
            <label className="field-label">Goles del otro</label>
            <input type="number" min="0" max="30" value={gp} onChange={(e) => setGp(e.target.value)} className="field" />
          </div>
        </div>
        <div>
          <label className="field-label">Motivo (opcional)</label>
          <input value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={120} placeholder="Ej. No se presentó a tiempo" className="field" />
        </div>
        <p className="text-xs text-slate-500">
          El ganador suma 3 puntos y los goles técnicos. Los partidos ya jugados no se tocan. Puedes reabrirlo después.
        </p>
        <Pie onCerrar={onCerrar} guardando={guardando} textoOk="Declarar W.O." />
      </form>
    </Carcasa>
  );
}

/** Cambiar los equipos de un partido que aún no empieza. */
export function ModalCruce({ partido, equipos, onCerrar, onHecho }) {
  const { showToast } = useToast();
  const [a, setA] = useState(partido.equipo_a_id ?? '');
  const [b, setB] = useState(partido.equipo_b_id ?? '');
  const [guardando, setGuardando] = useState(false);
  const candidatos = equipos.filter(
    (e) => e.estado !== 'retirado' && (partido.fase !== 'grupos' || e.grupo === partido.grupo)
  );

  async function enviar(e) {
    e.preventDefault();
    if (!a || !b || a === b) return showToast('Elige dos equipos distintos', 'error');
    setGuardando(true);
    try {
      await editarCruce(partido.id, a, b);
      showToast('Cruce actualizado', 'success');
      onHecho();
    } catch (err) {
      showToast(err.message ?? 'No se pudo cambiar el cruce', 'error');
    } finally {
      setGuardando(false);
    }
  }

  const opciones = (
    <>
      <option value="">Elige un equipo…</option>
      {candidatos.map((e) => (
        <option key={e.id} value={e.id}>
          {e.nombre} · {e.macro_nombre}
        </option>
      ))}
    </>
  );

  return (
    <Carcasa titulo="Editar cruce" subtitulo={`Partido ${partido.partido_num} · ${nombreRonda(partido)}`} onCerrar={onCerrar}>
      <form onSubmit={enviar} className="space-y-4">
        <div>
          <label className="field-label">Equipo local</label>
          <select value={a} onChange={(e) => setA(e.target.value)} className="field">{opciones}</select>
        </div>
        <div>
          <label className="field-label">Equipo visitante</label>
          <select value={b} onChange={(e) => setB(e.target.value)} className="field">{opciones}</select>
        </div>
        {partido.fase === 'grupos' && (
          <p className="text-xs text-slate-500">En fase de grupos solo se pueden elegir equipos del Grupo {partido.grupo}.</p>
        )}
        <Pie onCerrar={onCerrar} guardando={guardando} textoOk="Guardar cruce" />
      </form>
    </Carcasa>
  );
}

/** Mover un partido a otra fecha / cancha (si el horario está ocupado, se intercambian). */
export function ModalMover({ partido, onCerrar, onHecho }) {
  const { showToast } = useToast();
  const [fecha, setFecha] = useState(String(partido.fecha_num ?? 1));
  const [cancha, setCancha] = useState(String(partido.cancha ?? 1));
  const [guardando, setGuardando] = useState(false);
  const { canchas } = useCanchas();
  const adicional = partido.fase === 'adicional';
  const opciones = canchas.filter((c) => c.activa || c.id === partido.cancha);

  async function enviar(e) {
    e.preventDefault();
    const f = adicional ? null : Number(fecha);
    if (!adicional && (!Number.isInteger(f) || f < 1 || f > 99)) return showToast('La fecha debe estar entre 1 y 99', 'error');
    setGuardando(true);
    try {
      await moverPartido(partido.id, f ?? partido.fecha_num ?? 1, Number(cancha));
      showToast('Partido movido', 'success');
      onHecho();
    } catch (err) {
      showToast(err.message ?? 'No se pudo mover el partido', 'error');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Carcasa titulo="Mover partido" subtitulo={`Partido ${partido.partido_num} · ${nombreRonda(partido)}`} onCerrar={onCerrar}>
      <form onSubmit={enviar} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {!adicional && (
            <div>
              <label className="field-label">Fecha</label>
              <input type="number" min="1" max="99" value={fecha} onChange={(e) => setFecha(e.target.value)} className="field" />
            </div>
          )}
          <div className={adicional ? 'col-span-2' : ''}>
            <label className="field-label">Lugar de juego</label>
            <select value={cancha} onChange={(e) => setCancha(e.target.value)} className="field">
              {opciones.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                  {c.activa ? '' : ' (desactivado)'}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Si ese lugar ya tiene un partido en esa fecha, se juegan uno tras otro (puedes ajustar la hora de cada uno).
        </p>
        <Pie onCerrar={onCerrar} guardando={guardando} textoOk="Mover" />
      </form>
    </Carcasa>
  );
}

/** Retirar un equipo del torneo (con W.O. automático a sus rivales, editable). */
export function ModalRetiro({ equipo, partidosPendientes = 0, onCerrar, onHecho }) {
  const { showToast } = useToast();
  const [motivo, setMotivo] = useState('');
  const [wo, setWo] = useState(true);
  const [goles, setGoles] = useState('3');
  const [guardando, setGuardando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    const g = Number(goles);
    if (wo && (!Number.isInteger(g) || g < 1 || g > 20)) return showToast('El marcador técnico debe estar entre 1 y 20', 'error');
    setGuardando(true);
    try {
      const r = await retirarEquipo({ equipoId: equipo.id, motivo: motivo.trim() || null, wo, goles: g });
      const partes = [`${equipo.nombre} fue retirado`];
      if (r?.partidos_wo) partes.push(`${r.partidos_wo} partido(s) por W.O.`);
      if (r?.partidos_pendientes) partes.push(`${r.partidos_pendientes} pendiente(s) por resolver`);
      if (r?.borrador_descartado) partes.push('la vista previa se descartó: vuelve a generarla');
      showToast(partes.join(' · '), 'success');
      onHecho();
    } catch (err) {
      showToast(err.message ?? 'No se pudo retirar el equipo', 'error');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Carcasa titulo={`Retirar a ${equipo.nombre}`} subtitulo={equipo.macro_nombre} onCerrar={onCerrar}>
      <form onSubmit={enviar} className="space-y-4">
        <p className="text-sm text-slate-300">
          Sus resultados ya jugados <strong className="text-white">se conservan</strong> (puntos, goles y tarjetas siguen sumando a su
          Macro-equipo). Los partidos que no ha jugado ({partidosPendientes}) se resuelven así:
        </p>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 p-3 text-sm text-slate-200">
          <input type="checkbox" checked={wo} onChange={(e) => setWo(e.target.checked)} className="mt-0.5" />
          <span>
            <strong className="text-white">W.O. automático:</strong> sus rivales ganan por marcador técnico. Si lo desmarcas, los
            partidos quedan pendientes para que los resuelvas a mano (W.O., cambiar el cruce o eliminarlos).
          </span>
        </label>
        {wo && (
          <div>
            <label className="field-label">Marcador técnico a favor del rival (goles)</label>
            <input type="number" min="1" max="20" value={goles} onChange={(e) => setGoles(e.target.value)} className="field max-w-[8rem]" />
          </div>
        )}
        <div>
          <label className="field-label">Motivo (opcional)</label>
          <input value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={120} placeholder="Ej. Lesiones, abandono, sanción" className="field" />
        </div>
        <Pie onCerrar={onCerrar} guardando={guardando} textoOk="Retirar equipo" peligro />
      </form>
    </Carcasa>
  );
}

/**
 * Agregar un partido a mano. Dos tipos:
 *  · Del campeonato: entra a las tablas y llaves (sirve para reestructurar el calendario).
 *  · Adicional: suma puntos (y rojas) al Macro-equipo de cada lado, pero NO cuenta para el campeonato.
 */
export function ModalAgregar({ equipos, onCerrar, onHecho, modoInicial = 'campeonato' }) {
  const { showToast } = useToast();
  const { activas } = useCanchas();
  const [modo, setModo] = useState(modoInicial);
  const [etapa, setEtapa] = useState('1');
  const [fase, setFase] = useState('grupos');
  const [grupo, setGrupo] = useState('');
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [nombre, setNombre] = useState('');
  const [cancha, setCancha] = useState('');
  const [hora, setHora] = useState('');
  const [minutos, setMinutos] = useState('10');
  const [guardando, setGuardando] = useState(false);

  const adicional = modo === 'adicional';
  const activos = equipos.filter((e) => e.estado !== 'retirado');
  const grupos = [...new Set(activos.map((e) => e.grupo).filter(Boolean))].sort();
  const candidatos = !adicional && fase === 'grupos' ? activos.filter((e) => e.grupo === grupo) : activos;
  const macroA = activos.find((e) => e.id === a)?.macro_equipo_id;
  const candidatosB = adicional && macroA ? candidatos.filter((e) => e.macro_equipo_id !== macroA) : candidatos;

  async function enviar(e) {
    e.preventDefault();
    if (!adicional && fase === 'grupos' && !grupo) return showToast('Elige el grupo', 'error');
    if (!a || !b || a === b) return showToast('Elige dos equipos distintos', 'error');
    setGuardando(true);
    try {
      if (adicional) {
        const min = Number(minutos);
        if (!Number.isInteger(min) || min < 1 || min > 120) {
          setGuardando(false);
          return showToast('La duración debe estar entre 1 y 120 minutos', 'error');
        }
        await agregarAdicional({
          equipoAId: a,
          equipoBId: b,
          nombre: nombre.trim() || null,
          cancha: cancha ? Number(cancha) : null,
          horaIso: hora ? combinarFechaHora('2026-10-17', hora) : null,
          minutos: min,
        });
        showToast('Partido adicional creado. Suma puntos a los Macro-equipos pero no cuenta para el campeonato.', 'success');
      } else {
        await agregarPartido({
          etapa: Number(etapa),
          fase,
          grupo: fase === 'grupos' ? grupo : null,
          equipoAId: a,
          equipoBId: b,
          nombre: nombre.trim() || null,
        });
        showToast('Partido agregado al final del calendario. Muévelo si quieres otro horario.', 'success');
      }
      onHecho();
    } catch (err) {
      showToast(err.message ?? 'No se pudo agregar el partido', 'error');
    } finally {
      setGuardando(false);
    }
  }

  const opciones = (lista) => (
    <>
      <option value="">Elige un equipo…</option>
      {lista.map((e) => (
        <option key={e.id} value={e.id}>
          {e.nombre} · {e.macro_nombre}
        </option>
      ))}
    </>
  );

  return (
    <Carcasa titulo="Agregar partido" subtitulo="Calendario a mano o partido adicional" onCerrar={onCerrar}>
      <form onSubmit={enviar} className="space-y-4">
        <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-white/5 p-1" role="tablist" aria-label="Tipo de partido">
          {[
            ['campeonato', 'Del campeonato'],
            ['adicional', 'Adicional'],
          ].map(([id, texto]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={modo === id}
              onClick={() => {
                setModo(id);
                setA('');
                setB('');
              }}
              className={`rounded-lg px-2 py-2 text-sm font-bold transition ${
                modo === id ? 'bg-white text-slate-900' : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              {texto}
            </button>
          ))}
        </div>
        <p className="rounded-lg bg-white/5 px-3 py-2 text-xs text-slate-300">
          {adicional
            ? 'Un partido extra (amistoso, revancha, desempate de ánimo…): los puntos y las rojas SÍ suman al Macro-equipo de cada lado, pero NO cuenta para las tablas, la clasificación ni las llaves del campeonato. Se ve en el Historial público.'
            : 'Entra a las tablas y llaves del campeonato. Úsalo para reestructurar el calendario.'}
        </p>

        {!adicional && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Etapa</label>
              <select value={etapa} onChange={(e) => setEtapa(e.target.value)} className="field">
                <option value="1">1 · Grupos</option>
                <option value="2">2 · Clasificatoria</option>
                <option value="3">3 · Finales</option>
              </select>
            </div>
            <div>
              <label className="field-label">Tipo</label>
              <select
                value={fase}
                onChange={(e) => {
                  setFase(e.target.value);
                  setA('');
                  setB('');
                }}
                className="field"
              >
                <option value="grupos">Fase de grupos</option>
                <option value="cuadrangular">Cuadrangular</option>
                <option value="eliminatoria">Eliminación directa</option>
                <option value="tercer_puesto">Tercer puesto</option>
                <option value="final">Gran final</option>
              </select>
            </div>
          </div>
        )}
        {!adicional && fase === 'grupos' && (
          <div>
            <label className="field-label">Grupo</label>
            <select
              value={grupo}
              onChange={(e) => {
                setGrupo(e.target.value);
                setA('');
                setB('');
              }}
              className="field"
            >
              <option value="">Elige el grupo…</option>
              {grupos.map((g) => (
                <option key={g} value={g}>Grupo {g}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="field-label">Equipo local</label>
          <select value={a} onChange={(e) => { setA(e.target.value); setB(''); }} className="field">{opciones(candidatos)}</select>
        </div>
        <div>
          <label className="field-label">Equipo visitante</label>
          <select value={b} onChange={(e) => setB(e.target.value)} className="field">{opciones(candidatosB)}</select>
        </div>
        <div>
          <label className="field-label">{adicional ? 'Nombre del partido (opcional)' : 'Nombre de la ronda (opcional)'}</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={60}
            placeholder={adicional ? 'Ej. Amistoso de revancha' : 'Ej. Repechaje'}
            className="field"
          />
        </div>
        {adicional && (
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3 sm:col-span-1">
              <label className="field-label">Lugar</label>
              <select value={cancha} onChange={(e) => setCancha(e.target.value)} className="field">
                <option value="">Automático</option>
                {activas.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="field-label">Hora (opc.)</label>
              <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="field" />
            </div>
            <div className="col-span-1">
              <label className="field-label">Minutos</label>
              <input type="number" min="1" max="120" value={minutos} onChange={(e) => setMinutos(e.target.value)} className="field" />
            </div>
          </div>
        )}
        <Pie onCerrar={onCerrar} guardando={guardando} textoOk="Agregar" />
      </form>
    </Carcasa>
  );
}
